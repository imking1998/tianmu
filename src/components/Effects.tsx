/**
 * 特效组件库
 * 道系古风 × 赛博朋克视觉特效
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { COLORS, ANIMATIONS } from '../styles/theme';

const { width, height } = Dimensions.get('window');

// ==================== 灵气粒子系统 ====================
interface QiParticleProps {
  count?: number;
  color?: string;
  speed?: number;
}

export function QiParticles({ count = 20, color = COLORS.wuxing.wood.primary, speed = 1 }: QiParticleProps) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(height + Math.random() * 100),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      opacity: new Animated.Value(Math.random() * 0.5 + 0.3),
      duration: 3000 + Math.random() * 4000,
      delay: Math.random() * 2000,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((particle) => {
      const animate = () => {
        particle.y.setValue(height + 50);
        particle.x.setValue(Math.random() * width);
        
        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -50,
            duration: particle.duration / speed,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.8,
              duration: particle.duration * 0.2,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: particle.duration * 0.3,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          setTimeout(animate, Math.random() * 1000);
        });
      };
      
      setTimeout(animate, particle.delay);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ==================== 太极阴阳鱼 ====================
export function TaiChi({ size = 120, spinning = true }: { size?: number; spinning?: boolean }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (spinning) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [spinning]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.taiChi,
        {
          width: size,
          height: size,
          transform: [{ rotate }],
        },
      ]}
    >
      {/* 外圆 */}
      <View style={[styles.taiChiOuter, { width: size, height: size }]} />
      {/* 阴阳分割线 */}
      <View style={[styles.taiChiLine, { width: size * 0.5, height: size }]} />
      {/* 阳眼 */}
      <View style={[styles.taiChiDot, { 
        width: size * 0.2, 
        height: size * 0.2,
        top: size * 0.15,
        left: size * 0.15,
        backgroundColor: '#000',
      }]} />
      {/* 阴眼 */}
      <View style={[styles.taiChiDot, { 
        width: size * 0.2, 
        height: size * 0.2,
        bottom: size * 0.15,
        right: size * 0.15,
        backgroundColor: '#fff',
      }]} />
    </Animated.View>
  );
}

// ==================== 能量波纹 ====================
interface RippleProps {
  color?: string;
  count?: number;
}

export function EnergyRipple({ color = COLORS.primary.jin, count = 3 }: RippleProps) {
  const ripples = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      delay: i * 400,
    }))
  ).current;

  useEffect(() => {
    const animate = () => {
      ripples.forEach((ripple, index) => {
        ripple.scale.setValue(0);
        ripple.opacity.setValue(1);
        
        Animated.parallel([
          Animated.timing(ripple.scale, {
            toValue: 3,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ripple.opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start();
      });
      
      setTimeout(animate, 2500);
    };
    
    animate();
  }, []);

  return (
    <View style={styles.rippleContainer}>
      {ripples.map((ripple) => (
        <Animated.View
          key={ripple.id}
          style={[
            styles.ripple,
            {
              borderColor: color,
              transform: [{ scale: ripple.scale }],
              opacity: ripple.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ==================== 八卦阵 ====================
export function Bagua({ size = 200 }: { size?: number }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const trigrams = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

  return (
    <Animated.View
      style={[
        styles.bagua,
        {
          width: size,
          height: size,
          transform: [{ rotate }],
        },
      ]}
    >
      {/* 外圈 */}
      <View style={[styles.baguaOuter, { width: size, height: size }]} />
      
      {/* 八卦符号 */}
      {trigrams.map((trigram, index) => {
        const angle = (index * 45 - 90) * (Math.PI / 180);
        const radius = size * 0.38;
        const x = Math.cos(angle) * radius + size / 2 - 12;
        const y = Math.sin(angle) * radius + size / 2 - 12;
        
        return (
          <View
            key={index}
            style={[
              styles.baguaSymbol,
              {
                left: x,
                top: y,
                transform: [{ rotate: `${-index * 45 + 90}deg` }],
              },
            ]}
          >
            <Animated.Text style={styles.baguaText}>{trigram}</Animated.Text>
          </View>
        );
      })}
    </Animated.View>
  );
}

// ==================== 扫描激光 ====================
export function ScanLaser() {
  const position = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(position, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(position, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = position.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.scanLaser,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
}

// ==================== 符文光效 ====================
interface RuneGlowProps {
  rune: string;
  color?: string;
  size?: number;
  pulsing?: boolean;
}

export function RuneGlow({ rune, color = COLORS.primary.jin, size = 60, pulsing = true }: RuneGlowProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (pulsing) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glowOpacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.5,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, [pulsing]);

  return (
    <Animated.View
      style={[
        styles.runeContainer,
        {
          width: size,
          height: size,
          transform: [{ scale }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.runeGlow,
          {
            width: size * 1.5,
            height: size * 1.5,
            backgroundColor: color,
            opacity: glowOpacity,
          },
        ]}
      />
      <Text style={[styles.runeText, { fontSize: size * 0.6, color }]}>{rune}</Text>
    </Animated.View>
  );
}

// ==================== 五行能量球 ====================
interface EnergyOrbProps {
  wuxing: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  size?: number;
  intensity?: number;
}

export function EnergyOrb({ wuxing, size = 80, intensity = 1 }: EnergyOrbProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const color = COLORS.wuxing[wuxing].primary;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const scale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8 * intensity, 0.2 * intensity],
  });

  return (
    <View style={[styles.orbContainer, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.orbGlow,
          {
            width: size,
            height: size,
            backgroundColor: color,
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orbCore,
          {
            width: size * 0.6,
            height: size * 0.6,
            backgroundColor: color,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

// ==================== 样式 ====================
const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  taiChi: {
    position: 'relative',
    borderRadius: 999,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  taiChiOuter: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primary.jin,
  },
  taiChiLine: {
    position: 'absolute',
    backgroundColor: '#000',
    right: 0,
    top: 0,
    borderBottomLeftRadius: 999,
    borderTopLeftRadius: 999,
  },
  taiChiDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  rippleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  bagua: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  baguaOuter: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primary.jin,
    borderStyle: 'dashed',
  },
  baguaSymbol: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  baguaText: {
    color: COLORS.primary.jin,
    fontSize: 20,
    fontWeight: 'bold',
  },
  scanLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.effects.scan,
    shadowColor: COLORS.wuxing.wood.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  runeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  runeGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  runeText: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  orbContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbCore: {
    borderRadius: 999,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});
