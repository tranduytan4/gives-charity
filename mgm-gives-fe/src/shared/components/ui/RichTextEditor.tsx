import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import DOMPurify from 'dompurify';
import {
  Bold,
  ChevronDown,
  Heading,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  type LucideIcon,
  Type,
  Underline as UnderlineIcon,
  Unlink as UnlinkIcon,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/shared/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/Popover';
import { cn } from '@/shared/utils/cn';

type ToolbarMenuItem = {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onSelect: () => void;
};

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  ariaLabel?: string;
  contentClassName?: string;
}

function ToolbarDropdown({
  label,
  icon: Icon,
  active,
  disabled,
  items,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  items: ToolbarMenuItem[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={active ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 px-2"
          onMouseDown={(event) => event.preventDefault()}
          title={label}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <div className="flex flex-col gap-1">
          {items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <Button
                key={item.label}
                type="button"
                variant={item.isActive ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'h-11 w-full justify-start gap-3 px-3 text-sm',
                  item.isActive && 'text-primary',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (disabled) return;
                  item.onSelect();
                  setOpen(false);
                }}
                title={item.label}
                disabled={disabled}
              >
                <ItemIcon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write campaign description...',
  disabled = false,
  readOnly = false,
  error = false,
  ariaLabel,
  contentClassName,
}: RichTextEditorProps) {
  const isReadOnly = disabled || readOnly;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    ],
    content: value,
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'b', 'i', 'u', 'a'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
      });
      onChange(sanitized);
    },
  });

  React.useEffect(() => {
    if (!editor || editor.isFocused) return;

    const currentHtml = editor.getHTML();
    if (value !== currentHtml && !(value === '' && currentHtml === '<p></p>')) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  React.useEffect(() => {
    editor?.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter Link URL:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const activeListIcon = editor.isActive('orderedList') ? ListOrdered : List;

  const activeHeadingIcon = editor.isActive('heading', { level: 2 })
    ? Heading2
    : editor.isActive('heading', { level: 3 })
      ? Heading3
      : Heading;

  return (
    <div
      className={cn(
        'flex flex-col rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring',
        error && 'border-red-500 focus-within:ring-red-500/30',
        disabled && 'opacity-70',
      )}
    >
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap:focus {
          outline: none;
        }
        .tiptap p {
          margin-top: 0.35em;
          margin-bottom: 0.35em;
        }
        .tiptap h1 {
          font-size: 1.8em;
          font-weight: bold;
          margin-top: 0.55em;
          margin-bottom: 0.25em;
        }
        .tiptap h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.55em;
          margin-bottom: 0.25em;
        }
        .tiptap h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 0.55em;
          margin-bottom: 0.25em;
        }
        .tiptap ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .tiptap ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .tiptap li {
          margin-bottom: 0.25em;
        }
        .tiptap a {
          color: var(--color-primary, #3b82f6);
          text-decoration: underline;
        }
        .tiptap u {
          text-decoration: underline;
        }
      `}</style>

      {/* Toolbar — onMouseDown preventDefault keeps editor focus so commands always apply */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/50 p-1.5 rounded-t-md">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
            disabled={disabled}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
            disabled={disabled}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline"
            disabled={disabled}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <ToolbarDropdown
            label="Heading"
            icon={activeHeadingIcon}
            active={editor.isActive('heading')}
            disabled={disabled}
            items={[
              {
                label: 'Normal Text',
                icon: Type,
                isActive: editor.isActive('paragraph'),
                onSelect: () => editor.chain().focus().setParagraph().run(),
              },
              {
                label: 'Heading 2',
                icon: Heading2,
                isActive: editor.isActive('heading', { level: 2 }),
                onSelect: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
              },
              {
                label: 'Heading 3',
                icon: Heading3,
                isActive: editor.isActive('heading', { level: 3 }),
                onSelect: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
              },
            ]}
          />
          <ToolbarDropdown
            label="List"
            icon={activeListIcon}
            active={editor.isActive('bulletList') || editor.isActive('orderedList')}
            disabled={disabled}
            items={[
              {
                label: 'Ordered list',
                icon: ListOrdered,
                isActive: editor.isActive('orderedList'),
                onSelect: () => editor.chain().focus().toggleOrderedList().run(),
              },
              {
                label: 'Unordered list',
                icon: List,
                isActive: editor.isActive('bulletList'),
                onSelect: () => editor.chain().focus().toggleBulletList().run(),
              },
            ]}
          />
          <div className="w-[1px] h-6 bg-border mx-1" />
          <Button
            type="button"
            variant={editor.isActive('link') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={setLink}
            title="Link"
            disabled={disabled}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          {editor.isActive('link') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Remove Link"
              disabled={disabled}
            >
              <UnlinkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Editor Content Area */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Click handler delegates focus to the keyboard-accessible editor */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Click handler delegates focus to editor */}
      <div
        onClick={() => !isReadOnly && editor?.commands.focus()}
        className={cn(
          'min-h-[150px] px-3 py-2 text-sm leading-relaxed prose prose-sm max-w-none cursor-text',
          contentClassName,
        )}
      >
        <EditorContent editor={editor} className="min-h-[140px]" aria-label={ariaLabel} />
      </div>
    </div>
  );
}
