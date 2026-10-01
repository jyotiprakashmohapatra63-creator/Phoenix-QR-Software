const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const mainActivityPath = path.join(
  androidDir,
  'app',
  'src',
  'main',
  'java',
  'com',
  'phoenixeditpoint',
  'qr',
  'MainActivity.java'
);
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const resXmlDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'xml');
const filePathsXmlPath = path.join(resXmlDir, 'file_paths.xml');

console.log('>>> [patch-android] Starting Android project enhancements...');

if (!fs.existsSync(androidDir)) {
  console.error('>>> [patch-android] Error: android directory does not exist yet.');
  process.exit(1);
}

// 1. Ensure res/xml directory and file_paths.xml exist
if (!fs.existsSync(resXmlDir)) {
  fs.mkdirSync(resXmlDir, { recursive: true });
}

const filePathsContent = `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <cache-path name="shared_images" path="shared_images" />
    <cache-path name="cache" path="." />
    <files-path name="files" path="." />
    <external-path name="external" path="." />
    <external-files-path name="external_files" path="." />
    <external-cache-path name="external_cache" path="." />
</paths>
`;

fs.writeFileSync(filePathsXmlPath, filePathsContent, 'utf8');
console.log('>>> [patch-android] Created file_paths.xml');

// 2. Enhance MainActivity.java with PhoenixNativeBridge
const mainActivityContent = `package com.phoenixeditpoint.qr;

import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.content.Intent;
import android.content.Context;
import android.content.ContentValues;
import android.net.Uri;
import android.util.Base64;
import android.widget.Toast;
import android.provider.MediaStore;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);

            webView.addJavascriptInterface(new PhoenixNativeBridge(this), "PhoenixNative");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static class PhoenixNativeBridge {
        private final Context context;

        public PhoenixNativeBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void downloadImage(final String base64Data, final String filename) {
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    try {
                        saveImageToGallery(base64Data, filename);
                    } catch (Exception e) {
                        e.printStackTrace();
                        Toast.makeText(context, "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void shareImage(final String base64Data, final String filename, final String text) {
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    try {
                        shareImageFile(base64Data, filename, text);
                    } catch (Exception e) {
                        e.printStackTrace();
                        Toast.makeText(context, "Share failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    }
                }
            });
        }

        private void saveImageToGallery(String base64Data, String filename) throws Exception {
            byte[] imageBytes = decodeBase64(base64Data);
            if (imageBytes == null || imageBytes.length == 0) {
                Toast.makeText(context, "Invalid image data", Toast.LENGTH_SHORT).show();
                return;
            }

            String finalName = filename;
            if (finalName == null || finalName.trim().isEmpty()) {
                finalName = "Phoenix_QR_" + System.currentTimeMillis() + ".png";
            }
            if (!finalName.toLowerCase().endsWith(".png")) {
                finalName += ".png";
            }

            OutputStream outputStream = null;
            Uri imageUri = null;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, finalName);
                values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + File.separator + "PhoenixEditPoint");
                values.put(MediaStore.Images.Media.IS_PENDING, 1);

                imageUri = context.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (imageUri != null) {
                    outputStream = context.getContentResolver().openOutputStream(imageUri);
                }
            } else {
                File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                File phoenixDir = new File(picturesDir, "PhoenixEditPoint");
                if (!phoenixDir.exists()) {
                    phoenixDir.mkdirs();
                }
                File imageFile = new File(phoenixDir, finalName);
                outputStream = new FileOutputStream(imageFile);
                imageUri = Uri.fromFile(imageFile);
            }

            if (outputStream != null) {
                outputStream.write(imageBytes);
                outputStream.flush();
                outputStream.close();

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && imageUri != null) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Images.Media.IS_PENDING, 0);
                    context.getContentResolver().update(imageUri, values, null, null);
                }

                Toast.makeText(context, "Saved to Gallery / Pictures: " + finalName, Toast.LENGTH_LONG).show();
            } else {
                Toast.makeText(context, "Could not open storage for saving", Toast.LENGTH_SHORT).show();
            }
        }

        private void shareImageFile(String base64Data, String filename, String text) throws Exception {
            byte[] imageBytes = decodeBase64(base64Data);
            if (imageBytes == null || imageBytes.length == 0) {
                Toast.makeText(context, "Invalid image data for sharing", Toast.LENGTH_SHORT).show();
                return;
            }

            String finalName = filename;
            if (finalName == null || finalName.trim().isEmpty()) {
                finalName = "Phoenix_QR_Share.png";
            }
            if (!finalName.toLowerCase().endsWith(".png")) {
                finalName += ".png";
            }

            File cacheDir = new File(context.getCacheDir(), "shared_images");
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }
            File shareFile = new File(cacheDir, finalName);
            FileOutputStream fos = new FileOutputStream(shareFile);
            fos.write(imageBytes);
            fos.flush();
            fos.close();

            String authority = context.getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(context, authority, shareFile);

            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("image/png");
            intent.putExtra(Intent.EXTRA_STREAM, contentUri);
            if (text != null && !text.trim().isEmpty()) {
                intent.putExtra(Intent.EXTRA_TEXT, text);
            }
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Intent chooser = Intent.createChooser(intent, "Share Payment QR via");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(chooser);
        }

        private byte[] decodeBase64(String base64Data) {
            if (base64Data == null) return null;
            String clean = base64Data;
            if (clean.contains(",")) {
                clean = clean.substring(clean.indexOf(",") + 1);
            }
            return Base64.decode(clean.trim(), Base64.DEFAULT);
        }
    }
}
`;

fs.writeFileSync(mainActivityPath, mainActivityContent, 'utf8');
console.log('>>> [patch-android] Updated MainActivity.java with PhoenixNativeBridge');

// 3. Update AndroidManifest.xml with FileProvider & Permissions
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

  // Add storage permissions if missing
  const permissionsToAdd = [];
  if (!manifest.includes('android.permission.READ_EXTERNAL_STORAGE')) {
    permissionsToAdd.push('    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />');
  }
  if (!manifest.includes('android.permission.WRITE_EXTERNAL_STORAGE')) {
    permissionsToAdd.push('    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />');
  }

  if (permissionsToAdd.length > 0 && manifest.includes('<application')) {
    manifest = manifest.replace('<application', permissionsToAdd.join('\n') + '\n    <application');
    console.log('>>> [patch-android] Added external storage permissions to AndroidManifest.xml');
  }

  // Add FileProvider inside <application> if not already present
  if (!manifest.includes('androidx.core.content.FileProvider') && manifest.includes('</application>')) {
    const fileProviderSnippet = `        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>`;
    manifest = manifest.replace('</application>', fileProviderSnippet);
    console.log('>>> [patch-android] Added FileProvider to AndroidManifest.xml');
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8');
}

console.log('>>> [patch-android] Android enhancements completed successfully!');
