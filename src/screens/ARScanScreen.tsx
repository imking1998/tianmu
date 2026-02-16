/**
 * 天目应用 - AR扫描屏幕
 * 核心功能：实时AR识别、五行属性展示、能量反馈
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useARStore, useUserStore } from '../store';
import { arService } from '../services/ARRecognition';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  WuXingBadge,
  QiIndicator,
  GradientCard,
  GlowView,
} from '../components/UIComponents';
import { ARDetectionResult, WuXing } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ARScanScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isScanning, detectedItems, selectedItem, setScanning, addDetectedItem, selectItem, clearDetectedItems } = useARStore();
  const { profile } = useUserStore();
  
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [showItemDetail, setShowItemDetail] = useState(false);

  // 扫描动画
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isScanning]);

  // 脉冲动画
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 淡入动画
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // 模拟检测（开发模式）
  useEffect(() => {
    if (isScanning && detectedItems.length < 5) {
      const interval = setInterval(() => {
        const result = arService.simulateDetection();
        addDetectedItem(result);
        Vibration.vibrate(50);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isScanning, detectedItems.length]);

  const toggleScanning = () => {
    setScanning(!isScanning);
    if (!isScanning) {
      clearDetectedItems();
    }
  };

  const handleItemPress = (item: ARDetectionResult) => {
    selectItem(item);
    setShowItemDetail(true);
    Vibration.vibrate(30);
  };

  const scanLineTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT - 200],
  });

  return (
    <View style={styles.container}>
      {/* AR相机预览区域 */}
      <View style={styles.cameraContainer}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'transparent']}
          style={styles.cameraOverlay}
        >
          {/* 扫描框 */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {isScanning && (
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanLineTranslateY }] },
                ]}
              />
            )}
          </View>

          {/* 用户信息悬浮卡片 */}
          {profile && (
            <Animated.View style={[styles.userInfoCard, { opacity: fadeAnim }]}>
              <LinearGradient
                colors={['rgba(26,26,26,0.9)', 'rgba(42,42,42,0.8)']}
                style={styles.userInfoGradient}
              >
                <View style={styles.userInfoContent}>
                  <WuXingBadge wuXing={profile.bazi.riWuXing} size="sm" showLabel={false} />
                  <View style={styles.userInfoText}>
                    <Text style={styles.userName}>{profile.name || '用户'}</Text>
                    <Text style={styles.userBazi}>
                      {profile.bazi.siZhu.day.gan}{profile.bazi.siZhu.day.zhi}日主
                    </Text>
                  </View>
                  <View style={styles.xiYongTags}>
                    {profile.strengthAnalysis.xiYong.slice(0, 2).map((wx, i) => (
                      <View key={i} style={styles.miniTag}>
                        <Text style={styles.miniTagText}>{wx}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* 检测到的物品标记 */}
          {detectedItems.map((item, index) => (
            <DetectedItemMarker
              key={item.itemId}
              item={item}
              onPress={() => handleItemPress(item)}
              isSelected={selectedItem?.itemId === item.itemId}
            />
          ))}
        </LinearGradient>
      </View>

      {/* 底部控制区 */}
      <View style={styles.controlArea}>
        <LinearGradient
          colors={['transparent', COLORS.primary.dark]}
          style={styles.controlGradient}
        >
          {/* 物品列表 */}
          {detectedItems.length > 0 && (
            <View style={styles.itemsList}>
              {detectedItems.slice(0, 4).map((item, index) => (
                <TouchableOpacity
                  key={item.itemId}
                  style={[
                    styles.itemChip,
                    selectedItem?.itemId === item.itemId && styles.itemChipSelected,
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <WuXingBadge wuXing={item.itemAnalysis.wuXing} size="sm" showLabel={false} />
                  <Text style={styles.itemChipText} numberOfLines={1}>
                    {item.itemName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 扫描按钮 */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={toggleScanning}
              activeOpacity={0.8}
              style={styles.scanButton}
            >
              <GlowView
                color={isScanning ? COLORS.accent.crimson : COLORS.accent.jade}
                intensity={0.8}
              >
                <LinearGradient
                  colors={isScanning 
                    ? [COLORS.accent.crimson, COLORS.accent.crimsonLight]
                    : [COLORS.accent.jade, COLORS.accent.jadeLight]
                  }
                  style={styles.scanButtonGradient}
                >
                  <Text style={styles.scanButtonText}>
                    {isScanning ? '停止扫描' : '开始扫描'}
                  </Text>
                </LinearGradient>
              </GlowView>
            </TouchableOpacity>
          </Animated.View>

          {/* 提示文字 */}
          <Text style={styles.hintText}>
            {isScanning 
              ? `已识别 ${detectedItems.length} 个物品`
              : '点击按钮开始识别周围物品'
            }
          </Text>
        </LinearGradient>
      </View>

      {/* 物品详情弹窗 */}
      {showItemDetail && selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setShowItemDetail(false)}
        />
      )}
    </View>
  );
};

// ==================== 检测物品标记组件 ====================

interface DetectedItemMarkerProps {
  item: ARDetectionResult;
  onPress: () => void;
  isSelected: boolean;
}

const DetectedItemMarker: React.FC<DetectedItemMarkerProps> = ({
  item,
  onPress,
  isSelected,
}) => {
  const { boundingBox, itemAnalysis } = item;
  const { wuXing, isXiYong, isJiShen, qiLevel } = itemAnalysis;
  const colors = COLORS.wuXing[wuXing];

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: isSelected ? 1.15 : 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [isSelected]);

  const borderColor = isJiShen 
    ? COLORS.accent.crimson 
    : isXiYong 
      ? colors.primary 
      : COLORS.text.muted;

  return (
    <Animated.View
      style={[
        styles.markerContainer,
        {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.markerTouchable}
      >
        <Animated.View
          style={[
            styles.marker,
            {
              borderColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={[styles.markerDot, { backgroundColor: colors.primary }]} />
        </Animated.View>
      </TouchableOpacity>

      {/* 五行标签 */}
      <View style={[styles.markerLabel, { backgroundColor: colors.primary + 'CC' }]}>
        <Text style={styles.markerLabelText}>{wuXing}</Text>
      </View>

      {/* 喜忌指示 */}
      {(isXiYong || isJiShen) && (
        <View style={[
          styles.markerIndicator,
          { backgroundColor: isJiShen ? COLORS.accent.crimson : COLORS.accent.jade }
        ]}>
          <Text style={styles.markerIndicatorText}>
            {isXiYong ? '喜' : '忌'}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

// ==================== 物品详情弹窗 ====================

interface ItemDetailModalProps {
  item: ARDetectionResult;
  onClose: () => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose }) => {
  const { itemName, confidence, itemAnalysis } = item;
  const { wuXing, qiLevel, qiScore, isXiYong, isJiShen, advice, visualEffect } = itemAnalysis;

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={handleClose} />
      <Animated.View
        style={[
          styles.modalContent,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <LinearGradient
          colors={[COLORS.primary.card, COLORS.primary.dark]}
          style={styles.modalGradient}
        >
          {/* 头部 */}
          <View style={styles.modalHeader}>
            <WuXingBadge wuXing={wuXing} size="lg" />
            <View style={styles.modalTitle}>
              <Text style={styles.modalItemName}>{itemName}</Text>
              <Text style={styles.modalConfidence}>
                识别置信度: {Math.round(confidence * 100)}%
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 气强度 */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>能量强度</Text>
            <QiIndicator qiLevel={qiLevel} qiScore={qiScore} />
          </View>

          {/* 喜忌判断 */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>对你的影响</Text>
            <View style={[
              styles.adviceBox,
              {
                backgroundColor: isJiShen 
                  ? COLORS.accent.crimson + '20'
                  : isXiYong 
                    ? COLORS.accent.jade + '20'
                    : COLORS.primary.cardLight,
                borderColor: isJiShen 
                  ? COLORS.accent.crimson
                  : isXiYong 
                    ? COLORS.accent.jade
                    : COLORS.text.muted,
              }
            ]}>
              <Text style={[
                styles.adviceText,
                { color: isJiShen ? COLORS.accent.crimsonLight : isXiYong ? COLORS.accent.jadeLight : COLORS.text.primary }
              ]}>
                {advice}
              </Text>
            </View>
          </View>

          {/* 五行详情 */}
          <View style={styles.modalSection}>
            <Text style={styles.sectionTitle}>五行属性</Text>
            <View style={styles.wuXingDetails}>
              <View style={styles.wuXingDetailItem}>
                <Text style={styles.wuXingDetailLabel}>属性</Text>
                <Text style={styles.wuXingDetailValue}>{wuXing}</Text>
              </View>
              <View style={styles.wuXingDetailItem}>
                <Text style={styles.wuXingDetailLabel}>喜忌</Text>
                <Text style={[
                  styles.wuXingDetailValue,
                  { color: isJiShen ? COLORS.accent.crimson : isXiYong ? COLORS.accent.jade : COLORS.text.secondary }
                ]}>
                  {isXiYong ? '喜用' : isJiShen ? '忌神' : '中性'}
                </Text>
              </View>
              <View style={styles.wuXingDetailItem}>
                <Text style={styles.wuXingDetailLabel}>能量</Text>
                <Text style={styles.wuXingDetailValue}>{qiLevel}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

// ==================== 样式定义 ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary.darker,
  },
  
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  
  cameraOverlay: {
    flex: 1,
  },
  
  scanFrame: {
    position: 'absolute',
    top: 100,
    left: 40,
    right: 40,
    bottom: 250,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
  },
  
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.accent.gold,
    borderWidth: 3,
  },
  
  topLeft: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: BORDER_RADIUS.lg,
  },
  
  topRight: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  
  bottomRight: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.accent.gold,
    shadowColor: COLORS.accent.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  
  userInfoCard: {
    position: 'absolute',
    top: SPACING.xl,
    left: SPACING.md,
    right: SPACING.md,
  },
  
  userInfoGradient: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  userInfoText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  
  userName: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  userBazi: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  
  xiYongTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  
  miniTag: {
    backgroundColor: COLORS.accent.jade + '30',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accent.jade,
  },
  
  miniTagText: {
    color: COLORS.accent.jadeLight,
    fontSize: 12,
  },
  
  controlArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  controlGradient: {
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.card,
    borderRadius: BORDER_RADIUS.full,
    paddingLeft: SPACING.xs,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  itemChipSelected: {
    borderColor: COLORS.accent.gold,
  },
  
  itemChipText: {
    color: COLORS.text.primary,
    fontSize: 14,
    maxWidth: 80,
  },
  
  scanButton: {
    alignSelf: 'center',
  },
  
  scanButtonGradient: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 160,
    alignItems: 'center',
  },
  
  scanButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  hintText: {
    color: COLORS.text.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  
  markerContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  markerTouchable: {
    padding: SPACING.md,
  },
  
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  markerLabel: {
    position: 'absolute',
    top: -20,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  markerLabelText: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  
  markerIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  markerIndicatorText: {
    color: COLORS.text.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  modalContent: {
    maxHeight: SCREEN_HEIGHT * 0.7,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  
  modalGradient: {
    padding: SPACING.lg,
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  modalTitle: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  
  modalItemName: {
    color: COLORS.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  
  modalConfidence: {
    color: COLORS.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  closeButtonText: {
    color: COLORS.text.secondary,
    fontSize: 16,
  },
  
  modalSection: {
    marginBottom: SPACING.lg,
  },
  
  sectionTitle: {
    color: COLORS.text.secondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  
  adviceBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  
  adviceText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  wuXingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  wuXingDetailItem: {
    alignItems: 'center',
  },
  
  wuXingDetailLabel: {
    color: COLORS.text.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  
  wuXingDetailValue: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ARScanScreen;
