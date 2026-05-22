import { useState, useCallback, useRef } from 'react';
import { analyzeATCRecording, analyzeECORecording } from '../services/geminiService';
import { geminiManager } from '../services/geminiManager';
import { useRecordStore } from '../store/useRecordStore';

export interface TranscriptionResult {
  segments: {
    sequence_order: number;
    raw_text: string;
    translated_text: string;
    inferred_flags: boolean;
  }[];
  report_markdown?: string;
  report_title?: string;
  cbta_report?: {
    scores: {
      pronunciation: number;
      structure: number;
      vocabulary: number;
      fluency: number;
      comprehension: number;
      interaction: number;
    }
  };
}

export function useTranscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<TranscriptionResult | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadRecord = useCallback((recordResult: TranscriptionResult) => {
    setIsLoading(false);
    setError(null);
    setProgressStatus('');
    setResultData(recordResult);
  }, []);

  const statuses = [
    "正在建立安全上行链路 (Uploading audio)...",
    "正在过滤驾驶舱背景底噪与电台杂音 (Filtering background noise)...",
    "正在进行全要素特情逻辑推演 (Running contextual inference)...",
    "正在生成 ICAO 胜任力评估报告 (Generating CBTA report)..."
  ];

  const startTranscription = useCallback(async (
    files: File[],
    countryCode: string,
    aircraftType: string,
    userPersona: string,
    outputMode: string,
    cbtaReport: boolean,
    assessmentTarget: "PILOT" | "ATC" = "ATC",
    pageMode: "WORKBENCH" | "ECO" = "WORKBENCH"
  ) => {
    setIsLoading(true);
    setError(null);
    setResultData(null);
    setProgressStatus(statuses[0]);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Simulate progress updates
    let statusIndex = 0;
    const interval = setInterval(() => {
      statusIndex++;
      if (statusIndex < statuses.length) {
        setProgressStatus(statuses[statusIndex]);
      }
    }, 4500); // Update status every ~4.5 seconds to simulate different stages

    try {
      // Convert files to base64 to avoid FormData serialization issues in iframes
      const fileToBase64 = (f: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      };

      const base64AudioFiles = [];
      const uploadedFiles = [];
      const THREE_MB = 3 * 1024 * 1024;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > THREE_MB) {
          try {
            const fileUri = await geminiManager.uploadFile(file);
            uploadedFiles.push({
              fileUri,
              mimeType: file.type
            });
          } catch (uploadObjError: any) {
            console.warn(`Upload failed for file ${file.name}, falling back to Base64 inline data:`, uploadObjError);
            const base64 = await fileToBase64(file);
            base64AudioFiles.push({
              filename: `audio_upload_${i}_${Date.now()}.${file.name.split('.').pop() || 'tmp'}`,
              mimetype: file.type,
              base64: base64
            });
          }
        } else {
          const base64 = await fileToBase64(file);
          base64AudioFiles.push({
            filename: `audio_upload_${i}_${Date.now()}.${file.name.split('.').pop() || 'tmp'}`,
            mimetype: file.type,
            base64: base64
          });
        }
      }

      const payload = {
        base64AudioFiles,
        uploadedFiles,
        countryCode,
        aircraftType,
        userPersona,
        outputMode,
        cbtaReport,
        assessmentTarget,
      };

      let data;
      if (pageMode === 'ECO') {
        data = await analyzeECORecording(payload as any, signal);
      } else {
        data = await analyzeATCRecording(payload as any, signal);
      }

      const parsedData = data as TranscriptionResult;
      
      const targetStr = assessmentTarget === 'PILOT' ? '飞行员' : '管制员';
      if (parsedData.report_title && !parsedData.report_title.includes('评估对象')) {
        parsedData.report_title = `${parsedData.report_title} (评估对象：${targetStr})`;
      } else if (!parsedData.report_title) {
        parsedData.report_title = `分析报告 - ${files.length > 0 ? files[0].name : 'ATC Record'} (评估对象：${targetStr})`;
      }
      
      setResultData(parsedData);
      
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      const recordId = generateUUID();
      
      try {
        useRecordStore.getState().addRecord({
          id: recordId,
          title: parsedData.report_title || '未命名报告',
          date: Date.now(),
          isFavorite: false,
          result: parsedData
        });
      } catch (err) {
        console.error("Failed to save record to local store:", err);
      }

      // Try to save to Supabase if authenticated
      try {
        const { supabase } = await import('../services/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from('records').insert([{
            id: recordId.length === 36 ? recordId : undefined, // UUID constraint in DB
            user_id: session.user.id,
            title: parsedData.report_title || '未命名报告',
            country: countryCode,
            aircraft_type: aircraftType,
            user_persona: userPersona,
            output_mode: outputMode,
            assessment_target: assessmentTarget,
            cbta_report: !!parsedData.cbta_report,
            result_data: parsedData,
          }]);
        }
      } catch (err) {
        console.error("Failed to sync record to Supabase:", err);
      }
    } catch (err: any) {
      console.error("TRANSCRIPTION ERROR CAUGHT:", err);
      if (err.name === 'AbortError') {
        setError('请求已取消');
      } else {
        setError(err.message || '分析过程中发生未知错误，请检查网络连接并重试。');
      }
    } finally {
      clearInterval(interval);
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setResultData(null);
    setError(null);
    setIsLoading(false);
    setProgressStatus('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isLoading,
    progressStatus,
    error,
    resultData,
    startTranscription,
    loadRecord,
    reset
  };
}
