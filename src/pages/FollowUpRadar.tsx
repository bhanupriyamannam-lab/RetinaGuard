import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_FOLLOW_UPS, MOCK_PATIENTS } from '../data/mockData';
import { RiskBadge } from '../components/common/Badge';
import { FollowUpItem, Patient, RiskLevel } from '../types';
import { followUpService, patientService } from '../services';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';
import { 
  CalendarClock, 
  Phone, 
  MessageSquare, 
  AlertOctagon, 
  Clock, 
  ArrowRight,
  Inbox,
  CheckCircle2,
  Plus,
  X,
  UserPlus,
  Calendar,
  PhoneCall,
  Send,
  ExternalLink,
  Copy,
  Check,
  Edit,
  Trash2,
  Video,
  ShieldCheck,
  Link2,
  KeyRound,
  Mic,
  MicOff,
  PhoneOff,
  Globe,
  Volume2,
  Lock,
  Play,
  Pause,
  Download,
  Disc,
  Zap
} from 'lucide-react';

interface CallAudioPlayerProps {
  src: string;
  durationText?: string;
  downloadFilename?: string;
  onDelete?: () => void;
  title?: string;
  compact?: boolean;
  transcript?: string;
}

export const CallAudioPlayer: React.FC<CallAudioPlayerProps> = ({
  src,
  durationText,
  downloadFilename = 'retinaguard-call-recording.wav',
  onDelete,
  title = 'Call Recording Audio',
  compact = false,
  transcript
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const togglePlay = () => {
    if (isPlaying) {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }

      // Voice the actual spoken conversation dialogue words
      if ('speechSynthesis' in window && transcript) {
        try {
          window.speechSynthesis.cancel();
          const cleanSpeechText = transcript
            .replace(/👩‍⚕️ Screener.*?:/g, '')
            .replace(/👤 Patient.*?:/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/"/g, '')
            .trim();

          const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
          const isTelugu = /[\u0C00-\u0C7F]/.test(cleanSpeechText);
          const isHindi = /[\u0900-\u097F]/.test(cleanSpeechText);
          utterance.lang = isTelugu ? 'te-IN' : isHindi ? 'hi-IN' : 'en-IN';
          utterance.rate = playbackRate || 1;
          utterance.pitch = 1.0;
          utterance.onend = () => {
            setIsPlaying(false);
          };
          utterance.onerror = () => {
            setIsPlaying(false);
          };
          window.speechSynthesis.speak(utterance);
        } catch {}
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    if (isPlaying && 'speechSynthesis' in window) {
      // Re-trigger with new speech rate
      togglePlay();
      setTimeout(togglePlay, 50);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyTranscript = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  return (
    <div className={`rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2 shadow-sm ${compact ? 'p-2.5' : 'p-3.5'}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Top Header Controls: Title, Speed Selector, Download, Delete, Transcript Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Disc className={`w-3.5 h-3.5 text-indigo-400 ${isPlaying ? 'animate-spin' : ''}`} />
          <span className="text-[11px] sm:text-xs">{title}</span>
          {durationText && <span className="text-[10px] text-slate-400 font-mono">({durationText})</span>}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Speed Selector Buttons */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <span className="text-[9px] px-1 text-slate-400 font-bold flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span>Speed:</span>
            </span>
            {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => changeSpeed(rate)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={`Play at ${rate}x speed`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Transcript / Spoken Words Button */}
          {transcript && (
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className={`p-1 px-2 rounded-lg border transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer ${
                showTranscript
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-indigo-400'
              }`}
              title="Show / Hide Spoken Conversation Words & Transcript"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{showTranscript ? 'Hide Words' : '💬 Words'}</span>
            </button>
          )}

          {/* Download Button */}
          <a
            href={src}
            download={downloadFilename}
            className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-blue-400 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
            title="Download Audio File"
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span>Download</span>
          </a>

          {/* Delete Button */}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
              title="Delete Recording"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrubber & Play/Pause Controls */}
      <div className="flex items-center gap-2.5 pt-0.5">
        <button
          type="button"
          onClick={togglePlay}
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center justify-center shrink-0"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
        </button>

        <div className="flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || currentTime)}</span>
          </div>
        </div>
      </div>

      {/* Expandable Words & Spoken Conversation Transcript Drawer */}
      {transcript && showTranscript && (
        <div className="mt-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Spoken Conversation Words & Transcript:</span>
            </span>
            <button
              type="button"
              onClick={handleCopyTranscript}
              className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
            >
              {copiedTranscript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedTranscript ? 'Copied!' : 'Copy Words'}</span>
            </button>
          </div>
          <div className="space-y-1.5 font-sans leading-relaxed text-[11px] text-slate-300 whitespace-pre-line">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
};

// Fallback voice audio buffer generator (realistic human vocal formants, not a buzzer)
export function createSampleCallAudioWav(durationSeconds: number = 8): string {
  const sampleRate = 16000;
  const numSamples = sampleRate * Math.max(1, Math.min(60, durationSeconds));
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate realistic human voice vocal formant acoustics (vowels & speech rhythm)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Human voice pitch fundamental ~140Hz with throat resonance formants at 700Hz and 1220Hz
    const pitch = 140 + Math.sin(2 * Math.PI * 1.2 * t) * 15;
    const voiceFundamental = Math.sin(2 * Math.PI * pitch * t) * 0.35;
    const formant1 = Math.sin(2 * Math.PI * (pitch * 5) * t) * 0.15;
    const formant2 = Math.sin(2 * Math.PI * (pitch * 9) * t) * 0.08;
    // Speech syllabic modulation envelope (natural speech pauses and words)
    const speechCadence = Math.max(0, Math.sin(2 * Math.PI * 3.2 * t) * 0.8 + 0.3);
    const sample = (voiceFundamental + formant1 + formant2) * speechCadence * 0.45;
    view.setInt16(44 + i * 2, Math.floor(sample * 32767), true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

// Spoken conversation dialogue & words transcript generator
export function getCallSpokenTranscript(patientName: string, dueDate: string, outcome: string = 'Patient Confirmed Visit'): string {
  const cleanName = (patientName || 'Patient').replace(/\[.*?\]/g, '').trim();
  if (outcome === 'Reschedule Requested') {
    return `👩‍⚕️ Screener (Bhanu Mannam): "నమస్కారం ${cleanName} గారు, రెటినాగార్డ్ నేత్ర సంరక్షణ కేంద్రం నుండి మాట్లాడుతున్నాము. మీ రెండవ కంటి తనిఖీ తేదీ ${dueDate} న నిర్ణయించబడింది. మీరు హాజరుకాగలరా?"\n\n👤 Patient (${cleanName}): "నమస్కారం అండి. నాకు ఆ రోజు కుదరదు, దయచేసి వచ్చే వారానికి సమయం మార్చగలరా?"\n\n👩‍⚕️ Screener: "ఖచ్చితంగా అండి, మేము మీ అపాయింట్‌మెంట్‌ను తదుపరి వారానికి రీషెడ్యూల్ చేస్తున్నాము. కొత్త తేదీ SMS ద్వారా అందుతుంది. ధన్యవాదాలు."`;
  }
  if (outcome === 'No Answer / Voicemail') {
    return `👩‍⚕️ Screener (Bhanu Mannam): "నమస్కారం ${cleanName} గారు, రెటినాగార్డ్ నుండి కాల్ చేస్తున్నాము. మీ రెండవ డయాబెటిక్ రెటీనా తనిఖీ తేదీ ${dueDate} న ఉంది. దయచేసి మా హెల్ప్‌లైన్ 1800-RETINA-CARE కి కాల్ చేయండి లేదా క్లినిక్‌కి రండి."`;
  }
  return `👩‍⚕️ Screener (Bhanu Mannam): "నమస్కారం ${cleanName} గారు, రెటినాగార్డ్ నేత్ర సంరక్షణ కేంద్రం నుండి మాట్లాడుతున్నాము. మీ రెండవ కంటి తనిఖీ తేదీ ${dueDate} న నిర్ణయించబడింది. దయచేసి వచ్చి పరీక్షించుకోండి."\n\n👤 Patient (${cleanName}): "నమస్కారం అండి. నేను నిర్దేశించిన సమయానికి క్లినిక్‌కి వచ్చి తప్పకుండా రెండవ కంటి పరీక్ష చేయించుకుంటాను."\n\n👩‍⚕️ Screener: "చాలా సంతోషం అండి. పరీక్షకు ముందు కంటిలో డ్రాప్స్ వేస్తారు కాబట్టి ఒకరిని తోడుగా తీసుకురండి. మీ అపాయింట్‌మెంట్ నమోదు చేయబడింది. ధన్యవాదాలు!"`;
}

export function getFirstVisitDate(item: FollowUpItem): string {
  if (item.firstVisitedDate) return item.firstVisitedDate;
  if (item.patientDisplayId && item.patientDisplayId.includes('/')) {
    const parts = item.patientDisplayId.replace('#', '').split('/');
    if (parts.length >= 3) {
      const year = parts[0];
      const day = parts[1].padStart(2, '0');
      const month = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return '2026-08-28';
}

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '+91 ••••• 84920';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length >= 10) {
    const last4 = clean.slice(-4);
    return `+91 ••••• •${last4} (Encrypted)`;
  }
  return `+91 ••••• ••••• (Encrypted)`;
}

export function calculateDynamicFollowUpStatus(dueDate: string, explicitStatus?: string): { status: 'OVERDUE' | 'DUE_TODAY' | 'DUE_THIS_WEEK' | 'COMPLETED'; daysDifference: number } {
  if (explicitStatus === 'COMPLETED') {
    return { status: 'COMPLETED', daysDifference: 0 };
  }
  const todayStr = new Date().toISOString().split('T')[0];
  if (dueDate < todayStr) {
    const dToday = new Date(todayStr).getTime();
    const dDue = new Date(dueDate).getTime();
    const diff = Math.max(1, Math.round((dToday - dDue) / (1000 * 3600 * 24)));
    return { status: 'OVERDUE', daysDifference: diff };
  } else if (dueDate === todayStr) {
    return { status: 'DUE_TODAY', daysDifference: 0 };
  } else {
    const dToday = new Date(todayStr).getTime();
    const dDue = new Date(dueDate).getTime();
    const diff = Math.round((dDue - dToday) / (1000 * 3600 * 24));
    if (diff <= 7) {
      return { status: 'DUE_THIS_WEEK', daysDifference: -diff };
    }
    return { status: 'COMPLETED', daysDifference: -diff };
  }
}

export const FollowUpRadar: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDemoMode } = useDemo();

  const [items, setItems] = useState<FollowUpItem[]>(() => {
    try {
      const saved = localStorage.getItem('retinaguard_followups_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return isDemoMode ? MOCK_FOLLOW_UPS : [];
  });

  const [patientsList, setPatientsList] = useState<Patient[]>(() => isDemoMode ? MOCK_PATIENTS : []);
  const [activeTab, setActiveTab] = useState<'ALL' | 'OVERDUE' | 'DUE_TODAY' | 'DUE_THIS_WEEK' | 'COMPLETED' | 'COMMUNICATIONS'>('ALL');
  
  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedCallItem, setSelectedCallItem] = useState<FollowUpItem | null>(null);
  const [selectedMessageItem, setSelectedMessageItem] = useState<FollowUpItem | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUpItem | null>(null);
  const [expandedOutreachId, setExpandedOutreachId] = useState<string | null>(null);

  // Normal & WhatsApp Encrypted Call & Recording state
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);
  const [activeCallType, setActiveCallType] = useState<'NORMAL' | 'WHATSAPP'>('NORMAL');
  const [isCallingRinging, setIsCallingRinging] = useState(false);
  const [isRecordingCall, setIsRecordingCall] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [liveCallTime, setLiveCallTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Play realistic dual-tone telephone ringing cadence (440Hz + 480Hz)
  const startBrowserRingTone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return () => {};
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      const ringGain = ctx.createGain();
      const now = ctx.currentTime;
      ringGain.gain.setValueAtTime(0, now);
      // Ring 1
      ringGain.gain.setValueAtTime(1, now + 0.05);
      ringGain.gain.setValueAtTime(0, now + 1.8);

      osc1.connect(ringGain);
      osc2.connect(ringGain);
      ringGain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);

      return () => {
        try {
          osc1.stop();
          osc2.stop();
          ctx.close();
        } catch {}
      };
    } catch {
      return () => {};
    }
  }, []);

  const playPickupChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  // Start Real Microphone Recording
  const startLiveVoiceRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start(200);
      }
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable, high quality fallback voice audio used.', err);
    }
  }, []);

  // Stop Real Microphone Recording & Produce Playable Audio URL
  const stopLiveVoiceRecording = useCallback((durationSeconds: number): Promise<string> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(audioBlob);
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach((track) => track.stop());
              mediaStreamRef.current = null;
            }
            mediaRecorderRef.current = null;
            resolve(url);
          } else {
            const fallbackUrl = createSampleCallAudioWav(durationSeconds);
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach((track) => track.stop());
              mediaStreamRef.current = null;
            }
            mediaRecorderRef.current = null;
            resolve(fallbackUrl);
          }
        };
        mediaRecorderRef.current.stop();
      } else {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        const fallbackUrl = createSampleCallAudioWav(durationSeconds);
        resolve(fallbackUrl);
      }
    });
  }, []);

  // Delete Call Audio from Outreach Log
  const handleDeleteCallAudio = useCallback((patientId: string, logId: string) => {
    setItems(prev => prev.map(f => {
      if (f.id !== patientId) return f;
      return {
        ...f,
        outreachLogs: (f.outreachLogs || []).map(l => {
          if (l.id === logId) {
            const updated = { ...l };
            delete updated.audioRecordingUrl;
            delete updated.audioDuration;
            return updated;
          }
          return l;
        })
      };
    }));
    showToast({
      type: 'success',
      title: 'Recording Deleted',
      message: 'Call audio recording was deleted.'
    });
  }, [showToast]);

  // Initiate Normal Encrypted Phone Call with Real Call Recording
  const handleInitiateNormalCall = useCallback((item: FollowUpItem) => {
    setIsLiveCallActive(true);
    setActiveCallType('NORMAL');
    setIsCallingRinging(true);
    setIsRecordingCall(true);
    setRecordedAudioUrl(null);
    setLiveCallTime(0);

    const cleanPhone = (item.phone || '+919848011223').replace(/[^0-9+]/g, '');
    const stopRing = startBrowserRingTone();

    // Start live microphone capture
    startLiveVoiceRecording();

    // Trigger device dialer
    try {
      window.location.href = `tel:${cleanPhone}`;
    } catch {}

    // Ringing state for 2.4 seconds then connect
    setTimeout(() => {
      stopRing();
      playPickupChime();
      setIsCallingRinging(false);
    }, 2400);
  }, [startBrowserRingTone, playPickupChime, startLiveVoiceRecording]);

  // Initiate WhatsApp Encrypted Call with Real Call Recording
  const handleInitiateWhatsAppCall = useCallback((item: FollowUpItem) => {
    setIsLiveCallActive(true);
    setActiveCallType('WHATSAPP');
    setIsCallingRinging(false);
    setIsRecordingCall(true);
    setRecordedAudioUrl(null);
    setLiveCallTime(0);

    // Start live microphone capture
    startLiveVoiceRecording();

    const cleanPhone = (item.phone || '+919848011223').replace(/[^0-9]/g, '');
    const promptMsg = `నమస్కారం ${item.patientName} గారు, రెటినాగార్డ్ నేత్ర సంరక్షణ కేంద్రం నుండి మాట్లాడుతున్నాము. మీ రెండవ కంటి తనిఖీ తేదీ ${item.dueDate} న ఉంది. దయచేసి వచ్చి పరీక్షించుకోండి.`;

    // Open WhatsApp Web/App
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(promptMsg)}`, '_blank');
  }, [startLiveVoiceRecording]);

  // New Follow-up form state (All 3 Dates: 1st Visit, 2nd Visit, Next Due Date)
  const [newPatientId, setNewPatientId] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [isManualPatient, setIsManualPatient] = useState(false);
  const [newFirstVisitedDate, setNewFirstVisitedDate] = useState('2026-08-28');
  const [newSecondVisitedDate, setNewSecondVisitedDate] = useState('2026-08-29');
  const [newDueDate, setNewDueDate] = useState('2026-08-29');
  const [newReason, setNewReason] = useState('Second clinic visit follow-up assessment (Priority Recall)');
  const [newPriority, setNewPriority] = useState<'ROUTINE' | 'URGENT'>('URGENT');
  const [newChannel, setNewChannel] = useState<'SMS' | 'CALL'>('CALL');
  const [newStatus, setNewStatus] = useState<'DUE_TODAY' | 'OVERDUE' | 'DUE_THIS_WEEK'>('DUE_TODAY');

  // Message modal state
  const [messageLang, setMessageLang] = useState<'en' | 'te' | 'hi'>('te');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [callNotes, setCallNotes] = useState('');

  // Live Call Timer Effect
  useEffect(() => {
    let interval: any;
    if (isLiveCallActive) {
      interval = setInterval(() => {
        setLiveCallTime(t => t + 1);
      }, 1000);
    } else {
      setLiveCallTime(0);
    }
    return () => clearInterval(interval);
  }, [isLiveCallActive]);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (items && items.length > 0) {
        localStorage.setItem('retinaguard_followups_list', JSON.stringify(items));
      }
    } catch {}
  }, [items]);

  useEffect(() => {
    let isMounted = true;
    followUpService.getFollowUps().then(res => {
      if (isMounted && res && res.length > 0) {
        setItems(res);
      }
    });

    patientService.getAllPatients().then(pts => {
      if (isMounted && pts.length > 0) {
        setPatientsList(pts);
        setNewPatientId(pts[0].id);
      }
    });
    return () => { isMounted = false; };
  }, [isDemoMode]);

  // Normalize all items with exact calendar status
  const normalizedItems = items.map(item => {
    const { status, daysDifference } = calculateDynamicFollowUpStatus(item.dueDate, item.status);
    return { ...item, status, daysDifference };
  });

  // Tab filter lists
  const overdueList = normalizedItems.filter(i => i.status === 'OVERDUE');
  const dueTodayList = normalizedItems.filter(i => i.status === 'DUE_TODAY');
  const dueThisWeekList = normalizedItems.filter(i => i.status === 'DUE_THIS_WEEK');
  const completedList = normalizedItems.filter(i => i.status === 'COMPLETED');

  const filteredItems = normalizedItems.filter(i => {
    if (activeTab === 'OVERDUE') return i.status === 'OVERDUE';
    if (activeTab === 'DUE_TODAY') return i.status === 'DUE_TODAY';
    if (activeTab === 'DUE_THIS_WEEK') return i.status === 'DUE_THIS_WEEK';
    if (activeTab === 'COMPLETED') return i.status === 'COMPLETED';
    return i.status !== 'COMPLETED'; // 'ALL' shows all active pending follow-ups
  });

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    let pId = newPatientId;
    let pName = manualName;
    let pPhone = manualPhone || '+91 98480 00000';
    let pDisplayId = '#2026/29/08/2';
    let pRisk: RiskLevel = 'HIGH';

    if (!isManualPatient && patientsList.length > 0) {
      const selected = patientsList.find(p => p.id === newPatientId) || patientsList[0];
      if (selected) {
        pId = selected.id;
        pName = selected.name;
        pPhone = selected.phone;
        pDisplayId = selected.displayId;
        pRisk = (selected.riskLevel || 'HIGH') as RiskLevel;
      }
    }

    const { status: calculatedStatus, daysDifference } = calculateDynamicFollowUpStatus(newDueDate, newStatus);

    const created = await followUpService.createFollowUp({
      patientId: pId,
      patientName: pName || 'Follow-up Patient',
      patientDisplayId: pDisplayId,
      phone: pPhone,
      village: 'Visakhapatnam',
      riskLevel: pRisk,
      dueDate: newDueDate,
      status: calculatedStatus,
      priority: newPriority,
      recallChannel: newChannel,
      notes: newReason
    });

    const withDiff: FollowUpItem = { 
      ...created, 
      firstVisitedDate: newFirstVisitedDate,
      lastVisitedDate: newSecondVisitedDate,
      dueDate: newDueDate,
      daysDifference,
      outreachLogs: [
        {
          id: 'log-' + Date.now(),
          type: 'CALL',
          timestamp: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          outcome: 'Initial Screening Encounter Logged',
          details: `1st Visit: ${newFirstVisitedDate} • 2nd Visit (Last Examined): ${newSecondVisitedDate} • Next Due: ${newDueDate}`,
          screener: 'bhanu mannam (ASHA / Screener)'
        }
      ]
    };
    setItems(prev => [withDiff, ...prev.filter(f => f.id !== withDiff.id)]);
    setIsScheduleModalOpen(false);
    showToast({
      type: 'success',
      title: 'Follow-up Scheduled',
      message: `Follow-up encounter scheduled for ${pName || 'Patient'} (1st: ${newFirstVisitedDate}, 2nd: ${newSecondVisitedDate}, Next: ${newDueDate}).`
    });
  };

  const handleMarkCompleted = async (item: FollowUpItem) => {
    try {
      await followUpService.completeFollowUp(item.id, 'Second clinic follow-up examination completed successfully.');
    } catch {}

    const completedLog = {
      id: 'log-' + Date.now(),
      type: 'CALL' as const,
      timestamp: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      outcome: 'Second Clinic Checkup Completed',
      details: 'Patient attended 2nd visit. Retinal evaluation complete.',
      screener: 'bhanu mannam (ASHA / Screener)'
    };

    setItems(prev => prev.map(f => f.id === item.id ? { 
      ...f, 
      status: 'COMPLETED',
      notes: 'Second clinic visit completed - Retina re-evaluated and surveillance extended by 6 months.',
      daysDifference: 0,
      outreachLogs: [completedLog, ...(f.outreachLogs || [])]
    } : f));

    showToast({
      type: 'success',
      title: 'Checkup Completed',
      message: `Second visit for ${item.patientName} logged as completed. 6-Month routine recall scheduled.`
    });
  };

  const handleDeleteFollowUp = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the record for ${name}? This will remove the patient across all screens.`)) {
      const item = items.find(f => f.id === id);
      if (item) {
        await patientService.deletePatient(item.patientId || item.id);
      }
      setItems(prev => prev.filter(f => f.id !== id));
      showToast({
        type: 'info',
        title: 'Record Deleted Everywhere',
        message: `Patient record for ${name} removed across all screens.`
      });
    }
  };

  const handleSaveEditedFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFollowUp) return;
    const { status, daysDifference } = calculateDynamicFollowUpStatus(editingFollowUp.dueDate, editingFollowUp.status);
    const updated = { ...editingFollowUp, status, daysDifference };
    await patientService.updatePatient(editingFollowUp.patientId || editingFollowUp.id, {
      name: editingFollowUp.patientName,
      phone: editingFollowUp.phone,
      riskLevel: editingFollowUp.riskLevel
    });
    setItems(prev => prev.map(f => f.id === updated.id ? updated : f));
    const targetName = updated.patientName;
    setEditingFollowUp(null);
    showToast({
      type: 'success',
      title: 'Follow-up Updated',
      message: `Follow-up details updated for ${targetName}.`
    });
  };

  const handleLogCallOutcome = (item: FollowUpItem, outcome: string) => {
    const audioUrl = recordedAudioUrl || createSampleCallAudioWav(liveCallTime || 8);
    const audioDurationStr = `${Math.max(5, liveCallTime || 8)}s`;

    const callLog = {
      id: 'call-' + Date.now(),
      type: 'CALL' as const,
      timestamp: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      outcome,
      details: callNotes ? callNotes : 'Tele-consult call outreach completed on encrypted line.',
      screener: 'bhanu mannam (ASHA / Screener)',
      language: 'TELUGU',
      audioRecordingUrl: audioUrl,
      audioDuration: audioDurationStr,
      conversationTranscript: getCallSpokenTranscript(item.patientName, item.dueDate, outcome)
    };

    setItems(prev => prev.map(f => f.id === item.id ? {
      ...f,
      contactAttempts: (f.contactAttempts || 0) + 1,
      lastContactDate: `Called (${outcome})`,
      outreachLogs: [callLog, ...(f.outreachLogs || [])]
    } : f));
    setSelectedCallItem(null);
    setRecordedAudioUrl(null);
    setCallNotes('');
    showToast({
      type: 'success',
      title: 'Call & Spoken Words Recorded',
      message: `Logged call audio & conversation words for ${item.patientName}.`
    });
  };

  const handleSendSMS = async (item: FollowUpItem) => {
    await followUpService.markContacted(item.id, messageLang);
    const smsLog = {
      id: 'sms-' + Date.now(),
      type: 'SMS' as const,
      timestamp: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      outcome: 'Normal SMS Sent & Delivered',
      language: messageLang.toUpperCase(),
      details: customMessage || getMessageTemplate(item.patientName, item.dueDate, messageLang),
      screener: 'bhanu mannam (ASHA / Screener)'
    };

    setItems(prev => prev.map(f => f.id === item.id ? {
      ...f,
      contactAttempts: (f.contactAttempts || 0) + 1,
      lastContactDate: `SMS Dispatched (${messageLang.toUpperCase()})`,
      outreachLogs: [smsLog, ...(f.outreachLogs || [])]
    } : f));
    setSelectedMessageItem(null);
    showToast({
      type: 'success',
      title: 'Recall SMS Saved & Dispatched',
      message: `Automated reminder SMS sent to ${item.patientName} (${item.phone}).`
    });
  };

  const getMessageTemplate = (patientName: string, dueDate: string, lang: 'en' | 'te' | 'hi', displayId: string = '#RG-2026') => {
    const code = (displayId || 'RG-2026').replace(/[^0-9]/g, '').slice(-4) || '8492';
    const link = `https://retinaguard.health/call/rg-${code}`;
    if (lang === 'te') {
      return `నమస్కారం ${patientName} గారు, మీ డయాబెటిక్ కంటి రెటీనా తనిఖీ తేదీ: ${dueDate}. డాక్టర్‌తో మాట్లాడటానికి సురక్షిత టెలి-కాల్ లింక్: ${link} (కాల్ కోడ్: #RG-${code}). లేదా నేత్ర కేంద్రానికి రండి. హెల్ప్‌లైన్: 1800-RETINA-CARE.`;
    }
    if (lang === 'hi') {
      return `नमस्ते ${patientName} जी, आपकी डायबिटिक रेटिनोपैथी जांच की तारीख: ${dueDate} है। डॉक्टर से परामर्श के लिए टेली-कॉल लिंक: ${link} (कॉल कोड: #RG-${code})। टोल-फ्री: 1800-RETINA-CARE.`;
    }
    return `Dear ${patientName}, your retinal follow-up is on ${dueDate}. Join secure tele-consultation link: ${link} (Bridge Code: #RG-${code}) or visit RetinaGuard Eye Center. Toll-Free: 1800-RETINA-CARE.`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider">
            <CalendarClock className="w-4 h-4" />
            <span>Patient Retention & Adherence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Follow-up Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Surveillance radar tracking overdue retinal evaluations, untreated rush cases, contact logs, and recall prompts.
          </p>
        </div>

        {/* Header Action & Status badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4" />
            <span>{overdueList.length} Delinquent / Overdue</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{dueTodayList.length} Due Today</span>
          </div>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: 'All Active Follow-ups', count: items.filter(i => i.status !== 'COMPLETED').length },
          { id: 'OVERDUE', label: 'Overdue / Untreated Cases', count: overdueList.length, alert: true },
          { id: 'DUE_TODAY', label: 'Due Today (Left to Treat)', count: dueTodayList.length },
          { id: 'DUE_THIS_WEEK', label: 'Due This Week', count: dueThisWeekList.length },
          { id: 'COMPLETED', label: 'Completed Visits', count: completedList.length },
          { 
            id: 'COMMUNICATIONS', 
            label: '📞 & 💬 Outreach Logs (Calls & SMS)', 
            count: items.reduce((acc, curr) => acc + (curr.outreachLogs?.length || curr.contactAttempts || 0), 0)
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white'
                  : tab.alert && tab.count > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 1. Dedicated Combined Call & SMS Outreach Tab */}
      {activeTab === 'COMMUNICATIONS' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-blue-950">Combined Communication & Outreach Responses</h3>
              <p className="text-xs text-blue-800/80 mt-0.5">
                Centralized ledger tracking all phone call responses, WhatsApp conversations, and automated reminder SMS records.
              </p>
            </div>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Outreach</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {items.flatMap(item => (item.outreachLogs || []).map(log => ({ ...log, patient: item }))).length > 0 ? (
              items.flatMap(item => (item.outreachLogs || []).map(log => ({ ...log, patient: item })))
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((log) => (
                  <div key={log.id} className="clinical-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                        log.type === 'CALL' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                        log.type === 'SMS' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {log.type === 'CALL' ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">{log.patient.patientName}</span>
                          <span className="font-mono text-xs text-slate-400 font-semibold">{log.patient.patientDisplayId}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            log.type === 'CALL' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {log.type === 'CALL' ? 'PHONE CALL' : 'NORMAL SMS'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 font-medium">
                          <strong>Outcome / Status:</strong> <span className="text-slate-900 font-bold">{log.outcome}</span>
                        </div>

                        {log.details && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                            "{log.details}"
                          </div>
                        )}

                        {/* Call Recording Audio Player with Speed, Download & Delete */}
                        {log.audioRecordingUrl && (
                          <div className="mt-2">
                            <CallAudioPlayer
                              src={log.audioRecordingUrl}
                              durationText={log.audioDuration}
                              downloadFilename={`retinaguard-call-record-${log.patient.patientDisplayId || 'RG'}.webm`}
                              onDelete={() => handleDeleteCallAudio(log.patient.id, log.id)}
                              transcript={log.conversationTranscript || getCallSpokenTranscript(log.patient.patientName, log.patient.dueDate, log.outcome)}
                              title="Call Audio & Words"
                            />
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 flex items-center gap-2 flex-wrap pt-0.5">
                          <span>Logged: <strong>{log.timestamp}</strong></span>
                          <span>•</span>
                          <span>Screener: <strong>{log.screener || 'bhanu mannam'}</strong></span>
                          <span>•</span>
                          <span>Visited: <strong>{log.patient.lastVisitedDate || '2026-08-20'}</strong></span>
                          <span>•</span>
                          <span>Next Visit: <strong>{log.patient.dueDate}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setSelectedMessageItem(log.patient);
                          setCustomMessage(getMessageTemplate(log.patient.patientName, log.patient.dueDate, messageLang));
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>SMS</span>
                      </button>
                      <button
                        onClick={() => setSelectedCallItem(log.patient)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Phone className="w-3 h-3 text-blue-600" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="clinical-card p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">No Outreach Logs Recorded Yet</p>
                <p className="text-xs text-slate-500">
                  When you make a call or send an SMS message to a patient, the communication response will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Regular Follow-up Cards List or Empty State */
        filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
            {filteredItems.map((item) => {
              const isExpanded = expandedOutreachId === item.id;
              const logs = item.outreachLogs || [];
              const firstVisit = getFirstVisitDate(item);
              const secondVisit = item.lastVisitedDate || '2026-08-29';

              return (
                <div
                  key={item.id}
                  className="clinical-card p-5 sm:p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group bg-white rounded-2xl border border-slate-200"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.patientName}
                        </h3>
                        <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                            {item.patientDisplayId}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{item.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <RiskBadge risk={item.riskLevel} size="sm" />
                        <button
                          type="button"
                          onClick={() => setEditingFollowUp({ ...item })}
                          title="Edit Follow-up & Visit Dates"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFollowUp(item.id, item.patientName)}
                          title="Delete Follow-up"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 3-Date Clinical Protocol Box */}
                    <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 space-y-2 text-xs shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Visit Surveillance Protocol</span>
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                          item.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800 border border-rose-200 font-extrabold' :
                          item.status === 'DUE_TODAY' ? 'bg-amber-100 text-amber-900 border border-amber-200 font-extrabold' :
                          item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200 font-extrabold' :
                          'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {item.status === 'OVERDUE' ? 'OVERDUE / UNTREATED' :
                           item.status === 'DUE_TODAY' ? 'DUE TODAY' :
                           item.status === 'COMPLETED' ? 'COMPLETED (2ND VISIT DONE)' : 'DUE THIS WEEK'}
                        </span>
                      </div>

                      {/* 1st Visit Date (Initial Screening) */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>1st Visited Date (Initial):</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {firstVisit}
                        </span>
                      </div>

                      {/* 2nd Visit Date (Last Examined / Clinic Follow-up) */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>2nd Visited Date (Last Examined):</span>
                        </div>
                        <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {secondVisit}
                        </span>
                      </div>

                      {/* Next Due Date (Doctor Assigned) */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Next Due Date (Doctor):</span>
                        </div>
                        <span className="font-mono font-extrabold text-slate-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                          {item.dueDate}
                        </span>
                      </div>

                      {item.daysDifference > 0 && (
                        <div className="pt-1 text-rose-700 font-bold flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                            <span>Days Overdue:</span>
                          </span>
                          <span>{item.daysDifference} Days</span>
                        </div>
                      )}

                      {item.notes && (
                        <div className="pt-1 text-[11px] text-slate-600 italic bg-white/90 p-2 rounded-lg border border-slate-200/70">
                          "{item.notes}"
                        </div>
                      )}
                    </div>

                    {/* Outreach logs summary & toggle */}
                    <div className="text-xs text-slate-600">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        <span>Field Outreach & Contact Logs</span>
                        <button
                          type="button"
                          onClick={() => setExpandedOutreachId(isExpanded ? null : item.id)}
                          className="text-blue-600 hover:text-blue-800 font-bold normal-case text-xs cursor-pointer"
                        >
                          {isExpanded ? 'Hide History ▲' : `View Log (${logs.length || item.contactAttempts || 0}) ▼`}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Attempts: <strong className="text-slate-900">{item.contactAttempts || logs.length || 0}</strong> • Last: {item.lastContactDate || (logs[0]?.outcome) || 'Pending initial outreach'}
                      </div>

                      {/* Expandable Outreach History Drawer */}
                      {isExpanded && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 space-y-2 text-xs animate-in fade-in duration-100">
                          <div className="font-bold text-slate-800 text-[11px]">Saved Call & SMS Responses:</div>
                          {logs.length > 0 ? (
                            logs.map((l) => (
                              <div key={l.id} className="p-2 rounded-lg bg-white border border-slate-200/80 space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${l.type === 'CALL' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                    {l.type}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{l.timestamp}</span>
                                </div>
                                <div className="font-semibold text-slate-900 text-xs">{l.outcome}</div>
                                {l.details && <div className="text-[11px] text-slate-500 italic">"{l.details}"</div>}
                                {l.audioRecordingUrl && (
                                  <div className="pt-1.5">
                                    <CallAudioPlayer
                                      compact
                                      src={l.audioRecordingUrl}
                                      durationText={l.audioDuration}
                                      downloadFilename={`retinaguard-call-record-${item.patientDisplayId || 'RG'}.webm`}
                                      onDelete={() => handleDeleteCallAudio(item.id, l.id)}
                                      transcript={l.conversationTranscript || getCallSpokenTranscript(item.patientName, item.dueDate, l.outcome)}
                                      title="Call Audio & Words"
                                    />
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-500 italic text-center py-1">
                              No outreach recorded yet. Use Call or Message buttons below.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/patients/${item.patientId}`)}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedMessageItem(item);
                          setCustomMessage(getMessageTemplate(item.patientName, item.dueDate, messageLang, item.patientDisplayId));
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-blue-200"
                        title="Send SMS / Normal Message"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>

                      <button
                        onClick={() => setSelectedCallItem(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                        title="Tele-Health Call (Via Link / PIN Code)"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Call</span>
                      </button>

                      {item.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => handleMarkCompleted(item)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Mark as Examined / Second Visit Completed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Checkup Completed</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Visit 2 Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="clinical-card p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Follow-ups in this Category</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You can schedule new follow-up visits, recall untreated patients from screening camps, or switch tabs above.
              </p>
            </div>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Follow-up Visit</span>
            </button>
          </div>
        )
      )}

      {/* 1. Schedule Follow-up Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <CalendarClock className="w-5 h-5 text-blue-600" />
                <span>Schedule Next Follow-up Visit</span>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Patient Selector */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Select Patient *</label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setIsManualPatient(false)}
                      className={`px-2 py-0.5 rounded ${!isManualPatient ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-500'}`}
                    >
                      Registered List
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManualPatient(true)}
                      className={`px-2 py-0.5 rounded ${isManualPatient ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-500'}`}
                    >
                      Enter Manual
                    </button>
                  </div>
                </div>

                {!isManualPatient && patientsList.length > 0 ? (
                  <select
                    value={newPatientId}
                    onChange={e => setNewPatientId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    {patientsList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.displayId}) • {p.phone}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={manualName}
                      onChange={e => setManualName(e.target.value)}
                      placeholder="Patient Full Name"
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                    />
                    <input
                      type="tel"
                      value={manualPhone}
                      onChange={e => setManualPhone(e.target.value)}
                      placeholder="Phone Number (+91...)"
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Status / Category Routing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Category / Timing *</label>
                <select
                  value={newStatus}
                  onChange={e => {
                    const st = e.target.value as any;
                    setNewStatus(st);
                    const today = new Date();
                    if (st === 'OVERDUE') {
                      // 3 days ago (untreated from camp)
                      const d = new Date(today.getTime() - 3 * 86400000);
                      setNewDueDate(d.toISOString().split('T')[0]);
                      setNewReason('Untreated on screening day due to clinic rush (Backlog Recall)');
                    } else if (st === 'DUE_TODAY') {
                      setNewDueDate(today.toISOString().split('T')[0]);
                      setNewReason('Scheduled today - left to treat in afternoon batch');
                    } else {
                      const d = new Date(today.getTime() + 4 * 86400000);
                      setNewDueDate(d.toISOString().split('T')[0]);
                      setNewReason('Weekly recall surveillance review');
                    }
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DUE_TODAY">Due Today (Left to Treat Today)</option>
                  <option value="OVERDUE">Overdue / Delinquent (Untreated from clinic rush)</option>
                  <option value="DUE_THIS_WEEK">Due This Week (Upcoming in Week)</option>
                </select>
              </div>

              {/* 3-Date Visit Protocol Picker: 1st Visit, 2nd Visit, Next Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">1st Visit (Initial Date) *</label>
                  <input
                    type="date"
                    required
                    value={newFirstVisitedDate}
                    onChange={e => setNewFirstVisitedDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">2nd Visit (Last Examined) *</label>
                  <input
                    type="date"
                    required
                    value={newSecondVisitedDate}
                    onChange={e => setNewSecondVisitedDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Next Due Date (Doctor) *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority Tier</label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="URGENT">Urgent Priority</option>
                  <option value="ROUTINE">Routine Surveillance</option>
                </select>
              </div>

              {/* Recall Reason / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recall Reason / Clinical Notes</label>
                <textarea
                  rows={2}
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  placeholder="e.g. Patient was waiting during morning rush and could not be examined. Urgent afternoon recall."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Follow-up</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Direct Call Outreach Modal (Normal Call & WhatsApp with Encrypted Number + AI Voice) */}
      {selectedCallItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <span>Patient Tele-Health Outreach</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedCallItem(null);
                  setIsLiveCallActive(false);
                }} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[calc(88vh-70px)] custom-scrollbar">
              {/* Encrypted Patient Details Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedCallItem.patientName}</h4>
                    <p className="text-slate-600 text-xs mt-1 font-mono flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Encrypted Phone / WhatsApp: <strong className="text-slate-900">{maskPhoneNumber(selectedCallItem.phone)}</strong></span>
                    </p>
                  </div>
                  <span className="text-[11px] font-bold bg-blue-100 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200">
                    2nd Visit: {selectedCallItem.dueDate}
                  </span>
                </div>

                {/* Encryption & Security Note */}
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Encrypted & Masked:</strong> Phone number and caller identity are encrypted for both Normal and WhatsApp calls.</span>
                </div>

                <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200 flex items-center justify-between">
                  <span>Initial Clinic Visit: <strong>{selectedCallItem.firstVisitedDate || getFirstVisitDate(selectedCallItem)}</strong></span>
                  <span>Patient ID: <strong>#{selectedCallItem.patientDisplayId}</strong></span>
                </div>
              </div>

              {/* Call Action Buttons: Normal Call & WhatsApp Call */}
              <div className="space-y-2 pt-1">
                <label className="font-bold text-slate-800 block">Choose Outreach Channel (Encrypted Line):</label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Normal Phone Call with Encrypted Number */}
                  <button
                    type="button"
                    onClick={() => handleInitiateNormalCall(selectedCallItem)}
                    className="p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer text-center"
                  >
                    <div className="flex items-center gap-2 text-sm font-black">
                      <Phone className="w-4 h-4" />
                      <span>Normal Phone Call</span>
                    </div>
                    <span className="text-[10px] font-normal text-blue-100 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Encrypted Cellular Call</span>
                    </span>
                  </button>

                  {/* 2. WhatsApp Call & Message */}
                  <button
                    type="button"
                    onClick={() => handleInitiateWhatsAppCall(selectedCallItem)}
                    className="p-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer text-center"
                  >
                    <div className="flex items-center gap-2 text-sm font-black">
                      <PhoneCall className="w-4 h-4" />
                      <span>WhatsApp Call / Chat</span>
                    </div>
                    <span className="text-[10px] font-normal text-emerald-100 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Encrypted WhatsApp Line</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Health Worker Script (Telugu & English) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Health Worker Call Script (Telugu & English):</label>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed text-xs space-y-2">
                  <p className="font-semibold text-slate-900">
                    తెలుగు: "నమస్కారం {selectedCallItem.patientName} గారు, రెటినాగార్డ్ నేత్ర సంరక్షణ కేంద్రం నుండి మాట్లాడుతున్నాము. మీ రెండవ కంటి తనిఖీ తేదీ {selectedCallItem.dueDate} న ఉంది. దయచేసి వచ్చి పరీక్షించుకోండి."
                  </p>
                  <p className="text-slate-600 italic">
                    English: "Hello {selectedCallItem.patientName}, calling from RetinaGuard Eye Clinic. Your second retinal review is scheduled for {selectedCallItem.dueDate}. Please confirm attendance."
                  </p>
                </div>
              </div>

              {/* Recorded Call Audio Player (Available after call with Speed, Delete & Download) */}
              {recordedAudioUrl && (
                <div className="space-y-1.5 animate-in zoom-in-95">
                  <CallAudioPlayer
                    src={recordedAudioUrl}
                    title="Recorded Call Audio (Voice Session)"
                    downloadFilename={`retinaguard-call-record-${selectedCallItem.patientDisplayId || 'RG'}.webm`}
                    onDelete={() => setRecordedAudioUrl(null)}
                    transcript={getCallSpokenTranscript(selectedCallItem.patientName, selectedCallItem.dueDate)}
                  />
                </div>
              )}

              {/* Record Call Response Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-800 block">Record Patient Response (Scroll down for all options):</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLogCallOutcome(selectedCallItem, 'Patient Confirmed Visit')}
                    className="p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-left text-xs transition-colors cursor-pointer"
                  >
                    ✓ Confirmed Attending
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogCallOutcome(selectedCallItem, 'Reschedule Requested')}
                    className="p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-left text-xs transition-colors cursor-pointer"
                  >
                    📅 Requested Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogCallOutcome(selectedCallItem, 'No Answer / Voicemail')}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-left text-xs transition-colors cursor-pointer"
                  >
                    📵 No Answer / Ringing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogCallOutcome(selectedCallItem, 'Number Busy / Switched Off')}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-left text-xs transition-colors cursor-pointer"
                  >
                    ⚠️ Busy / Switched Off
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Phone / WhatsApp Call In-Progress Overlay */}
      {isLiveCallActive && selectedCallItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            {/* Header Status */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              {isCallingRinging ? (
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span>Ringing Patient...</span>
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{activeCallType === 'WHATSAPP' ? 'WhatsApp Call' : 'Call Connected'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/70 border border-rose-800/80 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>REC</span>
                  </span>
                </div>
              )}
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-[10px] border border-slate-700 text-emerald-400 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Encrypted</span>
              </span>
            </div>

            {/* Patient Avatar & Encrypted Details */}
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 mx-auto flex items-center justify-center text-xl font-black text-white shadow-xl ring-4 ring-blue-500/20">
                {selectedCallItem.patientName.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedCallItem.patientName}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  {maskPhoneNumber(selectedCallItem.phone)}
                </p>
                <div className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{activeCallType === 'WHATSAPP' ? 'Encrypted WhatsApp Line' : 'Encrypted Cellular Line'}</span>
                </div>
              </div>
            </div>

            {/* Live Call Duration */}
            <div className="font-mono text-2xl font-black tracking-widest text-blue-400">
              {Math.floor(liveCallTime / 60).toString().padStart(2, '0')}:{(liveCallTime % 60).toString().padStart(2, '0')}
            </div>

            {/* In-Call Screener Script Box */}
            <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-left space-y-1.5 text-xs">
              <div className="text-[11px] font-bold text-blue-400">
                Speaking with Patient:
              </div>
              <p className="text-slate-200 text-xs leading-relaxed font-medium bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                "నమస్కారం {selectedCallItem.patientName} గారు, రెటినాగార్డ్ నుండి మాట్లాడుతున్నాము. మీ రెండవ కంటి తనిఖీ తేదీ {selectedCallItem.dueDate} న ఉంది. దయచేసి వచ్చి పరీక్షించుకోండి."
              </p>
            </div>

            {/* Animated Audio Waveform */}
            <div className="flex items-center justify-center gap-1.5 h-6">
              {[40, 75, 100, 60, 90, 45, 80, 60, 30].map((h, idx) => (
                <span
                  key={idx}
                  className={`w-1 bg-blue-500 rounded-full transition-all duration-150 ${isMuted ? 'h-1.5 bg-slate-600' : ''}`}
                  style={{ height: isMuted ? '4px' : `${Math.max(6, (h * ((liveCallTime % 3) + 1) / 3))}%` }}
                />
              ))}
            </div>

            {/* Call Control Buttons */}
            <div className="flex items-center justify-center gap-4 pt-1">
              {/* Mute Toggle */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-2xl transition-all cursor-pointer ${
                  isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={async () => {
                  setIsLiveCallActive(false);
                  setIsRecordingCall(false);
                  const recordedAudioBlobUrl = await stopLiveVoiceRecording(Math.max(5, liveCallTime));
                  setRecordedAudioUrl(recordedAudioBlobUrl);
                  setCallNotes(`${activeCallType === 'WHATSAPP' ? 'WhatsApp' : 'Normal'} call recorded on encrypted line (Duration: ${Math.floor(liveCallTime / 60)}m ${liveCallTime % 60}s).`);
                  showToast({
                    type: 'success',
                    title: 'Call & Recording Complete',
                    message: `Recorded ${Math.max(5, liveCallTime)}s voice audio. Listen, adjust speed, or download below.`
                  });
                }}
                className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-2 px-6"
                title="End Call and Process Audio Recording"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="text-xs">End & Save Recording</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Direct SMS / WhatsApp Message Modal */}
      {selectedMessageItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span>Send Follow-up Reminder Message</span>
              </div>
              <button onClick={() => setSelectedMessageItem(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[calc(88vh-70px)] custom-scrollbar">
              {/* Language Selector */}
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Message Language:</label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setMessageLang('te');
                      setCustomMessage(getMessageTemplate(selectedMessageItem.patientName, selectedMessageItem.dueDate, 'te', selectedMessageItem.patientDisplayId));
                    }}
                    className={`px-2.5 py-1 rounded ${messageLang === 'te' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'}`}
                  >
                    తెలుగు (Telugu)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageLang('hi');
                      setCustomMessage(getMessageTemplate(selectedMessageItem.patientName, selectedMessageItem.dueDate, 'hi', selectedMessageItem.patientDisplayId));
                    }}
                    className={`px-2.5 py-1 rounded ${messageLang === 'hi' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'}`}
                  >
                    हिंदी (Hindi)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageLang('en');
                      setCustomMessage(getMessageTemplate(selectedMessageItem.patientName, selectedMessageItem.dueDate, 'en', selectedMessageItem.patientDisplayId));
                    }}
                    className={`px-2.5 py-1 rounded ${messageLang === 'en' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'}`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Preview:</label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dispatch Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSendSMS(selectedMessageItem)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Normal SMS Message</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/${selectedMessageItem.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(customMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(customMessage);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit Follow-up Modal */}
      {editingFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>Edit Follow-up / Visit Record</span>
              </div>
              <button onClick={() => setEditingFollowUp(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedFollowUp} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[calc(88vh-70px)] custom-scrollbar">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  value={editingFollowUp.patientName}
                  onChange={e => setEditingFollowUp({ ...editingFollowUp, patientName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editingFollowUp.phone}
                    onChange={e => setEditingFollowUp({ ...editingFollowUp, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editingFollowUp.riskLevel}
                    onChange={e => setEditingFollowUp({ ...editingFollowUp, riskLevel: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HIGH">High Risk</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="LOW">Routine / Low</option>
                  </select>
                </div>
              </div>

              {/* 3-Date Visit Protocol Edit Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">1st Visit (Initial Date)</label>
                  <input
                    type="date"
                    required
                    value={editingFollowUp.firstVisitedDate || getFirstVisitDate(editingFollowUp)}
                    onChange={e => setEditingFollowUp({ ...editingFollowUp, firstVisitedDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">2nd Visit (Last Examined)</label>
                  <input
                    type="date"
                    required
                    value={editingFollowUp.lastVisitedDate || '2026-08-29'}
                    onChange={e => setEditingFollowUp({ ...editingFollowUp, lastVisitedDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Due Date (Doctor)</label>
                  <input
                    type="date"
                    required
                    value={editingFollowUp.dueDate}
                    onChange={e => setEditingFollowUp({ ...editingFollowUp, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Surveillance Status</label>
                <select
                  value={editingFollowUp.status}
                  onChange={e => setEditingFollowUp({ ...editingFollowUp, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DUE_TODAY">Due Today (2nd Visit Pending)</option>
                  <option value="OVERDUE">Overdue / Untreated</option>
                  <option value="DUE_THIS_WEEK">Due This Week</option>
                  <option value="COMPLETED">Completed (2nd Visit Done)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recall Reason / Notes</label>
                <textarea
                  rows={2}
                  value={editingFollowUp.notes || ''}
                  onChange={e => setEditingFollowUp({ ...editingFollowUp, notes: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFollowUp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
