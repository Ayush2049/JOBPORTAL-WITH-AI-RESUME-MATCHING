import { extractTextItems, groupTextItemsIntoLines } from "./textProcessing";
import { ResumeData } from "@/types";
import {
  parseEducationSection,
  parseExperienceSection,
  parseSkillsSection,
} from "./sectionParsers";

export const parseResume = async (file: File): Promise<ResumeData> => {
  try {
    const textItems = await extractTextItems(file);

    // Try to preserve line structure better
    let rawText = textItems.map((t) => t.str).join(" ");

    // If the text is all in one line (common with PDFs), try to split it intelligently
    if (!rawText.includes("\n") && rawText.length > 200) {
      // Add line breaks before common section headers
      const sectionHeaders = [
        "EDUCATION",
        "EXPERIENCE",
        "WORK EXPERIENCE",
        "SKILLS",
        "TECHNICAL SKILLS",
        "PROJECTS",
        "PROJECTS / OPEN-SOURCE",
        "CERTIFICATIONS",
        "AWARDS",
        "HONORS",
      ];

      for (const header of sectionHeaders) {
        const regex = new RegExp(`\\b${header}\\b`, "gi");
        rawText = rawText.replace(regex, `\n${header}\n`);
      }

      // Also add line breaks before common patterns
      rawText = rawText
        .replace(/([a-z])\s+([A-Z][A-Z\s]+[A-Z])\s+/g, "$1\n$2\n") // Before UPPERCASE sections
        .replace(/(\d{4})\s*-\s*(\d{4}|\w+)/g, "$1 - $2") // Date ranges
        .replace(/([.!?])\s+([A-Z])/g, "$1\n$2") // After sentences
        .replace(/\|\s+/g, "\n"); // Split on pipe characters
    }

    console.log("Processed raw text:", rawText);

    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    console.log("Split lines:", lines);
    const sections = groupLinesIntoSections(lines);
    console.log("Grouped sections:", sections);
    return extractDataFromSections(sections);
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw new Error("Failed to parse resume");
  }
};

const groupLinesIntoSections = (
  lines: string[]
): { [key: string]: string[] } => {
  const sections: { [key: string]: string[] } = {};
  let currentSection = "PROFILE";
  sections[currentSection] = [];

  const knownHeaders = [
    "EDUCATION",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "PROJECTS",
    "PROJECTS / OPEN-SOURCE",
    "SKILLS",
    "TECHNICAL SKILLS",
    "CERTIFICATIONS",
    "AWARDS",
    "HONORS",
    "VOLUNTEER",
    "LANGUAGES",
    "REFERENCES",
    "CONTACT",
    "INTERESTS",
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const upperLine = trimmedLine.toUpperCase();

    // Check for exact section header matches
    const exactMatch = knownHeaders.find((header) => upperLine === header);

    if (exactMatch) {
      currentSection = exactMatch;
      sections[currentSection] = sections[currentSection] || [];
      console.log("Found section header:", exactMatch);
      continue;
    }

    // Check for partial matches (but be more restrictive)
    const partialMatch = knownHeaders.find((header) => {
      // Only match if the line is short (likely a header) and contains the section name
      if (trimmedLine.length > 50) return false;

      if (header === "SKILLS" || header === "TECHNICAL SKILLS") {
        return upperLine.includes("SKILL");
      }
      if (header === "PROJECTS / OPEN-SOURCE") {
        return (
          upperLine.includes("PROJECTS") && upperLine.includes("OPEN-SOURCE")
        );
      }
      return upperLine.includes(header);
    });

    if (partialMatch) {
      currentSection = partialMatch;
      sections[currentSection] = sections[currentSection] || [];
      console.log("Found partial section match:", partialMatch);
      continue;
    }

    // Add content to current section
    sections[currentSection] = sections[currentSection] || [];
    sections[currentSection].push(trimmedLine);
  }

  console.log("Final sections:", Object.keys(sections));
  return sections;
};

const extractDataFromSections = (sections: {
  [key: string]: string[];
}): ResumeData => {
  const resumeData: ResumeData = {
    profile: { name: "", email: "", phone: "", location: "" },
    education: [],
    experience: [],
    skills: [],
    sections,
  };

  console.log("Extracted skills:", resumeData.skills);

  if (sections.PROFILE) {
    const profileText = sections.PROFILE.join(" ");

    // Extract Name (first two capitalized words)
    const nameMatch = profileText.match(/\b([A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+)\b/);
    if (nameMatch) resumeData.profile.name = nameMatch[1];

    // Extract Email
    const emailMatch = profileText.match(/\b\S+@\S+\.\S+\b/);
    if (emailMatch) resumeData.profile.email = emailMatch[0];

    // Extract Phone
    const phoneMatch = profileText.match(/(\+?\d{1,3}[-.\s]?)?\d{10}/);
    if (phoneMatch) resumeData.profile.phone = phoneMatch[0];

    // Extract Location
    const locationMatch = profileText.match(
      /([A-Z][a-zA-Z\s]+(?:,|\-)\s?[A-Z][a-zA-Z\s]+(?:,?\s?\w{2,})?)/
    );
    if (locationMatch) resumeData.profile.location = locationMatch[0];
  }

  if (sections.EDUCATION)
    resumeData.education = parseEducationSection(sections.EDUCATION);
  if (sections.EXPERIENCE)
    resumeData.experience = parseExperienceSection(sections.EXPERIENCE);
  else if (sections["WORK EXPERIENCE"])
    resumeData.experience = parseExperienceSection(sections["WORK EXPERIENCE"]);

  // Enhanced skills section detection
  const skillsSections = ["SKILLS", "TECHNICAL SKILLS"];
  for (const sectionKey of skillsSections) {
    if (sections[sectionKey] && sections[sectionKey].length > 0) {
      console.log(
        `Processing skills from section: ${sectionKey}`,
        sections[sectionKey]
      );
      resumeData.skills = parseSkillsSection(sections[sectionKey]);
      break;
    }
  }

  // Fallback: look for any section that might contain skills
  if (resumeData.skills.length === 0) {
    for (const [sectionKey, sectionContent] of Object.entries(sections)) {
      if (
        sectionKey.includes("SKILL") ||
        sectionKey.includes("TECH") ||
        sectionContent.some(
          (line) =>
            line.toLowerCase().includes("skill") ||
            line.toLowerCase().includes("technology") ||
            line.toLowerCase().includes("programming") ||
            line.toLowerCase().includes("framework")
        )
      ) {
        console.log(
          `Found skills in fallback section: ${sectionKey}`,
          sectionContent
        );
        resumeData.skills = parseSkillsSection(sectionContent);
        break;
      }
    }
  }

  return resumeData;
};
