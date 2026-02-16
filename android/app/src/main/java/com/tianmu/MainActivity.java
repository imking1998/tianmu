/**
 * 天目应用 - 主Activity类
 */

package com.tianmu;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

/**
 * 主Activity - 应用的入口Activity
 */
public class MainActivity extends ReactActivity {

    /**
     * 返回主组件名称
     */
    @Override
    protected String getMainComponentName() {
        return "tianmu";
    }

    /**
     * 创建Activity委托
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
            this,
            getMainComponentName(),
            DefaultNewArchitectureEntryPoint.getFabricEnabled()
        );
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);
    }
}
