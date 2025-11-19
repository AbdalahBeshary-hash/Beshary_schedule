
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, BookMarked, MapPin } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import { Dashboard } from './components/Dashboard';
import { ScheduleGrid } from './components/ScheduleGrid';
import { InstructorsManager } from './components/InstructorsManager';
import { CoursesManager } from './components/CoursesManager';
import { RoomsManager } from './components/RoomsManager';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold mr-3 backdrop-blur-sm">G</div>
          <span className="text-lg font-bold text-white">Gemini Studio</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm translate-x-1' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </NavLink>
          <NavLink 
            to="/schedule" 
            className={({ isActive }) => `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm translate-x-1' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <CalendarDays className="w-5 h-5 mr-3" />
            Schedule
          </NavLink>
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Management</div>
          <NavLink 
            to="/instructors" 
            className={({ isActive }) => `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm translate-x-1' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Users className="w-5 h-5 mr-3" />
            Staff
          </NavLink>
          <NavLink 
            to="/courses" 
            className={({ isActive }) => `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm translate-x-1' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <BookMarked className="w-5 h-5 mr-3" />
            Courses
          </NavLink>
          <NavLink 
            to="/rooms" 
            className={({ isActive }) => `flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm translate-x-1' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <MapPin className="w-5 h-5 mr-3" />
            Rooms
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-400 text-center">v1.1.0 • React 19</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-sm text-gray-500 font-medium tracking-wide">UNIVERSITY DEPT. SCHEDULING SYSTEM</h2>
          <div className="flex items-center space-x-4">
             <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Admin Access</span>
             <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden border border-gray-300 ring-2 ring-white shadow-sm">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="User" />
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<ScheduleGrid />} />
            <Route path="/instructors" element={<InstructorsManager />} />
            <Route path="/courses" element={<CoursesManager />} />
            <Route path="/rooms" element={<RoomsManager />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
};

export default App;