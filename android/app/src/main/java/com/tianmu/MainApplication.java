/**
 * 天目应用 - 主Application类
 */

package com.tianmu;

import android.app.Application;
import android.content.Context;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import com.tianmu.ar.TianmuARPackage;

import java.lang.reflect.InvocationTargetException;
import java.util.List;

/**
 * 主Application类 - 初始化React Native和自定义模块
 */
public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            @SuppressWarnings("UnnecessaryLocalVariable")
            List<ReactPackage> packages = new PackageList(this).getPackages();
            
            // 添加天目AR模块包
            packages.add(new TianmuARPackage());
            
            return packages;
        }

        @Override
        protected String getJSMainModuleName() {
            return "src/App";
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        
        // 初始化SoLoader
        SoLoader.init(this, /* native exopackage */ false);
        
        // 初始化ARCore
        initializeARCore();
    }

    /**
     * 初始化ARCore
     */
    private void initializeARCore() {
        // ARCore初始化逻辑
        // 实际安装检查会在ARCoreModule中进行
    }
}
