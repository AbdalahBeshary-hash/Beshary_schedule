
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Course, Instructor, ScheduleSession, ScheduleMetrics, Room, Conflict, CourseType, ScheduleHistoryItem } from '../types';
import { MOCK_COURSES, MOCK_INSTRUCTORS, EMPTY_SCHEDULE, MOCK_ROOMS } from '../constants';
import { validateSchedule, generateSchedule } from '../services/scheduler';

interface AppState {
  courses: Course[];
  instructors: Instructor[];
  rooms: Room[];
  schedule: ScheduleSession[];
  metrics: ScheduleMetrics;
  conflicts: Conflict[];
  history: ScheduleHistoryItem[];
}

interface AppContextType extends AppState {
  addCourse: (c: Course) => void;
  addCoursesBulk: (c: Course[]) => void;
  updateCourse: (c: Course) => void;
  deleteCourse: (id: string) => void;
  addInstructor: (i: Instructor) => void;
  addInstructorsBulk: (i: Instructor[]) => void;
  updateInstructor: (i: Instructor) => void;
  deleteInstructor: (id: string) => void;
  addRoom: (r: Room) => void;
  addRoomsBulk: (r: Room[]) => void;
  updateRoom: (r: Room) => void;
  deleteRoom: (id: string) => void;
  setSchedule: (s: ScheduleSession[]) => void;
  updateSession: (s: ScheduleSession) => void;
  addHistoryVersion: (sessions: ScheduleSession[], failedCount: number) => void;
  restoreVersion: (historyId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [instructors, setInstructors] = useState<Instructor[]>(MOCK_INSTRUCTORS);
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [schedule, setSchedule] = useState<ScheduleSession[]>(EMPTY_SCHEDULE);
  const [metrics, setMetrics] = useState<ScheduleMetrics>({ totalSessions: 0, unassignedSessions: 0, conflicts: 0 });
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [history, setHistory] = useState<ScheduleHistoryItem[]>([]);

  // Recalculate metrics and assigned hours whenever schedule changes
  useEffect(() => {
    // 1. Update Assigned Hours
    const updatedInstructors = instructors.map(inst => {
      const hours = schedule
        .filter(s => s.instructorId === inst.id)
        .reduce((acc, curr) => acc + 0.83, 0); // Approx 50m = 0.83 hrs
      return { ...inst, assignedHours: Math.round(hours * 10) / 10 };
    });

    // Deep comparison check to avoid infinite re-renders
    if (JSON.stringify(updatedInstructors) !== JSON.stringify(instructors)) {
        setInstructors(updatedInstructors);
    }

    // 2. Validate Schedule
    const currentConflicts = validateSchedule(schedule, updatedInstructors, rooms);
    setConflicts(currentConflicts);

    setMetrics({
        totalSessions: schedule.length,
        unassignedSessions: 0, 
        conflicts: currentConflicts.length 
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, rooms]); 

  // INTERNAL AUTO-REGENERATION
  // Runs the solver while preserving locks, used after data changes
  const performAutoRegenerate = (currentCourses: Course[], currentSchedule: ScheduleSession[]) => {
      const result = generateSchedule({
          courses: currentCourses,
          instructors,
          rooms,
          currentSchedule,
          lockExisting: true // CRITICAL: Preserve locks on auto-updates
      });
      setSchedule(result.schedule);
  };

  const addCourse = (c: Course) => {
      const newCourses = [...courses, c];
      setCourses(newCourses);
      performAutoRegenerate(newCourses, schedule);
  };

  const addCoursesBulk = (newItems: Course[]) => {
      const newCourses = [...courses, ...newItems];
      setCourses(newCourses);
      performAutoRegenerate(newCourses, schedule);
  };
  
  const updateCourse = (c: Course) => {
    setCourses(courses.map(x => x.id === c.id ? c : x));
    
    // Clean up schedule: Remove sessions for components that are no longer active
    setSchedule(schedule.filter(s => {
      if (s.courseId !== c.id) return true;
      if (s.type === CourseType.Lecture && !c.hasLecture) return false;
      if (s.type === CourseType.Section && !c.hasSection) return false;
      if (s.type === CourseType.Lab && !c.hasLab) return false;
      return true;
    }));
  };

  const deleteCourse = (id: string) => {
    const newCourses = courses.filter(x => x.id !== id);
    setCourses(newCourses);
    const cleanedSchedule = schedule.filter(s => s.courseId !== id);
    setSchedule(cleanedSchedule);
    performAutoRegenerate(newCourses, cleanedSchedule);
  };

  const addInstructor = (i: Instructor) => setInstructors(prev => [...prev, i]);
  const addInstructorsBulk = (i: Instructor[]) => setInstructors(prev => [...prev, ...i]);

  const updateInstructor = (i: Instructor) => setInstructors(instructors.map(x => x.id === i.id ? i : x));
  const deleteInstructor = (id: string) => setInstructors(instructors.filter(x => x.id !== id));

  const addRoom = (r: Room) => setRooms(prev => [...prev, r]);
  const addRoomsBulk = (r: Room[]) => setRooms(prev => [...prev, ...r]);

  const updateRoom = (r: Room) => setRooms(rooms.map(x => x.id === r.id ? r : x));
  const deleteRoom = (id: string) => setRooms(rooms.filter(x => x.id !== id));

  const updateSession = (updatedSession: ScheduleSession) => {
    setSchedule(schedule.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const addHistoryVersion = (newSessions: ScheduleSession[], failedCount: number) => {
    const version: ScheduleHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      name: `Version ${history.length + 1}`,
      sessions: newSessions,
      failedCount
    };
    setHistory([version, ...history]);
    setSchedule(newSessions);
  };

  const restoreVersion = (historyId: string) => {
    const version = history.find(h => h.id === historyId);
    if (version) {
      setSchedule(version.sessions);
    }
  };

  return (
    <AppContext.Provider value={{
      courses,
      instructors,
      rooms,
      schedule,
      metrics,
      conflicts,
      history,
      addCourse,
      addCoursesBulk,
      updateCourse,
      deleteCourse,
      addInstructor,
      addInstructorsBulk,
      updateInstructor,
      deleteInstructor,
      addRoom,
      addRoomsBulk,
      updateRoom,
      deleteRoom,
      setSchedule,
      updateSession,
      addHistoryVersion,
      restoreVersion
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
