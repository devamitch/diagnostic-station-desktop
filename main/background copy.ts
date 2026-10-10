// electron/background.ts - SIMPLIFIED APPLE SIGN-IN VERSION
import "dotenv/config";
import {
  app,
  BrowserWindow,
  ipcMain,
  net,
  Notification,
  powerMonitor,
  screen,
  ShareMenu,
  shell,
} from "electron";
import log from "electron-log";
import serve from "electron-serve";
import { autoUpdater } from "electron-updater";
import fs from "fs/promises";
import path from "path";
import { EyeTrackingMetrics } from "../renderer/src/store/slices/eye-tracking.slice";
import { initDatabase } from "./db/database";
import { eyeTrackingQueries, TimeFilterQueryDto } from "./db/eyeMetrics";
import { createWindow } from "./helpers";
import {
  authStore,
  notificationSettingsStore,
  userStore,
} from "./helpers/user-store";

import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

if (process.env.NODE_ENV === "production") {
  const prodEnvPath = path.join(process.resourcesPath, ".env");
  console.log("🔍 Loading production env from:", prodEnvPath);
  dotenv.config({ path: prodEnvPath });
} else {
  const prodEnv = path.join(process.resourcesPath, ".env");
  dotenv.config({ path: prodEnv });
}

const isProd = process.env.NODE_ENV === "production";
let pipWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow;
let currentSessionId: number | null = null;
const user_id = userStore.get("userId", "");

let isSyncing = false;

const CONFIG = {
  AUTO_UPDATE: true,
  SECURITY: true,
  PERFORMANCE_MONITORING: false,
  ADVANCED_NOTIFICATIONS: false,
  POWER_MANAGEMENT: false,
  THEME_SUPPORT: false,
  GLOBAL_SHORTCUTS: false,
  FILE_WATCHER: false,
  NETWORK_MONITORING: false,
} as const;

const defaultLocale = "en";
const currentLocale = app.getLocale();
const supportedLocales = ["en", "ja", "ko"];

// OAuth state storage
const oauthState = new Map<
  string,
  {
    verifier: string;
    timestamp: number;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }
>();

let authWindow: BrowserWindow | null = null;

// ======================================
// DEEP LINKING SETUP - SIMPLIFIED
// ======================================
const DEEP_LINK_PROTOCOL = "com.devamitch.olodesktop";

function setupDeepLinking() {
  console.log("🔗 Setting up deep linking...");

  // Register protocol
  if (process.platform === "darwin") {
    app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
    console.log(`✅ Registered protocol: ${DEEP_LINK_PROTOCOL}`);
  }
  if (process.platform === "win32") {
    app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
    console.log(`✅ Registered protocol: ${DEEP_LINK_PROTOCOL}`);
  }

  // Handle deep link on macOS
  app.on("open-url", (event, url) => {
    event.preventDefault();
    console.log("🔗 Deep link received:", url);
    handleDeepLink(url);
  });

  // Handle deep link on Windows
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("second-instance", (event, commandLine) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
      const deepLink = commandLine.find((arg) =>
        arg.startsWith(`${DEEP_LINK_PROTOCOL}://`)
      );
      if (deepLink) {
        console.log("🔗 Deep link from second instance:", deepLink);
        handleDeepLink(deepLink);
      }
    });
  }
}

// ======================================
// HANDLE DEEP LINK - SIMPLIFIED
// ======================================
function handleDeepLink(urlString: string) {
  try {
    console.log("📥 Processing deep link:", urlString);
    const parsedUrl = new URL(urlString);

    if (parsedUrl.host === "auth" && parsedUrl.pathname === "/apple/callback") {
      const code = parsedUrl.searchParams.get("code");
      const state = parsedUrl.searchParams.get("state");
      const id_token = parsedUrl.searchParams.get("id_token");
      const error = parsedUrl.searchParams.get("error");

      /**
       * userData: {
        name: string;
        role: UserRole;
        email: string;
        id: string;
        profilePhoto: string | undefined;
        token: string;
      }
       * */
      const profilePhoto = parsedUrl.searchParams.get("profilePhoto");
      const name = parsedUrl.searchParams.get("name");
      const role = parsedUrl.searchParams.get("role");
      const token = parsedUrl.searchParams.get("token");
      const email = parsedUrl.searchParams.get("email");
      const id = parsedUrl.searchParams.get("id");

      console.log("📦 Received:", {
        code: !!code,
        state,
        id_token: !!id_token,
        error,
        profilePhoto,
        name,
        role,
        token,
        email,
        id,
      });

      if (error) {
        console.error("❌ Apple OAuth error:", error);
        const storedData = oauthState.get(state || "");
        if (storedData) {
          storedData.reject(new Error(`Authorization failed: ${error}`));
          oauthState.delete(state || "");
        }
        return;
      }

      if (state) {
        const storedData = oauthState.get(state);
        if (storedData) {
          // ✅ If we have id_token directly, use it!
          if (id_token) {
            console.log("✅ Got id_token directly from Apple!");
            try {
              const user2 = decodeIdToken(id_token);
              const user = {
                ...user2,
                profilePhoto,
                name,
                role,
                token,
                email,
                id,
              };

              console.log("✅ User decoded:", user.email);

              oauthState.delete(state);
              const stortableData = {
                user,
                tokens: { id_token, access_token: null, refresh_token: null },
              };
              storedData.resolve(stortableData);
            } catch (err) {
              console.error("❌ Failed to decode id_token:", err);
              storedData.reject(err);
              oauthState.delete(state);
            }
          }
          // Otherwise exchange code for tokens
          else if (code) {
            console.log("🔄 Exchanging code for tokens...");
            handleAppleOAuthCallback(code, state);
          } else {
            console.error("❌ Missing both code and id_token");
            storedData.reject(new Error("Missing authentication data"));
            oauthState.delete(state);
          }
        } else {
          console.error("❌ No stored data for state:", state);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error processing deep link:", error);
  }
}

// ======================================
// HANDLE OAUTH CALLBACK - SIMPLIFIED
// ======================================
async function handleAppleOAuthCallback(code: string, state: string) {
  console.log("📥 Processing OAuth callback...");

  const storedData = oauthState.get(state);
  if (!storedData) {
    console.error("❌ No stored data for state:", state);
    return;
  }

  try {
    const redirectUri =
      "https://dev-eye-scan-api.AuraCoremedical.com/auth/apple-login-test-html";
    // const redirectUri =
    //   process.env.APPLE_REDIRECT_URI ||
    //   "https://dev-eye-scan-api.AuraCoremedical.com/auth/apple-callback";

    const tokens = await exchangeCodeForTokens(
      code,
      storedData.verifier,
      redirectUri
    );

    console.log("✅ Token exchange successful");
    const user = decodeIdToken(tokens.id_token);
    console.log("✅ User decoded:", user.email);

    oauthState.delete(state);
    storedData.resolve({ user, tokens });
  } catch (error) {
    console.error("❌ Error:", error);
    storedData.reject(error);
    oauthState.delete(state);
  }
}

// ======================================
// GENERATE PKCE - SIMPLIFIED
// ======================================
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  console.log("✅ PKCE generated");
  return { verifier, challenge };
}

// ======================================
// GENERATE CLIENT SECRET - SIMPLIFIED
// ======================================
function generateClientSecret(
  teamId: string,
  clientId: string,
  keyId: string,
  privateKey: string
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 15777000,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  return jwt.sign(payload, privateKey, {
    algorithm: "ES256",
    keyid: keyId,
  });
}

// ======================================
// EXCHANGE CODE FOR TOKENS - SIMPLIFIED
// ======================================
async function exchangeCodeForTokens(
  code: string,
  verifier: string,
  redirectUri: string
): Promise<any> {
  console.log("🔄 Exchanging code for tokens...");

  const clientId = process.env.APPLE_CLIENT_ID || "com.devamitch.olodesktop";
  const teamId = process.env.APPLE_TEAM_ID || "J885D3G52A";
  const keyId = process.env.APPLE_KEY_ID || "";
  const privateKey = process.env.APPLE_PRIVATE_KEY || "";

  const clientSecret = generateClientSecret(
    teamId,
    clientId,
    keyId,
    privateKey
  );

  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }).toString(),
  });

  const responseText = await response.text();
  console.log("📤 Apple response:", response.status);

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${responseText}`);
  }

  return JSON.parse(responseText);
}

// ======================================
// DECODE ID TOKEN - SIMPLIFIED
// ======================================
function decodeIdToken(idToken: string) {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format");
  }

  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

  return {
    id: payload.sub,
    email: payload.email,
    emailVerified:
      payload.email_verified === true || payload.email_verified === "true",
    isPrivateEmail:
      payload.is_private_email === true || payload.is_private_email === "true",
    name: payload.name,
  };
}

// ======================================
// MAIN APPLE SIGN-IN HANDLER - SIMPLIFIED
// ======================================
export async function handleAppleSignIn(): Promise<
  Partial<{
    user?: {
      profilePhoto?: string;
      name?: string;
      role?: string;
      token?: string;
      email?: string;
      id?: string;
      emailVerified?: boolean;
      isPrivateEmail?: boolean;
    };
    tokens: {
      id_token: string;
      access_token?: any;
      refresh_token?: any;
    };
  }>
> {
  console.log("========================================");
  console.log("🍎 STARTING APPLE SIGN-IN");
  console.log("========================================");

  return new Promise(async (resolve, reject) => {
    try {
      const { verifier, challenge } = generatePKCE();
      const state = crypto.randomBytes(16).toString("hex");

      const redirectUri =
        process.env.APPLE_REDIRECT_URI ||
        "https://dev-eye-scan-api.AuraCoremedical.com/auth/apple-callback";

      console.log("📍 Redirect URI:", redirectUri);

      // Store state
      oauthState.set(state, {
        verifier,
        timestamp: Date.now(),
        resolve,
        reject,
      });
      console.log("✅ State stored:", state);

      // Build URL
      const clientId = process.env.APPLE_CLIENT_ID || "com.devamitch.olodesktop";
      const authUrl = new URL("https://appleid.apple.com/auth/authorize");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code id_token");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("scope", "name email");
      authUrl.searchParams.set("response_mode", "form_post");
      authUrl.searchParams.set("code_challenge", challenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      console.log("🌐 Opening browser...");

      // Open in system browser
      await shell.openExternal(authUrl.toString());

      console.log("✅ Browser opened, waiting for callback...");

      // Clean up old states
      setTimeout(() => {
        for (const [key, value] of oauthState.entries()) {
          if (Date.now() - value.timestamp > 600000) {
            console.log("🧹 Cleaning up old state:", key);
            oauthState.delete(key);
          }
        }
      }, 1000);
    } catch (error) {
      console.error("❌ Setup error:", error);
      reject(error);
    }
  });
}

function getLocale(): string {
  const loc = userStore?.get("locale", currentLocale);
  if (supportedLocales.includes(currentLocale)) {
    return currentLocale;
  } else if (supportedLocales.includes(loc)) {
    userStore?.set("locale", defaultLocale);
    return loc;
  }
  return defaultLocale;
}

function navigateToRoute(route: string) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.error("[Navigation] Main window not available");
    return;
  }
  console.log(`[Navigation] 📨 Sending IPC navigation event: ${route}`);
  mainWindow.webContents.send("navigate-to", route);
}

log.transports.file.level = "info";
log.transports.console.level = "info";
log.transports.file.maxSize = 10 * 1024 * 1024;
autoUpdater.logger = log;

app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

if (isProd) {
  serve({
    directory: "app",
    scheme: "app",
  });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

interface PiPPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

function savePiPPosition() {
  if (pipWindow && !pipWindow.isDestroyed()) {
    const bounds = pipWindow.getBounds();
    userStore?.set("pipPosition", {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  }
}

function getDefaultPiPPosition(width: number, height: number): PiPPosition {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;
  return {
    x: screenWidth - width - 20,
    y: screenHeight - height - 20,
    width,
    height,
  };
}

function registerNotificationSettingsHandlers() {
  ipcMain.handle("notification-settings-get", () => {
    return notificationSettingsStore.getSettings();
  });

  ipcMain.handle("notification-settings-set", (_event, settings) => {
    notificationSettingsStore.setSettings(settings);
    console.log("[NotificationSettings] ✅ Settings updated:", settings);
    return { success: true };
  });

  ipcMain.handle("notification-settings-update", (_event, key, value) => {
    notificationSettingsStore.updateSetting(key, value);
    console.log(`[NotificationSettings] ✅ Updated ${key} to ${value}`);
    return { success: true };
  });
}

function getPiPPosition(width: number, height: number): PiPPosition {
  const savedPosition = userStore?.get("pipPosition") as
    | PiPPosition
    | undefined;

  if (savedPosition) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } =
      primaryDisplay.workAreaSize;

    if (
      savedPosition.x >= 0 &&
      savedPosition.y >= 0 &&
      savedPosition.x + savedPosition.width <= screenWidth &&
      savedPosition.y + savedPosition.height <= screenHeight
    ) {
      return {
        x: savedPosition.x,
        y: savedPosition.y,
        width: savedPosition.width,
        height: savedPosition.height,
      };
    }
  }
  return getDefaultPiPPosition(width, height);
}

let updateCheckInProgress = false;
let updateDownloadInProgress = false;
let updateCheckAttempts = 0;

function setupAutoUpdater() {
  if (!isProd || !CONFIG.AUTO_UPDATE) {
    log.info("[AutoUpdater] ❌ Disabled in development mode");
    console.log("[AutoUpdater] ❌ Disabled in development mode");
    return;
  }

  log.info("========================================");
  log.info("[AutoUpdater] 🚀 INITIALIZING AUTO-UPDATER");
  log.info("========================================");
  console.log("========================================");
  console.log("[AutoUpdater] 🚀 INITIALIZING AUTO-UPDATER");
  console.log("========================================");

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.autoRunAppAfterInstall = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.fullChangelog = true;
  // autoUpdater.forceDevUpdateConfig = true; // Force update even in dev mode
  // (autoUpdater as any).allowVersionMismatch = true; // Force update even in dev mode
  autoUpdater.checkForUpdatesAndNotify();

  log.info("[AutoUpdater] Current Version:", app.getVersion());
  log.info("[AutoUpdater] Platform:", process.platform);
  log.info("[AutoUpdater] Arch:", process.arch);
  log.info("[AutoUpdater] 🔥 Differential download DISABLED ✅");

  console.log("[AutoUpdater] Current Version:", app.getVersion());
  console.log("[AutoUpdater] Platform:", process.platform);
  console.log("[AutoUpdater] Arch:", process.arch);
  console.log("[AutoUpdater] 🔥 Differential download DISABLED ✅");

  log.info("========================================");
  console.log("========================================");

  try {
    const token =
      process.env.GH_TOKEN || "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";

    autoUpdater.setFeedURL({
      provider: "github",
      owner: "AuraCore-Medical-Technologies-Inc",
      repo: "project-olo-nextron",
      private: true,
      token: token,
    });

    log.info("[AutoUpdater] ✅ Feed URL configured successfully");
    console.log("[AutoUpdater] ✅ Feed URL configured successfully");
  } catch (err) {
    log.error("[AutoUpdater] ❌ Failed to configure feed URL:", err);
    console.error("[AutoUpdater] ❌ Failed to configure feed URL:", err);
    return;
  }

  setTimeout(() => {
    log.info("[AutoUpdater] 🔍 STARTUP UPDATE CHECK (5s after launch)...");
    console.log("[AutoUpdater] 🔍 STARTUP UPDATE CHECK (5s after launch)...");
    performUpdateCheck("startup");
  }, 5000);

  const CHECK_INTERVAL = 15 * 60 * 1000;
  // const CHECK_INTERVAL =  * 60 * 60 * 1000;

  setInterval(() => {
    if (!updateCheckInProgress && !updateDownloadInProgress) {
      log.info("[AutoUpdater] 🔄 PERIODIC UPDATE CHECK (6h interval)...");
      console.log("[AutoUpdater] 🔄 PERIODIC UPDATE CHECK (6h interval)...");
      performUpdateCheck("periodic-6h");
    }
  }, CHECK_INTERVAL);

  autoUpdater.on("checking-for-update", () => {
    updateCheckInProgress = true;
    updateCheckAttempts++;
    sendUpdateStatus({
      type: "checking",
      message: "Checking for updates...",
      attempt: updateCheckAttempts,
    });
  });

  autoUpdater.on("update-available", (info) => {
    updateDownloadInProgress = true;
    sendUpdateStatus({
      type: "available",
      message: `New version ${info.version} available - downloading...`,
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
        currentVersion: app.getVersion(),
      },
    });

    if (Notification.isSupported()) {
      const notification = new Notification({
        title: "✨ New Update Available",
        body: `Version ${info.version} is downloading...`,
        silent: false,
      });
      notification.show();
    }
  });

  autoUpdater.on("update-not-available", (info) => {
    updateCheckInProgress = false;
    sendUpdateStatus({
      type: "not-available",
      message: "You're running the latest version",
      info: {
        version: info.version,
      },
    });
  });

  autoUpdater.on("error", (err) => {
    updateCheckInProgress = false;
    updateDownloadInProgress = false;
    sendUpdateStatus({
      type: "error",
      message: "Update check failed",
      error: err.message,
    });

    setTimeout(
      () => {
        if (!updateCheckInProgress && !updateDownloadInProgress) {
          performUpdateCheck("retry-after-error");
        }
      },
      30 * 60 * 1000
    );
  });

  autoUpdater.on("download-progress", (progressObj) => {
    const percent = Math.round(progressObj.percent);
    sendUpdateStatus({
      type: "downloading",
      message: `Downloading: ${percent}%`,
      progress: {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond,
      },
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    updateCheckInProgress = false;
    updateDownloadInProgress = false;
    sendUpdateStatus({
      type: "downloaded",
      message: `Version ${info.version} ready to install`,
      info: {
        version: info.version,
      },
    });

    if (Notification.isSupported()) {
      const notification = new Notification({
        title: "🎉 Update Ready!",
        body: `Click to install version ${info.version}`,
        silent: false,
      });

      notification.on("click", () => {
        autoUpdater.quitAndInstall(true, true);
      });

      notification.show();
    }

    setTimeout(() => {
      if (Notification.isSupported()) {
        new Notification({
          title: "⚠️ Installing Update",
          body: "App will restart in 5 seconds...",
        }).show();
      }

      setTimeout(() => {
        autoUpdater.quitAndInstall(true, true);
      }, 3000);
    }, 20000);
  });
}

function performUpdateCheck(source: string) {
  if (updateCheckInProgress || updateDownloadInProgress) {
    return;
  }

  autoUpdater
    .checkForUpdates()
    .then((result) => {
      if (result) {
        console.log(`[AutoUpdater] ✅ ${source} check completed successfully`);
      }
    })
    .catch((err) => {
      console.error(`[AutoUpdater] ❌ ${source} check failed:`, err);
    });
}

function sendUpdateStatus(status: any) {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-status", status);
    }
  } catch (err) {
    console.error("[AutoUpdater] ❌ Failed to send update status:", err);
  }
}

function registerAuthHandlers() {
  ipcMain.handle("auth-set-authenticated", (_event, isAuth: boolean) => {
    authStore.setAuthenticated(isAuth);
  });

  ipcMain.handle("auth-get-authenticated", () => {
    return authStore.getAuthenticated();
  });

  ipcMain.handle("auth-set-user-data", (_event, userData) => {
    authStore.setUserData(userData);
    console.log("[Auth] ✅ User data set");
  });

  ipcMain.handle("auth-clear-user-data", async () => {
    const session_id = authStore?.getSessionId();
    authStore.clearUserData();
    authStore.setSessionId(null);
    console.log("[Auth] ✅ User data cleared");
    navigateToRoute("/signin");
  });

  ipcMain.handle("auth-get-user-data", () => {
    return authStore.getUserData();
  });

  ipcMain.handle("auth-logout", () => {
    authStore.clearUserData();
    console.log("[Auth] ✅ User logged out");
    return { success: true };
  });

  ipcMain.handle("auth-set-sessionId", (_event, sessionId: number) => {
    authStore.setSessionId(sessionId);
  });

  ipcMain.handle("auth-get-sessionId", () => {
    return authStore.getSessionId();
  });
}

(async () => {
  await app.whenReady();

  console.log("[App] Electron app is ready");

  setupDeepLinking();
  registerAuthHandlers();
  registerNotificationSettingsHandlers();

  powerMonitor.on("suspend", () => {
    mainWindow?.webContents.send("system-suspend");
  });

  powerMonitor.on("resume", () => {
    mainWindow?.webContents.send("system-resume");
    if (isProd && CONFIG.AUTO_UPDATE) {
      setTimeout(() => {
        if (!updateCheckInProgress && !updateDownloadInProgress) {
          performUpdateCheck("system-wake");
        }
      }, 10000);
    }
  });

  powerMonitor.on("lock-screen", () => {
    mainWindow?.webContents.send("system-lock");
  });

  powerMonitor.on("unlock-screen", () => {
    mainWindow?.webContents.send("system-unlock");
  });

  if (process.platform === "win32") {
    app.setAppUserModelId(process.execPath);
  }

  try {
    await initDatabase();
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("[Electron] Failed to initialize database:", error);
  }

  mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  mainWindow.on("close", () => {
    try {
      if (pipWindow && !pipWindow.isDestroyed()) {
        savePiPPosition();
        pipWindow.close();
        pipWindow = null;
      }
    } catch (error) {
      console.error("❌ Error closing PiP window on main close:", error);
      pipWindow = null;
    }
  });

  const locale = getLocale();
  const isAuthenticated = authStore.getAuthenticated();

  console.log("[Electron] Auth status:", isAuthenticated);
  console.log("[Electron] Using locale:", locale);

  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    if (isProd && navigationUrl.startsWith("app://./")) {
      event.preventDefault();
      const urlPath = navigationUrl.replace("app://./", "");
      if (supportedLocales.some((loc) => urlPath.startsWith(loc + "/"))) {
        mainWindow.loadURL(navigationUrl);
        return;
      }
      const localeSpecificUrl = `app://./${locale}/${urlPath}`;
      mainWindow.loadURL(localeSpecificUrl);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isProd && url.startsWith("app://./")) {
      const urlPath = url.replace("app://./", "");
      if (!supportedLocales.some((loc) => urlPath.startsWith(loc + "/"))) {
        const localeSpecificUrl = `app://./${locale}/${urlPath}`;
        mainWindow.loadURL(localeSpecificUrl);
      } else {
        mainWindow.loadURL(url);
      }
    }
    return { action: "deny" };
  });

  if (isProd) {
    try {
      const initialRoute = isAuthenticated ? "/dashboard" : "/signin";
      await mainWindow.loadURL(`app://./${locale}${initialRoute}`);
    } catch (error) {
      try {
        const initialRoute = isAuthenticated ? "/dashboard" : "/signin";
        await mainWindow.loadFile(
          path.join(__dirname, `../app/${locale}${initialRoute}/index.html`)
        );
      } catch (fallbackError) {
        const initialRoute = isAuthenticated ? "/dashboard" : "/signin";
        await mainWindow.loadFile(
          path.join(__dirname, `../app/en${initialRoute}/index.html`)
        );
      }
    }
  } else {
    const port = process.argv[2];
    const initialRoute = isAuthenticated ? "/dashboard" : "/signin";
    await mainWindow.loadURL(
      `http://localhost:${port}${initialRoute}?locale=${locale}`
    );
    mainWindow.webContents.openDevTools();
  }

  setupAutoUpdater();
})();

let isQuitting = false;
app.on("before-quit", (event) => {
  if (isQuitting) return;

  event.preventDefault();

  try {
    if (pipWindow && !pipWindow.isDestroyed()) {
      savePiPPosition();
      pipWindow.close();
      pipWindow = null;
    }
  } catch (error) {
    console.error("❌ Error closing PiP window:", error);
    pipWindow = null;
  }

  isQuitting = true;
  app.exit(0);
});

app.on("window-all-closed", () => {
  try {
    if (pipWindow && !pipWindow.isDestroyed()) {
      savePiPPosition();
      pipWindow.close();
      pipWindow = null;
    }
  } catch (error) {
    console.error("❌ Error closing PiP window:", error);
    pipWindow = null;
  } finally {
    app.quit();
  }
});

// ========== IPC HANDLERS ==========

ipcMain.handle("check-online", async () => {
  return net.isOnline();
});

ipcMain.handle(
  "eye-metrics-create",
  async (event, eyeMetricsData: EyeTrackingMetrics) => {
    try {
      const result = await eyeTrackingQueries.createMetrics(
        eyeMetricsData,
        userStore.get("userId", "")
      );
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle(
  "eye-metrics-report",
  async (event, query: TimeFilterQueryDto) => {
    try {
      const result = await eyeTrackingQueries.findAllTimeRange(
        query,
        userStore.get("userId", "")
      );
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle(
  "unsynced-data",
  async (event, lastId?: number, batchSize: number = 50) => {
    try {
      const result = await eyeTrackingQueries.getUnsyncedMetrics(
        userStore.get("userId", ""),
        lastId,
        batchSize
      );
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle("mark-metrics-synced", async (event, ids: number[]) => {
  try {
    await eyeTrackingQueries.markMetricsSynced(
      ids,
      userStore.get("userId", "")
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle(
  "remote-metrics-sync",
  async (event, data: EyeTrackingMetrics[]) => {
    try {
      await eyeTrackingQueries.remoteMetricSync(
        data,
        userStore.get("userId", "")
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle("install-update", () => {
  if (isProd && CONFIG.AUTO_UPDATE) {
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  }
  return { success: false, message: "Not available" };
});

ipcMain.handle("check-for-updates-manual", async () => {
  if (!isProd || !CONFIG.AUTO_UPDATE) {
    return {
      success: false,
      message: "Auto-update not available in development",
    };
  }

  if (updateCheckInProgress) {
    return {
      success: false,
      message: "Update check already in progress",
    };
  }

  if (updateDownloadInProgress) {
    return {
      success: false,
      message: "Update download already in progress",
    };
  }

  try {
    performUpdateCheck("manual-frontend");
    return {
      success: true,
      message: "Checking for updates...",
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
});

ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("get-locale", () => getLocale());
ipcMain.handle("set-locale", (event, newLocale) => {
  if (supportedLocales.includes(newLocale)) {
    userStore?.set("locale", newLocale);
    return true;
  }
  return false;
});
ipcMain.handle("get-supported-locales", () => supportedLocales);

ipcMain.handle("show-notification", (event, { title, body, actions = [] }) => {
  if (!Notification?.isSupported()) return;

  const notification = new Notification({
    title,
    body,
    silent: false,
    actions: actions.map((action: { text: string }) => ({
      type: "button",
      text: action.text,
    })),
    closeButtonText: "Close",
  });

  notification.show();
  notification.on("click", () => {
    mainWindow.webContents.send("notification-clicked", { title, body });
  });
  notification.on("action", (event, index) => {
    const action = actions[index];
    if (action && action.onClick) {
      mainWindow.webContents.send("notification-action", {
        action: action.text,
        data: { title, body },
      });
    }
  });
});

ipcMain.handle(
  "pip-create-window",
  async (
    event,
    options: {
      width?: number;
      height?: number;
      position?: { x: number; y: number };
    }
  ) => {
    try {
      if (pipWindow && !pipWindow.isDestroyed()) {
        pipWindow.focus();
        return { success: true, windowId: pipWindow.id };
      }

      const width = options.width || 200;
      const height = options.height || 200;
      let position: PiPPosition;
      if (options.position) {
        position = {
          x: options.position.x,
          y: options.position.y,
          width,
          height,
        };
      } else {
        position = getPiPPosition(width, height);
      }

      pipWindow = new BrowserWindow({
        width: position.width,
        height: position.height,
        x: position.x,
        y: position.y,
        frame: false,
        transparent: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: true,
        minimizable: false,
        maximizable: false,
        minWidth: 150,
        minHeight: 150,
        maxWidth: 400,
        maxHeight: 400,
        webPreferences: {
          preload: path.join(__dirname, "preload.js"),
          nodeIntegration: false,
          contextIsolation: true,
          backgroundThrottling: false,
        },
      });

      pipWindow.webContents.session.setPermissionRequestHandler(
        (webContents, permission, callback) => {
          callback(permission === "media");
        }
      );

      pipWindow.on("move", () => savePiPPosition());
      pipWindow.on("resize", () => savePiPPosition());

      if (isProd) {
        await pipWindow.loadFile(path.join(__dirname, "../app/pip.html"));
      } else {
        const port = process.argv[2];
        await pipWindow.loadURL(`http://localhost:${port}/pip.html`);
      }

      pipWindow.on("closed", () => {
        savePiPPosition();
        pipWindow = null;
        mainWindow?.webContents.send("pip-window-closed");
      });

      return {
        success: true,
        windowId: pipWindow.id,
        position: {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle("pip-close-window", async () => {
  try {
    if (pipWindow && !pipWindow.isDestroyed()) {
      savePiPPosition();
      pipWindow.close();
      pipWindow = null;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle(
  "pip-set-position",
  async (event, { x, y }: { x: number; y: number }) => {
    try {
      if (pipWindow && !pipWindow.isDestroyed()) {
        pipWindow.setPosition(x, y);
        savePiPPosition();
        return { success: true };
      }
      return { success: false, error: "PiP window not found" };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
);

ipcMain.handle("share-image", async (event, imageDataUrl: string) => {
  try {
    const tempDir = app.getPath("temp");
    const fileName = `eye-scan-${Date.now()}.png`;
    const tempPath = path.join(tempDir, fileName);

    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    await fs.writeFile(tempPath, buffer);

    if (process.platform === "darwin") {
      try {
        const shareMenu = new ShareMenu({
          filePaths: [tempPath],
          texts: ["Check out my eye health scan results!"],
        });

        shareMenu.popup({
          callback: () => {},
        });

        return { success: true, message: "Share menu opened" };
      } catch (error) {
        return { success: false, error: "Failed to open share menu" };
      }
    }

    if (process.platform === "win32") {
      try {
        const { exec } = require("child_process");
        const { promisify } = require("util");
        const execAsync = promisify(exec);

        const escapedPath = tempPath.replace(/"/g, '\\"');
        await execAsync(
          `powershell -Command "Start-Process -FilePath '${escapedPath}'"`
        );

        return { success: true, message: "Open With dialog opened" };
      } catch (error) {
        try {
          const { execSync } = require("child_process");
          const escapedPath = tempPath.replace(/\\/g, "\\\\");
          execSync(`rundll32.exe shell32.dll,OpenAs_RunDLL ${escapedPath}`);

          return {
            success: true,
            message: "Open With dialog opened via fallback",
          };
        } catch (fallbackError) {
          return {
            success: false,
            error: "Failed to open 'Open With' dialog on Windows",
          };
        }
      }
    }

    if (process.platform === "linux") {
      try {
        const { exec } = require("child_process");
        const { promisify } = require("util");
        const execAsync = promisify(exec);

        await execAsync(`xdg-email --attach "${tempPath}"`);

        return { success: true, message: "Email client opened with image" };
      } catch (error) {
        return { success: false, error: "Sharing not supported on Linux" };
      }
    }

    return { success: false, error: "Platform not supported" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("open-external", async (event, url: string) => {
  try {
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL provided");
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      throw new Error("Only HTTP and HTTPS URLs are allowed");
    }

    await shell.openExternal(url);

    return {
      success: true,
      message: "URL opened successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
});

ipcMain.handle("open-camera-settings", async () => {
  try {
    if (process.platform !== "win32") {
      return {
        success: false,
        error: "Camera settings shortcut only available on Windows",
      };
    }

    const cameraSettingsUrl = "ms-settings:camera";
    await shell.openExternal(cameraSettingsUrl);

    return {
      success: true,
      message: "Camera settings opened successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
});

ipcMain.handle("get-windows-version", async () => {
  try {
    if (process.platform !== "win32") {
      return {
        success: false,
        error: "Not running on Windows",
        isWindows: false,
      };
    }

    const os = require("os");
    const release = os.release();

    const versionParts = release.split(".");
    const isWindows11 =
      parseFloat(release) >= 10.0 && parseInt(versionParts[2]) >= 22000;

    return {
      success: true,
      platform: process.platform,
      release: release,
      version: os.version(),
      isWindows11: isWindows11,
      isWindows: true,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      isWindows: process.platform === "win32",
    };
  }
});

// ✅ SIMPLIFIED APPLE SIGN-IN IPC HANDLER
ipcMain.handle("apple-signin", async () => {
  console.log("📥 Apple Sign-In request from frontend");

  try {
    const result = await handleAppleSignIn();

    console.log("✅ Sign-In successful:", result.user.email);

    // Save to auth store
    authStore.setAuthenticated(true);
    authStore.setUserData({
      userId: result.user.id,
      userEmail: result.user.email,
      token: result.tokens.id_token,
    });

    console.log("✅ User data saved");

    const returnData = {
      success: true,
      user: result.user,
      idToken: result.tokens.id_token,
    };
    return returnData;
  } catch (error: any) {
    console.error("❌ Sign-In error:", error);
    return {
      success: false,
      error: error.message || "Apple Sign-In failed",
    };
  }
});
