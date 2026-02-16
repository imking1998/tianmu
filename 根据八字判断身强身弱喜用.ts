/**
 * 八字身强身弱与喜用神判断算法
 * 参照：《三命通会》《子平真诠》《滴天髓》
 * 核心原则：月令（40-50%）、通根（30-40%）、天干生助（10-20%）、克泄耗（减分）
 * 最后更新：2025-04-09
 */

// ---------- 类型定义 ----------
/** 五行 */
type WuXing = '木' | '火' | '土' | '金' | '水';
/** 十天干 */
type Gan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
/** 十二地支 */
type Zhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
/** 十神关系 */
type Relation = 'bi' | 'yin' | 'guan' | 'cai' | 'shi'; // 比肩/劫财、正印/偏印、正官/七杀、正财/偏财、食神/伤官

/** 四柱八字输入 */
interface EightCharacters {
  year: { gan: Gan; zhi: Zhi };
  month: { gan: Gan; zhi: Zhi };
  day: { gan: Gan; zhi: Zhi };
  hour: { gan: Gan; zhi: Zhi };
}

/** 分析结果 */
interface AnalysisResult {
  riGan: Gan;                    // 日干
  riWuXing: WuXing;              // 日主五行
  totalScore: number;             // 综合得分
  strength: '身强' | '身弱' | '中和';
  xiYong: WuXing[];               // 喜用五行（列表）
  jiShen: WuXing[];               // 忌神五行（列表）
  tiaoHou?: string;               // 调候提示
  special?: string;                // 特殊格局备注
}

// ---------- 基础映射 ----------
/** 天干五行 */
const tianGanWuXing: Record<Gan, WuXing> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

/** 藏干数据结构 */
interface CangGan {
  gan: Gan;
  pos: '本' | '中' | '余';
}

/** 地支藏干（按本、中、余顺序） */
const diZhiCangGan: Record<Zhi, CangGan[]> = {
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

/** 五行相生关系 */
const sheng: Record<WuXing, WuXing> = {
  '木': '火',
  '火': '土',
  '土': '金',
  '金': '水',
  '水': '木'
};

/** 五行相克关系 */
const ke: Record<WuXing, WuXing> = {
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金',
  '金': '木'
};

/**
 * 根据日主五行与其他五行判断十神关系
 * @param ri 日主五行
 * @param other 其他五行
 * @returns 十神关系
 */
function getRelation(ri: WuXing, other: WuXing): Relation {
  if (ri === other) return 'bi';
  if (sheng[other] === ri) return 'yin';
  if (ke[other] === ri) return 'guan';
  if (ke[ri] === other) return 'cai';
  if (sheng[ri] === other) return 'shi';
  throw new Error('未知五行关系');
}

// ---------- 核心分析函数 ----------
/**
 * 分析八字强弱与喜忌
 * @param ec 八字输入
 * @returns 分析结果
 */
export function analyzeBazi(ec: EightCharacters): AnalysisResult {
  const riGan = ec.day.gan;
  const riWuXing = tianGanWuXing[riGan];

  // ---------- 分数初始化 ----------
  let yueLingScore = 0;           // 月令得分
  let diZhiBiJieScore = 0;        // 地支比劫根得分
  let diZhiYinScore = 0;           // 地支印星根得分
  let tianGanShengZhuScore = 0;    // 天干生助得分
  let tianGanKeXieScore = 0;       // 天干克泄耗减分
  let diZhiKeXieScore = 0;         // 地支克泄耗减分

  // 所有天干（不含日干）
  const tianGanList = [ec.year.gan, ec.month.gan, ec.hour.gan];
  // 所有地支
  const allZhi = [ec.year.zhi, ec.month.zhi, ec.day.zhi, ec.hour.zhi];

  // 1. 月令得分（仅当藏干为印比时计分，取最高分）
  const monthZhi = ec.month.zhi;
  const monthCang = diZhiCangGan[monthZhi];
  let maxYue = 0;
  for (const cg of monthCang) {
    const w = tianGanWuXing[cg.gan];
    const rel = getRelation(riWuXing, w);
    if (rel === 'bi' || rel === 'yin') {
      let score = 0;
      if (cg.pos === '本') score = 50;
      else if (cg.pos === '中') score = 30;
      else if (cg.pos === '余') score = 20;
      if (score > maxYue) maxYue = score;
    }
  }
  yueLingScore = maxYue;

  // 2. 其他地支（年、日、时）的比劫与印星加分
  const otherZhi = [ec.year.zhi, ec.day.zhi, ec.hour.zhi];
  for (const zhi of otherZhi) {
    const cang = diZhiCangGan[zhi];
    for (const cg of cang) {
      const w = tianGanWuXing[cg.gan];
      const rel = getRelation(riWuXing, w);
      if (rel === 'bi') {
        // 比劫根：本气40，中气30，余气20
        const score = cg.pos === '本' ? 40 : cg.pos === '中' ? 30 : 20;
        diZhiBiJieScore += score;
      } else if (rel === 'yin') {
        // 印星根：本气30，中气20，余气10
        const score = cg.pos === '本' ? 30 : cg.pos === '中' ? 20 : 10;
        diZhiYinScore += score;
      }
    }
  }

  // 3. 所有地支的克泄耗减分（官杀、财星、食伤）
  for (const zhi of allZhi) {
    const cang = diZhiCangGan[zhi];
    for (const cg of cang) {
      const w = tianGanWuXing[cg.gan];
      const rel = getRelation(riWuXing, w);
      if (rel === 'guan' || rel === 'cai' || rel === 'shi') {
        const score = cg.pos === '本' ? 10 : cg.pos === '中' ? 6 : 3;
        diZhiKeXieScore += score;
      }
    }
  }

  // 4. 天干生助与克泄耗
  for (const gan of tianGanList) {
    const w = tianGanWuXing[gan];
    const rel = getRelation(riWuXing, w);
    if (rel === 'bi') {
      tianGanShengZhuScore += 10;      // 比劫
    } else if (rel === 'yin') {
      tianGanShengZhuScore += 8;       // 印星
    } else {
      tianGanKeXieScore += 10;         // 克泄耗
    }
  }

  // 5. 总分计算
  const totalScore = yueLingScore + diZhiBiJieScore + diZhiYinScore + tianGanShengZhuScore
                     - tianGanKeXieScore - diZhiKeXieScore;

  // 6. 初步强弱判断（阈值可根据经验微调）
  let strength: '身强' | '身弱' | '中和';
  if (totalScore > 100) strength = '身强';
  else if (totalScore >= 80) strength = '中和';
  else strength = '身弱';

  // 7. 检测特殊格局：从强（专旺）与从弱
  const hasRoot = allZhi.some(zhi =>
    diZhiCangGan[zhi].some(cg => {
      const w = tianGanWuXing[cg.gan];
      return getRelation(riWuXing, w) === 'bi';
    })
  );
  const hasHelp = tianGanList.some(gan => {
    const w = tianGanWuXing[gan];
    const rel = getRelation(riWuXing, w);
    return rel === 'bi' || rel === 'yin';
  });
  const keXieTotal = tianGanKeXieScore + diZhiKeXieScore; // 克泄耗总分

  // 从弱：日主极弱无根无助，月令失势，总分很低
  const possibleCongRuo = !hasRoot && !hasHelp && yueLingScore === 0 && totalScore < 30;

  // 从强：日主极强，满盘印比，克泄耗极少（总分>150，月令得印比50分以上，克泄耗<30）
  const possibleCongQiang = totalScore > 150 && yueLingScore >= 50 && keXieTotal < 30;

  // 8. 根据格局确定喜忌
  const allWuXing: WuXing[] = ['木', '火', '土', '金', '水'];
  let xiYong: WuXing[] = [];
  let jiShen: WuXing[] = [];
  let special = '';

  if (possibleCongQiang) {
    // 从强格（专旺）：顺其旺势，喜印比，忌克泄耗
    xiYong = allWuXing.filter(w => {
      const rel = getRelation(riWuXing, w);
      return rel === 'bi' || rel === 'yin';
    });
    jiShen = allWuXing.filter(w => {
      const rel = getRelation(riWuXing, w);
      return rel === 'guan' || rel === 'cai' || rel === 'shi';
    });
    special = '疑似从强格（专旺），日主过旺，顺其旺势，喜用印比，忌克泄耗。';
  } else if (possibleCongRuo) {
    // 从弱格：情况复杂，只提示，不自动生成喜忌
    special = '疑似从弱格，日主极弱无根，需从旺神。喜忌请结合全局中力量最强的五行详细判断。';
    xiYong = [];
    jiShen = [];
  } else {
    // 正常扶抑
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
    } else {
      // 中和：无需特定喜忌
      xiYong = [];
      jiShen = [];
    }
  }

  // 9. 调候用神提示（季节调候优先，不影响喜忌数组，仅作提示）
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
    totalScore: Math.round(totalScore * 10) / 10, // 保留一位小数
    strength,
    xiYong,
    jiShen,
    tiaoHou: tiaoHou || undefined,
    special: special || undefined
  };
}

// ---------- 测试用例（可选） ----------
/*
const testCases: EightCharacters[] = [
  { // 案例1：甲子 丙寅 甲午 戊辰
    year: { gan: '甲', zhi: '子' },
    month: { gan: '丙', zhi: '寅' },
    day: { gan: '甲', zhi: '午' },
    hour: { gan: '戊', zhi: '辰' }
  },
  { // 案例7：癸亥 癸亥 癸亥 癸亥（从强格）
    year: { gan: '癸', zhi: '亥' },
    month: { gan: '癸', zhi: '亥' },
    day: { gan: '癸', zhi: '亥' },
    hour: { gan: '癸', zhi: '亥' }
  }
];

testCases.forEach((bazi, index) => {
  const result = analyzeBazi(bazi);
  console.log(`案例 ${index + 1}:`, result);
});
*/