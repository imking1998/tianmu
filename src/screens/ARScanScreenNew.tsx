/**
 * AR实时扫描屏幕 - 集成TensorFlow.js物体识别
 * 实现真正的AR体验：相机实时预览 + AI物体检测 + 虚拟标签叠加
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import {
  analyzeItem,
  wuxingToEn,
  ItemFeatures,
  UserDestiny,
  WuXing,
} from '../services/TianmuCore';
import {
  initializeDetection,
  detectObjects,
  getDetectionStatus,
  DetectionResult,
} from '../services/ObjectDetection';

const { width, height } = Dimensions.get('window');

// 设计系统
const COLORS = {
  background: '#000000',
  gold: '#C9A962',
  goldLight: '#E8D5A3',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',
  wuxing: {
    wood: '#5B8C5A',
    fire: '#C75B5B',
    earth: '#8B8B8B',
    metal: '#C9A962',
    water: '#5B7C9A',
  },
  beneficial: '#5B8C5A',
  harmful: '#C75B5B',
};

// 五行数据
const WU_XING_DATA: Record<string, { name: string; color: string }> = {
  wood: { name: '木', color: COLORS.wuxing.wood },
  fire: { name: '火', color: COLORS.wuxing.fire },
  earth: { name: '土', color: COLORS.wuxing.earth },
  metal: { name: '金', color: COLORS.wuxing.metal },
  water: { name: '水', color: COLORS.wuxing.water },
};

// 五行图标映射
const WUXING_ICONS: Record<WuXing, string> = {
  '木': '🌿',
  '火': '🔥',
  '土': '🏺',
  '金': '⚙️',
  '水': '💧',
};

// 检测到的物品接口
interface DetectedItem {
  id: number;
  detection: DetectionResult;
  x: number;
  y: number;
  isBeneficial: boolean;
  qiScore: number;
  scale: Animated.Value;
  opacity: Animated.Value;
}

// AR标签组件
function ARLabel({ 
  item,
}: { 
  item: DetectedItem;
}) {
  const wxColor = WU_XING_DATA[wuxingToEn(item.detection.wuxing)]?.color || COLORS.gold;
  const icon = WUXING_ICONS[item.detection.wuxing];
  
  return (
    <Animated.View 
      style={[
        styles.arLabel,
        {
          left: item.x,
          top: item.y,
          transform: [{ scale: item.scale }],
          opacity: item.opacity,
        }
      ]}
    >
      <View style={styles.labelLine} />
      
      <View style={[styles.labelBody, { borderColor: wxColor + '60' }]}>
        <View style={[styles.labelIcon, { backgroundColor: wxColor + '30' }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        
        <View style={styles.labelContent}>
          <Text style={styles.labelName}>{item.detection.displayName}</Text>
          <View style={styles.labelInfo}>
            <View style={[styles.wuxingDot, { backgroundColor: wxColor }]} />
            <Text style={[styles.wuxingLabel, { color: wxColor }]}>{item.detection.wuxing}</Text>
            <Text style={[styles.qiScore, { color: item.qiScore > 0 ? COLORS.beneficial : COLORS.harmful }]}>
              {item.qiScore > 0 ? '+' : ''}{item.qiScore}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.labelStatus,
          { backgroundColor: item.isBeneficial ? COLORS.beneficial + '30' : COLORS.harmful + '30' }
        ]}>
          <Text style={[
            styles.labelStatusText,
            { color: item.isBeneficial ? COLORS.beneficial : COLORS.harmful }
          ]}>
            {item.isBeneficial ? '喜' : '忌'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// 扫描粒子效果
function ScanParticle({ delay }: { delay: number }) {
  const particleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(particleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        particleAnim.setValue(0);
        opacityAnim.setValue(0);
        animate();
      });
    };
    animate();
  }, []);
  
  const translateY = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, -100],
  });
  
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          opacity: opacityAnim,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

interface ARScanScreenProps {
  userDestiny: UserDestiny | null;
  onBack: () => void;
}

export default function ARScanScreen({ userDestiny, onBack }: ARScanScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  
  const scanPulseAnim = useRef(new Animated.Value(1)).current;
  const frameAnim = useRef(new Animated.Value(0)).current;
  const idCounter = useRef(0);
  const cameraRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // 初始化TensorFlow模型
  useEffect(() => {
    const initModel = async () => {
      try {
        setModelStatus('loading');
        const success = await initializeDetection();
        setModelStatus(success ? 'ready' : 'error');
        console.log('模型初始化:', success ? '成功' : '失败');
      } catch (error) {
        console.error('模型初始化错误:', error);
        setModelStatus('error');
      }
    };
    
    initModel();
  }, []);
  
  // 扫描脉冲动画
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanPulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scanPulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      Animated.loop(
        Animated.timing(frameAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isScanning]);
  
  // 实时物体检测（Web平台）
  useEffect(() => {
    if (!isScanning || modelStatus !== 'ready' || !userDestiny || Platform.OS !== 'web') {
      return;
    }
    
    const detectInterval = setInterval(async () => {
      const now = Date.now();
      if (now - lastDetectionTime < 1000) return; // 限制检测频率
      
      try {
        // 获取视频元素
        const video = document.querySelector('video');
        if (!video || video.readyState < 2) return;
        
        setLastDetectionTime(now);
        
        // 执行检测
        const detections = await detectObjects(video);
        
        if (detections.length > 0) {
          // 处理检测结果
          const newItems: DetectedItem[] = detections.slice(0, 5).map(detection => {
            // 计算标签位置（基于检测框）
            const x = Math.min(Math.max(detection.bbox[0], 50), width - 200);
            const y = Math.min(Math.max(detection.bbox[1], 150), height - 300);
            
            const isBeneficial = userDestiny.strength.xiYong.includes(detection.wuxing);
            
            // 计算气分数（基于置信度和五行关系）
            const qiScore = Math.round(
              (isBeneficial ? 1 : -1) * 
              detection.confidence * 
              detection.wuxingConfidence * 
              30
            );
            
            return {
              id: idCounter.current++,
              detection,
              x,
              y,
              isBeneficial,
              qiScore,
              scale: new Animated.Value(0),
              opacity: new Animated.Value(0),
            };
          });
          
          // 更新检测到的物品
          setDetectedItems(prev => {
            // 合并新旧检测结果，避免重复
            const existingClasses = new Set(prev.map(item => item.detection.className));
            const uniqueNewItems = newItems.filter(
              item => !existingClasses.has(item.detection.className)
            );
            
            // 限制最大数量
            const combined = [...prev, ...uniqueNewItems].slice(-6);
            return combined;
          });
          
          // 入场动画
          newItems.forEach(item => {
            Animated.parallel([
              Animated.spring(item.scale, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
              }),
              Animated.timing(item.opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start();
          });
        }
      } catch (error) {
        console.error('检测错误:', error);
      }
    }, 1500);
    
    return () => clearInterval(detectInterval);
  }, [isScanning, modelStatus, userDestiny, lastDetectionTime]);
  
  // 清除所有标签
  const clearLabels = () => {
    detectedItems.forEach(item => {
      Animated.parallel([
        Animated.timing(item.scale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(item.opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
    setTimeout(() => setDetectedItems([]), 250);
  };
  
  // 权限请求界面
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>正在请求相机权限...</Text>
        </View>
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>需要相机权限</Text>
          <Text style={styles.permissionText}>
            天目需要使用相机来识别周围物品的五行属性
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>授权相机访问</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const frameRotate = frameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      
      <View style={styles.overlay}>
        {/* 顶部导航 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>天目AR</Text>
          <TouchableOpacity onPress={clearLabels} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>清除</Text>
          </TouchableOpacity>
        </View>
        
        {/* 模型状态指示器 */}
        <View style={styles.modelStatusContainer}>
          <View style={[
            styles.modelStatusDot,
            { backgroundColor: modelStatus === 'ready' ? COLORS.beneficial : 
                            modelStatus === 'loading' ? COLORS.gold : COLORS.harmful }
          ]} />
          <Text style={styles.modelStatusText}>
            {modelStatus === 'ready' ? 'AI就绪' : 
             modelStatus === 'loading' ? '加载模型...' : '模型错误'}
          </Text>
        </View>
        
        {/* AR标签层 */}
        <View style={styles.arLayer}>
          {detectedItems.map(item => (
            <ARLabel key={item.id} item={item} />
          ))}
        </View>
        
        {/* 扫描粒子效果 */}
        <View style={styles.particleContainer}>
          {[0, 1, 2, 3, 4].map(i => (
            <ScanParticle key={i} delay={i * 400} />
          ))}
        </View>
        
        {/* 中心扫描指示器 */}
        <View style={styles.scanIndicator}>
          <Animated.View 
            style={[
              styles.scanRing,
              { transform: [{ scale: scanPulseAnim }] }
            ]}
          />
          <Animated.View 
            style={[
              styles.scanRingInner,
              { transform: [{ scale: scanPulseAnim }] }
            ]}
          />
          <View style={styles.scanCenter}>
            <Text style={styles.scanCenterText}>天目</Text>
          </View>
        </View>
        
        {/* 边角装饰 */}
        <Animated.View 
          style={[
            styles.cornerDecor,
            styles.cornerTopLeft,
            { transform: [{ rotate: frameRotate }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.cornerDecor,
            styles.cornerTopRight,
            { transform: [{ rotate: frameRotate }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.cornerDecor,
            styles.cornerBottomLeft,
            { transform: [{ rotate: frameRotate }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.cornerDecor,
            styles.cornerBottomRight,
            { transform: [{ rotate: frameRotate }] }
          ]}
        />
        
        {/* 底部信息栏 */}
        <View style={styles.bottomBar}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isScanning && modelStatus === 'ready' ? COLORS.beneficial : COLORS.harmful }]} />
            <Text style={styles.statusText}>
              {modelStatus === 'loading' ? '加载AI模型...' :
               modelStatus === 'error' ? 'AI模型加载失败' :
               isScanning ? '正在扫描...' : '已暂停'}
            </Text>
          </View>
          
          <Text style={styles.itemCount}>
            检测到 {detectedItems.length} 个物品
          </Text>
          
          {!userDestiny && (
            <Text style={styles.warningText}>
              请先输入出生信息
            </Text>
          )}
        </View>
        
        {/* 控制按钮 */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setIsScanning(!isScanning)}
            disabled={modelStatus !== 'ready'}
          >
            <LinearGradient
              colors={modelStatus !== 'ready' ? ['#333', '#444'] :
                      isScanning ? ['#333', '#444'] : [COLORS.gold, COLORS.goldLight]}
              style={styles.controlButtonGradient}
            >
              <Text style={styles.controlButtonText}>
                {modelStatus !== 'ready' ? '加载中' :
                 isScanning ? '暂停' : '继续'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: COLORS.gold,
    fontSize: 14,
  },
  modelStatusContainer: {
    position: 'absolute',
    top: 110,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modelStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  modelStatusText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  permissionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  arLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  arLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  labelLine: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  labelBody: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  labelIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 18,
  },
  labelContent: {
    flex: 1,
  },
  labelName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  labelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wuxingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  wuxingLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  qiScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  labelStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  scanIndicator: {
    position: 'absolute',
    top: height / 2 - 60,
    left: width / 2 - 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.gold + '40',
  },
  scanRingInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: COLORS.gold + '60',
  },
  scanCenter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  scanCenterText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  cornerDecor: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: COLORS.gold + '30',
  },
  cornerTopLeft: {
    top: 100,
    left: 30,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 100,
    right: 30,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 150,
    left: 30,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 150,
    right: 30,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  itemCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  warningText: {
    color: COLORS.gold,
    fontSize: 11,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  controlButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
  },
  controlButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '600',
  },
});
