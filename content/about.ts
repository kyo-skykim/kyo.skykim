// ============================================================
//  แก้ไขข้อมูลส่วนตัวทั้งหมดที่นี่
// ============================================================

export const profile = {
  name: "Chonlathit Phuncam",
  nickname: "Aomsin / Kyo",
  location: "Ratchaburi, Thailand",
  phone: "090-6324894",
  email: "phuncam.c@gmail.com",
  linkedin: "https://www.linkedin.com/in/chonlathitp",
  cv: "CV_Conlathit_Phuncam.pdf",
  summary:
    "Concepts: Data Engineer, Data Visualization, Data Modeling, Financial Mathematics. Bachelor of Science in Mathematics with coursework in Mathematical Analysis, Applied Mathematics and Elementary Statistics. Currently attending a Data Engineering through intensive bootcamp training. Adept at logical problem-solving and applying mathematical principles to analyze complex datasets and support data-driven decision-making.",
};

// ------------------------------------------------------------
//  ประสบการณ์ — เพิ่ม object ใหม่ใน array ได้เลย
// ------------------------------------------------------------
export const experience = [
  {
    year: "2023 – Present",
    role: "Mathematics Tutor & Develop a tutoring website",
    company: "Ratchaburi, Thailand",
    items: [
      "Developing website using the AI system.",
      "Create the student system and the system administrator system.",
      "Create a system for adding class schedules and courses.",
      "Analyzed student data to identify learning gaps and optimize teaching strategies.",
      "Simplified complex concepts for clear and effective communication.",
    ],
  },
  {
    year: "2021 – 2022",
    role: "Staff of Academic Olympiad Camp (POSN2)",
    company: "Silpakorn University",
    items: [
      "Collected and cleaned student data from Excel (survey responses)",
      "Built interactive dashboard using Looker Studio",
      "Analyzed food allergies, medical conditions, and insurance data",
      "Supported planning and risk management using data insights",
    ],
  },
  {
    year: "2020 – 2022",
    role: "Student Council",
    company: "Faculty of Science, Silpakorn University",
    items: [
      "Assisted in planning and managing faculty events with large student participation",
      "Promoted to vice leader in 2022",
    ],
  },
];

// ------------------------------------------------------------
//  Research / Projects — เพิ่ม pdf: "ชื่อไฟล์.pdf" ถ้ามีไฟล์
// ------------------------------------------------------------
export const research = [
  {
    year: "2026 ",
    title: "Automated Ethereum Data Pipeline & Anomaly Detection",
    type: "Independent Study",
    pdf: "kyo_miniproject_datapipeline for ETH.pdf",
    image: "eth_architecture_Aomsin.png",
    items: [
      "Developed an end-to-end ETL pipeline using Python to extract Ethereum data with robust error handling.",
      "Processed and transformed data using PySpark and Spark SQL on Databricks.",
      "Applied statistical methods using SQL window functions to detect price spikes and crashes.",
      "Designed dashboard to visualize data-driven insights.",
    ],
  },
  {
    year: "2022",
    title: "Injectivity and quasi-injectivity of products of some polynomials and Dedekind psi function",
    type: "Undergraduate Research Project",
     pdf: "Injectivity and quasi-injectivity of products  of some polynomials and Dedekind psi function.pdf",
    items: [
      "Applied MATLAB to analyze numerical patterns and detect duplicate function outputs",
      "Performed data matching and validation using Excel",
      "Documented findings and presented analytical results in a structured format",
    ],
  },
];

// ------------------------------------------------------------
//  การศึกษา
// ------------------------------------------------------------
export const education = [
  {
    year: "2026 – Present",
    degree: "Data Engineering Bootcamp (In Progress)",
    school: "Databricks for Data Engineers Bootcamp 2 · Thailand",
  },
  {
    year: "2017 – 2022",
    degree: "Bachelor of Science (Mathematics)",
    school: "Silpakorn University · Nakhon Pathom, Thailand",
  },
  {
    year: "2012 – 2017",
    degree: "Benjamarachutit Ratchaburi School",
    school: "Ratchaburi, Thailand",
  },
];

// ------------------------------------------------------------
//  ทักษะ — เพิ่ม category หรือ item ได้เลย
// ------------------------------------------------------------
export const skills = [
  {
    category: "Data Engineering",
    items: ["ETL/ELT Pipelines", "Data Modeling (Star Schema)", "Delta Lake"],
  },
  {
    category: "Data Analysis",
    items: ["EDA", "Statistical Analysis", "Data Cleaning"],
  },
  {
    category: "Data Visualization",
    items: ["Looker Studio", "Databricks", "Excel"],
  },
  {
    category: "Programming",
    items: ["Python", "PySpark", "NumPy", "Pandas", "SQL", "R", "MATLAB"],
  },
  {
    category: "Tools",
    items: ["Databricks", "Excel", "PowerPoint", "LaTeX", "AI"],
  },
];

// ------------------------------------------------------------
//  Certifications
// ------------------------------------------------------------
export const certifications = [
  "Data Science for Everyone — Future Skills (2026)",
  "Power BI Data Transformation (Power Query) — Future Skills (2026)",
  "AI with Data Visualization — Future Skills (2025)",
  "SQL for Data Analysis — Future Skills (2025)",
  "Push It with Data — Chula MOOC (2025)",
];

// ------------------------------------------------------------
//  ภาษา
// ------------------------------------------------------------
export const languages = [
  { lang: "Thai", level: "Native" },
  { lang: "English", level: "Intermediate" },
  { lang: "Japanese", level: "Beginning" },
];
