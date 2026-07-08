import Darwin
import Foundation

public enum SSHTunnelError: Error, LocalizedError {
  case startFailed(String)
  case forwardTimedOut

  public var errorDescription: String? {
    switch self {
    case let .startFailed(message):
      return "SSH tunnel failed: \(message)"
    case .forwardTimedOut:
      return "SSH tunnel did not become ready. Check host, user, and that key-based auth works (BatchMode)."
    }
  }
}

// linking libssh2; add password auth only if users actually ask for it.
public final class SSHTunnel {
  public let localPort: Int
  private let process: Process

  public init(sshHost: String, sshUser: String, sshPort: Int = 22, remoteHost: String, remotePort: Int) throws {
    localPort = try Self.freeLocalPort()

    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/ssh")
    process.arguments = [
      "-N",
      "-L", "127.0.0.1:\(localPort):\(remoteHost):\(remotePort)",
      "-p", "\(sshPort)",
      "-o", "BatchMode=yes",
      "-o", "ExitOnForwardFailure=yes",
      "-o", "ConnectTimeout=10",
      "\(sshUser)@\(sshHost)",
    ]
    let stderrPipe = Pipe()
    process.standardError = stderrPipe
    process.standardOutput = Pipe()

    do {
      try process.run()
    } catch {
      throw SSHTunnelError.startFailed(error.localizedDescription)
    }
    self.process = process

    let deadline = Date().addingTimeInterval(12)
    while Date() < deadline {
      if !process.isRunning {
        let data = stderrPipe.fileHandleForReading.readDataToEndOfFile()
        let message = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
        throw SSHTunnelError.startFailed(message?.isEmpty == false ? message! : "ssh exited early")
      }
      if Self.canConnect(port: localPort) {
        return
      }
      Thread.sleep(forTimeInterval: 0.2)
    }

    process.terminate()
    throw SSHTunnelError.forwardTimedOut
  }

  deinit {
    close()
  }

  public func close() {
    if process.isRunning {
      process.terminate()
    }
  }

  private static func freeLocalPort() throws -> Int {
    let socketFD = socket(AF_INET, SOCK_STREAM, 0)
    guard socketFD >= 0 else { throw SSHTunnelError.startFailed("socket() failed") }
    defer { Darwin.close(socketFD) }

    var address = sockaddr_in()
    address.sin_family = sa_family_t(AF_INET)
    address.sin_addr.s_addr = inet_addr("127.0.0.1")
    address.sin_port = 0

    let bindResult = withUnsafePointer(to: &address) {
      $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
        bind(socketFD, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
      }
    }
    guard bindResult == 0 else { throw SSHTunnelError.startFailed("bind() failed") }

    var boundAddress = sockaddr_in()
    var length = socklen_t(MemoryLayout<sockaddr_in>.size)
    let nameResult = withUnsafeMutablePointer(to: &boundAddress) {
      $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
        getsockname(socketFD, $0, &length)
      }
    }
    guard nameResult == 0 else { throw SSHTunnelError.startFailed("getsockname() failed") }
    return Int(UInt16(bigEndian: boundAddress.sin_port))
  }

  private static func canConnect(port: Int) -> Bool {
    let socketFD = socket(AF_INET, SOCK_STREAM, 0)
    guard socketFD >= 0 else { return false }
    defer { Darwin.close(socketFD) }

    var address = sockaddr_in()
    address.sin_family = sa_family_t(AF_INET)
    address.sin_addr.s_addr = inet_addr("127.0.0.1")
    address.sin_port = UInt16(port).bigEndian

    return withUnsafePointer(to: &address) {
      $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
        connect(socketFD, $0, socklen_t(MemoryLayout<sockaddr_in>.size)) == 0
      }
    }
  }
}
