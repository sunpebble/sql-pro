import AppKit
import QuarryCore
import SwiftUI
import UniformTypeIdentifiers

struct TableCellPosition: Equatable {
  let row: Int
  let column: Int
}

enum WorkspaceMode: String, CaseIterable, Identifiable {
  case data = "Data"
  case query = "SQL"
  case search = "Search"
  case diagram = "Diagram"
  case ai = "AI"
  case maintenance = "Maintenance"
  case plugins = "Plugins"

  var id: String { rawValue }
}

private struct BulkEditInput {
  let columnName: String
  let value: String
}

final class DatabaseSession: Identifiable {
  let id: String
  let label: String
  let url: URL?
  let engine: any DatabaseEngine
  let tables: [DatabaseTable]
  let isEncrypted: Bool
  let serverProfile: ConnectionProfile?
  let tunnel: SSHTunnel?

  init(url: URL, engine: any DatabaseEngine, tables: [DatabaseTable], isEncrypted: Bool) {
    self.id = url.path
    self.label = url.lastPathComponent
    self.url = url
    self.engine = engine
    self.tables = tables
    self.isEncrypted = isEncrypted
    self.serverProfile = nil
    self.tunnel = nil
  }

  init(serverProfile: ConnectionProfile, engine: any DatabaseEngine, tables: [DatabaseTable], tunnel: SSHTunnel? = nil) {
    self.id = serverProfile.connectionKey
    self.label = "\(serverProfile.database)@\(serverProfile.host)"
    self.url = nil
    self.engine = engine
    self.tables = tables
    self.isEncrypted = false
    self.serverProfile = serverProfile
    self.tunnel = tunnel
  }
}

@MainActor
final class QuarryAppState: ObservableObject {
  @Published var sessions: [DatabaseSession] = []
  @Published var activeSessionID: String?
  @Published var recentDatabaseURLs: [URL] = []
  @Published var connectionProfiles: [ConnectionProfile] = []
  @Published var databaseURL: URL?
  @Published var tables: [DatabaseTable] = []
  @Published var selectedTable: DatabaseTable?
  @Published var tableData: TableData?
  @Published var tableSchema: TableSchema?
  @Published var tableFilter = ""
  @Published var tablePage = 0
  @Published var editingCell: TableCellPosition?
  @Published var tableSortColumn: String?
  @Published var tableSortAscending = true
  @Published var diagram: DatabaseDiagram?
  @Published var queryText = ""
  @Published var result: QueryResult?
  @Published var queryPlan: [QueryPlanStep] = []
  @Published var searchText = ""
  @Published var searchMatches: [DatabaseSearchMatch] = []
  @Published var pendingChanges: [TableCellChange] = []
  @Published var selectedRowIDs: Set<Int64> = []
  @Published var queryHistory: [QueryEntry] = []
  @Published var savedQueries: [QueryEntry] = []
  @Published var querySearch = ""
  @Published var aiSettings = AISettings()
  @Published var aiRequest = ""
  @Published var aiResponse = ""
  @Published var aiBusy = false
  @Published var databaseInfo: [DatabaseInfoItem] = []
  @Published var maintenanceMessages: [String] = []
  @Published var plugins: [InstalledPlugin] = []
  @Published var enabledPluginIDs: Set<String> = []
  @Published var workspaceMode: WorkspaceMode = .data
  @Published var errorMessage: String?

  @Published var pageSize: Int {
    didSet {
      UserDefaults.standard.set(pageSize, forKey: pageSizeDefaultsKey)
      if oldValue != pageSize, selectedTable != nil {
        reloadFromFirstPage()
      }
    }
  }

  private var engine: (any DatabaseEngine)?
  private var savedTableData: TableData?
  private let pageSizeDefaultsKey = "quarry.swiftui.pageSize"
  private var previewLimit: Int { pageSize }
  private let recentDefaultsKey = "quarry.swiftui.recentDatabases"
  private let connectionProfilesDefaultsKey = "quarry.swiftui.connectionProfiles"
  private let queryHistoryDefaultsKey = "quarry.swiftui.queryHistory"
  private let savedQueriesDefaultsKey = "quarry.swiftui.savedQueries"
  private let aiEndpointDefaultsKey = "quarry.swiftui.aiEndpoint"
  private let aiModelDefaultsKey = "quarry.swiftui.aiModel"
  private let enabledPluginsDefaultsKey = "quarry.swiftui.enabledPlugins"
  private let aiClient = OpenAICompatibleClient()

  var canExportCSV: Bool {
    if workspaceMode == .query {
      return result != nil
    }
    return tableData != nil
  }

  private var sqliteDatabase: SQLiteDatabase? {
    engine as? SQLiteDatabase
  }

  var activeSessionIsSQLite: Bool {
    engine is SQLiteDatabase
  }

  private func requireSQLite() -> SQLiteDatabase? {
    guard let engine else {
      errorMessage = L("Open a database first.")
      return nil
    }
    guard let sqlite = engine as? SQLiteDatabase else {
      errorMessage = L("This action is only available for SQLite databases.")
      return nil
    }
    return sqlite
  }

  init() {
    let storedPageSize = UserDefaults.standard.integer(forKey: "quarry.swiftui.pageSize")
    pageSize = storedPageSize > 0 ? storedPageSize : 100
    recentDatabaseURLs = UserDefaults.standard
      .stringArray(forKey: recentDefaultsKey)?
      .map(URL.init(fileURLWithPath:)) ?? []
    connectionProfiles = Self.loadConnectionProfiles(key: connectionProfilesDefaultsKey)
    queryHistory = Self.loadQueries(key: queryHistoryDefaultsKey)
    savedQueries = Self.loadQueries(key: savedQueriesDefaultsKey)
    aiSettings.endpoint = UserDefaults.standard.string(forKey: aiEndpointDefaultsKey) ?? aiSettings.endpoint
    aiSettings.model = UserDefaults.standard.string(forKey: aiModelDefaultsKey) ?? aiSettings.model
    enabledPluginIDs = Set(UserDefaults.standard.stringArray(forKey: enabledPluginsDefaultsKey) ?? [])
    loadPlugins()
  }

  func createDatabasePanel() {
    let panel = NSSavePanel()
    panel.allowedContentTypes = Self.databaseTypes
    panel.nameFieldStringValue = "database.sqlite"

    guard panel.runModal() == .OK, let url = panel.url else { return }
    try? FileManager.default.removeItem(at: url)
    openDatabase(url)
  }

  func createDemoDatabasePanel() {
    let panel = NSSavePanel()
    panel.allowedContentTypes = Self.databaseTypes
    panel.nameFieldStringValue = "quarry-demo.sqlite"

    guard panel.runModal() == .OK, let url = panel.url else { return }

    do {
      _ = try DemoDatabase.create(at: url)
      openDatabase(url)
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func openDatabasePanel() {
    let panel = NSOpenPanel()
    panel.canChooseDirectories = false
    panel.canChooseFiles = true
    panel.allowsMultipleSelection = false
    panel.allowedContentTypes = Self.databaseTypes

    if panel.runModal() == .OK, let url = panel.url {
      openDatabase(url)
    }
  }

  func openEncryptedDatabasePanel() {
    let panel = NSOpenPanel()
    panel.canChooseDirectories = false
    panel.canChooseFiles = true
    panel.allowsMultipleSelection = false
    panel.allowedContentTypes = Self.databaseTypes

    guard panel.runModal() == .OK, let url = panel.url else { return }
    guard let password = askPassword(title: L("Open Encrypted Database")) else { return }
    openDatabase(url, password: password)
  }

  func openDatabase(_ url: URL, password: String? = nil) {
    do {
      let database = try SQLiteDatabase(url: url, readOnly: false, password: password)
      let tables = try database.listTables()
      let session = DatabaseSession(
        url: url,
        engine: database,
        tables: tables,
        isEncrypted: password?.isEmpty == false
      )

      sessions.removeAll { $0.id == session.id }
      sessions.append(session)
      activate(session)
      remember(url)
    } catch SQLiteDatabaseError.passwordRequired {
      guard let password = askPassword(title: L("Open Encrypted Database")) else { return }
      openDatabase(url, password: password)
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func connectToServerPanel() {
    guard let input = askServerConnection() else { return }
    connectToServer(input.profile, password: input.password)
  }

  // ponytail: engine calls run on the main thread; move to a background executor if
  // remote queries prove slow enough to freeze the UI.
  func connectToServer(_ profile: ConnectionProfile, password: String? = nil) {
    do {
      var tunnel: SSHTunnel?
      var host = profile.host
      var port = profile.port
      if !profile.sshHost.isEmpty {
        let activeTunnel = try SSHTunnel(
          sshHost: profile.sshHost,
          sshUser: profile.sshUser.isEmpty ? NSUserName() : profile.sshUser,
          remoteHost: profile.host,
          remotePort: profile.port
        )
        tunnel = activeTunnel
        host = "127.0.0.1"
        port = activeTunnel.localPort
      }

      let engine: any DatabaseEngine
      switch profile.kind {
      case .sqlite:
        openDatabase(URL(fileURLWithPath: profile.path))
        return
      case .postgres:
        engine = try PostgresEngine(
          host: host,
          port: port,
          database: profile.database,
          user: profile.user,
          password: password ?? ""
        )
      case .mysql:
        engine = try MySQLEngine(
          host: host,
          port: port,
          database: profile.database,
          user: profile.user,
          password: password ?? ""
        )
      }

      let tables = try engine.listTables()
      let session = DatabaseSession(serverProfile: profile, engine: engine, tables: tables, tunnel: tunnel)
      sessions.removeAll { $0.id == session.id }
      sessions.append(session)
      activate(session)
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func openRecentDatabase(_ url: URL) {
    if FileManager.default.fileExists(atPath: url.path) {
      openDatabase(url)
    } else {
      errorMessage = L("Database file no longer exists.")
    }
  }

  func openProfile(_ profile: ConnectionProfile) {
    if profile.kind != .sqlite {
      guard let password = askPassword(title: String(format: L("Connect to %@"), profile.name)) else { return }
      connectToServer(profile, password: password)
      connectionProfiles = ConnectionProfiles.markingOpened(profile, in: connectionProfiles)
      Self.saveConnectionProfiles(connectionProfiles, key: connectionProfilesDefaultsKey)
      return
    }

    let url = URL(fileURLWithPath: profile.path)
    guard FileManager.default.fileExists(atPath: url.path) else {
      errorMessage = L("Database file no longer exists.")
      return
    }

    let password = profile.isEncrypted ? askPassword(title: String(format: L("Open %@"), profile.name)) : nil
    if profile.isEncrypted, password == nil {
      return
    }

    openDatabase(url, password: password)
    connectionProfiles = ConnectionProfiles.markingOpened(profile, in: connectionProfiles)
    Self.saveConnectionProfiles(connectionProfiles, key: connectionProfilesDefaultsKey)
  }

  func saveCurrentConnectionProfile() {
    guard let activeSession = sessions.first(where: { $0.id == activeSessionID }) else {
      errorMessage = L("Open a database first.")
      return
    }

    let defaultName = activeSession.url?.deletingPathExtension().lastPathComponent ?? activeSession.label
    guard let name = askText(title: L("Save Connection Profile"), defaultValue: defaultName) else {
      return
    }
    let resolvedName = name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? defaultName : name

    let profile: ConnectionProfile
    if let serverProfile = activeSession.serverProfile {
      profile = ConnectionProfile(
        name: resolvedName,
        path: "",
        isEncrypted: false,
        kind: serverProfile.kind,
        host: serverProfile.host,
        port: serverProfile.port,
        database: serverProfile.database,
        user: serverProfile.user,
        sshHost: serverProfile.sshHost,
        sshUser: serverProfile.sshUser
      )
    } else if let url = activeSession.url {
      profile = ConnectionProfile(
        name: resolvedName,
        path: url.path,
        isEncrypted: activeSession.isEncrypted
      )
    } else {
      return
    }

    connectionProfiles = ConnectionProfiles.saving(profile, in: connectionProfiles)
    Self.saveConnectionProfiles(connectionProfiles, key: connectionProfilesDefaultsKey)
  }

  func deleteConnectionProfile(_ profile: ConnectionProfile) {
    connectionProfiles.removeAll { $0.id == profile.id }
    Self.saveConnectionProfiles(connectionProfiles, key: connectionProfilesDefaultsKey)
  }

  func closeSession(_ session: DatabaseSession) {
    sessions.removeAll { $0.id == session.id }
    session.engine.close()
    session.tunnel?.close()
    guard session.id == activeSessionID else { return }

    if let next = sessions.last {
      activate(next)
    } else {
      engine = nil
      databaseURL = nil
      tables = []
      activeSessionID = nil
      resetWorkspace()
    }
  }

  func closeActiveSession() {
    guard let session = sessions.first(where: { $0.id == activeSessionID }) else { return }
    closeSession(session)
  }

  var hasActiveDatabase: Bool {
    activeSessionID != nil
  }

  var activeSessionLabel: String? {
    sessions.first(where: { $0.id == activeSessionID })?.label
  }

  func activate(_ session: DatabaseSession) {
    engine = session.engine
    databaseURL = session.url
    tables = session.tables
    activeSessionID = session.id
    resetWorkspace()

    if let firstTable = session.tables.first {
      queryText = "select * from \(quotedIdentifier(firstTable.name)) limit \(previewLimit)"
      selectTable(firstTable)
    }
  }

  private func resetWorkspace() {
      selectedTable = nil
      tableData = nil
      tableSchema = nil
      tableFilter = ""
      tablePage = 0
      tableSortColumn = nil
      tableSortAscending = true
      diagram = nil
      savedTableData = nil
      result = nil
      queryPlan = []
      searchText = ""
      searchMatches = []
      pendingChanges = []
      selectedRowIDs = []
      databaseInfo = []
      maintenanceMessages = []
      queryText = tables.first.map { "select * from \(quotedIdentifier($0.name)) limit \(previewLimit)" } ?? ""
      workspaceMode = .data
      errorMessage = nil
  }

  func selectTable(_ table: DatabaseTable) {
    selectedTable = table
    queryText = "select * from \(quotedIdentifier(table.name)) limit \(previewLimit)"
    workspaceMode = .data
    tablePage = 0
    loadSelectedTable()
  }

  func reloadFromFirstPage() {
    tablePage = 0
    loadSelectedTable()
  }

  func loadNextTablePage() {
    guard canLoadNextTablePage else { return }
    tablePage += 1
    loadSelectedTable()
  }

  func loadPreviousTablePage() {
    guard tablePage > 0 else { return }
    tablePage -= 1
    loadSelectedTable()
  }

  var canLoadNextTablePage: Bool {
    (tableData?.rows.count ?? 0) == previewLimit
  }

  func loadSelectedTable() {
    guard let engine, let selectedTable else { return }
    editingCell = nil

    do {
      let data = try engine.tableData(
        selectedTable,
        filter: tableFilter,
        sortColumn: tableSortColumn,
        sortAscending: tableSortAscending,
        limit: previewLimit,
        offset: tablePage * previewLimit
      )
      tableData = data
      tableSchema = try engine.tableSchema(selectedTable)
      savedTableData = data
      pendingChanges = []
      selectedRowIDs = []
      errorMessage = nil
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func runQuery() {
    guard let engine else {
      errorMessage = L("Open a database first.")
      return
    }

    do {
      result = try engine.query(queryText, limit: previewLimit)
      queryPlan = []
      workspaceMode = .query
      recordQueryRun(queryText)
      refreshActiveTables(try engine.listTables())
      if selectedTable != nil {
        loadSelectedTable()
      }
      errorMessage = nil
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func loadDiagram() {
    guard let engine else {
      errorMessage = L("Open a database first.")
      return
    }

    do {
      diagram = try engine.diagram()
      workspaceMode = .diagram
      errorMessage = nil
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func explainQuery() {
    guard let database = requireSQLite() else { return }

    do {
      queryPlan = try database.explainQueryPlan(queryText)
      workspaceMode = .query
      errorMessage = nil
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func runGlobalSearch() {
    guard let engine else {
      errorMessage = L("Open a database first.")
      return
    }

    do {
      searchMatches = try engine.searchAllTables(searchText)
      workspaceMode = .search
      errorMessage = nil
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func openSearchMatch(_ match: DatabaseSearchMatch) {
    guard let table = tables.first(where: { $0.name == match.tableName }) else {
      errorMessage = L("Table no longer exists.")
      return
    }

    tableFilter = searchText
    selectTable(table)
  }

  func showMaintenance() {
    workspaceMode = .maintenance
    loadDatabaseInfo()
  }

  func loadDatabaseInfo() {
    guard let database = requireSQLite() else { return }

    do {
      databaseInfo = try database.databaseInfo()
      errorMessage = nil
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func runIntegrityCheck() {
    guard let database = requireSQLite() else { return }

    do {
      showMaintenanceResult(title: L("Integrity Check"), messages: try database.integrityCheck())
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func runQuickCheck() {
    guard let database = requireSQLite() else { return }

    do {
      showMaintenanceResult(title: L("Quick Check"), messages: try database.quickCheck())
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func runOptimize() {
    guard let database = requireSQLite() else { return }

    do {
      showMaintenanceResult(title: L("Optimize"), messages: try database.optimize())
      loadDatabaseInfo()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func runVacuum() {
    guard let database = requireSQLite() else { return }
    guard confirm(title: L("Vacuum Database"), message: L("VACUUM rewrites the database file and can take time on large databases.")) else {
      return
    }

    do {
      try database.vacuum()
      showMaintenanceResult(title: L("Vacuum"), messages: [L("Vacuum complete.")])
      loadDatabaseInfo()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func saveAISettings() {
    UserDefaults.standard.set(aiSettings.endpoint, forKey: aiEndpointDefaultsKey)
    UserDefaults.standard.set(aiSettings.model, forKey: aiModelDefaultsKey)
  }

  func generateSQLWithAI() {
    guard !aiBusy else { return }
    guard let engine else {
      errorMessage = L("Open a database first.")
      return
    }

    aiBusy = true
    saveAISettings()
    Task {
      do {
        let schema = try engine.schemaSummary()
        let prompt = AIAssistant.sqlGenerationPrompt(request: aiRequest, schema: schema)
        let output = try await aiClient.complete(
          settings: aiSettings,
          system: "You are a SQLite assistant inside Quarry.",
          user: prompt
        )
        let sql = AIAssistant.extractSQL(output)
        await MainActor.run {
          queryText = sql
          aiResponse = sql
          workspaceMode = .query
          aiBusy = false
        }
      } catch {
        await MainActor.run {
          errorMessage = error.localizedDescription
          aiBusy = false
        }
      }
    }
  }

  func explainSQLWithAI() {
    guard !aiBusy else { return }
    guard let engine else {
      errorMessage = L("Open a database first.")
      return
    }

    aiBusy = true
    saveAISettings()
    Task {
      do {
        let schema = try engine.schemaSummary()
        let prompt = AIAssistant.sqlExplanationPrompt(sql: queryText, schema: schema)
        let output = try await aiClient.complete(
          settings: aiSettings,
          system: "You explain SQLite clearly and concisely.",
          user: prompt
        )
        await MainActor.run {
          aiResponse = output
          workspaceMode = .ai
          aiBusy = false
        }
      } catch {
        await MainActor.run {
          errorMessage = error.localizedDescription
          aiBusy = false
        }
      }
    }
  }

  func loadPlugins() {
    try? FileManager.default.createDirectory(at: pluginsDirectoryURL, withIntermediateDirectories: true)
    plugins = PluginRegistry.loadPlugins(from: pluginsDirectoryURL, enabledIDs: enabledPluginIDs)
  }

  func installPluginPanel() {
    let panel = NSOpenPanel()
    panel.canChooseDirectories = true
    panel.canChooseFiles = false
    panel.allowsMultipleSelection = false

    if panel.runModal() == .OK, let url = panel.url {
      do {
        _ = try PluginRegistry.installPlugin(from: url, into: pluginsDirectoryURL)
        loadPlugins()
      } catch {
        errorMessage = error.localizedDescription
      }
    }
  }

  func setPlugin(_ plugin: InstalledPlugin, enabled: Bool) {
    if enabled {
      enabledPluginIDs.insert(plugin.id)
    } else {
      enabledPluginIDs.remove(plugin.id)
    }
    UserDefaults.standard.set(Array(enabledPluginIDs).sorted(), forKey: enabledPluginsDefaultsKey)
    loadPlugins()
  }

  func openPluginCommand(_ command: PluginCommand) {
    NSWorkspace.shared.open(command.url)
  }

  private var pluginsDirectoryURL: URL {
    let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
      ?? FileManager.default.homeDirectoryForCurrentUser
    return support.appendingPathComponent("QuarrySwiftUI/plugins", isDirectory: true)
  }

  // Indexed cell access: rows in tableData and savedTableData stay positionally
  // aligned (edits only mutate values in place), so lookups are O(1) instead of
  // scanning by rowID/column name on every render and keystroke.
  func value(rowIndex: Int, columnIndex: Int) -> String {
    guard
      let tableData,
      tableData.rows.indices.contains(rowIndex),
      tableData.rows[rowIndex].values.indices.contains(columnIndex)
    else {
      return ""
    }

    return tableData.rows[rowIndex].values[columnIndex]
  }

  func editCell(rowIndex: Int, columnIndex: Int, newValue: String) {
    guard
      var tableData,
      let savedTableData,
      tableData.rows.indices.contains(rowIndex),
      tableData.columns.indices.contains(columnIndex),
      tableData.rows[rowIndex].values.indices.contains(columnIndex),
      savedTableData.rows.indices.contains(rowIndex),
      savedTableData.rows[rowIndex].values.indices.contains(columnIndex),
      let rowID = tableData.rows[rowIndex].rowID
    else {
      return
    }

    tableData.rows[rowIndex].values[columnIndex] = newValue
    self.tableData = tableData

    let oldValue = savedTableData.rows[rowIndex].values[columnIndex]
    let change = TableCellChange(
      tableName: tableData.table.name,
      rowID: rowID,
      columnName: tableData.columns[columnIndex].name,
      oldValue: oldValue,
      newValue: newValue
    )
    pendingChanges.removeAll { $0.id == change.id }
    if oldValue != newValue {
      pendingChanges.append(change)
    }
  }

  func isRowSelected(_ rowID: Int64) -> Bool {
    selectedRowIDs.contains(rowID)
  }

  func setRow(_ rowID: Int64, selected: Bool) {
    if selected {
      selectedRowIDs.insert(rowID)
    } else {
      selectedRowIDs.remove(rowID)
    }
  }

  func selectAllVisibleRows() {
    selectedRowIDs = Set(tableData?.rows.compactMap(\.rowID) ?? [])
  }

  func clearSelectedRows() {
    selectedRowIDs = []
  }

  func bulkEditSelectedRows() {
    guard let tableData, tableData.editable, let savedTableData else {
      errorMessage = L("Select editable rows first.")
      return
    }
    guard !selectedRowIDs.isEmpty else {
      errorMessage = L("Select rows first.")
      return
    }

    let editableColumns = tableData.columns.filter { !$0.isPrimaryKey }
    guard !editableColumns.isEmpty else {
      errorMessage = L("This table has no editable columns.")
      return
    }
    guard let edit = askBulkEdit(columns: editableColumns) else {
      return
    }

    let changes = TableBulkEdit.changes(
      tableData: savedTableData,
      rowIDs: selectedRowIDs,
      columnName: edit.columnName,
      newValue: edit.value
    )
    applyBulkEdit(columnName: edit.columnName, value: edit.value, changes: changes)
  }

  func deleteSelectedRows() {
    guard let database = requireSQLite(), let selectedTable else { return }
    guard !selectedRowIDs.isEmpty else {
      errorMessage = L("Select rows first.")
      return
    }
    guard confirm(
      title: L("Delete Selected Rows"),
      message: String(format: L("Delete %1$d selected rows from %2$@?"), selectedRowIDs.count, selectedTable.name)
    ) else {
      return
    }

    do {
      try database.deleteRows(from: selectedTable, rowIDs: Array(selectedRowIDs))
      selectedRowIDs = []
      loadSelectedTable()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func applyBulkEdit(columnName: String, value: String, changes: [TableCellChange]) {
    guard
      var tableData,
      let columnIndex = tableData.columns.firstIndex(where: { $0.name == columnName })
    else {
      return
    }

    for rowIndex in tableData.rows.indices {
      guard
        let rowID = tableData.rows[rowIndex].rowID,
        selectedRowIDs.contains(rowID),
        tableData.rows[rowIndex].values.indices.contains(columnIndex)
      else {
        continue
      }

      tableData.rows[rowIndex].values[columnIndex] = value
      pendingChanges.removeAll {
        $0.tableName == tableData.table.name && $0.rowID == rowID && $0.columnName == columnName
      }
    }

    pendingChanges.append(contentsOf: changes)
    self.tableData = tableData
    errorMessage = nil
  }

  func applyPendingChanges() {
    guard let database = requireSQLite() else { return }

    do {
      try database.applyChanges(pendingChanges)
      loadSelectedTable()
      errorMessage = nil
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func discardPendingChanges() {
    tableData = savedTableData
    pendingChanges = []
  }

  func addBlankRow() {
    guard let database = requireSQLite(), let selectedTable else { return }

    do {
      try database.insertBlankRow(into: selectedTable)
      tableFilter = ""
      tablePage = 0
      loadSelectedTable()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func sortBy(_ column: DatabaseColumn) {
    if tableSortColumn == column.name {
      tableSortAscending.toggle()
    } else {
      tableSortColumn = column.name
      tableSortAscending = true
    }
    tablePage = 0
    loadSelectedTable()
  }

  func deleteRow(_ rowID: Int64) {
    guard let database = requireSQLite(), let selectedTable else { return }

    do {
      try database.deleteRows(from: selectedTable, rowIDs: [rowID])
      selectedRowIDs.remove(rowID)
      loadSelectedTable()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func useQuery(_ query: QueryEntry, run: Bool = false) {
    queryText = query.sql
    workspaceMode = .query
    if run {
      runQuery()
    }
  }

  func saveCurrentQuery() {
    savedQueries = QueryLibrary.saving(queryText, in: savedQueries)
    Self.save(savedQueries, key: savedQueriesDefaultsKey)
  }

  func deleteSavedQuery(_ query: QueryEntry) {
    savedQueries.removeAll { $0.id == query.id }
    Self.save(savedQueries, key: savedQueriesDefaultsKey)
  }

  func exportCSVPanel() {
    guard let csv = csvPayload() else {
      errorMessage = L("Nothing to export.")
      return
    }

    let panel = NSSavePanel()
    panel.allowedContentTypes = [.commaSeparatedText]
    panel.nameFieldStringValue = "\(selectedTable?.name ?? "query").csv"

    if panel.runModal() == .OK, let url = panel.url {
      do {
        try csv.write(to: url, atomically: true, encoding: .utf8)
      } catch {
        errorMessage = error.localizedDescription
      }
    }
  }

  func importCSVPanel() {
    guard let database = requireSQLite(), let selectedTable else {
      errorMessage = L("Select a table in a SQLite database first.")
      return
    }

    let panel = NSOpenPanel()
    panel.canChooseDirectories = false
    panel.canChooseFiles = true
    panel.allowsMultipleSelection = false
    panel.allowedContentTypes = [.commaSeparatedText, .plainText]

    if panel.runModal() == .OK, let url = panel.url {
      do {
        let text = try String(contentsOf: url, encoding: .utf8)
        let inserted = try database.importCSV(CSVImporter.parse(text), into: selectedTable)
        loadSelectedTable()
        errorMessage = String(format: L("Imported %d rows."), inserted)
      } catch {
        errorMessage = error.localizedDescription
      }
    }
  }

  func exportJSONPanel() {
    do {
      guard let json = try jsonPayload() else {
        errorMessage = L("Nothing to export.")
        return
      }

      let panel = NSSavePanel()
      panel.allowedContentTypes = [.json]
      panel.nameFieldStringValue = "\(selectedTable?.name ?? "query").json"

      if panel.runModal() == .OK, let url = panel.url {
        try json.write(to: url, atomically: true, encoding: .utf8)
      }
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func importJSONPanel() {
    guard let database = requireSQLite(), let selectedTable else {
      errorMessage = L("Select a table in a SQLite database first.")
      return
    }

    let panel = NSOpenPanel()
    panel.canChooseDirectories = false
    panel.canChooseFiles = true
    panel.allowsMultipleSelection = false
    panel.allowedContentTypes = [.json, .plainText]

    if panel.runModal() == .OK, let url = panel.url {
      do {
        let text = try String(contentsOf: url, encoding: .utf8)
        let inserted = try database.importCSV(try JSONImporter.parse(text), into: selectedTable)
        loadSelectedTable()
        errorMessage = String(format: L("Imported %d rows."), inserted)
      } catch {
        errorMessage = error.localizedDescription
      }
    }
  }

  func generateMockDataPanel() {
    guard let database = requireSQLite(), let selectedTable, let tableSchema else {
      errorMessage = L("Select a table in a SQLite database first.")
      return
    }
    guard
      let text = askText(title: L("Generate Mock Data"), defaultValue: "100"),
      let count = Int(text.trimmingCharacters(in: .whitespaces)),
      count > 0
    else {
      return
    }

    do {
      let generated = MockDataGenerator.generate(
        columns: tableSchema.columns,
        rowCount: count,
        seed: UInt64.random(in: .min ... .max)
      )
      let inserted = try database.importCSV(generated.document, into: selectedTable)
      tablePage = 0
      loadSelectedTable()
      errorMessage = String(format: L("Inserted %d mock rows."), inserted)
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func saveSchemaSnapshotPanel() {
    guard let database = requireSQLite() else { return }

    do {
      let snapshot = try SchemaSnapshot.capture(from: database)
      let data = try JSONEncoder().encode(snapshot)

      let panel = NSSavePanel()
      panel.allowedContentTypes = [.json]
      panel.nameFieldStringValue = "\(databaseURL?.deletingPathExtension().lastPathComponent ?? "database")-schema.json"

      if panel.runModal() == .OK, let url = panel.url {
        try data.write(to: url)
      }
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func compareSchemaSnapshotPanel() {
    guard let database = requireSQLite() else { return }

    let panel = NSOpenPanel()
    panel.canChooseDirectories = false
    panel.canChooseFiles = true
    panel.allowsMultipleSelection = false
    panel.allowedContentTypes = [.json]

    guard panel.runModal() == .OK, let url = panel.url else { return }

    do {
      let snapshot = try JSONDecoder().decode(SchemaSnapshot.self, from: Data(contentsOf: url))
      let current = try SchemaSnapshot.capture(from: database)
      let diff = SchemaDiff(from: snapshot, to: current)

      if diff.isEmpty {
        showMaintenanceResult(title: L("Schema Comparison"), messages: [L("No differences since snapshot.")])
      } else {
        showMaintenanceResult(
          title: L("Schema Comparison"),
          messages: diff.entries.map(\.description) + ["", L("Migration SQL:")] + diff.migrationSQL
        )
      }
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func backupDatabasePanel() {
    guard let database = requireSQLite(), let databaseURL else {
      errorMessage = L("Open a SQLite database first.")
      return
    }

    let panel = NSSavePanel()
    panel.allowedContentTypes = Self.databaseTypes
    panel.nameFieldStringValue = "\(databaseURL.deletingPathExtension().lastPathComponent)-backup.sqlite"

    if panel.runModal() == .OK, let url = panel.url {
      do {
        try database.backup(to: url)
      } catch {
        errorMessage = error.localizedDescription
      }
    }
  }

  func restoreDatabasePanel() {
    guard let database = requireSQLite() else { return }

    let panel = NSOpenPanel()
    panel.canChooseDirectories = false
    panel.canChooseFiles = true
    panel.allowsMultipleSelection = false
    panel.allowedContentTypes = Self.databaseTypes

    if panel.runModal() == .OK, let url = panel.url {
      do {
        try database.restore(from: url)
        let refreshedTables = try database.listTables()
        refreshActiveTables(refreshedTables)
        if let selectedTable, refreshedTables.contains(selectedTable) {
          selectTable(selectedTable)
        } else if let firstTable = refreshedTables.first {
          selectTable(firstTable)
        } else {
          resetWorkspace()
        }
      } catch {
        errorMessage = error.localizedDescription
      }
    }
  }

  private func refreshActiveTables(_ tables: [DatabaseTable]) {
    self.tables = tables
    guard let activeSessionID, let index = sessions.firstIndex(where: { $0.id == activeSessionID }) else {
      return
    }

    let current = sessions[index]
    if let serverProfile = current.serverProfile {
      sessions[index] = DatabaseSession(
        serverProfile: serverProfile,
        engine: current.engine,
        tables: tables,
        tunnel: current.tunnel
      )
    } else if let url = current.url {
      sessions[index] = DatabaseSession(
        url: url,
        engine: current.engine,
        tables: tables,
        isEncrypted: current.isEncrypted
      )
    }
  }

  private func remember(_ url: URL) {
    let paths = RecentDatabasePaths.adding(
      url.path,
      to: UserDefaults.standard.stringArray(forKey: recentDefaultsKey) ?? []
    )
    UserDefaults.standard.set(paths, forKey: recentDefaultsKey)
    recentDatabaseURLs = paths.map(URL.init(fileURLWithPath:))
  }

  private func recordQueryRun(_ sql: String) {
    queryHistory = QueryLibrary.recording(sql, in: queryHistory)
    Self.save(queryHistory, key: queryHistoryDefaultsKey)
  }

  private func csvPayload() -> String? {
    if workspaceMode == .query, let result {
      return CSVExporter.encode(result)
    }
    if let tableData {
      return CSVExporter.encode(tableData)
    }
    return nil
  }

  private func jsonPayload() throws -> String? {
    if workspaceMode == .query, let result {
      return try JSONExporter.encode(result)
    }
    if let tableData {
      return try JSONExporter.encode(tableData)
    }
    return nil
  }

  private func showMaintenanceResult(title: String, messages: [String]) {
    workspaceMode = .maintenance
    maintenanceMessages = ["\(title):"] + (messages.isEmpty ? [L("Done.")] : messages)
    errorMessage = nil
  }

  private static let databaseTypes = ["sqlite", "sqlite3", "db"].compactMap {
    UTType(filenameExtension: $0)
  }

  private func askPassword(title: String) -> String? {
    let input = NSSecureTextField(frame: NSRect(x: 0, y: 0, width: 260, height: 24))
    let alert = NSAlert()
    alert.messageText = title
    alert.informativeText = L("Enter the database password.")
    alert.accessoryView = input
    alert.addButton(withTitle: L("Open"))
    alert.addButton(withTitle: L("Cancel"))
    alert.window.initialFirstResponder = input
    return alert.runModal() == .alertFirstButtonReturn ? input.stringValue : nil
  }

  private func confirm(title: String, message: String) -> Bool {
    let alert = NSAlert()
    alert.messageText = title
    alert.informativeText = message
    alert.addButton(withTitle: L("Continue"))
    alert.addButton(withTitle: L("Cancel"))
    return alert.runModal() == .alertFirstButtonReturn
  }

  private func askBulkEdit(columns: [DatabaseColumn]) -> BulkEditInput? {
    let picker = NSPopUpButton(frame: NSRect(x: 0, y: 0, width: 280, height: 28), pullsDown: false)
    columns.forEach { picker.addItem(withTitle: $0.name) }

    let valueField = NSTextField(frame: NSRect(x: 0, y: 0, width: 280, height: 24))
    valueField.placeholderString = L("New value")

    let stack = NSStackView()
    stack.orientation = .vertical
    stack.spacing = 8
    stack.addArrangedSubview(NSTextField(labelWithString: L("Column")))
    stack.addArrangedSubview(picker)
    stack.addArrangedSubview(NSTextField(labelWithString: L("Value")))
    stack.addArrangedSubview(valueField)
    stack.setFrameSize(NSSize(width: 280, height: 96))

    let alert = NSAlert()
    alert.messageText = L("Bulk Edit Selected Rows")
    alert.informativeText = L("Create pending changes for the selected rows.")
    alert.accessoryView = stack
    alert.addButton(withTitle: L("Preview Changes"))
    alert.addButton(withTitle: L("Cancel"))
    alert.window.initialFirstResponder = valueField

    guard alert.runModal() == .alertFirstButtonReturn else {
      return nil
    }

    return BulkEditInput(
      columnName: picker.titleOfSelectedItem ?? columns[0].name,
      value: valueField.stringValue
    )
  }

  private func askServerConnection() -> (profile: ConnectionProfile, password: String)? {
    let kindPicker = NSPopUpButton(frame: NSRect(x: 0, y: 0, width: 300, height: 28), pullsDown: false)
    let kinds: [DatabaseEngineKind] = [.postgres, .mysql]
    kinds.forEach { kindPicker.addItem(withTitle: $0.rawValue) }

    let hostField = NSTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24))
    hostField.placeholderString = L("Host")
    hostField.stringValue = "localhost"

    let portField = NSTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24))
    portField.placeholderString = L("Port (5432 / 3306)")

    let databaseField = NSTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24))
    databaseField.placeholderString = L("Database")

    let userField = NSTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24))
    userField.placeholderString = L("User")

    let passwordField = NSSecureTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24))
    passwordField.placeholderString = L("Password")

    let sshHostField = NSTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24))
    sshHostField.placeholderString = L("SSH host (optional, key auth)")

    let sshUserField = NSTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24))
    sshUserField.placeholderString = L("SSH user (defaults to current user)")

    let stack = NSStackView()
    stack.orientation = .vertical
    stack.spacing = 8
    [kindPicker, hostField, portField, databaseField, userField, passwordField, sshHostField, sshUserField].forEach {
      stack.addArrangedSubview($0)
      $0.widthAnchor.constraint(equalToConstant: 300).isActive = true
    }
    stack.setFrameSize(NSSize(width: 300, height: 264))

    let alert = NSAlert()
    alert.messageText = L("Connect to Server")
    alert.informativeText = L("Connect to a PostgreSQL or MySQL database.")
    alert.accessoryView = stack
    alert.addButton(withTitle: L("Connect"))
    alert.addButton(withTitle: L("Cancel"))
    alert.window.initialFirstResponder = hostField

    guard alert.runModal() == .alertFirstButtonReturn else {
      return nil
    }

    let kind = kinds[max(0, kindPicker.indexOfSelectedItem)]
    let defaultPort = kind == .postgres ? 5432 : 3306
    let host = hostField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
    let database = databaseField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
    let user = userField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)

    let profile = ConnectionProfile(
      name: "\(database)@\(host)",
      path: "",
      isEncrypted: false,
      kind: kind,
      host: host.isEmpty ? "localhost" : host,
      port: Int(portField.stringValue) ?? defaultPort,
      database: database,
      user: user,
      sshHost: sshHostField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines),
      sshUser: sshUserField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
    )
    return (profile, passwordField.stringValue)
  }

  private func askText(title: String, defaultValue: String) -> String? {
    let input = NSTextField(frame: NSRect(x: 0, y: 0, width: 260, height: 24))
    input.stringValue = defaultValue
    let alert = NSAlert()
    alert.messageText = title
    alert.accessoryView = input
    alert.addButton(withTitle: L("Save"))
    alert.addButton(withTitle: L("Cancel"))
    alert.window.initialFirstResponder = input
    return alert.runModal() == .alertFirstButtonReturn ? input.stringValue : nil
  }

  private func quotedIdentifier(_ name: String) -> String {
    if engine?.kind == .mysql {
      return "`\(name.replacingOccurrences(of: "`", with: "``"))`"
    }
    return "\"\(name.replacingOccurrences(of: "\"", with: "\"\""))\""
  }

  private static func loadQueries(key: String) -> [QueryEntry] {
    guard let data = UserDefaults.standard.data(forKey: key) else { return [] }
    return (try? JSONDecoder().decode([QueryEntry].self, from: data)) ?? []
  }

  private static func save(_ queries: [QueryEntry], key: String) {
    if let data = try? JSONEncoder().encode(queries) {
      UserDefaults.standard.set(data, forKey: key)
    }
  }

  private static func loadConnectionProfiles(key: String) -> [ConnectionProfile] {
    guard let data = UserDefaults.standard.data(forKey: key) else { return [] }
    return (try? JSONDecoder().decode([ConnectionProfile].self, from: data)) ?? []
  }

  private static func saveConnectionProfiles(_ profiles: [ConnectionProfile], key: String) {
    if let data = try? JSONEncoder().encode(profiles) {
      UserDefaults.standard.set(data, forKey: key)
    }
  }
}
