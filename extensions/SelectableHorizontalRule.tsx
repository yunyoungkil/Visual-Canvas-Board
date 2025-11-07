import { Node, mergeAttributes } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import React from "react";

export interface HorizontalRuleOptions {
  HTMLAttributes: Record<string, any>;
}

const HorizontalRuleComponent = ({ getPos, editor }: any) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const pos = getPos();
    if (typeof pos === "number") {
      const selection = NodeSelection.create(editor.state.doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(selection));
    }
  };

  return (
    <NodeViewWrapper>
      <hr onClick={handleClick} style={{ cursor: "pointer" }} />
    </NodeViewWrapper>
  );
};

export const SelectableHorizontalRule = Node.create<HorizontalRuleOptions>({
  name: "horizontalRule",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  parseHTML() {
    return [{ tag: "hr" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["hr", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setHorizontalRule:
        () =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(HorizontalRuleComponent);
  },

  // Make it selectable
  selectable: true,

  // Allow node selection
  atom: true,
});
