import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start typing...",
  className = ""
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  // Enhanced Google Docs-like toolbar configuration with more fonts
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [
          'sans-serif', 'serif', 'monospace', 
          'arial', 'times-new-roman', 'courier-new', 
          'georgia', 'palatino', 'garamond',
          'comic-sans', 'trebuchet', 'verdana',
          'impact', 'lucida', 'tahoma'
        ] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
    },
    clipboard: {
      matchVisual: false,
    },
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'check', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="h-full"
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          font-size: 15px;
          line-height: 1.6;
          height: calc(100% - 46px);
        }
        
        .rich-text-editor .ql-editor {
          min-height: 400px;
          padding: 20px;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          padding: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          position: relative;
          z-index: 10;
        }
        
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top: none;
          background: rgba(255, 255, 255, 0.05);
        }
        
        .rich-text-editor .ql-toolbar button,
        .rich-text-editor .ql-toolbar .ql-picker {
          width: auto !important;
          min-width: 32px !important;
          height: 32px !important;
          padding: 6px !important;
          border-radius: 6px;
          cursor: pointer !important;
          pointer-events: auto !important;
          position: relative;
          z-index: 20;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s;
        }
        
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar .ql-picker:hover {
          background: rgba(99, 102, 241, 0.2) !important;
          border-color: rgba(99, 102, 241, 0.4);
          transform: scale(1.05);
        }
        
        .rich-text-editor .ql-toolbar button.ql-active {
          background: rgba(99, 102, 241, 0.3) !important;
          border-color: rgb(99, 102, 241);
          color: rgb(99, 102, 241);
        }
        
        .rich-text-editor .ql-picker {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .rich-text-editor .ql-picker-label {
          padding: 2px 8px !important;
          pointer-events: auto !important;
          cursor: pointer !important;
        }
        
        .rich-text-editor .ql-picker-options {
          background: rgba(30, 30, 30, 0.98) !important;
          border: 2px solid rgba(99, 102, 241, 0.4) !important;
          border-radius: 8px;
          padding: 8px;
          max-height: 300px;
          overflow-y: auto;
          backdrop-filter: blur(10px);
          z-index: 1000 !important;
        }
        
        .rich-text-editor .ql-picker-item {
          padding: 8px 12px !important;
          color: rgba(255, 255, 255, 0.9) !important;
          cursor: pointer !important;
          border-radius: 4px;
        }
        
        .rich-text-editor .ql-picker-item:hover {
          background: rgba(99, 102, 241, 0.2) !important;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: rgba(0, 0, 0, 0.35);
          font-style: normal;
          font-size: 15px;
        }
        
        .rich-text-editor .ql-stroke {
          stroke: rgba(255, 255, 255, 0.9);
        }
        
        .rich-text-editor .ql-fill {
          fill: rgba(255, 255, 255, 0.9);
        }
        
        .rich-text-editor .ql-picker-label {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: rgba(255, 255, 255, 0.4);
        }
        
        /* Dark mode support */
        .dark .rich-text-editor .ql-toolbar {
          background: rgba(0, 0, 0, 0.4);
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .dark .rich-text-editor .ql-container {
          background: rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .dark .rich-text-editor .ql-editor {
          color: white;
        }
        
        .dark .rich-text-editor .ql-toolbar button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .dark .rich-text-editor .ql-stroke {
          stroke: rgba(255, 255, 255, 0.8);
        }
        
        .dark .rich-text-editor .ql-fill {
          fill: rgba(255, 255, 255, 0.8);
        }
        
        .dark .rich-text-editor .ql-picker-label {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
}
