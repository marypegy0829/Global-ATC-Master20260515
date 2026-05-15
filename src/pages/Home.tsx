import { useState, useRef, lazy, Suspense } from "react";
import { 
  Star, Clock, RadioTower, Trash2,Globe, Languages, FileBarChart, 
  ChevronRight, FileText, FileType2, ArrowLeft, Loader2,
  PlayCircle, AlertCircle, RefreshCcw, Download, UserCheck
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useTranscription } from "../hooks/useTranscription";
import { downloadAsPDF, downloadAsWord } from "../utils/exportUtils";
import { AudioPlayer } from "../components/AudioPlayer";
import { RecordsDrawer } from "../components/RecordsDrawer";
import { CBTAReport } from "../components/CBTAReport";
import ReactMarkdown from 'react-markdown';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-aviation focus-visible:ring-offset-2",
        checked ? "bg-green-500" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)] ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-[20px]" : "translate-x-0"
        )}
      />
    </button>
  );
}

const renderInferredText = (text: string) => {
  const parts = text.split(/(<Inferred:[^>]+>)/g);
  return parts.map((part, index) => {
    if (part.startsWith('<Inferred:') && part.endsWith('>')) {
      const content = part.substring(10, part.length - 1).trim();
      return (
        <span 
          key={index} 
          className="border-b-[1.5px] border-dashed border-amber-400 text-amber-700 bg-amber-50 rounded-sm px-1" 
          title="AI 推演合成，请结合航行情景进行交叉比对"
        >
          {content}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

type ConversationRole = 'ATC' | 'PILOT';
interface Dialogue {
  id: string;
  timestamp: string;
  role: ConversationRole;
  english: string;
  chinese: string;
}

const mockDialogues: Dialogue[] = [
  {
    id: '1',
    timestamp: '00:15',
    role: 'PILOT',
    english: 'Guangzhou Tower, China Southern 3501, established ILS Runway 02L.',
    chinese: '广州塔台，南方3501，已建立 02L 跑道盲降。'
  },
  {
    id: '2',
    timestamp: '00:22',
    role: 'ATC',
    english: 'China Southern 3501, Guangzhou Tower, Wind 030 at 4 meters, Runway 02L, <Inferred: cleared to land>.',
    chinese: '南方3501，广州塔台，地面风 030，4米/秒，02L 跑道，可以落地。'
  },
  {
    id: '3',
    timestamp: '00:28',
    role: 'PILOT',
    english: 'Cleared to land Runway 02L, China Southern 3501.',
    chinese: '可以落地 02L 跑道，南方3501。'
  }
];



export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [country, setCountry] = useState("Auto");
  const [outputMode, setOutputMode] = useState<"english" | "bilingual">("english");
  const [assessmentTarget, setAssessmentTarget] = useState<"PILOT" | "ATC">("ATC");
  const [cbtaReport, setCbtaReport] = useState(true);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isRecordsOpen, setIsRecordsOpen] = useState(false);
  const [recordsTab, setRecordsTab] = useState<'history' | 'favorites'>('history');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    isLoading, 
    progressStatus, 
    error, 
    resultData, 
    startTranscription,
    loadRecord,
    reset 
  } = useTranscription();

  const settingsAircraftType = 'B737-800';
  const settingsPersona = '能力均衡，无明显弱点';

  const status = resultData ? 'completed' : isLoading ? 'transcribing' : error ? 'error' : 'idle';

  const MAX_FILES = 10;
  const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
  const VALID_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/m4a'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFiles = (newFiles: File[] | FileList) => {
    const fileArray = Array.from(newFiles);
    
    const validFiles = fileArray.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`文件 ${file.name} 超过 30MB 限制`);
        return false;
      }
      const isM4a = file.name.toLowerCase().endsWith('.m4a');
      if (!VALID_TYPES.includes(file.type) && !isM4a && !file.type.startsWith('audio/')) {
         showToast(`文件 ${file.name} 格式不支持`);
         return false;
      }
      return true;
    });

    setFiles(prev => {
      const combined = [...prev, ...validFiles];
      if (combined.length > MAX_FILES) {
        showToast(`最多上传 ${MAX_FILES} 段录音`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const handleStart = () => {
    if (files.length === 0) return;
    startTranscription(files, country, settingsAircraftType, settingsPersona, outputMode, cbtaReport, assessmentTarget);
  };

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col max-w-3xl mx-auto w-full pb-12">
      
      <RecordsDrawer 
        isOpen={isRecordsOpen} 
        onClose={() => setIsRecordsOpen(false)} 
        initialTab={recordsTab} 
        onSelectRecord={(record) => {
          loadRecord(record.result);
        }} 
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 md:top-12 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] font-medium text-[15px] flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons */}
        <div className="absolute -top-4 md:-top-2 right-0 flex gap-3 z-10 transition-opacity">
          <button 
            onClick={() => { setRecordsTab('favorites'); setIsRecordsOpen(true); }}
            className="flex items-center justify-center w-11 h-11 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:shadow-md border border-gray-100 hover:scale-105 active:scale-95 transition-all text-aviation"
          >
            <Star className="w-5 h-5" strokeWidth={2} />
          </button>
          <button 
            onClick={() => { setRecordsTab('history'); setIsRecordsOpen(true); }}
            className="flex items-center justify-center w-11 h-11 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:shadow-md border border-gray-100 hover:scale-105 active:scale-95 transition-all text-aviation"
          >
            <Clock className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

      {/* Header Area */}
      {status === 'completed' ? (
        <header className="mb-8 mt-4 md:mt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={reset}
              className="w-10 h-10 flex shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-[22px] md:text-[26px] font-bold tracking-tight text-gray-900 leading-none">
                转录分析结果
              </h1>
              <p className="text-[13px] text-gray-500 font-medium mt-1 uppercase tracking-wider">
                Session: {country} / {files.length || 1} Audiostreams
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scroll-smooth custom-scrollbar">
             <button
               onClick={() => downloadAsPDF(resultData, outputMode, resultData.report_title ? `${resultData.report_title}.pdf` : 'Assessment_Report.pdf')}
               className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-sm font-semibold text-gray-700 transition tracking-wide shadow-sm shrink-0"
             >
               <FileText className="w-4 h-4" />
               PDF 导出
             </button>
             <button
               onClick={() => downloadAsWord(resultData, outputMode, resultData.report_title ? `${resultData.report_title}.docx` : 'Assessment_Report.docx')}
               className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-sm font-semibold text-gray-700 transition tracking-wide shadow-sm shrink-0"
             >
               <FileType2 className="w-4 h-4" />
               Word 导出
             </button>
             <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200/50 shrink-0 ml-2">
               <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
               </span>
               <span className="text-xs font-bold text-green-700 uppercase tracking-widest mt-[1px]">
                 Verified
               </span>
             </div>
          </div>
        </header>
      ) : status === 'transcribing' ? null : (
        <header className="mb-3 mt-1 pr-24">
          <h1 className="text-[1.6rem] md:text-[2.2rem] font-bold tracking-tight mb-1.5 text-gray-900 leading-tight">
            ATC 解析工作台
          </h1>
          <p className="text-[0.95rem] text-gray-500 font-medium leading-relaxed">
            关键飞行轨迹与航空通讯指令将在此处深度解析并策略重组。
          </p>
        </header>
      )}

      {/* Main Context Switching */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 pb-20 custom-scrollbar relative">
        <AnimatePresence mode="wait">
        
        {status === 'completed' && resultData ? (
          <>
          <motion.div 
            key="completed"
            id="report-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col space-y-6 pt-2 pb-32 bg-transparent"
          >
            {resultData.segments.map((seg, index) => {
               const role = index % 2 === 0 ? 'ATC' : 'PILOT';
               const timePrefix = `00:${(index * 5).toString().padStart(2, '0')}`;

               return (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.15 }}
                  key={index} 
                  className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", role === 'ATC' ? "self-start" : "self-end")}
                >
                  <div className={cn("text-[11px] font-bold mb-[5px] text-gray-400 uppercase tracking-widest", role === 'ATC' ? "text-left ml-4" : "text-right mr-4")}>
                      {timePrefix} &bull; {role}
                  </div>
                  <div className={cn(
                    "px-5 py-4 shadow-sm border",
                    role === 'ATC' 
                      ? "bg-white border-gray-100 rounded-[24px] rounded-tl-sm text-gray-900" 
                      : "bg-aviation border-aviation rounded-[24px] rounded-tr-sm text-white"
                  )}>
                    <p className="font-sans text-[16px] md:text-[17px] leading-relaxed font-normal tracking-[-0.01em] break-words">
                        {renderInferredText(seg.raw_text)}
                    </p>
                    {outputMode === 'bilingual' && (
                      <p className={cn("font-sans text-[14px] mt-2.5 font-medium", role === 'ATC' ? "text-gray-500" : "text-white/80")}>
                          {seg.translated_text}
                      </p>
                    )}
                  </div>
                </motion.div>
               );
            })}

            {resultData.cbta_report && (
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.5, delay: resultData.segments.length * 0.15 + 0.3 }}
              >
                <CBTAReport report={resultData.cbta_report} />
              </motion.div>
            )}

            {resultData.report_markdown && (
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.5, delay: resultData.segments.length * 0.15 + 0.3 }}
                 className="mt-8 pt-8 px-4"
              >
                <div className="bg-white rounded-[32px] border border-gray-100 p-6 md:p-8 shadow-sm markdown-body">
                  <ReactMarkdown>{resultData.report_markdown}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Sticky Audio Player */}
          {status === 'completed' && resultData && files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring', damping: 20, stiffness: 100 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-[90]"
            >
              <AudioPlayer files={files} />
            </motion.div>
          )}
          </>
        ) : status === 'transcribing' ? (

          <motion.div
            key="transcribing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full min-h-[400px] mt-12"
          >
            {/* Radar Pulse Animation */}
            <div className="relative flex items-center justify-center w-32 h-32 mb-10">
              <div className="absolute inset-0 rounded-full border-2 border-aviation/10"></div>
              <motion.div 
                className="absolute inset-0 rounded-full bg-aviation/5 border border-aviation/20"
                animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full bg-aviation/5 border border-aviation/20"
                animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                transition={{ duration: 2, delay: 1, repeat: Infinity, ease: "easeOut" }}
              />
              <div className="relative w-16 h-16 rounded-full bg-aviation shadow-[0_0_20px_rgba(10,102,194,0.4)] flex items-center justify-center">
                 <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            </div>

            {/* Dynamic Status Text */}
            <motion.div
              layout
              className="text-center relative h-10 w-full"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={progressStatus}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 font-medium text-lg text-gray-700"
                >
                  {progressStatus}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </motion.div>

        ) : status === 'error' ? (

          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full min-h-[300px]"
          >
            <div className="bg-white border border-gray-100 rounded-[32px] p-8 max-w-md w-full text-center flex flex-col items-center shadow-sm">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                 <AlertCircle className="w-8 h-8 text-red-500" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">分析意外中断</h3>
              <p className="text-gray-500 text-[15px] mb-8 leading-relaxed">
                {error}
              </p>
              <button 
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-4 rounded-[20px] font-semibold transition-transform active:scale-95"
              >
                <RefreshCcw className="w-5 h-5" />
                重新尝试解析 (Retry)
              </button>
            </div>
          </motion.div>

        ) : (
          
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Module A: Upload Zone */}
            <section 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFiles(e.dataTransfer.files);
                }
              }}
              className={cn(
                "w-full rounded-[24px] p-10 md:p-16 min-h-[220px] md:min-h-[260px] flex flex-col justify-center items-center text-center cursor-pointer transition-all duration-300 border-2",
                isDragging 
                  ? "bg-aviation/5 border-aviation scale-[1.01] shadow-md" 
                  : "bg-white border-transparent hover:border-gray-200 shadow-sm"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.target.value = '';
                }} 
                multiple 
                accept=".mp3,.wav,.m4a,audio/*" 
                className="hidden" 
              />
              <div className={cn(
                "w-12 h-12 mb-4 rounded-full flex items-center justify-center transition-colors duration-300 shadow-sm",
                isDragging ? "bg-aviation text-white" : "bg-gray-50 text-aviation"
              )}>
                <RadioTower className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h2 className="text-[18px] md:text-[20px] font-bold text-gray-900 mb-1">
                点击或拖拽上传 ATC 录音
              </h2>
              <p className="text-[14px] text-gray-500 font-medium">
                支持最多 10 段序列，单文件最大 30MB / 30分钟
              </p>
            </section>

            {/* Module B: Audio Sequence List */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.section 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border border-gray-100 rounded-[32px] p-3 shadow-sm"
                >
                  <div className="max-h-[220px] overflow-y-auto px-1 space-y-1">
                    {files.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors group">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[15px] font-semibold text-gray-900 truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiles(files.filter((_, i) => i !== idx));
                          }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Module C: Configuration Panel */}
            <section className="bg-white border border-gray-100/80 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden divide-y divide-gray-100">
              
              <div className="flex items-center justify-between p-3.5 md:px-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3.5">
                  <div className="w-[30px] h-[30px] rounded-[8px] bg-blue-500 flex items-center justify-center shadow-sm">
                    <Globe className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[17px] font-medium text-gray-900 tracking-tight">来源国家</span>
                </div>
                <div className="relative flex items-center">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="appearance-none bg-transparent text-right text-[17px] text-gray-500 hover:text-gray-700 focus:outline-none pr-6 cursor-pointer font-medium w-48 truncate"
                  >
                    <option value="Auto">Auto (大模型自动判断)</option>
                    {[
                      'China', 'United States', 'Japan', 'South Korea', 'Thailand', 'UK', 'France', 'UAE', 'Mexico', 'Russia',
                      'Germany', 'Australia', 'Canada', 'Italy', 'Spain', 'Singapore', 'India', 'Brazil', 'South Africa', 'New Zealand',
                      'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Austria', 'Belgium', 'Ireland', 'Portugal',
                      'Greece', 'Turkey', 'Saudi Arabia', 'Qatar', 'Israel', 'Egypt', 'Malaysia', 'Indonesia', 'Vietnam', 'Philippines',
                      'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Ukraine'
                    ].map(c => (
                      <option key={c} value={c} className="text-gray-900 bg-white">{c}</option>
                    ))}
                  </select>
                  <ChevronRight className="w-[18px] h-[18px] text-gray-400 absolute right-0 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 md:px-4 gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-[30px] h-[30px] rounded-[8px] bg-indigo-500 flex items-center justify-center shadow-sm">
                    <Languages className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[17px] font-medium text-gray-900 tracking-tight">输出模式</span>
                </div>
                <div className="flex bg-gray-100/80 p-[3px] rounded-[10px] w-full sm:w-auto min-w-[200px]">
                  <button 
                    onClick={() => setOutputMode("english")}
                    className={cn(
                      "flex-1 px-4 py-1.5 text-[14px] font-semibold rounded-[8px] transition-all duration-200",
                      outputMode === "english" 
                        ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]" 
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    仅英文
                  </button>
                  <button 
                    onClick={() => setOutputMode("bilingual")}
                    className={cn(
                      "flex-1 px-4 py-1.5 text-[14px] font-semibold rounded-[8px] transition-all duration-200",
                      outputMode === "bilingual" 
                        ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]" 
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    中英双语
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 md:px-4 gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-[30px] h-[30px] rounded-[8px] bg-purple-500 flex items-center justify-center shadow-sm">
                    <UserCheck className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[17px] font-medium text-gray-900 tracking-tight">评估对象</span>
                </div>
                <div className="flex bg-gray-100/80 p-[3px] rounded-[10px] w-full sm:w-auto min-w-[200px]">
                  <button 
                    onClick={() => setAssessmentTarget("PILOT")}
                    className={cn(
                      "flex-1 px-4 py-1.5 text-[14px] font-semibold rounded-[8px] transition-all duration-200",
                      assessmentTarget === "PILOT" 
                        ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]" 
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    飞行员评估
                  </button>
                  <button 
                    onClick={() => setAssessmentTarget("ATC")}
                    className={cn(
                      "flex-1 px-4 py-1.5 text-[14px] font-semibold rounded-[8px] transition-all duration-200",
                      assessmentTarget === "ATC" 
                        ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]" 
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    管制员评估
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 md:px-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer" onClick={() => setCbtaReport(!cbtaReport)}>
                <div className="flex items-start gap-3.5 pr-4">
                  <div className="w-[30px] h-[30px] rounded-[8px] bg-orange-500 flex items-center justify-center shadow-sm shrink-0">
                    <FileBarChart className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[17px] font-medium text-gray-900 tracking-tight leading-tight mb-1 mt-[4px]">CBTA 深度报告</span>
                    <span className="text-[13px] text-gray-500 leading-snug">生成基于 ICAO 六大能力的教员级评估</span>
                  </div>
                </div>
                <Toggle checked={cbtaReport} onChange={setCbtaReport} />
              </div>
            </section>

            {/* Module D: Action Button */}
            <button 
              onClick={handleStart}
              disabled={files.length === 0}
              className={cn(
                "w-full py-3 px-6 rounded-[20px] font-bold text-[17px] transition-all duration-300 flex items-center justify-center gap-2",
                files.length > 0 
                  ? "bg-aviation text-white hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-aviation/20 border border-transparent" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              )}
            >
              <PlayCircle className={cn("w-6 h-6", files.length === 0 && "opacity-50")} />
              开始解析 (Start)
            </button>
            
          </motion.div>
        )}
        </AnimatePresence>
      </div>



    </div>
  );
}
