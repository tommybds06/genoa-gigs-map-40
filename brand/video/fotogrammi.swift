// Fotogrammi ESATTI a dati istanti (vedi CLAUDE.md §25.6).
// swiftc -O brand/video/fotogrammi.swift -o /tmp/fotogrammi && /tmp/fotogrammi video.mp4 cartella 576 8.928 8.963
import AVFoundation
import AppKit
let args = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let outDir = args[2]
let larghezza = Double(args[3])!
let gen = AVAssetImageGenerator(asset: asset)
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
gen.maximumSize = CGSize(width: larghezza, height: larghezza * 3)
for s in args[4...] {
  let t = Double(s)! + 0.002
  var actual = CMTime.zero
  if let cg = try? gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 6000), actualTime: &actual) {
    let data = NSBitmapImageRep(cgImage: cg).representation(using: .jpeg, properties: [.compressionFactor: 0.85])!
    try! data.write(to: URL(fileURLWithPath: String(format: "%@/f%07.3f.jpg", outDir, Double(s)!)))
  }
}
