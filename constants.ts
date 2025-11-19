
import { Course, DayOfWeek, Instructor, Period, Role, Room, RoomType, ScheduleSession } from './types';

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    code: 'CS101',
    name: 'Intro to Computer Science',
    curriculum: 'New',
    hasLecture: true,
    hasSection: true,
    hasLab: true,
    hoursLecture: 2,
    hoursSection: 2,
    hoursLab: 2,
    totalHours: 6
  },
  {
    id: 'c2',
    code: 'MATH202',
    name: 'Linear Algebra',
    curriculum: 'Old',
    hasLecture: true,
    hasSection: true,
    hasLab: false,
    hoursLecture: 2,
    hoursSection: 2,
    hoursLab: 0,
    totalHours: 4
  },
  {
    id: 'c3',
    code: 'PHY101',
    name: 'Physics I',
    curriculum: 'New',
    hasLecture: true,
    hasSection: false,
    hasLab: true,
    hoursLecture: 2,
    hoursSection: 0,
    hoursLab: 4,
    totalHours: 6
  }
];

export const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: 'i1',
    name: 'Dr. Alan Turing',
    role: Role.Lecturer,
    department: 'CS',
    capableCourseIds: ['c1', 'c2'],
    workingDays: [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday],
    freeCampusDay: DayOfWeek.Friday,
    maxHoursPerWeek: 12,
    assignedHours: 0,
    canTeachBreak: false
  },
  {
    id: 'i2',
    name: 'Grace Hopper',
    role: Role.TA,
    department: 'CS',
    capableCourseIds: ['c1', 'c3'],
    workingDays: [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Saturday],
    freeCampusDay: DayOfWeek.Wednesday,
    maxHoursPerWeek: 18,
    assignedHours: 0,
    canTeachBreak: true
  },
  {
    id: 'i3',
    name: 'Isaac Newton',
    role: Role.Lecturer,
    department: 'Physics',
    capableCourseIds: ['c3', 'c2'],
    workingDays: [DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday],
    freeCampusDay: DayOfWeek.Tuesday,
    maxHoursPerWeek: 10,
    assignedHours: 0,
    canTeachBreak: false
  }
];

export const MOCK_ROOMS: Room[] = [
  { id: 'r1', name: 'Hall A', type: RoomType.LectureHall, capacity: 100 },
  { id: 'r2', name: 'Hall B', type: RoomType.LectureHall, capacity: 80 },
  { id: 'r3', name: 'Lab 101', type: RoomType.Lab, capacity: 30 },
  { id: 'r4', name: 'Lab 102', type: RoomType.Lab, capacity: 30 },
  { id: 'r5', name: 'Sec 201', type: RoomType.SectionRoom, capacity: 40 },
  { id: 'r6', name: 'Sec 202', type: RoomType.SectionRoom, capacity: 40 },
];

export const EMPTY_SCHEDULE: ScheduleSession[] = [];