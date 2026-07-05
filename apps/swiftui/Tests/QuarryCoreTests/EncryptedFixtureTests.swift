import QuarryCore
import XCTest

// One-off local verification against a real encrypted fixture; run with:
//   QUARRY_ENC_DB_PATH=... QUARRY_ENC_DB_PASSWORD=... swift test --filter EncryptedFixtureTests
final class EncryptedFixtureTests: XCTestCase {
  func testOpensRealEncryptedDatabase() throws {
    let env = ProcessInfo.processInfo.environment
    guard let path = env["QUARRY_ENC_DB_PATH"], let password = env["QUARRY_ENC_DB_PASSWORD"] else {
      throw XCTSkip("Set QUARRY_ENC_DB_PATH and QUARRY_ENC_DB_PASSWORD to run.")
    }
    let url = URL(fileURLWithPath: path)

    XCTAssertThrowsError(try SQLiteDatabase(url: url, readOnly: false)) { error in
      XCTAssertEqual(error as? SQLiteDatabaseError, .passwordRequired)
    }

    let database = try SQLiteDatabase(url: url, readOnly: false, password: password)
    let tables = try database.listTables()
    XCTAssertFalse(tables.isEmpty)
    print("encrypted fixture tables: \(tables.count)")
  }
}
