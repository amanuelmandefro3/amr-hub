import { describe, expect, it } from "vitest";
import {
  extractCommentMentionIds,
  extractMentionedMemberIds,
  sanitizeDescriptionHtml,
  stripHtml,
} from "./richText";

describe("sanitizeDescriptionHtml", () => {
  it("keeps the allowed formatting tags", () => {
    const input = "<p>Hello <strong>world</strong></p><ul><li>One</li></ul>";
    expect(sanitizeDescriptionHtml(input)).toBe(input);
  });

  it("strips script tags entirely", () => {
    const result = sanitizeDescriptionHtml(
      "<p>hi</p><script>alert(1)</script>",
    );
    expect(result).not.toContain("script");
    expect(result).not.toContain("alert");
  });

  it("strips inline event handlers", () => {
    const result = sanitizeDescriptionHtml('<p onclick="alert(1)">hi</p>');
    expect(result).not.toContain("onclick");
  });

  it("strips javascript: links", () => {
    const result = sanitizeDescriptionHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
  });

  it("keeps mention spans with their data attributes", () => {
    const input =
      '<p><span data-type="mention" data-id="member-1" data-label="Jane">@Jane</span></p>';
    expect(sanitizeDescriptionHtml(input)).toBe(input);
  });
});

describe("stripHtml", () => {
  it("returns the plain-text length of a formatted description", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe(
      "Hello world",
    );
  });
});

describe("extractMentionedMemberIds", () => {
  it("extracts every mentioned member id, deduplicated", () => {
    const html =
      '<p><span data-type="mention" data-id="member-1">@Jane</span> and ' +
      '<span data-type="mention" data-id="member-2">@Sam</span> and ' +
      '<span data-type="mention" data-id="member-1">@Jane</span></p>';

    expect(extractMentionedMemberIds(html)).toEqual(["member-1", "member-2"]);
  });

  it("ignores spans that are not mentions", () => {
    const html = '<p><span class="foo">not a mention</span></p>';
    expect(extractMentionedMemberIds(html)).toEqual([]);
  });
});

describe("extractCommentMentionIds", () => {
  it("extracts member ids from the markdown-style mention syntax", () => {
    const body = "Hey @[Jane Doe](member-1), can you check this?";
    expect(extractCommentMentionIds(body)).toEqual(["member-1"]);
  });

  it("returns an empty array when there are no mentions", () => {
    expect(extractCommentMentionIds("Just a plain comment")).toEqual([]);
  });
});
