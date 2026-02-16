/**
 * 物体识别服务
 * 支持Web和React Native双平台
 * Web平台使用TensorFlow.js浏览器版本
 * React Native平台使用tfjs-react-native
 */

import { Platform } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { WuXing } from './TianmuCore';

// 检测结果接口
export interface DetectionResult {
  className: string;      // COCO类别名称
  confidence: number;     // 置信度 0-1
  bbox: [number, number, number, number]; // [x, y, width, height]
  wuxing: WuXing;         // 对应的五行属性
  wuxingConfidence: number; // 五行映射置信度
  displayName: string;    // 中文显示名称
}

// COCO类别到五行的映射
const COCO_TO_WUXING: Record<string, { wuxing: WuXing; displayName: string; confidence: number }> = {
  // 木 - 植物、木质物品、生长之物
  'potted plant': { wuxing: '木', displayName: '盆栽植物', confidence: 0.95 },
  'plant': { wuxing: '木', displayName: '植物', confidence: 0.9 },
  'tree': { wuxing: '木', displayName: '树木', confidence: 0.95 },
  'chair': { wuxing: '木', displayName: '椅子', confidence: 0.7 },
  'dining table': { wuxing: '木', displayName: '餐桌', confidence: 0.7 },
  'bed': { wuxing: '木', displayName: '床', confidence: 0.6 },
  'book': { wuxing: '木', displayName: '书籍', confidence: 0.8 },
  'clock': { wuxing: '木', displayName: '时钟', confidence: 0.5 },
  'vase': { wuxing: '木', displayName: '花瓶', confidence: 0.6 },
  'toothbrush': { wuxing: '木', displayName: '牙刷', confidence: 0.5 },
  
  // 火 - 电子设备、光源、红色物品
  'tv': { wuxing: '火', displayName: '电视', confidence: 0.85 },
  'laptop': { wuxing: '火', displayName: '笔记本电脑', confidence: 0.8 },
  'mouse': { wuxing: '火', displayName: '鼠标', confidence: 0.7 },
  'remote': { wuxing: '火', displayName: '遥控器', confidence: 0.75 },
  'keyboard': { wuxing: '火', displayName: '键盘', confidence: 0.75 },
  'cell phone': { wuxing: '火', displayName: '手机', confidence: 0.85 },
  'microwave': { wuxing: '火', displayName: '微波炉', confidence: 0.8 },
  'oven': { wuxing: '火', displayName: '烤箱', confidence: 0.85 },
  'toaster': { wuxing: '火', displayName: '烤面包机', confidence: 0.85 },
  'hair drier': { wuxing: '火', displayName: '吹风机', confidence: 0.9 },
  
  // 土 - 陶瓷、石材、方形物品
  'bowl': { wuxing: '土', displayName: '碗', confidence: 0.8 },
  'cup': { wuxing: '土', displayName: '杯子', confidence: 0.7 },
  'wine glass': { wuxing: '土', displayName: '酒杯', confidence: 0.6 },
  'bottle': { wuxing: '土', displayName: '瓶子', confidence: 0.6 },
  'teddy bear': { wuxing: '土', displayName: '泰迪熊', confidence: 0.5 },
  'cake': { wuxing: '土', displayName: '蛋糕', confidence: 0.7 },
  'donut': { wuxing: '土', displayName: '甜甜圈', confidence: 0.6 },
  'pizza': { wuxing: '土', displayName: '披萨', confidence: 0.6 },
  'sandwich': { wuxing: '土', displayName: '三明治', confidence: 0.6 },
  'hot dog': { wuxing: '土', displayName: '热狗', confidence: 0.6 },
  
  // 金 - 金属制品、白色物品、锐利物品
  'fork': { wuxing: '金', displayName: '叉子', confidence: 0.8 },
  'knife': { wuxing: '金', displayName: '刀', confidence: 0.85 },
  'spoon': { wuxing: '金', displayName: '勺子', confidence: 0.8 },
  'scissors': { wuxing: '金', displayName: '剪刀', confidence: 0.9 },
  'refrigerator': { wuxing: '金', displayName: '冰箱', confidence: 0.75 },
  'sink': { wuxing: '金', displayName: '水槽', confidence: 0.7 },
  'car': { wuxing: '金', displayName: '汽车', confidence: 0.8 },
  'bicycle': { wuxing: '金', displayName: '自行车', confidence: 0.75 },
  'motorcycle': { wuxing: '金', displayName: '摩托车', confidence: 0.8 },
  'bus': { wuxing: '金', displayName: '公交车', confidence: 0.8 },
  'train': { wuxing: '金', displayName: '火车', confidence: 0.8 },
  'truck': { wuxing: '金', displayName: '卡车', confidence: 0.8 },
  'traffic light': { wuxing: '金', displayName: '交通灯', confidence: 0.7 },
  'fire hydrant': { wuxing: '金', displayName: '消防栓', confidence: 0.7 },
  'stop sign': { wuxing: '金', displayName: '停车标志', confidence: 0.7 },
  'parking meter': { wuxing: '金', displayName: '停车计时器', confidence: 0.75 },
  
  // 水 - 液体、流动之物、黑色/蓝色物品
  'umbrella': { wuxing: '水', displayName: '雨伞', confidence: 0.8 },
  'boat': { wuxing: '水', displayName: '船', confidence: 0.9 },
  'surfboard': { wuxing: '水', displayName: '冲浪板', confidence: 0.85 },
  'skis': { wuxing: '水', displayName: '滑雪板', confidence: 0.6 },
  'snowboard': { wuxing: '水', displayName: '滑雪板', confidence: 0.6 },
  
  // 人物 - 根据场景判断
  'person': { wuxing: '土', displayName: '人', confidence: 0.5 },
  'dog': { wuxing: '土', displayName: '狗', confidence: 0.5 },
  'cat': { wuxing: '土', displayName: '猫', confidence: 0.5 },
  'bird': { wuxing: '木', displayName: '鸟', confidence: 0.6 },
  'horse': { wuxing: '火', displayName: '马', confidence: 0.6 },
  'sheep': { wuxing: '土', displayName: '羊', confidence: 0.5 },
  'cow': { wuxing: '土', displayName: '牛', confidence: 0.5 },
  'elephant': { wuxing: '土', displayName: '大象', confidence: 0.5 },
  'bear': { wuxing: '土', displayName: '熊', confidence: 0.5 },
  'zebra': { wuxing: '金', displayName: '斑马', confidence: 0.5 },
  'giraffe': { wuxing: '木', displayName: '长颈鹿', confidence: 0.5 },
  
  // 其他常见物品
  'backpack': { wuxing: '木', displayName: '背包', confidence: 0.6 },
  'handbag': { wuxing: '土', displayName: '手提包', confidence: 0.6 },
  'suitcase': { wuxing: '土', displayName: '行李箱', confidence: 0.6 },
  'tie': { wuxing: '火', displayName: '领带', confidence: 0.5 },
  'kite': { wuxing: '木', displayName: '风筝', confidence: 0.7 },
  'skateboard': { wuxing: '木', displayName: '滑板', confidence: 0.7 },
  'tennis racket': { wuxing: '木', displayName: '网球拍', confidence: 0.75 },
};

// 默认五行（当物品未在映射表中时）
const DEFAULT_WUXING: WuXing = '土';

// 物体识别服务类
class ObjectDetectionService {
  private model: cocoSsd.ObjectDetection | null = null;
  private isLoading: boolean = false;
  private isReady: boolean = false;
  private platform: string = Platform.OS;

  /**
   * 初始化模型
   * 根据平台自动选择初始化方式
   */
  async initialize(): Promise<boolean> {
    if (this.isReady || this.isLoading) {
      return this.isReady;
    }

    this.isLoading = true;
    
    try {
      console.log('正在初始化TensorFlow.js...');
      console.log('当前平台:', this.platform);
      
      // Web平台初始化
      if (this.platform === 'web') {
        await tf.ready();
        console.log('TensorFlow.js Web后端已就绪:', tf.getBackend());
      } else {
        // React Native平台初始化
        try {
          // 尝试加载React Native专用模块
          const tfjsReactNative = require('@tensorflow/tfjs-react-native');
          await tfjsReactNative.ready();
          console.log('TensorFlow.js React Native后端已就绪');
        } catch (rnError) {
          console.log('React Native模块不可用，使用默认后端');
          await tf.ready();
        }
      }
      
      console.log('TensorFlow.js 已就绪，后端:', tf.getBackend());
      
      // 加载COCO-SSD模型
      console.log('正在加载COCO-SSD模型...');
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2',
      });
      
      this.isReady = true;
      this.isLoading = false;
      console.log('COCO-SSD 模型加载完成！');
      
      return true;
    } catch (error) {
      console.error('模型加载失败:', error);
      this.isLoading = false;
      this.isReady = false;
      return false;
    }
  }

  /**
   * 检测图像中的物体
   * @param image - 图像数据（HTMLImageElement或图像URI）
   */
  async detect(image: any): Promise<DetectionResult[]> {
    if (!this.isReady || !this.model) {
      console.warn('模型未初始化');
      return [];
    }

    try {
      let tensor: tf.Tensor3D;
      
      // Web平台处理
      if (this.platform === 'web') {
        if (image instanceof HTMLImageElement || image instanceof Image) {
          tensor = tf.browser.fromPixels(image as HTMLImageElement);
        } else if (typeof image === 'string') {
          // 从URL加载图像
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = image;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('图像加载失败'));
          });
          tensor = tf.browser.fromPixels(img);
        } else {
          console.error('Web平台不支持的图像格式');
          return [];
        }
      } else {
        // React Native平台处理
        if (typeof image === 'string') {
          // 从URI加载
          const img = new Image();
          img.src = image;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
          tensor = tf.browser.fromPixels(img as any);
        } else {
          console.error('React Native平台不支持的图像格式');
          return [];
        }
      }
      
      // 执行检测
      const predictions = await this.model.detect(tensor);
      
      // 清理tensor
      tensor.dispose();
      
      return predictions
        .filter(pred => pred.score > 0.5)
        .map(pred => {
          const className = pred.class;
          const mapping = COCO_TO_WUXING[className] || {
            wuxing: DEFAULT_WUXING,
            displayName: className,
            confidence: 0.3,
          };
          
          return {
            className,
            confidence: pred.score,
            bbox: [pred.bbox[0], pred.bbox[1], pred.bbox[2], pred.bbox[3]],
            wuxing: mapping.wuxing,
            wuxingConfidence: mapping.confidence,
            displayName: mapping.displayName,
          };
        });
    } catch (error) {
      console.error('检测失败:', error);
      return [];
    }
  }
  
  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isReady: this.isReady,
      isLoading: this.isLoading,
      platform: this.platform,
    };
  }
}

// 单例实例
const objectDetectionService = new ObjectDetectionService();

// 导出便捷函数
export async function initializeDetection(): Promise<boolean> {
  return objectDetectionService.initialize();
}

export async function detectObjects(image: any): Promise<DetectionResult[]> {
  return objectDetectionService.detect(image);
}

export function getDetectionStatus() {
  return objectDetectionService.getStatus();
}

// 导出映射表供其他模块使用
export { COCO_TO_WUXING };
