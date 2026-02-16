// 测试算法对比

// 原始算法导入
const { calculateBazi: originalCalculateBazi } = require('./根据出生日期和性别判断八字');
const { analyzeBazi: originalAnalyzeBazi } = require('./根据八字判断身强身弱喜用');

// 我的实现
import { calculateBazi, analyzeStrength, BaziResult } from './src/services/TianmuCore';

// 测试数据
const testCases = [
  { birthDate: '1990-05-15', birthTime: '12:00', gender: '男' as const },
  { birthDate: '1985-03-20', birthTime: '06:30', gender: '女' as const },
  { birthDate: '2000-01-01', birthTime: '00:00', gender: '男' as const },
];

console.log('=== 算法对比测试 ===\n');

testCases.forEach((tc, index) => {
  console.log(`\n--- 测试案例 ${index + 1}: ${tc.birthDate} ${tc.birthTime} ---`);
  
  // 原始算法
  console.log('\n【原始算法结果】');
  try {
    const originalBazi = originalCalculateBazi(tc.birthDate, tc.birthTime);
    console.log('八字:', JSON.stringify(originalBazi, null, 2));
    
    const originalStrength = originalAnalyzeBazi({
      year: { gan: originalBazi.yearGan, zhi: originalBazi.yearZhi },
      month: { gan: originalBazi.monthGan, zhi: originalBazi.monthZhi },
      day: { gan: originalBazi.dayGan, zhi: originalBazi.dayZhi },
      hour: { gan: originalBazi.hourGan, zhi: originalBazi.hourZhi },
    });
    console.log('身强身弱:', JSON.stringify(originalStrength, null, 2));
  } catch (e) {
    console.error('原始算法错误:', e);
  }
  
  // 我的实现
  console.log('\n【我的实现结果】');
  try {
    const myBazi = calculateBazi(tc.birthDate, tc.birthTime);
    console.log('八字:', JSON.stringify({
      yearPillar: myBazi.yearPillar,
      monthPillar: myBazi.monthPillar,
      dayPillar: myBazi.dayPillar,
      hourPillar: myBazi.hourPillar,
    }, null, 2));
    
    const myStrength = analyzeStrength(myBazi);
    console.log('身强身弱:', JSON.stringify(myStrength, null, 2));
  } catch (e) {
    console.error('我的实现错误:', e);
  }
});
