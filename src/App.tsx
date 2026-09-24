import React, { useState, useEffect } from 'react';
import { PRESET_STORIES } from './data/presetStories';
import { Story, StoryPage } from './types/story';
import { Navbar } from './components/Navbar';
import { StoryLibrary } from './components/StoryLibrary';
import { StoryReader } from './components/StoryReader';
import { StoryCreator } from './components/StoryCreator';
import { ChatCompanion } from './components/ChatCompanion';

const STORAGE_KEY = 'storywonder_stories_v1';

export default function App() {
  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read from local storage:', e);
    }
    return PRESET_STORIES;
  });

  const [activeStoryId, setActiveStoryId] = useState<string>(() => {
    return PRESET_STORIES[0].id;
  });

  const [currentView, setCurrentView] = useState<'library' | 'reader' | 'creator'>('library');
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [companionContext, setCompanionContext] = useState<{
    title?: string;
    pageNumber?: number;
    pageText?: string;
  }>({});

  // Sync stories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    } catch (e) {
      console.warn('Could not write to local storage:', e);
    }
  }, [stories]);

  const activeStory = stories.find((s) => s.id === activeStoryId) || stories[0];

  const handleSelectStory = (story: Story) => {
    setActiveStoryId(story.id);
    setCurrentView('reader');
    setCompanionContext({
      title: story.title,
      pageNumber: 1,
      pageText: story.pages[0]?.text,
    });
  };

  const handleUpdateStoryPage = (pageIndex: number, updatedFields: Partial<StoryPage>) => {
    setStories((prevStories) =>
      prevStories.map((story) => {
        if (story.id !== activeStoryId) return story;
        const newPages = [...story.pages];
        newPages[pageIndex] = {
          ...newPages[pageIndex],
          ...updatedFields,
        };
        // If updating page 0's image, also update coverImage
        const updatedCover = pageIndex === 0 && updatedFields.imageUrl ? updatedFields.imageUrl : story.coverImage;
        return {
          ...story,
          coverImage: updatedCover,
          pages: newPages,
        };
      })
    );
  };

  const handleStoryCreated = (newStory: Story) => {
    setStories((prev) => [newStory, ...prev]);
    setActiveStoryId(newStory.id);
    setCurrentView('reader');
    setCompanionContext({
      title: newStory.title,
      pageNumber: 1,
      pageText: newStory.pages[0]?.text,
    });
  };

  const handleOpenCompanionWithContext = (pageText: string, pageNum: number) => {
    setCompanionContext({
      title: activeStory?.title,
      pageNumber: pageNum,
      pageText,
    });
    setIsCompanionOpen(true);
  };

  return (
    <div className="min-h-screen bg-amber-50 text-slate-900 font-['Quicksand'] flex flex-col selection:bg-amber-200">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        isCompanionOpen={isCompanionOpen}
        onToggleCompanion={() => setIsCompanionOpen(!isCompanionOpen)}
        hasActiveStory={Boolean(activeStory)}
        activeStoryTitle={activeStory?.title}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'library' && (
          <StoryLibrary
            stories={stories}
            onSelectStory={handleSelectStory}
            onOpenCreator={() => setCurrentView('creator')}
            onOpenCompanion={() => setIsCompanionOpen(true)}
          />
        )}

        {currentView === 'reader' && activeStory && (
          <StoryReader
            story={activeStory}
            onUpdateStoryPage={handleUpdateStoryPage}
            onOpenCompanionWithContext={handleOpenCompanionWithContext}
          />
        )}

        {currentView === 'creator' && (
          <StoryCreator
            onStoryCreated={handleStoryCreated}
            onCancel={() => setCurrentView('library')}
          />
        )}
      </main>

      {/* Multi-turn Chat Companion (Barnaby the Owl / Pip Sprite / Prof. Eldon) */}
      <ChatCompanion
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
        currentStoryTitle={companionContext.title}
        currentPageNumber={companionContext.pageNumber}
        currentPageText={companionContext.pageText}
      />

      {/* Footer */}
      <footer className="border-t-2 border-amber-200/80 bg-amber-100/60 py-6 text-center text-xs text-amber-900/70 font-['Fredoka'] font-medium">
        <p>
          StoryWonder ✨ Reads aloud with <strong>gemini-3.8-flash-tts</strong> • Paints pages with <strong>gemini-3-pro-image-preview</strong> (1K/2K/4K) • Guided by Gemini Companions
        </p>
      </footer>
    </div>
  );
}
