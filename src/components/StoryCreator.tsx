import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Wand2,
  Heart,
  Palette,
  Layers,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Story, ImageSize, AspectRatio } from '../types/story';

interface StoryCreatorProps {
  onStoryCreated: (newStory: Story) => void;
  onCancel: () => void;
}

const HEROES = [
  { id: 'bunny', name: 'Pip the Brave Bunny', emoji: '🐰', desc: 'Curious & loves carrots' },
  { id: 'cloud', name: 'Cirrus the Little Cloud', emoji: '☁️', desc: 'Bounces on morning winds' },
  { id: 'dragon', name: 'Ignatius the Cozy Dragon', emoji: '🐉', desc: 'Toasts marshmallows softly' },
  { id: 'space-cat', name: 'Luna the Starry Kitten', emoji: '🐱', desc: 'Explores cosmic moons' },
  { id: 'robot', name: 'Rusty the Gentle Robot', emoji: '🤖', desc: 'Collects sunflower seeds' },
];

const SETTINGS = [
  { id: 'forest', name: 'The Whispering Starlight Woods', emoji: '🌲' },
  { id: 'clouds', name: 'Cloud Kingdom of Floating Pillows', emoji: '☁️' },
  { id: 'ocean', name: 'The Sapphire Coral Reef', emoji: '🌊' },
  { id: 'candy', name: 'Lollipop Mountain & Honey River', emoji: '🍭' },
  { id: 'space', name: 'The Glittering Milky Way', emoji: '✨' },
];

const THEMES = [
  { id: 'friendship', name: 'Friendship & Helping Others', emoji: '🤝' },
  { id: 'courage', name: 'Courage & Trying New Things', emoji: '🦁' },
  { id: 'bedtime', name: 'Cozy Bedtime Calm & Dreams', emoji: '🌙' },
  { id: 'silly', name: 'Giggles, Jokes & Funny Surprises', emoji: '🎈' },
  { id: 'curiosity', name: 'Curiosity & Solving Mysteries', emoji: '🔍' },
];

export const StoryCreator: React.FC<StoryCreatorProps> = ({
  onStoryCreated,
  onCancel,
}) => {
  const [selectedHero, setSelectedHero] = useState(HEROES[0].name);
  const [customHero, setCustomHero] = useState('');
  const [selectedSetting, setSelectedSetting] = useState(SETTINGS[0].name);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0].name);
  const [pageCount, setPageCount] = useState(4);
  const [ageGroup, setAgeGroup] = useState('4 - 7 years old');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [artStyle, setArtStyle] = useState('whimsical watercolor');

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const heroName = customHero.trim() || selectedHero;
    setIsGenerating(true);
    setProgressStep('Writing story with Gemini...');

    try {
      // Step 1: Generate the story text & pages
      const storyRes = await fetch('/api/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroName,
          setting: selectedSetting,
          theme: selectedTheme,
          pageCount,
          ageGroup,
        }),
      });

      const storyData = await storyRes.json();
      if (!storyRes.ok || !storyData.pages || storyData.pages.length === 0) {
        throw new Error(storyData.error || 'Failed to craft story');
      }

      setProgressStep(`Illustrating Page 1 with Gemini Pro Image (${imageSize})...`);

      // Step 2: Generate illustration for Page 1 using gemini-3-pro-image-preview
      const firstPage = storyData.pages[0];
      let firstPageImageUrl = '';

      try {
        const imgRes = await fetch('/api/image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: firstPage.illustrationPrompt,
            imageSize,
            aspectRatio: '4:3',
            artStyle,
          }),
        });
        const imgData = await imgRes.json();
        if (imgRes.ok && imgData.imageUrl) {
          firstPageImageUrl = imgData.imageUrl;
        }
      } catch (imgErr) {
        console.warn('Initial illustration generation will be retryable in reader:', imgErr);
      }

      // Assemble new story
      const newStory: Story = {
        id: `story-${Date.now()}`,
        title: storyData.title || `${heroName}'s Magical Adventure`,
        tagline: storyData.tagline || 'A new AI-illustrated tale',
        synopsis: storyData.synopsis || `A wonderful adventure featuring ${heroName}.`,
        theme: selectedTheme,
        ageGroup: ageGroup,
        moralLesson: storyData.moralLesson,
        coverImage: firstPageImageUrl || 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80',
        isCustom: true,
        pages: storyData.pages.map((p: any, idx: number) => ({
          pageNumber: p.pageNumber || idx + 1,
          text: p.text,
          illustrationPrompt: p.illustrationPrompt,
          imageUrl: idx === 0 && firstPageImageUrl ? firstPageImageUrl : undefined,
          imageSize,
          aspectRatio: '4:3' as AspectRatio,
          emotion: p.emotion || 'happy',
        })),
      };

      onStoryCreated(newStory);
    } catch (err: any) {
      alert(`Story creation error: ${err?.message || 'Something went wrong. Please try again!'}`);
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-4xl shadow-xl border-4 border-amber-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-linear-to-r from-purple-500 via-pink-500 to-amber-500 p-6 sm:p-8 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-3xl sm:text-4xl">
                Story Adventure Studio
              </h2>
              <p className="text-white/90 font-['Quicksand'] font-medium text-sm sm:text-base mt-1">
                Choose characters and settings—Gemini will write the tale and paint every page!
              </p>
            </div>
          </div>
        </div>

        {isGenerating ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 rounded-full border-4 border-purple-500 border-t-transparent animate-spin flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-purple-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-['Fredoka'] font-bold text-2xl text-slate-800">
                Crafting Your Storybook...
              </h3>
              <p className="text-purple-700 font-['Fredoka'] font-semibold mt-2 text-lg">
                {progressStep}
              </p>
              <p className="text-slate-500 text-xs font-['Quicksand'] mt-1">
                Generating rich narrative with Gemini and rendering artwork in {imageSize} resolution
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="p-6 sm:p-8 space-y-8">
            {/* Step 1: Choose Hero */}
            <div className="space-y-3">
              <label className="font-['Fredoka'] font-bold text-xl text-amber-950 flex items-center gap-2">
                <span>1. Choose Your Hero</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {HEROES.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setSelectedHero(h.name);
                      setCustomHero('');
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      selectedHero === h.name && !customHero
                        ? 'border-amber-500 bg-amber-100 shadow-sm scale-102'
                        : 'border-slate-200 hover:border-amber-300 bg-amber-50/30'
                    }`}
                  >
                    <span className="text-2xl">{h.emoji}</span>
                    <p className="font-['Fredoka'] font-semibold text-sm text-slate-900 mt-1">
                      {h.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-['Quicksand']">{h.desc}</p>
                  </button>
                ))}
              </div>

              {/* Or custom name */}
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Or enter your own hero (e.g. Leo the Flying Puppy)..."
                  value={customHero}
                  onChange={(e) => setCustomHero(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-500 outline-hidden font-['Quicksand'] font-medium text-sm bg-white"
                />
              </div>
            </div>

            {/* Step 2: Choose Setting */}
            <div className="space-y-3">
              <label className="font-['Fredoka'] font-bold text-xl text-amber-950 flex items-center gap-2">
                <span>2. Magical Setting</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SETTINGS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSetting(s.name)}
                    className={`p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedSetting === s.name
                        ? 'border-purple-500 bg-purple-50 shadow-sm'
                        : 'border-slate-200 hover:border-purple-200 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="font-['Fredoka'] font-semibold text-sm text-slate-900">
                      {s.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Core Theme */}
            <div className="space-y-3">
              <label className="font-['Fredoka'] font-bold text-xl text-amber-950 flex items-center gap-2">
                <span>3. Story Theme & Heart</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTheme(t.name)}
                    className={`p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedTheme === t.name
                        ? 'border-pink-500 bg-pink-50 shadow-sm'
                        : 'border-slate-200 hover:border-pink-200 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="font-['Fredoka'] font-semibold text-sm text-slate-900">
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Page Length & Image Size Affordance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
              {/* Page count */}
              <div>
                <label className="block font-['Fredoka'] font-semibold text-sm text-amber-950 mb-2">
                  Story Length
                </label>
                <div className="flex items-center gap-2">
                  {[3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPageCount(num)}
                      className={`flex-1 py-2 rounded-xl border-2 font-['Fredoka'] font-bold text-sm ${
                        pageCount === num
                          ? 'border-amber-500 bg-amber-100 text-amber-950'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {num} Pages
                    </button>
                  ))}
                </div>
              </div>

              {/* Age group */}
              <div>
                <label className="block font-['Fredoka'] font-semibold text-sm text-amber-950 mb-2">
                  Target Age
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 font-['Fredoka'] font-semibold text-sm text-slate-800 bg-white outline-hidden cursor-pointer"
                >
                  <option value="3 - 5 years old">3 - 5 years (Toddler / Preschool)</option>
                  <option value="4 - 7 years old">4 - 7 years (Early Reader)</option>
                  <option value="8 - 12 years old">8 - 12 years (Middle Grade)</option>
                </select>
              </div>

              {/* Required Affordance: Image Size 1K, 2K, 4K */}
              <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200">
                <label className="block font-['Fredoka'] font-semibold text-sm text-amber-950 mb-1.5 flex items-center justify-between">
                  <span>Image Size</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
                    Gemini Pro Image
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['1K', '2K', '4K'] as ImageSize[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setImageSize(sz)}
                      className={`py-1.5 rounded-xl border font-['Fredoka'] font-bold text-xs transition-all ${
                        imageSize === sz
                          ? 'border-amber-500 bg-amber-400 text-amber-950 shadow-2xs'
                          : 'border-amber-200 bg-white text-slate-700'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 rounded-2xl font-['Fredoka'] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Back to Bookshelf
              </button>

              <button
                type="submit"
                className="px-8 py-3.5 rounded-2xl bg-linear-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-['Fredoka'] font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform active:scale-98 cursor-pointer"
              >
                <Wand2 className="w-5 h-5" />
                <span>Create & Illustrate Story</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
