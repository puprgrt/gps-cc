import { useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { PuriMeetService } from '@/services/puriMeetService';
import { supabase } from '@/lib/supabase';
import type {
  Meeting,
  MeetingStats,
  MeetingFilter,
  CreateMeetingInput,
  UpdateMeetingInput,
} from '@/domain/puriMeet';

// ============================================================
// STORE INTERFACE
// ============================================================

interface PuriMeetState {
  meetings: Meeting[];
  activeMeeting: Meeting | null;
  stats: MeetingStats | null;
  isLoading: boolean;
  error: string | null;

  filter: MeetingFilter;
  isCreateModalOpen: boolean;
  selectedDate: string | null;

  // Actions
  setFilter: (filter: Partial<MeetingFilter>) => void;
  setCreateModalOpen: (isOpen: boolean) => void;
  setSelectedDate: (date: string | null) => void;
  setActiveMeeting: (meeting: Meeting | null) => void;

  loadMeetings: (silent?: boolean) => Promise<void>;
  loadStats: () => Promise<void>;
  createMeeting: (data: CreateMeetingInput) => Promise<Meeting | null>;
  updateMeeting: (meetingId: string, data: UpdateMeetingInput) => Promise<Meeting | null>;
  startMeeting: (meetingId: string) => Promise<Meeting | null>;
  endMeeting: (meetingId: string) => Promise<Meeting | null>;
  cancelMeeting: (meetingId: string) => Promise<boolean>;
  loadMeetingByRoomId: (roomId: string) => Promise<Meeting | null>;
}

// ============================================================
// DEFAULT FILTER
// ============================================================

const DEFAULT_FILTER: MeetingFilter = {
  status: 'ALL',
  type: 'ALL',
  bidang: 'ALL',
  dateFrom: null,
  dateTo: null,
  search: '',
};

// ============================================================
// ZUSTAND STORE
// ============================================================

export const usePuriMeetStore = create<PuriMeetState>((set, get) => ({
  meetings: [],
  activeMeeting: null,
  stats: null,
  isLoading: false,
  error: null,
  filter: DEFAULT_FILTER,
  isCreateModalOpen: false,
  selectedDate: null,

  // ----------------------------------------------------------
  // Setters
  // ----------------------------------------------------------
  setFilter: (filterUpdate) => {
    set((state) => ({
      filter: { ...state.filter, ...filterUpdate },
    }));
    get().loadMeetings(true);
  },

  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    if (date) {
      const nextDay = new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0];
      get().setFilter({ dateFrom: date, dateTo: nextDay });
    } else {
      get().setFilter({ dateFrom: null, dateTo: null });
    }
  },

  setActiveMeeting: (meeting) => set({ activeMeeting: meeting }),

  // ----------------------------------------------------------
  // Load meetings
  // ----------------------------------------------------------
  loadMeetings: async (silent = false) => {
    if (!silent) set({ isLoading: true, error: null });

    try {
      const { filter } = get();
      const meetings = await PuriMeetService.fetchMeetings(filter);
      set({ meetings, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat meeting';
      set({ error: message, isLoading: false });
    }
  },

  // ----------------------------------------------------------
  // Load stats
  // ----------------------------------------------------------
  loadStats: async () => {
    try {
      const stats = await PuriMeetService.fetchMeetingStats();
      set({ stats });
    } catch {
      // Stats are non-critical
    }
  },

  // ----------------------------------------------------------
  // Create meeting
  // ----------------------------------------------------------
  createMeeting: async (data) => {
    try {
      // TODO: Get actual user from auth context
      const meeting = await PuriMeetService.createMeeting(data, 'system', 'Operator PUPR');
      if (meeting) {
        set((state) => ({
          meetings: [...state.meetings, meeting].sort(
            (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          ),
          isCreateModalOpen: false,
        }));
        get().loadStats();
      }
      return meeting;
    } catch {
      return null;
    }
  },

  // ----------------------------------------------------------
  // Update meeting
  // ----------------------------------------------------------
  updateMeeting: async (meetingId, data) => {
    try {
      const updated = await PuriMeetService.updateMeeting(meetingId, data);
      if (updated) {
        set((state) => ({
          meetings: state.meetings.map((m) => (m.id === meetingId ? updated : m)),
        }));
      }
      return updated;
    } catch {
      return null;
    }
  },

  // ----------------------------------------------------------
  // Start meeting (SCHEDULED → LIVE)
  // ----------------------------------------------------------
  startMeeting: async (meetingId) => {
    try {
      const updated = await PuriMeetService.startMeeting(meetingId);
      if (updated) {
        set((state) => ({
          meetings: state.meetings.map((m) => (m.id === meetingId ? updated : m)),
          activeMeeting: updated,
        }));
        get().loadStats();
      }
      return updated;
    } catch {
      return null;
    }
  },

  // ----------------------------------------------------------
  // End meeting (LIVE → COMPLETED)
  // ----------------------------------------------------------
  endMeeting: async (meetingId) => {
    try {
      const updated = await PuriMeetService.endMeeting(meetingId);
      if (updated) {
        set((state) => ({
          meetings: state.meetings.map((m) => (m.id === meetingId ? updated : m)),
          activeMeeting: null,
        }));
        get().loadStats();
      }
      return updated;
    } catch {
      return null;
    }
  },

  // ----------------------------------------------------------
  // Cancel meeting
  // ----------------------------------------------------------
  cancelMeeting: async (meetingId) => {
    try {
      const success = await PuriMeetService.cancelMeeting(meetingId);
      if (success) {
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === meetingId ? { ...m, status: 'CANCELLED' as const } : m
          ),
        }));
        get().loadStats();
      }
      return success;
    } catch {
      return false;
    }
  },

  // ----------------------------------------------------------
  // Load meeting by room ID (for meeting room page)
  // ----------------------------------------------------------
  loadMeetingByRoomId: async (roomId) => {
    try {
      const meeting = await PuriMeetService.fetchMeetingByRoomId(roomId);
      if (meeting) {
        set({ activeMeeting: meeting });
      }
      return meeting;
    } catch {
      return null;
    }
  },
}));

// ============================================================
// HOOK: usePuriMeet — Auto-loads data & subscribes to realtime
// ============================================================

export function usePuriMeet(): PuriMeetState {
  const store = usePuriMeetStore();

  // Initial data load
  useEffect(() => {
    store.loadMeetings();
    store.loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime subscription for meeting updates
  useEffect(() => {
    const channel = supabase
      .channel('puri-meet-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        () => {
          // Silently refresh on any meeting change
          store.loadMeetings(true);
          store.loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}

// ============================================================
// HELPER HOOKS
// ============================================================

/** Get meetings for today only */
export function useTodayMeetings(): Meeting[] {
  const { meetings } = usePuriMeetStore();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  return meetings.filter((m) => {
    const meetingDate = new Date(m.scheduledAt).toISOString().split('T')[0];
    return meetingDate === todayStr && m.status !== 'CANCELLED';
  });
}

/** Get currently live meetings */
export function useLiveMeetings(): Meeting[] {
  const { meetings } = usePuriMeetStore();
  return meetings.filter((m) => m.status === 'LIVE');
}

/** Get upcoming scheduled meetings */
export function useUpcomingMeetings(limit = 5): Meeting[] {
  const { meetings } = usePuriMeetStore();
  const now = new Date().toISOString();

  return meetings
    .filter((m) => m.status === 'SCHEDULED' && m.scheduledAt >= now)
    .slice(0, limit);
}
