/**
 * 天目应用 - 设置屏幕
 * 功能：应用设置、关于信息
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUIStore, useUserStore } from '../store';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  GradientCard,
} from '../components/UIComponents';

export const SettingsScreen: React.FC = () => {
  const { theme, toggleTheme } = useUIStore();
  const { clearProfile, profile } = useUserStore();
  const [notifications, setNotifications] = React.useState(true);
  const [hapticFeedback, setHapticFeedback] = React.useState(true);

  const SettingItem: React.FC<{
    label: string;
    description?: string;
    value?: boolean;
    onToggle?: () => void;
    onPress?: () => void;
    danger?: boolean;
  }> = ({ label, description, value, onToggle, onPress, danger }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, danger && styles.dangerText]}>
          {label}
        </Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      {value !== undefined && onToggle && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{
            false: COLORS.primary.cardLight,
            true: COLORS.accent.jade + '50',
          }}
          thumbColor={value ? COLORS.accent.jade : COLORS.text.muted}
        />
      )}
      {onPress && !onToggle && (
        <Text style={styles.settingArrow}>›</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>设置</Text>
      </View>

      {/* 外观设置 */}
      <GradientCard style={styles.section}>
        <Text style={styles.sectionTitle}>外观</Text>
        <SettingItem
          label="深色模式"
          description="当前主题：深色"
          value={theme === 'dark'}
          onToggle={toggleTheme}
        />
        <View style={styles.divider} />
        <SettingItem
          label="触感反馈"
          description="操作时提供震动反馈"
          value={hapticFeedback}
          onToggle={() => setHapticFeedback(!hapticFeedback)}
        />
      </GradientCard>

      {/* 通知设置 */}
      <GradientCard style={styles.section}>
        <Text style={styles.sectionTitle}>通知</Text>
        <SettingItem
          label="推送通知"
          description="接收重要提醒"
          value={notifications}
          onToggle={() => setNotifications(!notifications)}
        />
      </GradientCard>

      {/* 数据管理 */}
      <GradientCard style={styles.section}>
        <Text style={styles.sectionTitle}>数据</Text>
        <SettingItem
          label="清除用户数据"
          description="删除所有个人档案和设置"
          onPress={clearProfile}
          danger
        />
      </GradientCard>

      {/* 关于 */}
      <GradientCard style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        <SettingItem
          label="天目"
          description="版本 1.0.0"
        />
        <View style={styles.divider} />
        <SettingItem
          label="隐私政策"
          onPress={() => {}}
        />
        <View style={styles.divider} />
        <SettingItem
          label="使用条款"
          onPress={() => {}}
        />
        <View style={styles.divider} />
        <SettingItem
          label="开源许可"
          onPress={() => {}}
        />
      </GradientCard>

      {/* 用户信息 */}
      {profile && (
        <GradientCard style={styles.section}>
          <Text style={styles.sectionTitle}>当前用户</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile.name || '未命名用户'}</Text>
            <Text style={styles.userBazi}>
              {profile.bazi.siZhu.year.gan}{profile.bazi.siZhu.year.zhi} · 
              {profile.bazi.siZhu.month.gan}{profile.bazi.siZhu.month.zhi} · 
              {profile.bazi.siZhu.day.gan}{profile.bazi.siZhu.day.zhi} · 
              {profile.bazi.siZhu.hour.gan}{profile.bazi.siZhu.hour.zhi}
            </Text>
          </View>
        </GradientCard>
      )}

      {/* 版权信息 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          天目 · 以道观物
        </Text>
        <Text style={styles.footerSubtext}>
          © 2025 Tianmu App. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary.dark,
  },
  
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  title: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  section: {
    margin: SPACING.md,
    marginBottom: 0,
    padding: 0,
    overflow: 'hidden',
  },
  
  sectionTitle: {
    color: COLORS.text.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  
  settingInfo: {
    flex: 1,
  },
  
  settingLabel: {
    color: COLORS.text.primary,
    fontSize: 16,
  },
  
  settingDescription: {
    color: COLORS.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  
  settingArrow: {
    color: COLORS.text.muted,
    fontSize: 24,
  },
  
  dangerText: {
    color: COLORS.accent.crimson,
  },
  
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: SPACING.md,
  },
  
  userInfo: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  
  userName: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  
  userBazi: {
    color: COLORS.text.secondary,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  
  footer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  
  footerText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  
  footerSubtext: {
    color: COLORS.text.muted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});

export default SettingsScreen;
