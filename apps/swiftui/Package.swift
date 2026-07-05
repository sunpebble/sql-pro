// swift-tools-version: 5.9

import PackageDescription

let package = Package(
  name: "QuarrySwiftUI",
  defaultLocalization: "en",
  platforms: [
    .macOS(.v14)
  ],
  products: [
    .library(name: "QuarryCore", targets: ["QuarryCore"]),
    .executable(name: "QuarrySwiftUI", targets: ["QuarrySwiftUI"]),
  ],
  targets: [
    .systemLibrary(name: "CLibPQ"),
    .systemLibrary(name: "CMySQL"),
    .target(
      name: "QuarryCore",
      dependencies: ["CLibPQ", "CMySQL"],
      linkerSettings: [
        .linkedLibrary("sqlcipher"),
        .unsafeFlags([
          "-L/opt/homebrew/lib",
          "-L/opt/homebrew/opt/postgresql@16/lib",
          "-L/opt/homebrew/opt/mysql/lib",
          "-Xlinker", "-rpath",
          "-Xlinker", "/opt/homebrew/lib",
          "-Xlinker", "-rpath",
          "-Xlinker", "/opt/homebrew/opt/postgresql@16/lib",
          "-Xlinker", "-rpath",
          "-Xlinker", "/opt/homebrew/opt/mysql/lib",
        ]),
      ]
    ),
    .executableTarget(
      name: "QuarrySwiftUI",
      dependencies: ["QuarryCore"],
      resources: [.process("Resources")]
    ),
    .testTarget(
      name: "QuarryCoreTests",
      dependencies: ["QuarryCore"]
    ),
  ]
)
