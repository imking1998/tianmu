/**
 * 天目 - 道系古风Z世代设计系统
 * 设计理念：道法自然 × 赛博朋克 × 游戏化沉浸
 * 核心关键词：神秘、流动、能量、东方美学
 */

// ==================== 色彩系统 ====================
export const COLORS = {
  // 主色调 - 道家玄黑与朱砂
  primary: {
    xuan: '#0A0A0F',        // 玄黑 - 宇宙本源
    zhuSha: '#C73E3E',      // 朱砂 - 道家符咒
    jin: '#D4AF37',         // 金 - 仙界光辉
    yu: '#2E5C8A',          // 玉 - 温润内敛
  },
  
  // 五行能量色 - 霓虹渐变
  wuxing: {
    wood: {
      primary: '#00FF88',   // 青木 - 生机
      glow: '#00FF8840',    // 发光效果
      gradient: ['#00FF88', '#00CC6A'],
    },
    fire: {
      primary: '#FF3366',   // 赤火 - 热情
      glow: '#FF336640',
      gradient: ['#FF3366', '#CC2952'],
    },
    earth: {
      primary: '#FFB800',   // 黄土 - 稳重
      glow: '#FFB80040',
      gradient: ['#FFB800', '#CC9300'],
    },
    metal: {
      primary: '#00DDFF',   // 白金 - 锐利
      glow: '#00DDFF40',
      gradient: ['#00DDFF', '#00AACC'],
    },
    water: {
      primary: '#8855FF',   // 玄水 - 深邃
      glow: '#8855FF40',
      gradient: ['#8855FF', '#6B44CC'],
    },
  },
  
  // 背景层次
  bg: {
    deep: '#050508',        // 深渊
    surface: '#0F0F14',     // 表面
    elevated: '#1A1A22',    // 浮层
    glass: 'rgba(15, 15, 20, 0.85)', // 玻璃态
  },
  
  // 文字系统
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.4)',
    muted: 'rgba(255, 255, 255, 0.2)',
    gold: '#D4AF37',
  },
  
  // 特效色
  effects: {
    aura: 'rgba(212, 175, 55, 0.3)',      // 灵气光环
    ripple: 'rgba(255, 255, 255, 0.1)',   // 波纹
    scan: 'rgba(0, 255, 136, 0.5)',       // 扫描线
    portal: 'rgba(136, 85, 255, 0.6)',    // 传送门
  },
};

// ==================== 字体系统 ====================
export const TYPOGRAPHY = {
  // 标题字体 - 书法感
  display: {
    h1: { size: 48, weight: '700', letterSpacing: 8 },
    h2: { size: 36, weight: '700', letterSpacing: 6 },
    h3: { size: 28, weight: '600', letterSpacing: 4 },
    h4: { size: 22, weight: '600', letterSpacing: 2 },
  },
  // 正文字体
  body: {
    large: { size: 18, weight: '400', lineHeight: 28 },
    regular: { size: 16, weight: '400', lineHeight: 24 },
    small: { size: 14, weight: '400', lineHeight: 20 },
    caption: { size: 12, weight: '400', lineHeight: 16 },
  },
  // 特殊字体 - 符文感
  rune: {
    size: 20,
    weight: '600',
    letterSpacing: 12,
  },
};

// ==================== 间距系统 ====================
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ==================== 圆角系统 ====================
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// ==================== 阴影系统 ====================
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  }),
};

// ==================== 动画系统 ====================
export const ANIMATIONS = {
  // 缓动函数
  easing: {
    default: 'ease-out',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    dramatic: 'cubic-bezier(0.87, 0, 0.13, 1)',
  },
  // 时长
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    dramatic: 800,
    ambient: 3000,
  },
  // 预设动画
  presets: {
    fadeIn: { opacity: [0, 1] },
    slideUp: { transform: [{ translateY: [20, 0] }] },
    scaleIn: { transform: [{ scale: [0.8, 1] }] },
    rotate: { transform: [{ rotate: ['0deg', '360deg'] }] },
    pulse: { transform: [{ scale: [1, 1.05, 1] }] },
    float: { transform: [{ translateY: [0, -10, 0] }] },
    shimmer: {
      background: [
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      ],
    },
  },
};

// ==================== 游戏化元素 ====================
export const GAME_ELEMENTS = {
  // 等级颜色
  ranks: {
    mortal: '#8B8B8B',      // 凡人
    practitioner: '#4A90D9', // 练气
    master: '#9B59B6',      // 筑基
    immortal: '#D4AF37',    // 金丹
    celestial: '#FF6B6B',   // 元婴
  },
  // 特效粒子
  particles: {
    qi: { color: '#00FF88', size: 4, blur: 2 },
    spirit: { color: '#8855FF', size: 6, blur: 4 },
    dao: { color: '#D4AF37', size: 8, blur: 6 },
  },
  // 符文图案
  runes: {
    wood: '☰',
    fire: '☲',
    earth: '☷',
    metal: '☱',
    water: '☵',
  },
};
