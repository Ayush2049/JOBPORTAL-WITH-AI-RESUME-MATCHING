export interface ResumeData {
  profile: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };

  education: {
    institution?: string;
    degree?: string;
    date?: string;
    gpa?: string;
    description?: string[];
  }[];

  experience: {
    organization?: string;
    position?: string;
    date?: string;
    descriptions?: string[];
  }[];

  skills: string[];
  sections: Record<string, string[]>;
}
export interface MatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}
