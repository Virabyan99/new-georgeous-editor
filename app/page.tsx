"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';

// Import monaco for type definitions only - this doesn't affect runtime
import type * as monaco from "monaco-editor";

// Dynamically import the Editor component to prevent SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function Home() {
  const [dividerPos, setDividerPos] = useState(50);
  const isResizing = useRef(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const decorationsRef = useRef<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection useEffect - already checks for window, no changes needed
  useEffect(() => {
    const setMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };
    const handleResize = () => {
      setMobile();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      setMobile();
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Console styling useEffect - no window access, no changes needed
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.style.fontSize = "14px";
      consoleRef.current.style.fontFamily = "Fira Code, monospace";
      consoleRef.current.style.lineHeight = "22px";
      consoleRef.current.style.padding = "10px";
    }
  }, []);

  // Modified handleEditorDidMount to dynamically import monaco-editor
  const handleEditorDidMount = async (editor: monaco.editor.IStandaloneCodeEditor) => {
    if (typeof window !== 'undefined') {
      const monaco = await import('monaco-editor');
      editorRef.current = editor;
      const handleResize = () => editor.layout();
      window.addEventListener('resize', handleResize);
      editor.onDidChangeModelContent(() => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(() => {
          addLastLineMarker(monaco);
        });
      });
      addLastLineMarker(monaco);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  };

  // Modified addLastLineMarker to accept monaco parameter
  const addLastLineMarker = (monaco: any) => {
    if (editorRef.current && typeof window !== 'undefined') {
      const editor = editorRef.current;
      const model = editor.getModel();
      if (!model) return;

      const lines = model.getLinesContent();
      const lastLineIndex = lines.length;
      const lastLineText = lines[lastLineIndex - 1] || "";
      const lastCharPosition = lastLineText.length + 1;
      const lastLineIsEmpty = lastLineText.trim() === "";

      const markerPosition = lastLineIsEmpty
        ? new monaco.Range(lastLineIndex, 1, lastLineIndex, 1)
        : new monaco.Range(lastLineIndex, lastCharPosition, lastLineIndex, lastCharPosition);

      const newDecorations = [
        {
          range: markerPosition,
          options: {
            isWholeLine: false,
            afterContentClassName: "line-marker",
          },
        },
      ];

      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    }
  };

  // Rest of the code (startResizing, stopResizing, handleMouseMove, runCode, return JSX) remains unchanged
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResizing);
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || typeof window === 'undefined') return;
  
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  
    animationFrameRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const containerDim = isMobile ? containerRef.current.offsetHeight : containerRef.current.offsetWidth;
      const newPos = isMobile 
        ? ((e.clientY - containerRef.current.getBoundingClientRect().top) / containerDim) * 100
        : ((e.clientX - containerRef.current.getBoundingClientRect().left) / containerDim) * 100;
  
      if (newPos > 20 && newPos < 80) {
        setDividerPos(newPos);
        if (editorRef.current) {
          editorRef.current.layout();
        }
      }
    });
  }, [isMobile]);

  const runCode = () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    setLogs([]);

    try {
      const capturedLogs: string[] = [];
      const originalConsoleLog = console.log;

      console.log = (...args) => {
        capturedLogs.push(args.join(" "));
        setLogs([...capturedLogs]);
      };

      new Function(code)();
      console.log = originalConsoleLog;
    } catch (error) {
      setLogs([`Error: ${error.message}`]);
    }
  };

  return (
    <div className="app-container" ref={containerRef}>
      <div className="editor-container" style={{ width: isMobile ? '100%' : `${dividerPos}%`, height: isMobile ? `${dividerPos}%` : '100%'}}>
        <Editor
          height="100%"
          width="100%"
          defaultLanguage="javascript"
          defaultValue="// Start coding here..."
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            fontSize: 14,
            fontFamily: "Fira Code, monospace",
            lineHeight: 22,
            lineNumbers: "off",
            minimap: { enabled: false },
            scrollbar: {
              vertical: "visible",
              horizontal: "auto",
              verticalScrollbarSize: 14,
              horizontalScrollbarSize: 8,
              useShadows: false,
            },
            overviewRulerLanes: 0,
            renderLineHighlight: "none",
            guides: { indentation: false },
            folding: false,
            wordWrap: "on",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorStyle: "line",
            padding: { top: 17 },
            scrollBeyondLastLine: false,
            quickSuggestions: true,
          }}
        />
      </div>

      <div className="divider" onMouseDown={startResizing} onDoubleClick={() => setDividerPos(50)} />

      <div className="console-container" ref={consoleRef} style={{ width: isMobile ? '100%' : `${100 - dividerPos}%`, height: isMobile ? `${100 - dividerPos}%` : '100%'}}>
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <pre key={index} className="console-line">{log}</pre>
          ))
        ) : (
          <pre className="console-content">// Console Output Goes Here</pre>
        )}
      </div>
    </div>
  );
}