/**
 * 天目应用 - 自定义Hook库
 * 封装常用逻辑，提供响应式状态管理
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dimensions, Platform, Vibration, AppState, AppStateStatus } from 'react-native';
import { useUserStore, useARStore, useUIStore, useHistoryStore } from '../store';
import { TianmuService } from '../services/TianmuCore';
import { arService } from '../services/ARRecognition';
import { ARDetectionResult, ItemFeatures, UserProfile } from '../types';

// ==================== 屏幕尺寸Hook ====================

export function useScreenDimensions() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  return {
    ...dimensions,
    isSmallScreen: dimensions.width < 375,
    isLargeScreen: dimensions.width >= 414,
    isLandscape: dimensions.width > dimensions.height,
  };
}

// ==================== 用户档案Hook ====================

export function useUserProfile() {
  const { profile, setProfile, updateProfile, clearProfile, isOnboarded } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfile = useCallback(async (
    birthDate: string,
    birthTime: string,
    name?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const newProfile = TianmuService.createUserProfile(
        profile?.id || `user_${Date.now()}`,
        birthDate,
        birthTime,
        name
      );
      setProfile(newProfile);
      return newProfile;
    } catch (err: any) {
      setError(err.message || '创建档案失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, setProfile]);

  return {
    profile,
    isOnboarded,
    isLoading,
    error,
    createProfile,
    updateProfile,
    clearProfile,
    xiYong: profile?.strengthAnalysis.xiYong || [],
    jiShen: profile?.strengthAnalysis.jiShen || [],
    riGan: profile?.bazi.riGan,
    riWuXing: profile?.bazi.riWuXing,
    strength: profile?.strengthAnalysis.strength,
  };
}

// ==================== AR扫描Hook ====================

export function useARScanner() {
  const {
    isScanning,
    detectedItems,
    selectedItem,
    cameraPermission,
    setScanning,
    addDetectedItem,
    selectItem,
    clearDetectedItems,
    setCameraPermission,
  } = useARStore();

  const { profile } = useUserStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化AR服务
  const initialize = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const success = await arService.initialize();
      if (!success) {
        throw new Error('AR服务初始化失败');
      }
      setCameraPermission('granted');
      return true;
    } catch (err: any) {
      setError(err.message);
      setCameraPermission('denied');
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [setCameraPermission]);

  // 开始扫描
  const startScanning = useCallback(async () => {
    if (!profile) {
      setError('请先设置您的八字信息');
      return;
    }

    const initialized = await initialize();
    if (!initialized) return;

    setScanning(true);
    clearDetectedItems();

    // 模拟扫描（实际应使用原生AR模块）
    scanIntervalRef.current = setInterval(() => {
      if (detectedItems.length < 10) {
        const result = arService.simulateDetection();
        addDetectedItem(result);
      }
    }, 2000);
  }, [profile, initialize, setScanning, clearDetectedItems, detectedItems.length, addDetectedItem]);

  // 停止扫描
  const stopScanning = useCallback(() => {
    setScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, [setScanning]);

  // 清理
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  return {
    isScanning,
    isInitializing,
    detectedItems,
    selectedItem,
    cameraPermission,
    error,
    startScanning,
    stopScanning,
    selectItem,
    clearDetectedItems,
    hasProfile: !!profile,
  };
}

// ==================== 物品分析Hook ====================

export function useItemAnalysis() {
  const { profile } = useUserStore();

  const analyzeItem = useCallback((features: ItemFeatures) => {
    if (!profile) {
      return {
        wuXing: '土' as const,
        qiLevel: '气平' as const,
        qiScore: 50,
        isXiYong: false,
        isJiShen: false,
        advice: '请先设置您的八字信息',
        visualEffect: {
          primaryColor: '#FFC107',
          secondaryColor: '#FFD54F',
          glowIntensity: 0.5,
          particleCount: 25,
          animationType: 'pulse' as const,
        },
      };
    }

    return TianmuService.analyzeItem(features, profile);
  }, [profile]);

  const analyzeItems = useCallback((items: ItemFeatures[]) => {
    if (!profile) return [];
    return TianmuService.analyzeItems(items, profile);
  }, [profile]);

  return {
    analyzeItem,
    analyzeItems,
    hasProfile: !!profile,
  };
}

// ==================== 触感反馈Hook ====================

export function useHaptic() {
  const trigger = useCallback((
    type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light'
  ) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      switch (type) {
        case 'light':
          Vibration.vibrate(10);
          break;
        case 'medium':
          Vibration.vibrate(20);
          break;
        case 'heavy':
          Vibration.vibrate(30);
          break;
        case 'success':
          Vibration.vibrate([0, 20, 50, 20]);
          break;
        case 'warning':
          Vibration.vibrate([0, 30, 100, 30]);
          break;
        case 'error':
          Vibration.vibrate([0, 50, 100, 50, 100, 50]);
          break;
        case 'selection':
          Vibration.vibrate(5);
          break;
      }
    }
  }, []);

  return { trigger };
}

// ==================== 应用状态Hook ====================

export function useAppState() {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
      setIsActive(nextState === 'active');
    });

    return () => subscription.remove();
  }, []);

  return {
    appState,
    isActive,
    isBackground: appState === 'background',
    isInactive: appState === 'inactive',
  };
}

// ==================== 动画值Hook ====================

export function useAnimatedValue(initialValue: number = 0) {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  
  return {
    value: animatedValue,
    setValue: (newValue: number) => {
      Animated.timing(animatedValue, {
        toValue: newValue,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    reset: () => {
      animatedValue.setValue(initialValue);
    },
  };
}

import { Animated } from 'react-native';

// ==================== 倒计时Hook ====================

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, seconds]);

  return {
    seconds,
    isRunning,
    isFinished: seconds === 0,
    start,
    pause,
    reset,
  };
}

// ==================== 历史记录Hook ====================

export function useHistory() {
  const { records, addRecord, removeRecord, clearRecords } = useHistoryStore();

  const saveCurrentScan = useCallback((items: ARDetectionResult[], location?: string) => {
    addRecord({
      id: `scan_${Date.now()}`,
      timestamp: new Date(),
      items,
      location,
    });
  }, [addRecord]);

  const getRecentRecords = useCallback((count: number = 10) => {
    return records.slice(0, count);
  }, [records]);

  const getRecordsByDate = useCallback((date: Date) => {
    const targetDate = date.toDateString();
    return records.filter(
      (record) => new Date(record.timestamp).toDateString() === targetDate
    );
  }, [records]);

  return {
    records,
    totalScans: records.length,
    saveCurrentScan,
    getRecentRecords,
    getRecordsByDate,
    removeRecord,
    clearRecords,
  };
}

// ==================== 主题Hook ====================

export function useTheme() {
  const { theme, toggleTheme } = useUIStore();

  const colors = useMemo(() => ({
    primary: theme === 'dark' ? '#0D0D0D' : '#FFFFFF',
    secondary: theme === 'dark' ? '#1A1A1A' : '#F5F5F5',
    text: theme === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: theme === 'dark' ? '#B3B3B3' : '#666666',
  }), [theme]);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    colors,
  };
}
