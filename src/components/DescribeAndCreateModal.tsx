import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Wand2,
  Send,
  Loader2,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Sliders,
  Printer,
  Flame,
  Bot,
  Play,
  Pause,
} from 'lucide-react';
import { CADDesign } from '../types/cad';

interface DescribeAndCreateModalProps {
  currentDesign: CADDesign | null;
  onDesignCreated: (newDesign: CADDesign) => void;
  onClose: () => void;
}

export const DescribeAndCreateModal: React.FC<DescribeAndCreateModalProps> = ({
  currentDesign,
  onDesignCreated,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [spokenResponse, setSpokenResponse] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setPrompt(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access was denied. Please allow microphone in browser.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    setSpeechError(null);
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.warn('Could not start recognition:', err);
        }
      } else {
        setSpeechError('Voice dictation is available in Chrome, Edge, and Safari.');
      }
    }
  };

  const handleDescribeAndCreate = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || prompt.trim();
    if (!textToSubmit || isProcessing) return;

    setIsProcessing(true);
    setPipelineStep(1);
    setSpokenResponse(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    const timer1 = setTimeout(() => setPipelineStep(2), 700);
    const timer2 = setTimeout(() => setPipelineStep(3), 1400);

    try {
      const res = await fetch('/api/describe-and-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSubmit,
          currentModel: currentDesign,
          generateAudio: voiceEnabled,
        }),
      });

      const data = await res.json();
      clearTimeout(timer1);
      clearTimeout(timer2);
      setPipelineStep(4);

      if (data.success && data.model) {
        if (data.spokenText) {
          setSpokenResponse(data.spokenText);
        }

        // Handle Audio Playback
        if (data.voiceAudioBase64) {
          try {
            const binary = atob(data.voiceAudioBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);

            // Auto-play voice feedback
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onplay = () => setIsPlayingAudio(true);
            audio.onended = () => setIsPlayingAudio(false);
            audio.onerror = () => setIsPlayingAudio(false);
            audio.play().catch((e) => console.warn('Autoplay prevented:', e));
          } catch (audioErr) {
            console.warn('Error playing voice audio:', audioErr);
          }
        }

        // Apply design to studio
        setTimeout(() => {
          onDesignCreated(data.model);
        }, 600);
      }
    } catch (err: any) {
      console.error('Failed to create design from description:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Curated prompts that demonstrate the variety of Etsy products
  const examplePrompts = [
    {
      category: 'Home Decor',
      title: 'Minimalist 8-Sided Twist Planter',
      prompt: 'A modern minimalist 8-sided twisted succulent planter, 85mm wide and 75mm tall, with an internal drainage hole and matching circular drip tray.',
    },
    {
      category: 'Personalized',
      title: 'Art Deco Hotel Motel Tag',
      prompt: 'Personalized vintage hotel motel diamond keychain tag with custom relief text "LUNA", chamfered borders, and 4.5mm key ring hole.',
    },
    {
      category: 'Baking & Clay',
      title: 'Botanical Leaf Clay Cutter',
      prompt: 'A precision monstera leaf polymer clay cutter with razor sharp 0.7mm cutting blade, 2.5mm stepped support wall, and ergonomic press grip.',
    },
    {
      category: 'Laser & CNC',
      title: 'Sacred Geometry Trivet Coaster',
      prompt: 'Laser engraved sacred geometry mandala wood coaster with vector cut borders, 12 radial spokes, and 0.15mm kerf compensation.',
    },
    {
      category: 'Organization',
      title: 'Dual-Compartment Desk Bin',
      prompt: 'Gridfinity-compatible dual compartment desk organizer bin with rounded inner corners for easy scoop-out and stacking lip.',
    },
    {
      category: 'Sculptural',
      title: 'Ribbed Hourglass Modern Vase',
      prompt: 'Sculptural fluted modern ribbed hourglass vase with 2.8mm thick watertight walls and smooth organic flare.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-amber-400 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Describe a Design & Create It
                </h2>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Voice & AI CAD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Speak or type any idea to instantly generate a watertight 3D printable .STL and laser vector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition ${
                voiceEnabled
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={voiceEnabled ? 'Voice responses enabled' : 'Voice responses muted'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[11px] font-medium hidden sm:inline">Voice TTS</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Main Description Input Box with Voice Mic */}
          <div className="space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g. 'A personalized keychain with the name EMMA, 4mm thick, with a lanyard hole and rounded corners' or 'Modern 6-sided succulent pot with drainage holes'..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-4 pr-24 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 shadow-inner resize-none leading-relaxed"
              />

              {/* Action Buttons inside Textarea */}
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl transition flex items-center justify-center ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                  title={isListening ? 'Stop listening' : 'Speak your design (Mic Dictation)'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleDescribeAndCreate()}
                  disabled={!prompt.trim() || isProcessing}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-40"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  <span>Create 3D Model</span>
                </button>
              </div>
            </div>

            {/* Microphone listening indicator */}
            {isListening && (
              <div className="flex items-center gap-2 text-xs text-rose-400 animate-pulse px-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Listening to your voice... Speak your design idea clearly.</span>
              </div>
            )}

            {speechError && (
              <div className="text-xs text-amber-400 bg-amber-950/60 p-2.5 rounded-xl border border-amber-800/60">
                {speechError}
              </div>
            )}
          </div>

          {/* Creation Pipeline Animation when active */}
          {isProcessing && (
            <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Parametric Design Pipeline
                </span>
                <span className="text-slate-400 font-mono">Step {pipelineStep} of 4</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[11px]">
                <div
                  className={`p-2 rounded-xl border transition ${
                    pipelineStep >= 1
                      ? 'bg-blue-950/50 border-blue-500 text-blue-200'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  1. Intent & Aesthetics
                </div>
                <div
                  className={`p-2 rounded-xl border transition ${
                    pipelineStep >= 2
                      ? 'bg-blue-950/50 border-blue-500 text-blue-200'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  2. Watertight CAD
                </div>
                <div
                  className={`p-2 rounded-xl border transition ${
                    pipelineStep >= 3
                      ? 'bg-blue-950/50 border-blue-500 text-blue-200'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  3. Slicing & Kerf
                </div>
                <div
                  className={`p-2 rounded-xl border transition ${
                    pipelineStep >= 4
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  4. Viewport Ready
                </div>
              </div>
            </div>
          )}

          {/* Voice Response Card */}
          {spokenResponse && (
            <div className="p-4 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/40 rounded-2xl flex items-start gap-3 shadow-lg">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 flex-shrink-0 mt-0.5">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300">
                    Gemini Live CAD Assistant
                  </span>
                  {audioUrl && (
                    <button
                      onClick={toggleAudioPlay}
                      className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-medium rounded-lg border border-blue-500/40 transition"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlayingAudio ? 'Pause Voice' : 'Replay Voice'}</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{spokenResponse}"
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Model created and loaded into 3D Viewport! Ready to export .STL or .SVG.</span>
                </div>
              </div>
            </div>
          )}

          {/* Inspiring Etsy Design Prompts Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Or Select an Etsy Best-Seller Prompt:</span>
              </h4>
              <span className="text-[10px] text-slate-400">Click to instantly generate</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examplePrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(item.prompt);
                    handleDescribeAndCreate(item.prompt);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-amber-500/60 text-left transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-900/60">
                        {item.category}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition mt-1.5">
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {item.prompt}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Generates compliant 3D models with watertight meshes, calibrated slicer profiles, and laser vectors.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
