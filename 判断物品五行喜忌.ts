// types.ts
export type WuXing = '木' | '火' | '土' | '金' | '水';
export type Direction = '东' | '东南' | '南' | '西南' | '西' | '西北' | '北' | '东北' | '中';
export type QiLevel = '气极强' | '气强' | '气平' | '气弱' | '气衰';
export type Season = '春' | '夏' | '长夏' | '秋' | '冬';

export interface ItemFeatures {
  shape: 'long' | 'sharp' | 'square' | 'round' | 'wave';
  color: 'green' | 'red' | 'yellow' | 'white' | 'black';
  material: 'wood' | 'plastic' | 'ceramic' | 'metal' | 'water';
  position: Direction;
  timestamp: Date;
  neighbors: ItemFeatures[]; // 简化，实际可传已识别的物品列表
}

export interface UserProfile {
  xiYong: WuXing[];
  jiShen: WuXing[];
}

// constants.ts
export const sheng: Record<WuXing, WuXing> = { 木:'火',火:'土',土:'金',金:'水',水:'木' };
export const ke: Record<WuXing, WuXing> = { 木:'土',土:'水',水:'火',火:'金',金:'木' };

export const seasonTable: Record<Season, Record<WuXing, number>> = {
  春: { 木:50, 火:30, 土:-20, 金:-10, 水:0 },
  夏: { 木:0, 火:50, 土:30, 金:-20, 水:-10 },
  长夏: { 木:-20, 火:0, 土:50, 金:30, 水:-10 },
  秋: { 木:-10, 火:-20, 土:0, 金:50, 水:30 },
  冬: { 木:30, 火:-20, 土:-10, 金:0, 水:50 }
};

export const directionTable: Record<Direction, Record<WuXing, number>> = {
  东: { 木:30, 火:20, 土:-10, 金:-20, 水:-30 },
  东南: { 木:30, 火:20, 土:-10, 金:-20, 水:-30 },
  南: { 木:-10, 火:30, 土:20, 金:-20, 水:-30 },
  西南: { 木:-30, 火:-10, 土:30, 金:20, 水:-20 },
  西: { 木:-20, 火:-30, 土:-10, 金:30, 水:20 },
  西北: { 木:-20, 火:-30, 土:-10, 金:30, 水:20 },
  北: { 木:20, 火:-30, 土:-20, 金:-10, 水:30 },
  东北: { 木:-30, 火:-10, 土:30, 金:20, 水:-20 },
  中: { 木:-30, 火:-10, 土:30, 金:20, 水:-20 }
};

// 根据日期获取季节
export function getSeason(date: Date): Season {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // 简化：按月份粗略划分（实际应按节气）
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) {
    // 长夏大致在7月下半月至8月上半月，简化处理
    if (month === 7 && day >= 7) return '长夏';
    if (month === 8 && day <= 7) return '长夏';
    return '夏';
  }
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

// item.ts
export function determineItemWuXing(features: ItemFeatures): WuXing {
  const scores: Record<WuXing, number> = { 木:0, 火:0, 土:0, 金:0, 水:0 };
  
  const shapeScores = {
    long: { 木:30 },
    sharp: { 火:30 },
    square: { 土:30 },
    round: { 金:30 },
    wave: { 水:30 }
  }[features.shape];
  for (const [wx, s] of Object.entries(shapeScores)) {
    scores[wx as WuXing] += s;
  }
  
  const colorScores = {
    green: { 木:30 },
    red: { 火:30 },
    yellow: { 土:30 },
    white: { 金:30 },
    black: { 水:30 }
  }[features.color];
  for (const [wx, s] of Object.entries(colorScores)) {
    scores[wx as WuXing] += s;
  }
  
  const materialScores = {
    wood: { 木:40 },
    plastic: { 火:40 },
    ceramic: { 土:40 },
    metal: { 金:40 },
    water: { 水:40 }
  }[features.material];
  for (const [wx, s] of Object.entries(materialScores)) {
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

export function calculateQiStrength(itemWuXing: WuXing, features: ItemFeatures): QiLevel {
  const season = getSeason(features.timestamp);
  const seasonScore = seasonTable[season][itemWuXing];
  
  const directionScore = directionTable[features.position][itemWuXing];
  
  let shiScore = 0;
  for (const neighbor of features.neighbors) {
    const nWuXing = determineItemWuXing(neighbor);
    if (nWuXing === itemWuXing) {
      shiScore += 15;
    } else if (sheng[nWuXing] === itemWuXing) {
      shiScore += 10;
    } else if (ke[nWuXing] === itemWuXing) {
      shiScore -= 10;
    }
  }
  
  const total = seasonScore * 0.4 + directionScore * 0.3 + shiScore * 0.3;
  
  if (total > 120) return '气极强';
  if (total > 80) return '气强';
  if (total > 40) return '气平';
  if (total > 0) return '气弱';
  return '气衰';
}

// advice.ts
export function getAdvice(itemWuXing: WuXing, qiLevel: QiLevel, user: UserProfile): string {
  const isXi = user.xiYong.includes(itemWuXing);
  const isJi = user.jiShen.includes(itemWuXing);
  if (!isXi && !isJi) return '能量中和';
  
  if (isXi) {
    if (qiLevel === '气极强' || qiLevel === '气强') return '生助你，强力补充能量';
    if (qiLevel === '气平' || qiLevel === '气弱') return '微助，可增强此处能量';
    return '能量微弱，几乎无影响';
  } else {
    if (qiLevel === '气极强' || qiLevel === '气强') return '损耗你，消耗元气';
    if (qiLevel === '气平' || qiLevel === '气弱') return '微损，影响不大';
    return '能量微弱，危害可忽略';
  }
}