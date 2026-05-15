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
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (record) => set((state) => ({ records: [record, ...state.records] })),
      removeRecord: (id) =>
        set((state) => ({ records: state.records.filter((r) => r.id !== id) })),
      toggleFavorite: (id) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
          ),
        })),
      clearHistory: () => set((state) => ({ records: state.records.filter(r => r.isFavorite) })), // Or keep favorites when clearing history?
    }),
    {
      name: 'atc-transcription-records',
    }
  )
);
