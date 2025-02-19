"use client";
import { useState, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";

export default function Home() {
  const [dividerPos, setDividerPos] = useState(50);
  const isResizing = useRef(false);
  const editorRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const newPos = (e.clientX / containerWidth) * 100;
      
      if (newPos > 20 && newPos < 80) {
        setDividerPos(newPos);
      }
    });
  }, []);

  return (
    <div className="app-container" ref={containerRef}>
      <div className="editor-container" style={{ width: `${dividerPos}%` }}>
        <Editor
          height="100%"
          width="100%"
          defaultLanguage="javascript"
          defaultValue="// Start coding here..."
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true, // Enable Monaco's auto-layout
            fontSize: 16,
            fontFamily: "Fira Code, monospace",
            lineNumbers: "off",
            minimap: { enabled: false },
            scrollbar: { vertical: "hidden", horizontal: "hidden" },
            overviewRulerLanes: 0,
            renderLineHighlight: "none",
            guides: { indentation: false },
            folding: false,
            wordWrap: "on",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorStyle: "line",
            padding: { top: 10, bottom: 10 },
          }}
        />
      </div>

      <div className="divider" 
           onMouseDown={startResizing} 
           onDoubleClick={() => setDividerPos(50)} />

      <div className="console-container" 
           style={{ width: `${100 - dividerPos}%` }} />
    </div>
  );
}
