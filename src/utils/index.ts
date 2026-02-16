/**
 * 天目应用 - 工具函数库
 * 提供日期处理、五行计算、数据转换等通用工具
 */

import {
  WuXing,
  TianGan,
  DiZhi,
  Direction,
  Season,
  TIAN_GAN_WU_XING,
  DI_ZHI_WU_XING,
  WU_XING_SHENG,
  WU_XING_KE,
} from '../types';

// ==================== 日期工具 ====================

/**
 * 格式化日期为中文格式
 */
export function formatDateChinese(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const tiangan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  
  const ganIndex = (year - 4) % 10;
  const zhiIndex = (year - 4) % 12;
  
  return `${year}年${month}月${day}日 (${tiangan[ganIndex]}${dizhi[zhiIndex]}年)`;
}

/**
 * 获取农历日期描述
 */
export function getLunarDateDescription(date: Date): string {
  const month = date.getMonth() + 1;
  const seasons: Record<number, string> = {
    1: '孟春', 2: '仲春', 3: '季春',
    4: '孟夏', 5: '仲夏', 6: '季夏',
    7: '孟秋', 8: '仲秋', 9: '季秋',
    10: '孟冬', 11: '仲冬', 12: '季冬',
  };
  
  return seasons[month] || '';
}

/**
 * 根据日期判断节气
 */
export function getSolarTerm(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const solarTerms = [
    { month: 2, day: 4, name: '立春' },
    { month: 2, day: 19, name: '雨水' },
    { month: 3, day: 6, name: '惊蛰' },
    { month: 3, day: 21, name: '春分' },
    { month: 4, day: 5, name: '清明' },
    { month: 4, day: 20, name: '谷雨' },
    { month: 5, day: 6, name: '立夏' },
    { month: 5, day: 21, name: '小满' },
    { month: 6, day: 6, name: '芒种' },
    { month: 6, day: 21, name: '夏至' },
    { month: 7, day: 7, name: '小暑' },
    { month: 7, day: 23, name: '大暑' },
    { month: 8, day: 8, name: '立秋' },
    { month: 8, day: 23, name: '处暑' },
    { month: 9, day: 8, name: '白露' },
    { month: 9, day: 23, name: '秋分' },
    { month: 10, day: 8, name: '寒露' },
    { month: 10, day: 24, name: '霜降' },
    { month: 11, day: 8, name: '立冬' },
    { month: 11, day: 22, name: '小雪' },
    { month: 12, day: 7, name: '大雪' },
    { month: 12, day: 22, name: '冬至' },
    { month: 1, day: 6, name: '小寒' },
    { month: 1, day: 20, name: '大寒' },
  ];
  
  for (const term of solarTerms) {
    if (term.month === month && Math.abs(day - term.day) <= 2) {
      return term.name;
    }
  }
  
  return '';
}

// ==================== 五行计算工具 ====================

/**
 * 计算五行相生关系
 */
export function getShengRelation(from: WuXing): WuXing {
  return WU_XING_SHENG[from];
}

/**
 * 计算五行相克关系
 */
export function getKeRelation(from: WuXing): WuXing {
  return WU_XING_KE[from];
}

/**
 * 判断两个五行的关系
 */
export function getWuXingRelationName(a: WuXing, b: WuXing): string {
  if (a === b) return '比和';
  if (WU_XING_SHENG[a] === b) return '我生';
  if (WU_XING_SHENG[b] === a) return '生我';
  if (WU_XING_KE[a] === b) return '我克';
  if (WU_XING_KE[b] === a) return '克我';
  return '无关';
}

/**
 * 获取五行相生链条
 */
export function getShengChain(start: WuXing): WuXing[] {
  const chain: WuXing[] = [start];
  let current = start;
  
  for (let i = 0; i < 4; i++) {
    current = WU_XING_SHENG[current];
    chain.push(current);
  }
  
  return chain;
}

/**
 * 获取五行相克链条
 */
export function getKeChain(start: WuXing): WuXing[] {
  const chain: WuXing[] = [start];
  let current = start;
  
  for (let i = 0; i < 4; i++) {
    current = WU_XING_KE[current];
    chain.push(current);
  }
  
  return chain;
}

/**
 * 计算五行平衡度
 */
export function calculateWuXingBalance(counts: Record<WuXing, number>): {
  balanced: boolean;
  dominant: WuXing | null;
  weak: WuXing | null;
  score: number;
} {
  const values = Object.values(counts);
  const total = values.reduce((a, b) => a + b, 0);
  const avg = total / 5;
  
  let max = 0;
  let min = Infinity;
  let dominant: WuXing | null = null;
  let weak: WuXing | null = null;
  
  for (const [wx, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      dominant = wx as WuXing;
    }
    if (count < min) {
      min = count;
      weak = wx as WuXing;
    }
  }
  
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / 5;
  const score = Math.max(0, 100 - variance * 10);
  
  return {
    balanced: variance < 1,
    dominant,
    weak,
    score,
  };
}

// ==================== 方位工具 ====================

/**
 * 根据角度获取方位
 */
export function getDirectionFromAngle(angle: number): Direction {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return '东';
  if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return '东南';
  if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return '南';
  if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return '西南';
  if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return '西';
  if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return '西北';
  if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return '北';
  return '东北';
}

/**
 * 获取方位对应五行
 */
export function getDirectionWuXing(direction: Direction): WuXing {
  const map: Record<Direction, WuXing> = {
    '东': '木',
    '东南': '木',
    '南': '火',
    '西南': '土',
    '西': '金',
    '西北': '金',
    '北': '水',
    '东北': '土',
    '中': '土',
  };
  return map[direction];
}

/**
 * 获取五行有利方位
 */
export function getFavorableDirections(wuXing: WuXing): Direction[] {
  const map: Record<WuXing, Direction[]> = {
    '木': ['东', '东南'],
    '火': ['南'],
    '土': ['中', '西南', '东北'],
    '金': ['西', '西北'],
    '水': ['北'],
  };
  return map[wuXing];
}

// ==================== 数据转换工具 ====================

/**
 * 天干转数字索引
 */
export function tianGanToIndex(gan: TianGan): number {
  const tiangan: TianGan[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  return tiangan.indexOf(gan);
}

/**
 * 地支转数字索引
 */
export function diZhiToIndex(zhi: DiZhi): number {
  const dizhi: DiZhi[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return dizhi.indexOf(zhi);
}

/**
 * 数字索引转天干
 */
export function indexToTianGan(index: number): TianGan {
  const tiangan: TianGan[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  return tiangan[index % 10];
}

/**
 * 数字索引转地支
 */
export function indexToDiZhi(index: number): DiZhi {
  const dizhi: DiZhi[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return dizhi[index % 12];
}

/**
 * 判断天干阴阳
 */
export function getTianGanYinYang(gan: TianGan): '阴' | '阳' {
  return tianGanToIndex(gan) % 2 === 0 ? '阳' : '阴';
}

/**
 * 判断地支阴阳
 */
export function getDiZhiYinYang(zhi: DiZhi): '阴' | '阳' {
  return diZhiToIndex(zhi) % 2 === 0 ? '阳' : '阴';
}

// ==================== 验证工具 ====================

/**
 * 验证日期格式
 */
export function validateDateFormat(date: string): boolean {
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  return isoPattern.test(date);
}

/**
 * 验证时间格式
 */
export function validateTimeFormat(time: string): boolean {
  const pattern = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!pattern.test(time)) return false;
  
  const [hour, minute] = time.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

/**
 * 验证八字四柱完整性
 */
export function validateBazi(bazi: {
  year: { gan: string; zhi: string };
  month: { gan: string; zhi: string };
  day: { gan: string; zhi: string };
  hour: { gan: string; zhi: string };
}): boolean {
  const validGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const validZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  
  for (const pillar of Object.values(bazi)) {
    if (!validGan.includes(pillar.gan) || !validZhi.includes(pillar.zhi)) {
      return false;
    }
  }
  
  return true;
}

// ==================== 随机生成工具 ====================

/**
 * 生成唯一ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * 随机选择数组元素
 */
export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 打乱数组顺序
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
