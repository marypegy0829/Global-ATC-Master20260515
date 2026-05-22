import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TranscriptionResult } from '../hooks/useTranscription';

export interface TranscriptionRecord {
  id: string;
  title: string;
  date: number;
  isFavorite: boolean;
  result: TranscriptionResult;
}

export interface RecordState {
  records: TranscriptionRecord[];
  addRecord: (record: TranscriptionRecord) => void;
  removeRecord: (id: string) => void;
  toggleFavorite: (id: string) => void;
  clearHistory: () => void;
  setRecords: (records: TranscriptionRecord[]) => void;
}

const syncToCloud = async (action: 'remove' | 'toggle' | 'clear', payload?: any) => {
  try {
    const { supabase } = await import('../services/supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    if (action === 'remove' && payload) {
      await supabase.from('records').delete().eq('id', payload);
    } else if (action === 'toggle' && payload) {
      const { data } = await supabase.from('records').select('is_favorite').eq('id', payload).maybeSingle();
      if (data) {
        await supabase.from('records').update({ is_favorite: !data.is_favorite }).eq('id', payload);
      }
    } else if (action === 'clear') {
      await supabase.from('records').delete().eq('user_id', session.user.id).eq('is_favorite', false);
    }
  } catch (err) {
    console.error('Failed to sync state to cloud', err);
  }
};

export const useRecordStore = create<RecordState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (record) => set((state) => {
        let newRecords = [record, ...state.records.filter(r => r.id !== record.id)];
        // Prevent QuotaExceededError by keeping max 30 records, but favoriting overrides the limit
        const favorites = newRecords.filter(r => r.isFavorite);
        const nonFavorites = newRecords.filter(r => !r.isFavorite);
        if (newRecords.length > 30) {
           newRecords = [...favorites, ...nonFavorites.slice(0, 30 - favorites.length)];
        }
        return { records: newRecords };
      }),
      removeRecord: (id) => set((state) => {
        syncToCloud('remove', id);
        return { records: state.records.filter((r) => r.id !== id) };
      }),
      toggleFavorite: (id) => set((state) => {
        syncToCloud('toggle', id);
        return {
          records: state.records.map((r) =>
            r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
          ),
        };
      }),
      clearHistory: () => set((state) => {
        syncToCloud('clear');
        return { records: state.records.filter(r => r.isFavorite) };
      }),
      setRecords: (records) => set({ records }),
    }),
    {
      name: 'atc-transcription-records',
    }
  )
);

