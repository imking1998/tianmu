/**
 * 天目应用 - 高级极简设计 + 真实算法集成
 * 设计理念：奢华极简 + 东方美学 + 精致细节
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Animated,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserDestiny,
  analyzeItem,
  wuxingToEn,
  debugStrengthAnalysis,
  UserProfile,
  UserDestiny,
  ItemFeatures,
  WuXing,
} from './src/services/TianmuCore';
import ImmersiveARScreen from './src/screens/ImmersiveARScreen';
import WebTestScreen from './src/screens/WebTestScreen';

const { width, height } = Dimensions.get('window');

// ==================== 设计系统 ====================

const COLORS = {
  background: '#000000',
  surface: '#0A0A0A',
  surfaceLight: '#141414',
  surfaceMedium: '#1A1A1A',
  gold: '#C9A962',
  goldLight: '#E8D5A3',
  goldDark: '#8B7355',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',
  textMuted: 'rgba(255, 255, 255, 0.25)',
  wuxing: {
    wood: '#5B8C5A',
    fire: '#C75B5B',
    earth: '#8B8B8B',
    metal: '#C9A962',
    water: '#5B7C9A',
  },
  beneficial: '#5B8C5A',
  harmful: '#C75B5B',
};

const FONTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ==================== 五行数据 ====================

const WU_XING_DATA: Record<string, { name: string; color: string }> = {
  wood: { name: '木', color: COLORS.wuxing.wood },
  fire: { name: '火', color: COLORS.wuxing.fire },
  earth: { name: '土', color: COLORS.wuxing.earth },
  metal: { name: '金', color: COLORS.wuxing.metal },
  water: { name: '水', color: COLORS.wuxing.water },
};

// 模拟物品数据库（实际应用中会从AR识别获取特征）
const ITEM_DATABASE = [
  { 
    id: '1', 
    name: '绿植', 
    features: { shape: 'long' as const, color: 'green' as const, material: 'wood' as const, position: '东' as const }
  },
  { 
    id: '2', 
    name: '蜡烛', 
    features: { shape: 'sharp' as const, color: 'red' as const, material: 'plastic' as const, position: '南' as const }
  },
  { 
    id: '3', 
    name: '陶瓷花瓶', 
    features: { shape: 'round' as const, color: 'yellow' as const, material: 'ceramic' as const, position: '中' as const }
  },
  { 
    id: '4', 
    name: '金属摆件', 
    features: { shape: 'round' as const, color: 'white' as const, material: 'metal' as const, position: '西' as const }
  },
  { 
    id: '5', 
    name: '鱼缸', 
    features: { shape: 'wave' as const, color: 'black' as const, material: 'water' as const, position: '北' as const }
  },
  { 
    id: '6', 
    name: '木质家具', 
    features: { shape: 'square' as const, color: 'yellow' as const, material: 'wood' as const, position: '东南' as const }
  },
  { 
    id: '7', 
    name: '红色抱枕', 
    features: { shape: 'square' as const, color: 'red' as const, material: 'plastic' as const, position: '南' as const }
  },
  { 
    id: '8', 
    name: '水晶吊灯', 
    features: { shape: 'sharp' as const, color: 'white' as const, material: 'metal' as const, position: '中' as const }
  },
];

// ==================== 组件 ====================

function WuXingBadge({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' | 'lg' }) {
  const wx = WU_XING_DATA[type] || WU_XING_DATA.earth;
  const sizes = { sm: 24, md: 32, lg: 40 };
  const sizeValue = sizes[size];
  
  return (
    <View style={[
      styles.wuxingBadge, 
      { 
        width: sizeValue, 
        height: sizeValue, 
        borderRadius: sizeValue / 2,
        backgroundColor: wx.color + '20',
        borderColor: wx.color + '40',
      }
    ]}>
      <Text style={[styles.wuxingText, { color: wx.color, fontSize: sizeValue * 0.45 }]}>
        {wx.name}
      </Text>
    </View>
  );
}

function QiIndicator({ value, beneficial }: { value: number; beneficial: boolean }) {
  const color = beneficial ? COLORS.beneficial : COLORS.harmful;
  const normalizedValue = Math.max(0, Math.min(100, (value + 50) * 1.2));
  
  return (
    <View style={styles.qiContainer}>
      <View style={styles.qiTrack}>
        <View 
          style={[
            styles.qiFill, 
            { 
              width: `${normalizedValue}%`, 
              backgroundColor: color,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }
          ]} 
        />
      </View>
      <Text style={[styles.qiValue, { color }]}>{value > 0 ? '+' : ''}{value}</Text>
    </View>
  );
}

function ItemCard({ item, analysis }: { item: typeof ITEM_DATABASE[0]; analysis: ReturnType<typeof analyzeItem> }) {
  const wx = WU_XING_DATA[wuxingToEn(analysis.wuxing)] || WU_XING_DATA.earth;
  const scaleAnim = new Animated.Value(1);
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <View style={[
          styles.cardStatusLine, 
          { backgroundColor: analysis.isBeneficial ? COLORS.beneficial : COLORS.harmful }
        ]} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <WuXingBadge type={wuxingToEn(analysis.wuxing)} size="sm" />
            </View>
            <View style={[
              styles.statusTag,
              { backgroundColor: analysis.isBeneficial ? COLORS.beneficial + '20' : COLORS.harmful + '20' }
            ]}>
              <Text style={[
                styles.statusTagText,
                { color: analysis.isBeneficial ? COLORS.beneficial : COLORS.harmful }
              ]}>
                {analysis.isBeneficial ? '喜' : '忌'}
              </Text>
            </View>
          </View>
          
          <QiIndicator value={analysis.qiScore} beneficial={analysis.isBeneficial} />
          
          <Text style={styles.cardDesc}>{analysis.advice}</Text>
          <Text style={styles.cardQiLevel}>气强弱：{analysis.qiLevel}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.primaryButton}>
      <LinearGradient
        colors={[COLORS.goldDark, COLORS.gold, COLORS.goldLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.primaryButtonGradient}
      >
        <Text style={styles.primaryButtonText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function NavItem({ 
  icon, 
  label, 
  active, 
  onPress 
}: { 
  icon: string; 
  label: string; 
  active: boolean; 
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
      {active && <View style={styles.navIndicator} />}
    </TouchableOpacity>
  );
}

// ==================== 用户档案输入模态框 ====================

function ProfileInputModal({ 
  visible, 
  onClose, 
  onSave 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSave: (profile: UserProfile) => void;
}) {
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [birthTime, setBirthTime] = useState('12:00');
  const [gender, setGender] = useState<'男' | '女'>('男');
  
  const handleSave = () => {
    onSave({ birthDate, birthTime, gender });
    onClose();
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>输入出生信息</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>出生日期</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>出生时间</Text>
            <TextInput
              style={styles.input}
              value={birthTime}
              onChangeText={setBirthTime}
              placeholder="HH:mm"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>性别</Text>
            <View style={styles.genderSelector}>
              <TouchableOpacity 
                style={[styles.genderButton, gender === '男' && styles.genderButtonActive]}
                onPress={() => setGender('男')}
              >
                <Text style={[styles.genderText, gender === '男' && styles.genderTextActive]}>男</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.genderButton, gender === '女' && styles.genderButtonActive]}
                onPress={() => setGender('女')}
              >
                <Text style={[styles.genderText, gender === '女' && styles.genderTextActive]}>女</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveButton} onPress={handleSave}>
              <Text style={styles.modalSaveText}>确认</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ==================== 主应用 ====================

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'scan' | 'profile'>('home');
  const [showProfileInput, setShowProfileInput] = useState(false);
  const [userDestiny, setUserDestiny] = useState<UserDestiny | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 加载用户档案
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profile: UserProfile = JSON.parse(savedProfile);
        const destiny = createUserDestiny(profile);
        setUserDestiny(destiny);
      }
    } catch (error) {
      console.error('加载用户档案失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveProfile = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      const destiny = createUserDestiny(profile);
      setUserDestiny(destiny);
    } catch (error) {
      console.error('保存用户档案失败:', error);
    }
  };
  
  // 分析物品列表
  const analyzedItems = useMemo(() => {
    if (!userDestiny) return [];
    
    return ITEM_DATABASE.map(item => {
      const features: ItemFeatures = {
        ...item.features,
        timestamp: new Date(),
      };
      const analysis = analyzeItem(
        item.name,
        features,
        userDestiny.strength.xiYong,
        userDestiny.strength.jiShen
      );
      return { item, analysis };
    });
  }, [userDestiny]);
  
  // 首页
  const renderHome = () => (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.background}>
        <View style={styles.backgroundGradient} />
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>天目</Text>
          <Text style={styles.tagline}>五行能量识别系统</Text>
        </View>
        
        {userDestiny ? (
          <>
            <View style={styles.baziCard}>
              <View style={styles.baziHeader}>
                <Text style={styles.baziTitle}>命盘信息</Text>
                <TouchableOpacity onPress={() => setShowProfileInput(true)}>
                  <Text style={styles.editButton}>编辑</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.baziGrid}>
                {[
                  { label: '年柱', value: userDestiny.bazi.yearPillar },
                  { label: '月柱', value: userDestiny.bazi.monthPillar },
                  { label: '日柱', value: userDestiny.bazi.dayPillar },
                  { label: '时柱', value: userDestiny.bazi.hourPillar },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.baziItem}>
                    <Text style={styles.baziLabel}>{label}</Text>
                    <Text style={styles.baziValue}>{value}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.strengthSection}>
                <Text style={styles.strengthLabel}>身强身弱</Text>
                <Text style={[
                  styles.strengthValue,
                  { color: userDestiny.strength.strength === '身强' ? COLORS.beneficial : 
                          userDestiny.strength.strength === '身弱' ? COLORS.harmful : COLORS.gold }
                ]}>
                  {userDestiny.strength.strength}
                </Text>
                <Text style={styles.scoreLabel}>得分: {userDestiny.strength.totalScore}</Text>
                
                {/* 调试信息 */}
                {(() => {
                  const debug = debugStrengthAnalysis(userDestiny.bazi);
                  return (
                    <View style={{ marginTop: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                      <Text style={{ color: COLORS.textTertiary, fontSize: 10 }}>【调试信息】</Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                        月令: {debug.details.yueLingScore}分 ({debug.details.yueLingStatus})
                      </Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 10 }}>
                        根气: {debug.details.genQiScore}分 | 帮手: {debug.details.bangShouScore}分 | 克泄: {debug.details.keXieScore}分
                      </Text>
                      <Text style={{ color: COLORS.gold, fontSize: 10 }}>
                        总分: {debug.result.totalScore} → {debug.result.strength}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.xiyongSection}>
                <Text style={styles.xiyongLabel}>喜用五行</Text>
                <View style={styles.xiyongBadges}>
                  {userDestiny.strength.xiYong.map(wx => (
                    <WuXingBadge key={wx} type={wuxingToEn(wx)} />
                  ))}
                </View>
              </View>
              
              {userDestiny.strength.tiaoHou && (
                <Text style={styles.tiaoHouText}>{userDestiny.strength.tiaoHou}</Text>
              )}
            </View>
            
            <PrimaryButton title="开启天目" onPress={() => setCurrentScreen('scan')} />
            
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>物品分析</Text>
                <Text style={styles.sectionCount}>{analyzedItems.length} 项</Text>
              </View>
              
              {analyzedItems.map(({ item, analysis }) => (
                <ItemCard key={item.id} item={item} analysis={analysis} />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>请先输入您的出生信息</Text>
            <Text style={styles.emptyStateSubtext}>系统将根据您的八字计算喜用五行</Text>
            <PrimaryButton title="输入出生信息" onPress={() => setShowProfileInput(true)} />
          </View>
        )}
      </ScrollView>
      
      <View style={styles.bottomNav}>
        <NavItem 
          icon="◎" 
          label="首页" 
          active={currentScreen === 'home'} 
          onPress={() => setCurrentScreen('home')} 
        />
        <NavItem 
          icon="◇" 
          label="扫描" 
          active={currentScreen === 'scan'} 
          onPress={() => setCurrentScreen('scan')} 
        />
        <NavItem 
          icon="○" 
          label="我的" 
          active={currentScreen === 'profile'} 
          onPress={() => setCurrentScreen('profile')} 
        />
      </View>
      
      <ProfileInputModal
        visible={showProfileInput}
        onClose={() => setShowProfileInput(false)}
        onSave={handleSaveProfile}
      />
    </View>
  );

  // 扫描页 - 根据平台选择不同界面
  const renderScan = () => {
    // Web平台使用测试界面（支持图片上传识别）
    if (Platform.OS === 'web') {
      return (
        <WebTestScreen 
          userDestiny={userDestiny} 
          onBack={() => setCurrentScreen('home')} 
        />
      );
    }
    
    // 原生平台使用AR扫描界面
    return (
      <ImmersiveARScreen 
        userDestiny={userDestiny} 
        onBack={() => setCurrentScreen('home')} 
      />
    );
  };

  // 个人页
  const renderProfile = () => (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.background}>
        <View style={styles.backgroundGradient} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.profileContent}>
        <Text style={styles.profileTitle}>个人档案</Text>
        
        {userDestiny ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>出生日期</Text>
                <Text style={styles.profileValue}>{userDestiny.profile.birthDate}</Text>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>出生时辰</Text>
                <Text style={styles.profileValue}>{userDestiny.profile.birthTime}</Text>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>性别</Text>
                <Text style={styles.profileValue}>{userDestiny.profile.gender}</Text>
              </View>
            </View>
            
            <View style={styles.profileCard}>
              <Text style={styles.profileCardTitle}>八字详情</Text>
              <View style={styles.profileDivider} />
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>日主</Text>
                <Text style={styles.profileValue}>{userDestiny.bazi.dayMaster} ({userDestiny.bazi.dayMasterWuXing})</Text>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>年柱纳音</Text>
                <Text style={styles.profileValue}>{userDestiny.bazi.nayin.year}</Text>
              </View>
              <View style={styles.profileDivider} />
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>日柱纳音</Text>
                <Text style={styles.profileValue}>{userDestiny.bazi.nayin.day}</Text>
              </View>
            </View>
            
            {userDestiny.strength.special && (
              <View style={styles.specialCard}>
                <Text style={styles.specialText}>{userDestiny.strength.special}</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => setShowProfileInput(true)}
            >
              <Text style={styles.editProfileText}>修改出生信息</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>尚未设置出生信息</Text>
            <PrimaryButton title="设置出生信息" onPress={() => setShowProfileInput(true)} />
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.backToListButton}
          onPress={() => setCurrentScreen('home')}
        >
          <Text style={styles.backToListText}>返回首页</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <ProfileInputModal
        visible={showProfileInput}
        onClose={() => setShowProfileInput(false)}
        onSave={handleSaveProfile}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <>
      {currentScreen === 'home' && renderHome()}
      {currentScreen === 'scan' && renderScan()}
      {currentScreen === 'profile' && renderProfile()}
    </>
  );
}

// ==================== 样式 ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl * 1.5,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  brand: {
    fontSize: 36,
    fontWeight: FONTS.light,
    color: COLORS.textPrimary,
    letterSpacing: 12,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    fontWeight: FONTS.regular,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    letterSpacing: 2,
  },
  baziCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  baziHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  baziTitle: {
    fontSize: 14,
    fontWeight: FONTS.medium,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  editButton: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: FONTS.medium,
  },
  baziGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  baziItem: {
    alignItems: 'center',
    flex: 1,
  },
  baziLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  baziValue: {
    fontSize: 18,
    fontWeight: FONTS.semibold,
    color: COLORS.gold,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: SPACING.md,
  },
  strengthSection: {
    alignItems: 'center',
  },
  strengthLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
  },
  strengthValue: {
    fontSize: 20,
    fontWeight: FONTS.semibold,
    letterSpacing: 2,
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  xiyongSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  xiyongLabel: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginRight: SPACING.sm,
  },
  xiyongBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tiaoHouText: {
    fontSize: 12,
    color: COLORS.gold,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  primaryButton: {
    marginBottom: SPACING.xl,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: FONTS.semibold,
    color: COLORS.background,
    letterSpacing: 2,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: FONTS.medium,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  cardContainer: {
    marginBottom: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardStatusLine: {
    width: 2,
  },
  cardContent: {
    flex: 1,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: FONTS.medium,
    color: COLORS.textPrimary,
  },
  statusTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: FONTS.medium,
    letterSpacing: 1,
  },
  qiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  qiTrack: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  qiFill: {
    height: '100%',
    borderRadius: 1,
  },
  qiValue: {
    fontSize: 12,
    fontWeight: FONTS.medium,
    marginLeft: SPACING.sm,
    width: 30,
    textAlign: 'right',
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textTertiary,
    lineHeight: 18,
  },
  cardQiLevel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  wuxingBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  wuxingText: {
    fontWeight: FONTS.medium,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  navIcon: {
    fontSize: 20,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
  },
  navIconActive: {
    color: COLORS.gold,
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  navLabelActive: {
    color: COLORS.gold,
  },
  navIndicator: {
    position: 'absolute',
    top: -SPACING.md,
    width: 20,
    height: 2,
    backgroundColor: COLORS.gold,
    borderRadius: 1,
  },
  scanScreen: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  backButton: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: FONTS.medium,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  scanFrame: {
    width: width - SPACING.lg * 2,
    height: width - SPACING.lg * 2,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  },
  scanCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: COLORS.gold + '60',
  },
  scanCornerTopRight: {
    left: 'auto',
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 2,
  },
  scanCornerBottomLeft: {
    top: 'auto',
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 2,
  },
  scanCornerBottomRight: {
    top: 'auto',
    left: 'auto',
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  scanHint: {
    fontSize: 14,
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  scanInfo: {
    alignItems: 'center',
  },
  scanInfoText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
  },
  scanWarning: {
    fontSize: 13,
    color: COLORS.harmful,
    marginTop: SPACING.md,
  },
  profileContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl * 1.5,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: FONTS.light,
    color: COLORS.textPrimary,
    letterSpacing: 4,
    marginBottom: SPACING.xl,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  profileCardTitle: {
    fontSize: 14,
    fontWeight: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  profileLabel: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  profileValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: FONTS.medium,
  },
  profileDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  specialCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  specialText: {
    fontSize: 13,
    color: COLORS.gold,
    lineHeight: 20,
  },
  editProfileButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  editProfileText: {
    fontSize: 14,
    color: COLORS.gold,
    letterSpacing: 1,
  },
  backToListButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  backToListText: {
    fontSize: 14,
    color: COLORS.gold,
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: SPACING.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    width: width - SPACING.lg * 2,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: FONTS.medium,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    letterSpacing: 2,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  genderSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  genderButtonActive: {
    backgroundColor: COLORS.gold + '20',
    borderColor: COLORS.gold,
  },
  genderText: {
    fontSize: 15,
    color: COLORS.textTertiary,
  },
  genderTextActive: {
    color: COLORS.gold,
    fontWeight: FONTS.medium,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: COLORS.textTertiary,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    color: COLORS.background,
    fontWeight: FONTS.medium,
  },
});
