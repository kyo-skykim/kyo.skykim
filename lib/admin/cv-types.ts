export interface CvAboutData {
  profile: {
    name: string;
    nickname: string;
    location: string;
    phone: string;
    email: string;
    linkedin: string;
    github?: string;
    website?: string;
    cv: string;
    summary: string;
  };
  experience: Array<{
    year: string;
    role: string;
    company: string;
    items: string[];
  }>;
  research: Array<{
    year: string;
    title: string;
    type: string;
    pdf?: string;
    image?: string;
    items: string[];
  }>;
  education: Array<{
    year: string;
    degree: string;
    school: string;
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
  certifications: string[];
  languages: Array<{
    lang: string;
    level: string;
  }>;
}

export interface CvPreview {
  about: CvAboutData;
  rawText: string;
  totalPages: number;
  warnings: string[];
}
