/**
 * Web测试页面 - 物体识别演示
 * 用于在浏览器中测试TensorFlow.js物体识别功能
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';
import { QiParticles, TaiChi, Bagua, EnergyOrb } from '../components/Effects';
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

interface WebTestScreenProps {
  userDestiny: UserDestiny | null;
  onBack: () => void;
}

export default function WebTestScreen({ userDestiny, onBack }: WebTestScreenProps) {
  const [gameItems, setGameItems] = useState<GameItem[]>([]);
  const [capturedCount, setCapturedCount] = useState(0);
  const [totalQi, setTotalQi] = useState(0);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [showCaptureEffect, setShowCaptureEffect] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baguaRotation = useRef(new Animated.Value(0)).current;
  const idCounter = useRef(0);
  
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
  
  // 处理文件上传
  const handleFileUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    
    // 等待图像加载
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });
    
    // 执行检测
    const detections = await detectObjects(img);
    console.log('检测结果:', detections);
    
    if (detections.length > 0) {
      processDetections(detections);
    }
  };
  
  // 处理检测结果
  const processDetections = (detections: DetectionResult[]) => {
    if (!userDestiny) return;
    
    const newItems: GameItem[] = detections.map((detection, index) => {
      const x = 50 + (index % 3) * 120;
      const y = 200 + Math.floor(index / 3) * 150;
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
    
    setGameItems(newItems);
    
    // 入场动画
    newItems.forEach(item => {
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
  };
  
  // 捕获物品
  const captureItem = (item: GameItem) => {
    if (item.captured) return;
    
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
  
  const baguaRotate = baguaRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <View style={styles.container}>
      {/* 粒子背景 */}
      <QiParticles count={30} color={COLORS.primary.jin} speed={0.8} />
      
      {/* 主内容 */}
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
        
        {/* 上传按钮 */}
        <View style={styles.uploadSection}>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={() => fileInputRef.current?.click()}
          >
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadText}>上传图片进行识别</Text>
          </TouchableOpacity>
          
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef as any}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </View>
        
        {/* 预览图片 */}
        {imageUrl && (
          <View style={styles.previewContainer}>
            <img 
              src={imageUrl} 
              style={styles.previewImage as any}
              alt="预览"
            />
          </View>
        )}
        
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
        
        {/* 底部提示 */}
        <View style={styles.bottomControls}>
          <Text style={styles.hintText}>
            {modelStatus === 'ready' 
              ? '上传图片开始识别物体五行属性' 
              : '正在加载AI模型...'}
          </Text>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
    top: height / 2 - 200,
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
  
  // 上传区域
  uploadSection: {
    position: 'absolute',
    top: height / 2 + 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg.glass,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.primary.jin,
    gap: SPACING.md,
  },
  uploadIcon: {
    fontSize: 24,
  },
  uploadText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  
  // 预览图片
  previewContainer: {
    position: 'absolute',
    top: height / 2 + 100,
    left: SPACING.lg,
    right: SPACING.lg,
    height: 150,
    borderRadius: SPACING.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bg.glass,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
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
  hintText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  itemCount: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
});
