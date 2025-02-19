"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";

export default function Home() {
  const [dividerPos, setDividerPos] = useState(50);
  const isResizing = useRef(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const decorationsRef = useRef<string[]>([]); // Store active decorations

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Update marker dynamically when content changes
    editor.onDidChangeModelContent(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        addLastLineMarker();
      });
    });

    addLastLineMarker(); // Initial marker placement
  };

  // Function to add a single marker only on the last line
  const addLastLineMarker = () => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    const lines = model.getLinesContent();
    const lastLineIndex = lines.length; // Get last line index
    const lastLineText = lines[lastLineIndex - 1] || ""; // Get last line content

    const lastCharPosition = lastLineText.length + 1; // Position at the end of the last line
    const lastLineIsEmpty = lastLineText.trim() === "";

    // Determine where to place the marker
    const markerPosition = lastLineIsEmpty
      ? new monaco.Range(lastLineIndex, 1, lastLineIndex, 1) // Start of new line
      : new monaco.Range(lastLineIndex, lastCharPosition, lastLineIndex, lastCharPosition); // End of last word

    const newDecorations = [
      {
        range: markerPosition,
        options: {
          isWholeLine: false,
          afterContentClassName: "line-marker", // Attach marker at the correct place
        },
      },
    ];

    // Apply new decorations while keeping track of previous ones
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  };

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.style.fontSize = "16px";
      consoleRef.current.style.fontFamily = "Fira Code, monospace";
      consoleRef.current.style.lineHeight = "22px";
      consoleRef.current.style.padding = "10px";
    }
  }, []);

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
      {/* Monaco Editor */}
      <div className="editor-container" style={{ width: `${dividerPos}%` }}>
        <Editor
          height="100%"
          width="100%"
          defaultLanguage="javascript"
          defaultValue="// Start coding here..."
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            fontSize: 16,
            fontFamily: "Fira Code, monospace",
            lineHeight: 22,
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

      {/* Divider */}
      <div className="divider" onMouseDown={startResizing} onDoubleClick={() => setDividerPos(50)} />

      {/* Console Panel */}
      <div className="console-container" ref={consoleRef} style={{ width: `${100 - dividerPos}%` }}>
        <pre>// Console Output Goes Here</pre>
      </div>
    </div>
  );
}
