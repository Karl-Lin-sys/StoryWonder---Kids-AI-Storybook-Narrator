import React from 'react';
import { BookOpen, Sparkles, PlusCircle, Volume2, Wand2, Star, ArrowRight } from 'lucide-react';
import { Story } from '../types/story';

interface StoryLibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onOpenCreator: () => void;
  onOpenCompanion: () => void;
}

export const StoryLibrary: React.FC<StoryLibraryProps> = ({
  stories,
  onSelectStory,
  onOpenCreator,
  onOpenCompanion,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl sm:rounded-4xl bg-linear-to-r from-amber-400 via-orange-400 to-pink-500 p-8 sm:p-12 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs sm:text-sm font-semibold text-white">
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>AI Storybook Narrator & Illustrator</span>
          </div>

          <h1 className="font-['Fredoka'] font-bold text-3xl sm:text-5xl tracking-tight leading-tight">
            Magical Stories that Speak & Paint for You!
          </h1>

          <p className="font-['Quicksand'] font-medium text-base sm:text-lg text-white/95 leading-relaxed">
            Listen to expressive storytellers read aloud with <strong>Gemini TTS</strong>, and watch every page come alive with new illustrations generated in <strong>1K, 2K, or 4K</strong> resolution.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectStory(stories[0])}
              className="px-6 py-3.5 rounded-2xl bg-white text-amber-950 font-['Fredoka'] font-bold text-base shadow-md hover:bg-amber-50 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer transform active:scale-95"
            >
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span>Read Featured Book</span>
            </button>

            <button
              onClick={onOpenCreator}
              className="px-6 py-3.5 rounded-2xl bg-amber-950/40 hover:bg-amber-950/60 text-white font-['Fredoka'] font-bold text-base backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Make My Own Story</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border-2 border-amber-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-['Fredoka'] font-bold text-lg text-amber-950">Read Aloud Voice</h4>
            <p className="text-xs text-slate-600 font-['Quicksand'] font-medium">
              Powered by <strong>gemini-3.8-flash-tts</strong> with warm expressive voices.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-orange-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-['Fredoka'] font-bold text-lg text-amber-950">Gemini Pro Image</h4>
            <p className="text-xs text-slate-600 font-['Quicksand'] font-medium">
              Generates fresh illustrations in <strong>1K, 2K, & 4K</strong> resolutions!
            </p>
          </div>
        </div>

        <div
          onClick={onOpenCompanion}
          className="bg-purple-50 hover:bg-purple-100/70 p-5 rounded-3xl border-2 border-purple-200/80 shadow-xs flex items-center gap-4 cursor-pointer transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-200 text-purple-800 flex items-center justify-center text-2xl shrink-0">
            🦉
          </div>
          <div>
            <h4 className="font-['Fredoka'] font-bold text-lg text-purple-950">Story Owl Buddy</h4>
            <p className="text-xs text-purple-800 font-['Quicksand'] font-medium">
              Multi-turn chat companion: Barnaby, Pip, and Professor Eldon!
            </p>
          </div>
        </div>
      </div>

      {/* Storybook Shelf Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-['Fredoka'] font-bold text-2xl sm:text-3xl text-amber-950">
              The Story Bookshelf
            </h2>
            <p className="text-sm text-amber-800/80 font-['Quicksand'] font-semibold">
              Select a book to start reading aloud and viewing painted pages
            </p>
          </div>

          <button
            onClick={onOpenCreator}
            className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-['Fredoka'] font-bold text-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Book</span>
          </button>
        </div>

        {/* Story Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => onSelectStory(story)}
              className="group bg-white rounded-3xl border-4 border-amber-200 hover:border-amber-400 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
            >
              {/* Cover Image */}
              <div className="relative h-56 sm:h-64 overflow-hidden bg-amber-100">
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

                {/* Badge tags */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-400/90 text-amber-950 font-['Fredoka'] font-bold text-xs shadow-xs">
                    {story.pages.length} Pages
                  </span>
                  {story.isCustom && (
                    <span className="px-2.5 py-1 rounded-xl bg-purple-500 text-white font-['Fredoka'] font-bold text-xs shadow-xs">
                      ✨ Custom Made
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white font-['Fredoka'] font-semibold text-xs">
                    {story.ageGroup}
                  </span>
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-['Fredoka'] font-bold text-xl sm:text-2xl leading-tight drop-shadow-sm group-hover:text-amber-200 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-xs text-white/90 line-clamp-1 font-['Quicksand'] mt-0.5">
                    {story.tagline}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-sm text-slate-600 font-['Quicksand'] font-medium line-clamp-2 leading-relaxed">
                  {story.synopsis}
                </p>

                <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-xs text-amber-900 font-['Fredoka'] font-semibold">
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <Volume2 className="w-4 h-4" />
                    <span>Gemini TTS Ready</span>
                  </span>

                  <span className="text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Read Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
