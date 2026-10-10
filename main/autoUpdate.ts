// Auto-update implementation for oLo
// Place this in your main process (e.g., app/background.js or main/index.ts)

import { app, BrowserWindow, dialog, ipcMain } from "electron";
import log from "electron-log";
import { autoUpdater } from "electron-updater";

// Configure logging
log.transports.file.level = "info";
autoUpdater.logger = log;

// Configure auto-updater
class AutoUpdateService {
  private mainWindow: BrowserWindow | null = null;
  private isChecking = false;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.configureAutoUpdater();
    this.setupEventListeners();
  }

  private configureAutoUpdater() {
    // Configure update server
    autoUpdater.autoDownload = false; // Don't auto-download, ask user first
    autoUpdater.autoInstallOnAppQuit = true;

    // Set update check interval (check every 4 hours)
    const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

    // Allow downgrades in development
    if (process.env.NODE_ENV === "development") {
      autoUpdater.forceDevUpdateConfig = true;
      autoUpdater.allowDowngrade = true;
    }

    // Configure for different platforms
    if (process.platform === "darwin") {
      // macOS specific settings
      autoUpdater.autoInstallOnAppQuit = true;
    } else if (process.platform === "win32") {
      // Windows specific settings
      autoUpdater.autoInstallOnAppQuit = true;
    } else if (process.platform === "linux") {
      // Linux: auto-updates via AppImage or snap
      // For .deb/.rpm, users should use their package manager
    }
  }

  private setupEventListeners() {
    // When update is available
    autoUpdater.on("update-available", (info) => {
      log.info("Update available:", info);
      this.sendToRenderer("update-available", info);

      // Ask user if they want to download
      this.showUpdateDialog(info);
    });

    // When update is not available
    autoUpdater.on("update-not-available", (info) => {
      log.info("Update not available:", info);
      this.sendToRenderer("update-not-available", info);
    });

    // When update is downloaded
    autoUpdater.on("update-downloaded", (info) => {
      log.info("Update downloaded:", info);
      this.sendToRenderer("update-downloaded", info);

      // Prompt user to restart and install
      this.showRestartDialog(info);
    });

    // Download progress
    autoUpdater.on("download-progress", (progress) => {
      log.info("Download progress:", progress.percent);
      this.sendToRenderer("download-progress", progress);
    });

    // Error handling
    autoUpdater.on("error", (error) => {
      log.error("Auto-updater error:", error);
      this.sendToRenderer("update-error", {
        message: error.message,
        stack: error.stack,
      });
    });

    // Checking for updates
    autoUpdater.on("checking-for-update", () => {
      log.info("Checking for updates...");
      this.sendToRenderer("checking-for-update");
    });
  }

  // Show dialog asking user to download update
  private async showUpdateDialog(info: any) {
    if (!this.mainWindow) return;

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: "info",
      title: "Update Available",
      message: `A new version (${info.version}) of oLo is available!`,
      detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nWould you like to download it now?`,
      buttons: ["Download", "Later"],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      // User clicked "Download"
      await autoUpdater.downloadUpdate();
    }
  }

  // Show dialog asking user to restart and install
  private async showRestartDialog(info: any) {
    if (!this.mainWindow) return;

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: "info",
      title: "Update Ready",
      message: "Update downloaded successfully!",
      detail: `Version ${info.version} has been downloaded and is ready to install.\n\nThe application will restart to apply the update.`,
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      // User clicked "Restart Now"
      setImmediate(() => {
        app.removeAllListeners("window-all-closed");
        autoUpdater.quitAndInstall(false, true);
      });
    }
  }

  // Send message to renderer process
  private sendToRenderer(channel: string, data?: any) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  // Set the main window reference
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  // Check for updates manually
  async checkForUpdates() {
    if (this.isChecking) {
      log.info("Update check already in progress");
      return;
    }

    try {
      this.isChecking = true;
      log.info("Manually checking for updates...");
      await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error("Error checking for updates:", error);
    } finally {
      this.isChecking = false;
    }
  }

  // Start periodic update checks
  startPeriodicChecks(intervalMs: number = 4 * 60 * 60 * 1000) {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    // Check immediately on start
    setTimeout(() => this.checkForUpdates(), 10000); // Wait 10s after app start

    // Then check periodically
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);
  }

  // Stop periodic update checks
  stopPeriodicChecks() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  // Download update manually
  async downloadUpdate() {
    try {
      log.info("Starting update download...");
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error("Error downloading update:", error);
      throw error;
    }
  }

  // Install update immediately
  quitAndInstall() {
    autoUpdater.quitAndInstall(false, true);
  }
}

// Create singleton instance
const autoUpdateService = new AutoUpdateService();

// IPC Handlers for renderer process
export function setupAutoUpdateIPC() {
  // Check for updates
  ipcMain.handle("check-for-updates", async () => {
    try {
      await autoUpdateService.checkForUpdates();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Download update
  ipcMain.handle("download-update", async () => {
    try {
      await autoUpdateService.downloadUpdate();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Install update
  ipcMain.handle("install-update", () => {
    autoUpdateService.quitAndInstall();
    return { success: true };
  });

  // Get current version
  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });
}

// Export service instance
export default autoUpdateService;

// Usage in your main.ts/background.js:
/*
import autoUpdateService, { setupAutoUpdateIPC } from './autoUpdate';

app.whenReady().then(() => {
  // Create your main window
  const mainWindow = createWindow();
  
  // Setup auto-update
  autoUpdateService.setMainWindow(mainWindow);
  setupAutoUpdateIPC();
  
  // Start periodic checks (every 4 hours)
  autoUpdateService.startPeriodicChecks();
  
  // Or check manually
  // autoUpdateService.checkForUpdates();
});

app.on('before-quit', () => {
  autoUpdateService.stopPeriodicChecks();
});
*/
