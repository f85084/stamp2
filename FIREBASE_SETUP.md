# Firebase 設定說明

## 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」
3. 輸入專案名稱（例如：stamp-app）
4. 完成專案建立流程

## 2. 建立 Firestore 資料庫

1. 在 Firebase Console 左側選單選擇「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇「以測試模式啟動」（開發階段）或「以正式版模式啟動」
4. 選擇資料庫位置（建議選擇 asia-east1）

## 3. 建立 Collections

建立以下兩個 collection：

### `profiles` Collection

- 欄位：
  - `name` (string): 名稱
  - `bgUrl` (string): 背景圖片網址
  - `theme` (string): 主題顏色（matcha, sakura, red, ocean, ink, gold）
  - `stamp` (string): 自訂印章（Emoji 或圖片網址）
  - `createdAt` (timestamp): 建立時間

### `transactions` Collection

- 欄位：
  - `name` (string): 名稱
  - `points` (number): 點數（正數為加點，負數為扣點）
  - `type` (string): 類型（add 或 redeem）
  - `timestamp` (string): 時間戳記
  - `createdAt` (timestamp): 建立時間

## 4. 設定 Firestore 規則（重要！）

在 Firestore Database > 規則，將規則設定為：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允許讀取所有資料
    match /{document=**} {
      allow read: if true;
    }

    // 只允許寫入 profiles 和 transactions
    match /profiles/{profile} {
      allow write: if true;
    }

    match /transactions/{transaction} {
      allow write: if true;
    }
  }
}
```

**注意：** 以上規則僅供開發使用。正式環境應設定更嚴格的驗證規則。

## 5. 取得 Firebase 配置資訊

1. 在 Firebase Console 點擊專案設定（齒輪圖示）
2. 在「您的應用程式」區域，選擇「網頁」（</>）
3. 註冊應用程式
4. 複製 firebaseConfig 物件

## 6. 更新 index.html 配置

複製 `firebase-config.example.js` 為 `firebase-config.js`：

```bash
# Windows PowerShell
copy firebase-config.example.js firebase-config.js

# Mac/Linux
cp firebase-config.example.js firebase-config.js
```

然後打開 `firebase-config.js`，替換成您的配置：

```javascript
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};
```

**注意**: `firebase-config.js` 已被加入 `.gitignore`，不會被提交到 Git。

## 7. 測試應用程式

1. 在本地開啟 `index.html`
2. 嘗試新增名單
3. 測試集點功能
4. 檢查 Firestore Console 確認資料已儲存

## 8. 部署到 Firebase Hosting（選擇性）

```bash
# 安裝 Firebase CLI
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 初始化 Firebase（如果還沒初始化）
firebase init hosting

# 部署
firebase deploy
```

## 資料遷移

如果您有舊的 Google Sheets 資料需要遷移到 Firestore：

1. 匯出 Google Sheets 為 CSV
2. 使用 Firebase Console 的匯入功能，或
3. 撰寫簡單的 Node.js 腳本將 CSV 資料轉換並寫入 Firestore

範例腳本可參考：

```javascript
// migrate.js (需要 firebase-admin)
const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("csv-parser");

admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json"),
});

const db = admin.firestore();

// 讀取 CSV 並寫入 Firestore
fs.createReadStream("data.csv")
  .pipe(csv())
  .on("data", async (row) => {
    await db.collection("transactions").add({
      name: row.name,
      points: parseInt(row.points),
      type: row.type,
      timestamp: row.timestamp,
      createdAt: new Date(row.timestamp),
    });
  });
```

## 注意事項

1. **安全性**: 目前的規則允許所有人讀寫，建議加入身份驗證
2. **成本**: Firestore 有免費額度，但超過後會收費
3. **索引**: 如果查詢很慢，可能需要在 Firestore 建立索引
4. **備份**: 定期備份您的 Firestore 資料

## 常見問題

**Q: 為什麼資料沒有顯示？**
A: 檢查瀏覽器 Console 是否有錯誤訊息，確認 Firebase 配置是否正確。

**Q: 如何重置密碼？**
A: 管理員密碼預設為 "admin"，儲存在 localStorage 中。清除瀏覽器資料即可重置。

**Q: 可以使用 Firebase Authentication 嗎？**
A: 可以！建議在正式環境整合 Firebase Authentication 提升安全性。
