import Foundation

public enum TableBulkEdit {
  public static func changes(
    tableData: TableData,
    rowIDs: Set<Int64>,
    columnName: String,
    newValue: String
  ) -> [TableCellChange] {
    guard
      tableData.editable,
      !rowIDs.isEmpty,
      let columnIndex = tableData.columns.firstIndex(where: { $0.name == columnName })
    else {
      return []
    }

    return tableData.rows.compactMap { row in
      guard
        let rowID = row.rowID,
        rowIDs.contains(rowID),
        row.values.indices.contains(columnIndex)
      else {
        return nil
      }

      let oldValue = row.values[columnIndex]
      guard oldValue != newValue else { return nil }

      return TableCellChange(
        tableName: tableData.table.name,
        rowID: rowID,
        columnName: columnName,
        oldValue: oldValue,
        newValue: newValue
      )
    }
  }
}
