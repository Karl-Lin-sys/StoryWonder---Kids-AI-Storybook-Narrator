import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
  Wand2,
  Settings2,
  Sliders,
  Award,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Story, StoryPage, ImageSize, AspectRatio } from '../types/story';
import { ReillustrateModal } from './ReillustrateModal';

interface StoryReaderProps {
  story: Story;
  onUpdateStoryPage: (pageIndex: number, updatedFields: Partial<StoryPage>) => void;
  onOpenCompanionWithContext: (pageText: string, pageNum: number) => void;
}

const VOICES = [
  { id: 'Kore', name: '🌸 Kore', desc: 'Warm & Gentle' },
  { id: 'Puck', name: '🦊 Puck', desc: 'Lively & Playful' },
  { id: 'Zephyr', name: '🌙 Zephyr', desc: 'Soothing Bedtime' },
  { id: 'Fenrir', name: '🦁 Fenrir', desc: 'Bold & Adventurous' },
];

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  onUpdateStoryPage,
  onOpenCompanionWithContext,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [autoTurnPage, setAutoTurnPage] = useState(false);

  // Audio Playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // Re-illustrate Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingIllustration, setIsGeneratingIllustration] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentPage = story.pages[currentPageIndex] || story.pages[0];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === story.pages.length - 1;

  // Stop audio when changing pages
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setTtsError(null);
  }, [currentPageIndex]);

  // Handle TTS synthesis with gemini-3.8-flash-tts
  const handlePlayTTS = async () => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    // If we already have audio loaded for this page with current voice
    if (currentPage.audioUrl && audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlayingAudio(true);
        return;
      } catch (err) {
        console.warn('Playback error with cached audio, re-fetching...', err);
      }
    }

    // Call server API for gemini-3.8-flash-tts
    setIsLoadingAudio(true);
    setTtsError(null);

    try {
      const response = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentPage.text,
          voice: selectedVoice,
          style:
            selectedVoice === 'Zephyr'
              ? "Soothing, gentle, calm bedtime children's story narrator speaking softly and serenely"
              : selectedVoice === 'Puck'
              ? "Lively, animated, cheerful children's story narrator speaking with bouncy joy and enthusiasm"
              : "Warm, captivating children's storybook narrator speaking clearly with wonder and delight",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.audioUrl) {
        throw new Error(data.error || 'Failed to synthesize speech');
      }

      // Update page with audio
      onUpdateStoryPage(currentPageIndex, { audioUrl: data.audioUrl });

      // Play audio
      if (audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlayingAudio(true);
      }
    } catch (err: any) {
      console.error('TTS playback failed:', err);
      setTtsError(err?.message || 'Could not read story aloud right now. Please try again!');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 1;
      setAudioProgress((current / duration) * 100);
      setAudioDuration(duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(100);

    // Auto-turn page if enabled and not last page
    if (autoTurnPage && !isLastPage) {
      setTimeout(() => {
        setCurrentPageIndex((prev) => prev + 1);
      }, 1200);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current && audioDuration) {
      audioRef.current.currentTime = (value / 100) * audioDuration;
      setAudioProgress(value);
    }
  };

  // Re-illustration generation using gemini-3-pro-image-preview with 1K, 2K, 4K
  const handleGenerateIllustration = async ({
    prompt,
    imageSize,
    aspectRatio,
    artStyle,
  }: {
    prompt: string;
    imageSize: ImageSize;
    aspectRatio: AspectRatio;
    artStyle: string;
  }) => {
    setIsGeneratingIllustration(true);
    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageSize,
          aspectRatio,
          artStyle,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error || 'Failed to generate illustration');
      }

      onUpdateStoryPage(currentPageIndex, {
        imageUrl: data.imageUrl,
        illustrationPrompt: prompt,
        imageSize: imageSize,
        aspectRatio: aspectRatio,
      });
    } catch (err: any) {
      alert(`Illustration error: ${err?.message || 'Failed to generate image'}`);
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  // Font size classes
  const fontClasses =
    fontSize === 'huge'
      ? 'text-2xl sm:text-3xl leading-relaxed tracking-wide'
      : fontSize === 'large'
      ? 'text-xl sm:text-2xl leading-relaxed tracking-normal'
      : 'text-lg sm:text-xl leading-normal';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentPage.audioUrl || ''}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
        onError={() => setIsPlayingAudio(false)}
      />

      {/* Top Header bar: Story title + Page counter + Voice controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-amber-100/90 border-2 border-amber-200/90 p-4 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold text-amber-800 tracking-wider uppercase bg-amber-200/90 px-2.5 py-1 rounded-full">
            {story.theme} • {story.ageGroup}
          </span>
          <h2 className="font-['Fredoka'] font-bold text-2xl sm:text-3xl text-amber-950 mt-1">
            {story.title}
          </h2>
        </div>

        {/* Top Controls: Voice selector & Font size & Auto-turn */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Voice Selector */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-amber-300 shadow-2xs">
            <span className="text-xs font-bold text-amber-900 hidden sm:inline">Voice:</span>
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                // Clear cached audio for fresh voice synthesis
                onUpdateStoryPage(currentPageIndex, { audioUrl: undefined });
              }}
              className="font-['Fredoka'] text-sm font-semibold text-amber-950 bg-transparent outline-hidden cursor-pointer"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.desc})
                </option>
              ))}
            </select>
          </div>

          {/* Text Size Pill */}
          <div className="flex items-center bg-white rounded-2xl border border-amber-300 p-1 shadow-2xs">
            {(['normal', 'large', 'huge'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-2.5 py-1 rounded-xl font-['Fredoka'] font-semibold text-xs sm:text-sm transition-all ${
                  fontSize === size
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-amber-900 hover:bg-amber-100'
                }`}
              >
                {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
              </button>
            ))}
          </div>

          {/* Auto Page Turn Switch */}
          <button
            onClick={() => setAutoTurnPage(!autoTurnPage)}
            className={`px-3 py-1.5 rounded-2xl font-['Fredoka'] text-xs sm:text-sm font-semibold border transition-all flex items-center gap-1.5 ${
              autoTurnPage
                ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Automatically turn to the next page when narration finishes"
          >
            <span>Auto-Turn</span>
            <span
              className={`w-2 h-2 rounded-full ${
                autoTurnPage ? 'bg-purple-600 animate-pulse' : 'bg-slate-300'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Storybook Double-Page Spread Card */}
      <div className="bg-white rounded-3xl sm:rounded-4xl shadow-xl border-4 border-amber-200 overflow-hidden relative transition-all">
        {/* Page progress ribbon */}
        <div className="h-2 bg-amber-100 w-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-amber-400 via-orange-400 to-pink-500 transition-all duration-300"
            style={{
              width: `${((currentPageIndex + 1) / story.pages.length) * 100}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          {/* Left Column: Full Illustration & Image Tools (7 cols on desktop) */}
          <div className="lg:col-span-7 bg-amber-50/50 p-4 sm:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-amber-200 relative group">
            {/* Top Illustration Badges */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-['Fredoka'] font-bold text-sm bg-white/90 text-amber-950 px-3 py-1 rounded-xl shadow-xs border border-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Illustration
                </span>
                {/* Image Size affordance badge: 1K, 2K, 4K */}
                <span className="font-['Fredoka'] font-bold text-xs bg-linear-to-r from-orange-500 to-pink-500 text-white px-2.5 py-1 rounded-xl shadow-xs">
                  {currentPage.imageSize || '1K'} Pro Quality
                </span>
              </div>

              {/* Action Buttons: Zoom & Re-illustrate */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={isGeneratingIllustration}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-['Fredoka'] font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Generate new artwork for this page with Gemini Pro Image"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Re-illustrate Page</span>
                </button>

                {currentPage.imageUrl && (
                  <button
                    onClick={() => setZoomImage(currentPage.imageUrl || null)}
                    className="p-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-xs transition-colors"
                    title="Zoom in full size"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Illustration Display with rounded storybook canvas */}
            <div className="relative flex-1 flex items-center justify-center min-h-[300px] sm:min-h-[380px] bg-amber-100/50 rounded-2xl overflow-hidden border-2 border-amber-200/80 shadow-inner">
              {isGeneratingIllustration ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent animate-spin flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-amber-600 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-['Fredoka'] font-bold text-lg text-amber-900">
                      Gemini 3 Pro is Painting...
                    </h4>
                    <p className="text-xs text-amber-700 font-['Quicksand'] font-medium">
                      Generating new illustration in {currentPage.imageSize || '1K'} resolution!
                    </p>
                  </div>
                </div>
              ) : currentPage.imageUrl ? (
                <img
                  src={currentPage.imageUrl}
                  alt={`Illustration for Page ${currentPage.pageNumber}`}
                  className="w-full h-full object-cover max-h-[460px] rounded-xl hover:scale-101 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <BookOpen className="w-12 h-12 text-amber-300" />
                  <p className="font-['Fredoka'] text-amber-800 font-semibold">
                    No illustration painted yet
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl font-['Fredoka'] text-sm"
                  >
                    Paint with Gemini Pro Image
                  </button>
                </div>
              )}

              {/* Resolution Watermark Pill */}
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-lg text-[11px] font-['Fredoka'] tracking-wider">
                {currentPage.imageSize || '1K'} • gemini-3-pro-image-preview
              </div>
            </div>

            {/* Prompt preview pill */}
            <p className="mt-2.5 text-xs text-amber-800/80 line-clamp-1 italic font-['Quicksand']">
              🎨 &ldquo;{currentPage.illustrationPrompt}&rdquo;
            </p>
          </div>

          {/* Right Column: Story Text & Narration Controls (5 cols on desktop) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white space-y-6">
            <div>
              {/* Page Number & Emotion Tag */}
              <div className="flex items-center justify-between mb-4 border-b border-amber-100 pb-3">
                <span className="font-['Fredoka'] font-bold text-lg text-amber-900">
                  Page {currentPage.pageNumber} of {story.pages.length}
                </span>

                {currentPage.emotion && (
                  <span className="px-3 py-0.5 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold capitalize">
                    Mood: {currentPage.emotion} ✨
                  </span>
                )}
              </div>

              {/* Story Narrative Paragraph */}
              <div className="py-2">
                <p
                  className={`font-['Quicksand'] font-bold text-slate-800 ${fontClasses} transition-all select-text`}
                >
                  {currentPage.text}
                </p>
              </div>
            </div>

            {/* TTS Narration Control Panel (gemini-3.8-flash-tts) */}
            <div className="bg-linear-to-br from-amber-50 to-orange-50/80 p-4 sm:p-5 rounded-3xl border-2 border-amber-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-['Fredoka'] font-bold text-sm sm:text-base text-amber-950">
                      Read Page Aloud
                    </h4>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Gemini TTS (gemini-3.8-flash-tts) • {selectedVoice}
                    </p>
                  </div>
                </div>

                {/* Animated wave bars while reading */}
                {isPlayingAudio && (
                  <div className="flex items-center gap-1 h-6">
                    <span className="w-1 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s] h-4"></span>
                    <span className="w-1 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s] h-6"></span>
                    <span className="w-1 bg-amber-500 rounded-full animate-bounce h-3"></span>
                    <span className="w-1 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.2s] h-5"></span>
                  </div>
                )}
              </div>

              {/* Audio Play/Pause Button & Scrubber */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayTTS}
                  disabled={isLoadingAudio}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md transition-all transform active:scale-90 cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                  } disabled:opacity-50`}
                  title={isPlayingAudio ? 'Pause Narration' : 'Read Aloud with Gemini'}
                >
                  {isLoadingAudio ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isPlayingAudio ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                {/* Scrubbing bar */}
                <div className="flex-1 space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioProgress}
                    onChange={handleSeek}
                    className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="flex justify-between text-[10px] text-amber-800 font-semibold font-['Fredoka']">
                    <span>{isPlayingAudio ? 'Listening...' : 'Ready'}</span>
                    <span>{audioDuration ? `${Math.round(audioDuration)}s` : 'Voice Audio'}</span>
                  </div>
                </div>

                {/* Replay Button */}
                {currentPage.audioUrl && (
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play();
                        setIsPlayingAudio(true);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-white text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors"
                    title="Replay from start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {ttsError && (
                <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-xl border border-red-200">
                  {ttsError}
                </p>
              )}
            </div>

            {/* Bottom Talk to Story Owl pill */}
            <div className="pt-2">
              <button
                onClick={() =>
                  onOpenCompanionWithContext(currentPage.text, currentPage.pageNumber)
                }
                className="w-full py-2.5 px-4 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-['Fredoka'] font-semibold text-sm flex items-center justify-between transition-colors group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">🦉</span>
                  <span>Ask Barnaby about this page</span>
                </span>
                <ArrowRight className="w-4 h-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Turn Footer Bar */}
        <div className="bg-amber-100/90 border-t-2 border-amber-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={isFirstPage}
            className="px-4 py-2 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 font-['Fredoka'] font-bold text-sm sm:text-base border-2 border-amber-300 shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          {/* Page Dots */}
          <div className="flex items-center gap-2">
            {story.pages.map((p, idx) => (
              <button
                key={p.pageNumber}
                onClick={() => setCurrentPageIndex(idx)}
                className={`transition-all rounded-full ${
                  idx === currentPageIndex
                    ? 'w-7 h-3 bg-amber-500 shadow-xs'
                    : 'w-3 h-3 bg-amber-300 hover:bg-amber-400'
                }`}
                title={`Go to Page ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() =>
              setCurrentPageIndex((prev) => Math.min(story.pages.length - 1, prev + 1))
            }
            disabled={isLastPage}
            className="px-5 py-2 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-['Fredoka'] font-bold text-sm sm:text-base shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{isLastPage ? 'The End! 🎉' : 'Next Page'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Re-illustrate Modal */}
      <ReillustrateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pageNumber={currentPage.pageNumber}
        initialPrompt={currentPage.illustrationPrompt}
        initialSize={currentPage.imageSize || '1K'}
        initialAspectRatio={currentPage.aspectRatio || '4:3'}
        onGenerate={handleGenerateIllustration}
        isGenerating={isGeneratingIllustration}
      />

      {/* Fullscreen Image Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <img
              src={zoomImage}
              alt="Zoomed Illustration"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border-4 border-amber-300"
            />
            <p className="text-center text-white/80 font-['Fredoka'] mt-2 text-sm">
              Click anywhere to close full view
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
