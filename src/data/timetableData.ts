// ------------------------------
// timetableData.ts
// ------------------------------

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const PERIODS = 8;

// time slots like your college PDF
export const PERIOD_TIMINGS = [
  "08:30–09:20",
  "09:20–10:10",
  "10:10–11:00",
  "11:00–11:50",
  "11:50–12:30",
  "12:30–01:15 (Lunch)",
  "01:15–02:05",
  "02:05–02:55",
];

// 🧑‍🏫 Teacher master list (short code like /KD, /SP etc.)
export interface Teacher {
  id: string;
  name: string;
  short: string;
  maxPerDay?: number;
}

export const TEACHERS: Teacher[] = [
  { id: "T1", name: "Ms. Kiran Dange", short: "KD", maxPerDay: 4 },
  { id: "T2", name: "Mr. Prashant Patil", short: "PP", maxPerDay: 4 },
  { id: "T3", name: "Ms. Sneha Joshi", short: "SJ", maxPerDay: 4 },
  { id: "T4", name: "Mr. Aniket More", short: "AM", maxPerDay: 4 },
];

// 📚 Subject list (codes like ITC, OOPS, DSA, MP)
export interface Subject {
  id: string;
  name: string;
  code: string;
  isLab?: boolean;
}

export const SUBJECTS: Subject[] = [
  { id: "S1", name: "Information Theory & Coding", code: "ITC" },
  { id: "S2", name: "Object Oriented Programming", code: "OOPS" },
  { id: "S3", name: "Digital Signal Processing", code: "DSP" },
  { id: "S4", name: "Microprocessor", code: "MP" },
  { id: "S5", name: "Microprocessor Lab", code: "MP-L", isLab: true },
  { id: "S6", name: "DSA Lab", code: "DSA-L", isLab: true },
];

// 🏫 Room / Lab list
export interface Room {
  id: string;
  name: string;
  type: "CLASS" | "LAB";
}

export const ROOMS: Room[] = [
  { id: "R1", name: "SCC-3", type: "CLASS" },
  { id: "R2", name: "TCC-1", type: "CLASS" },
  { id: "L1", name: "MP Lab", type: "LAB" },
  { id: "L2", name: "DSA Lab", type: "LAB" },
];

// 🎓 Course / Branch info
export interface Course {
  id: string;
  branch: string;
  semester: number;
  section: string;
}

export const COURSES: Course[] = [
  { id: "C1", branch: "CSE", semester: 3, section: "A" },
  { id: "C2", branch: "ECE", semester: 3, section: "A" },
];
