"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import ExtractionResults from "@/components/ExtractionResults";
import { ResumeData } from "@/types";

export default function Home() {
  const [extractedData, setExtractedData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      // Dynamically import the parser to avoid server-side issues
      const { parseResume } = await import("@/utils/parser");
      const data = await parseResume(file);
      setExtractedData(data);

      // ✅ Send ONLY skills data to backend for matching
      const response = await fetch("/api/save-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skills: data.skills, // Only send skills array
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send skills for matching");
      }

      const result = await response.json();
      console.log("Matching result:", result);
      setMatchResult(result.matchResult);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to process resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Updated redirect function with better error handling
  const handleRedirectToJobs = () => {
    if (!matchResult) {
      alert("No matching results available. Please upload a resume first.");
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        matchScore: matchResult.matchScore?.toString() || "0",
        matchedSkills: JSON.stringify(matchResult.matchedSkills || []),
        missingSkills: JSON.stringify(matchResult.missingSkills || []),
      });

      // Update the URL to match your React Job Portal URL
      const jobPortalUrl = `http://localhost:5173/matched-jobs?${queryParams}`;
      console.log("Redirecting to:", jobPortalUrl);

      // Try opening in new tab first
      const newWindow = window.open(jobPortalUrl, "_blank");

      // If popup is blocked, provide fallback
      if (!newWindow) {
        alert(`Popup blocked! Please navigate to: ${jobPortalUrl}`);
        // Fallback: redirect in same window
        window.location.href = jobPortalUrl;
      }
    } catch (error) {
      console.error("Error redirecting to jobs:", error);
      alert("Failed to redirect to jobs page. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Resume Parser</h1>

        <FileUpload onFileUpload={handleFileUpload} isLoading={loading} />

        {extractedData && (
          <div className="mt-8">
            <ExtractionResults data={extractedData} />
          </div>
        )}

        {matchResult && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-green-600">
              🎯 Skills Match Score: {matchResult.matchScore}%
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  ✅ Matched Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {matchResult.matchedSkills?.map(
                    (skill: string, index: number) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* 👇 HIDDEN Missing Skills Section (kept for logic, not visible) */}
              <div className="hidden">
                {matchResult.missingSkills &&
                  matchResult.missingSkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-red-600">
                        ⚠️ Missing Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.missingSkills.map(
                          (skill: string, index: number) => (
                            <span
                              key={index}
                              className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* 🚀 THIS IS THE  - THE REDIRECT BUTTON */}
            <div className="mt-6 text-center">
              <button
                onClick={handleRedirectToJobs}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                🎯 Find Matching Jobs
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Click to see jobs that match your skills
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
