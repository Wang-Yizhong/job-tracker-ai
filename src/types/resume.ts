// 统一类型定义，前后端、公用工具都引用它

export type ExperienceItem = {
  company: string;
  role: string;
  period: string;
  location?: string;
  highlights: string[];
};

export type EducationItem = {
  school: string;
  degree?: string;
  period?: string;
};

export type ResumeData = {
  name: string;
  title?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  summary?: string;
  skills: string[];
  experiences: ExperienceItem[];
  education?: EducationItem[];
};
