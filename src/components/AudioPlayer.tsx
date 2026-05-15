import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioPlayerProps {
  files: File[];
  className?: string;
}

export function AudioPlayer({ files, className }: AudioPlayerProps) {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    if (files.length > 0) {
      const newUrls = files.map(file => URL.createObjectURL(file));
      setUrls(newUrls);
      setCurrentFileIndex(0);
      return () => {
        newUrls.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [files]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentFileIndex]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed", e);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleEnded = () => {
    if (currentFileIndex < urls.length - 1) {
      setCurrentFileIndex(prev => prev + 1);
      setCurrentTime(0);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (urls.length === 0) return null;

  return (
    <div className={cn("bg-white border text-gray-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-4 flex flex-col gap-2 relative z-50", className)}>
      <audio
        ref={audioRef}
        src={urls[currentFileIndex]}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      
      {urls.length > 1 && (
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center mb-1">
          Track {currentFileIndex + 1} of {urls.length}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-900 text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
        >
          {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-1" fill="currentColor" />}
        </button>

        <div className="flex flex-col flex-1 gap-1.5">
         <div className="flex justify-between text-xs font-semibold text-gray-500 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="relative w-full h-2 flex items-center group">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden transition-all group-hover:h-2">
              <div 
                className="h-full bg-gray-900 rounded-full"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
            {/* Custom thumb */}
            <div 
              className="absolute h-3 w-3 bg-white border-2 border-gray-900 rounded-full shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
