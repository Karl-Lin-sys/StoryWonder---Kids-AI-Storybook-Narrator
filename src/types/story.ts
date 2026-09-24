export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '4:3' | '1:1' | '16:9' | '3:4';

export interface StoryPage {
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  imageUrl?: string;
  audioUrl?: string;
  imageSize?: ImageSize;
  aspectRatio?: AspectRatio;
  emotion?: string;
  isGeneratingImage?: boolean;
  isGeneratingAudio?: boolean;
}

export interface Story {
  id: string;
  title: string;
  tagline: string;
  synopsis: string;
  theme: string;
  ageGroup: string;
  moralLesson?: string;
  coverImage: string;
  pages: StoryPage[];
  isCustom?: boolean;
}

export type CompanionRole = 'barnaby' | 'pip' | 'eldon';
export type TaskComplexity = 'fast' | 'general' | 'complex';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  modelUsed?: string;
  audioUrl?: string;
  isLoadingAudio?: boolean;
}
