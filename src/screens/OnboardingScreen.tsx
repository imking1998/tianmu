/**
 * 天目应用 - 引导屏幕
 * 功能：首次使用引导、八字信息输入
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useUserStore, useUIStore } from '../store';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  GlowView,
} from '../components/UIComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const onboardingData = [
  {
    title: '以道观物',
    subtitle: '天目',
    description: '通过AR技术，探索周围物品的五行能量，洞察万物之理',
    icon: '👁️',
  },
  {
    title: '八字命理',
    subtitle: '知己',
    description: '输入您的出生时间，系统将计算您的八字命盘与喜用五行',
    icon: '☯️',
  },
  {
    title: '五行能量',
    subtitle: '明势',
    description: '实时分析物品对您的生助与损耗，趋吉避凶',
    icon: '🌟',
  },
];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { completeOnboarding } = useUIStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleStart();
    }
  };

  const handleSkip = () => {
    handleStart();
  };

  const handleStart = () => {
    completeOnboarding();
  };

  const renderItem = ({ item, index }: { item: typeof onboardingData[0]; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }] }]}>
          <GlowView color={COLORS.accent.gold} intensity={0.6}>
            <LinearGradient
              colors={[COLORS.primary.card, COLORS.primary.cardLight]}
              style={styles.iconGradient}
            >
              <Text style={styles.icon}>{item.icon}</Text>
            </LinearGradient>
          </GlowView>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity }]}>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary.darker, COLORS.primary.dark, COLORS.primary.darker]}
        style={styles.gradient}
      >
        {/* 跳过按钮 */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>跳过</Text>
        </TouchableOpacity>

        {/* 内容滑动区 */}
        <Animated.FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(index);
          }}
          scrollEventThrottle={16}
        />

        {/* 指示点 */}
        {renderDots()}

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleNext}>
            <GlowView color={COLORS.accent.gold} intensity={0.8}>
              <LinearGradient
                colors={[COLORS.accent.gold, COLORS.accent.goldLight]}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {currentIndex === onboardingData.length - 1 ? '开始使用' : '下一步'}
                </Text>
              </LinearGradient>
            </GlowView>
          </TouchableOpacity>
        </View>

        {/* 装饰元素 */}
        <View style={styles.decorationTop}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
        </View>
        <View style={styles.decorationBottom}>
          <View style={[styles.circle, styles.circle3]} />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  gradient: {
    flex: 1,
  },
  
  skipButton: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    zIndex: 10,
    padding: SPACING.sm,
  },
  
  skipText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  iconContainer: {
    marginBottom: SPACING.xxl,
  },
  
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  icon: {
    fontSize: 48,
  },
  
  textContainer: {
    alignItems: 'center',
  },
  
  subtitle: {
    color: COLORS.accent.gold,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  },
  
  title: {
    color: COLORS.text.primary,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  
  description: {
    color: COLORS.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent.gold,
    marginHorizontal: 4,
  },
  
  buttonContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 60,
  },
  
  button: {
    paddingHorizontal: SPACING.xxl * 2,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
  },
  
  buttonText: {
    color: COLORS.primary.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  
  decorationTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden',
  },
  
  decorationBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'hidden',
  },
  
  circle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  
  circle1: {
    width: 400,
    height: 400,
    top: -200,
    left: -100,
  },
  
  circle2: {
    width: 300,
    height: 300,
    top: -100,
    right: -50,
  },
  
  circle3: {
    width: 350,
    height: 350,
    bottom: -150,
    left: '50%',
    marginLeft: -175,
  },
});

export default OnboardingScreen;
