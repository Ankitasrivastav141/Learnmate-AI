'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, Settings2, CheckCircle2, X } from 'lucide-react';

interface TimerState {
  hours: number;
  minutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  targetEndTime: number | null;
}

const STORAGE_KEY = 'learnmate_custom_study_timer';

export function StudyTimer() {
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(45);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);

  // Audio chime using Web Audio API
  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio autoplay restrictions or unsupported
    }
  };

  // Load state from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: TimerState = JSON.parse(saved);
        setHours(parsed.hours || 0);
        setMinutes(parsed.minutes !== undefined ? parsed.minutes : 45);

        if (parsed.isRunning && parsed.targetEndTime) {
          const now = Date.now();
          const diff = Math.max(0, Math.floor((parsed.targetEndTime - now) / 1000));
          if (diff <= 0) {
            setRemainingSeconds(0);
            setIsRunning(false);
            setShowCompleteModal(true);
            playChime();
          } else {
            setRemainingSeconds(diff);
            setIsRunning(true);
          }
        } else {
          setRemainingSeconds(parsed.remainingSeconds !== undefined ? parsed.remainingSeconds : (parsed.hours * 3600 + parsed.minutes * 60));
          setIsRunning(false);
        }
      }
    } catch (e) {
      console.error('Failed to load study timer state:', e);
    }
  }, []);

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setShowCompleteModal(true);
            playChime();

            // Save completed state
            const completedState: TimerState = {
              hours,
              minutes,
              remainingSeconds: 0,
              isRunning: false,
              targetEndTime: null,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(completedState));
            return 0;
          }

          const updated = prev - 1;
          // Periodically sync
          const currentState: TimerState = {
            hours,
            minutes,
            remainingSeconds: updated,
            isRunning: true,
            targetEndTime: Date.now() + updated * 1000,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));

          return updated;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, hours, minutes]);

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const handleStart = () => {
    const total = (hours * 3600) + (minutes * 60);
    if (total <= 0) return;

    const newRemaining = remainingSeconds > 0 ? remainingSeconds : total;
    setRemainingSeconds(newRemaining);
    setIsRunning(true);
    setIsEditing(false);

    const state: TimerState = {
      hours,
      minutes,
      remainingSeconds: newRemaining,
      isRunning: true,
      targetEndTime: Date.now() + newRemaining * 1000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const handlePause = () => {
    setIsRunning(false);
    const state: TimerState = {
      hours,
      minutes,
      remainingSeconds,
      isRunning: false,
      targetEndTime: null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const handleReset = () => {
    setIsRunning(false);
    const total = (hours * 3600) + (minutes * 60);
    setRemainingSeconds(total);

    const state: TimerState = {
      hours,
      minutes,
      remainingSeconds: total,
      isRunning: false,
      targetEndTime: null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const handleSaveDuration = (e: React.FormEvent) => {
    e.preventDefault();
    const h = Math.max(0, Math.min(12, Number(hours) || 0));
    const m = Math.max(0, Math.min(59, Number(minutes) || 0));
    const total = (h * 3600) + (m * 60);

    setHours(h);
    setMinutes(m);
    setRemainingSeconds(total > 0 ? total : 45 * 60);
    setIsRunning(false);
    setIsEditing(false);

    const state: TimerState = {
      hours: h,
      minutes: m,
      remainingSeconds: total > 0 ? total : 45 * 60,
      isRunning: false,
      targetEndTime: null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  return (
    <>
      <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 shadow-sm text-xs">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 text-[#111827] font-semibold hover:text-[#2563EB] transition-colors cursor-pointer"
          title="Click to edit timer duration"
        >
          <Clock className={`w-3.5 h-3.5 ${isRunning ? 'text-[#2563EB] animate-pulse' : 'text-[#64748B]'}`} />
          <span className="font-mono text-sm tracking-wider font-bold">
            {formatTime(remainingSeconds)}
          </span>
        </button>

        <div className="flex items-center gap-1 border-l border-[#E2E8F0] pl-2 ml-1">
          {isRunning ? (
            <button
              onClick={handlePause}
              className="p-1 rounded-md text-[#111827] hover:bg-slate-200 transition-colors cursor-pointer"
              title="Pause Timer"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="p-1 rounded-md text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
              title="Start / Resume Timer"
            >
              <Play className="w-3.5 h-3.5 fill-[#2563EB]" />
            </button>
          )}

          <button
            onClick={handleReset}
            className="p-1 rounded-md text-[#64748B] hover:text-[#111827] hover:bg-slate-200 transition-colors cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 rounded-md text-[#64748B] hover:text-[#111827] hover:bg-slate-200 transition-colors cursor-pointer"
            title="Configure Hours & Minutes"
          >
            <Settings2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Edit Duration Popover Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="font-bold text-sm text-[#111827] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#2563EB]" />
                Set Study Timer
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-[#64748B] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDuration} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-center py-2 border border-[#E2E8F0] rounded-xl text-base font-bold text-[#111827] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full text-center py-2 border border-[#E2E8F0] rounded-xl text-base font-bold text-[#111827] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setHours(0);
                    setMinutes(25);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-[#111827]"
                >
                  25m
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHours(0);
                    setMinutes(45);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-[#111827]"
                >
                  45m
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHours(1);
                    setMinutes(0);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-[#111827]"
                >
                  1h
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHours(1);
                    setMinutes(30);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-[#111827]"
                >
                  1h 30m
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-[#64748B] hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-lg shadow-sm"
                >
                  Set Timer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Completed Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E2E8F0] text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#15803D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-[#111827]">Study Session Complete!</h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Great job staying focused during your study block. Take a short break or set a new study duration when you are ready.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  handleReset();
                }}
                className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Close & Reset Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
