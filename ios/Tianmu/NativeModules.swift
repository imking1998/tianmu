/**
 * 天目应用 - iOS原生模块 (Swift)
 * ARKit集成与物体检测
 */

import Foundation
import ARKit
import Vision
import UIKit

// MARK: - ARKit模块

@objc(ARKitModule)
class ARKitModule: NSObject {
    
    private var arSession: ARSession?
    private var isSessionRunning = false
    private var detectionEnabled = false
    private var detectionClasses: [String] = []
    
    override init() {
        super.init()
    }
    
    /// 初始化AR会话
    @objc
    func initialize(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // 检查ARKit支持
        guard ARWorldTrackingConfiguration.isSupported else {
            reject("AR_NOT_SUPPORTED", "此设备不支持ARKit", nil)
            return
        }
        
        // 创建AR会话
        arSession = ARSession()
        
        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        configuration.environmentTexturing = .automatic
        configuration.frameSemantics = [.sceneDepth, .smoothedSceneDepth]
        
        arSession?.run(configuration)
        
        print("[ARKitModule] 初始化成功")
        resolve(true)
    }
    
    /// 启动AR会话
    @objc
    func startSession(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let session = arSession else {
            reject("AR_NOT_INITIALIZED", "AR会话未初始化", nil)
            return
        }
        
        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        session.run(configuration)
        
        isSessionRunning = true
        print("[ARKitModule] 会话已启动")
        resolve(nil)
    }
    
    /// 停止AR会话
    @objc
    func stopSession(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        arSession?.pause()
        isSessionRunning = false
        print("[ARKitModule] 会话已停止")
        resolve(nil)
    }
    
    /// 检查AR是否支持
    @objc
    func isARSupported(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        resolve(ARWorldTrackingConfiguration.isSupported)
    }
    
    /// 获取相机位置
    @objc
    func getCameraPosition(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let session = arSession, isSessionRunning else {
            reject("AR_NOT_RUNNING", "AR会话未运行", nil)
            return
        }
        
        guard let frame = session.currentFrame else {
            reject("AR_NO_FRAME", "无法获取当前帧", nil)
            return
        }
        
        let cameraTransform = frame.camera.transform
        let position: [String: Float] = [
            "x": cameraTransform.columns.3.x,
            "y": cameraTransform.columns.3.y,
            "z": cameraTransform.columns.3.z
        ]
        
        resolve(position)
    }
    
    /// 获取相机旋转
    @objc
    func getCameraRotation(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let session = arSession, isSessionRunning else {
            reject("AR_NOT_RUNNING", "AR会话未运行", nil)
            return
        }
        
        guard let frame = session.currentFrame else {
            reject("AR_NO_FRAME", "无法获取当前帧", nil)
            return
        }
        
        let quaternion = frame.camera.transform.quaternion
        let rotation: [String: Float] = [
            "x": quaternion.x,
            "y": quaternion.y,
            "z": quaternion.z,
            "w": quaternion.w
        ]
        
        resolve(rotation)
    }
    
    /// 添加AR锚点
    @objc
    func addAnchor(_ position: [String: Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let session = arSession else {
            reject("AR_NOT_INITIALIZED", "AR会话未初始化", nil)
            return
        }
        
        guard let x = position["x"] as? Float,
              let y = position["y"] as? Float,
              let z = position["z"] as? Float else {
            reject("INVALID_POSITION", "无效的位置参数", nil)
            return
        }
        
        let anchor = ARAnchor(transform: simd_float4x4(
            SIMD4<Float>(1, 0, 0, 0),
            SIMD4<Float>(0, 1, 0, 0),
            SIMD4<Float>(0, 0, 1, 0),
            SIMD4<Float>(x, y, z, 1)
        ))
        
        session.add(anchor: anchor)
        resolve(anchor.identifier.uuidString)
    }
    
    /// 移除AR锚点
    @objc
    func removeAnchor(_ anchorId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let session = arSession else {
            reject("AR_NOT_INITIALIZED", "AR会话未初始化", nil)
            return
        }
        
        if let uuid = UUID(uuidString: anchorId),
           let anchor = session.currentFrame?.anchors.first(where: { $0.identifier == uuid }) {
            session.remove(anchor: anchor)
        }
        
        resolve(nil)
    }
    
    /// 设置检测开关
    @objc
    func setDetectionEnabled(_ enabled: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        detectionEnabled = enabled
        print("[ARKitModule] 检测开关: \(enabled)")
        resolve(nil)
    }
    
    /// 设置检测类别
    @objc
    func setDetectionClasses(_ classes: [String], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        detectionClasses = classes
        print("[ARKitModule] 设置检测类别: \(classes)")
        resolve(nil)
    }
    
    /// React Native导出方法
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
}

// MARK: - 扩展：矩阵转四元数

extension simd_float4x4 {
    var quaternion: simd_quatf {
        return simd_quaternion(self)
    }
}

// MARK: - 物体检测模块

@objc(ObjectDetectionModule)
class ObjectDetectionModule: NSObject {
    
    private var visionModel: VNCoreMLModel?
    private var confidenceThreshold: Float = 0.5
    private var maxDetections: Int = 10
    
    /// 初始化模型
    @objc
    func initialize(_ modelPath: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        do {
            // 加载CoreML模型
            guard let url = URL(string: modelPath) else {
                reject("INVALID_PATH", "无效的模型路径", nil)
                return
            }
            
            let config = MLModelConfiguration()
            config.computeUnits = .all
            
            // 这里需要替换为实际的模型
            // let model = try YOLOv13(configuration: config)
            // visionModel = try VNCoreMLModel(for: model.model)
            
            print("[ObjectDetection] 模型加载成功: \(modelPath)")
            resolve(true)
        } catch {
            print("[ObjectDetection] 模型加载失败: \(error)")
            reject("MODEL_LOAD_FAILED", error.localizedDescription, error)
        }
    }
    
    /// 检测物体
    @objc
    func detect(_ frameData: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let model = visionModel else {
            reject("MODEL_NOT_LOADED", "模型未加载", nil)
            return
        }
        
        // 执行检测
        let request = VNCoreMLRequest(model: model) { request, error in
            guard let results = request.results as? [VNRecognizedObjectObservation] else {
                resolve([])
                return
            }
            
            let detections = results.prefix(self.maxDetections)
                .filter { $0.confidence >= self.confidenceThreshold }
                .map { observation -> [String: Any] in
                    let bbox = observation.boundingBox
                    return [
                        "classId": observation.labels.first?.identifier ?? "",
                        "className": observation.labels.first?.identifier ?? "unknown",
                        "confidence": observation.confidence,
                        "boundingBox": [
                            "x": bbox.origin.x,
                            "y": bbox.origin.y,
                            "width": bbox.width,
                            "height": bbox.height
                        ]
                    ]
                }
            
            resolve(detections)
        }
        
        request.imageCropAndScaleOption = .scaleFill
    }
    
    /// 设置置信度阈值
    @objc
    func setConfidenceThreshold(_ threshold: Float, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        confidenceThreshold = threshold
        resolve(nil)
    }
    
    /// 设置最大检测数
    @objc
    func setMaxDetections(_ max: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        maxDetections = max
        resolve(nil)
    }
    
    /// 检查模型是否加载
    @objc
    func isModelLoaded(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        resolve(visionModel != nil)
    }
    
    /// 释放资源
    @objc
    func release(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        visionModel = nil
        resolve(nil)
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}

// MARK: - 颜色检测模块

@objc(ColorDetectionModule)
class ColorDetectionModule: NSObject {
    
    /// 获取主色调
    @objc
    func getDominantColor(_ imagePath: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let image = UIImage(contentsOfFile: imagePath) else {
            reject("IMAGE_NOT_FOUND", "无法加载图片", nil)
            return
        }
        
        let color = extractDominantColor(from: image)
        
        let result: [String: Any] = [
            "hex": color.hexString,
            "rgb": ["r": color.r, "g": color.g, "b": color.b],
            "hsl": ["h": color.h, "s": color.s, "l": color.l],
            "percentage": 1.0
        ]
        
        resolve(result)
    }
    
    /// 获取多个颜色
    @objc
    func getColors(_ imagePath: String, count: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let image = UIImage(contentsOfFile: imagePath) else {
            reject("IMAGE_NOT_FOUND", "无法加载图片", nil)
            return
        }
        
        let colors = extractColors(from: image, count: count)
        let result = colors.map { color -> [String: Any] in
            return [
                "hex": color.hexString,
                "rgb": ["r": color.r, "g": color.g, "b": color.b],
                "hsl": ["h": color.h, "s": color.s, "l": color.l],
                "percentage": color.percentage
            ]
        }
        
        resolve(result)
    }
    
    // MARK: - 私有方法
    
    private func extractDominantColor(from image: UIImage) -> (r: Int, g: Int, b: Int, h: Int, s: Int, l: Int, hexString: String, percentage: Float) {
        guard let cgImage = image.cgImage else {
            return (128, 128, 128, 0, 0, 50, "#808080", 1.0)
        }
        
        let width = 1
        let height = 1
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        var pixelData = [UInt8](repeating: 0, count: 4)
        
        guard let context = CGContext(
            data: &pixelData,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: 4,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else {
            return (128, 128, 128, 0, 0, 50, "#808080", 1.0)
        }
        
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        let r = Int(pixelData[0])
        let g = Int(pixelData[1])
        let b = Int(pixelData[2])
        
        let hexString = String(format: "#%02X%02X%02X", r, g, b)
        
        // RGB转HSL
        let (h, s, l) = rgbToHsl(r: r, g: g, b: b)
        
        return (r, g, b, h, s, l, hexString, 1.0)
    }
    
    private func extractColors(from image: UIImage, count: Int) -> [(r: Int, g: Int, b: Int, h: Int, s: Int, l: Int, hexString: String, percentage: Float)] {
        // 简化实现，实际应使用聚类算法
        let dominant = extractDominantColor(from: image)
        return Array(repeating: dominant, count: count)
    }
    
    private func rgbToHsl(r: Int, g: Int, b: Int) -> (h: Int, s: Int, l: Int) {
        let rNorm = Double(r) / 255.0
        let gNorm = Double(g) / 255.0
        let bNorm = Double(b) / 255.0
        
        let maxVal = max(rNorm, gNorm, bNorm)
        let minVal = min(rNorm, gNorm, bNorm)
        let delta = maxVal - minVal
        
        var h: Double = 0
        var s: Double = 0
        let l: Double = (maxVal + minVal) / 2.0
        
        if delta != 0 {
            s = l > 0.5 ? delta / (2.0 - maxVal - minVal) : delta / (maxVal + minVal)
            
            if maxVal == rNorm {
                h = ((gNorm - bNorm) / delta) + (gNorm < bNorm ? 6 : 0)
            } else if maxVal == gNorm {
                h = ((bNorm - rNorm) / delta) + 2
            } else {
                h = ((rNorm - gNorm) / delta) + 4
            }
            
            h *= 60
        }
        
        return (Int(h), Int(s * 100), Int(l * 100))
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}

// MARK: - 触感反馈模块

@objc(HapticModule)
class HapticModule: NSObject {
    
    private let lightFeedback = UIImpactFeedbackGenerator(style: .light)
    private let mediumFeedback = UIImpactFeedbackGenerator(style: .medium)
    private let heavyFeedback = UIImpactFeedbackGenerator(style: .heavy)
    private let selectionFeedback = UISelectionFeedbackGenerator()
    private let notificationFeedback = UINotificationFeedbackGenerator()
    
    /// 触发冲击反馈
    @objc
    func impact(_ style: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        switch style {
        case "light":
            lightFeedback.impactOccurred()
        case "medium":
            mediumFeedback.impactOccurred()
        case "heavy":
            heavyFeedback.impactOccurred()
        default:
            mediumFeedback.impactOccurred()
        }
        resolve(nil)
    }
    
    /// 触发通知反馈
    @objc
    func notification(_ type: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        switch type {
        case "success":
            notificationFeedback.notificationOccurred(.success)
        case "warning":
            notificationFeedback.notificationOccurred(.warning)
        case "error":
            notificationFeedback.notificationOccurred(.error)
        default:
            notificationFeedback.notificationOccurred(.success)
        }
        resolve(nil)
    }
    
    /// 触发选择反馈
    @objc
    func selection(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        selectionFeedback.selectionChanged()
        resolve(nil)
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
