import Bowser from "bowser";

export type SessionDevice = {
  browser: string;
  platform: string;
  category: "desktop" | "mobile" | "tablet" | "unknown";
};

export function describeUserAgent(userAgent?: string | null): SessionDevice {
  if (!userAgent) {
    return {
      browser: "Unknown browser",
      platform: "Unknown platform",
      category: "unknown",
    };
  }

  const parsed = Bowser.parse(userAgent);
  const browser = parsed.browser.name
    ? `${parsed.browser.name}${
        parsed.browser.version
          ? ` ${parsed.browser.version.split(".")[0]}`
          : ""
      }`
    : "Unknown browser";
  const platform =
    [parsed.os.name, parsed.os.version].filter(Boolean).join(" ") ||
    parsed.platform.vendor ||
    "Unknown platform";
  const type = parsed.platform.type;

  return {
    browser,
    platform,
    category:
      type === "mobile" || type === "tablet" || type === "desktop"
        ? type
        : "unknown",
  };
}
