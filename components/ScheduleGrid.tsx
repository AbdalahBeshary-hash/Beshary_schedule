import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DAYS, PERIODS, DayOfWeek, Period, ScheduleSession, CourseType, Role } from '../types';
import { generateSchedule, isValidMove } from '../services/scheduler';
import { Trash2, RefreshCw, Lock, Unlock, Move, AlertTriangle, MapPin, User, Book, Loader2, Sparkles, History, RotateCcw } from 'lucide-react';

type ViewMode = 'ALL' | 'LECTURER' | 'TA' | 'COURSE' | 'ROOM';

export const ScheduleGrid: React.FC = () => {
  const { schedule, courses, instructors, rooms, conflicts, history, setSchedule, updateSession, addHistoryVersion, restoreVersion } = useApp();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // View Filters
  const [viewMode, setViewMode] = useState<ViewMode>('ALL');
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Reset error msg when schedule changes
  useEffect(() => {
      if (schedule.length > 0 && errorMsg === "No sessions were generated.") {
          setErrorMsg(null);
      }
  }, [schedule, errorMsg]);

  const handleGenerate = (forceReset: boolean = false) => {
    setIsGenerating(true);
    setErrorMsg(null);

    // Use setTimeout to allow UI to render loading state
    setTimeout(() => {
        try {
            const result = generateSchedule({
                courses,
                instructors,
                rooms,
                currentSchedule: forceReset ? [] : schedule, // If force reset, pass empty array
                lockExisting: !forceReset // If force reset, ignore locks
            });
            
            // Always add a history version, even if partial
            addHistoryVersion(result.schedule, result.failures.length);
            
            if (result.failures.length > 0) {
                // Group failures by reason
                const noInst = result.failures.filter(f => f.reason === 'NO_INSTRUCTOR').length;
                const noRoom = result.failures.filter(f => f.reason === 'NO_ROOM').length;
                const noTime = result.failures.filter(f => f.reason === 'NO_TIME').length;

                const parts = [];
                if (noInst > 0) parts.push(`${noInst} No Instructor`);
                if (noRoom > 0) parts.push(`${noRoom} No Room`);
                if (noTime > 0) parts.push(`${noTime} No Slot`);

                setErrorMsg(`Generated with issues. Unscheduled: ${parts.join(', ')}`);
            } else if (result.schedule.length === 0) {
                setErrorMsg("No sessions generated. Check course hours.");
            } else {
                setErrorMsg(null);
            }
        } catch (e) {
            console.error(e);
            setErrorMsg("An internal error occurred during generation.");
        } finally {
            setIsGenerating(false);
        }
    }, 100); // Reduced delay for snappier feel
  };

  const handleHistoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      restoreVersion(e.target.value);
  };

  const handleCellClick = (day: DayOfWeek, period: Period, session?: ScheduleSession) => {
    if (moveMode && selectedSessionId) {
        // Moving...
        const sessionToMove = schedule.find(s => s.id === selectedSessionId);
        if (sessionToMove) {
            const validation = isValidMove(sessionToMove, day, period, schedule, instructors, rooms);
            if (validation.valid) {
                updateSession({ ...sessionToMove, day, period });
                setMoveMode(false);
                setSelectedSessionId(null);
                setErrorMsg(null);
            } else {
                setErrorMsg(validation.reason || "Invalid move");
            }
        }
    } else {
        // Selecting
        if (session) {
            setSelectedSessionId(session.id);
            setErrorMsg(null);
        } else {
            setSelectedSessionId(null);
        }
    }
  };

  const handleDelete = (id: string) => {
      setSchedule(schedule.filter(s => s.id !== id));
      setSelectedSessionId(null);
  };

  const handleToggleLock = (session: ScheduleSession) => {
      updateSession({ ...session, locked: !session.locked });
  };

  const getSessionStyle = (type: CourseType) => {
      switch(type) {
          case CourseType.Lecture: return "bg-blue-100 border-blue-300 text-blue-900";
          case CourseType.Lab: return "bg-orange-100 border-orange-300 text-orange-900";
          case CourseType.Section: return "bg-green-100 border-green-300 text-green-900";
          default: return "bg-gray-100";
      }
  };

  const getTimeLabel = (p: Period) => {
      switch(p) {
          case Period.P1A: return "9:00 - 9:50";
          case Period.P1B: return "9:50 - 10:40";
          case Period.P2A: return "10:40 - 11:30";
          case Period.P2B: return "11:30 - 12:20";
          case Period.Break: return "12:20 - 1:10";
          case Period.P3A: return "1:10 - 2:00";
          case Period.P3B: return "2:00 - 2:50";
          default: return "";
      }
  };

  // Filter Schedule based on View
  const filteredSchedule = useMemo(() => {
      return schedule.filter(s => {
          const inst = instructors.find(i => i.id === s.instructorId);
          if (viewMode === 'LECTURER') return inst?.role === Role.Lecturer;
          if (viewMode === 'TA') return inst?.role === Role.TA;
          if (viewMode === 'COURSE') return s.courseId === selectedCourseId;
          if (viewMode === 'ROOM') return s.roomId === selectedRoomId;
          return true;
      });
  }, [schedule, viewMode, selectedCourseId, selectedRoomId, instructors]);

  const PERIOD_GROUPS = [
      { label: 'Period 1 (9:00 - 10:40)', periods: [Period.P1A, Period.P1B] },
      { label: 'Period 2 (10:40 - 12:20)', periods: [Period.P2A, Period.P2B] },
      { label: 'Break (12:20 - 1:10)', periods: [Period.Break] },
      { label: 'Period 3 (1:10 - 2:50)', periods: [Period.P3A, Period.P3B] },
  ];

  return (
    <div className="h-full flex flex-col space-y-4 relative">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-1">Optimizing Schedule</h3>
                <p className="text-gray-500 text-sm">Finding best slots & shuffling...</p>
            </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4 z-20 relative">
        <div className="flex items-center gap-4 flex-wrap">
             <div className="flex bg-gray-100 p-1 rounded-lg">
                 <button onClick={() => setViewMode('ALL')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>All</button>
                 <button onClick={() => setViewMode('LECTURER')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'LECTURER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Lecturers</button>
                 <button onClick={() => setViewMode('TA')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'TA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>TAs</button>
                 <button onClick={() => setViewMode('COURSE')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'COURSE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>By Course</button>
                 <button onClick={() => setViewMode('ROOM')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'ROOM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>By Room</button>
             </div>
             
             {viewMode === 'COURSE' && (
                 <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="border border-gray-300 rounded-md text-sm p-1.5 outline-none focus:ring-2 focus:ring-indigo-500">
                     <option value="">Select Course...</option>
                     {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                 </select>
             )}

             {viewMode === 'ROOM' && (
                 <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} className="border border-gray-300 rounded-md text-sm p-1.5 outline-none focus:ring-2 focus:ring-indigo-500">
                     <option value="">Select Room...</option>
                     {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                 </select>
             )}
        </div>

        <div className="flex items-center space-x-3">
             {/* History Dropdown */}
             {history.length > 0 && (
                 <div className="flex items-center gap-2 border-r border-gray-200 pr-4 mr-1">
                     <History className="w-4 h-4 text-gray-400" />
                     <select 
                        value={history[0]?.id} // Default to latest
                        onChange={handleHistoryChange} 
                        className="text-sm bg-gray-50 border-gray-200 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-medium cursor-pointer hover:bg-gray-100 transition-colors max-w-[150px]"
                     >
                         {history.map((h, index) => (
                             <option key={h.id} value={h.id}>
                                 {h.name} ({h.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                             </option>
                         ))}
                     </select>
                 </div>
             )}

             {errorMsg && (
                 <span className="text-red-500 text-xs font-medium flex items-center animate-pulse bg-red-50 px-2 py-1 rounded border border-red-100 truncate max-w-[200px]" title={errorMsg}>
                     <AlertTriangle className="w-3 h-3 mr-1" /> {errorMsg}
                 </span>
             )}
             
             <button 
                onClick={() => handleGenerate(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Reset & Regenerate from Scratch"
             >
                <RotateCcw className="w-4 h-4" />
             </button>

             <button 
                onClick={() => handleGenerate(false)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-all active:scale-95 text-sm font-medium shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-4 h-4" />
                <span>Auto-Generate</span>
             </button>
        </div>
      </div>

      {/* Transposed Grid (X=Time, Y=Day) */}
      <div className="flex-1 overflow-auto bg-white rounded-lg shadow border border-gray-200 relative z-10">
        <div className="min-w-[1400px]">
            {/* Header Row (Periods) */}
            <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 sticky top-0 z-30 shadow-sm">
                <div className="p-3 text-center font-bold text-gray-500 border-r bg-gray-100 flex items-center justify-center sticky left-0 z-40">
                    <span className="text-xs uppercase tracking-wider">Day / Time</span>
                </div>
                {PERIOD_GROUPS.map((group, i) => (
                  <div key={i} className="flex-1 flex border-r last:border-r-0">
                     {group.periods.map((period, j) => (
                       <div key={period} className={`flex-1 p-2 text-center border-r last:border-r-0 flex flex-col justify-center ${period === Period.Break ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-600'}`}>
                           <span className="text-xs font-semibold block">{period.includes('A') ? group.label.split('(')[0] + ' (A)' : period.includes('B') ? group.label.split('(')[0] + ' (B)' : period}</span>
                           <span className="text-[10px] opacity-75 font-mono">{getTimeLabel(period)}</span>
                       </div>
                     ))}
                  </div>
                ))}
            </div>

            {/* Days Rows */}
            {DAYS.map((day) => (
                <div key={day} className="grid grid-cols-8 border-b border-gray-100 min-h-[120px]">
                    {/* Day Label */}
                    <div className="p-4 border-r border-gray-200 flex flex-col justify-center items-center text-gray-700 font-bold bg-gray-50 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <span>{day}</span>
                    </div>

                    {/* Periods Columns */}
                    {PERIOD_GROUPS.map((group, i) => (
                        <div key={i} className="flex-1 flex border-r last:border-r-0">
                            {group.periods.map((period) => {
                                const cellSessions = filteredSchedule.filter(s => s.day === day && s.period === period);
                                const isBreak = period === Period.Break;

                                return (
                                    <div 
                                        key={`${day}-${period}`} 
                                        onClick={() => cellSessions.length === 0 && !isBreak && handleCellClick(day, period)}
                                        className={`
                                            flex-1 border-r last:border-r-0 p-1 transition-colors cursor-pointer relative
                                            ${isBreak ? 'bg-gray-100/50' : moveMode && cellSessions.length === 0 ? 'hover:bg-indigo-50 bg-indigo-50/30' : 'hover:bg-gray-50'}
                                        `}
                                    >
                                        <div className="flex flex-col gap-1 h-full">
                                            {cellSessions.map(session => {
                                                const course = courses.find(c => c.id === session.courseId);
                                                const instructor = instructors.find(i => i.id === session.instructorId);
                                                const room = rooms.find(r => r.id === session.roomId);
                                                const isSelected = session.id === selectedSessionId;
                                                const sessionConflicts = conflicts.filter(c => c.sessionId === session.id);
                                                const hasConflict = sessionConflicts.length > 0;

                                                return (
                                                    <div 
                                                        key={session.id}
                                                        onClick={(e) => { e.stopPropagation(); handleCellClick(day, period, session); }}
                                                        className={`
                                                            w-full p-1.5 rounded-md border text-[10px] flex flex-col relative group shadow-sm transition-all
                                                            ${getSessionStyle(session.type)}
                                                            ${isSelected ? 'ring-2 ring-indigo-500 z-20 shadow-md scale-[1.02]' : ''}
                                                            ${hasConflict ? 'ring-2 ring-red-500 bg-red-50' : ''}
                                                        `}
                                                    >
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <span className="font-bold flex items-center gap-1 truncate">
                                                                {course?.code}
                                                                {hasConflict && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                                            </span>
                                                            {session.locked && <Lock className="w-2.5 h-2.5 opacity-50" />}
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1 opacity-90 truncate">
                                                            <User className="w-2.5 h-2.5" />
                                                            <span className="truncate font-semibold">{instructor?.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-90 truncate">
                                                            <MapPin className="w-2.5 h-2.5" />
                                                            <span className="truncate">{room?.name || 'No Room'}</span>
                                                        </div>

                                                        {/* Conflict Tooltip */}
                                                        {hasConflict && isSelected && (
                                                            <div className="absolute bottom-full left-0 mb-1 w-48 bg-red-100 text-red-800 p-2 rounded shadow-lg text-[10px] z-50 border border-red-200">
                                                                {sessionConflicts.map((c, idx) => <div key={idx}>• {c.message}</div>)}
                                                            </div>
                                                        )}

                                                        {/* Action Menu */}
                                                        {isSelected && !moveMode && (
                                                            <div className="absolute -bottom-2 -right-2 flex bg-white shadow-lg rounded-md border p-0.5 z-30 scale-90">
                                                                <button onClick={(e) => { e.stopPropagation(); setMoveMode(true); }} className="p-1 hover:bg-blue-50 text-blue-600 rounded"><Move className="w-3 h-3" /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleToggleLock(session); }} className="p-1 hover:bg-gray-50 text-gray-600 rounded">{session.locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}</button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }} className="p-1 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-3 h-3" /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            
                                            {cellSessions.length === 0 && moveMode && !isBreak && (
                                                <div className="w-full h-full flex items-center justify-center opacity-50 hover:opacity-100">
                                                    <span className="text-[10px] text-indigo-400 font-bold bg-white/80 px-2 py-1 rounded border border-indigo-200">Drop</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};