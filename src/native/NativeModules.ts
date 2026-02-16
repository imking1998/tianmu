/**
 * 天目应用 - 原生模块类型定义
 * 定义iOS/Android原生模块的TypeScript接口
 */

import { NativeModules, NativeEventEmitter } from 'react-native';

// ==================== AR模块接口 ====================

export interface ARModuleInterface {
  initialize(): Promise<boolean>;
  startSession(): Promise<void>;
  stopSession(): Promise<void>;
  addAnchor(position: { x: number; y: number; z: number }): Promise<string>;
  removeAnchor(id: string): Promise<void>;
  getCameraPosition(): Promise<{ x: number; y: number; z: number }>;
  getCameraRotation(): Promise<{ x: number; y: number; z: number; w: number }>;
  isARSupported(): Promise<boolean>;
  setDetectionEnabled(enabled: boolean): Promise<void>;
  setDetectionClasses(classes: string[]): Promise<void>;
}

// ==================== 物体检测模块接口 ====================

export interface ObjectDetectionInterface {
  initialize(modelPath: string): Promise<boolean>;
  detect(frame: string): Promise<DetectionResult[]>;
  setConfidenceThreshold(threshold: number): Promise<void>;
  setMaxDetections(max: number): Promise<void>;
  isModelLoaded(): Promise<boolean>;
  release(): Promise<void>;
}

export interface DetectionResult {
  classId: number;
  className: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  worldPosition?: {
    x: number;
    y: number;
    z: number;
  };
}

// ==================== 颜色检测模块接口 ====================

export interface ColorDetectionInterface {
  getDominantColor(imagePath: string): Promise<DominantColor>;
  getColors(imagePath: string, count: number): Promise<DominantColor[]>;
}

export interface DominantColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage: number;
}

// ==================== 震动反馈模块接口 ====================

export interface HapticInterface {
  impact(style: 'light' | 'medium' | 'heavy'): Promise<void>;
  notification(type: 'success' | 'warning' | 'error'): Promise<void>;
  selection(): Promise<void>;
}

// ==================== 原生模块实例 ====================

export const NativeModules_Tianmu = {
  ARKit: NativeModules.ARKitModule as ARModuleInterface,
  ARCore: NativeModules.ARCoreModule as ARModuleInterface,
  ObjectDetection: NativeModules.ObjectDetectionModule as ObjectDetectionInterface,
  ColorDetection: NativeModules.ColorDetectionModule as ColorDetectionInterface,
  Haptic: NativeModules.HapticModule as HapticInterface,
};

// ==================== 事件类型 ====================

export interface AREventTypes {
  onObjectDetected: (result: DetectionResult) => void;
  onCameraUpdated: (position: { x: number; y: number; z: number }) => void;
  onSessionFailed: (error: { code: number; message: string }) => void;
  onTrackingStateChanged: (state: 'normal' | 'limited' | 'notAvailable') => void;
}

// ==================== 模拟模块（开发环境使用） ====================

export class MockARModule implements ARModuleInterface {
  private isInitialized = false;
  private detectionEnabled = false;

  async initialize(): Promise<boolean> {
    this.isInitialized = true;
    console.log('[MockAR] 初始化完成');
    return true;
  }

  async startSession(): Promise<void> {
    if (!this.isInitialized) throw new Error('AR未初始化');
    console.log('[MockAR] 会话已启动');
  }

  async stopSession(): Promise<void> {
    console.log('[MockAR] 会话已停止');
  }

  async addAnchor(position: { x: number; y: number; z: number }): Promise<string> {
    return `anchor_${Date.now()}`;
  }

  async removeAnchor(id: string): Promise<void> {
    console.log(`[MockAR] 移除锚点: ${id}`);
  }

  async getCameraPosition(): Promise<{ x: number; y: number; z: number }> {
    return { x: 0, y: 0, z: -1 };
  }

  async getCameraRotation(): Promise<{ x: number; y: number; z: number; w: number }> {
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  async isARSupported(): Promise<boolean> {
    return true;
  }

  async setDetectionEnabled(enabled: boolean): Promise<void> {
    this.detectionEnabled = enabled;
  }

  async setDetectionClasses(classes: string[]): Promise<void> {
    console.log(`[MockAR] 设置检测类别: ${classes.join(', ')}`);
  }
}

export class MockObjectDetection implements ObjectDetectionInterface {
  private modelLoaded = false;
  private confidenceThreshold = 0.5;
  private maxDetections = 10;

  async initialize(modelPath: string): Promise<boolean> {
    this.modelLoaded = true;
    console.log(`[MockDetection] 模型加载: ${modelPath}`);
    return true;
  }

  async detect(frame: string): Promise<DetectionResult[]> {
    if (!this.modelLoaded) return [];
    
    const mockResults: DetectionResult[] = [
      {
        classId: 1,
        className: 'plant',
        confidence: 0.85 + Math.random() * 0.1,
        boundingBox: {
          x: Math.random() * 200,
          y: Math.random() * 200,
          width: 80 + Math.random() * 100,
          height: 80 + Math.random() * 100,
        },
        worldPosition: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          z: -1 - Math.random(),
        },
      },
    ];
    
    return mockResults.slice(0, this.maxDetections)
      .filter(r => r.confidence >= this.confidenceThreshold);
  }

  async setConfidenceThreshold(threshold: number): Promise<void> {
    this.confidenceThreshold = threshold;
  }

  async setMaxDetections(max: number): Promise<void> {
    this.maxDetections = max;
  }

  async isModelLoaded(): Promise<boolean> {
    return this.modelLoaded;
  }

  async release(): Promise<void> {
    this.modelLoaded = false;
  }
}

export class MockColorDetection implements ColorDetectionInterface {
  async getDominantColor(imagePath: string): Promise<DominantColor> {
    const colors = ['green', 'red', 'yellow', 'white', 'black'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const colorMap: Record<string, DominantColor> = {
      green: { hex: '#4CAF50', rgb: { r: 76, g: 175, b: 80 }, hsl: { h: 122, s: 39, l: 49 }, percentage: 1 },
      red: { hex: '#F44336', rgb: { r: 244, g: 67, b: 54 }, hsl: { h: 4, s: 90, l: 58 }, percentage: 1 },
      yellow: { hex: '#FFC107', rgb: { r: 255, g: 193, b: 7 }, hsl: { h: 46, s: 100, l: 51 }, percentage: 1 },
      white: { hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 }, hsl: { h: 0, s: 0, l: 100 }, percentage: 1 },
      black: { hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, hsl: { h: 0, s: 0, l: 0 }, percentage: 1 },
    };
    
    return colorMap[randomColor];
  }

  async getColors(imagePath: string, count: number): Promise<DominantColor[]> {
    const colors = await this.getDominantColor(imagePath);
    return Array(count).fill(colors);
  }
}

export class MockHaptic implements HapticInterface {
  async impact(style: 'light' | 'medium' | 'heavy'): Promise<void> {
    console.log(`[MockHaptic] 触感反馈: ${style}`);
  }

  async notification(type: 'success' | 'warning' | 'error'): Promise<void> {
    console.log(`[MockHaptic] 通知: ${type}`);
  }

  async selection(): Promise<void> {
    console.log('[MockHaptic] 选择反馈');
  }
}

// ==================== 模块工厂 ====================

export function getARModule(): ARModuleInterface {
  const { ARKitModule, ARCoreModule } = NativeModules;
  
  if (ARKitModule) return ARKitModule;
  if (ARCoreModule) return ARCoreModule;
  
  console.warn('原生AR模块未找到，使用模拟模块');
  return new MockARModule();
}

export function getObjectDetectionModule(): ObjectDetectionInterface {
  const { ObjectDetectionModule } = NativeModules;
  
  if (ObjectDetectionModule) return ObjectDetectionModule;
  
  console.warn('原生物体检测模块未找到，使用模拟模块');
  return new MockObjectDetection();
}

export function getColorDetectionModule(): ColorDetectionInterface {
  const { ColorDetectionModule } = NativeModules;
  
  if (ColorDetectionModule) return ColorDetectionModule;
  
  console.warn('原生颜色检测模块未找到，使用模拟模块');
  return new MockColorDetection();
}

export function getHapticModule(): HapticInterface {
  const { HapticModule } = NativeModules;
  
  if (HapticModule) return HapticModule;
  
  return new MockHaptic();
}
