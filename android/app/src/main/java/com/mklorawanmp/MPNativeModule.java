package com.mklorawanmp;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.OpenableColumns;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.content.FileProvider;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import no.nordicsemi.android.dfu.DfuProgressListener;
import no.nordicsemi.android.dfu.DfuProgressListenerAdapter;
import no.nordicsemi.android.dfu.DfuBaseService;
import no.nordicsemi.android.dfu.DfuServiceController;
import no.nordicsemi.android.dfu.DfuServiceInitiator;
import no.nordicsemi.android.dfu.DfuServiceListenerHelper;

/** Nordic Android-DFU-Library bridge — aligned with iOS MPNative. */
public class MPNativeModule extends ReactContextBaseJavaModule
    implements LifecycleEventListener, ActivityEventListener {

  private static final String TAG = "MPNative";
  private static final int PICK_FIRMWARE_REQUEST = 41891;
  private static final String EVENT_UPLOADING = "MPDfuUploading";
  private static final String EVENT_PROGRESS = "MPDfuProgress";
  private static final String EVENT_SUCCESS = "MPDfuSuccess";
  private static final String EVENT_ERROR = "MPDfuError";

  private final ReactApplicationContext reactContext;
  private DfuServiceController dfuController;
  private boolean uploadingEmitted;
  private boolean listenerRegistered;
  @Nullable private Promise pickFirmwarePromise;

  public MPNativeModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    reactContext.addLifecycleEventListener(this);
    reactContext.addActivityEventListener(this);
    ensureProgressListener();
  }

  @Override
  public String getName() {
    return "MPNative";
  }

  @ReactMethod
  public void addListener(String eventName) {}

  @ReactMethod
  public void removeListeners(int count) {}

  @ReactMethod
  public void listDocumentFiles(Promise promise) {
    try {
      Set<String> names = new LinkedHashSet<>();
      for (File dir : firmwareDirectories()) {
        File[] files = dir.listFiles();
        if (files == null) {
          continue;
        }
        for (File file : files) {
          if (file.isFile()) {
            names.add(file.getName());
          }
        }
      }
      WritableArray array = Arguments.createArray();
      for (String name : names) {
        array.pushString(name);
      }
      promise.resolve(array);
    } catch (Exception e) {
      promise.reject("list_error", e.getMessage(), e);
    }
  }

  /** 打开系统文件管理器选择 .zip 固件（对齐用户从文件夹选取） */
  @ReactMethod
  public void pickFirmwareFile(Promise promise) {
    Activity activity = reactContext.getCurrentActivity();
    if (activity == null) {
      promise.reject("no_activity", "Activity not available");
      return;
    }
    if (pickFirmwarePromise != null) {
      pickFirmwarePromise.reject("busy", "Picker already open");
      pickFirmwarePromise = null;
    }
    pickFirmwarePromise = promise;
    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType("*/*");
    intent.putExtra(
        Intent.EXTRA_MIME_TYPES,
        new String[] {"application/zip", "application/x-zip-compressed"});
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    try {
      activity.startActivityForResult(intent, PICK_FIRMWARE_REQUEST);
    } catch (Exception e) {
      pickFirmwarePromise = null;
      promise.reject("picker_error", e.getMessage(), e);
    }
  }

  @Override
  public void onActivityResult(
      Activity activity, int requestCode, int resultCode, @Nullable Intent data) {
    if (requestCode != PICK_FIRMWARE_REQUEST || pickFirmwarePromise == null) {
      return;
    }
    Promise promise = pickFirmwarePromise;
    pickFirmwarePromise = null;
    if (resultCode != Activity.RESULT_OK || data == null || data.getData() == null) {
      promise.reject("cancelled", "User cancelled");
      return;
    }
    Uri uri = data.getData();
    try {
      final int takeFlags = data.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION;
      reactContext.getContentResolver().takePersistableUriPermission(uri, takeFlags);
    } catch (Exception ignored) {
      // 部分机型不支持 persistable，仍可尝试读取
    }
    try {
      File copied = copyFirmwareUriToAppStorage(uri);
      WritableMap map = Arguments.createMap();
      map.putString("fileName", copied.getName());
      map.putString("filePath", copied.getAbsolutePath());
      promise.resolve(map);
    } catch (Exception e) {
      Log.e(TAG, "pickFirmwareFile copy failed", e);
      promise.reject("copy_error", e.getMessage(), e);
    }
  }

  @Override
  public void onNewIntent(Intent intent) {}

  @ReactMethod
  public void getDocumentsDirectory(Promise promise) {
    File dir = reactContext.getExternalFilesDir(null);
    if (dir == null) {
      dir = reactContext.getFilesDir();
    }
    promise.resolve(dir.getAbsolutePath());
  }

  @ReactMethod
  public void writeDebuggerLogFile(String fileName, String content, Promise promise) {
    try {
      String safeName = sanitizeLogFileName(fileName);
      File file = new File(reactContext.getFilesDir(), safeName);
      try (FileOutputStream out = new FileOutputStream(file, false)) {
        out.write(content.getBytes(StandardCharsets.UTF_8));
        out.flush();
      }
      promise.resolve(file.getAbsolutePath());
    } catch (Exception e) {
      promise.reject("write_error", e.getMessage(), e);
    }
  }

  @ReactMethod
  public void shareFiles(ReadableArray filePaths, Promise promise) {
    Activity activity = reactContext.getCurrentActivity();
    if (activity == null) {
      promise.reject("no_activity", "Activity not available");
      return;
    }
    try {
      ArrayList<Uri> uris = new ArrayList<>();
      for (int i = 0; i < filePaths.size(); i++) {
        String path = filePaths.getString(i);
        if (path == null || path.trim().isEmpty()) {
          continue;
        }
        File file = new File(path);
        if (!file.isFile()) {
          continue;
        }
        Uri uri =
            FileProvider.getUriForFile(
                reactContext, reactContext.getPackageName() + ".fileprovider", file);
        uris.add(uri);
      }
      if (uris.isEmpty()) {
        promise.reject("invalid_args", "No valid files");
        return;
      }

      Intent intent;
      if (uris.size() == 1) {
        intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_STREAM, uris.get(0));
      } else {
        intent = new Intent(Intent.ACTION_SEND_MULTIPLE);
        intent.setType("text/plain");
        intent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris);
      }
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      activity.startActivity(Intent.createChooser(intent, "Share logs"));
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("share_error", e.getMessage(), e);
    }
  }

  @ReactMethod
  public void startDFU(String deviceId, String fileName) {
    File file = resolveFirmwareFile(fileName);
    if (file == null || !file.exists()) {
      emitError("Dfu upgrade failure!");
      return;
    }
    String address = normalizeBluetoothAddress(deviceId);
    if (address.isEmpty()) {
      emitError("Invalid device address");
      return;
    }
    ensureProgressListener();
    uploadingEmitted = false;
    // 等 JS 侧 destroy ble-plx 后再启动，避免与 Nordic 争用 GATT / MTU
    new Handler(Looper.getMainLooper())
        .postDelayed(
            () -> startDfuAfterBleReleased(address, file.getAbsolutePath()),
            400);
  }

  private void startDfuAfterBleReleased(String address, String zipPath) {
    try {
      DfuServiceInitiator starter =
          new DfuServiceInitiator(address)
              .setKeepBond(false)
              .disableMtuRequest()
              .setForeground(false)
              .setDisableNotification(true)
              .setUnsafeExperimentalButtonlessServiceInSecureDfuEnabled(true)
              .setNumberOfRetries(3)
              .setPrepareDataObjectDelay(600)
              .setRebootTime(1_000)
              .setZip(zipPath);
      Log.i(TAG, "startDFU: disableMtuRequest, mtu=0 (no 517 request)");
      dfuController = starter.start(reactContext, MPDfuService.class);
    } catch (Exception e) {
      Log.e(TAG, "startDFU failed", e);
      emitError(e.getMessage() != null ? e.getMessage() : "DFU failed");
    }
  }

  /** Nordic DFU expects uppercase MAC with colons (AA:BB:CC:DD:EE:FF). */
  private static String normalizeBluetoothAddress(@Nullable String deviceId) {
    if (deviceId == null) {
      return "";
    }
    String s = deviceId.trim().toUpperCase(Locale.US);
    if (s.matches("([0-9A-F]{2}:){5}[0-9A-F]{2}")) {
      return s;
    }
    String hex = s.replace(":", "");
    if (hex.matches("[0-9A-F]{12}")) {
      StringBuilder sb = new StringBuilder(17);
      for (int i = 0; i < 12; i += 2) {
        if (i > 0) {
          sb.append(':');
        }
        sb.append(hex, i, i + 2);
      }
      return sb.toString();
    }
    return s;
  }

  @ReactMethod
  public void cancelDFU() {
    if (dfuController != null) {
      dfuController.abort();
      dfuController = null;
    }
    uploadingEmitted = false;
  }

  private final DfuProgressListener dfuProgressListener =
      new DfuProgressListenerAdapter() {
        @Override
        public void onDeviceConnecting(String deviceAddress) {
          WritableMap map = Arguments.createMap();
          map.putDouble("progress", 0);
          sendEvent(EVENT_PROGRESS, map);
        }

        @Override
        public void onDfuProcessStarting(String deviceAddress) {
          if (!uploadingEmitted) {
            uploadingEmitted = true;
            sendEvent(EVENT_UPLOADING, null);
          }
        }

        @Override
        public void onProgressChanged(
            String deviceAddress,
            int percent,
            float speed,
            float avgSpeed,
            int currentPart,
            int partsTotal) {
          if (!uploadingEmitted) {
            uploadingEmitted = true;
            sendEvent(EVENT_UPLOADING, null);
          }
          WritableMap map = Arguments.createMap();
          map.putDouble("progress", percent / 100.0);
          sendEvent(EVENT_PROGRESS, map);
        }

        @Override
        public void onDfuCompleted(String deviceAddress) {
          dfuController = null;
          uploadingEmitted = false;
          sendEvent(EVENT_SUCCESS, null);
          new Handler(Looper.getMainLooper())
              .postDelayed(
                  () -> {
                    NotificationManager manager =
                        (NotificationManager)
                            reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
                    if (manager != null) {
                      manager.cancel(DfuBaseService.NOTIFICATION_ID);
                    }
                  },
                  200);
        }

        @Override
        public void onDfuAborted(String deviceAddress) {
          dfuController = null;
          uploadingEmitted = false;
          emitError("Opps!DFU Failed. Please try again!");
        }

        @Override
        public void onError(
            String deviceAddress, int error, int errorType, String message) {
          dfuController = null;
          uploadingEmitted = false;
          emitError(message != null ? message : "DFU failed");
        }
      };

  @Override
  public void onHostResume() {
    ensureProgressListener();
  }

  @Override
  public void onHostPause() {}

  @Override
  public void onHostDestroy() {
    if (listenerRegistered) {
      DfuServiceListenerHelper.unregisterProgressListener(reactContext, dfuProgressListener);
      listenerRegistered = false;
    }
    if (pickFirmwarePromise != null) {
      pickFirmwarePromise.reject("destroyed", "Activity destroyed");
      pickFirmwarePromise = null;
    }
  }

  private void ensureProgressListener() {
    if (!listenerRegistered) {
      DfuServiceListenerHelper.registerProgressListener(reactContext, dfuProgressListener);
      listenerRegistered = true;
    }
  }

  private List<File> firmwareDirectories() {
    List<File> dirs = new ArrayList<>();
    dirs.add(reactContext.getFilesDir());
    File external = reactContext.getExternalFilesDir(null);
    if (external != null) {
      dirs.add(external);
    }
    return dirs;
  }

  @Nullable
  private File resolveFirmwareFile(String fileName) {
    if (fileName != null && fileName.startsWith("/")) {
      File absolute = new File(fileName);
      if (absolute.isFile()) {
        return absolute;
      }
    }
    for (File dir : firmwareDirectories()) {
      File candidate = new File(dir, fileName);
      if (candidate.isFile()) {
        return candidate;
      }
    }
    return null;
  }

  private File copyFirmwareUriToAppStorage(Uri uri) throws Exception {
    String displayName = queryDisplayName(uri);
    if (displayName == null || displayName.trim().isEmpty()) {
      displayName = "firmware.zip";
    }
    if (!displayName.toLowerCase(Locale.US).endsWith(".zip")) {
      displayName = displayName + ".zip";
    }
    File dest = new File(reactContext.getFilesDir(), displayName);
    if (dest.exists()) {
      dest.delete();
    }
    try (InputStream in = reactContext.getContentResolver().openInputStream(uri);
        OutputStream out = new FileOutputStream(dest)) {
      if (in == null) {
        throw new IllegalStateException("Cannot open firmware file");
      }
      byte[] buffer = new byte[8192];
      int read;
      while ((read = in.read(buffer)) != -1) {
        out.write(buffer, 0, read);
      }
      out.flush();
    }
    return dest;
  }

  @Nullable
  private String queryDisplayName(Uri uri) {
    Cursor cursor =
        reactContext
            .getContentResolver()
            .query(uri, new String[] {OpenableColumns.DISPLAY_NAME}, null, null, null);
    if (cursor == null) {
      return null;
    }
    try {
      if (cursor.moveToFirst()) {
        int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
        if (index >= 0) {
          return cursor.getString(index);
        }
      }
    } finally {
      cursor.close();
    }
    return null;
  }

  private void sendEvent(String eventName, @Nullable WritableMap params) {
    reactContext.runOnUiQueueThread(
        () -> {
          if (!reactContext.hasActiveReactInstance()) {
            return;
          }
          reactContext
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit(eventName, params);
        });
  }

  private void emitError(String message) {
    WritableMap map = Arguments.createMap();
    map.putString("message", message);
    sendEvent(EVENT_ERROR, map);
  }

  private static String sanitizeLogFileName(@Nullable String fileName) {
    if (fileName == null || fileName.trim().isEmpty()) {
      return "debugger.log.txt";
    }
    String safe = fileName.replaceAll("[/\\\\?%*|\"<> ]+", "-");
    if (!safe.toLowerCase(Locale.US).endsWith(".txt")) {
      safe = safe + ".txt";
    }
    return safe;
  }
}
