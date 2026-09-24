import React from 'react';
import { BookOpen, Sparkles, PlusCircle, MessageCircleHeart, Volume2, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  currentView: 'library' | 'reader' | 'creator';
  onNavigate: (view: 'library' | 'reader' | 'creator') => void;
  isCompanionOpen: boolean;
  onToggleCompanion: () => void;
  hasActiveStory: boolean;
  activeStoryTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isCompanionOpen,
  onToggleCompanion,
  hasActiveStory,
  activeStoryTitle,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-amber-100/90 backdrop-blur-md border-b-2 border-amber-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate('library')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-amber-400 via-orange-400 to-pink-500 flex items-center justify-center shadow-md group-hover:scale-105 group-hover:rotate-2 transition-transform">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Fredoka'] font-bold text-2xl tracking-tight text-amber-950 group-hover:text-amber-800 transition-colors">
                StoryWonder
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-300 text-amber-900 shadow-xs">
                AI Storybook
              </span>
            </div>
            <p className="text-xs text-amber-800/80 font-medium hidden sm:block">
              Listen & See Magic on Every Page ✨
            </p>
          </div>
        </div>

        {/* Center Nav tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onNavigate('library')}
            className={`px-3.5 py-2 rounded-xl font-['Fredoka'] font-medium text-sm sm:text-base flex items-center gap-2 transition-all ${
              currentView === 'library'
                ? 'bg-amber-500 text-white shadow-sm scale-102'
                : 'text-amber-900 hover:bg-amber-200/70'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bookshelf</span>
          </button>

          {hasActiveStory && (
            <button
              onClick={() => onNavigate('reader')}
              className={`px-3.5 py-2 rounded-xl font-['Fredoka'] font-medium text-sm sm:text-base flex items-center gap-2 transition-all ${
                currentView === 'reader'
                  ? 'bg-amber-500 text-white shadow-sm scale-102'
                  : 'text-amber-900 hover:bg-amber-200/70'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="truncate max-w-[120px] sm:max-w-[200px]">
                {activeStoryTitle ? activeStoryTitle : 'Read Story'}
              </span>
            </button>
          )}

          <button
            onClick={() => onNavigate('creator')}
            className={`px-3.5 py-2 rounded-xl font-['Fredoka'] font-medium text-sm sm:text-base flex items-center gap-2 transition-all ${
              currentView === 'creator'
                ? 'bg-purple-600 text-white shadow-sm scale-102'
                : 'bg-amber-200 text-amber-950 hover:bg-amber-300'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Make a Story</span>
            <span className="sm:hidden">Create</span>
          </button>
        </nav>

        {/* Right Action: Story Companion Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCompanion}
            aria-label="Story Companion"
            className={`relative px-3.5 py-2 rounded-2xl flex items-center gap-2 font-['Fredoka'] text-sm sm:text-base font-semibold shadow-sm transition-all transform active:scale-95 ${
              isCompanionOpen
                ? 'bg-linear-to-r from-purple-500 to-indigo-600 text-white ring-2 ring-purple-300'
                : 'bg-white hover:bg-purple-50 text-purple-900 border-2 border-purple-200'
            }`}
          >
            <span className="text-xl">🦉</span>
            <span className="hidden md:inline">Ask Barnaby</span>
            <span className="md:hidden">Buddy</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
