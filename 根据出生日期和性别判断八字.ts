// 类型声明 - lunar-javascript库没有官方类型定义
declare const Lunar: any;
declare const Solar: any;

// 导入lunar-javascript库
const { Lunar: LunarClass, Solar: SolarClass } = require('lunar-javascript');

// 天干
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 五行
const FIVE_ELEMENTS: { [key: string]: string } = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 纳音表
const NAYIN_TABLE: { [key: string]: string } = {
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

// 地支藏干
const HIDDEN_STEMS: { [key: string]: string[] } = {
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

export interface BaziResult {
  yearGan: string;
  yearZhi: string;
  monthGan: string;
  monthZhi: string;
  dayGan: string;
  dayZhi: string;
  hourGan: string;
  hourZhi: string;
  tenGods: string;
  fiveElements: string;
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
  cangganShishen: {
    year: string[];
    month: string[];
    day: string[];
    hour: string[];
  };
}

/**
 * 计算八字 - 使用lunar-javascript库
 * @param birthDate 出生日期，格式：YYYY-MM-DD
 * @param birthTime 出生时间，格式：HH:mm
 * @returns 八字结果
 */
export function calculateBazi(birthDate: string, birthTime: string): BaziResult {
  // 解析日期时间 - 支持ISO 8601格式和YYYY-MM-DD格式
  let year: number, month: number, day: number;
  
  if (birthDate.includes('T') || birthDate.includes('Z')) {
    // ISO 8601格式: "2025-12-31T16:00:00.000Z"
    const dateObj = new Date(birthDate);
    year = dateObj.getFullYear();
    month = dateObj.getMonth() + 1; // 月份从0开始，需要+1
    day = dateObj.getDate();
  } else {
    // YYYY-MM-DD格式
    const dateParts = birthDate.split('-').map(Number);
    year = dateParts[0];
    month = dateParts[1];
    day = dateParts[2];
  }
  
  const timeParts = birthTime.split(':');
  
  // 检查时间格式（支持 HH:mm 或 HH:mm:ss）
  if (timeParts.length < 2) {
    throw new Error('时间格式不正确，应为HH:mm或HH:mm:ss');
  }
  
  // 只使用小时和分钟，忽略秒
  const [hour, minute] = timeParts.slice(0, 2).map(Number);
  
  // 验证时间数据
  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
    throw new Error('无效的日期或时间数据');
  }
  
  // 创建Solar对象
  const solar = SolarClass.fromYmdHms(year, month, day, hour, minute, 0);
  
  // 转换为Lunar对象
  const lunar = solar.getLunar();
  
  // 使用EightChar类获取四柱 - 这个方法正确处理了节气分界
  const eightChar = lunar.getEightChar();
  
  // 获取四柱干支
  const yearGanZhi = eightChar.getYear();
  const monthGanZhi = eightChar.getMonth();
  const dayGanZhi = eightChar.getDay();
  const hourGanZhi = eightChar.getTime();
  
  const yearGan = yearGanZhi.substring(0, 1);
  const yearZhi = yearGanZhi.substring(1, 2);
  const monthGan = monthGanZhi.substring(0, 1);
  const monthZhi = monthGanZhi.substring(1, 2);
  const dayGan = dayGanZhi.substring(0, 1);
  const dayZhi = dayGanZhi.substring(1, 2);
  const hourGan = hourGanZhi.substring(0, 1);
  const hourZhi = hourGanZhi.substring(1, 2);
  
  // 日主（日干）
  const dayMaster = dayGan;
  
  // 计算纳音
  const nayin = {
    year: NAYIN_TABLE[yearGan + yearZhi] || '',
    month: NAYIN_TABLE[monthGan + monthZhi] || '',
    day: NAYIN_TABLE[dayGan + dayZhi] || '',
    hour: NAYIN_TABLE[hourGan + hourZhi] || ''
  };
  
  // 计算十神
  const shishen = {
    year: calculateShiShen(yearGan, dayMaster),
    month: calculateShiShen(monthGan, dayMaster),
    day: calculateShiShen(dayGan, dayMaster),
    hour: calculateShiShen(hourGan, dayMaster)
  };
  
  // 计算藏干
  const canggan = {
    year: HIDDEN_STEMS[yearZhi] || [],
    month: HIDDEN_STEMS[monthZhi] || [],
    day: HIDDEN_STEMS[dayZhi] || [],
    hour: HIDDEN_STEMS[hourZhi] || []
  };
  
  // 计算藏干十神
  const cangganShishen = {
    year: calculateHiddenStemShiShen(yearZhi, dayMaster),
    month: calculateHiddenStemShiShen(monthZhi, dayMaster),
    day: calculateHiddenStemShiShen(dayZhi, dayMaster),
    hour: calculateHiddenStemShiShen(hourZhi, dayMaster)
  };
  
  // 计算十神
  const tenGods = calculateTenGods(dayMaster, yearGan, monthGan, hourGan);
  
  // 计算五行
  const fiveElements = calculateFiveElements(yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi);
  
  return {
    yearGan,
    yearZhi,
    monthGan,
    monthZhi,
    dayGan,
    dayZhi,
    hourGan,
    hourZhi,
    tenGods,
    fiveElements,
    nayin,
    shishen,
    canggan,
    cangganShishen
  };
}

/**
 * 计算地支藏干的十神
 * @param earthly 地支
 * @param dayMaster 日主
 * @returns 地支藏干十神数组
 */
function calculateHiddenStemShiShen(earthly: string, dayMaster: string): string[] {
  const hiddenStems = HIDDEN_STEMS[earthly] || [];
  return hiddenStems.map(gan => calculateShiShen(gan, dayMaster));
}

/**
 * 计算十神
 * @param dayMaster 日主
 * @param yearGan 年干
 * @param monthGan 月干
 * @param hourGan 时干
 * @returns 十神字符串
 */
function calculateTenGods(dayMaster: string, yearGan: string, monthGan: string, hourGan: string): string {
  const yearTenGod = calculateShiShen(yearGan, dayMaster);
  const monthTenGod = calculateShiShen(monthGan, dayMaster);
  const hourTenGod = calculateShiShen(hourGan, dayMaster);
  
  return `年柱${yearTenGod}，月柱${monthTenGod}，时柱${hourTenGod}`;
}

/**
 * 计算十神
 * @param gan 天干
 * @param dayMaster 日主
 * @returns 十神名称
 */
function calculateShiShen(gan: string, dayMaster: string): string {
  const ganIndex = HEAVENLY_STEMS.indexOf(gan);
  const dayMasterIndex = HEAVENLY_STEMS.indexOf(dayMaster);
  
  // 获取天干和日主的五行属性
  const ganElement = FIVE_ELEMENTS[gan];
  const dayMasterElement = FIVE_ELEMENTS[dayMaster];
  
  // 判断阴阳属性
  const ganYinYang = ganIndex % 2 === 0 ? '阳' : '阴';
  const dayMasterYinYang = dayMasterIndex % 2 === 0 ? '阳' : '阴';
  
  // 相同五行（比和）
  if (ganElement === dayMasterElement) {
    if (ganYinYang === dayMasterYinYang) {
      return '比肩';
    } else {
      return '劫财';
    }
  }
  
  // 日主所生（我生者）
  if ((dayMasterElement === '木' && ganElement === '火') ||
      (dayMasterElement === '火' && ganElement === '土') ||
      (dayMasterElement === '土' && ganElement === '金') ||
      (dayMasterElement === '金' && ganElement === '水') ||
      (dayMasterElement === '水' && ganElement === '木')) {
    if (ganYinYang === dayMasterYinYang) {
      return '食神';
    } else {
      return '伤官';
    }
  }
  
  // 日主所克（我克者）
  if ((dayMasterElement === '木' && ganElement === '土') ||
      (dayMasterElement === '火' && ganElement === '金') ||
      (dayMasterElement === '土' && ganElement === '水') ||
      (dayMasterElement === '金' && ganElement === '木') ||
      (dayMasterElement === '水' && ganElement === '火')) {
    if (ganYinYang === dayMasterYinYang) {
      return '偏财';
    } else {
      return '正财';
    }
  }
  
  // 生日主（生我者）
  if ((dayMasterElement === '木' && ganElement === '水') ||
      (dayMasterElement === '火' && ganElement === '木') ||
      (dayMasterElement === '土' && ganElement === '火') ||
      (dayMasterElement === '金' && ganElement === '土') ||
      (dayMasterElement === '水' && ganElement === '金')) {
    if (ganYinYang === dayMasterYinYang) {
      return '偏印';
    } else {
      return '正印';
    }
  }
  
  // 克日主（克我者）
  if ((dayMasterElement === '木' && ganElement === '金') ||
      (dayMasterElement === '火' && ganElement === '水') ||
      (dayMasterElement === '土' && ganElement === '木') ||
      (dayMasterElement === '金' && ganElement === '火') ||
      (dayMasterElement === '水' && ganElement === '土')) {
    if (ganYinYang === dayMasterYinYang) {
      return '七杀';
    } else {
      return '正官';
    }
  }
  
  // 默认返回
  return '未知';
}

/**
 * 计算五行
 * @param yearGan 年干
 * @param yearZhi 年支
 * @param monthGan 月干
 * @param monthZhi 月支
 * @param dayGan 日干
 * @param dayZhi 日支
 * @param hourGan 时干
 * @param hourZhi 时支
 * @returns 五行统计字符串
 */
function calculateFiveElements(
  yearGan: string, yearZhi: string,
  monthGan: string, monthZhi: string,
  dayGan: string, dayZhi: string,
  hourGan: string, hourZhi: string
): string {
  const wuxingCount: { [key: string]: number } = {
    '木': 0,
    '火': 0,
    '土': 0,
    '金': 0,
    '水': 0
  };

  // 统计天干五行
  [yearGan, monthGan, dayGan, hourGan].forEach(gan => {
    const element = FIVE_ELEMENTS[gan];
    if (element) {
      wuxingCount[element]++;
    }
  });

  // 统计地支五行
  [yearZhi, monthZhi, dayZhi, hourZhi].forEach(zhi => {
    const element = FIVE_ELEMENTS[zhi];
    if (element) {
      wuxingCount[element]++;
    }
  });

  // 生成五行统计字符串
  const total = 8; // 四柱共8个字
  const woodPercent = Math.round((wuxingCount['木'] / total) * 100);
  const firePercent = Math.round((wuxingCount['火'] / total) * 100);
  const earthPercent = Math.round((wuxingCount['土'] / total) * 100);
  const metalPercent = Math.round((wuxingCount['金'] / total) * 100);
  const waterPercent = Math.round((wuxingCount['水'] / total) * 100);

  return `木${woodPercent}%，火${firePercent}%，土${earthPercent}%，金${metalPercent}%，水${waterPercent}%`;
}
