/**
 * 天目应用 - Android原生模块
 * ARCore集成与物体检测
 */

package com.tianmu.ar;

import android.content.Context;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.google.ar.core.ArCoreApk;
import com.google.ar.core.Config;
import com.google.ar.core.Session;
import com.google.ar.core.Frame;
import com.google.ar.core.Pose;
import com.google.ar.core.exceptions.UnavailableException;

import org.tensorflow.lite.Interpreter;

import java.io.IOException;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.List;

/**
 * ARCore模块 - 提供AR功能的原生实现
 */
@ReactModule(name = ARCoreModule.NAME)
public class ARCoreModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ARCoreModule";
    private static final String TAG = "ARCoreModule";

    private Session arSession;
    private boolean isSessionRunning = false;
    private Interpreter tfliteInterpreter;
    private boolean isModelLoaded = false;

    public ARCoreModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    /**
     * 初始化AR会话
     */
    @ReactMethod
    public void initialize(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            
            // 检查ARCore支持
            ArCoreApk.Availability availability = ArCoreApk.getInstance().checkAvailability(context);
            if (availability.isTransient()) {
                promise.reject("AR_TRANSIENT", "ARCore正在检查可用性，请稍后重试");
                return;
            }
            
            if (!availability.isSupported()) {
                promise.reject("AR_NOT_SUPPORTED", "此设备不支持ARCore");
                return;
            }

            // 创建AR会话
            if (arSession == null) {
                arSession = new Session(context);
                
                // 配置AR会话
                Config config = new Config(arSession);
                config.setUpdateMode(Config.UpdateMode.LATEST_CAMERA_IMAGE);
                config.setFocusMode(Config.FocusMode.AUTO);
                arSession.configure(config);
            }

            Log.d(TAG, "ARCore初始化成功");
            promise.resolve(true);
            
        } catch (UnavailableException e) {
            Log.e(TAG, "ARCore不可用: " + e.getMessage());
            promise.reject("AR_UNAVAILABLE", e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "ARCore初始化失败: " + e.getMessage());
            promise.reject("AR_INIT_FAILED", e.getMessage());
        }
    }

    /**
     * 启动AR会话
     */
    @ReactMethod
    public void startSession(Promise promise) {
        if (arSession == null) {
            promise.reject("AR_NOT_INITIALIZED", "AR会话未初始化");
            return;
        }

        try {
            arSession.resume();
            isSessionRunning = true;
            Log.d(TAG, "AR会话已启动");
            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "启动AR会话失败: " + e.getMessage());
            promise.reject("AR_START_FAILED", e.getMessage());
        }
    }

    /**
     * 停止AR会话
     */
    @ReactMethod
    public void stopSession(Promise promise) {
        if (arSession != null) {
            arSession.pause();
            isSessionRunning = false;
            Log.d(TAG, "AR会话已停止");
        }
        promise.resolve(null);
    }

    /**
     * 检查AR是否支持
     */
    @ReactMethod
    public void isARSupported(Promise promise) {
        Context context = getReactApplicationContext();
        ArCoreApk.Availability availability = ArCoreApk.getInstance().checkAvailability(context);
        promise.resolve(availability.isSupported());
    }

    /**
     * 获取相机位置
     */
    @ReactMethod
    public void getCameraPosition(Promise promise) {
        if (arSession == null || !isSessionRunning) {
            promise.reject("AR_NOT_RUNNING", "AR会话未运行");
            return;
        }

        try {
            Frame frame = arSession.update();
            Pose cameraPose = frame.getCamera().getPose();
            
            WritableMap position = Arguments.createMap();
            position.putDouble("x", cameraPose.tx());
            position.putDouble("y", cameraPose.ty());
            position.putDouble("z", cameraPose.tz());
            
            promise.resolve(position);
        } catch (Exception e) {
            promise.reject("AR_GET_POSITION_FAILED", e.getMessage());
        }
    }

    /**
     * 获取相机旋转
     */
    @ReactMethod
    public void getCameraRotation(Promise promise) {
        if (arSession == null || !isSessionRunning) {
            promise.reject("AR_NOT_RUNNING", "AR会话未运行");
            return;
        }

        try {
            Frame frame = arSession.update();
            Pose cameraPose = frame.getCamera().getPose();
            float[] quaternion = cameraPose.getRotationQuaternion();
            
            WritableMap rotation = Arguments.createMap();
            rotation.putDouble("x", quaternion[0]);
            rotation.putDouble("y", quaternion[1]);
            rotation.putDouble("z", quaternion[2]);
            rotation.putDouble("w", quaternion[3]);
            
            promise.resolve(rotation);
        } catch (Exception e) {
            promise.reject("AR_GET_ROTATION_FAILED", e.getMessage());
        }
    }

    /**
     * 添加AR锚点
     */
    @ReactMethod
    public void addAnchor(ReadableMap position, Promise promise) {
        if (arSession == null || !isSessionRunning) {
            promise.reject("AR_NOT_RUNNING", "AR会话未运行");
            return;
        }

        try {
            float x = (float) position.getDouble("x");
            float y = (float) position.getDouble("y");
            float z = (float) position.getDouble("z");
            
            Pose pose = Pose.makeTranslation(x, y, z);
            com.google.ar.core.Anchor anchor = arSession.createAnchor(pose);
            
            promise.resolve(anchor.getAnchor().toString());
        } catch (Exception e) {
            promise.reject("AR_ADD_ANCHOR_FAILED", e.getMessage());
        }
    }

    /**
     * 移除AR锚点
     */
    @ReactMethod
    public void removeAnchor(String anchorId, Promise promise) {
        // 锚点管理逻辑
        promise.resolve(null);
    }

    /**
     * 设置检测开关
     */
    @ReactMethod
    public void setDetectionEnabled(boolean enabled, Promise promise) {
        Log.d(TAG, "检测开关: " + enabled);
        promise.resolve(null);
    }

    /**
     * 设置检测类别
     */
    @ReactMethod
    public void setDetectionClasses(ReadableArray classes, Promise promise) {
        List<String> classList = new ArrayList<>();
        for (int i = 0; i < classes.size(); i++) {
            classList.add(classes.getString(i));
        }
        Log.d(TAG, "设置检测类别: " + classList.toString());
        promise.resolve(null);
    }

    /**
     * 发送事件到JavaScript
     */
    private void sendEvent(String eventName, @Nullable WritableMap params) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (arSession != null) {
            arSession.close();
            arSession = null;
        }
        if (tfliteInterpreter != null) {
            tfliteInterpreter.close();
            tfliteInterpreter = null;
        }
    }
}
