/**
 * 天目核心算法服务
 * 整合三个算法文件：八字计算、身强身弱判断、物品五行喜忌
 */

import { Solar, Lunar } from 'lunar-javascript';

// ==================== 类型定义 ====================

/** 五行 */
export type WuXing = '木' | '火' | '土' | '金' | '水';

/** 十天干 */
export type Gan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

/** 十二地支 */
export type Zhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

/** 方位 */
export type Direction = '东' | '东南' | '南' | '西南' | '西' | '西北' | '北' | '东北' | '中';

/** 气强弱等级 */
export type QiLevel = '气极强' | '气强' | '气平' | '气弱' | '气衰';

/** 季节 */
export type Season = '春' | '夏' | '长夏' | '秋' | '冬';

/** 用户档案 */
export interface UserProfile {
  birthDate: string;      // 出生日期 YYYY-MM-DD
  birthTime: string;      // 出生时间 HH:mm
  gender: '男' | '女';
}

/** 八字结果 */
export interface BaziResult {
  yearPillar: string;     // 年柱
  monthPillar: string;    // 月柱
  dayPillar: string;      // 日柱
  hourPillar: string;     // 时柱
  yearGan: Gan;
  yearZhi: Zhi;
  monthGan: Gan;
  monthZhi: Zhi;
  dayGan: Gan;
  dayZhi: Zhi;
  hourGan: Gan;
  hourZhi: Zhi;
  dayMaster: Gan;         // 日主
  dayMasterWuXing: WuXing; // 日主五行
  nayin: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  shishen: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  canggan: {
    year: string[];
    month: string[];
    day: string[];
    hour: string[];
  };
}

/** 身强身弱分析结果 */
export interface StrengthResult {
  riGan: Gan;
  riWuXing: WuXing;
  totalScore: number;
  strength: '身强' | '身弱' | '中和';
  xiYong: WuXing[];       // 喜用五行
  jiShen: WuXing[];       // 忌神五行
  tiaoHou?: string;       // 调候提示
  special?: string;       // 特殊格局
}

/** 物品特征 */
export interface ItemFeatures {
  shape: 'long' | 'sharp' | 'square' | 'round' | 'wave';
  color: 'green' | 'red' | 'yellow' | 'white' | 'black';
  material: 'wood' | 'plastic' | 'ceramic' | 'metal' | 'water';
  position: Direction;
  timestamp: Date;
}

/** 物品分析结果 */
export interface ItemAnalysisResult {
  name: string;
  wuxing: WuXing;
  qiLevel: QiLevel;
  qiScore: number;
  isBeneficial: boolean;
  advice: string;
}

/** 完整用户命盘 */
export interface UserDestiny {
  profile: UserProfile;
  bazi: BaziResult;
  strength: StrengthResult;
}

// ==================== 常量定义 ====================

/** 天干 */
const HEAVENLY_STEMS: Gan[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/** 地支 */
const EARTHLY_BRANCHES: Zhi[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 天干五行 */
const TIAN_GAN_WU_XING: Record<Gan, WuXing> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

/** 地支五行 */
const DI_ZHI_WU_XING: Record<Zhi, WuXing> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

/** 月令旺衰五行（每个地支对应的旺气五行） */
const YUE_LING_WANG: Record<Zhi, WuXing> = {
  '寅': '木', '卯': '木',        // 春季木旺
  '辰': '土',                    // 季春土旺
  '巳': '火', '午': '火',        // 夏季火旺
  '未': '土',                    // 季夏土旺
  '申': '金', '酉': '金',        // 秋季金旺
  '戌': '土',                    // 季秋土旺
  '亥': '水', '子': '水',        // 冬季水旺
  '丑': '土',                    // 季冬土旺
};

/** 纳音表 */
const NAYIN_TABLE: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金',
  '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木',
  '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金',
  '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水',
  '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金',
  '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水',
  '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火',
  '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水',
  '甲午': '砂中金', '乙未': '砂中金',
  '丙申': '山下火', '丁酉': '山下火',
  '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土',
  '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火',
  '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土',
  '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木',
  '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土',
  '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木',
  '壬戌': '大海水', '癸亥': '大海水'
};

/** 地支藏干 */
const HIDDEN_STEMS: Record<Zhi, Gan[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
};

/** 五行相生 */
const SHENG: Record<WuXing, WuXing> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
};

/** 五行相克 */
const KE: Record<WuXing, WuXing> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
};

/** 季节五行得分 */
const SEASON_TABLE: Record<Season, Record<WuXing, number>> = {
  春: { 木: 50, 火: 30, 土: -20, 金: -10, 水: 0 },
  夏: { 木: 0, 火: 50, 土: 30, 金: -20, 水: -10 },
  长夏: { 木: -20, 火: 0, 土: 50, 金: 30, 水: -10 },
  秋: { 木: -10, 火: -20, 土: 0, 金: 50, 水: 30 },
  冬: { 木: 30, 火: -20, 土: -10, 金: 0, 水: 50 }
};

/** 方位五行得分 */
const DIRECTION_TABLE: Record<Direction, Record<WuXing, number>> = {
  东: { 木: 30, 火: 20, 土: -10, 金: -20, 水: -30 },
  东南: { 木: 30, 火: 20, 土: -10, 金: -20, 水: -30 },
  南: { 木: -10, 火: 30, 土: 20, 金: -20, 水: -30 },
  西南: { 木: -30, 火: -10, 土: 30, 金: 20, 水: -20 },
  西: { 木: -20, 火: -30, 土: -10, 金: 30, 水: 20 },
  西北: { 木: -20, 火: -30, 土: -10, 金: 30, 水: 20 },
  北: { 木: 20, 火: -30, 土: -20, 金: -10, 水: 30 },
  东北: { 木: -30, 火: -10, 土: 30, 金: 20, 水: -20 },
  中: { 木: -30, 火: -10, 土: 30, 金: 20, 水: -20 }
};

/** 五行英文映射 */
const WUXING_EN_MAP: Record<WuXing, string> = {
  '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water'
};

const WUXING_CN_MAP: Record<string, WuXing> = {
  'wood': '木', 'fire': '火', 'earth': '土', 'metal': '金', 'water': '水'
};

// ==================== 八字计算 ====================

/**
 * 计算八字
 * @param birthDate 出生日期 YYYY-MM-DD
 * @param birthTime 出生时间 HH:mm
 */
export function calculateBazi(birthDate: string, birthTime: string): BaziResult {
  // 处理日期
  const dateParts = birthDate.split('-').map(Number);
  const year = dateParts[0] || 2000;
  const month = dateParts[1] || 1;
  const day = dateParts[2] || 1;
  
  // 处理时间（支持 HH:mm 或 HH:mm:ss 格式）
  let hour = 12;
  let minute = 0;
  
  if (birthTime && typeof birthTime === 'string') {
    const timeParts = birthTime.split(':').map(Number);
    hour = timeParts[0] || 12;
    minute = timeParts[1] || 0;
  }
  
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  
  const yearGanZhi = eightChar.getYear();
  const monthGanZhi = eightChar.getMonth();
  const dayGanZhi = eightChar.getDay();
  const hourGanZhi = eightChar.getTime();
  
  const yearGan = yearGanZhi.substring(0, 1) as Gan;
  const yearZhi = yearGanZhi.substring(1, 2) as Zhi;
  const monthGan = monthGanZhi.substring(0, 1) as Gan;
  const monthZhi = monthGanZhi.substring(1, 2) as Zhi;
  const dayGan = dayGanZhi.substring(0, 1) as Gan;
  const dayZhi = dayGanZhi.substring(1, 2) as Zhi;
  const hourGan = hourGanZhi.substring(0, 1) as Gan;
  const hourZhi = hourGanZhi.substring(1, 2) as Zhi;
  
  return {
    yearPillar: yearGanZhi,
    monthPillar: monthGanZhi,
    dayPillar: dayGanZhi,
    hourPillar: hourGanZhi,
    yearGan,
    yearZhi,
    monthGan,
    monthZhi,
    dayGan,
    dayZhi,
    hourGan,
    hourZhi,
    dayMaster: dayGan,
    dayMasterWuXing: TIAN_GAN_WU_XING[dayGan],
    nayin: {
      year: NAYIN_TABLE[yearGan + yearZhi] || '',
      month: NAYIN_TABLE[monthGan + monthZhi] || '',
      day: NAYIN_TABLE[dayGan + dayZhi] || '',
      hour: NAYIN_TABLE[hourGan + hourZhi] || ''
    },
    shishen: {
      year: calculateShiShen(yearGan, dayGan),
      month: calculateShiShen(monthGan, dayGan),
      day: '日主',
      hour: calculateShiShen(hourGan, dayGan)
    },
    canggan: {
      year: HIDDEN_STEMS[yearZhi] || [],
      month: HIDDEN_STEMS[monthZhi] || [],
      day: HIDDEN_STEMS[dayZhi] || [],
      hour: HIDDEN_STEMS[hourZhi] || []
    }
  };
}

/**
 * 计算十神
 */
function calculateShiShen(gan: Gan, dayMaster: Gan): string {
  const ganElement = TIAN_GAN_WU_XING[gan];
  const dayMasterElement = TIAN_GAN_WU_XING[dayMaster];
  
  const ganIndex = HEAVENLY_STEMS.indexOf(gan);
  const dayMasterIndex = HEAVENLY_STEMS.indexOf(dayMaster);
  
  const ganYinYang = ganIndex % 2 === 0 ? '阳' : '阴';
  const dayMasterYinYang = dayMasterIndex % 2 === 0 ? '阳' : '阴';
  
  if (ganElement === dayMasterElement) {
    return ganYinYang === dayMasterYinYang ? '比肩' : '劫财';
  }
  
  if (SHENG[dayMasterElement] === ganElement) {
    return ganYinYang === dayMasterYinYang ? '食神' : '伤官';
  }
  
  if (KE[dayMasterElement] === ganElement) {
    return ganYinYang === dayMasterYinYang ? '偏财' : '正财';
  }
  
  if (SHENG[ganElement] === dayMasterElement) {
    return ganYinYang === dayMasterYinYang ? '偏印' : '正印';
  }
  
  if (KE[ganElement] === dayMasterElement) {
    return ganYinYang === dayMasterYinYang ? '七杀' : '正官';
  }
  
  return '未知';
}

// ==================== 身强身弱分析 ====================

/** 十神关系类型 */
type Relation = 'bi' | 'yin' | 'guan' | 'cai' | 'shi';

/**
 * 获取五行关系
 */
function getRelation(ri: WuXing, other: WuXing): Relation {
  if (ri === other) return 'bi';
  if (SHENG[other] === ri) return 'yin';
  if (KE[other] === ri) return 'guan';
  if (KE[ri] === other) return 'cai';
  if (SHENG[ri] === other) return 'shi';
  throw new Error('未知五行关系');
}

/** 藏干位置 */
interface CangGan {
  gan: Gan;
  pos: '本' | '中' | '余';
}

/** 地支藏干详细 */
const DI_ZHI_CANG_GAN: Record<Zhi, CangGan[]> = {
  '子': [{ gan: '癸', pos: '本' }],
  '丑': [{ gan: '己', pos: '本' }, { gan: '癸', pos: '中' }, { gan: '辛', pos: '余' }],
  '寅': [{ gan: '甲', pos: '本' }, { gan: '丙', pos: '中' }, { gan: '戊', pos: '余' }],
  '卯': [{ gan: '乙', pos: '本' }],
  '辰': [{ gan: '戊', pos: '本' }, { gan: '乙', pos: '中' }, { gan: '癸', pos: '余' }],
  '巳': [{ gan: '丙', pos: '本' }, { gan: '庚', pos: '中' }, { gan: '戊', pos: '余' }],
  '午': [{ gan: '丁', pos: '本' }, { gan: '己', pos: '中' }],
  '未': [{ gan: '己', pos: '本' }, { gan: '丁', pos: '中' }, { gan: '乙', pos: '余' }],
  '申': [{ gan: '庚', pos: '本' }, { gan: '壬', pos: '中' }, { gan: '戊', pos: '余' }],
  '酉': [{ gan: '辛', pos: '本' }],
  '戌': [{ gan: '戊', pos: '本' }, { gan: '辛', pos: '中' }, { gan: '丁', pos: '余' }],
  '亥': [{ gan: '壬', pos: '本' }, { gan: '甲', pos: '中' }]
};

/**
 * 分析身强身弱（修正版）
 * 公式：总分 = 月令分 + 根气分 + 帮手分 — 克泄分
 * 判断标准：总分≥60为身强，≤40为身弱，41~59为中和
 */
export function analyzeStrength(bazi: BaziResult): StrengthResult {
  const riGan = bazi.dayGan;
  const riWuXing = TIAN_GAN_WU_XING[riGan];
  
  const tianGanList = [bazi.yearGan, bazi.monthGan, bazi.hourGan];
  const allZhi = [bazi.yearZhi, bazi.monthZhi, bazi.dayZhi, bazi.hourZhi];
  const monthZhi = bazi.monthZhi;
  
  // ==================== 1. 月令分 ====================
  // 得令：日主五行与月令旺气一致 → +50
  // 相：月令旺气生日主 → +30
  // 失令：月令旺气克/泄日主 → -30
  const monthWangWuXing = YUE_LING_WANG[monthZhi];
  let yueLingScore = 0;
  
  if (monthWangWuXing === riWuXing) {
    // 得令：日主五行与月令旺气相同
    yueLingScore = 50;
  } else if (SHENG[monthWangWuXing] === riWuXing) {
    // 相：月令旺气生日主（如春木生火）
    yueLingScore = 30;
  } else {
    // 失令：月令旺气克或泄日主
    yueLingScore = -30;
  }
  
  // ==================== 2. 根气分（最多+30分） ====================
  // 强根：寅、卯、巳、午、申、酉、亥、子的本气为比劫 → +30
  // 弱根：辰、未、戌、丑中藏有比劫余气 → +10
  let genQiScore = 0;
  const strongRootZhi: Zhi[] = ['寅', '卯', '巳', '午', '申', '酉', '亥', '子'];
  const otherZhi = [bazi.yearZhi, bazi.dayZhi, bazi.hourZhi];
  
  for (const zhi of otherZhi) {
    const cang = DI_ZHI_CANG_GAN[zhi];
    for (const cg of cang) {
      const w = TIAN_GAN_WU_XING[cg.gan];
      if (w === riWuXing) {
        // 找到比劫根
        if (strongRootZhi.includes(zhi) && cg.pos === '本') {
          genQiScore += 30;
        } else if (cg.pos === '中') {
          genQiScore += 20;
        } else {
          genQiScore += 10;
        }
      }
    }
  }
  genQiScore = Math.min(genQiScore, 30); // 上限30分
  
  // ==================== 3. 帮手分（最多+20分） ====================
  // 每个生扶日主的天干（印、比劫）→ +10分
  let bangShouScore = 0;
  for (const gan of tianGanList) {
    const w = TIAN_GAN_WU_XING[gan];
    if (w === riWuXing) {
      // 比劫
      bangShouScore += 10;
    } else if (SHENG[w] === riWuXing) {
      // 印星（生我者）
      bangShouScore += 10;
    }
  }
  bangShouScore = Math.min(bangShouScore, 20); // 上限20分
  
  // ==================== 4. 克泄分（最多-30分） ====================
  // 每个克日主的天干（官杀）→ -10分
  // 每个泄耗日主的天干（食伤、财）→ -5分
  let keXieScore = 0;
  for (const gan of tianGanList) {
    const w = TIAN_GAN_WU_XING[gan];
    if (KE[w] === riWuXing) {
      // 官杀（克我者）
      keXieScore -= 10;
    } else if (SHENG[riWuXing] === w) {
      // 食伤（我生者）
      keXieScore -= 5;
    } else if (KE[riWuXing] === w) {
      // 财星（我克者）
      keXieScore -= 5;
    }
  }
  keXieScore = Math.max(keXieScore, -30); // 下限-30分
  
  // ==================== 5. 总分计算 ====================
  const totalScore = yueLingScore + genQiScore + bangShouScore + keXieScore;
  
  // ==================== 6. 强弱判断 ====================
  let strength: '身强' | '身弱' | '中和';
  if (totalScore >= 60) strength = '身强';
  else if (totalScore <= 40) strength = '身弱';
  else strength = '中和';
  
  // ==================== 7. 喜忌判断 ====================
  const allWuXing: WuXing[] = ['木', '火', '土', '金', '水'];
  let xiYong: WuXing[] = [];
  let jiShen: WuXing[] = [];
  
  if (strength === '身强') {
    // 身强喜克泄耗
    xiYong = allWuXing.filter(w => {
      const rel = getRelation(riWuXing, w);
      return rel === 'guan' || rel === 'cai' || rel === 'shi';
    });
    jiShen = allWuXing.filter(w => {
      const rel = getRelation(riWuXing, w);
      return rel === 'bi' || rel === 'yin';
    });
  } else if (strength === '身弱') {
    // 身弱喜印比
    xiYong = allWuXing.filter(w => {
      const rel = getRelation(riWuXing, w);
      return rel === 'bi' || rel === 'yin';
    });
    jiShen = allWuXing.filter(w => {
      const rel = getRelation(riWuXing, w);
      return rel === 'guan' || rel === 'cai' || rel === 'shi';
    });
  } else {
    // 中和：喜忌不明显
    xiYong = [];
    jiShen = [];
  }
  
  // ==================== 8. 调候 ====================
  const summer: Zhi[] = ['巳', '午', '未'];
  const winter: Zhi[] = ['亥', '子', '丑'];
  let tiaoHou = '';
  if (summer.includes(monthZhi)) {
    tiaoHou = '生于夏季，气候炎热，优先喜水调候。';
  } else if (winter.includes(monthZhi)) {
    tiaoHou = '生于冬季，气候寒冷，优先喜火调候。';
  }
  
  return {
    riGan,
    riWuXing,
    totalScore,
    strength,
    xiYong,
    jiShen,
    tiaoHou: tiaoHou || undefined,
  };
}

// ==================== 物品五行分析 ====================

/**
 * 获取季节
 */
function getSeason(date: Date): Season {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) {
    if (month === 7 && day >= 7) return '长夏';
    if (month === 8 && day <= 7) return '长夏';
    return '夏';
  }
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

/**
 * 判断物品五行
 */
export function determineItemWuXing(features: ItemFeatures): WuXing {
  const scores: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  
  // 形状得分
  const shapeScores: Record<string, Record<WuXing, number>> = {
    long: { 木: 30, 火: 0, 土: 0, 金: 0, 水: 0 },
    sharp: { 木: 0, 火: 30, 土: 0, 金: 0, 水: 0 },
    square: { 木: 0, 火: 0, 土: 30, 金: 0, 水: 0 },
    round: { 木: 0, 火: 0, 土: 0, 金: 30, 水: 0 },
    wave: { 木: 0, 火: 0, 土: 0, 金: 0, 水: 30 }
  };
  for (const [wx, s] of Object.entries(shapeScores[features.shape])) {
    scores[wx as WuXing] += s;
  }
  
  // 颜色得分
  const colorScores: Record<string, Record<WuXing, number>> = {
    green: { 木: 30, 火: 0, 土: 0, 金: 0, 水: 0 },
    red: { 木: 0, 火: 30, 土: 0, 金: 0, 水: 0 },
    yellow: { 木: 0, 火: 0, 土: 30, 金: 0, 水: 0 },
    white: { 木: 0, 火: 0, 土: 0, 金: 30, 水: 0 },
    black: { 木: 0, 火: 0, 土: 0, 金: 0, 水: 30 }
  };
  for (const [wx, s] of Object.entries(colorScores[features.color])) {
    scores[wx as WuXing] += s;
  }
  
  // 材质得分
  const materialScores: Record<string, Record<WuXing, number>> = {
    wood: { 木: 40, 火: 0, 土: 0, 金: 0, 水: 0 },
    plastic: { 木: 0, 火: 40, 土: 0, 金: 0, 水: 0 },
    ceramic: { 木: 0, 火: 0, 土: 40, 金: 0, 水: 0 },
    metal: { 木: 0, 火: 0, 土: 0, 金: 40, 水: 0 },
    water: { 木: 0, 火: 0, 土: 0, 金: 0, 水: 40 }
  };
  for (const [wx, s] of Object.entries(materialScores[features.material])) {
    scores[wx as WuXing] += s;
  }
  
  let max = -1;
  let result: WuXing = '木';
  for (const wx in scores) {
    if (scores[wx as WuXing] > max) {
      max = scores[wx as WuXing];
      result = wx as WuXing;
    }
  }
  return result;
}

/**
 * 计算气强弱
 */
export function calculateQiStrength(itemWuXing: WuXing, features: ItemFeatures): { level: QiLevel; score: number } {
  const season = getSeason(features.timestamp);
  const seasonScore = SEASON_TABLE[season][itemWuXing];
  const directionScore = DIRECTION_TABLE[features.position][itemWuXing];
  
  const total = seasonScore * 0.5 + directionScore * 0.5;
  
  let level: QiLevel;
  if (total > 40) level = '气极强';
  else if (total > 20) level = '气强';
  else if (total > 0) level = '气平';
  else if (total > -20) level = '气弱';
  else level = '气衰';
  
  return { level, score: Math.round(total) };
}

/**
 * 获取建议
 */
export function getAdvice(itemWuXing: WuXing, qiLevel: QiLevel, xiYong: WuXing[], jiShen: WuXing[]): string {
  const isXi = xiYong.includes(itemWuXing);
  const isJi = jiShen.includes(itemWuXing);
  
  if (!isXi && !isJi) return '能量中和，影响较小';
  
  if (isXi) {
    if (qiLevel === '气极强' || qiLevel === '气强') return '生助你，强力补充能量';
    if (qiLevel === '气平') return '微助，可增强此处能量';
    return '能量微弱，几乎无影响';
  } else {
    if (qiLevel === '气极强' || qiLevel === '气强') return '损耗你，消耗元气';
    if (qiLevel === '气平') return '微损，影响不大';
    return '能量微弱，危害可忽略';
  }
}

/**
 * 分析物品
 */
export function analyzeItem(
  name: string,
  features: ItemFeatures,
  xiYong: WuXing[],
  jiShen: WuXing[]
): ItemAnalysisResult {
  const wuxing = determineItemWuXing(features);
  const { level, score } = calculateQiStrength(wuxing, features);
  const advice = getAdvice(wuxing, level, xiYong, jiShen);
  
  return {
    name,
    wuxing,
    qiLevel: level,
    qiScore: score,
    isBeneficial: xiYong.includes(wuxing),
    advice
  };
}

// ==================== 综合服务 ====================

/**
 * 创建用户命盘
 */
export function createUserDestiny(profile: UserProfile): UserDestiny {
  const bazi = calculateBazi(profile.birthDate, profile.birthTime);
  const strength = analyzeStrength(bazi);
  
  return {
    profile,
    bazi,
    strength
  };
}

/**
 * 调试函数 - 输出详细的身强身弱计算过程（修正版）
 */
export function debugStrengthAnalysis(bazi: BaziResult): {
  result: StrengthResult;
  details: {
    yueLingScore: number;
    yueLingStatus: string;
    genQiScore: number;
    bangShouScore: number;
    keXieScore: number;
  };
} {
  const riGan = bazi.dayGan;
  const riWuXing = TIAN_GAN_WU_XING[riGan];
  
  const tianGanList = [bazi.yearGan, bazi.monthGan, bazi.hourGan];
  const monthZhi = bazi.monthZhi;
  
  // 1. 月令分
  const monthWangWuXing = YUE_LING_WANG[monthZhi];
  let yueLingScore = 0;
  let yueLingStatus = '';
  
  if (monthWangWuXing === riWuXing) {
    yueLingScore = 50;
    yueLingStatus = '得令';
  } else if (SHENG[monthWangWuXing] === riWuXing) {
    yueLingScore = 30;
    yueLingStatus = '相';
  } else {
    yueLingScore = -30;
    yueLingStatus = '失令';
  }
  
  // 2. 根气分
  let genQiScore = 0;
  const strongRootZhi: Zhi[] = ['寅', '卯', '巳', '午', '申', '酉', '亥', '子'];
  const otherZhi = [bazi.yearZhi, bazi.dayZhi, bazi.hourZhi];
  
  for (const zhi of otherZhi) {
    const cang = DI_ZHI_CANG_GAN[zhi];
    for (const cg of cang) {
      const w = TIAN_GAN_WU_XING[cg.gan];
      if (w === riWuXing) {
        if (strongRootZhi.includes(zhi) && cg.pos === '本') {
          genQiScore += 30;
        } else if (cg.pos === '中') {
          genQiScore += 20;
        } else {
          genQiScore += 10;
        }
      }
    }
  }
  genQiScore = Math.min(genQiScore, 30);
  
  // 3. 帮手分
  let bangShouScore = 0;
  for (const gan of tianGanList) {
    const w = TIAN_GAN_WU_XING[gan];
    if (w === riWuXing || SHENG[w] === riWuXing) {
      bangShouScore += 10;
    }
  }
  bangShouScore = Math.min(bangShouScore, 20);
  
  // 4. 克泄分
  let keXieScore = 0;
  for (const gan of tianGanList) {
    const w = TIAN_GAN_WU_XING[gan];
    if (KE[w] === riWuXing) {
      keXieScore -= 10;
    } else if (SHENG[riWuXing] === w || KE[riWuXing] === w) {
      keXieScore -= 5;
    }
  }
  keXieScore = Math.max(keXieScore, -30);
  
  const totalScore = yueLingScore + genQiScore + bangShouScore + keXieScore;
  
  let strength: '身强' | '身弱' | '中和';
  if (totalScore >= 60) strength = '身强';
  else if (totalScore <= 40) strength = '身弱';
  else strength = '中和';
  
  const allWuXing: WuXing[] = ['木', '火', '土', '金', '水'];
  let xiYong: WuXing[] = [];
  let jiShen: WuXing[] = [];
  
  if (strength === '身强') {
    xiYong = allWuXing.filter(w => {
      const rel = getRelation(riWuXing, w);
      return rel === 'guan' || rel === 'cai' || rel === 'shi';
    });
    jiShen = allWuXing.filter(w => {
      const rel = getRelation(riWuXing, w);
      return rel === 'bi' || rel === 'yin';
    });
  } else if (strength === '身弱') {
    xiYong = allWuXing.filter(w => {
      const rel = getRelation(riWuXing, w);
      return rel === 'bi' || rel === 'yin';
    });
    jiShen = allWuXing.filter(w => {
      const rel = getRelation(riWuXing, w);
      return rel === 'guan' || rel === 'cai' || rel === 'shi';
    });
  }
  
  return {
    result: {
      riGan,
      riWuXing,
      totalScore,
      strength,
      xiYong,
      jiShen,
    },
    details: {
      yueLingScore,
      yueLingStatus,
      genQiScore,
      bangShouScore,
      keXieScore,
    }
  };
}

/**
 * 五行转英文
 */
export function wuxingToEn(wuxing: WuXing): string {
  return WUXING_EN_MAP[wuxing];
}

/**
 * 英文转五行
 */
export function enToWuxing(en: string): WuXing {
  return WUXING_CN_MAP[en];
}

// 导出默认服务对象
const TianmuCore = {
  calculateBazi,
  analyzeStrength,
  determineItemWuXing,
  calculateQiStrength,
  getAdvice,
  analyzeItem,
  createUserDestiny,
  wuxingToEn,
  enToWuxing
};

export default TianmuCore;
