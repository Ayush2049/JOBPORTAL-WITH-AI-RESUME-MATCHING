"use client";

import { useEffect, useState } from "react";

// ✅ IMPORTANT: import LEGACY build explicitly
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

interface PDFJSLoaderProps {
  children: React.ReactNode;
}

const PDFJSLoader: React.FC<PDFJSLoaderProps> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      /**
       * ✅ CRITICAL LINE
       * Worker MUST come from the SAME legacy build
       * and MUST be set synchronously.
       */
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();

      setReady(true);
    } catch (err) {
      console.error("PDF.js worker setup failed:", err);
      setError("Failed to initialize PDF parser");
    }
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        <span className="ml-3">Loading PDF parser…</span>
      </div>
    );
  }

  return <>{children}</>;
};

export default PDFJSLoader;
