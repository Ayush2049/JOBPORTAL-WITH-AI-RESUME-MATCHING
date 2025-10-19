import { NextRequest, NextResponse } from "next/server";

const JOBBY_PORTAL_URL =
  process.env.JOBBY_PORTAL_URL || "http://localhost:5000";

export async function POST(request: NextRequest) {
  try {
    const resumeData = await request.json();
    const skills = resumeData.skills || [];

    console.log(
      "Attempting to connect to:",
      `${JOBBY_PORTAL_URL}/api/v1/resume/match-public`
    );

    // ✅ Use the public endpoint
    const jobbyPortalResponse = await fetch(
      `${JOBBY_PORTAL_URL}/api/v1/resume/match-public`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "current-user",
          jobId: "target-job",
          parsedData: {
            skills: skills,
            experience: 0,
            education: "",
            certifications: [],
            languages: [],
          },
        }),
      }
    );

    if (!jobbyPortalResponse.ok) {
      const errorText = await jobbyPortalResponse.text();
      console.error("Backend error response:", errorText);
      throw new Error(
        `Jobby Portal API error: ${jobbyPortalResponse.status} - ${errorText}`
      );
    }

    const matchResult = await jobbyPortalResponse.json();

    return NextResponse.json({
      success: true,
      message: "Skills data sent for matching",
      matchResult: matchResult,
    });
  } catch (error) {
    console.error("Error sending skills data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send skills for matching",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
