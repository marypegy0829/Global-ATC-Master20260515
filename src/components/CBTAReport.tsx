import React from 'react';
import { ShieldCheck, AlertTriangle, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

interface ScoreProps {
  label: string;
  score: number;
  cn?: string;
  delay: number;
}

const ScoreItem: React.FC<ScoreProps> = ({ label, score, cn, delay }) => {
  const getScoreColor = (sc: number) => {
    if (sc >= 5) return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    if (sc >= 4) return 'text-blue-500 bg-blue-50 border-blue-200';
    if (sc === 3) return 'text-amber-500 bg-amber-50 border-amber-200';
    return 'text-red-500 bg-red-50 border-red-200';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay, duration: 0.4 }}
      className={`flex flex-col items-center p-3 rounded-2xl border ${getScoreColor(score)} ${cn || ''}`}
    >
      <div className="text-2xl font-bold font-mono tracking-tight leading-none mb-1">{score}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 mt-1">{label}</div>
    </motion.div>
  );
};

export const CBTAReport: React.FC<{ report: any }> = ({ report }) => {
  if (!report || !report.scores) return null;

  const { scores } = report;

  return (
    <div className="mt-8 space-y-6">
      {/* Visual Scores Section */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 tracking-wide">ICAO 语言胜任力评分</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6 mb-2">
          <ScoreItem delay={0.1} label="Pronunciation" score={scores.pronunciation} />
          <ScoreItem delay={0.2} label="Structure" score={scores.structure} />
          <ScoreItem delay={0.3} label="Vocabulary" score={scores.vocabulary} />
          <ScoreItem delay={0.4} label="Fluency" score={scores.fluency} />
          <ScoreItem delay={0.5} label="Comprehension" score={scores.comprehension} />
          <ScoreItem delay={0.6} label="Interaction" score={scores.interaction} />
        </div>
      </div>
    </div>
  );
};
