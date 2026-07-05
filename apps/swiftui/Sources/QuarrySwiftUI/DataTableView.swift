import AppKit
import SwiftUI

// NSTableView-backed grid: real row reuse, native selection/sorting/editing.
// SwiftUI lazy stacks can't recycle rows inside a two-axis scroll view, which
// made large pages janky — this is the same architecture TablePlus/DB Browser use.
struct DataTableView: NSViewRepresentable {
  struct Column: Equatable {
    let name: String
    let tooltip: String
  }

  let columns: [Column]
  let rows: [[String]]
  var editable = false
  var editableRows: [Bool] = []
  var sortColumn: String?
  var sortAscending = true
  var selectedRows: Set<Int> = []
  var onEdit: ((_ row: Int, _ column: Int, _ value: String) -> Void)?
  var onSort: ((_ columnName: String, _ ascending: Bool) -> Void)?
  var onSelect: ((_ rows: Set<Int>) -> Void)?

  func makeCoordinator() -> Coordinator {
    Coordinator(self)
  }

  func makeNSView(context: Context) -> NSScrollView {
    let tableView = NSTableView()
    tableView.style = .plain
    tableView.usesAlternatingRowBackgroundColors = true
    tableView.allowsMultipleSelection = true
    tableView.allowsEmptySelection = true
    tableView.allowsColumnReordering = false
    tableView.rowHeight = 24
    tableView.columnAutoresizingStyle = .noColumnAutoresizing
    tableView.dataSource = context.coordinator
    tableView.delegate = context.coordinator

    let scrollView = NSScrollView()
    scrollView.documentView = tableView
    scrollView.hasVerticalScroller = true
    scrollView.hasHorizontalScroller = true
    scrollView.autohidesScrollers = true
    scrollView.drawsBackground = false

    context.coordinator.tableView = tableView
    return scrollView
  }

  func updateNSView(_ scrollView: NSScrollView, context: Context) {
    let coordinator = context.coordinator
    coordinator.parent = self

    guard let tableView = coordinator.tableView else { return }

    if coordinator.configuredColumns != columns {
      coordinator.configuredColumns = columns
      tableView.tableColumns.forEach(tableView.removeTableColumn)
      for (index, column) in columns.enumerated() {
        // Identify columns by position — query results can repeat names.
        let tableColumn = NSTableColumn(identifier: .init(String(index)))
        tableColumn.title = column.name
        tableColumn.headerToolTip = column.tooltip
        tableColumn.width = 150
        tableColumn.minWidth = 60
        tableColumn.sortDescriptorPrototype = NSSortDescriptor(key: column.name, ascending: true)
        tableView.addTableColumn(tableColumn)
      }
    }

    if coordinator.renderedRows != rows {
      coordinator.renderedRows = rows
      tableView.reloadData()
    }

    let sortDescriptor = sortColumn.map { NSSortDescriptor(key: $0, ascending: sortAscending) }
    if tableView.sortDescriptors.first?.key != sortDescriptor?.key
      || tableView.sortDescriptors.first?.ascending != sortDescriptor?.ascending {
      coordinator.suppressCallbacks = true
      tableView.sortDescriptors = sortDescriptor.map { [$0] } ?? []
      coordinator.suppressCallbacks = false
    }

    let selection = IndexSet(selectedRows.filter { $0 < rows.count })
    if tableView.selectedRowIndexes != selection {
      coordinator.suppressCallbacks = true
      tableView.selectRowIndexes(selection, byExtendingSelection: false)
      coordinator.suppressCallbacks = false
    }
  }

  final class Coordinator: NSObject, NSTableViewDataSource, NSTableViewDelegate, NSTextFieldDelegate {
    var parent: DataTableView
    weak var tableView: NSTableView?
    var configuredColumns: [Column] = []
    var renderedRows: [[String]] = []
    var suppressCallbacks = false

    init(_ parent: DataTableView) {
      self.parent = parent
    }

    func numberOfRows(in tableView: NSTableView) -> Int {
      renderedRows.count
    }

    func tableView(_ tableView: NSTableView, viewFor tableColumn: NSTableColumn?, row: Int) -> NSView? {
      guard let tableColumn, let columnIndex = Int(tableColumn.identifier.rawValue) else {
        return nil
      }

      let identifier = NSUserInterfaceItemIdentifier("cell")
      let cell: NSTableCellView
      if let reused = tableView.makeView(withIdentifier: identifier, owner: self) as? NSTableCellView {
        cell = reused
      } else {
        cell = NSTableCellView()
        cell.identifier = identifier
        let field = NSTextField()
        field.isBordered = false
        field.drawsBackground = false
        field.font = .monospacedSystemFont(ofSize: NSFont.smallSystemFontSize, weight: .regular)
        field.lineBreakMode = .byTruncatingTail
        field.translatesAutoresizingMaskIntoConstraints = false
        field.delegate = self
        cell.textField = field
        cell.addSubview(field)
        NSLayoutConstraint.activate([
          field.leadingAnchor.constraint(equalTo: cell.leadingAnchor, constant: 2),
          field.trailingAnchor.constraint(equalTo: cell.trailingAnchor, constant: -2),
          field.centerYAnchor.constraint(equalTo: cell.centerYAnchor),
        ])
      }

      guard let field = cell.textField else { return cell }
      field.stringValue = renderedRows.indices.contains(row) && renderedRows[row].indices.contains(columnIndex)
        ? renderedRows[row][columnIndex]
        : ""
      let rowEditable = parent.editableRows.indices.contains(row) ? parent.editableRows[row] : parent.editable
      field.isEditable = parent.editable && rowEditable
      field.isSelectable = true
      field.tag = row * 10_000 + columnIndex
      return cell
    }

    func controlTextDidEndEditing(_ notification: Notification) {
      guard let field = notification.object as? NSTextField, field.tag >= 0 else { return }
      let row = field.tag / 10_000
      let column = field.tag % 10_000
      guard
        renderedRows.indices.contains(row),
        renderedRows[row].indices.contains(column),
        renderedRows[row][column] != field.stringValue
      else {
        return
      }
      renderedRows[row][column] = field.stringValue
      parent.onEdit?(row, column, field.stringValue)
    }

    func tableView(_ tableView: NSTableView, sortDescriptorsDidChange oldDescriptors: [NSSortDescriptor]) {
      guard !suppressCallbacks, let descriptor = tableView.sortDescriptors.first, let key = descriptor.key else { return }
      parent.onSort?(key, descriptor.ascending)
    }

    func tableViewSelectionDidChange(_ notification: Notification) {
      guard !suppressCallbacks, let tableView else { return }
      parent.onSelect?(Set(tableView.selectedRowIndexes))
    }
  }
}
