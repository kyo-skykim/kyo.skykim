// ============================================================
//  ข้อมูลทั้งหมดอยู่ใน content/about.json — แก้ที่นั่นได้เลย
//  ไฟล์นี้ re-export พร้อม TypeScript types เพื่อให้โค้ดที่เหลือใช้งานได้เหมือนเดิม
// ============================================================

import data from "./about.json";

export interface Profile {
  name: string;
  nickname: string;
  location: string;
  phone: string;
  email: string;
  linkedin: string;
  github?: string;
  website?: string;
  privacy?: {
    showLocation: boolean;
    showPhone: boolean;
    showEmail: boolean;
  };
  cv: string;
  summary: string;
}

export interface ExperienceItem {
  year: string;
  role: string;
  company: string;
  items: string[];
}

export interface ResearchItem {
  year: string;
  title: string;
  type: string;
  pdf?: string;
  image?: string;
  items: string[];
}

export interface EducationItem {
  year: string;
  degree: string;
  school: string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface LanguageItem {
  lang: string;
  level: string;
}

export const profile: Profile = data.profile;
export const experience: ExperienceItem[] = data.experience;
export const research: ResearchItem[] = data.research as ResearchItem[];
export const education: EducationItem[] = data.education;
export const skills: SkillCategory[] = data.skills;
export const certifications: string[] = data.certifications;
export const languages: LanguageItem[] = data.languages;
