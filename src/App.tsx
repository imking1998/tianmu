/**
 * 天目应用 - 主入口
 * 初始化导航、状态管理、主题配置
 */

import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useUserStore, useUIStore } from './store';
import { COLORS } from './components/UIComponents';

// 屏幕组件懒加载
const ARScanScreen = React.lazy(() => import('./screens/ARScanScreen'));
const ProfileScreen = React.lazy(() => import('./screens/ProfileScreen'));
const HistoryScreen = React.lazy(() => import('./screens/HistoryScreen'));
const SettingsScreen = React.lazy(() => import('./screens/SettingsScreen'));
const OnboardingScreen = React.lazy(() => import('./screens/OnboardingScreen'));

// 导航类型定义
export type RootStackParamList = {
  Main: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Scan: undefined;
  Profile: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 加载占位组件
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.accent.gold} />
  </View>
);

// 底部导航栏图标
const TabBarIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => {
  const icons: Record<string, string> = {
    Scan: '👁️',
    Profile: '☯️',
    History: '📜',
    Settings: '⚙️',
  };
  
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={styles.tabIconText}>{icons[name]}</Text>
    </View>
  );
};

// 主标签导航
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent.gold,
        tabBarInactiveTintColor: COLORS.text.muted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => (
          <TabBarIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen 
        name="Scan" 
        component={LazyWrapper(ARScanScreen)}
        options={{ tabBarLabel: '扫描' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={LazyWrapper(ProfileScreen)}
        options={{ tabBarLabel: '档案' }}
      />
      <Tab.Screen 
        name="History" 
        component={LazyWrapper(HistoryScreen)}
        options={{ tabBarLabel: '记录' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={LazyWrapper(SettingsScreen)}
        options={{ tabBarLabel: '设置' }}
      />
    </Tab.Navigator>
  );
};

// 懒加载包装器
function LazyWrapper(Component: React.LazyExoticComponent<React.FC>) {
  return () => (
    <React.Suspense fallback={<LoadingScreen />}>
      <Component />
    </React.Suspense>
  );
}

// 主应用组件
const App: React.FC = () => {
  const { isOnboarded, profile } = useUserStore();
  const { theme } = useUIStore();

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={COLORS.primary.darker}
        />
        <NavigationContainer>
          <Stack.Navigator 
            screenOptions={{ headerShown: false }}
            initialRouteName={isOnboarded ? 'Main' : 'Onboarding'}
          >
            {!isOnboarded ? (
              <Stack.Screen 
                name="Onboarding" 
                component={LazyWrapper(OnboardingScreen)}
              />
            ) : (
              <Stack.Screen name="Main" component={MainTabs} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary.darker,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary.darker,
  },
  
  tabBar: {
    backgroundColor: COLORS.primary.card,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
  },
  
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  
  tabIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  
  tabIconFocused: {
    backgroundColor: COLORS.accent.gold + '20',
  },
  
  tabIconText: {
    fontSize: 18,
  },
});

export default App;
