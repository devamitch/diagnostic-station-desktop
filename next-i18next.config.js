/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ja", "ko"],
  },
  debug: process.env.NODE_ENV === "development",
  reloadOnPrerender: process.env.NODE_ENV === "development",
  localePath:
    typeof window === "undefined"
      ? require("path").resolve("./renderer/src/i18n")
      : "/locales",
};
