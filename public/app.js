const {
  createApp,
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onUnmounted,
  Teleport,
} = Vue;

// ==================== CONFIG ====================
const COLLECTIONS = {
  transactions: "transactions",
  profiles: "profiles",
};

const CARD_THEMES = {
  matcha: {
    name: "抹茶",
    bg: "bg-emerald-500",
    text: "text-emerald-600",
    accent: "bg-emerald-50",
  },
  sakura: {
    name: "櫻花",
    bg: "bg-pink-400",
    text: "text-pink-500",
    accent: "bg-pink-50",
  },
  red: {
    name: "紅豆",
    bg: "bg-rose-500",
    text: "text-rose-600",
    accent: "bg-rose-50",
  },
  ocean: {
    name: "海洋",
    bg: "bg-blue-500",
    text: "text-blue-600",
    accent: "bg-blue-50",
  },
  ink: {
    name: "墨染",
    bg: "bg-slate-700",
    text: "text-slate-700",
    accent: "bg-slate-50",
  },
  gold: {
    name: "金箔",
    bg: "bg-amber-500",
    text: "text-amber-600",
    accent: "bg-amber-50",
  },
  default: {
    name: "預設",
    bg: "bg-stone-400",
    text: "text-stone-500",
    accent: "bg-stone-50",
  },
};

// ==================== UTILS ====================
function formatDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

// Helper: Convert to Base64 (fallback)
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== COMPONENTS ====================
const StampView = {
  template: "#stamp-view-template",
  props: ["searchName", "childrenList", "transactions", "stampAnimation"],
  emits: ["update:searchName", "update:stampAnimation", "add-transaction"],
  setup(props, { emit }) {
    const getTheme = (key) => CARD_THEMES[key] || CARD_THEMES.default;

    const currentChild = computed(() =>
      props.childrenList.find((c) => c.name === props.searchName),
    );

    const currentTheme = computed(() => getTheme(currentChild.value?.theme));
    const currentBgUrl = computed(() => currentChild.value?.bgUrl || "");
    const currentStamp = computed(() => currentChild.value?.stamp || "");

    const stats = computed(() => {
      // Optimize: Limit transaction processing to current user only
      const userTrans = props.transactions.filter(
        (t) => t.name === props.searchName,
      );
      const total = userTrans.reduce(
        (sum, t) => sum + (parseInt(t.points) || 0),
        0,
      );
      return {
        total,
        rewards: Math.floor(Math.max(0, total) / 10),
        currentCard: Math.max(0, total) % 10,
      };
    });

    const isCardVisible = computed(
      () => props.searchName && currentChild.value,
    );

    const checkAdminPassword = () => {
      // In real app, consider safer auth
      if (localStorage.getItem("admin-verified") === "true") return true;
      const password = prompt("請輸入管理員密碼：");
      if (password === "admin") {
        localStorage.setItem("admin-verified", "true");
        return true;
      }
      alert("密碼錯誤");
      return false;
    };

    const handleStamp = () => {
      if (props.stampAnimation !== null) return;
      if (!checkAdminPassword()) return;

      emit("update:stampAnimation", "stamping");
      // Optimistic update handled by parent or just wait for animation
      setTimeout(() => {
        emit("add-transaction", props.searchName);
        emit("update:stampAnimation", "done");
        setTimeout(() => emit("update:stampAnimation", null), 1000);
      }, 300);
    };

    return {
      getTheme,
      currentTheme,
      currentBgUrl,
      currentStamp,
      stats,
      isCardVisible,
      handleStamp,
      CARD_THEMES,
    };
  },
};

const SummaryView = {
  template: "#summary-view-template",
  props: ["transactions", "childrenList", "isLoading"],
  emits: ["select-user", "redeem", "edit-profile", "add-new-profile"],
  setup(props) {
    const getTheme = (key) => CARD_THEMES[key] || CARD_THEMES.default;

    const summary = computed(() => {
      const pointsMap = {};
      // Single pass calculation
      for (const t of props.transactions) {
        if (!t.name) continue;
        pointsMap[t.name] =
          (pointsMap[t.name] || 0) + (parseInt(t.points) || 0);
      }

      return props.childrenList
        .map((child) => ({
          id: child.id,
          name: child.name,
          total: pointsMap[child.name] || 0,
          theme: getTheme(child.theme),
          bgUrl: child.bgUrl || "",
        }))
        .sort((a, b) => b.total - a.total);
    });

    return { summary, getTheme };
  },
};

const RedeemModal = {
  template: "#redeem-modal-template",
  props: ["visible", "name", "currentPoints"],
  emits: ["close", "confirm"],
  setup(props, { emit }) {
    const redeemCount = ref(10);

    watch(
      () => props.visible,
      (val) => {
        if (val) redeemCount.value = Math.min(10, props.currentPoints);
      },
    );

    const close = () => emit("close");
    const confirm = () => {
      if (redeemCount.value > props.currentPoints) {
        return alert(`點數不足 (擁有 ${props.currentPoints})`);
      }
      if (redeemCount.value < 1) return alert("數值錯誤");
      emit("confirm", redeemCount.value);
    };

    return {
      redeemCount,
      close,
      confirm,
      increaseCount: () => {
        if (redeemCount.value < props.currentPoints) redeemCount.value++;
      },
      decreaseCount: () => {
        if (redeemCount.value > 1) redeemCount.value--;
      },
    };
  },
  components: { Teleport },
};

const EditProfileModal = {
  template: "#edit-profile-modal-template",
  props: ["visible", "profileName", "childrenList"],
  emits: ["close", "save"],
  setup(props, { emit }) {
    const formState = reactive({
      name: "",
      theme: "matcha",
      bgUrl: "",
      stamp: "",
      id: null,
    });

    const isNewProfile = computed(() => !props.profileName);
    const previewTheme = computed(
      () => CARD_THEMES[formState.theme] || CARD_THEMES.default,
    );

    watch(
      () => props.visible,
      (val) => {
        if (val) {
          const child = props.childrenList.find(
            (c) => c.name === props.profileName,
          );
          if (child) {
            formState.id = child.id;
            formState.name = child.name;
            formState.theme = child.theme || "matcha";
            formState.bgUrl = child.bgUrl || "";
            formState.stamp = child.stamp || "";
          } else {
            Object.assign(formState, {
              id: null,
              name: "",
              theme: "matcha",
              bgUrl: "",
              stamp: "",
            });
          }
        }
      },
    );

    const uploadingBg = ref(false);
    const uploadingStamp = ref(false);
    const bgFileInput = ref(null);
    const stampFileInput = ref(null);

    const handleUpload = async (file, type) => {
      if (!file || !file.type.startsWith("image/")) return alert("請選擇圖片");
      // Firestore document limit is 1MB. Base64 increases size by ~33%.
      // Limit to 700KB to be safe.
      const maxSize = 0.7;
      if (file.size > maxSize * 1024 * 1024)
        return alert(
          `圖片過大 (上限 ${maxSize * 1000}KB) 因為已關閉 Storage，圖片需存入資料庫`,
        );

      const field = type === "bg" ? "bgUrl" : "stamp";
      const loading = type === "bg" ? uploadingBg : uploadingStamp;

      loading.value = true;
      try {
        // Convert to Base64
        formState[field] = await convertImageToBase64(file);
      } catch (e) {
        console.error(e);
        alert("上傳失敗: " + e.message);
      } finally {
        loading.value = false;
      }
    };

    // Match template API!
    const handleBgImageUpload = (e) => handleUpload(e.target.files[0], "bg");
    const handleStampImageUpload = (e) =>
      handleUpload(e.target.files[0], "stamp");
    const bgFileInputClick = () =>
      bgFileInput.value && bgFileInput.value.click();
    const stampFileInputClick = () =>
      stampFileInput.value && stampFileInput.value.click();

    const close = () => emit("close");
    const save = () => {
      if (!formState.name.trim()) return alert("請輸入姓名");
      emit("save", { ...formState });
    };

    return {
      formState,
      isNewProfile,
      previewTheme,
      CARD_THEMES,
      uploadingBg,
      uploadingStamp,
      bgFileInput,
      stampFileInput,
      handleBgImageUpload,
      handleStampImageUpload,
      bgFileInputClick,
      stampFileInputClick,
      close,
      save,
    };
  },
  components: { Teleport },
};

const App = {
  template: "#app-template",
  setup() {
    // State
    const activeTab = ref("stamp");
    const searchName = ref("");
    const transactions = ref([]);
    const childrenList = ref([]);
    const stampAnimation = ref(null);
    const isLoading = ref(true); // Default true until loaded

    // Modals state
    const redeemModal = reactive({
      visible: false,
      name: "",
      currentPoints: 0,
    });
    const editProfileModal = reactive({ visible: false, profileName: "" });
    const successModal = reactive({ visible: false, message: "" });

    const tabs = [
      { id: "stamp", label: "集點卡", icon: "stamp" },
      { id: "summary", label: "狀況", icon: "chart-simple" },
    ];

    let unsubTrans = null;
    let unsubProfiles = null;

    // Methods
    const loadData = () => {
      // Real-time listener for profiles
      const { collection, onSnapshot, query, orderBy } = window.firebaseModules;

      isLoading.value = true;

      unsubProfiles = onSnapshot(
        collection(window.db, COLLECTIONS.profiles),
        (snap) => {
          childrenList.value = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          isLoading.value = false; // Initial load done
        },
        (e) => {
          console.error(e);
          isLoading.value = false;
        },
      );

      // Real-time listener for transactions
      const q = query(
        collection(window.db, COLLECTIONS.transactions),
        orderBy("timestamp", "desc"),
      );
      unsubTrans = onSnapshot(q, (snap) => {
        transactions.value = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      });
    };

    // Initialize
    onMounted(() => {
      const saved = localStorage.getItem("last-search-name");
      if (saved) searchName.value = saved;

      if (window.firebaseReady) loadData();
      else window.addEventListener("firebase-ready", loadData, { once: true });
    });

    onUnmounted(() => {
      if (unsubTrans) unsubTrans();
      if (unsubProfiles) unsubProfiles();
    });

    watch(
      searchName,
      (val) => val && localStorage.setItem("last-search-name", val),
    );

    // Helper: Generate next numeric ID
    const getNextId = (list) => {
      let maxId = 0;
      list.forEach((item) => {
        // 嘗試將 ID 轉為數字，忽略非數字的亂碼 ID
        const idNum = parseInt(item.id, 10);
        if (!isNaN(idNum) && idNum > maxId) {
          maxId = idNum;
        }
      });
      return String(maxId + 1);
    };

    // Actions
    const addTransactionHandler = async (name) => {
      // Add doc - UI updates automatically via snapshot
      // 改用 setDoc 指定 ID，而不是 addDoc 自動生成
      try {
        const { setDoc, doc } = window.firebaseModules;

        const nextId = getNextId(transactions.value);
        console.log("Adding transaction with ID:", nextId);

        await setDoc(doc(window.db, COLLECTIONS.transactions, nextId), {
          name,
          points: 1,
          type: "add",
          timestamp: formatDate(new Date()),
          createdAt: new Date(),
        });
      } catch (e) {
        console.error("Add transaction failed:", e);
        alert("集點失敗: " + e.message);
      }
    };

    const confirmRedeem = async (count) => {
      // Admin check
      const saved = localStorage.getItem("admin-verified");
      if (saved !== "true") {
        if (prompt("管理員密碼") !== "admin") return alert("密碼錯誤");
        localStorage.setItem("admin-verified", "true");
      }

      try {
        const { setDoc, doc } = window.firebaseModules;

        const nextId = getNextId(transactions.value);

        await setDoc(doc(window.db, COLLECTIONS.transactions, nextId), {
          name: redeemModal.name,
          points: -count, // Redeem subtracts
          type: "redeem",
          timestamp: formatDate(new Date()),
          createdAt: new Date(),
        });

        closeRedeemModal();
        showSuccessModal(`成功兌換 ${count} 點`);
      } catch (e) {
        alert("失敗: " + e.message);
      }
    };

    const saveProfileHandler = async (profileData) => {
      try {
        const { doc, updateDoc, setDoc } = window.firebaseModules;
        // profileData from modal has ID for edits
        if (profileData.id) {
          const docRef = doc(window.db, COLLECTIONS.profiles, profileData.id);
          await updateDoc(docRef, {
            bgUrl: profileData.bgUrl || "",
            theme: profileData.theme || "matcha",
            stamp: profileData.stamp || "",
            updatedAt: new Date(),
            name: profileData.name, // Allow renaming? Yes from original code logic.
          });
        } else {
          // New Profile with numeric ID
          const nextId = getNextId(childrenList.value);
          await setDoc(doc(window.db, COLLECTIONS.profiles, nextId), {
            name: profileData.name,
            bgUrl: profileData.bgUrl || "",
            theme: profileData.theme || "matcha",
            stamp: profileData.stamp || "",
            createdAt: new Date(),
          });
        }
        closeEditProfileModal();
        showSuccessModal("儲存成功");
      } catch (e) {
        alert("儲存失敗: " + e.message);
      }
    };

    // Modal helpers
    const showRedeemModal = (name, pts) => {
      redeemModal.name = name;
      redeemModal.currentPoints = pts;
      redeemModal.visible = true;
    };
    const closeRedeemModal = () => (redeemModal.visible = false);
    const showEditProfileModal = (name) => {
      editProfileModal.profileName = name;
      editProfileModal.visible = true;
    };
    const showAddProfileModal = () => {
      editProfileModal.profileName = "";
      editProfileModal.visible = true;
    };
    const closeEditProfileModal = () => (editProfileModal.visible = false);

    const showSuccessModal = (msg) => {
      successModal.message = msg;
      successModal.visible = true;
      setTimeout(() => (successModal.visible = false), 1500);
    };

    return {
      activeTab,
      searchName,
      transactions,
      childrenList,
      stampAnimation,
      isLoading,
      redeemModal,
      editProfileModal,
      successModal,
      tabs,
      // Actions
      addTransaction: addTransactionHandler,
      selectUser: (name) => {
        searchName.value = name;
        activeTab.value = "stamp";
      },
      switchTab: (id) => (activeTab.value = id),
      // Modal Ops
      showRedeemModal,
      closeRedeemModal,
      confirmRedeem,
      showEditProfileModal,
      showAddProfileModal,
      closeEditProfileModal,
      saveProfile: saveProfileHandler,
      showSuccessModal,
    };
  },
  components: { StampView, SummaryView, RedeemModal, EditProfileModal },
};

createApp(App).mount("#app");
