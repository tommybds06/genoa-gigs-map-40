// Tempi e differenze fra fotogrammi di una registrazione dello schermo (vedi CLAUDE.md §25.6).
// swiftc -O brand/video/tempi.swift -o /tmp/tempi && /tmp/tempi video.mp4 > tempi.txt   →   righe «secondi differenza»
import AVFoundation
import CoreImage
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let asset = AVURLAsset(url: url)
let track = asset.tracks(withMediaType: .video)[0]
let reader = try! AVAssetReader(asset: asset)
let out = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
reader.add(out); reader.startReading()
var prev: [UInt8]? = nil
let W = 72, H = 162
var lines: [String] = []
while let sb = out.copyNextSampleBuffer() {
  let pts = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sb))
  guard let pb = CMSampleBufferGetImageBuffer(sb) else { continue }
  CVPixelBufferLockBaseAddress(pb, .readOnly)
  let w = CVPixelBufferGetWidth(pb), h = CVPixelBufferGetHeight(pb), bpr = CVPixelBufferGetBytesPerRow(pb)
  let base = CVPixelBufferGetBaseAddress(pb)!.assumingMemoryBound(to: UInt8.self)
  var cur = [UInt8](repeating: 0, count: W * H)
  for y in 0..<H { for x in 0..<W {
    let sx = x * w / W, sy = y * h / H
    let p = base + sy * bpr + sx * 4
    cur[y * W + x] = UInt8((Int(p[0]) + Int(p[1]) * 2 + Int(p[2])) / 4)
  } }
  CVPixelBufferUnlockBaseAddress(pb, .readOnly)
  var d = 0.0
  if let pr = prev { var s = 0; for i in 0..<cur.count { s += abs(Int(cur[i]) - Int(pr[i])) }; d = Double(s) / Double(cur.count) }
  lines.append(String(format: "%.3f %.2f", pts, d))
  prev = cur
}
print(lines.joined(separator: "\n"))
