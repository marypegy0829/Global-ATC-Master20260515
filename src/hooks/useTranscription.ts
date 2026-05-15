import { useState, useCallback, useRef } from 'react';
import { analyzeATCRecording } from '../services/geminiService';
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
    assessmentTarget: "PILOT" | "ATC" = "ATC"
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

      const data = await analyzeATCRecording(payload, signal);
      const parsedData = data as TranscriptionResult;
      
      const targetStr = assessmentTarget === 'PILOT' ? '飞行员' : '管制员';
      if (parsedData.report_title && !parsedData.report_title.includes('评估对象')) {
        parsedData.report_title = `${parsedData.report_title} (评估对象：${targetStr})`;
      } else if (!parsedData.report_title) {
        parsedData.report_title = `分析报告 - ${files.length > 0 ? files[0].name : 'ATC Record'} (评估对象：${targetStr})`;
      }
      
      setResultData(parsedData);
      
      useRecordStore.getState().addRecord({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        title: parsedData.report_title,
        date: Date.now(),
        isFavorite: false,
        result: parsedData
      });
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
