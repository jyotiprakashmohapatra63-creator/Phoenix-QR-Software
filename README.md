# Phoenix-QR-Software

Cross-platform Desktop (.EXE) and Android (.APK) app builder for **Phoenix Edit Point Payment Slate**.

---

## ⚡ Live Auto-Update Mechanism:
- This app connects to: **[Phoenix-QR-Update](https://github.com/jyotiprakashmohapatra63-creator/Phoenix-QR-Update)** (GitHub Pages: `https://jyotiprakashmohapatra63-creator.github.io/Phoenix-QR-Update/`).
- Whenever you update the HTML in `Phoenix-QR-Update`, **all installed .EXE and .APK apps automatically update on launch** without needing users to re-download or reinstall!
- If the device is offline, the bundled copy inside `www/` loads seamlessly as an offline fallback.

---

## 📦 How to Download .EXE and .APK:
1. In this repository, click the **Actions** tab.
2. Select the latest workflow run (named **"Build Phoenix QR Apps"**).
3. Scroll down to the **Artifacts** section at the bottom:
   - **`Phoenix-QR-Windows-EXE`**: Download the Windows Installer and Portable `.exe`.
   - **`Phoenix-QR-Android-APK`**: Download the Android `.apk`.

---

## 🎨 How to Add App Icons Later:
- **Windows (.EXE) Icon**:
  Save your icon file as `icon.ico` and place it inside the `build/` folder (`build/icon.ico`).
- **Android (.APK) Icon**:
  Save your 1024x1024 PNG icon as `icon.png` and place it inside the `assets/` folder (`assets/icon.png`).
