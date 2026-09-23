import React, { useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useTheme } from '../../contexts/ThemeContext';
import { RotateCcw, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange?: (language: string) => void;
  onReset?: () => void;
  onClear?: () => void;
  disableCopyPaste?: boolean;
  onPasteBlocked?: () => void;
  readOnly?: boolean;
  height?: string;
}

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
  onReset,
  onClear,
  disableCopyPaste = false,
  onPasteBlocked,
  readOnly = false,
  height = '100%',
}) => {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPasteAlert, setShowPasteAlert] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);

  // Map our language names to Monaco's supported languages
  const getMonacoLang = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'python':
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'c':
        return 'c';
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'javascript':
      case 'js':
        return 'javascript';
      default:
        return 'plaintext';
    }
  };

  const handlePasteAttempt = () => {
    if (!disableCopyPaste) return;
    setShowPasteAlert(true);
    if (onPasteBlocked) {
      onPasteBlocked();
    }
    setTimeout(() => {
      setShowPasteAlert(false);
    }, 4500);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define Dark Blue & Gold high-contrast coding theme
    monaco.editor.defineTheme('darkblue-gold', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '5c80b2', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'fbbf24', fontStyle: 'bold' },
        { token: 'string', foreground: 'fef08a' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'type', foreground: '93c5fd' },
        { token: 'function', foreground: 'ffffff', fontStyle: 'bold' },
        { token: 'variable', foreground: 'dce8f8' },
        { token: 'operator', foreground: 'eab308' },
      ],
      colors: {
        'editor.background': '#070f20',
        'editor.foreground': '#dce8f8',
        'editorLineNumber.foreground': '#2a4e8c',
        'editorLineNumber.activeForeground': '#fbbf24',
        'editor.selectionBackground': '#1e386780',
        'editor.inactiveSelectionBackground': '#162a4f60',
        'editorCursor.foreground': '#fbbf24',
        'editorWhitespace.foreground': '#162a4f',
        'editorGutter.background': '#070f20',
      },
    });

    monaco.editor.setTheme(theme === 'dark' ? 'darkblue-gold' : 'light');

    if (disableCopyPaste) {
      // Intercept and cancel Monaco internal paste action
      editor.onKeyDown((e) => {
        // Check for Ctrl+V or Cmd+V
        if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV) {
          e.preventDefault();
          e.stopPropagation();
          handlePasteAttempt();
        }
      });

      // Intercept browser native paste event inside the editor DOM
      const domNode = editor.getDomNode();
      if (domNode) {
        domNode.addEventListener('paste', (e: Event) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          handlePasteAttempt();
        }, true);

        // Disable right click context menu to prevent paste via mouse
        domNode.addEventListener('contextmenu', (e: Event) => {
          e.preventDefault();
        }, true);
      }
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-inner relative">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          {/* Language Selector */}
          {onLanguageChange && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Language:</span>
              <select
                value={language.toLowerCase()}
                onChange={(e) => onLanguageChange(e.target.value)}
                disabled={readOnly}
                className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-400 outline-none cursor-pointer"
              >
                <option value="python">Python 3</option>
                <option value="java">Java 11</option>
                <option value="c">C (GCC)</option>
                <option value="cpp">C++ (G++)</option>
              </select>
            </div>
          )}

          {/* Anti-Cheating Paste Disabled Badge */}
          {disableCopyPaste && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              Paste Disabled (Proctored)
            </span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(12, s - 1))}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="text-[11px] text-slate-400">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(20, s + 1))}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300"
              title="Increase font size"
            >
              A+
            </button>
          </div>

          {onClear && !readOnly && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-transparent hover:border-rose-800/50 transition"
              title="Clear all code in editor"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          {onReset && !readOnly && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Reset code to original starter template"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Anti-Cheating Warning Toast */}
      {showPasteAlert && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-50 bg-rose-600/95 text-white px-4 py-2.5 rounded-lg shadow-2xl flex items-center space-x-3 border border-rose-400 animate-bounce">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-white" />
          <div className="text-xs">
            <p className="font-bold">Clipboard Paste Blocked!</p>
            <p className="text-rose-100">External code pasting is prohibited in this assessment. This event has been recorded.</p>
          </div>
        </div>
      )}

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full relative">
        <Editor
          height={height}
          language={getMonacoLang(language)}
          value={value}
          theme={theme === 'dark' ? 'darkblue-gold' : 'light'}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            fontSize,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            formatOnPaste: false,
            contextmenu: !disableCopyPaste, // Disable Monaco contextmenu if paste is blocked
            quickSuggestions: true,
            bracketPairColorization: { enabled: true },
            padding: { top: 10, bottom: 10 },
          }}
        />
      </div>
    </div>
  );
};
