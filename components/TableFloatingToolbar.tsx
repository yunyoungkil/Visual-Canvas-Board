import React from "react";
import type { Editor } from "@tiptap/react";
import Icon from "./Icon";

interface TableFloatingToolbarProps {
  editor: Editor;
  onClose: () => void;
}

const TableFloatingToolbar: React.FC<TableFloatingToolbarProps> = ({
  editor,
  onClose,
}) => {
  const buttonClass =
    "p-2 hover:bg-gray-100 rounded transition-colors flex items-center justify-center";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 flex items-center gap-1 px-2 py-1">
      {/* 1. 표 테마 */}
      <button
        className={buttonClass}
        title="표 테마"
        onClick={() => {
          // Toggle header row
          editor.chain().focus().toggleHeaderRow().run();
        }}
      >
        <Icon name="tableTheme" className="w-5 h-5 text-gray-700" />
      </button>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* 2. 셀 합치기 */}
      <button
        className={buttonClass}
        title="셀 합치기"
        onClick={() => {
          editor.chain().focus().mergeCells().run();
        }}
      >
        <Icon name="tableMergeCells" className="w-5 h-5 text-gray-700" />
      </button>

      {/* 3. 셀 나누기 */}
      <button
        className={buttonClass}
        title="셀 나누기"
        onClick={() => {
          editor.chain().focus().splitCell().run();
        }}
      >
        <Icon name="tableSplitCell" className="w-5 h-5 text-gray-700" />
      </button>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* 4. 이전에 행 삽입 */}
      <button
        className={buttonClass}
        title="위에 행 삽입"
        onClick={() => {
          editor.chain().focus().addRowBefore().run();
        }}
      >
        <Icon name="tableRowBefore" className="w-5 h-5 text-gray-700" />
      </button>

      {/* 5. 다음에 행 삽입 */}
      <button
        className={buttonClass}
        title="아래에 행 삽입"
        onClick={() => {
          editor.chain().focus().addRowAfter().run();
        }}
      >
        <Icon name="tableRowAfter" className="w-5 h-5 text-gray-700" />
      </button>

      {/* 6. 행 지우기 */}
      <button
        className={buttonClass}
        title="행 삭제"
        onClick={() => {
          editor.chain().focus().deleteRow().run();
        }}
      >
        <Icon name="tableRowDelete" className="w-5 h-5 text-red-600" />
      </button>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* 7. 이전에 열 삽입 */}
      <button
        className={buttonClass}
        title="왼쪽에 열 삽입"
        onClick={() => {
          editor.chain().focus().addColumnBefore().run();
        }}
      >
        <Icon name="tableColumnBefore" className="w-5 h-5 text-gray-700" />
      </button>

      {/* 8. 다음에 열 삽입 */}
      <button
        className={buttonClass}
        title="오른쪽에 열 삽입"
        onClick={() => {
          editor.chain().focus().addColumnAfter().run();
        }}
      >
        <Icon name="tableColumnAfter" className="w-5 h-5 text-gray-700" />
      </button>

      {/* 9. 열 지우기 */}
      <button
        className={buttonClass}
        title="열 삭제"
        onClick={() => {
          editor.chain().focus().deleteColumn().run();
        }}
      >
        <Icon name="tableColumnDelete" className="w-5 h-5 text-red-600" />
      </button>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* 10. 테이블 삭제 */}
      <button
        className={buttonClass}
        title="테이블 삭제"
        onClick={() => {
          editor.chain().focus().deleteTable().run();
          onClose();
        }}
      >
        <Icon name="tableDelete" className="w-5 h-5 text-red-600" />
      </button>

      {/* Close button */}
      <button
        className="ml-2 p-1 hover:bg-gray-100 rounded"
        title="닫기"
        onClick={onClose}
      >
        <Icon name="close" className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
};

export default TableFloatingToolbar;
