export const COLLECTIONS = {
  transactions: "transactions",
  profiles: "profiles",
};

export const CARD_THEMES = {
  matcha: {
    name: "抹茶",
    bg: "bg-emerald-500",
    text: "text-emerald-600",
  },
  sakura: { name: "櫻花", bg: "bg-pink-400", text: "text-pink-500" },
  red: { name: "紅豆", bg: "bg-rose-500", text: "text-rose-600" },
  ocean: { name: "海洋", bg: "bg-blue-500", text: "text-blue-600" },
  ink: { name: "墨染", bg: "bg-slate-700", text: "text-slate-700" },
  gold: { name: "金箔", bg: "bg-amber-500", text: "text-amber-600" },
  default: { name: "預設", bg: "bg-stone-400", text: "text-stone-500" },
};

export function formatDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function getTheme(key) {
  return CARD_THEMES[key] || CARD_THEMES.default;
}

export function ensureAdminVerified(promptText = "請輸入管理員密碼：") {
  if (localStorage.getItem("admin-verified") === "true") {
    return true;
  }

  const password = prompt(promptText);
  if (password === "admin") {
    localStorage.setItem("admin-verified", "true");
    return true;
  }

  alert("密碼錯誤");
  return false;
}

export function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function onFirebaseReady(callback) {
  if (window.firebaseReady) {
    callback();
    return;
  }

  window.addEventListener("firebase-ready", callback, { once: true });
}
