// electron/preload.ts
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { EyeTrackingMetrics } from "../renderer/src/store/slices/eye-tracking.slice";
import type {
  graphResponse,
  TimeFilterQueryDto,
  UnsyncedLocalResponse,
} from "./db/eyeMetrics";

export type NotificationOptions = {
  title: string;
  body?: string;
  sound?: boolean;
  soundPath?: string;
  volume?: number;
  actions?: Array<{ text: string }>;
  urgency?: "low" | "normal" | "critical";
};

export type USER = {
  profilePhoto: string;
  name: string;
  role: string;
  token: string;
  email: string;
  id: string;
  emailVerified: boolean;
  isPrivateEmail: boolean;
};

export type PiPWindowOptions = {
  width?: number;
  height?: number;
  position?: { x: number; y: number };
};

export type PiPPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

let preservedStream: MediaStream | null = null;

const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
  navigator.mediaDevices
);

navigator.mediaDevices.getUserMedia = async function (constraints) {
  try {
    const stream = await originalGetUserMedia(constraints);
    preservedStream = stream;

    stream.getTracks().forEach((track) => {
      const originalStop = track.stop;
      track.stop = function () {
        console.log("[MediaStream] Track stop prevented by preservation layer");
      };
    });

    return stream;
  } catch (error) {
    console.error("[MediaStream] Failed to get user media:", error);
    throw error;
  }
};

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value);
  },

  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  // **Locale Management**
  async getLocale(): Promise<string> {
    return await ipcRenderer.invoke("get-locale");
  },
  async setLocale(locale: string): Promise<boolean> {
    return await ipcRenderer.invoke("set-locale", locale);
  },
  async getSupportedLocales(): Promise<string[]> {
    return await ipcRenderer.invoke("get-supported-locales");
  },

  // **Metrics Management**
  async createMetrics(
    eyeTrackingData: EyeTrackingMetrics
  ): Promise<{ success: boolean; id: number }> {
    return await ipcRenderer.invoke("eye-metrics-create", eyeTrackingData);
  },
  async getAllMetrics(): Promise<EyeTrackingMetrics[]> {
    return await ipcRenderer.invoke("eye-metrics-get-all");
  },
  async getunsyncedMetrics(
    lastId?: number,
    batchSize: number = 50
  ): Promise<UnsyncedLocalResponse> {
    return await ipcRenderer.invoke("unsynced-data", lastId, batchSize);
  },
  async markMetricsSynced(ids: number[]): Promise<void> {
    return await ipcRenderer.invoke("mark-metrics-synced", ids);
  },
  async remoteMetricsSync(data: EyeTrackingMetrics[]): Promise<void> {
    return await ipcRenderer.invoke("remote-metrics-sync", data);
  },

  async getfilterMetrics(query: TimeFilterQueryDto): Promise<graphResponse> {
    return await ipcRenderer.invoke("eye-metrics-report", query);
  },

  // **Auto-Update Management - ENHANCED**
  async checkForUpdatesManual(): Promise<{
    success: boolean;
    updateInfo?: any;
    message?: string;
    error?: string;
    available?: boolean;
  }> {
    console.log("[Frontend] 🔍 Manually triggering update check...");
    return await ipcRenderer.invoke("check-for-updates-manual");
  },

  async installUpdate(): Promise<void> {
    console.log("[Frontend] 🔄 Triggering update installation...");
    return await ipcRenderer.invoke("install-update");
  },

  async getAppVersion(): Promise<string> {
    return await ipcRenderer.invoke("get-app-version");
  },

  onUpdateStatus(
    callback: (status: {
      type: string;
      message: string;
      progress?: any;
      info?: any;
      error?: any;
      attempt?: number; // NEW: Track attempt number
    }) => void
  ) {
    const listener = (_event: any, status: any) => {
      console.log(
        "[Frontend] 📥 Update status received:",
        status.type,
        status.message
      );
      if (status.attempt) {
        console.log(`[Frontend] 📊 Check attempt #${status.attempt}`);
      }
      callback(status);
    };
    ipcRenderer.on("update-status", listener);
    return () => ipcRenderer.removeListener("update-status", listener);
  },

  // **Notification Management**
  async showNotification(options: NotificationOptions) {
    const { sound = true, volume = 0.5, soundPath } = options;

    await ipcRenderer.invoke("show-notification", options);

    if (sound) {
      try {
        const audio = new Audio(soundPath || "./assets/sounds/notify.wav");
        audio.volume = volume;
        await audio.play().catch(() => {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.value = volume;
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.stop(ctx.currentTime + 0.3);
        });
      } catch (err) {
        console.warn("Notification sound failed:", err);
      }
    }
  },

  onNotificationClick(callback: (event?: unknown) => void) {
    ipcRenderer.on("notification-clicked", (_, data) => callback(data));
  },
  onNotificationAction(callback: (event?: unknown) => void) {
    ipcRenderer.on("notification-action", (_, data) => callback(data));
  },

  // **PiP Window Management**
  async createPiPWindow(options: PiPWindowOptions): Promise<{
    success: boolean;
    windowId?: number;
    position?: PiPPosition;
    error?: string;
  }> {
    return await ipcRenderer.invoke("pip-create-window", options);
  },

  async closePiPWindow(): Promise<{ success: boolean; error?: string }> {
    return await ipcRenderer.invoke("pip-close-window");
  },

  async setPiPPosition(
    x: number,
    y: number
  ): Promise<{ success: boolean; error?: string }> {
    return await ipcRenderer.invoke("pip-set-position", { x, y });
  },

  async getPiPPosition(): Promise<{
    success: boolean;
    position?: PiPPosition;
    error?: string;
  }> {
    return await ipcRenderer.invoke("pip-get-position");
  },

  async resetPiPPosition(): Promise<{
    success: boolean;
    position?: PiPPosition;
    error?: string;
  }> {
    return await ipcRenderer.invoke("pip-reset-position");
  },

  async setPiPSize(
    width: number,
    height: number
  ): Promise<{
    success: boolean;
    width?: number;
    height?: number;
    error?: string;
  }> {
    return await ipcRenderer.invoke("pip-set-size", { width, height });
  },

  sendPiPFrame(frameData: string) {
    ipcRenderer.send("pip-update-frame", frameData);
  },

  sendPiPTracking(trackingData: any) {
    ipcRenderer.send("pip-update-tracking", trackingData);
  },

  onPiPWindowClosed(callback: () => void) {
    ipcRenderer.on("pip-window-closed", callback);
    return () => {
      ipcRenderer.removeListener("pip-window-closed", callback);
    };
  },

  onPiPReceiveFrame(callback: (frameData: string) => void) {
    const listener = (_event: any, frameData: string) => callback(frameData);
    ipcRenderer.on("pip-receive-frame", listener);
    return () => ipcRenderer.removeListener("pip-receive-frame", listener);
  },

  onPiPReceiveTracking(callback: (trackingData: any) => void) {
    const listener = (_event: any, trackingData: any) => callback(trackingData);
    ipcRenderer.on("pip-receive-tracking", listener);
    return () => ipcRenderer.removeListener("pip-receive-tracking", listener);
  },

  // **WebRTC Signaling**
  sendWebRTCOffer: (data: { sdp: string; type: RTCSdpType }) => {
    ipcRenderer.send("pip-webrtc-offer", data);
  },

  sendWebRTCAnswer: (data: { sdp: string; type: RTCSdpType }) => {
    ipcRenderer.send("pip-webrtc-answer", data);
  },

  sendICECandidate: (data: { candidate: RTCIceCandidateInit }) => {
    ipcRenderer.send("pip-ice-candidate", data);
  },

  sendICECandidateAnswer: (data: { candidate: RTCIceCandidateInit }) => {
    ipcRenderer.send("pip-ice-candidate-answer", data);
  },

  onWebRTCOffer: (
    callback: (data: { sdp: string; type: RTCSdpType }) => void
  ) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on("pip-webrtc-offer", listener);
    return () => ipcRenderer.removeListener("pip-webrtc-offer", listener);
  },

  onWebRTCAnswer: (
    callback: (data: { sdp: string; type: RTCSdpType }) => void
  ) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on("pip-webrtc-answer", listener);
    return () => ipcRenderer.removeListener("pip-webrtc-answer", listener);
  },

  onICECandidate: (
    callback: (data: { candidate: RTCIceCandidateInit }) => void
  ) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on("pip-ice-candidate", listener);
    return () => ipcRenderer.removeListener("pip-ice-candidate", listener);
  },

  onICECandidateAnswer: (
    callback: (data: { candidate: RTCIceCandidateInit }) => void
  ) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on("pip-ice-candidate-answer", listener);
    return () =>
      ipcRenderer.removeListener("pip-ice-candidate-answer", listener);
  },

  getPreservedStream: () => preservedStream,
  clearPreservedStream: () => {
    preservedStream = null;
  },

  onNavigateTo: (callback: (event: any, route: string) => void) => {
    ipcRenderer.on("navigate-to", callback);
    return () => {
      ipcRenderer.removeListener("navigate-to", callback);
    };
  },
  removeNavigateToListener: (callback: any) =>
    ipcRenderer.removeListener("navigate-to", callback),

  // **Auth Management**
  async setAuthenticated(isAuth: boolean): Promise<void> {
    return await ipcRenderer.invoke("auth-set-authenticated", isAuth);
  },

  async getAuthenticated(): Promise<boolean> {
    return await ipcRenderer.invoke("auth-get-authenticated");
  },

  async setUserData(userData: {
    userId: string;
    userEmail: string;
    token?: string;
  }): Promise<void> {
    return await ipcRenderer.invoke("auth-set-user-data", userData);
  },

  async clearUserData(): Promise<void> {
    return await ipcRenderer.invoke("auth-clear-user-data");
  },

  async getUserData(): Promise<{
    isAuthenticated: boolean;
    userId?: string;
    userEmail?: string;
    token?: string;
  }> {
    return await ipcRenderer.invoke("auth-get-user-data");
  },
  async setSessionId(sessionId: number | null): Promise<void> {
    return await ipcRenderer.invoke("auth-set-sessionId", sessionId);
  },
  async getSessionId(): Promise<number | null> {
    return await ipcRenderer.invoke("auth-get-sessionId");
  },
  async shareImage(imageDataUrl: string): Promise<{
    success: boolean;
    message?: string;
    filePath?: string;
    error?: string;
  }> {
    return await ipcRenderer.invoke("share-image", imageDataUrl);
  },

  onSystemSuspend(callback: () => void) {
    const listener = () => callback();
    ipcRenderer.on("system-suspend", listener);
    return () => ipcRenderer.removeListener("system-suspend", listener);
  },

  onSystemResume(callback: () => void) {
    const listener = () => callback();
    ipcRenderer.on("system-resume", listener);
    return () => ipcRenderer.removeListener("system-resume", listener);
  },

  onSystemLock(callback: () => void) {
    const listener = () => callback();
    ipcRenderer.on("system-lock", listener);
    return () => ipcRenderer.removeListener("system-lock", listener);
  },

  onSystemUnlock(callback: () => void) {
    const listener = () => callback();
    ipcRenderer.on("system-unlock", listener);
    return () => ipcRenderer.removeListener("system-unlock", listener);
  },
  async getNotificationSettings(): Promise<{
    screenDistanceAlert: boolean;
    eyeStrainAlert: boolean;
    batteryDrainingAlert: boolean;
    lightingAlert: boolean;
    screenTimeAlert: boolean;
  }> {
    return await ipcRenderer.invoke("notification-settings-get");
  },

  async setNotificationSettings(settings: {
    screenDistanceAlert: boolean;
    eyeStrainAlert: boolean;
    batteryDrainingAlert: boolean;
    lightingAlert: boolean;
    screenTimeAlert: boolean;
  }): Promise<{ success: boolean }> {
    return await ipcRenderer.invoke("notification-settings-set", settings);
  },

  async updateNotificationSetting(
    key: string,
    value: boolean
  ): Promise<{ success: boolean }> {
    return await ipcRenderer.invoke("notification-settings-update", key, value);
  },
  async openExternal(url: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return await ipcRenderer.invoke("open-external", url);
  },
  async checkOnline(): Promise<boolean> {
    return await ipcRenderer.invoke("check-online");
  },
  async openCameraSettings(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return await ipcRenderer.invoke("open-camera-settings");
  },

  async getWindowsVersion(): Promise<{
    success: boolean;
    isWindows: boolean;
    isWindows11?: boolean;
    release?: string;
    error?: string;
  }> {
    return await ipcRenderer.invoke("get-windows-version");
  },
  appleSignIn: (): Promise<
    Partial<{
      success?: boolean;
      error?: any;
      user: {
        profilePhoto?: string;
        name?: string;
        role?: string;
        token?: string;
        email?: string;
        id?: string;
        emailVerified?: boolean;
        isPrivateEmail?: boolean;
      };
      idToken?: string;
    }>
  > => ipcRenderer.invoke("apple-signin"),
};

contextBridge.exposeInMainWorld("mediaPreservation", {
  getPreservedStream: () => preservedStream,
  clearPreservedStream: () => {
    preservedStream = null;
  },
});

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;
