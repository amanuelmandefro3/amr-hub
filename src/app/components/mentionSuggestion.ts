import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import type { WorkspaceMember } from "../data/issues";
import { MentionList, type MentionListItem, type MentionListRef } from "./MentionList";

export function createMentionSuggestion(
  members: WorkspaceMember[],
): Omit<SuggestionOptions<MentionListItem>, "editor"> {
  return {
    items: ({ query }) =>
      members
        .filter((member) =>
          member.name.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 6)
        .map((member) => ({ id: member.id, label: member.name })),
    render: () => {
      let component: ReactRenderer<MentionListRef> | null = null;
      let unmount: (() => void) | null = null;

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });
          unmount = props.mount(component.element);
        },
        onUpdate: (props) => {
          component?.updateProps(props);
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            unmount?.();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          unmount?.();
          component?.destroy();
          component = null;
        },
      };
    },
  };
}
