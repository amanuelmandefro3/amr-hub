"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
  useRef,
  useState,
} from "react";
import type { WorkspaceMember } from "../data/issues";
import { insertMention } from "../data/richText";

type MentionQuery = { query: string; cursor: number };

function detectMention(text: string, cursor: number): MentionQuery | null {
  const uptoCursor = text.slice(0, cursor);
  const atIndex = uptoCursor.lastIndexOf("@");
  if (atIndex === -1) return null;

  const between = uptoCursor.slice(atIndex + 1);
  if (/\s/.test(between)) return null;
  if (atIndex > 0 && /\S/.test(uptoCursor[atIndex - 1])) return null;

  return { query: between, cursor };
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  members: WorkspaceMember[];
} & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
>;

export function MentionTextarea({
  value,
  onChange,
  members,
  ...textareaProps
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionQuery, setMentionQuery] = useState<MentionQuery | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = mentionQuery
    ? members
        .filter((member) =>
          member.name.toLowerCase().includes(mentionQuery.query.toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const selectMember = (member: WorkspaceMember) => {
    if (!mentionQuery) return;

    const { body, cursor } = insertMention(
      value,
      mentionQuery.cursor,
      mentionQuery.query.length,
      member,
    );
    onChange(body);
    setMentionQuery(null);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursor, cursor);
    });
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    onChange(nextValue);
    setMentionQuery(detectMention(nextValue, event.target.selectionStart));
    setActiveIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mentionQuery || matches.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + matches.length) % matches.length,
      );
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      selectMember(matches[activeIndex]);
    } else if (event.key === "Escape") {
      setMentionQuery(null);
    }
  };

  return (
    <div className="mention-textarea">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setMentionQuery(null)}
        {...textareaProps}
      />
      {mentionQuery && matches.length > 0 && (
        <div className="mention-suggestions" role="listbox">
          {matches.map((member, index) => (
            <button
              type="button"
              key={member.id}
              className={index === activeIndex ? "active" : ""}
              onMouseDown={(event) => {
                event.preventDefault();
                selectMember(member);
              }}
            >
              <span className="mention-suggestion-avatar" aria-hidden="true">
                {member.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="mention-suggestion-label">{member.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
