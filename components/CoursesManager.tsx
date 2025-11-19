
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Course, DAYS, DayOfWeek } from '../types';
import { Plus, Edit2, Trash2, X, BookOpen, Clock, FileText, Monitor, Calendar, Users, Check, Upload } from 'lucide-react';

export const CoursesManager: React.FC = () => {
  const { courses, instructors, addCourse, addCoursesBulk, updateCourse, deleteCourse, updateInstructor } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 0.83 hours approx 50 mins, 1.67 hours approx 1h 40m
  const [formData, setFormData] = useState<Partial<Course>>({
    code: '',
    name: '',
    curriculum: 'New',
    hasLecture: true,
    hasSection: true,
    hasLab: false,
    hoursLecture: 1.67,
    hoursSection: 1.67,
    hoursLab: 0,
    preferredDay: undefined
  });

  const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>([]);
  const [bulkText, setBulkText] = useState("");

  const calculateTotal = (data: Partial<Course>) => {
    const l = data.hasLecture ? (data.hoursLecture || 0) : 0;
    const s = data.hasSection ? (data.hoursSection || 0) : 0;
    const b = data.hasLab ? (data.hoursLab || 0) : 0;
    return Math.round((l + s + b) * 100) / 100;
  };

  const openModal = (course?: Course) => {
    if (course) {
      setEditingId(course.id);
      setFormData({ ...course });
      const capableIds = instructors
        .filter(i => i.capableCourseIds.includes(course.id))
        .map(i => i.id);
      setSelectedInstructorIds(capableIds);
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        name: '',
        curriculum: 'New',
        hasLecture: true,
        hasSection: false,
        hasLab: false,
        hoursLecture: 1.67, // Default to 1h 40m
        hoursSection: 0,
        hoursLab: 0,
        preferredDay: undefined
      });
      setSelectedInstructorIds([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) return;

    const sanitizedData = { ...formData };
    const defaultDuration = 1.67; 

    if (sanitizedData.hasLecture && (sanitizedData.hoursLecture || 0) <= 0.1) sanitizedData.hoursLecture = defaultDuration;
    if (sanitizedData.hasSection && (sanitizedData.hoursSection || 0) <= 0.1) sanitizedData.hoursSection = defaultDuration;
    if (sanitizedData.hasLab && (sanitizedData.hoursLab || 0) <= 0.1) sanitizedData.hoursLab = defaultDuration;

    if (!sanitizedData.hasLecture) sanitizedData.hoursLecture = 0;
    if (!sanitizedData.hasSection) sanitizedData.hoursSection = 0;
    if (!sanitizedData.hasLab) sanitizedData.hoursLab = 0;

    const totalHours = calculateTotal(sanitizedData);
    if (totalHours === 0) {
      alert("Course must have at least one component with hours assigned.");
      return;
    }

    const courseId = editingId || Math.random().toString(36).substr(2, 9);

    const course: Course = {
      id: courseId,
      code: sanitizedData.code!,
      name: sanitizedData.name!,
      curriculum: sanitizedData.curriculum as 'New' | 'Old',
      hasLecture: sanitizedData.hasLecture || false,
      hasSection: sanitizedData.hasSection || false,
      hasLab: sanitizedData.hasLab || false,
      hoursLecture: sanitizedData.hoursLecture || 0,
      hoursSection: sanitizedData.hoursSection || 0,
      hoursLab: sanitizedData.hoursLab || 0,
      totalHours: totalHours,
      preferredDay: sanitizedData.preferredDay
    };

    if (editingId) {
      updateCourse(course);
    } else {
      addCourse(course);
    }

    instructors.forEach(inst => {
        const shouldHave = selectedInstructorIds.includes(inst.id);
        const currentlyHas = inst.capableCourseIds.includes(courseId);

        if (shouldHave && !currentlyHas) {
            updateInstructor({
                ...inst,
                capableCourseIds: [...inst.capableCourseIds, courseId]
            });
        } else if (!shouldHave && currentlyHas) {
            updateInstructor({
                ...inst,
                capableCourseIds: inst.capableCourseIds.filter(id => id !== courseId)
            });
        }
    });

    setIsModalOpen(false);
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
    const newCourses: Course[] = lines.map(line => {
        // Try to split by " - " or "-" or just use whole line as name
        let code = "";
        let name = "";
        
        if (line.includes('-')) {
            const parts = line.split('-');
            code = parts[0].trim().toUpperCase();
            name = parts.slice(1).join('-').trim();
        } else {
            code = "C" + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 100);
            name = line.trim();
        }

        if (name) {
             return {
                id: Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 4),
                code: code,
                name: name,
                curriculum: 'New',
                hasLecture: true,
                hasSection: true,
                hasLab: false,
                hoursLecture: 1.67,
                hoursSection: 1.67,
                hoursLab: 0,
                totalHours: 3.34
             };
        }
        return null;
    }).filter(c => c !== null) as Course[];

    addCoursesBulk(newCourses);

    setBulkText("");
    setIsBulkOpen(false);
  };

  const toggleInstructorSelection = (instId: string) => {
      if (selectedInstructorIds.includes(instId)) {
          setSelectedInstructorIds(selectedInstructorIds.filter(id => id !== instId));
      } else {
          setSelectedInstructorIds([...selectedInstructorIds, instId]);
      }
  };

  const ComponentToggle = ({ 
    label, 
    icon: Icon, 
    active, 
    hours, 
    onToggle, 
    onHoursChange,
    colorClass
  }: any) => (
    <div className={`p-4 rounded-xl border-2 transition-all ${active ? `border-${colorClass}-500 bg-${colorClass}-50` : 'border-gray-100 bg-white opacity-70'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${active ? `text-${colorClass}-600` : 'text-gray-400'}`} />
          <span className={`font-semibold ${active ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={active} 
            onChange={e => {
                const isChecking = e.target.checked;
                if (isChecking && (!hours || hours === 0)) {
                    onHoursChange(1.67);
                }
                onToggle(isChecking);
            }} 
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>
      {active && (
        <div className="flex items-center gap-2 animate-fade-in mt-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <select 
            value={hours && hours > 1 ? 1.67 : 0.83}
            onChange={e => onHoursChange(Number(e.target.value))}
            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-gray-700"
          >
            <option value={0.83}>50 Mins (1 Slot)</option>
            <option value={1.67}>1h 40m (2 Slots)</option>
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Course Catalog</h1>
          <p className="text-gray-500">Define courses, curricula, and time requirements for lectures, labs, and sections.</p>
        </div>
        <div className="flex gap-3">
             <button 
              onClick={() => setIsBulkOpen(true)}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              <Upload className="w-4 h-4" /> Bulk Import
            </button>
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Course
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => (
          <div key={course.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative group">
             <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded font-bold tracking-wide uppercase">{course.code}</span>
                    {course.preferredDay && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {course.preferredDay.substring(0,3)}
                        </span>
                    )}
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full border ${course.curriculum === 'New' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {course.curriculum} Curr.
                </span>
             </div>
             <h3 className="text-lg font-bold text-gray-800 mb-4 leading-tight">{course.name}</h3>
             
             <div className="space-y-2 mb-6">
               {course.hasLecture && (
                 <div className="flex items-center text-sm text-gray-600">
                   <FileText className="w-4 h-4 mr-2 text-blue-500" /> Lecture: <span className="font-semibold ml-1">{course.hoursLecture > 1 ? '1h 40m' : '50m'}</span>
                 </div>
               )}
               {course.hasSection && (
                 <div className="flex items-center text-sm text-gray-600">
                   <BookOpen className="w-4 h-4 mr-2 text-purple-500" /> Section: <span className="font-semibold ml-1">{course.hoursSection > 1 ? '1h 40m' : '50m'}</span>
                 </div>
               )}
               {course.hasLab && (
                 <div className="flex items-center text-sm text-gray-600">
                   <Monitor className="w-4 h-4 mr-2 text-green-500" /> Lab: <span className="font-semibold ml-1">{course.hoursLab > 1 ? '1h 40m' : '50m'}</span>
                 </div>
               )}
             </div>

             <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase">Total Load</span>
                <span className="text-xl font-bold text-gray-800">{course.totalHours}<span className="text-sm text-gray-400 font-normal">h/week</span></span>
             </div>

             {/* Actions */}
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => openModal(course)} className="p-1.5 bg-white border border-gray-200 shadow-sm rounded-md hover:text-indigo-600">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteCourse(course.id)} className="p-1.5 bg-white border border-gray-200 shadow-sm rounded-md hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Course' : 'Add New Course'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
               {/* ... [Previous Form Content - Unchanged] ... */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                    <input 
                      type="text" 
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                      placeholder="CS101"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Introduction to Programming"
                    />
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Curriculum</label>
                     <div className="flex gap-4">
                        {['New', 'Old'].map(opt => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg flex-1 hover:bg-gray-50 transition-colors">
                            <input 
                              type="radio" 
                              name="curr" 
                              checked={formData.curriculum === opt}
                              onChange={() => setFormData({...formData, curriculum: opt as 'New'|'Old'})}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="font-medium text-gray-700">{opt}</span>
                          </label>
                        ))}
                     </div>
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                           <Calendar className="w-4 h-4 text-gray-500" /> Preferred Day (Constraint)
                       </label>
                       <select 
                           value={formData.preferredDay || ''}
                           onChange={e => setFormData({...formData, preferredDay: e.target.value ? e.target.value as DayOfWeek : undefined})}
                           className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                       >
                           <option value="">No Preference (Any Day)</option>
                           {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                   </div>
               </div>

               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                     <Users className="w-4 h-4 text-gray-500" /> Qualified Instructors
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Select who can teach this course.</p>
                  <div className="max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-2 bg-white">
                      {instructors.map(inst => (
                          <label key={inst.id} className={`flex items-center p-2 rounded border cursor-pointer transition-all ${selectedInstructorIds.includes(inst.id) ? 'bg-indigo-50 border-indigo-300' : 'border-gray-100 hover:bg-gray-50'}`}>
                              <input 
                                type="checkbox" 
                                className="rounded text-indigo-600 focus:ring-indigo-500 mr-3"
                                checked={selectedInstructorIds.includes(inst.id)}
                                onChange={() => toggleInstructorSelection(inst.id)}
                              />
                              <div className="text-xs">
                                  <div className="font-semibold text-gray-800">{inst.name}</div>
                                  <div className="text-gray-500">{inst.department}</div>
                              </div>
                          </label>
                      ))}
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Structure & Duration</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ComponentToggle 
                      label="Lecture" 
                      icon={FileText} 
                      colorClass="blue"
                      active={formData.hasLecture} 
                      hours={formData.hoursLecture} 
                      onToggle={(val: boolean) => setFormData(prev => ({...prev, hasLecture: val}))}
                      onHoursChange={(val: number) => setFormData(prev => ({...prev, hoursLecture: val}))}
                    />
                    <ComponentToggle 
                      label="Section" 
                      icon={BookOpen} 
                      colorClass="purple"
                      active={formData.hasSection} 
                      hours={formData.hoursSection} 
                      onToggle={(val: boolean) => setFormData(prev => ({...prev, hasSection: val}))}
                      onHoursChange={(val: number) => setFormData(prev => ({...prev, hoursSection: val}))}
                    />
                    <ComponentToggle 
                      label="Lab" 
                      icon={Monitor} 
                      colorClass="green"
                      active={formData.hasLab} 
                      hours={formData.hoursLab} 
                      onToggle={(val: boolean) => setFormData(prev => ({...prev, hasLab: val}))}
                      onHoursChange={(val: number) => setFormData(prev => ({...prev, hoursLab: val}))}
                    />
                  </div>
               </div>

               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                 <span className="font-medium text-gray-600">Total Weekly Hours Required</span>
                 <span className="text-2xl font-bold text-indigo-600">{calculateTotal(formData)}h</span>
               </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Save Course</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" /> Bulk Import Courses
              </h2>
              <button onClick={() => setIsBulkOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                    Paste a list of courses below (one per line). 
                    <br/>Format: <code className="bg-gray-100 px-1 rounded">CODE - Name</code> or just <code className="bg-gray-100 px-1 rounded">Name</code>
                </p>
                
                <textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full h-48 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    placeholder="CS101 - Intro to CS&#10;MATH202 - Linear Algebra&#10;Physics I"
                />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setIsBulkOpen(false)} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleBulkImport} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Import Courses</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
