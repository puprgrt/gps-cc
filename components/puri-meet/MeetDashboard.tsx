'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Video, Filter } from 'lucide-react';
import { 
  usePuriMeet, 
  useTodayMeetings, 
  useLiveMeetings 
} from '@/hooks/usePuriMeet';
import { MeetingStats } from './MeetingStats';
import { MeetingCard } from './MeetingCard';
import { MeetingCalendar } from './MeetingCalendar';
import { ActiveMeetingBanner } from './ActiveMeetingBanner';
import { CreateMeetingModal } from './CreateMeetingModal';
import type { Meeting } from '@/domain/puriMeet';

export function MeetDashboard() {
  const router = useRouter();
  const { 
    meetings, 
    stats, 
    isLoading, 
    filter, 
    setFilter, 
    selectedDate, 
    setSelectedDate,
    isCreateModalOpen,
    setCreateModalOpen,
    createMeeting,
    cancelMeeting
  } = usePuriMeet();

  const [searchTerm, setSearchTerm] = useState(filter.search || '');

  const todayMeetings = useTodayMeetings();
  const liveMeetings = useLiveMeetings();

  const handleJoin = (meeting: Meeting) => {
    router.push(`/puri-meet/room/${meeting.roomId}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({ search: searchTerm });
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-400" />
            PURI Meet
          </h1>
          <p className="text-sm text-slate-400 mt-1">Smart Video Conference & Collaboration</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari meeting..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
            />
          </form>
          <button 
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Filter"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Jadwalkan</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <MeetingStats stats={stats} />

      {/* Active Meetings Banner (if any) */}
      {liveMeetings.length > 0 && (
        <div className="flex flex-col gap-3">
          {liveMeetings.map(meeting => (
            <ActiveMeetingBanner key={meeting.id} meeting={meeting} onJoin={handleJoin} />
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Calendar & Upcoming */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <MeetingCalendar 
            meetings={meetings} 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate} 
          />

          <div className="glass-card p-4 flex-1">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Jadwal Hari Ini
            </h3>
            
            <div className="space-y-3">
              {todayMeetings.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  Tidak ada jadwal meeting hari ini
                </p>
              ) : (
                todayMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onJoin={handleJoin}
                    onCancel={() => cancelMeeting(meeting.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Meeting List */}
        <div className="lg:col-span-8 glass-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">
              {selectedDate 
                ? `Meeting pada ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : 'Semua Meeting'}
            </h3>
            <span className="text-xs text-slate-400">
              {isLoading ? 'Memuat...' : `${meetings.length} meeting ditemukan`}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[400px]">
            {meetings.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                <Video className="w-12 h-12 opacity-20" />
                <p className="text-sm">Belum ada data meeting</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onJoin={handleJoin}
                    onCancel={() => cancelMeeting(meeting.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={async (data) => {
          await createMeeting(data);
        }}
      />
    </div>
  );
}
