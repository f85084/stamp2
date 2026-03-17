import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");

const copyTasks = [
  {
    from: "node_modules/@tailwindcss/browser/dist/index.global.js",
    to: "public/localvendor/tailwind/index.global.js",
  },
  {
    from: "node_modules/vue/dist/vue.global.prod.js",
    to: "public/localvendor/vue/vue.global.js",
  },
  {
    from: "node_modules/@fortawesome/fontawesome-free/css/all.min.css",
    to: "public/localvendor/fontawesome/css/all.min.css",
  },
  {
    from: "node_modules/@fortawesome/fontawesome-free/webfonts",
    to: "public/localvendor/fontawesome/webfonts",
    directory: true,
  },
  {
    from: "node_modules/@fontsource/noto-sans-tc/chinese-traditional-400.css",
    to: "public/localvendor/fonts/noto-sans-tc/chinese-traditional-400.css",
  },
  {
    from: "node_modules/@fontsource/noto-sans-tc/chinese-traditional-500.css",
    to: "public/localvendor/fonts/noto-sans-tc/chinese-traditional-500.css",
  },
  {
    from: "node_modules/@fontsource/noto-sans-tc/chinese-traditional-700.css",
    to: "public/localvendor/fonts/noto-sans-tc/chinese-traditional-700.css",
  },
  {
    from: "node_modules/@fontsource/noto-sans-tc/files",
    to: "public/localvendor/fonts/noto-sans-tc/files",
    directory: true,
  },
  {
    from: "node_modules/@fontsource/playfair-display/700.css",
    to: "public/localvendor/fonts/playfair-display/700.css",
  },
  {
    from: "node_modules/@fontsource/playfair-display/files",
    to: "public/localvendor/fonts/playfair-display/files",
    directory: true,
  },
  {
    from: "node_modules/firebase/firebase-app.js",
    to: "public/localvendor/firebase/firebase-app.js",
  },
  {
    from: "node_modules/firebase/firebase-firestore.js",
    to: "public/localvendor/firebase/firebase-firestore.js",
  },
];

const failedTasks = [];

for (const task of copyTasks) {
  const sourcePath = resolve(projectRoot, task.from);
  const targetPath = resolve(projectRoot, task.to);

  try {
    mkdirSync(dirname(targetPath), { recursive: true });
    cpSync(sourcePath, targetPath, {
      recursive: Boolean(task.directory),
      force: true,
    });
  } catch (error) {
    failedTasks.push({ task: task.to, message: error.message });
  }
}

try {
  const firestorePath = resolve(
    projectRoot,
    "public/localvendor/firebase/firebase-firestore.js",
  );
  const firestoreSource = readFileSync(firestorePath, "utf8");
  const patchedFirestoreSource = firestoreSource.replace(
    /https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-app\.js/g,
    "./firebase-app.js",
  );

  if (patchedFirestoreSource !== firestoreSource) {
    writeFileSync(firestorePath, patchedFirestoreSource, "utf8");
  }
} catch (error) {
  failedTasks.push({
    task: "public/localvendor/firebase/firebase-firestore.js",
    message: `post-process failed: ${error.message}`,
  });
}

if (failedTasks.length > 0) {
  console.warn("Vendor sync completed with warnings:");
  failedTasks.forEach((item) => {
    console.warn(`- ${item.task}: ${item.message}`);
  });
} else {
  console.log("Vendor assets synced to public/localvendor.");
}
