import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  BookOpen,
  BrainCircuit,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { ChatMessage, CompanionRole, TaskComplexity } from '../types/story';

interface ChatCompanionProps {
  isOpen: boolean;
  onClose: () => void;
  currentStoryTitle?: string;
  currentPageNumber?: number;
  currentPageText?: string;
}

const ROLES: {
  id: CompanionRole;
  name: string;
  avatar: string;
  tagline: string;
  model: string;
  taskComplexity: TaskComplexity;
  complexityLabel: string;
  color: string;
  greeting: string;
}[] = [
  {
    id: 'barnaby',
    name: 'Barnaby the Book Owl',
    avatar: '🦉',
    tagline: 'Friendly Story Companion & Curious Friend',
    model: 'gemini-3.5-flash',
    taskComplexity: 'general',
    complexityLabel: 'General Tasks (gemini-3.5-flash)',
    color: 'from-amber-400 to-orange-500',
    greeting:
      "Hoot! I'm Barnaby! What part of the story did you like the most? Ask me anything about the characters!",
  },
  {
    id: 'pip',
    name: 'Pip the Spark Sprite',
    avatar: '✨',
    tagline: 'Fast Rhymes, Silly Jokes & Quick Word Explainer',
    model: 'gemini-3.1-flash-lite',
    taskComplexity: 'fast',
    complexityLabel: 'Fast Tasks (gemini-3.1-flash-lite)',
    color: 'from-pink-400 to-rose-500',
    greeting:
      "Wheee! I'm Pip! Need a tricky word explained in 3 seconds flat? Or a super silly rhyme? Let's go!",
  },
  {
    id: 'eldon',
    name: 'Professor Eldon',
    avatar: '🐢',
    tagline: 'Deep Story Lore, Riddles & Moral Explorer',
    model: 'gemini-3.1-pro-preview',
    taskComplexity: 'complex',
    complexityLabel: 'Complex Tasks (gemini-3.1-pro-preview)',
    color: 'from-purple-500 to-indigo-600',
    greeting:
      'Greetings, young traveler of words. Every story carries hidden wisdom and wondrous riddles. What deeper mystery shall we explore together?',
  },
];

const SUGGESTIONS = [
  'What is the moral lesson here?',
  'Can you explain tricky words on this page?',
  'What should the hero do next?',
  'Tell me a funny joke about this story!',
  'Write a short silly poem for me!',
];

export const ChatCompanion: React.FC<ChatCompanionProps> = ({
  isOpen,
  onClose,
  currentStoryTitle,
  currentPageNumber,
  currentPageText,
}) => {
  const [selectedRole, setSelectedRole] = useState<CompanionRole>('barnaby');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'initial',
      role: 'model',
      text: ROLES[0].greeting,
      timestamp: Date.now(),
      modelUsed: ROLES[0].model,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const activeRoleData = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // When switching companion role, introduce themselves
  const handleRoleChange = (newRole: CompanionRole) => {
    setSelectedRole(newRole);
    const roleConfig = ROLES.find((r) => r.id === newRole) || ROLES[0];
    setMessages((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        role: 'model',
        text: `*swish!* ${roleConfig.greeting}`,
        timestamp: Date.now(),
        modelUsed: roleConfig.model,
      },
    ]);
  };

  // Send message to Gemini server endpoint
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // Map history for API
      const apiMessages = newHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          role: selectedRole,
          taskComplexity: activeRoleData.taskComplexity,
          currentStoryContext: currentStoryTitle
            ? {
                title: currentStoryTitle,
                currentPage: currentPageNumber,
                pageText: currentPageText,
              }
            : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Failed to get answer from companion');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'model',
          text: data.reply,
          timestamp: Date.now(),
          modelUsed: data.modelUsed,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: "Hoot! My owl feathers got tangled for a moment. Could you try asking me again?",
          timestamp: Date.now(),
          modelUsed: activeRoleData.model,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Read message aloud using gemini-3.8-flash-tts
  const handleReadMessageAloud = async (message: ChatMessage) => {
    if (playingAudioId === message.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (message.audioUrl && audioPlayerRef.current) {
      audioPlayerRef.current.src = message.audioUrl;
      audioPlayerRef.current.play();
      setPlayingAudioId(message.id);
      return;
    }

    // Call TTS API
    try {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, isLoadingAudio: true } : m))
      );

      const voice =
        selectedRole === 'pip' ? 'Puck' : selectedRole === 'eldon' ? 'Fenrir' : 'Kore';

      const response = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.text,
          voice,
          style:
            selectedRole === 'pip'
              ? 'Lively, playful, fast and enthusiastic fairy voice'
              : selectedRole === 'eldon'
              ? 'Deep, calm, wise storytelling teacher'
              : 'Warm, cozy, friendly owl buddy reading to a young child',
        }),
      });

      const data = await response.json();
      if (data.audioUrl) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id ? { ...m, audioUrl: data.audioUrl, isLoadingAudio: false } : m
          )
        );

        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = data.audioUrl;
          audioPlayerRef.current.play();
          setPlayingAudioId(message.id);
        }
      }
    } catch (err) {
      console.error('Audio synthesis failed:', err);
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, isLoadingAudio: false } : m))
      );
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Story Companion"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] bg-amber-50/95 backdrop-blur-md shadow-2xl border-l-4 border-amber-300 flex flex-col animate-in slide-in-from-right duration-250"
    >
      {/* Hidden audio element for reading companion answers */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => setPlayingAudioId(null)}
        onError={() => setPlayingAudioId(null)}
      />

      {/* Header */}
      <div className={`p-4 bg-linear-to-r ${activeRoleData.color} text-white shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl filter drop-shadow-sm">{activeRoleData.avatar}</span>
            <div>
              <h3 className="font-['Fredoka'] font-bold text-xl tracking-tight leading-tight">
                {activeRoleData.name}
              </h3>
              <p className="text-xs text-white/90 font-medium">
                {activeRoleData.complexityLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-black/15 hover:bg-black/25 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Story Context Pill */}
        {currentStoryTitle && (
          <div className="mt-3 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-xl text-xs font-['Quicksand'] font-semibold flex items-center justify-between">
            <span className="truncate">📖 Reading: {currentStoryTitle}</span>
            <span className="shrink-0 bg-white/30 px-1.5 py-0.5 rounded-md text-[10px]">
              Page {currentPageNumber || 1}
            </span>
          </div>
        )}
      </div>

      {/* Role Switcher Tabs */}
      <div className="grid grid-cols-3 p-2 bg-amber-200/70 border-b border-amber-300 gap-1.5">
        {ROLES.map((r) => {
          const isActive = selectedRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleRoleChange(r.id)}
              className={`p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-amber-950 font-bold shadow-xs scale-102 border-2 border-amber-400'
                  : 'bg-amber-100/70 text-slate-700 hover:bg-white/80'
              }`}
            >
              <span className="text-lg">{r.avatar}</span>
              <span className="font-['Fredoka'] text-xs truncate max-w-full">
                {r.id === 'barnaby' ? 'Barnaby' : r.id === 'pip' ? 'Pip Sprite' : 'Prof. Eldon'}
              </span>
              <span className="text-[9px] text-slate-500 font-medium">
                {r.taskComplexity === 'fast'
                  ? 'Fast'
                  : r.taskComplexity === 'complex'
                  ? 'Complex'
                  : 'General'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-lg shrink-0 shadow-xs">
                  {activeRoleData.avatar}
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 font-['Quicksand'] font-medium text-sm sm:text-base shadow-xs relative group ${
                  isUser
                    ? 'bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-amber-200 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                {/* Model and TTS Audio Trigger for assistant messages */}
                {!isUser && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-['Fredoka'] text-amber-800 text-[10px]">
                      {msg.modelUsed || activeRoleData.model}
                    </span>

                    <button
                      onClick={() => handleReadMessageAloud(msg)}
                      disabled={msg.isLoadingAudio}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-['Fredoka'] text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Read this reply aloud with Gemini TTS"
                    >
                      {msg.isLoadingAudio ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : playingAudioId === msg.id ? (
                        <VolumeX className="w-3 h-3 text-orange-600" />
                      ) : (
                        <Volume2 className="w-3 h-3 text-amber-700" />
                      )}
                      <span>{playingAudioId === msg.id ? 'Stop' : 'Listen'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-amber-800 font-['Fredoka'] text-sm bg-white p-3 rounded-2xl w-fit border border-amber-200 shadow-xs">
            <span className="text-xl animate-bounce">{activeRoleData.avatar}</span>
            <span>Thinking with {activeRoleData.model}...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-4 py-2 border-t border-amber-200 bg-amber-100/60 overflow-x-auto flex gap-1.5 no-scrollbar">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s)}
            disabled={isLoading}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-amber-200 text-amber-900 text-xs font-['Fredoka'] font-semibold border border-amber-300 shadow-2xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <div className="p-3 bg-white border-t border-amber-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask ${activeRoleData.name}...`}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden font-['Quicksand'] font-semibold text-slate-800 bg-amber-50/50 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="w-11 h-11 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center justify-center shadow-md disabled:opacity-50 transition-transform active:scale-95 cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
