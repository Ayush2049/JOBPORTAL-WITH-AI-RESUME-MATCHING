"use client";

import { useEffect, useState } from "react";

interface PDFJSLoaderProps {
  children: React.ReactNode;
}

const PDFJSLoader: React.FC<PDFJSLoaderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPDFJS = async () => {
      if (typeof window !== "undefined" && !window.pdfjsLib && !window.PDFJS) {
        try {
          // Load the main PDF.js library
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });

          // Set up worker
          const pdfjs = window.pdfjsLib || window.PDFJS;
          pdfjs.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

          setIsLoaded(true);
        } catch (err) {
          setError("Failed to load PDF.js library");
          console.error("Error loading PDF.js:", err);
        }
      } else {
        setIsLoaded(true);
      }
    };

    loadPDFJS();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error: {error}. Please refresh the page and try again.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading PDF parser...</span>
      </div>
    );
  }

  return <>{children}</>;
};

export default PDFJSLoader;
