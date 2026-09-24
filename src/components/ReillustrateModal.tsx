import React, { useState } from 'react';
import { Sparkles, X, Image as ImageIcon, Wand2, Check, RefreshCw } from 'lucide-react';
import { ImageSize, AspectRatio } from '../types/story';

interface ReillustrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageNumber: number;
  initialPrompt: string;
  initialSize?: ImageSize;
  initialAspectRatio?: AspectRatio;
  onGenerate: (params: {
    prompt: string;
    imageSize: ImageSize;
    aspectRatio: AspectRatio;
    artStyle: string;
  }) => Promise<void>;
  isGenerating: boolean;
}

const ART_STYLES = [
  { id: 'whimsical watercolor', name: '🎨 Whimsical Watercolor', desc: 'Soft pastel washes, dreamy lighting' },
  { id: 'vibrant 3D cartoon', name: '✨ 3D Story Animation', desc: 'Lively, glossy Pixar-style characters' },
  { id: 'cozy classic picture book', name: '📖 Classic Picture Book', desc: 'Warm ink lines, vintage children book' },
  { id: 'paper cutout craft', name: '✂️ Paper Cutout Collage', desc: 'Layered papercraft with depth & shadows' },
  { id: 'playful crayon and gouache', name: '🖍️ Crayon & Gouache', desc: 'Joyful, bold textures, kid-friendly' },
  { id: 'claymation and felt', name: '🧶 Clay & Felt Craft', desc: 'Tactile, stop-motion storybook charm' },
];

export const ReillustrateModal: React.FC<ReillustrateModalProps> = ({
  isOpen,
  onClose,
  pageNumber,
  initialPrompt,
  initialSize = '1K',
  initialAspectRatio = '4:3',
  onGenerate,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [imageSize, setImageSize] = useState<ImageSize>(initialSize);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialAspectRatio);
  const [artStyle, setArtStyle] = useState(ART_STYLES[0].id);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    await onGenerate({
      prompt: prompt.trim(),
      imageSize,
      aspectRatio,
      artStyle,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-amber-400 via-orange-400 to-amber-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-['Fredoka'] font-bold text-2xl">
                Illustrate Page {pageNumber}
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Powered by Gemini 3 Pro Image (gemini-3-pro-image-preview)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="w-9 h-9 rounded-xl bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Prompt input */}
          <div>
            <label className="block font-['Fredoka'] font-semibold text-lg text-amber-950 mb-1.5">
              Scene Description Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what the illustration should show..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 outline-hidden font-['Quicksand'] font-medium text-slate-800 bg-amber-50/50 transition-all resize-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              💡 Tip: Mention characters, whimsical details (e.g. rainbow fireflies, cozy teapot, starlight).
            </p>
          </div>

          {/* Affordance: Image Size Selector (1K, 2K, 4K) */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <label className="font-['Fredoka'] font-semibold text-base text-amber-950 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                Image Resolution (Size Affordance)
              </label>
              <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                Gemini Pro Image
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setImageSize(size)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    imageSize === size
                      ? 'border-amber-500 bg-amber-100 text-amber-950 shadow-sm font-bold scale-102'
                      : 'border-amber-200/80 bg-white text-slate-700 hover:bg-amber-50/80 font-medium'
                  }`}
                >
                  <span className="font-['Fredoka'] text-xl">{size}</span>
                  <span className="text-[11px] text-slate-500">
                    {size === '1K' ? 'Standard (Fast)' : size === '2K' ? 'High Detail' : 'Ultra 4K Crisp'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block font-['Fredoka'] font-semibold text-base text-amber-950 mb-2">
              Book Page Layout (Aspect Ratio)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: '4:3', label: '4:3 Classic Book', desc: 'Standard picture book' },
                  { id: '1:1', label: '1:1 Square', desc: 'Square story card' },
                  { id: '16:9', label: '16:9 Wide Spread', desc: 'Cinematic panorama' },
                ] as { id: AspectRatio; label: string; desc: string }[]
              ).map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all ${
                    aspectRatio === ratio.id
                      ? 'border-amber-500 bg-amber-100 text-amber-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-['Fredoka'] text-sm">{ratio.label}</span>
                  <span className="text-[10px] text-slate-500">{ratio.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Art Style presets */}
          <div>
            <label className="block font-['Fredoka'] font-semibold text-base text-amber-950 mb-2">
              Storybook Art Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ART_STYLES.map((style) => (
                <div
                  key={style.id}
                  onClick={() => setArtStyle(style.id)}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                    artStyle === style.id
                      ? 'border-amber-500 bg-amber-100/60 shadow-xs'
                      : 'border-slate-200 hover:border-amber-300 bg-white'
                  }`}
                >
                  <div className="pt-0.5">
                    {artStyle === style.id ? (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-['Fredoka'] font-semibold text-sm text-slate-900">
                      {style.name}
                    </p>
                    <p className="text-xs text-slate-500 font-['Quicksand']">
                      {style.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl font-['Fredoka'] font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-2.5 rounded-2xl bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-['Fredoka'] font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Painting Page with Gemini ({imageSize})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Illustration ({imageSize})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
