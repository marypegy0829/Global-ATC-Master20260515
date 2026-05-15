// @ts-nocheck
import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorStr: ""
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorStr: error.toString() };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A] p-6">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full text-center flex flex-col items-center shadow-lg"
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-6">
               <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">系统特情 (System Abnormal)</h1>
            <p className="text-gray-500 dark:text-gray-400 text-[15px] mb-8 leading-relaxed">
              很抱歉，当前视图遇到了不可恢复的内部错误：<br/>
              <span className="text-red-500/80 font-mono text-xs mt-3 block p-3 bg-red-50 dark:bg-red-500/10 rounded-xl whitespace-pre-wrap">{this.state.errorStr}</span>
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full flex items-center justify-center gap-2 bg-aviation hover:bg-[#002244] text-white py-4 rounded-2xl font-semibold transition-colors active:scale-95"
            >
              <RefreshCcw className="w-5 h-5" />
              清除缓存并恢复系统 (Reset App)
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
