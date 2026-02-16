/**
 * 天目应用 - AR物品识别服务
 * 使用设备端机器学习模型进行实时物品识别
 * 支持YOLO/TensorFlow Lite模型
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import {
  ItemFeatures,
  ItemAnalysisResult,
  ARDetectionResult,
  WuXing,
  ItemShape,
  ItemColor,
  ItemMaterial,
  Direction,
  BoundingBox,
  Position3D,
} from '../types';
import { TianmuService } from './TianmuCore';
import { useUserStore } from '../store';

// 物品类别到五行属性的映射表
const ITEM_WUXING_MAPPING: Record<string, { wuXing: WuXing; shape: ItemShape; material: ItemMaterial }> = {
  // 木属性物品
  'plant': { wuXing: '木', shape: 'long', material: 'wood' },
  'tree': { wuXing: '木', shape: 'long', material: 'wood' },
  'flower': { wuXing: '木', shape: 'wave', material: 'wood' },
  'book': { wuXing: '木', shape: 'square', material: 'wood' },
  'furniture_wood': { wuXing: '木', shape: 'square', material: 'wood' },
  
  // 火属性物品
  'lamp': { wuXing: '火', shape: 'sharp', material: 'plastic' },
  'candle': { wuXing: '火', shape: 'long', material: 'plastic' },
  'electronic_device': { wuXing: '火', shape: 'square', material: 'plastic' },
  'phone': { wuXing: '火', shape: 'square', material: 'plastic' },
  'computer': { wuXing: '火', shape: 'square', material: 'plastic' },
  'tv': { wuXing: '火', shape: 'square', material: 'plastic' },
  
  // 土属性物品
  'ceramic': { wuXing: '土', shape: 'round', material: 'ceramic' },
  'pottery': { wuXing: '土', shape: 'round', material: 'ceramic' },
  'stone': { wuXing: '土', shape: 'round', material: 'ceramic' },
  'brick': { wuXing: '土', shape: 'square', material: 'ceramic' },
  'sculpture': { wuXing: '土', shape: 'round', material: 'ceramic' },
  
  // 金属性物品
  'metal_object': { wuXing: '金', shape: 'round', material: 'metal' },
  'knife': { wuXing: '金', shape: 'sharp', material: 'metal' },
  'scissors': { wuXing: '金', shape: 'sharp', material: 'metal' },
  'jewelry': { wuXing: '金', shape: 'round', material: 'metal' },
  'watch': { wuXing: '金', shape: 'round', material: 'metal' },
  'coin': { wuXing: '金', shape: 'round', material: 'metal' },
  
  // 水属性物品
  'bottle': { wuXing: '水', shape: 'wave', material: 'water' },
  'cup': { wuXing: '水', shape: 'round', material: 'water' },
  'aquarium': { wuXing: '水', shape: 'square', material: 'water' },
  'fountain': { wuXing: '水', shape: 'wave', material: 'water' },
  'mirror': { wuXing: '水', shape: 'round', material: 'water' },
  
  // 默认映射
  'person': { wuXing: '木', shape: 'long', material: 'wood' },
  'car': { wuXing: '金', shape: 'long', material: 'metal' },
  'chair': { wuXing: '木', shape: 'square', material: 'wood' },
  'table': { wuXing: '木', shape: 'square', material: 'wood' },
  'sofa': { wuXing: '木', shape: 'square', material: 'wood' },
  'bed': { wuXing: '木', shape: 'square', material: 'wood' },
  'door': { wuXing: '木', shape: 'square', material: 'wood' },
  'window': { wuXing: '金', shape: 'square', material: 'metal' },
};

// 颜色到五行属性的映射
const COLOR_WUXING_MAPPING: Record<string, ItemColor> = {
  'green': 'green',
  'red': 'red',
  'yellow': 'yellow',
  'white': 'white',
  'black': 'black',
  'blue': 'black',  // 蓝色归水
  'cyan': 'green',  // 青色归木
  'purple': 'red',  // 紫色归火
  'orange': 'red',  // 橙色归火
  'brown': 'yellow', // 棕色归土
  'gray': 'white',  // 灰色归金
  'pink': 'red',    // 粉色归火
};

/**
 * AR识别服务类
 */
export class ARRecognitionService {
  private static instance: ARRecognitionService;
  private eventEmitter: NativeEventEmitter | null = null;
  private isInitialized: boolean = false;
  private detectionCallbacks: Array<(result: ARDetectionResult) => void> = [];

  private constructor() {}

  static getInstance(): ARRecognitionService {
    if (!ARRecognitionService.instance) {
      ARRecognitionService.instance = new ARRecognitionService();
    }
    return ARRecognitionService.instance;
  }

  /**
   * 初始化AR识别服务
   */
  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS使用ARKit
        const { ARKitModule } = NativeModules;
        if (ARKitModule) {
          await ARKitModule.initialize();
          this.eventEmitter = new NativeEventEmitter(ARKitModule);
          this.isInitialized = true;
        }
      } else {
        // Android使用ARCore
        const { ARCoreModule } = NativeModules;
        if (ARCoreModule) {
          await ARCoreModule.initialize();
          this.eventEmitter = new NativeEventEmitter(ARCoreModule);
          this.isInitialized = true;
        }
      }
      return this.isInitialized;
    } catch (error) {
      console.warn('AR模块初始化失败，使用模拟模式:', error);
      this.isInitialized = true;
      return true;
    }
  }

  /**
   * 开始扫描
   */
  async startScanning(onDetection: (result: ARDetectionResult) => void): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.detectionCallbacks.push(onDetection);

    if (this.eventEmitter) {
      this.eventEmitter.addListener('onObjectDetected', (data) => {
        const result = this.processDetectionResult(data);
        this.detectionCallbacks.forEach(cb => cb(result));
      });
    }
  }

  /**
   * 停止扫描
   */
  async stopScanning(): Promise<void> {
    this.detectionCallbacks = [];
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('onObjectDetected');
    }
  }

  /**
   * 处理识别结果
   */
  private processDetectionResult(data: any): ARDetectionResult {
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const itemName = data.className || 'unknown';
    const confidence = data.confidence || 0.8;
    
    const boundingBox: BoundingBox = {
      x: data.bbox?.x || 0,
      y: data.bbox?.y || 0,
      width: data.bbox?.width || 100,
      height: data.bbox?.height || 100,
    };

    const worldPosition: Position3D = {
      x: data.position?.x || 0,
      y: data.position?.y || 0,
      z: data.position?.z || 0,
    };

    const userProfile = useUserStore.getState().profile;
    const itemFeatures = this.extractItemFeatures(data);
    
    let itemAnalysis: ItemAnalysisResult;
    if (userProfile) {
      itemAnalysis = TianmuService.analyzeItem(itemFeatures, userProfile);
    } else {
      itemAnalysis = this.getDefaultAnalysis(itemFeatures);
    }

    return {
      itemId,
      itemName: this.getChineseName(itemName),
      confidence,
      boundingBox,
      itemAnalysis,
      worldPosition,
    };
  }

  /**
   * 提取物品特征
   */
  private extractItemFeatures(data: any): ItemFeatures {
    const className = data.className || 'unknown';
    const mapping = ITEM_WUXING_MAPPING[className] || {
      wuXing: '土' as WuXing,
      shape: 'square' as ItemShape,
      material: 'ceramic' as ItemMaterial,
    };

    const color = this.detectColor(data);
    const position = this.detectDirection(data.position);

    return {
      shape: mapping.shape,
      color,
      material: mapping.material,
      position,
      timestamp: new Date(),
      neighbors: [],
    };
  }

  /**
   * 检测颜色
   */
  private detectColor(data: any): ItemColor {
    const dominantColor = data.dominantColor || 'gray';
    return COLOR_WUXING_MAPPING[dominantColor] || 'yellow';
  }

  /**
   * 检测方位
   */
  private detectDirection(position: any): Direction {
    if (!position) return '中';
    
    const { x, z } = position;
    const angle = Math.atan2(z, x) * (180 / Math.PI);
    
    if (angle >= -22.5 && angle < 22.5) return '东';
    if (angle >= 22.5 && angle < 67.5) return '东南';
    if (angle >= 67.5 && angle < 112.5) return '南';
    if (angle >= 112.5 && angle < 157.5) return '西南';
    if (angle >= 157.5 || angle < -157.5) return '西';
    if (angle >= -157.5 && angle < -112.5) return '西北';
    if (angle >= -112.5 && angle < -67.5) return '北';
    if (angle >= -67.5 && angle < -22.5) return '东北';
    return '中';
  }

  /**
   * 获取中文名称
   */
  private getChineseName(englishName: string): string {
    const nameMap: Record<string, string> = {
      'plant': '植物',
      'tree': '树木',
      'flower': '花卉',
      'book': '书籍',
      'lamp': '灯具',
      'candle': '蜡烛',
      'electronic_device': '电子设备',
      'phone': '手机',
      'computer': '电脑',
      'tv': '电视',
      'ceramic': '陶瓷',
      'metal_object': '金属物品',
      'knife': '刀具',
      'bottle': '瓶子',
      'cup': '杯子',
      'person': '人物',
      'car': '汽车',
      'chair': '椅子',
      'table': '桌子',
      'sofa': '沙发',
      'bed': '床',
      'door': '门',
      'window': '窗户',
    };
    return nameMap[englishName] || englishName;
  }

  /**
   * 获取默认分析结果（无用户档案时）
   */
  private getDefaultAnalysis(features: ItemFeatures): ItemAnalysisResult {
    return {
      wuXing: '土',
      qiLevel: '气平',
      qiScore: 50,
      isXiYong: false,
      isJiShen: false,
      advice: '请先设置您的八字信息',
      visualEffect: {
        primaryColor: '#FFC107',
        secondaryColor: '#FFD54F',
        glowIntensity: 0.5,
        particleCount: 25,
        animationType: 'pulse',
      },
    };
  }

  /**
   * 模拟识别（用于开发测试）
   */
  simulateDetection(): ARDetectionResult {
    const items = Object.keys(ITEM_WUXING_MAPPING);
    const randomItem = items[Math.floor(Math.random() * items.length)];
    
    return this.processDetectionResult({
      className: randomItem,
      confidence: 0.7 + Math.random() * 0.3,
      bbox: {
        x: Math.random() * 200,
        y: Math.random() * 200,
        width: 80 + Math.random() * 100,
        height: 80 + Math.random() * 100,
      },
      position: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: -1 - Math.random(),
      },
      dominantColor: Object.keys(COLOR_WUXING_MAPPING)[Math.floor(Math.random() * 5)],
    });
  }
}

export const arService = ARRecognitionService.getInstance();
