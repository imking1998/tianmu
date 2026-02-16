/**
 * 天目应用 - Z世代风格UI组件库
 * 设计理念：前卫高级 + 中式美学 + 流畅动效
 * 参考：Azuki.com 的视觉风格
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WuXing, QiLevel, WU_XING_COLORS } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==================== 设计常量 ====================

export const COLORS = {
  primary: {
    dark: '#0D0D0D',
    darker: '#000000',
    card: '#1A1A1A',
    cardLight: '#2A2A2A',
  },
  accent: {
    gold: '#D4AF37',
    goldLight: '#F4D03F',
    jade: '#00A86B',
    jadeLight: '#50C878',
    crimson: '#DC143C',
    crimsonLight: '#FF6B6B',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    muted: '#666666',
  },
  wuXing: WU_XING_COLORS,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  chinese: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ==================== 基础组件 ====================

interface GlowViewProps {
  children: React.ReactNode;
  color: string;
  intensity?: number;
  style?: ViewStyle;
}

export const GlowView: React.FC<GlowViewProps> = ({
  children,
  color,
  intensity = 0.5,
  style,
}) => {
  const glowOpacity = new Animated.Value(intensity);

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: intensity * 0.7,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: intensity,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [intensity]);

  return (
    <Animated.View
      style={[
        styles.glowContainer,
        {
          shadowColor: color,
          shadowOpacity: glowOpacity,
          shadowRadius: 20,
          elevation: 10,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface GradientCardProps {
  children: React.ReactNode;
  wuXing?: WuXing;
  isXiYong?: boolean;
  isJiShen?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  wuXing = '土',
  isXiYong = false,
  isJiShen = false,
  style,
  onPress,
}) => {
  const colors = COLORS.wuXing[wuXing];
  
  let gradientColors: string[];
  if (isJiShen) {
    gradientColors = ['#2D1F1F', '#1A0F0F'];
  } else if (isXiYong) {
    gradientColors = [colors.primary + '40', colors.secondary + '20'];
  } else {
    gradientColors = [COLORS.primary.card, COLORS.primary.cardLight];
  }

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <GlowView color={isJiShen ? COLORS.accent.crimson : colors.primary} intensity={isXiYong ? 0.8 : 0.3}>
      <CardComponent onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, style]}
        >
          {children}
        </LinearGradient>
      </CardComponent>
    </GlowView>
  );
};

// ==================== 五行徽章组件 ====================

interface WuXingBadgeProps {
  wuXing: WuXing;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export const WuXingBadge: React.FC<WuXingBadgeProps> = ({
  wuXing,
  size = 'md',
  showLabel = true,
  animated = true,
}) => {
  const colors = COLORS.wuXing[wuXing];
  const scaleAnim = new Animated.Value(1);

  const sizeStyles = {
    sm: { width: 32, height: 32, fontSize: 12 },
    md: { width: 48, height: 48, fontSize: 16 },
    lg: { width: 64, height: 64, fontSize: 20 },
  };

  React.useEffect(() => {
    if (animated) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [animated]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            width: sizeStyles[size].width,
            height: sizeStyles[size].height,
            borderRadius: sizeStyles[size].width / 2,
          },
        ]}
      >
        <Text style={[styles.badgeText, { fontSize: sizeStyles[size].fontSize }]}>
          {wuXing}
        </Text>
      </LinearGradient>
      {showLabel && (
        <Text style={styles.badgeLabel}>{getWuXingLabel(wuXing)}</Text>
      )}
    </Animated.View>
  );
};

function getWuXingLabel(wuXing: WuXing): string {
  const labels: Record<WuXing, string> = {
    '木': '青龙',
    '火': '朱雀',
    '土': '勾陈',
    '金': '白虎',
    '水': '玄武',
  };
  return labels[wuXing];
}

// ==================== 气强度指示器 ====================

interface QiIndicatorProps {
  qiLevel: QiLevel;
  qiScore: number;
  showValue?: boolean;
}

export const QiIndicator: React.FC<QiIndicatorProps> = ({
  qiLevel,
  qiScore,
  showValue = true,
}) => {
  const percentage = Math.min(100, Math.max(0, qiScore + 100)) / 100;
  const barWidth = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(barWidth, {
      toValue: percentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const getColor = (): string => {
    switch (qiLevel) {
      case '气极强': return COLORS.accent.gold;
      case '气强': return COLORS.accent.jade;
      case '气平': return COLORS.text.secondary;
      case '气弱': return COLORS.accent.crimsonLight;
      case '气衰': return COLORS.accent.crimson;
    }
  };

  return (
    <View style={styles.qiContainer}>
      <Text style={styles.qiLabel}>{qiLevel}</Text>
      <View style={styles.qiBar}>
        <Animated.View
          style={[
            styles.qiBarFill,
            {
              width: barWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: getColor(),
            },
          ]}
        />
      </View>
      {showValue && (
        <Text style={styles.qiValue}>{Math.round(qiScore)}</Text>
      )}
    </View>
  );
};

// ==================== 八字展示组件 ====================

interface BaziDisplayProps {
  siZhu: {
    year: { gan: string; zhi: string };
    month: { gan: string; zhi: string };
    day: { gan: string; zhi: string };
    hour: { gan: string; zhi: string };
  };
  riGan: string;
}

export const BaziDisplay: React.FC<BaziDisplayProps> = ({ siZhu, riGan }) => {
  const pillars = [
    { label: '年柱', ...siZhu.year },
    { label: '月柱', ...siZhu.month },
    { label: '日柱', ...siZhu.day, isDay: true },
    { label: '时柱', ...siZhu.hour },
  ];

  return (
    <View style={styles.baziContainer}>
      {pillars.map((pillar, index) => (
        <View key={index} style={styles.pillar}>
          <Text style={styles.pillarLabel}>{pillar.label}</Text>
          <View style={[styles.ganZhiBox, pillar.isDay && styles.dayPillar]}>
            <Text style={[
              styles.ganText,
              pillar.gan === riGan && styles.riGanText
            ]}>
              {pillar.gan}
            </Text>
            <Text style={styles.zhiText}>{pillar.zhi}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// ==================== 喜忌标签组件 ====================

interface XiJiTagsProps {
  xiYong: WuXing[];
  jiShen: WuXing[];
}

export const XiJiTags: React.FC<XiJiTagsProps> = ({ xiYong, jiShen }) => {
  return (
    <View style={styles.tagsContainer}>
      <View style={styles.tagGroup}>
        <Text style={styles.tagGroupLabel}>喜用</Text>
        <View style={styles.tagsRow}>
          {xiYong.map((wx, i) => (
            <View key={i} style={[styles.tag, styles.xiTag]}>
              <Text style={styles.tagText}>{wx}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.tagGroup}>
        <Text style={styles.tagGroupLabel}>忌神</Text>
        <View style={styles.tagsRow}>
          {jiShen.map((wx, i) => (
            <View key={i} style={[styles.tag, styles.jiTag]}>
              <Text style={styles.tagText}>{wx}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ==================== 样式定义 ====================

const styles = StyleSheet.create({
  glowContainer: {
    shadowOffset: { width: 0, height: 0 },
  },
  
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  badgeText: {
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  
  badgeLabel: {
    color: COLORS.text.secondary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  
  qiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  
  qiLabel: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '500',
    minWidth: 60,
  },
  
  qiBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.primary.cardLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  
  qiBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  
  qiValue: {
    color: COLORS.text.secondary,
    fontSize: 12,
    minWidth: 30,
    textAlign: 'right',
  },
  
  baziContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.md,
  },
  
  pillar: {
    alignItems: 'center',
  },
  
  pillarLabel: {
    color: COLORS.text.muted,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  
  ganZhiBox: {
    backgroundColor: COLORS.primary.cardLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  dayPillar: {
    borderColor: COLORS.accent.gold,
    borderWidth: 2,
  },
  
  ganText: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  riGanText: {
    color: COLORS.accent.gold,
  },
  
  zhiText: {
    color: COLORS.text.secondary,
    fontSize: 20,
    marginTop: SPACING.xs,
  },
  
  tagsContainer: {
    gap: SPACING.md,
  },
  
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  tagGroupLabel: {
    color: COLORS.text.secondary,
    fontSize: 14,
    width: 50,
  },
  
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  
  tag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  
  xiTag: {
    backgroundColor: COLORS.accent.jade + '30',
    borderWidth: 1,
    borderColor: COLORS.accent.jade,
  },
  
  jiTag: {
    backgroundColor: COLORS.accent.crimson + '30',
    borderWidth: 1,
    borderColor: COLORS.accent.crimson,
  },
  
  tagText: {
    color: COLORS.text.primary,
    fontSize: 14,
  },
});

// ==================== 导出 ====================

export {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
};
