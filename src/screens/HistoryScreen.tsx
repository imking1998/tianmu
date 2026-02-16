/**
 * 天目应用 - 历史记录屏幕
 * 功能：查看扫描历史、收藏物品
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHistoryStore } from '../store';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  GradientCard,
  WuXingBadge,
  QiIndicator,
} from '../components/UIComponents';
import { HistoryItem, ARDetectionResult } from '../types';

export const HistoryScreen: React.FC = () => {
  const { records, removeRecord, clearRecords } = useHistoryStore();

  const renderRecord = ({ item }: { item: HistoryItem }) => (
    <GradientCard style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>
          {new Date(item.timestamp).toLocaleDateString('zh-CN')}
        </Text>
        <Text style={styles.recordTime}>
          {new Date(item.timestamp).toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
      
      <View style={styles.recordItems}>
        {item.items.slice(0, 4).map((detectedItem, index) => (
          <View key={index} style={styles.itemRow}>
            <WuXingBadge 
              wuXing={detectedItem.itemAnalysis.wuXing} 
              size="sm" 
              showLabel={false} 
            />
            <Text style={styles.itemName}>{detectedItem.itemName}</Text>
            <Text style={[
              styles.itemEffect,
              {
                color: detectedItem.itemAnalysis.isJiShen 
                  ? COLORS.accent.crimson 
                  : detectedItem.itemAnalysis.isXiYong 
                    ? COLORS.accent.jade 
                    : COLORS.text.muted
              }
            ]}>
              {detectedItem.itemAnalysis.isXiYong ? '喜' : 
               detectedItem.itemAnalysis.isJiShen ? '忌' : '中'}
            </Text>
          </View>
        ))}
      </View>

      {item.location && (
        <Text style={styles.recordLocation}>📍 {item.location}</Text>
      )}
    </GradientCard>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📜</Text>
      <Text style={styles.emptyTitle}>暂无记录</Text>
      <Text style={styles.emptySubtitle}>
        开始扫描物品，记录将显示在这里
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>扫描记录</Text>
        {records.length > 0 && (
          <TouchableOpacity onPress={clearRecords}>
            <Text style={styles.clearButton}>清空</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary.dark,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  title: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  clearButton: {
    color: COLORS.accent.crimson,
    fontSize: 14,
  },
  
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  
  recordCard: {
    marginBottom: SPACING.md,
  },
  
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  
  recordDate: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  recordTime: {
    color: COLORS.text.muted,
    fontSize: 14,
  },
  
  recordItems: {
    gap: SPACING.xs,
  },
  
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  
  itemName: {
    flex: 1,
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  
  itemEffect: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  recordLocation: {
    color: COLORS.text.muted,
    fontSize: 12,
    marginTop: SPACING.sm,
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  
  emptyTitle: {
    color: COLORS.text.primary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  
  emptySubtitle: {
    color: COLORS.text.muted,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HistoryScreen;
