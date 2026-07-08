import AppKit
import QuarryCore
import SwiftUI

private struct DiagramLayout {
  static let nodeSize = CGSize(width: 220, height: 140)
  static let cellSize = CGSize(width: 280, height: 190)

  let order: [DatabaseTable]
  let positions: [String: CGPoint]
  let canvasSize: CGSize

  init(diagram: DatabaseDiagram) {
    // cells; a real layout engine can replace this if diagrams get hairy.
    var adjacency: [String: [String]] = [:]
    for relationship in diagram.relationships where relationship.fromTable != relationship.toTable {
      adjacency[relationship.fromTable, default: []].append(relationship.toTable)
      adjacency[relationship.toTable, default: []].append(relationship.fromTable)
    }
    let byName = Dictionary(diagram.tables.map { ($0.name, $0) }, uniquingKeysWith: { first, _ in first })
    var ordered: [DatabaseTable] = []
    var visited = Set<String>()
    for table in diagram.tables where visited.insert(table.name).inserted {
      var queue = [table.name]
      while !queue.isEmpty {
        let name = queue.removeFirst()
        if let found = byName[name] {
          ordered.append(found)
        }
        for neighbor in adjacency[name, default: []] where visited.insert(neighbor).inserted {
          queue.append(neighbor)
        }
      }
    }
    order = ordered

    let columns = max(1, Int(ceil(Double(ordered.count).squareRoot())))
    let rows = max(1, Int(ceil(Double(ordered.count) / Double(columns))))
    var positions: [String: CGPoint] = [:]
    for (index, table) in ordered.enumerated() {
      positions[table.name] = CGPoint(
        x: (CGFloat(index % columns) + 0.5) * Self.cellSize.width,
        y: (CGFloat(index / columns) + 0.5) * Self.cellSize.height
      )
    }
    self.positions = positions
    canvasSize = CGSize(
      width: CGFloat(columns) * Self.cellSize.width,
      height: CGFloat(rows) * Self.cellSize.height
    )
  }

  /// Point on the node's border where a straight line toward `other` exits.
  static func borderPoint(from center: CGPoint, toward other: CGPoint) -> CGPoint {
    let dx = other.x - center.x
    let dy = other.y - center.y
    guard dx != 0 || dy != 0 else { return center }
    let tx = dx == 0 ? CGFloat.greatestFiniteMagnitude : abs(nodeSize.width / 2 / dx)
    let ty = dy == 0 ? CGFloat.greatestFiniteMagnitude : abs(nodeSize.height / 2 / dy)
    let t = min(tx, ty)
    return CGPoint(x: center.x + dx * t, y: center.y + dy * t)
  }
}

struct DiagramWorkspaceView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    let diagram = state.diagram

    VStack(alignment: .leading, spacing: 0) {
      HStack {
        Text(L("Diagram"))
          .font(.headline)

        Text(String(format: L("%d tables"), diagram?.tables.count ?? 0))
          .font(.caption)
          .foregroundStyle(Brand.textSecondary)

        Text(String(format: L("%d relationships"), diagram?.relationships.count ?? 0))
          .font(.caption)
          .foregroundStyle(Brand.textSecondary)

        Spacer()

        Button(action: state.loadDiagram) {
          Label(L("Refresh"), systemImage: "arrow.clockwise")
        }
      }
      .padding()

      Divider()

      if let diagram, !diagram.tables.isEmpty {
        let layout = DiagramLayout(diagram: diagram)
        ScrollView([.horizontal, .vertical]) {
          VStack(alignment: .leading, spacing: 18) {
            ZStack {
              edgeCanvas(diagram: diagram, layout: layout)
              ForEach(layout.order) { table in
                nodeCard(table: table, diagram: diagram)
                  .position(layout.positions[table.name] ?? .zero)
              }
            }
            .frame(width: layout.canvasSize.width, height: layout.canvasSize.height)

            if !diagram.relationships.isEmpty {
              DisclosureGroup(L("Relationships")) {
                VStack(alignment: .leading, spacing: 8) {
                  ForEach(diagram.relationships) { relationship in
                    Label(
                      "\(relationship.fromTable).\(relationship.fromColumn) -> \(relationship.toTable).\(relationship.toColumn)",
                      systemImage: "arrow.right"
                    )
                    .font(.caption.monospaced())
                  }
                }
                .padding(.top, 4)
              }
              .font(.headline)
            }
          }
          .padding()
        }
      } else {
        ContentUnavailableView(L("No tables"), systemImage: "point.3.connected.trianglepath.dotted")
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
    }
    .onAppear {
      if state.diagram == nil {
        state.loadDiagram()
      }
    }
  }

  private func edgeCanvas(diagram: DatabaseDiagram, layout: DiagramLayout) -> some View {
    Canvas { context, _ in
      let color = Brand.sun.opacity(0.7)
      for relationship in diagram.relationships {
        guard
          let fromCenter = layout.positions[relationship.fromTable],
          let toCenter = layout.positions[relationship.toTable]
        else { continue }

        if relationship.fromTable == relationship.toTable {
          // Self-reference: small loop at the node's top-right corner.
          let corner = CGPoint(
            x: fromCenter.x + DiagramLayout.nodeSize.width / 2,
            y: fromCenter.y - DiagramLayout.nodeSize.height / 2
          )
          let loop = Path(ellipseIn: CGRect(x: corner.x - 12, y: corner.y - 12, width: 24, height: 24))
          context.stroke(loop, with: .color(color), lineWidth: 1.5)
          continue
        }

        let start = DiagramLayout.borderPoint(from: fromCenter, toward: toCenter)
        let end = DiagramLayout.borderPoint(from: toCenter, toward: fromCenter)

        var line = Path()
        line.move(to: start)
        line.addLine(to: end)
        context.stroke(line, with: .color(color), lineWidth: 1.5)

        let angle = atan2(end.y - start.y, end.x - start.x)
        var arrow = Path()
        for side in [angle + .pi * 0.85, angle - .pi * 0.85] {
          arrow.move(to: end)
          arrow.addLine(to: CGPoint(x: end.x + 9 * cos(side), y: end.y + 9 * sin(side)))
        }
        context.stroke(arrow, with: .color(color), lineWidth: 1.5)
      }
    }
  }

  private func nodeCard(table: DatabaseTable, diagram: DatabaseDiagram) -> some View {
    VStack(alignment: .leading, spacing: 0) {
      // Brand: sun is the highlight fill; text on it stays primary/ink, never sun.
      Label(table.name, systemImage: "tablecells")
        .font(.headline)
        .lineLimit(1)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Brand.sun.opacity(0.15))

      VStack(alignment: .leading, spacing: 2) {
        let columns = relatedColumns(of: table.name, in: diagram)
        if columns.isEmpty {
          Text(L("No relationships"))
            .font(.caption)
            .foregroundStyle(Brand.textSecondary)
        } else {
          ForEach(columns, id: \.self) { column in
            Text(column)
              .font(.caption.monospaced())
              .lineLimit(1)
          }
        }
      }
      .padding(.horizontal, 10)
      .padding(.vertical, 6)

      Spacer(minLength: 0)
    }
    .frame(width: DiagramLayout.nodeSize.width, height: DiagramLayout.nodeSize.height, alignment: .top)
    .background(Brand.surface)
    .clipShape(RoundedRectangle(cornerRadius: 8))
    .overlay(
      RoundedRectangle(cornerRadius: 8)
        .strokeBorder(Color(nsColor: .separatorColor))
    )
  }

  private func relatedColumns(of table: String, in diagram: DatabaseDiagram) -> [String] {
    var seen = Set<String>()
    var columns: [String] = []
    for relationship in diagram.relationships {
      if relationship.fromTable == table, seen.insert(relationship.fromColumn).inserted {
        columns.append(relationship.fromColumn)
      }
      if relationship.toTable == table, seen.insert(relationship.toColumn).inserted {
        columns.append(relationship.toColumn)
      }
    }
    return Array(columns.prefix(6))
  }
}
