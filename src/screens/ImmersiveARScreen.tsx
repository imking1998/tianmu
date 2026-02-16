/**
 * 沉浸式AR扫描屏幕 - 真实物体识别
 * 道系古风 × 赛博朋克 × 游戏化玩法
 */

import React, { useState, useRef, useEffect } from 'react';
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
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';
import { QiParticles, TaiChi, Bagua, ScanLaser, EnergyOrb } from '../components/Effects';
import {
  initializeDetection,
  detectObjects,
  DetectionResult,
} from '../services/ObjectDetection';
import { UserDestiny, WuXing } from '../services/TianmuCore';

const { width, height } = Dimensions.get('window');

// 五行符文
const WUXING_RUNES: Record<WuXing, string> = {
  '木': '☰',
  '火': '☲',
  '土': '☷',
  '金': '☱',
  '水': '☵',
};

// 游戏化检测物品
interface GameItem {
  id: number;
  detection: DetectionResult;
  x: number;
  y: number;
  isBeneficial: boolean;
  qiScore: number;
  captured: boolean;
  scale: Animated.Value;
  opacity: Animated.Value;
}

interface ImmersiveARScreenProps {
  userDestiny: UserDestiny | null;
  onBack: () => void;
}

export default function ImmersiveARScreen({ userDestiny, onBack }: ImmersiveARScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [gameItems, setGameItems] = useState<GameItem[]>([]);
  const [capturedCount, setCapturedCount] = useState(0);
  const [totalQi, setTotalQi] = useState(0);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isScanning, setIsScanning] = useState(true);
  const [showCaptureEffect, setShowCaptureEffect] = useState(false);
  
  const cameraRef = useRef<any>(null);
  const scanProgress = useRef(new Animated.Value(0)).current;
  const baguaRotation = useRef(new Animated.Value(0)).current;
  const idCounter = useRef(0);
  const isDetecting = useRef(false);
  
  // 初始化AI模型
  useEffect(() => {
    const init = async () => {
      console.log('开始初始化物体检测模型...');
      const success = await initializeDetection();
      console.log('模型初始化结果:', success);
      setModelStatus(success ? 'ready' : 'error');
    };
    init();
  }, []);
  
  // 八卦旋转动画
  useEffect(() => {
    Animated.loop(
      Animated.timing(baguaRotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  
  // 扫描进度动画
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.timing(scanProgress, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isScanning]);
  
  // 真实物体检测循环
  useEffect(() => {
    if (!isScanning || modelStatus !== 'ready' || !userDestiny) return;
    
    const detectLoop = async () => {
      if (isDetecting.current || !cameraRef.current) return;
      
      isDetecting.current = true;
      
      try {
        // 从相机拍照进行检测
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
          base64: true,
          skipProcessing: true,
        });
        
        if (photo && photo.uri) {
          // 创建图像对象进行检测
          const image = new Image();
          image.src = photo.uri;
          
          // 等待图像加载
          await new Promise<void>((resolve) => {
            image.onload = () => resolve();
            image.onerror = () => resolve();
          });
          
          // 执行物体检测
          const detections = await detectObjects(image);
          
          if (detections.length > 0) {
            processDetections(detections);
          }
        }
      } catch (error) {
        console.log('检测循环错误:', error);
      }
      
      isDetecting.current = false;
    };
    
    // 每2秒检测一次
    const interval = setInterval(detectLoop, 2000);
    
    return () => clearInterval(interval);
  }, [isScanning, modelStatus, userDestiny]);
  
  // 处理检测结果
  const processDetections = (detections: DetectionResult[]) => {
    if (!userDestiny) return;
    
    const newItems: GameItem[] = detections.slice(0, 3).map(detection => {
      // 计算标签位置（基于检测框）
      const x = Math.min(Math.max(detection.bbox[0], 40), width - 180);
      const y = Math.min(Math.max(detection.bbox[1], 120), height - 250);
      const isBeneficial = userDestiny.strength.xiYong.includes(detection.wuxing);
      
      return {
        id: idCounter.current++,
        detection,
        x,
        y,
        isBeneficial,
        qiScore: Math.round((isBeneficial ? 1 : -1) * detection.confidence * 50),
        captured: false,
        scale: new Animated.Value(0),
        opacity: new Animated.Value(0),
      };
    });
    
    setGameItems(prev => {
      // 合并新旧检测结果，避免重复
      const existingClasses = new Set(prev.map(item => item.detection.className));
      const uniqueNewItems = newItems.filter(
        item => !existingClasses.has(item.detection.className)
      );
      
      // 限制最大数量
      const combined = [...prev, ...uniqueNewItems].slice(-5);
      
      // 入场动画
      uniqueNewItems.forEach(item => {
        Animated.parallel([
          Animated.spring(item.scale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.timing(item.opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      });
      
      return combined;
    });
  };
  
  // 捕获物品
  const captureItem = (item: GameItem) => {
    if (item.captured) return;
    
    // 震动反馈
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 50, 100, 50]);
    }
    
    // 捕获动画
    Animated.parallel([
      Animated.timing(item.scale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(item.opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setGameItems(prev => prev.filter(i => i.id !== item.id));
      setCapturedCount(prev => prev + 1);
      setTotalQi(prev => prev + item.qiScore);
      setShowCaptureEffect(true);
      setTimeout(() => setShowCaptureEffect(false), 500);
    });
  };
  
  // 清空所有
  const clearAll = () => {
    gameItems.forEach(item => {
      Animated.timing(item.opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    setTimeout(() => setGameItems([]), 250);
  };
  
  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionOverlay}>
          <TaiChi size={100} spinning={true} />
          <Text style={styles.permissionTitle}>开启天眼</Text>
          <Text style={styles.permissionText}>需要相机权限来洞察万物五行</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>授权</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const baguaRotate = baguaRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <View style={styles.container}>
      {/* 相机层 */}
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing="back"
      />
      
      {/* 粒子背景 */}
      <QiParticles count={30} color={COLORS.primary.jin} speed={0.8} />
      
      {/* AR叠加层 */}
      <View style={styles.overlay}>
        {/* 顶部HUD */}
        <View style={styles.topHUD}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.scoreBoard}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>捕获</Text>
              <Text style={styles.scoreValue}>{capturedCount}</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>灵气</Text>
              <Text style={[styles.scoreValue, { color: totalQi >= 0 ? COLORS.wuxing.wood.primary : COLORS.wuxing.fire.primary }]}>
                {totalQi > 0 ? '+' : ''}{totalQi}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {/* 模型状态 */}
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { 
            backgroundColor: modelStatus === 'ready' ? COLORS.wuxing.wood.primary : 
                            modelStatus === 'loading' ? COLORS.primary.jin : COLORS.wuxing.fire.primary 
          }]} />
          <Text style={styles.statusText}>
            {modelStatus === 'ready' ? '天眼已开' : 
             modelStatus === 'loading' ? '开启中...' : '开启失败'}
          </Text>
        </View>
        
        {/* 中央八卦阵 */}
        <View style={styles.baguaContainer}>
          <Animated.View style={{ transform: [{ rotate: baguaRotate }] }}>
            <Bagua size={180} />
          </Animated.View>
          <View style={styles.centerDot} />
        </View>
        
        {/* 扫描激光 */}
        {isScanning && <ScanLaser />}
        
        {/* 游戏物品层 */}
        <View style={styles.itemsLayer}>
          {gameItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                {
                  left: item.x,
                  top: item.y,
                  opacity: item.opacity,
                  transform: [{ scale: item.scale }],
                },
              ]}
              onPress={() => captureItem(item)}
              activeOpacity={0.8}
            >
              {/* 能量光环 */}
              <EnergyOrb 
                wuxing={item.detection.wuxing.toLowerCase() as any} 
                size={100} 
                intensity={Math.abs(item.qiScore) / 50}
              />
              
              {/* 符文 */}
              <View style={styles.runeContainer}>
                <Text style={[
                  styles.runeText,
                  { color: COLORS.wuxing[item.detection.wuxing.toLowerCase() as keyof typeof COLORS.wuxing]?.primary }
                ]}>
                  {WUXING_RUNES[item.detection.wuxing]}
                </Text>
              </View>
              
              {/* 物品信息 */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.detection.displayName}</Text>
                <View style={styles.itemStats}>
                  <Text style={[
                    styles.itemWuxing,
                    { color: COLORS.wuxing[item.detection.wuxing.toLowerCase() as keyof typeof COLORS.wuxing]?.primary }
                  ]}>
                    {item.detection.wuxing}
                  </Text>
                  <Text style={[
                    styles.itemScore,
                    { color: item.isBeneficial ? COLORS.wuxing.wood.primary : COLORS.wuxing.fire.primary }
                  ]}>
                    {item.qiScore > 0 ? '+' : ''}{item.qiScore}
                  </Text>
                </View>
                <Text style={styles.itemHint}>点击捕获</Text>
              </View>
              
              {/* 捕获效果 */}
              {item.isBeneficial && (
                <View style={styles.beneficialBadge}>
                  <Text style={styles.beneficialText}>喜</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* 捕获特效 */}
        {showCaptureEffect && (
          <View style={styles.captureEffect}>
            <View style={styles.captureRipple} />
          </View>
        )}
        
        {/* 底部控制 */}
        <View style={styles.bottomControls}>
          <View style={styles.scanStatus}>
            <View style={[styles.scanDot, { backgroundColor: isScanning ? COLORS.wuxing.wood.primary : COLORS.text.muted }]} />
            <Text style={styles.scanText}>
              {isScanning ? '正在洞察...' : '洞察暂停'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.controlButton, !isScanning && styles.controlButtonActive]}
            onPress={() => setIsScanning(!isScanning)}
          >
            <Text style={styles.controlText}>
              {isScanning ? '◼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.itemCount}>
            发现 {gameItems.length} 个灵物
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.deep,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // 权限界面
  permissionOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg.deep,
    gap: SPACING.lg,
  },
  permissionTitle: {
    fontSize: TYPOGRAPHY.display.h2.size,
    color: COLORS.text.gold,
    fontWeight: '700',
    letterSpacing: TYPOGRAPHY.display.h2.letterSpacing,
  },
  permissionText: {
    fontSize: TYPOGRAPHY.body.regular.size,
    color: COLORS.text.secondary,
  },
  permissionButton: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary.zhuSha,
    borderRadius: SPACING.lg,
    marginTop: SPACING.lg,
  },
  permissionButtonText: {
    fontSize: TYPOGRAPHY.body.large.size,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  
  // 顶部HUD
  topHUD: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary.jin + '40',
  },
  backText: {
    fontSize: 24,
    color: COLORS.text.primary,
  },
  scoreBoard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg.glass,
    borderRadius: SPACING.xl,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary.jin + '40',
  },
  scoreItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.gold,
  },
  scoreDivider: {
    width: 1,
    backgroundColor: COLORS.text.muted,
    marginHorizontal: SPACING.sm,
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.wuxing.fire.primary + '40',
  },
  clearText: {
    fontSize: 20,
    color: COLORS.wuxing.fire.primary,
  },
  
  // 状态徽章
  statusBadge: {
    position: 'absolute',
    top: 120,
    left: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.glass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.md,
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  
  // 八卦阵
  baguaContainer: {
    position: 'absolute',
    top: height / 2 - 100,
    left: width / 2 - 90,
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary.jin,
    shadowColor: COLORS.primary.jin,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  
  // 物品层
  itemsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  itemCard: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  runeContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runeText: {
    fontSize: 40,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  itemInfo: {
    position: 'absolute',
    top: 110,
    backgroundColor: COLORS.bg.glass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary.jin + '30',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  itemStats: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 2,
  },
  itemWuxing: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemHint: {
    fontSize: 10,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  beneficialBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.wuxing.wood.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beneficialText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  // 捕获特效
  captureEffect: {
    position: 'absolute',
    top: height / 2 - 50,
    left: width / 2 - 50,
  },
  captureRipple: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primary.jin,
  },
  
  // 底部控制
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: SPACING.md,
  },
  scanStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.glass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.md,
    gap: SPACING.xs,
  },
  scanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scanText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.bg.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary.jin,
  },
  controlButtonActive: {
    backgroundColor: COLORS.primary.jin,
  },
  controlText: {
    fontSize: 24,
    color: COLORS.text.primary,
  },
  itemCount: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
});
