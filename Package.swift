// swift-tools-version:5.9
// The game engine and story without the iPhone parts, so they can be built and
// checked on any machine, including Linux.
import PackageDescription

let package = Package(
    name: "LastSignalCore",
    platforms: [.macOS(.v14), .iOS(.v17)],
    targets: [
        .target(name: "LastSignalCore", path: "LastSignal/Core"),
        .executableTarget(name: "LastSignalSim", dependencies: ["LastSignalCore"], path: "Tests/LastSignalSim"),
        .executableTarget(name: "LastSignalUI", dependencies: ["LastSignalCore"], path: "Tests/LastSignalUI"),
    ]
)
