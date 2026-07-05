import AppKit
import QuarryCore
import SwiftUI

struct EditableTableWorkspaceView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    VStack(spacing: 0) {
      if let tableData = state.tableData {
        HStack {
          Text(tableData.table.name)
            .font(.headline)

          Text(String(format: L("%d rows"), tableData.rows.count))
            .font(.caption)
            .foregroundStyle(.secondary)

          if !tableData.editable {
            Label(L("Read-only"), systemImage: "lock")
              .font(.caption)
              .foregroundStyle(.secondary)
          }

          Spacer()

          TextField(L("Filter rows"), text: $state.tableFilter)
            .textFieldStyle(.roundedBorder)
            .frame(width: 220)
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
              .foregroundStyle(.secondary)

            Button(action: state.loadNextTablePage) {
              Image(systemName: "chevron.right")
            }
            .disabled(!state.canLoadNextTablePage)
          }

          if !state.selectedRowIDs.isEmpty {
            Text(String(format: L("%d selected"), state.selectedRowIDs.count))
              .font(.caption)
              .foregroundStyle(.secondary)

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

          if tableData.editable {
            Button(action: state.importCSVPanel) {
              Label(L("Import CSV"), systemImage: "square.and.arrow.up")
            }
          }
        }
        .padding(.horizontal)
        .padding(.vertical, 10)

        Divider()

        if let schema = state.tableSchema {
          SchemaDetailsView(schema: schema)
          Divider()
        }

        EditableTableGrid(state: state, tableData: tableData)
      } else {
        ContentUnavailableView(L("No Table Selected"), systemImage: "tablecells")
      }

      if !state.pendingChanges.isEmpty {
        PendingChangesBar(state: state)
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
              .foregroundStyle(.secondary)
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
              .foregroundStyle(.secondary)
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

struct EditableTableGrid: View {
  @ObservedObject var state: QuarryAppState
  let tableData: TableData

  var body: some View {
    ScrollView([.horizontal, .vertical]) {
      Grid(alignment: .leading, horizontalSpacing: 0, verticalSpacing: 0) {
        GridRow {
          SelectionHeaderCell(state: state, tableData: tableData)
          ForEach(tableData.columns) { column in
            Button {
              state.sortBy(column)
            } label: {
              HeaderCell(
                column: column,
                isSorted: state.tableSortColumn == column.name,
                sortAscending: state.tableSortAscending
              )
            }
            .buttonStyle(.plain)
          }
        }

        ForEach(Array(tableData.rows.enumerated()), id: \.offset) { _, row in
          GridRow {
            if let rowID = row.rowID {
              RowActionsCell(state: state, rowID: rowID)
            } else {
              CellText("", isHeader: false)
                .frame(width: 76)
            }

            ForEach(tableData.columns) { column in
              if tableData.editable, let rowID = row.rowID {
                CellEditor(state: state, rowID: rowID, columnName: column.name)
              } else {
                let index = tableData.columns.firstIndex(of: column) ?? 0
                CellText(row.values.indices.contains(index) ? row.values[index] : "", isHeader: false)
              }
            }
          }
        }
      }
      .padding()
    }
  }
}

struct SelectionHeaderCell: View {
  @ObservedObject var state: QuarryAppState
  let tableData: TableData

  private var rowIDs: [Int64] {
    tableData.rows.compactMap(\.rowID)
  }

  private var allSelected: Bool {
    !rowIDs.isEmpty && rowIDs.allSatisfy { state.selectedRowIDs.contains($0) }
  }

  var body: some View {
    HStack {
      Toggle(
        "",
        isOn: Binding(
          get: { allSelected },
          set: { selected in
            if selected {
              state.selectAllVisibleRows()
            } else {
              state.clearSelectedRows()
            }
          }
        )
      )
      .labelsHidden()
      .disabled(rowIDs.isEmpty)
    }
    .frame(width: 76)
    .frame(minHeight: 42)
    .background(Color(nsColor: .controlBackgroundColor))
    .border(Color(nsColor: .separatorColor), width: 0.5)
  }
}

struct RowActionsCell: View {
  @ObservedObject var state: QuarryAppState
  let rowID: Int64

  var body: some View {
    HStack(spacing: 6) {
      Toggle(
        "",
        isOn: Binding(
          get: { state.isRowSelected(rowID) },
          set: { state.setRow(rowID, selected: $0) }
        )
      )
      .labelsHidden()

      Button(role: .destructive) {
        state.deleteRow(rowID)
      } label: {
        Image(systemName: "trash")
      }
      .buttonStyle(.borderless)
    }
    .frame(width: 76)
    .frame(minHeight: 28)
    .border(Color(nsColor: .separatorColor), width: 0.5)
  }
}

struct HeaderCell: View {
  let column: DatabaseColumn
  let isSorted: Bool
  let sortAscending: Bool

  init(column: DatabaseColumn, isSorted: Bool = false, sortAscending: Bool = true) {
    self.column = column
    self.isSorted = isSorted
    self.sortAscending = sortAscending
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      HStack(spacing: 4) {
        Text(column.name)
        if column.isPrimaryKey {
          Image(systemName: "key.fill")
            .foregroundStyle(Brand.sun)
        }
        if isSorted {
          Image(systemName: sortAscending ? "chevron.up" : "chevron.down")
            .foregroundStyle(.secondary)
        }
      }

      if !column.type.isEmpty {
        Text(column.type)
          .font(.caption2)
          .foregroundStyle(.secondary)
      }
    }
    .font(.caption.weight(.semibold))
    .lineLimit(1)
    .frame(minWidth: 120, maxWidth: 260, minHeight: 42, alignment: .leading)
    .padding(.horizontal, 8)
    .padding(.vertical, 6)
    .background(Color(nsColor: .controlBackgroundColor))
    .border(Color(nsColor: .separatorColor), width: 0.5)
  }
}

struct CellEditor: View {
  @ObservedObject var state: QuarryAppState
  let rowID: Int64
  let columnName: String

  var body: some View {
    TextField(
      "",
      text: Binding(
        get: { state.value(rowID: rowID, columnName: columnName) },
        set: { state.editCell(rowID: rowID, columnName: columnName, newValue: $0) }
      )
    )
    .textFieldStyle(.plain)
    .font(.system(.caption, design: .monospaced))
    .lineLimit(1)
    .frame(minWidth: 120, maxWidth: 260, minHeight: 28, alignment: .leading)
    .padding(.horizontal, 8)
    .padding(.vertical, 4)
    .border(Color(nsColor: .separatorColor), width: 0.5)
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
      .background(isHeader ? Color(nsColor: .controlBackgroundColor) : Color.clear)
      .border(Color(nsColor: .separatorColor), width: 0.5)
  }
}

struct CellText: View {
  let text: String
  let isHeader: Bool

  init(_ text: String, isHeader: Bool) {
    self.text = text
    self.isHeader = isHeader
  }

  var body: some View {
    Text(text)
      .font(isHeader ? .caption.weight(.semibold) : .system(.caption, design: .monospaced))
      .lineLimit(1)
      .truncationMode(.tail)
      .frame(minWidth: 120, maxWidth: 260, minHeight: isHeader ? 42 : 28, alignment: .leading)
      .padding(.horizontal, 8)
      .padding(.vertical, 6)
      .background(isHeader ? Color(nsColor: .controlBackgroundColor) : Color.clear)
      .border(Color(nsColor: .separatorColor), width: 0.5)
  }
}
