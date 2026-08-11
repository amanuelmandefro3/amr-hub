const HTML_TAG_PATTERN = /<(p|br|strong|em|s|u|ul|ol|li|a|code|pre|blockquote|h1|h2|h3|span)\b/i;

export function looksLikeHtml(value: string): boolean {
  return HTML_TAG_PATTERN.test(value);
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type CommentBodyPart =
  | { type: "text"; value: string }
  | { type: "mention"; name: string; memberId: string };

const COMMENT_MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g;

export function parseCommentBody(body: string): CommentBodyPart[] {
  const parts: CommentBodyPart[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(COMMENT_MENTION_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "text", value: body.slice(lastIndex, index) });
    }
    parts.push({ type: "mention", name: match[1], memberId: match[2] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", value: body.slice(lastIndex) });
  }

  return parts;
}

/** Convert the shared rich-text composer output to the compact comment format. */
export function serializeCommentBody(value: string): string {
  if (!looksLikeHtml(value)) return value;

  const serialized = value.replace(
    /<span\b([^>]*\bdata-type=["']mention["'][^>]*)>([\s\S]*?)<\/span>/gi,
    (_match, attributes: string, content: string) => {
      const id = attributes.match(/\bdata-id=["']([^"']+)["']/i)?.[1];
      const label = attributes.match(/\bdata-label=["']([^"']+)["']/i)?.[1];
      const text = (label ?? content.replace(/<[^>]*>/g, "")).trim();
      return id && text ? `@[${text}](${id})` : text;
    },
  );

  return serialized
    .replace(/<br\s*\/?>(\s*)/gi, "\n$1")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

export function insertMention(
  body: string,
  cursor: number,
  queryLength: number,
  member: { id: string; name: string },
): { body: string; cursor: number } {
  const mentionStart = cursor - queryLength - 1;
  const before = body.slice(0, mentionStart);
  const after = body.slice(cursor);
  const inserted = `@[${member.name}](${member.id}) `;

  return {
    body: `${before}${inserted}${after}`,
    cursor: before.length + inserted.length,
  };
}
