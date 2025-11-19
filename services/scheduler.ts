import { Course, CourseType, DayOfWeek, DAYS, Instructor, Period, PERIODS, ScheduleSession, Room, RoomType, Conflict } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface ScheduleRequest {
  courses: Course[];
  instructors: Instructor[];
  rooms: Room[];
  currentSchedule: ScheduleSession[];
  lockExisting: boolean;
}

interface FailureReport {
    courseCode: string;
    type: CourseType;
    reason: 'NO_INSTRUCTOR' | 'NO_ROOM' | 'NO_SLOT' | 'NO_TIME' | 'UNKNOWN';
}

// Map sub-periods to their logical group for consecutive checks
const PERIOD_SEQUENCE = [
  Period.P1A, Period.P1B,
  Period.P2A, Period.P2B,
  Period.Break,
  Period.P3A, Period.P3B
];

const getNextPeriod = (p: Period): Period | null => {
  const idx = PERIOD_SEQUENCE.indexOf(p);
  if (idx >= 0 && idx < PERIOD_SEQUENCE.length - 1) return PERIOD_SEQUENCE[idx + 1];
  return null;
};

// Helper: Map course type to required room type
const getRequiredRoomType = (cType: CourseType): RoomType => {
  switch (cType) {
    case CourseType.Lecture: return RoomType.LectureHall;
    case CourseType.Lab: return RoomType.Lab;
    case CourseType.Section: return RoomType.SectionRoom;
  }
};

/**
 * Determines the number of blocks required based on exact duration.
 * 0.83h -> 1 block (50 mins)
 * 1.67h -> 2 blocks (1h 40m)
 */
const getNeededBlocks = (c: Course) => {
  const requests: { courseId: string, type: CourseType, consecutive: boolean }[] = [];
  
  const processComponent = (has: boolean, hours: number, type: CourseType) => {
    if (!has || hours < 0.8) return; 
    
    let remaining = hours;
    while(remaining >= 0.8) { 
        if (remaining >= 1.5) { 
            requests.push({ courseId: c.id, type, consecutive: true });
            remaining -= 1.67;
        } else {
            requests.push({ courseId: c.id, type, consecutive: false });
            remaining -= 0.83;
        }
    }
  };

  processComponent(c.hasLecture, c.hoursLecture, CourseType.Lecture);
  processComponent(c.hasSection, c.hoursSection, CourseType.Section);
  processComponent(c.hasLab, c.hoursLab, CourseType.Lab);

  return requests;
};

/**
 * Custom Constraint Solver (OptaPlanner-style Greedy Construction with Constraints)
 */
export const generateSchedule = (request: ScheduleRequest): { schedule: ScheduleSession[], failures: FailureReport[] } => {
  const { courses, instructors, rooms, currentSchedule, lockExisting } = request;
  
  // Lock logic: if lockExisting, keep locked items. Otherwise start fresh.
  let schedule: ScheduleSession[] = lockExisting 
    ? currentSchedule.filter(s => s.locked) 
    : [];

  // 1. Identify all blocks needed
  let tasks: { id: string, courseId: string, type: CourseType, consecutive: boolean }[] = [];
  
  courses.forEach(c => {
    const needs = getNeededBlocks(c);
    needs.forEach(n => tasks.push({ ...n, id: generateId() }));
  });

  // Calculate what is already covered by locked sessions
  const lockedCounts: Record<string, number> = {}; 
  schedule.forEach(s => {
      const k = `${s.courseId}-${s.type}`;
      lockedCounts[k] = (lockedCounts[k] || 0) + 1;
  });

  const filteredTasks = [];
  for (const task of tasks) {
      const k = `${task.courseId}-${task.type}`;
      if ((lockedCounts[k] || 0) > 0) {
          if (task.consecutive) {
               if (lockedCounts[k] >= 2) {
                   lockedCounts[k] -= 2;
                   continue; 
               }
          } else {
              lockedCounts[k] -= 1;
              continue; 
          }
      }
      filteredTasks.push(task);
  }

  // 2. Sort tasks with Randomness to ensure different results on re-run
  filteredTasks.sort((a, b) => {
    // First priority: Structure (Consecutive is harder)
    if (a.consecutive && !b.consecutive) return -1;
    if (!a.consecutive && b.consecutive) return 1;
    
    // Second priority: Type difficulty
    const score = (t: CourseType) => t === CourseType.Lab ? 3 : t === CourseType.Lecture ? 2 : 1;
    if (score(a.type) > score(b.type)) return -1;
    if (score(a.type) < score(b.type)) return 1;
    
    // Heavy Randomization here to force different layouts
    return Math.random() - 0.5; 
  });

  const failures: FailureReport[] = [];
  const instructorLoad: Record<string, number> = {};
  instructors.forEach(i => instructorLoad[i.id] = 0);
  
  schedule.forEach(s => {
    if (instructorLoad[s.instructorId] !== undefined) {
      instructorLoad[s.instructorId] += 0.83; 
    }
  });

  // --- SOLVER LOOP ---
  for (const task of filteredTasks) {
    let placed = false;
    const course = courses.find(c => c.id === task.courseId)!;

    // Find capable instructors
    const capableInstructors = instructors.filter(i => 
      i.capableCourseIds.includes(task.courseId) &&
      (instructorLoad[i.id] + (task.consecutive ? 1.66 : 0.83) <= i.maxHoursPerWeek + 0.5) // Tolerance
    );
    
    if (capableInstructors.length === 0) {
        failures.push({ courseCode: course.code, type: task.type, reason: 'NO_INSTRUCTOR' });
        continue;
    }
    
    // Shuffle instructors 
    const shuffledInstructors = capableInstructors.sort(() => Math.random() - 0.5);
    
    // Find suitable rooms
    const requiredRoomType = getRequiredRoomType(task.type);
    const suitableRooms = rooms.filter(r => r.type === requiredRoomType).sort(() => Math.random() - 0.5);

    if (suitableRooms.length === 0) {
        failures.push({ courseCode: course.code, type: task.type, reason: 'NO_ROOM' });
        continue;
    }

    // Determine Days
    let targetDays = DAYS;
    if (course?.preferredDay) {
        const canBeScheduledOnPreferred = shuffledInstructors.some(inst => 
            inst.workingDays.includes(course.preferredDay!) && 
            inst.freeCampusDay !== course.preferredDay
        );
        if (canBeScheduledOnPreferred) {
            targetDays = [course.preferredDay];
        }
    }
    // Shuffle days deeply
    targetDays = [...targetDays].sort(() => Math.random() - 0.5);

    // Build slot pool
    const slots = [];
    for (const d of targetDays) {
      for (const p of PERIOD_SEQUENCE) {
        slots.push({ day: d, period: p });
      }
    }
    const shuffledSlots = slots.sort(() => Math.random() - 0.5);

    // Try to find a valid placement
    slotLoop:
    for (const instructor of shuffledInstructors) {
      if (placed) break;

      for (const room of suitableRooms) {
        if (placed) break;

        for (const slot of shuffledSlots) {
          const { day, period } = slot;

          const isSlotValid = (d: DayOfWeek, p: Period, instId: string, rId: string) => {
             const isBreak = p === Period.Break;
             const inst = instructors.find(i => i.id === instId)!;
             
             if (!inst.workingDays.includes(d)) return false;
             if (inst.freeCampusDay === d) return false;
             if (isBreak && !inst.canTeachBreak) return false;

             const occupied = schedule.some(s => 
                s.day === d && s.period === p && (s.instructorId === instId || s.roomId === rId)
             );
             return !occupied;
          };

          if (task.consecutive) {
            const nextP = getNextPeriod(period);
            const isAlignedStart = [Period.P1A, Period.P2A, Period.P3A].includes(period);
            if (!isAlignedStart) continue; 
            if (!nextP || nextP === Period.Break || period === Period.Break) continue; 

            if (isSlotValid(day, period, instructor.id, room.id) && 
                isSlotValid(day, nextP, instructor.id, room.id)) {
                
                schedule.push({
                   id: generateId(),
                   courseId: task.courseId,
                   instructorId: instructor.id,
                   roomId: room.id,
                   type: task.type,
                   day: day,
                   period: period,
                   locked: false
                });
                schedule.push({
                   id: generateId(),
                   courseId: task.courseId,
                   instructorId: instructor.id,
                   roomId: room.id,
                   type: task.type,
                   day: day,
                   period: nextP,
                   locked: false
                });
                
                instructorLoad[instructor.id] += 1.66;
                placed = true;
                break slotLoop;
            }
          } else {
            if (isSlotValid(day, period, instructor.id, room.id)) {
                schedule.push({
                   id: generateId(),
                   courseId: task.courseId,
                   instructorId: instructor.id,
                   roomId: room.id,
                   type: task.type,
                   day: day,
                   period: period,
                   locked: false
                });
                instructorLoad[instructor.id] += 0.83;
                placed = true;
                break slotLoop;
            }
          }
        }
      }
    }

    if (!placed) {
        failures.push({ courseCode: course.code, type: task.type, reason: 'NO_TIME' });
    }
  }

  return { schedule, failures };
};

export const validateSchedule = (
  schedule: ScheduleSession[], 
  instructors: Instructor[],
  rooms: Room[]
): Conflict[] => {
  const conflicts: Conflict[] = [];

  const slots: Record<string, ScheduleSession[]> = {};
  schedule.forEach(s => {
    const k = `${s.day}-${s.period}`;
    if (!slots[k]) slots[k] = [];
    slots[k].push(s);
  });

  Object.values(slots).forEach(sessionList => {
    const roomCounts: Record<string, number> = {};
    sessionList.forEach(s => {
      if (s.roomId) roomCounts[s.roomId] = (roomCounts[s.roomId] || 0) + 1;
    });
    for (const [rId, count] of Object.entries(roomCounts)) {
      if (count > 1) {
        const roomName = rooms.find(r => r.id === rId)?.name || "Unknown Room";
        const affected = sessionList.filter(s => s.roomId === rId);
        affected.forEach(s => conflicts.push({
             sessionId: s.id,
             type: 'DoubleBooking',
             message: `Room ${roomName} is double booked.`
        }));
      }
    }

    const instCounts: Record<string, number> = {};
    sessionList.forEach(s => {
      instCounts[s.instructorId] = (instCounts[s.instructorId] || 0) + 1;
    });
    for (const [iId, count] of Object.entries(instCounts)) {
      if (count > 1) {
        const instName = instructors.find(i => i.id === iId)?.name || "Unknown";
        const affected = sessionList.filter(s => s.instructorId === iId);
        affected.forEach(s => conflicts.push({
             sessionId: s.id,
             type: 'DoubleBooking',
             message: `${instName} is double booked.`
        }));
      }
    }
  });

  schedule.forEach(s => {
    const instructor = instructors.find(i => i.id === s.instructorId);
    if (instructor) {
       if (!instructor.workingDays.includes(s.day)) {
         conflicts.push({ sessionId: s.id, type: 'ConstraintViolation', message: `Not a working day for ${instructor.name}` });
       }
       if (instructor.freeCampusDay === s.day) {
         conflicts.push({ sessionId: s.id, type: 'ConstraintViolation', message: `Free day violation for ${instructor.name}` });
       }
       if (s.period === Period.Break && !instructor.canTeachBreak) {
         conflicts.push({ sessionId: s.id, type: 'ConstraintViolation', message: `Break violation for ${instructor.name}` });
       }
    }
    
    const room = rooms.find(r => r.id === s.roomId);
    if (room) {
       const reqType = getRequiredRoomType(s.type);
       if (room.type !== reqType) {
           conflicts.push({ sessionId: s.id, type: 'ConstraintViolation', message: `Room type mismatch: ${s.type} in ${room.type}` });
       }
    }
  });

  return conflicts;
};

export const isValidMove = (
  session: ScheduleSession, 
  newDay: DayOfWeek, 
  newPeriod: Period, 
  allSessions: ScheduleSession[],
  instructors: Instructor[],
  rooms: Room[]
): { valid: boolean, reason?: string } => {
  
  const instructor = instructors.find(i => i.id === session.instructorId);
  
  if (!instructor) return { valid: false, reason: 'Instructor not found' };

  if (!instructor.workingDays.includes(newDay)) return { valid: false, reason: 'Not a working day' };
  if (instructor.freeCampusDay === newDay) return { valid: false, reason: 'Free campus day' };
  if (newPeriod === Period.Break && !instructor.canTeachBreak) return { valid: false, reason: 'Cannot teach break' };

  const instConflict = allSessions.find(s => 
    s.day === newDay && s.period === newPeriod && s.instructorId === session.instructorId && s.id !== session.id
  );
  if (instConflict) return { valid: false, reason: 'Instructor busy' };

  if (session.roomId) {
    const roomConflict = allSessions.find(s => 
      s.day === newDay && s.period === newPeriod && s.roomId === session.roomId && s.id !== session.id
    );
    if (roomConflict) return { valid: false, reason: 'Room occupied' };
  }

  return { valid: true };
};