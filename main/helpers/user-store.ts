// electron/helpers/user-store.ts
import Store from "electron-store";

interface NotificationSettings {
  screenDistanceAlert: boolean;
  eyeStrainAlert: boolean;
  batteryDrainingAlert: boolean;
  lightingAlert: boolean;
  screenTimeAlert: boolean;
}

interface UserStoreSchema {
  isAuthenticated: boolean;
  userId?: string;
  userEmail?: string;
  token?: string;
  sessionId?: number | null;
  notificationSettings?: NotificationSettings;
}

export const userStore = new Store<UserStoreSchema>({
  name: "com.devamitch.olo",
  defaults: {
    isAuthenticated: false,
    sessionId: null,
    notificationSettings: {
      screenDistanceAlert: true,
      eyeStrainAlert: true,
      batteryDrainingAlert: true,
      lightingAlert: true,
      screenTimeAlert: true,
    },
  },
});

// Helper functions for auth management
export const authStore = {
  setAuthenticated(isAuth: boolean) {
    userStore.set("isAuthenticated", isAuth);
  },

  getAuthenticated(): boolean {
    return userStore.get("isAuthenticated", false);
  },

  setUserData(userData: { userId: string; userEmail: string; token?: string }) {
    userStore.set("isAuthenticated", true);
    userStore.set("userId", userData.userId);
    userStore.set("userEmail", userData.userEmail);
    if (userData.token) {
      userStore.set("token", userData.token);
    }
  },

  clearUserData() {
    userStore.set("isAuthenticated", false);
    userStore.delete("userId");
    userStore.delete("userEmail");
    userStore.delete("token");
    userStore.delete("sessionId");
  },

  getUserData() {
    return {
      isAuthenticated: userStore.get("isAuthenticated", false),
      userId: userStore.get("userId"),
      userEmail: userStore.get("userEmail"),
      token: userStore.get("token"),
    };
  },

  setSessionId(sessionId: number | null) {
    userStore.set("sessionId", sessionId);
  },

  getSessionId(): number | null {
    return userStore.get("sessionId", null);
  },

  clearSessionId() {
    userStore.delete("sessionId");
  },
};

// Notification settings helpers
export const notificationSettingsStore = {
  getSettings(): NotificationSettings {
    return userStore.get("notificationSettings", {
      screenDistanceAlert: true,
      eyeStrainAlert: true,
      batteryDrainingAlert: true,
      lightingAlert: true,
      screenTimeAlert: true,
    });
  },

  setSettings(settings: NotificationSettings) {
    userStore.set("notificationSettings", settings);
  },

  updateSetting(key: keyof NotificationSettings, value: boolean) {
    const current = this.getSettings();
    userStore.set("notificationSettings", { ...current, [key]: value });
  },
};
