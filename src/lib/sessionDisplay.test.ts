import { describe, expect, it } from "vitest";
import { describeUserAgent } from "./sessionDisplay";

describe("describeUserAgent", () => {
  it("describes a desktop browser without exposing the full user agent", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      ),
    ).toEqual({
      browser: "Chrome 126",
      platform: "macOS 10.15.7",
      category: "desktop",
    });
  });

  it("recognizes mobile Safari", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
          "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 " +
          "Mobile/15E148 Safari/604.1",
      ),
    ).toMatchObject({
      browser: "Safari 17",
      platform: "iOS 17.5",
      category: "mobile",
    });
  });

  it("handles sessions without a user agent", () => {
    expect(describeUserAgent(null)).toEqual({
      browser: "Unknown browser",
      platform: "Unknown platform",
      category: "unknown",
    });
  });
});
