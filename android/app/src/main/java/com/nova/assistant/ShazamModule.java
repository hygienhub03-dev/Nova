package com.nova.assistant;

import android.util.Log;

import com.chaquo.python.Python;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ShazamModule extends ReactContextBaseJavaModule {

    private static final String TAG = "ShazamModule";

    ShazamModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ShazamModule";
    }

    @ReactMethod
    public void recognizeSong(String audioPath, Promise promise) {
        try {
            if (!Python.isStarted()) {
                Python.start(new AndroidPlatform(getCurrentActivity()));
            }
            Python py = Python.getInstance();
            com.chaquo.python.PyObject module = py.getModule("shazam_module");
            com.chaquo.python.PyObject result = module.callAttr("recognize", audioPath);
            String resultStr = result.toString();
            promise.resolve(resultStr);
        } catch (Exception e) {
            Log.e(TAG, "Shazam recognition error", e);
            promise.reject("SHAZAM_ERROR", e.getMessage());
        }
    }
}