// 算法对比测试

// 原始算法
const { calculateBazi: originalCalculateBazi } = require('./根据出生日期和性别判断八字');
const { analyzeBazi: originalAnalyzeBazi } = require('./根据八字判断身强身弱喜用');

// 我的实现
const { calculateBazi, analyzeStrength } = require('./src/services/TianmuCore');

// 测试数据
const testCases = [
  { birthDate: '1990-05-15', birthTime: '12:00' },
  { birthDate: '1985-03-20', birthTime: '06:30' },
];

console.log('=== 算法对比测试 ===\n');

testCases.forEach((tc, index) => {
  console.log(`\n--- 测试案例 ${index + 1}: ${tc.birthDate} ${tc.birthTime} ---`);
  
  // 原始算法
  console.log('\n【原始算法结果】');
  try {
    const originalBazi = originalCalculateBazi(tc.birthDate, tc.birthTime);
    console.log('八字:', {
      year: originalBazi.yearGan + originalBazi.yearZhi,
      month: originalBazi.monthGan + originalBazi.monthZhi,
      day: originalBazi.dayGan + originalBazi.dayZhi,
      hour: originalBazi.hourGan + originalBazi.hourZhi,
    });
    
    const originalStrength = originalAnalyzeBazi({
      year: { gan: originalBazi.yearGan, zhi: originalBazi.yearZhi },
      month: { gan: originalBazi.monthGan, zhi: originalBazi.monthZhi },
      day: { gan: originalBazi.dayGan, zhi: originalBazi.dayZhi },
      hour: { gan: originalBazi.hourGan, zhi: originalBazi.hourZhi },
    });
    console.log('身强身弱分析:', {
      riGan: originalStrength.riGan,
      riWuXing: originalStrength.riWuXing,
      totalScore: originalStrength.totalScore,
      strength: originalStrength.strength,
      xiYong: originalStrength.xiYong,
      jiShen: originalStrength.jiShen,
    });
  } catch (e) {
    console.error('原始算法错误:', e.message);
  }
  
  // 我的实现
  console.log('\n【我的实现结果】');
  try {
    const myBazi = calculateBazi(tc.birthDate, tc.birthTime);
    console.log('八字:', {
      year: myBazi.yearPillar,
      month: myBazi.monthPillar,
      day: myBazi.dayPillar,
      hour: myBazi.hourPillar,
    });
    
    const myStrength = analyzeStrength(myBazi);
    console.log('身强身弱分析:', {
      riGan: myStrength.riGan,
      riWuXing: myStrength.riWuXing,
      totalScore: myStrength.totalScore,
      strength: myStrength.strength,
      xiYong: myStrength.xiYong,
      jiShen: myStrength.jiShen,
    });
  } catch (e) {
    console.error('我的实现错误:', e.message);
  }
});
