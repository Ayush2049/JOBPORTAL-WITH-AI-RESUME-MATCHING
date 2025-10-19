// ------------------------
// Education Section Parser
// ------------------------
export const parseEducationSection = (lines: string[]): any[] => {
  const education: any[] = [];
  let currentEdu: any = {};

  const educationPatterns = [
    /university|college|institute|school|academy/i,
    /bachelor|master|phd|m\.?tech|b\.?tech|m\.?sc|b\.?sc|m\.?com|b\.?com/i,
    /gpa|grade|percentage|%/i,
    /\b(20\d{2})\b.*\b(20\d{2}|present)\b/, // Date ranges
  ];

  for (const line of lines) {
    const isNewEntry =
      educationPatterns.some((p) => p.test(line)) &&
      (line.length > 10 || Object.keys(currentEdu).length > 0);

    if (isNewEntry && Object.keys(currentEdu).length > 0) {
      education.push(currentEdu);
      currentEdu = {};
    }

    if (
      /(university|college|institute)/i.test(line) &&
      !currentEdu.institution
    ) {
      currentEdu.institution = line;
    } else if (/(bachelor|master|phd|m\.?tech|b\.?tech)/i.test(line)) {
      currentEdu.degree = line;
    } else if (line.match(/\b(20\d{2}).*(20\d{2}|present)\b/)) {
      currentEdu.date = line;
    } else if (line.match(/gpa|grade|%/i)) {
      currentEdu.gpa = line;
    } else {
      if (!currentEdu.description) currentEdu.description = [];
      currentEdu.description.push(line);
    }
  }

  if (Object.keys(currentEdu).length > 0) education.push(currentEdu);
  return education;
};

// ------------------------
// Experience Section Parser
// ------------------------
export const parseExperienceSection = (lines: string[]): any[] => {
  const experience: any[] = [];
  let currentExp: any = {};
  let descriptions: string[] = [];

  for (const line of lines) {
    const isNewEntry =
      (line.includes("•") || line.match(/\b(20\d{2}|present)\b/)) &&
      Object.keys(currentExp).length > 0;

    if (isNewEntry && Object.keys(currentExp).length > 0) {
      if (descriptions.length > 0) currentExp.descriptions = [...descriptions];
      experience.push(currentExp);
      currentExp = {};
      descriptions = [];
    }

    if (!currentExp.organization && !line.startsWith("•")) {
      const parts = line.split("|");
      if (parts.length >= 2) {
        currentExp.organization = parts[0].trim();
        currentExp.position = parts[1].trim();
      } else {
        currentExp.organization = line;
      }
    } else if (line.match(/\b(20\d{2}).*(20\d{2}|present)\b/)) {
      currentExp.date = line;
    } else if (line.startsWith("•")) {
      descriptions.push(line.replace(/^•/, "").trim());
    } else if (line.trim().length > 0) {
      if (!currentExp.notes) currentExp.notes = [];
      currentExp.notes.push(line);
    }
  }

  if (Object.keys(currentExp).length > 0) {
    if (descriptions.length > 0) currentExp.descriptions = [...descriptions];
    experience.push(currentExp);
  }

  return experience;
};

// ------------------------
// Skills Section Parser (Based on Working Manual Test)
// ------------------------
export const parseSkillsSection = (lines: string[]): string[] => {
  console.log("Skills section input lines:", lines);

  const skills: string[] = [];

  // Headers to skip (exactly matching the working test)
  const skipHeaders = [
    "programming languages",
    "libraries/frameworks",
    "tools / platforms",
    "tools/platforms",
    "databases",
    "skills",
    "technical skills",
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const lowerLine = trimmedLine.toLowerCase();

    // Skip category headers
    if (skipHeaders.includes(lowerLine)) {
      console.log("Skipping header:", trimmedLine);
      continue;
    }

    // Extract skills from the line
    let lineSkills: string[] = [];

    // Check for comma-separated skills
    if (trimmedLine.includes(",")) {
      lineSkills = trimmedLine
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);
      console.log(`From line "${trimmedLine}":`, lineSkills);
    } else {
      // Single skill per line
      lineSkills = [trimmedLine];
      console.log(`From line "${trimmedLine}":`, lineSkills);
    }

    // Add skills (minimal filtering to match the working test)
    const validSkills = lineSkills.filter(
      (skill) =>
        skill.length > 0 && skill.length < 50 && !skill.match(/^[•\-:\s]+$/)
    );

    skills.push(...validSkills);
  }

  // Remove duplicates and return
  const uniqueSkills = [...new Set(skills)].sort();
  console.log("Final extracted skills:", uniqueSkills);

  return uniqueSkills;
};
