/**
 * 天目应用 - 用户档案屏幕
 * 功能：八字输入、喜忌展示、个人信息管理
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUserStore } from '../store';
import { TianmuService } from '../services/TianmuCore';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  GradientCard,
  WuXingBadge,
  BaziDisplay,
  XiJiTags,
  QiIndicator,
  GlowView,
} from '../components/UIComponents';
import { UserProfile } from '../types';

export const ProfileScreen: React.FC = () => {
  const { profile, setProfile, isOnboarded } = useUserStore();
  
  const [name, setName] = useState(profile?.name || '');
  const [birthDate, setBirthDate] = useState(profile?.birthDate || '');
  const [birthTime, setBirthTime] = useState(profile?.birthTime || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setBirthDate(`${year}-${month}-${day}`);
      setError('');
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      setBirthTime(`${hours}:${minutes}`);
      setError('');
    }
  };

  const handleSave = async () => {
    if (!birthDate || !birthTime) {
      setError('请填写完整的出生日期和时间');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newProfile = TianmuService.createUserProfile(
        profile?.id || `user_${Date.now()}`,
        birthDate,
        birthTime,
        name || undefined
      );
      setProfile(newProfile);
    } catch (err: any) {
      setError(err.message || '计算八字时出错，请检查输入信息');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* 标题 */}
          <View style={styles.header}>
            <Text style={styles.title}>个人档案</Text>
            <Text style={styles.subtitle}>设置您的八字信息</Text>
          </View>

          {/* 输入表单 */}
          <GradientCard style={styles.formCard}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>姓名（选填）</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="请输入姓名"
                placeholderTextColor={COLORS.text.muted}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>出生日期</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, !birthDate && styles.placeholder]}>
                  {birthDate || '选择日期'}
                </Text>
                <Text style={styles.dateButtonIcon}>📅</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>出生时间</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.dateButtonText, !birthTime && styles.placeholder]}>
                  {birthTime || '选择时间'}
                </Text>
                <Text style={styles.dateButtonIcon}>🕐</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
            >
              <GlowView color={COLORS.accent.gold} intensity={0.6}>
                <LinearGradient
                  colors={[COLORS.accent.gold, COLORS.accent.goldLight]}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? '计算中...' : '计算八字'}
                  </Text>
                </LinearGradient>
              </GlowView>
            </TouchableOpacity>
          </GradientCard>

          {/* 八字结果展示 */}
          {profile && (
            <Animated.View style={[styles.resultSection, { opacity: fadeAnim }]}>
              {/* 八字四柱 */}
              <GradientCard style={styles.resultCard}>
                <Text style={styles.resultTitle}>八字命盘</Text>
                <BaziDisplay
                  siZhu={profile.bazi.siZhu}
                  riGan={profile.bazi.riGan}
                />
              </GradientCard>

              {/* 身强身弱 */}
              <GradientCard
                style={styles.resultCard}
                wuXing={profile.bazi.riWuXing}
                isXiYong={profile.strengthAnalysis.strength === '身弱'}
              >
                <View style={styles.strengthHeader}>
                  <WuXingBadge wuXing={profile.bazi.riWuXing} size="md" />
                  <View style={styles.strengthInfo}>
                    <Text style={styles.strengthLabel}>日主</Text>
                    <Text style={styles.strengthValue}>
                      {profile.bazi.riGan} · {profile.bazi.riWuXing}
                    </Text>
                  </View>
                  <View style={styles.strengthBadge}>
                    <Text style={styles.strengthBadgeText}>
                      {profile.strengthAnalysis.strength}
                    </Text>
                  </View>
                </View>

                <View style={styles.scoreSection}>
                  <Text style={styles.scoreLabel}>综合评分</Text>
                  <Text style={styles.scoreValue}>
                    {profile.strengthAnalysis.scores.totalScore}
                  </Text>
                </View>

                {profile.strengthAnalysis.tiaoHou && (
                  <View style={styles.tiaoHouBox}>
                    <Text style={styles.tiaoHouText}>
                      {profile.strengthAnalysis.tiaoHou}
                    </Text>
                  </View>
                )}

                {profile.strengthAnalysis.special && (
                  <View style={styles.specialBox}>
                    <Text style={styles.specialText}>
                      {profile.strengthAnalysis.special}
                    </Text>
                  </View>
                )}
              </GradientCard>

              {/* 喜忌五行 */}
              <GradientCard style={styles.resultCard}>
                <Text style={styles.resultTitle}>喜忌五行</Text>
                <XiJiTags
                  xiYong={profile.strengthAnalysis.xiYong}
                  jiShen={profile.strengthAnalysis.jiShen}
                />
              </GradientCard>

              {/* 五行统计 */}
              <GradientCard style={styles.resultCard}>
                <Text style={styles.resultTitle}>五行分布</Text>
                <View style={styles.wuXingStats}>
                  {(['木', '火', '土', '金', '水'] as const).map((wx) => (
                    <View key={wx} style={styles.wuXingStatItem}>
                      <WuXingBadge wuXing={wx} size="sm" showLabel={false} />
                      <Text style={styles.wuXingStatCount}>
                        {profile.bazi.wuXingCount[wx]}
                      </Text>
                    </View>
                  ))}
                </View>
              </GradientCard>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      {/* 日期选择器 */}
      {showDatePicker && (
        <DateTimePicker
          value={birthDate ? new Date(birthDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}

      {/* 时间选择器 */}
      {showTimePicker && (
        <DateTimePicker
          value={birthTime ? new Date(`2000-01-01T${birthTime}`) : new Date()}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary.dark,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  
  content: {
    padding: SPACING.md,
  },
  
  header: {
    marginBottom: SPACING.lg,
  },
  
  title: {
    color: COLORS.text.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  
  formCard: {
    marginBottom: SPACING.lg,
  },
  
  formSection: {
    marginBottom: SPACING.md,
  },
  
  formLabel: {
    color: COLORS.text.secondary,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  
  input: {
    backgroundColor: COLORS.primary.cardLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary.cardLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  dateButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
  },
  
  placeholder: {
    color: COLORS.text.muted,
  },
  
  dateButtonIcon: {
    fontSize: 18,
  },
  
  errorBox: {
    backgroundColor: COLORS.accent.crimson + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent.crimson,
  },
  
  errorText: {
    color: COLORS.accent.crimsonLight,
    fontSize: 14,
    textAlign: 'center',
  },
  
  saveButton: {
    marginTop: SPACING.sm,
  },
  
  saveButtonGradient: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  
  saveButtonText: {
    color: COLORS.primary.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  
  resultSection: {
    gap: SPACING.md,
  },
  
  resultCard: {
    marginBottom: 0,
  },
  
  resultTitle: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  strengthInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  
  strengthLabel: {
    color: COLORS.text.muted,
    fontSize: 12,
  },
  
  strengthValue: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  
  strengthBadge: {
    backgroundColor: COLORS.accent.gold + '30',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accent.gold,
  },
  
  strengthBadgeText: {
    color: COLORS.accent.goldLight,
    fontSize: 14,
    fontWeight: '600',
  },
  
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  scoreLabel: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  
  scoreValue: {
    color: COLORS.accent.gold,
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  tiaoHouBox: {
    backgroundColor: COLORS.accent.jade + '20',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.accent.jade + '50',
  },
  
  tiaoHouText: {
    color: COLORS.accent.jadeLight,
    fontSize: 13,
    textAlign: 'center',
  },
  
  specialBox: {
    backgroundColor: COLORS.accent.gold + '20',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.accent.gold + '50',
  },
  
  specialText: {
    color: COLORS.accent.goldLight,
    fontSize: 13,
    textAlign: 'center',
  },
  
  wuXingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  wuXingStatItem: {
    alignItems: 'center',
  },
  
  wuXingStatCount: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
});

export default ProfileScreen;
