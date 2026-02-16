/**
 * 天目应用 - 统一类型定义
 * 整合八字计算、身强身弱判断、物品五行分析的核心类型
 * 解决不同算法模块间的类型兼容性问题
 */

// ==================== 基础五行类型 ====================

/** 五行枚举 */
export type WuXing = '木' | '火' | '土' | '金' | '水';

/** 天干枚举 */
export type TianGan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

/** 地支枚举 */
export type DiZhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

/** 十神枚举 */
export type ShiShen = 
  | '比肩' | '劫财' 
  | '食神' | '伤官' 
  | '正财' | '偏财' 
  | '正官' | '七杀' 
  | '正印' | '偏印';

/** 阴阳属性 */
export type YinYang = '阴' | '阳';

// ==================== 八字相关类型 ====================

/** 单柱干支 */
export interface GanZhi {
  gan: TianGan;
  zhi: DiZhi;
}

/** 四柱八字 */
export interface SiZhu {
  year: GanZhi;   // 年柱
  month: GanZhi;  // 月柱
  day: GanZhi;    // 日柱
  hour: GanZhi;   // 时柱
}

/** 藏干信息 */
export interface CangGanInfo {
  gan: TianGan;
  pos: '本' | '中' | '余';  // 本气、中气、余气
}

/** 纳音 */
export interface NaYin {
  year: string;
  month: string;
  day: string;
  hour: string;
}

/** 十神配置 */
export interface ShiShenConfig {
  year: ShiShen;
  month: ShiShen;
  day: ShiShen;
  hour: ShiShen;
}

/** 藏干配置 */
export interface CangGanConfig {
  year: TianGan[];
  month: TianGan[];
  day: TianGan[];
  hour: TianGan[];
}

/** 藏干十神配置 */
export interface CangGanShiShenConfig {
  year: ShiShen[];
  month: ShiShen[];
  day: ShiShen[];
  hour: ShiShen[];
}

/** 八字完整计算结果 */
export interface BaziResult {
  siZhu: SiZhu;                        // 四柱
  riGan: TianGan;                      // 日主（日干）
  riWuXing: WuXing;                    // 日主五行
  naYin: NaYin;                        // 纳音
  shiShen: ShiShenConfig;              // 天干十神
  cangGan: CangGanConfig;              // 地支藏干
  cangGanShiShen: CangGanShiShenConfig; // 藏干十神
  wuXingCount: Record<WuXing, number>; // 五行统计
}

// ==================== 身强身弱分析类型 ====================

/** 强弱判断结果 */
export type StrengthLevel = '身强' | '身弱' | '中和';

/** 分析评分详情 */
export interface AnalysisScores {
  yueLingScore: number;        // 月令得分
  diZhiBiJieScore: number;     // 地支比劫根得分
  diZhiYinScore: number;       // 地支印星根得分
  tianGanShengZhuScore: number; // 天干生助得分
  tianGanKeXieScore: number;   // 天干克泄耗减分
  diZhiKeXieScore: number;     // 地支克泄耗减分
  totalScore: number;          // 综合得分
}

/** 身强身弱分析结果 */
export interface StrengthAnalysisResult {
  riGan: TianGan;
  riWuXing: WuXing;
  scores: AnalysisScores;
  strength: StrengthLevel;
  xiYong: WuXing[];    // 喜用五行
  jiShen: WuXing[];    // 忌神五行
  tiaoHou?: string;    // 调候提示
  special?: string;    // 特殊格局备注
}

// ==================== 物品五行分析类型 ====================

/** 物品形状 */
export type ItemShape = 'long' | 'sharp' | 'square' | 'round' | 'wave';

/** 物品颜色 */
export type ItemColor = 'green' | 'red' | 'yellow' | 'white' | 'black';

/** 物品材质 */
export type ItemMaterial = 'wood' | 'plastic' | 'ceramic' | 'metal' | 'water';

/** 方位 */
export type Direction = '东' | '东南' | '南' | '西南' | '西' | '西北' | '北' | '东北' | '中';

/** 季节 */
export type Season = '春' | '夏' | '长夏' | '秋' | '冬';

/** 气的强度等级 */
export type QiLevel = '气极强' | '气强' | '气平' | '气弱' | '气衰';

/** 物品特征 */
export interface ItemFeatures {
  shape: ItemShape;
  color: ItemColor;
  material: ItemMaterial;
  position: Direction;
  timestamp: Date;
  neighbors?: ItemFeatures[];
}

/** 物品五行分析结果 */
export interface ItemAnalysisResult {
  wuXing: WuXing;           // 物品五行属性
  qiLevel: QiLevel;         // 气的强度
  qiScore: number;          // 气的量化分数
  isXiYong: boolean;        // 是否为喜用
  isJiShen: boolean;        // 是否为忌神
  advice: string;           // 建议文案
  visualEffect: VisualEffect; // 视觉效果配置
}

// ==================== 用户档案类型 ====================

/** 用户五行档案 */
export interface UserProfile {
  id: string;
  name?: string;
  birthDate: string;        // YYYY-MM-DD 或 ISO 8601
  birthTime: string;        // HH:mm
  gender?: 'male' | 'female';
  bazi: BaziResult;
  strengthAnalysis: StrengthAnalysisResult;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== AR视觉反馈类型 ====================

/** 视觉效果配置 */
export interface VisualEffect {
  primaryColor: string;     // 主色调（十六进制）
  secondaryColor: string;   // 辅助色
  glowIntensity: number;    // 光晕强度 0-1
  particleCount: number;    // 粒子数量
  animationType: AnimationType;
  iconUri?: string;         // 五行图标URI
}

/** 动画类型 */
export type AnimationType = 
  | 'pulse'      // 脉冲
  | 'rotate'     // 旋转
  | 'float'      // 漂浮
  | 'sparkle'    // 闪烁
  | 'wave';      // 波动

/** AR识别结果 */
export interface ARDetectionResult {
  itemId: string;
  itemName: string;
  confidence: number;       // 识别置信度 0-1
  boundingBox: BoundingBox;
  itemAnalysis: ItemAnalysisResult;
  worldPosition: Position3D;
}

/** 3D位置 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/** 边界框 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ==================== 常量定义 ====================

/** 天干五行映射 */
export const TIAN_GAN_WU_XING: Record<TianGan, WuXing> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

/** 地支五行映射 */
export const DI_ZHI_WU_XING: Record<DiZhi, WuXing> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

/** 天干阴阳 */
export const TIAN_GAN_YIN_YANG: Record<TianGan, YinYang> = {
  '甲': '阳', '乙': '阴',
  '丙': '阳', '丁': '阴',
  '戊': '阳', '己': '阴',
  '庚': '阳', '辛': '阴',
  '壬': '阳', '癸': '阴'
};

/** 五行相生 */
export const WU_XING_SHENG: Record<WuXing, WuXing> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
};

/** 五行相克 */
export const WU_XING_KE: Record<WuXing, WuXing> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
};

/** 五行颜色映射 */
export const WU_XING_COLORS: Record<WuXing, { primary: string; secondary: string }> = {
  '木': { primary: '#4CAF50', secondary: '#81C784' },
  '火': { primary: '#F44336', secondary: '#E57373' },
  '土': { primary: '#FFC107', secondary: '#FFD54F' },
  '金': { primary: '#9E9E9E', secondary: '#BDBDBD' },
  '水': { primary: '#2196F3', secondary: '#64B5F6' }
};

/** 五行方位映射 */
export const WU_XING_DIRECTIONS: Record<WuXing, Direction[]> = {
  '木': ['东', '东南'],
  '火': ['南'],
  '土': ['中', '西南', '东北'],
  '金': ['西', '西北'],
  '水': ['北']
};

/** 地支藏干表 */
export const DI_ZHI_CANG_GAN: Record<DiZhi, CangGanInfo[]> = {
  '子': [{ gan: '癸', pos: '本' }],
  '丑': [
    { gan: '己', pos: '本' },
    { gan: '癸', pos: '中' },
    { gan: '辛', pos: '余' }
  ],
  '寅': [
    { gan: '甲', pos: '本' },
    { gan: '丙', pos: '中' },
    { gan: '戊', pos: '余' }
  ],
  '卯': [{ gan: '乙', pos: '本' }],
  '辰': [
    { gan: '戊', pos: '本' },
    { gan: '乙', pos: '中' },
    { gan: '癸', pos: '余' }
  ],
  '巳': [
    { gan: '丙', pos: '本' },
    { gan: '庚', pos: '中' },
    { gan: '戊', pos: '余' }
  ],
  '午': [
    { gan: '丁', pos: '本' },
    { gan: '己', pos: '中' }
  ],
  '未': [
    { gan: '己', pos: '本' },
    { gan: '丁', pos: '中' },
    { gan: '乙', pos: '余' }
  ],
  '申': [
    { gan: '庚', pos: '本' },
    { gan: '壬', pos: '中' },
    { gan: '戊', pos: '余' }
  ],
  '酉': [{ gan: '辛', pos: '本' }],
  '戌': [
    { gan: '戊', pos: '本' },
    { gan: '辛', pos: '中' },
    { gan: '丁', pos: '余' }
  ],
  '亥': [
    { gan: '壬', pos: '本' },
    { gan: '甲', pos: '中' }
  ]
};

// ==================== 工具函数类型 ====================

/** 五行关系类型 */
export type WuXingRelation = 'bi' | 'yin' | 'guan' | 'cai' | 'shi';

/** 获取五行关系 */
export function getWuXingRelation(ri: WuXing, other: WuXing): WuXingRelation {
  if (ri === other) return 'bi';
  if (WU_XING_SHENG[other] === ri) return 'yin';
  if (WU_XING_KE[other] === ri) return 'guan';
  if (WU_XING_KE[ri] === other) return 'cai';
  if (WU_XING_SHENG[ri] === other) return 'shi';
  throw new Error(`未知的五行关系: ${ri} - ${other}`);
}

/** 根据日期获取季节 */
export function getSeasonFromDate(date: Date): Season {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) {
    if ((month === 7 && day >= 7) || (month === 8 && day <= 7)) return '长夏';
    return '夏';
  }
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}
