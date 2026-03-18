import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Minus,
  Undo,
  Redo,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RichTextEditorRef {
  getHTML: () => string;
}

interface RichTextEditorProps {
  content: string;
  placeholder?: string;
  className?: string;
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-border mx-1" />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const iconSize = 15;
  const sw = 1.8;

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border flex-wrap">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Gras"
      >
        <Bold size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italique"
      >
        <Italic size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Souligné"
      >
        <UnderlineIcon size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Barré"
      >
        <Strikethrough size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Surligné"
      >
        <Highlighter size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Code inline"
      >
        <Code size={iconSize} strokeWidth={sw} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Titre 1"
      >
        <Heading1 size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Titre 2"
      >
        <Heading2 size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Titre 3"
      >
        <Heading3 size={iconSize} strokeWidth={sw} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Lists & blocks */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Liste à puces"
      >
        <List size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Liste numérotée"
      >
        <ListOrdered size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Citation"
      >
        <Quote size={iconSize} strokeWidth={sw} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Table */}
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Insérer un tableau"
      >
        <TableIcon size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Séparateur"
      >
        <Minus size={iconSize} strokeWidth={sw} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Annuler"
      >
        <Undo size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Rétablir"
      >
        <Redo size={iconSize} strokeWidth={sw} />
      </ToolbarButton>
    </div>
  );
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor({ content, placeholder = 'Rédigez le contenu ici...', className }, ref) {
    const lastExternalContent = useRef(content);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Placeholder.configure({ placeholder }),
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        Highlight,
        Underline,
      ],
      content,
      editorProps: {
        attributes: {
          class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3',
        },
      },
    });

    // Expose getHTML to parent via ref
    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || '',
    }), [editor]);

    // Only sync when content changes externally (e.g., switching lessons)
    useEffect(() => {
      if (content !== lastExternalContent.current) {
        lastExternalContent.current = content;
        if (editor) {
          editor.commands.setContent(content || '');
        }
      }
    }, [content, editor]);

    if (!editor) return null;

    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-card overflow-hidden',
          'focus-within:ring-1 focus-within:ring-ring',
          className
        )}
      >
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    );
  }
);

export default RichTextEditor;
