import AppKit
import QuarryCore
import SwiftUI

struct EditableTableWorkspaceView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    VStack(spacing: 0) {
      if let tableData = state.tableData {
        // Full labels when they fit, icon-only in narrow windows — avoids
        // truncated "Im…" buttons and the title hyphen-wrapping.
        ViewThatFits(in: .horizontal) {
          toolbarRow(tableData).labelStyle(.titleAndIcon)
          toolbarRow(tableData).labelStyle(.iconOnly)
        }
        .padding(.horizontal)
        .padding(.vertical, 10)

        Divider()

        if let schema = state.tableSchema {
          SchemaDetailsView(schema: schema)
          Divider()
        }

        DataTableView(
          columns: tableData.columns.map {
            .init(name: $0.name, tooltip: "\($0.type)\($0.isPrimaryKey ? " · primary key" : "")")
          },
          rows: tableData.rows.map(\.values),
          editable: tableData.editable,
          editableRows: tableData.rows.map { $0.rowID != nil },
          sortColumn: state.tableSortColumn,
          sortAscending: state.tableSortAscending,
          selectedRows: state.selectedRowIndexes,
          onEdit: { row, column, value in
            state.editCell(rowIndex: row, columnIndex: column, newValue: value)
          },
          onSort: { columnName, ascending in
            state.applySort(columnName: columnName, ascending: ascending)
          },
          onSelect: { indexes in
            state.setSelectedRows(indexes: indexes)
          }
        )
      } else {
        ContentUnavailableView(L("No Table Selected"), systemImage: "tablecells")
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      }

      if !state.pendingChanges.isEmpty {
        PendingChangesBar(state: state)
      }
    }
  }

  private func toolbarRow(_ tableData: TableData) -> some View {
    HStack {
      Text(tableData.table.name)
        .font(.headline)
        .lineLimit(1)
        .fixedSize()

          Text(String(format: L("%d rows"), tableData.rows.count))
            .font(.caption)
            .foregroundStyle(Brand.textSecondary)

          if !tableData.editable {
            Label(L("Read-only"), systemImage: "lock")
              .font(.caption)
              .foregroundStyle(Brand.textSecondary)
          }

          Spacer()

          TextField(L("Filter rows"), text: $state.tableFilter)
            .textFieldStyle(.roundedBorder)
            .frame(minWidth: 100, maxWidth: 220)
            .onSubmit(state.reloadFromFirstPage)

          Button(action: state.reloadFromFirstPage) {
            Label(L("Filter"), systemImage: "line.3.horizontal.decrease.circle")
          }

          if !state.tableFilter.isEmpty {
            Button {
              state.tableFilter = ""
              state.reloadFromFirstPage()
            } label: {
              Label(L("Clear"), systemImage: "xmark.circle")
            }
          }

          if state.tablePage > 0 || state.canLoadNextTablePage {
            Button(action: state.loadPreviousTablePage) {
              Image(systemName: "chevron.left")
            }
            .disabled(state.tablePage == 0)

            Text(String(format: L("Page %d"), state.tablePage + 1))
              .font(.caption)
              .foregroundStyle(Brand.textSecondary)

            Button(action: state.loadNextTablePage) {
              Image(systemName: "chevron.right")
            }
            .disabled(!state.canLoadNextTablePage)
          }

          if !state.selectedRowIDs.isEmpty {
            Text(String(format: L("%d selected"), state.selectedRowIDs.count))
              .font(.caption)
              .foregroundStyle(Brand.textSecondary)

            Button(action: state.bulkEditSelectedRows) {
              Label(L("Bulk Edit"), systemImage: "square.and.pencil")
            }

            Button(role: .destructive, action: state.deleteSelectedRows) {
              Label(L("Delete"), systemImage: "trash")
            }

            Button(action: state.clearSelectedRows) {
              Label(L("Clear"), systemImage: "xmark.circle")
            }
          }

          if tableData.editable {
            Button(action: state.addBlankRow) {
              Label(L("Add Row"), systemImage: "plus")
            }
          }

          Button(action: state.loadSelectedTable) {
            Label(L("Refresh"), systemImage: "arrow.clockwise")
          }

          Menu {
            ForEach(tableData.columns) { column in
              Button(column.name) {
                state.loadColumnStats(column: column.name)
              }
            }
          } label: {
            Label(L("Column Stats"), systemImage: "chart.bar")
          }
          .fixedSize()
          .popover(isPresented: Binding(
            get: { state.columnStatsColumn != nil },
            set: { if !$0 { state.clearColumnStats() } }
          )) {
            ColumnStatsView(column: state.columnStatsColumn ?? "", buckets: state.columnStats)
          }

          if tableData.editable {
            Button(action: state.importCSVPanel) {
              Label(L("Import CSV"), systemImage: "square.and.arrow.up")
            }
          }
    }
  }
}

struct SchemaDetailsView: View {
  let schema: TableSchema

  var body: some View {
    DisclosureGroup {
      HStack(alignment: .top, spacing: 18) {
        VStack(alignment: .leading, spacing: 6) {
          Label(L("Columns"), systemImage: "list.bullet.rectangle")
            .font(.caption.weight(.semibold))
          ForEach(schema.columns) { column in
            Text("\(column.name) \(column.type)\(column.isPrimaryKey ? " primary key" : "")")
              .font(.caption.monospaced())
              .lineLimit(1)
          }
        }

        VStack(alignment: .leading, spacing: 6) {
          Label(L("Indexes"), systemImage: "number")
            .font(.caption.weight(.semibold))
          if schema.indexes.isEmpty {
            Text(L("No indexes"))
              .font(.caption)
              .foregroundStyle(Brand.textSecondary)
          } else {
            ForEach(schema.indexes) { index in
              Text("\(index.name): \(index.columns.joined(separator: ", "))\(index.isUnique ? " unique" : "")")
                .font(.caption.monospaced())
                .lineLimit(1)
            }
          }
        }

        VStack(alignment: .leading, spacing: 6) {
          Label(L("Foreign Keys"), systemImage: "link")
            .font(.caption.weight(.semibold))
          if schema.foreignKeys.isEmpty {
            Text(L("No foreign keys"))
              .font(.caption)
              .foregroundStyle(Brand.textSecondary)
          } else {
            ForEach(schema.foreignKeys) { key in
              Text("\(key.fromColumn) -> \(key.table).\(key.toColumn)")
                .font(.caption.monospaced())
                .lineLimit(1)
            }
          }
        }

        if !schema.createSQL.isEmpty {
          VStack(alignment: .leading, spacing: 6) {
            Label(L("DDL"), systemImage: "doc.plaintext")
              .font(.caption.weight(.semibold))
            Text(schema.createSQL)
              .font(.caption.monospaced())
              .lineLimit(6)
          }
        }

        Spacer()
      }
      .padding(.top, 8)
    } label: {
      Text(L("Schema"))
        .font(.headline)
    }
    .padding(.horizontal)
    .padding(.vertical, 8)
  }
}

struct PendingChangesBar: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Label(String(format: L("%d pending changes"), state.pendingChanges.count), systemImage: "pencil.and.list.clipboard")
          .font(.headline)

        Spacer()

        Button(L("Discard"), role: .destructive, action: state.discardPendingChanges)
        Button(action: state.applyPendingChanges) {
          Label(L("Apply"), systemImage: "checkmark")
        }
        .buttonStyle(.brandProminent)
      }

      ChangeDiffPreview(changes: state.pendingChanges)
    }
    .padding()
    .background(.regularMaterial)
  }
}

struct ChangeDiffPreview: View {
  let changes: [TableCellChange]

  var body: some View {
    ScrollView([.horizontal, .vertical]) {
      Grid(alignment: .leading, horizontalSpacing: 0, verticalSpacing: 0) {
        GridRow {
          DiffCell(L("Row"), isHeader: true, width: 72)
          DiffCell(L("Column"), isHeader: true, width: 150)
          DiffCell(L("Before"), isHeader: true, width: 220)
          DiffCell(L("After"), isHeader: true, width: 220)
        }

        ForEach(changes) { change in
          GridRow {
            DiffCell(String(change.rowID), width: 72)
            DiffCell(change.columnName, width: 150)
            DiffCell(change.oldValue, width: 220)
            DiffCell(change.newValue, width: 220)
          }
        }
      }
    }
    .frame(maxHeight: 150)
  }
}

struct DiffCell: View {
  let text: String
  let isHeader: Bool
  let width: CGFloat

  init(_ text: String, isHeader: Bool = false, width: CGFloat) {
    self.text = text
    self.isHeader = isHeader
    self.width = width
  }

  var body: some View {
    Text(text)
      .font(isHeader ? .caption.weight(.semibold) : .caption.monospaced())
      .lineLimit(1)
      .truncationMode(.middle)
      .frame(width: width, height: isHeader ? 28 : 26, alignment: .leading)
      .padding(.horizontal, 8)
      .padding(.vertical, 4)
      .background(isHeader ? Brand.surface : Color.clear)
      .border(Color(nsColor: .separatorColor), width: 0.5)
  }
}

struct ColumnStatsView: View {
  let column: String
  let buckets: [ColumnDistributionBucket]

  private var total: Int { max(1, buckets.map(\.count).reduce(0, +)) }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Label(String(format: L("Top values of %@"), column), systemImage: "chart.bar")
        .font(.headline)

      if buckets.isEmpty {
        Text(L("No data."))
          .foregroundStyle(Brand.textSecondary)
      } else {
        ForEach(buckets) { bucket in
          HStack(spacing: 8) {
            Text(bucket.value.isEmpty ? "∅" : bucket.value)
              .font(.caption.monospaced())
              .lineLimit(1)
              .frame(width: 160, alignment: .leading)

            GeometryReader { geometry in
              RoundedRectangle(cornerRadius: 2)
                .fill(Brand.sun.opacity(0.6))
                .frame(width: geometry.size.width * CGFloat(bucket.count) / CGFloat(total))
            }
            .frame(height: 12)

            Text("\(bucket.count)")
              .font(.caption.monospaced())
              .foregroundStyle(Brand.textSecondary)
              .frame(width: 50, alignment: .trailing)
          }
        }
      }
    }
    .padding()
    .frame(width: 360)
  }
}
