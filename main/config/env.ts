import dotenv from "dotenv";
import path from "path";

// Load .env file
const result = dotenv.config();

if (result.error) {
  console.error("❌ Error loading .env file:", result.error);
} else {
  console.log("✅ .env file loaded successfully");
}

// For development, also try loading from project root
// if (process.env.NODE_ENV === "development") {
const rootEnvPath = path.join(__dirname, "../../../.env");

if (process.env.NODE_ENV === "production") {
  const prodEnvPath = path.join(process.resourcesPath, ".env");
  console.log("🔍 Loading production env from:", prodEnvPath);
  dotenv.config({ path: prodEnvPath });
} else {
  dotenv.config({ path: rootEnvPath, override: true });
}
// }

export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];

  if (!value && defaultValue === undefined) {
    console.error(`❌ Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value || defaultValue || "";
};

// Apple configuration with validation
export const APPLE_CONFIG = {
  CLIENT_ID: getEnvVar("APPLE_CLIENT_ID"),
  TEAM_ID: getEnvVar("APPLE_TEAM_ID"),
  KEY_ID: getEnvVar("APPLE_KEY_ID"),
  PRIVATE_KEY: getEnvVar("APPLE_PRIVATE_KEY"),
  REDIRECT_URI: getEnvVar(
    "APPLE_REDIRECT_URI",
    "https://dev-eye-scan-api.AuraCoremedical.com/auth/apple-login-test-html"
  ),
};

// Debug function
export function debugEnv() {
  console.log("🔧 Environment Debug:");
  console.log(
    "   NODE_ENV:",
    process.env.NODE_ENV ? "✅ Present" : "❌ Missing"
  );
  console.log(
    "   APPLE_CLIENT_ID:",
    APPLE_CONFIG.CLIENT_ID ? "✅ Present" : "❌ Missing"
  );
  console.log(
    "   APPLE_TEAM_ID:",
    APPLE_CONFIG.TEAM_ID ? "✅ Present" : "❌ Missing"
  );
  console.log("   APPLE_KEY_ID:", APPLE_CONFIG.KEY_ID ? "✅" : "❌");
  console.log(
    "   APPLE_PRIVATE_KEY:",
    APPLE_CONFIG.PRIVATE_KEY
      ? `✅ (${APPLE_CONFIG.PRIVATE_KEY.length} chars)`
      : "❌"
  );
  console.log("   GH_TOKEN:", process.env.GH_TOKEN ? "✅" : "❌");
}
