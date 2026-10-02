import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  X,
  Minimize2,
  Maximize2,
  Loader2,
  Wand2,
  HelpCircle,
  ShieldCheck,
  Mic,
  MicOff,
} from 'lucide-react';
import { CADDesign } from '../types/cad';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ForgeCopilotChatProps {
  currentDesign: CADDesign;
  isOpen: boolean;
  onClose: () => void;
  onUpdateModel?: (newModel: CADDesign) => void;
}

export const ForgeCopilotChat: React.FC<ForgeCopilotChatProps> = ({
  currentDesign,
  isOpen,
  onClose,
  onUpdateModel,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm ForgeCopilot, your 3D printing engineer and Etsy mentor. I'm monitoring your **${currentDesign.name}** (${currentDesign.dimensions.width}x${currentDesign.dimensions.height}mm).\n\nYou can ask me technical questions or describe modifications (e.g. *"make this 10mm taller"* or *"create a bone-shaped dog tag with text MILO"*), and I'll update the CAD model!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (e: any) => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setInput(text);
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.warn(err);
        }
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    const isDesignRequest =
      /make|create|change|resize|adjust|thicker|taller|wider|add|set|build|generate|design/i.test(
        textToSend
      );

    try {
      if (isDesignRequest && onUpdateModel) {
        // Use describe-and-create for model mutation
        const res = await fetch('/api/describe-and-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: textToSend,
            currentModel: currentDesign,
            generateAudio: false,
          }),
        });
        const data = await res.json();
        if (data.success && data.model) {
          onUpdateModel(data.model);
          const reply =
            data.spokenText ||
            `I have updated your CAD model with those modifications. The new dimensions are ${data.model.dimensions.width}×${data.model.dimensions.height}mm.`;
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `${reply}\n\n✅ **Updated Active Design:** ${data.model.name}`,
            },
          ]);
          setIsLoading(false);
          return;
        }
      }

      // Standard technical advice
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentModel: currentDesign,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, I encountered an issue generating a response. Please try again.',
          },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to connect to the CAD assistant server. Check your connection.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    'How do I calibrate laser kerf for tight inlays?',
    'Will this wall thickness survive Etsy postal shipping?',
    'What slicer settings maximize print speed without stringing?',
    'Suggest 5 high-converting Etsy search tags',
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 w-96 max-w-[calc(100vw-2.5rem)] h-[520px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>ForgeCopilot AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[190px]">
              Active: {currentDesign.name}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#0d1017]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white font-medium rounded-br-none'
                  : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-line">{m.content}</div>
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-8">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Analyzing model geometry & manufacturing guidelines...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-2 bg-slate-950/60 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-[10px] whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition flex-shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleMic}
          className={`p-2 rounded-xl transition ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title={isListening ? 'Stop listening' : 'Voice Dictate'}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask or say: 'make it 10mm taller'..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
