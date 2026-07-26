'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Meeting } from '@/domain/puriMeet';

interface MeetingCalendarProps {
  meetings: Meeting[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  className?: string;
}

const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function MeetingCalendar({ meetings, selectedDate, onSelectDate, className }: MeetingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const daysInMonth = useMemo(() => {
    const { month, year } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    const totalDays = lastDay.getDate();

    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({ date: dateStr, day: prevDay, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  // Meeting count per date
  const meetingDates = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of meetings) {
      if (m.status === 'CANCELLED') continue;
      const dateKey = new Date(m.scheduledAt).toISOString().split('T')[0];
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    }
    return map;
  }, [meetings]);

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { month: 11, year: prev.year - 1 };
      return { month: prev.month - 1, year: prev.year };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { month: 0, year: prev.year + 1 };
      return { month: prev.month + 1, year: prev.year };
    });
  };

  const handleDateClick = (date: string) => {
    onSelectDate(selectedDate === date ? null : date);
  };

  return (
    <div className={cn('glass-card p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-white">
          {BULAN[currentMonth.month]} {currentMonth.year}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {HARI.map((h) => (
          <div key={h} className="text-center text-[10px] font-semibold text-slate-500 uppercase py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map(({ date, day, isCurrentMonth }) => {
          const isToday = date === todayStr;
          const isSelected = date === selectedDate;
          const meetingCount = meetingDates.get(date) || 0;
          const hasMeetings = meetingCount > 0;

          return (
            <button
              key={date}
              onClick={() => handleDateClick(date)}
              className={cn(
                'relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all duration-200',
                isCurrentMonth ? 'text-slate-300' : 'text-slate-600',
                isToday && !isSelected && 'bg-blue-600/20 text-blue-400 font-bold',
                isSelected && 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25',
                !isSelected && isCurrentMonth && 'hover:bg-white/10',
                hasMeetings && !isSelected && 'font-semibold'
              )}
            >
              {day}
              {/* Meeting indicator dots */}
              {hasMeetings && (
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {Array.from({ length: Math.min(meetingCount, 3) }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'w-1 h-1 rounded-full',
                        isSelected ? 'bg-white' : 'bg-blue-400'
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <span className="text-[10px] text-blue-400 font-semibold">
              {meetingDates.get(selectedDate) || 0} meeting
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
