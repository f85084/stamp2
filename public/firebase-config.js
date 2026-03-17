// Import the functions you need from the SDKs you need
import { initializeApp } from "./localvendor/firebase/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  getAggregateFromServer,
  sum,
  doc,
  updateDoc,
  setDoc,
} from "./localvendor/firebase/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Firebase initialized successfully!");

// 將 Firebase 實例存到 window 供其他腳本使用
window.firebaseApp = app;
window.db = db;
window.firebaseModules = {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  getAggregateFromServer,
  sum,
  doc,
  updateDoc,
  setDoc,
};
window.firebaseReady = true;

// 發送就緒事件
window.dispatchEvent(new Event("firebase-ready"));
