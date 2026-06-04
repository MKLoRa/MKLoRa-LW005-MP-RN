package com.mklorawanmp;

import android.app.Activity;

import androidx.annotation.Nullable;

import no.nordicsemi.android.dfu.DfuBaseService;

/** App-visible DFU service (library DfuService is package-private in 2.9+). */
public class MPDfuService extends DfuBaseService {

  @Nullable
  @Override
  protected Class<? extends Activity> getNotificationTarget() {
    return MainActivity.class;
  }
}
