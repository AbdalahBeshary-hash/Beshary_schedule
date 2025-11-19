
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Instructor, Role, DayOfWeek, DAYS } from '../types';
import { Plus, Edit2, Trash2, X, Check, Coffee, Upload, FileText } from 'lucide-react';

export const InstructorsManager: React.FC = () => {
  const { instructors, courses, addInstructor, addInstructorsBulk, updateInstructor, deleteInstructor } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Instructor>>({
    name: '',
    role: Role.Lecturer,
    department: '',
    capableCourseIds: [],
    workingDays: [],
    freeCampusDay: undefined,
    maxHoursPerWeek: 12,
    assignedHours: 0,
    canTeachBreak: false
  });

  // Bulk State
  const [bulkText, setBulkText] = useState("");
  const [bulkRole, setBulkRole] = useState<Role>(Role.TA);

  const openModal = (instructor?: Instructor) => {
    if (instructor) {
      setEditingId(instructor.id);
      setFormData({ ...instructor });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        role: Role.Lecturer,
        department: '',
        capableCourseIds: [],
        workingDays: [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday],
        freeCampusDay: DayOfWeek.Friday,
        maxHoursPerWeek: 12,
        assignedHours: 0,
        canTeachBreak: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.department || !formData.freeCampusDay) return;
    
    if ((formData.workingDays?.length || 0) !== 5) {
      alert("Instructors must be assigned exactly 5 working days.");
      return;
    }

    if (!formData.workingDays?.includes(formData.freeCampusDay)) {
      alert("The Free Campus Day must be one of the assigned Working Days.");
      return;
    }

    const instructor: Instructor = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      role: formData.role as Role,
      department: formData.department,
      capableCourseIds: formData.capableCourseIds || [],
      workingDays: formData.workingDays || [],
      freeCampusDay: formData.freeCampusDay,
      maxHoursPerWeek: Number(formData.maxHoursPerWeek),
      assignedHours: formData.assignedHours || 0,
      canTeachBreak: formData.canTeachBreak || false
    };

    if (editingId) {
      updateInstructor(instructor);
    } else {
      addInstructor(instructor);
    }
    setIsModalOpen(false);
  };

  const handleBulkImport = () => {
      if (!bulkText.trim()) return;

      const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
      const newInstructors: Instructor[] = lines.map(line => {
          const name = line.trim();
          return {
              id: Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 4), // Ensure unique IDs
              name: name,
              role: bulkRole,
              department: 'General', // Default
              capableCourseIds: [],
              workingDays: [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday],
              freeCampusDay: DayOfWeek.Friday, // Default
              maxHoursPerWeek: bulkRole === Role.Lecturer ? 10 : 18,
              assignedHours: 0,
              canTeachBreak: false
          };
      });

      addInstructorsBulk(newInstructors);
      setBulkText("");
      setIsBulkOpen(false);
  };

  const toggleWorkingDay = (day: DayOfWeek) => {
    const current = formData.workingDays || [];
    if (current.includes(day)) {
      setFormData({ ...formData, workingDays: current.filter(d => d !== day) });
    } else {
      if (current.length >= 5) return; 
      setFormData({ ...formData, workingDays: [...current, day] });
    }
  };

  const toggleCourseCapability = (courseId: string) => {
    const current = formData.capableCourseIds || [];
    if (current.includes(courseId)) {
      setFormData({ ...formData, capableCourseIds: current.filter(id => id !== courseId) });
    } else {
      setFormData({ ...formData, capableCourseIds: [...current, courseId] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-500">Manage Lecturers and TAs, their working days, and course capabilities.</p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={() => setIsBulkOpen(true)}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              <Upload className="w-4 h-4" /> Bulk Import
            </button>
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add Instructor
            </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Name / Role</th>
              <th className="p-4">Department</th>
              <th className="p-4">Working Days</th>
              <th className="p-4">Free Day</th>
              <th className="p-4">Load</th>
              <th className="p-4 text-center">Can Teach Break?</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {instructors.map(inst => (
              <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{inst.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded w-fit mt-1 ${inst.role === Role.Lecturer ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {inst.role}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-gray-600">{inst.department}</td>
                <td className="p-4">
                  <div className="flex gap-1 flex-wrap max-w-[200px]">
                    {inst.workingDays.map(day => (
                      <span key={day} className={`text-[10px] px-1.5 py-0.5 rounded border ${day === inst.freeCampusDay ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                        {day.substring(0,3)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-sm text-yellow-600 font-medium">{inst.freeCampusDay}</td>
                <td className="p-4 text-sm font-mono">{inst.assignedHours}/{inst.maxHoursPerWeek}h</td>
                <td className="p-4 text-center">
                    {inst.canTeachBreak ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(inst)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteInstructor(inst.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Instructor' : 'Add New Instructor'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input 
                    type="text" 
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="role" checked={formData.role === Role.Lecturer} onChange={() => setFormData({...formData, role: Role.Lecturer})} />
                      <span className="text-sm">Lecturer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="role" checked={formData.role === Role.TA} onChange={() => setFormData({...formData, role: Role.TA})} />
                      <span className="text-sm">TA</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Hours</label>
                  <input 
                    type="number" 
                    value={formData.maxHoursPerWeek}
                    onChange={e => setFormData({...formData, maxHoursPerWeek: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                    min={1}
                  />
                </div>
              </div>

              {/* Break Settings */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <Coffee className="text-amber-600 w-5 h-5" />
                      <div>
                          <p className="font-semibold text-amber-900">Lunch Break Teaching</p>
                          <p className="text-xs text-amber-700">Allow scheduling classes during the 12:20 PM break?</p>
                      </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.canTeachBreak} onChange={e => setFormData({...formData, canTeachBreak: e.target.checked})} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
              </div>

              {/* Working Days */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                   <label className="block text-sm font-semibold text-gray-700">Working Days (5)</label>
                   <span className={`text-xs font-bold px-2 py-0.5 rounded ${formData.workingDays?.length === 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                     Selected: {formData.workingDays?.length}/5
                   </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleWorkingDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                        formData.workingDays?.includes(day) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Free Campus Day</label>
                  <select 
                    value={formData.freeCampusDay}
                    onChange={e => setFormData({...formData, freeCampusDay: e.target.value as DayOfWeek})}
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                  >
                    <option value="">Select a day...</option>
                    {formData.workingDays?.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capable Courses</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {courses.map(course => (
                    <div 
                      key={course.id}
                      onClick={() => toggleCourseCapability(course.id)}
                      className={`flex items-center p-2 rounded cursor-pointer border transition-all ${
                        formData.capableCourseIds?.includes(course.id) ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50 border-transparent'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${
                        formData.capableCourseIds?.includes(course.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                      }`}>
                         {formData.capableCourseIds?.includes(course.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                         <div className="text-sm font-medium text-gray-900">{course.code}</div>
                         <div className="text-xs text-gray-500 truncate">{course.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Save</button>
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
                  <Upload className="w-5 h-5 text-indigo-600" /> Bulk Import Staff
              </h2>
              <button onClick={() => setIsBulkOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">Paste a list of names below (one per line). They will be added as new staff members.</p>
                
                <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={bulkRole === Role.TA} onChange={() => setBulkRole(Role.TA)} className="text-indigo-600" />
                        <span className="text-sm font-medium">Import as TAs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={bulkRole === Role.Lecturer} onChange={() => setBulkRole(Role.Lecturer)} className="text-indigo-600" />
                        <span className="text-sm font-medium">Import as Lecturers</span>
                    </label>
                </div>

                <textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full h-48 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="John Doe&#10;Jane Smith&#10;Robert Brown..."
                />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setIsBulkOpen(false)} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleBulkImport} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Import Names</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
