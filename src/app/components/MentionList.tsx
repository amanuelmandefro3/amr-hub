import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export type MentionListItem = { id: string; label: string };

export type MentionListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export const MentionList = forwardRef<
  MentionListRef,
  { items: MentionListItem[]; command: (item: MentionListItem) => void }
>(function MentionList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (items.length === 0) return false;

      if (event.key === "ArrowUp") {
        setSelectedIndex((current) => (current + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((current) => (current + 1) % items.length);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) return null;

  return (
    <div className="mention-suggestions">
      {items.map((item, index) => (
        <button
          type="button"
          key={item.id}
          className={index === selectedIndex ? "active" : ""}
          onMouseDown={(event) => {
            event.preventDefault();
            selectItem(index);
          }}
        >
          <span className="mention-suggestion-avatar" aria-hidden="true">
            {item.label
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <span className="mention-suggestion-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
});
