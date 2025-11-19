
export enum DayOfWeek {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday'
}

export const DAYS = [
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday
];

export enum Period {
  P1A = 'P1A',    // 9:00 - 9:50
  P1B = 'P1B',    // 9:50 - 10:40
  P2A = 'P2A',    // 10:40 - 11:30
  P2B = 'P2B',    // 11:30 - 12:20
  Break = 'Break', // 12:20 - 1:10
  P3A = 'P3A',    // 1:10 - 2:00
  P3B = 'P3B'     // 2:00 - 2:50
}

export const PERIODS = [
  Period.P1A, Period.P1B, 
  Period.P2A, Period.P2B, 
  Period.Break, 
  Period.P3A, Period.P3B
];

export enum CourseType {
  Lecture = 'Lecture',
  Section = 'Section',
  Lab = 'Lab'
}

export enum Role {
  Lecturer = 'Lecturer',
  TA = 'TA'
}

export enum RoomType {
  LectureHall = 'Lecture Hall',
  SectionRoom = 'Section Room',
  Lab = 'Lab'
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  curriculum: 'New' | 'Old';
  hasLecture: boolean;
  hasSection: boolean;
  hasLab: boolean;
  hoursLecture: number;
  hoursSection: number;
  hoursLab: number;
  totalHours: number;
  preferredDay?: DayOfWeek; // New constraint
}

export interface Instructor {
  id: string;
  name: string;
  role: Role;
  department: string;
  capableCourseIds: string[];
  workingDays: DayOfWeek[]; // Must be 5 days
  freeCampusDay: DayOfWeek; // One of the 5 working days
  maxHoursPerWeek: number;
  assignedHours: number;
  canTeachBreak: boolean;
}

export interface ScheduleSession {
  id: string;
  courseId: string;
  instructorId: string;
  roomId: string | null;
  type: CourseType;
  day: DayOfWeek;
  period: Period;
  locked: boolean;
}

export interface ScheduleMetrics {
  totalSessions: number;
  unassignedSessions: number;
  conflicts: number;
}

export interface Conflict {
  sessionId: string;
  type: 'DoubleBooking' | 'RoomBusy' | 'ConstraintViolation' | 'Capacity';
  message: string;
}

export interface ScheduleHistoryItem {
  id: string;
  timestamp: Date;
  name: string;
  sessions: ScheduleSession[];
  failedCount: number;
}