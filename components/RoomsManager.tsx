
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Room, RoomType } from '../types';
import { Plus, Edit2, Trash2, X, MapPin, Upload } from 'lucide-react';

export const RoomsManager: React.FC = () => {
  const { rooms, addRoom, addRoomsBulk, updateRoom, deleteRoom } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Room>>({
    name: '',
    type: RoomType.LectureHall,
    capacity: 40
  });

  const [bulkText, setBulkText] = useState("");

  const openModal = (room?: Room) => {
    if (room) {
      setEditingId(room.id);
      setFormData({ ...room });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        type: RoomType.LectureHall,
        capacity: 40
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.capacity) return;

    const room: Room = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      type: formData.type as RoomType,
      capacity: Number(formData.capacity)
    };

    if (editingId) {
      updateRoom(room);
    } else {
      addRoom(room);
    }
    setIsModalOpen(false);
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
    const newRooms: Room[] = lines.map(line => {
        const name = line.trim();
        return {
            id: Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 4),
            name: name,
            type: RoomType.SectionRoom, // Default
            capacity: 40 // Default
        };
    });
    
    addRoomsBulk(newRooms);

    setBulkText("");
    setIsBulkOpen(false);
  };

  const getTypeColor = (type: RoomType) => {
    switch(type) {
        case RoomType.LectureHall: return "bg-blue-100 text-blue-700";
        case RoomType.Lab: return "bg-orange-100 text-orange-700";
        case RoomType.SectionRoom: return "bg-green-100 text-green-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Room Management</h1>
          <p className="text-gray-500">Configure teaching spaces, labs, and lecture halls.</p>
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
              <Plus className="w-4 h-4" /> Add Room
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
            <div key={room.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${getTypeColor(room.type)} bg-opacity-20`}>
                            <MapPin className={`w-6 h-6 ${getTypeColor(room.type).split(" ")[1]}`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{room.name}</h3>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getTypeColor(room.type)}`}>
                                {room.type}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => openModal(room)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteRoom(room.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-gray-500 text-sm font-medium">Capacity</span>
                    <span className="text-gray-800 font-bold text-lg">{room.capacity}</span>
                </div>
            </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
             <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Room' : 'Add Room'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" placeholder="e.g. Hall 101" />
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as RoomType})} className="w-full border border-gray-300 rounded-lg p-2">
                    <option value={RoomType.LectureHall}>Lecture Hall</option>
                    <option value={RoomType.SectionRoom}>Section Room</option>
                    <option value={RoomType.Lab}>Lab</option>
                </select>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg p-2" min={1} />
             </div>

             <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
             </div>
          </div>
        </div>
      )}

      {/* Bulk Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" /> Bulk Import Rooms
              </h2>
              <button onClick={() => setIsBulkOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">Paste a list of room names below (one per line).</p>
                
                <textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full h-48 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Hall A&#10;Lab 101&#10;Section 204"
                />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setIsBulkOpen(false)} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleBulkImport} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Import Rooms</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
