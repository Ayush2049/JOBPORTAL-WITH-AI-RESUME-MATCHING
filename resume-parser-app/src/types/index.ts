export interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
  hasEOL?: boolean;
}

export interface ResumeData {
  profile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    url?: string;
  };
  objective?: string;
  education: Education[];
  experience: Experience[];
  skills: string[];
  sections: { [key: string]: string[] };
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

export interface Experience {
  organization: string;
  position: string;
  startDate: string;
  endDate: string;
  descriptions: string[];
}
