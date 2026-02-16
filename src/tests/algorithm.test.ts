/**
 * 天目应用 - 算法单元测试
 * 测试八字计算、身强身弱分析、物品五行判断的正确性
 */

import { BaziCalculator, StrengthAnalyzer, ItemAnalyzer, TianmuService } from '../services/TianmuCore';
import { WuXing, TianGan, DiZhi, ItemFeatures, UserProfile } from '../types';

// ==================== 测试工具函数 ====================

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: 期望 ${expected}, 实际 ${actual}`);
  }
}

function assertContains<T>(array: T[], item: T, message: string): void {
  if (!array.includes(item)) {
    throw new Error(`${message}: 数组中未找到 ${item}`);
  }
}

function logTest(name: string, passed: boolean): void {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
}

// ==================== 八字计算测试 ====================

function testBaziCalculation() {
  console.log('\n📊 八字计算测试');
  console.log('='.repeat(40));

  // 测试1：已知日期的八字计算
  try {
    const result = BaziCalculator.calculate('1990-01-01', '08:00');
    assertEqual(result.siZhu.day.gan.length, 1, '日干长度');
    assertEqual(result.siZhu.day.zhi.length, 1, '日支长度');
    assertEqual(['木', '火', '土', '金', '水'].includes(result.riWuXing), true, '日主五行有效性');
    logTest('八字基本结构测试', true);
  } catch (error: any) {
    logTest('八字基本结构测试', false);
    console.error(error.message);
  }

  // 测试2：五行统计
  try {
    const result = BaziCalculator.calculate('1985-06-15', '12:00');
    const totalWuXing = Object.values(result.wuXingCount).reduce((a, b) => a + b, 0);
    assertEqual(totalWuXing, 8, '五行总数应为8（四柱8字）');
    logTest('五行统计测试', true);
  } catch (error: any) {
    logTest('五行统计测试', false);
    console.error(error.message);
  }

  // 测试3：十神计算
  try {
    const result = BaziCalculator.calculate('2000-01-01', '00:00');
    const shiShenValues = Object.values(result.shiShen);
    const validShiShen = ['比肩', '劫财', '食神', '伤官', '正财', '偏财', '正官', '七杀', '正印', '偏印'];
    shiShenValues.forEach(ss => {
      assertEqual(validShiShen.includes(ss), true, `十神有效性: ${ss}`);
    });
    logTest('十神计算测试', true);
  } catch (error: any) {
    logTest('十神计算测试', false);
    console.error(error.message);
  }

  // 测试4：ISO 8601格式支持
  try {
    const result = BaziCalculator.calculate('2025-12-31T16:00:00.000Z', '08:30');
    assertEqual(result.riGan.length, 1, 'ISO格式日期解析');
    logTest('ISO 8601格式测试', true);
  } catch (error: any) {
    logTest('ISO 8601格式测试', false);
    console.error(error.message);
  }
}

// ==================== 身强身弱分析测试 ====================

function testStrengthAnalysis() {
  console.log('\n⚖️ 身强身弱分析测试');
  console.log('='.repeat(40));

  // 测试1：基本分析
  try {
    const bazi = BaziCalculator.calculate('1990-05-15', '10:00');
    const result = StrengthAnalyzer.analyze(bazi);
    
    assertEqual(['身强', '身弱', '中和'].includes(result.strength), true, '强弱判断有效性');
    assertEqual(result.scores.totalScore !== undefined, true, '总分存在');
    logTest('基本分析测试', true);
  } catch (error: any) {
    logTest('基本分析测试', false);
    console.error(error.message);
  }

  // 测试2：喜忌五行数量
  try {
    const bazi = BaziCalculator.calculate('1988-08-08', '08:08');
    const result = StrengthAnalyzer.analyze(bazi);
    
    if (result.strength === '身强' || result.strength === '身弱') {
      assertEqual(result.xiYong.length > 0, true, '喜用五行存在');
      assertEqual(result.jiShen.length > 0, true, '忌神五行存在');
      assertEqual(result.xiYong.length + result.jiShen.length, 5, '喜忌五行总数为5');
    }
    logTest('喜忌五行测试', true);
  } catch (error: any) {
    logTest('喜忌五行测试', false);
    console.error(error.message);
  }

  // 测试3：调候提示
  try {
    // 夏季出生
    const summerBazi = BaziCalculator.calculate('1990-07-15', '12:00');
    const summerResult = StrengthAnalyzer.analyze(summerBazi);
    
    // 冬季出生
    const winterBazi = BaziCalculator.calculate('1990-12-15', '12:00');
    const winterResult = StrengthAnalyzer.analyze(winterBazi);
    
    logTest('调候提示测试', true);
  } catch (error: any) {
    logTest('调候提示测试', false);
    console.error(error.message);
  }

  // 测试4：特殊格局检测
  try {
    // 极端案例：满盘水
    const bazi = BaziCalculator.calculate('1983-12-01', '00:00');
    const result = StrengthAnalyzer.analyze(bazi);
    
    if (result.special) {
      console.log(`  特殊格局: ${result.special.substring(0, 30)}...`);
    }
    logTest('特殊格局检测测试', true);
  } catch (error: any) {
    logTest('特殊格局检测测试', false);
    console.error(error.message);
  }
}

// ==================== 物品五行分析测试 ====================

function testItemAnalysis() {
  console.log('\n🔮 物品五行分析测试');
  console.log('='.repeat(40));

  // 创建测试用户档案
  const testProfile: UserProfile = {
    id: 'test_user',
    birthDate: '1990-01-01',
    birthTime: '08:00',
    bazi: BaziCalculator.calculate('1990-01-01', '08:00'),
    strengthAnalysis: {
      riGan: '甲',
      riWuXing: '木',
      scores: {
        yueLingScore: 50,
        diZhiBiJieScore: 40,
        diZhiYinScore: 30,
        tianGanShengZhuScore: 20,
        tianGanKeXieScore: 10,
        diZhiKeXieScore: 10,
        totalScore: 120,
      },
      strength: '身强',
      xiYong: ['火', '土', '金'],
      jiShen: ['木', '水'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 测试1：木属性物品
  try {
    const woodItem: ItemFeatures = {
      shape: 'long',
      color: 'green',
      material: 'wood',
      position: '东',
      timestamp: new Date('2025-03-15'),
    };
    
    const result = ItemAnalyzer.analyze(woodItem, testProfile);
    assertEqual(result.wuXing, '木', '木属性物品判断');
    assertEqual(result.isJiShen, true, '木为忌神');
    logTest('木属性物品测试', true);
  } catch (error: any) {
    logTest('木属性物品测试', false);
    console.error(error.message);
  }

  // 测试2：火属性物品
  try {
    const fireItem: ItemFeatures = {
      shape: 'sharp',
      color: 'red',
      material: 'plastic',
      position: '南',
      timestamp: new Date('2025-06-15'),
    };
    
    const result = ItemAnalyzer.analyze(fireItem, testProfile);
    assertEqual(result.wuXing, '火', '火属性物品判断');
    assertEqual(result.isXiYong, true, '火为喜用');
    logTest('火属性物品测试', true);
  } catch (error: any) {
    logTest('火属性物品测试', false);
    console.error(error.message);
  }

  // 测试3：金属性物品
  try {
    const metalItem: ItemFeatures = {
      shape: 'round',
      color: 'white',
      material: 'metal',
      position: '西',
      timestamp: new Date('2025-09-15'),
    };
    
    const result = ItemAnalyzer.analyze(metalItem, testProfile);
    assertEqual(result.wuXing, '金', '金属性物品判断');
    assertEqual(result.isXiYong, true, '金为喜用');
    logTest('金属性物品测试', true);
  } catch (error: any) {
    logTest('金属性物品测试', false);
    console.error(error.message);
  }

  // 测试4：气的强度计算
  try {
    const item: ItemFeatures = {
      shape: 'wave',
      color: 'black',
      material: 'water',
      position: '北',
      timestamp: new Date('2025-12-15'),
    };
    
    const result = ItemAnalyzer.analyze(item, testProfile);
    assertEqual(['气极强', '气强', '气平', '气弱', '气衰'].includes(result.qiLevel), true, '气强度有效性');
    assertEqual(typeof result.qiScore, 'number', '气分数为数字');
    logTest('气强度计算测试', true);
  } catch (error: any) {
    logTest('气强度计算测试', false);
    console.error(error.message);
  }

  // 测试5：建议文案生成
  try {
    const item: ItemFeatures = {
      shape: 'square',
      color: 'yellow',
      material: 'ceramic',
      position: '中',
      timestamp: new Date(),
    };
    
    const result = ItemAnalyzer.analyze(item, testProfile);
    assertEqual(result.advice.length > 0, true, '建议文案存在');
    console.log(`  建议: ${result.advice}`);
    logTest('建议文案测试', true);
  } catch (error: any) {
    logTest('建议文案测试', false);
    console.error(error.message);
  }
}

// ==================== 完整流程测试 ====================

function testFullWorkflow() {
  console.log('\n🔄 完整流程测试');
  console.log('='.repeat(40));

  try {
    // 创建用户档案
    const profile = TianmuService.createUserProfile(
      'test_user_001',
      '1995-03-15',
      '14:30',
      '测试用户'
    );
    
    assertEqual(profile.id, 'test_user_001', '用户ID');
    assertEqual(profile.name, '测试用户', '用户名');
    assertEqual(profile.bazi.riGan.length, 1, '日干');
    assertEqual(profile.strengthAnalysis.xiYong.length > 0 || profile.strengthAnalysis.strength === '中和', true, '喜用五行');
    
    // 分析物品
    const itemFeatures: ItemFeatures = {
      shape: 'long',
      color: 'green',
      material: 'wood',
      position: '东',
      timestamp: new Date(),
    };
    
    const itemResult = TianmuService.analyzeItem(itemFeatures, profile);
    assertEqual(itemResult.wuXing, '木', '物品五行');
    assertEqual(itemResult.advice.length > 0, true, '建议文案');
    
    logTest('完整流程测试', true);
    console.log('\n📋 测试用户档案:');
    console.log(`  日主: ${profile.bazi.riGan} (${profile.bazi.riWuXing})`);
    console.log(`  强弱: ${profile.strengthAnalysis.strength}`);
    console.log(`  喜用: ${profile.strengthAnalysis.xiYong.join('、')}`);
    console.log(`  忌神: ${profile.strengthAnalysis.jiShen.join('、')}`);
  } catch (error: any) {
    logTest('完整流程测试', false);
    console.error(error.message);
  }
}

// ==================== 运行所有测试 ====================

export function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║       天目应用 - 算法单元测试              ║');
  console.log('╚════════════════════════════════════════════╝');
  
  testBaziCalculation();
  testStrengthAnalysis();
  testItemAnalysis();
  testFullWorkflow();
  
  console.log('\n✨ 测试完成\n');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests();
}
