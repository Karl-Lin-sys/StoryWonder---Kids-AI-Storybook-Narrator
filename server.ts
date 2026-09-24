import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Shared Gemini client initialized server-side with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Utility to convert raw 16-bit mono PCM into standard WAV format
 */
function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Buffer {
  // If buffer already starts with "RIFF", return directly
  if (
    pcmBuffer.length > 4 &&
    pcmBuffer[0] === 0x52 && // 'R'
    pcmBuffer[1] === 0x49 && // 'I'
    pcmBuffer[2] === 0x46 && // 'F'
    pcmBuffer[3] === 0x46    // 'F'
  ) {
    return pcmBuffer;
  }

  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF Chunk
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Sub-chunk size 16 for PCM
  header.writeUInt16LE(1, 20);  // Format 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Clean text for TTS narration (removes non-pronounceable markers while keeping vocal cues)
 */
function sanitizeForTTS(text: string): string {
  return text
    .replace(/[*_#~`]/g, '')
    .trim();
}

/**
 * TTS Endpoint using gemini-3.8-flash-tts
 */
app.post('/api/tts/speak', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore', style } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for TTS' });
      return;
    }

    const cleanText = sanitizeForTTS(text);
    const speechStyle =
      style ||
      "Warm, animated, enthusiastic children's book narrator speaking clearly with joyful wonder and gentle rhythm";

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: speechStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (part: any) => part.inlineData && part.inlineData.data
    );

    if (!audioPart || !audioPart.inlineData?.data) {
      throw new Error('No audio data received from Gemini TTS');
    }

    const rawBase64 = audioPart.inlineData.data;
    const rawBuffer = Buffer.from(rawBase64, 'base64');

    // Parse sample rate if specified in mimeType, else default to 24000
    let sampleRate = 24000;
    const mime = audioPart.inlineData.mimeType || '';
    const rateMatch = mime.match(/rate=(\d+)/i);
    if (rateMatch && rateMatch[1]) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    const wavBuffer = pcmToWav(rawBuffer, sampleRate, 1, 16);
    const wavBase64 = wavBuffer.toString('base64');
    const audioUrl = `data:audio/wav;base64,${wavBase64}`;

    res.json({
      audioUrl,
      sampleRate,
      format: 'wav',
      voice,
    });
  } catch (error: any) {
    console.error('Error generating TTS with gemini-3.8-flash-tts:', error);
    res.status(500).json({
      error: error?.message || 'Failed to synthesize speech',
    });
  }
});

/**
 * Image Generation Endpoint using gemini-3-pro-image-preview
 * Supports user affordance for image size: 1K, 2K, 4K
 */
app.post('/api/image/generate', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      imageSize = '1K',
      aspectRatio = '4:3',
      artStyle = 'storybook watercolor',
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required for image generation' });
      return;
    }

    // Validate imageSize
    const validSizes = ['1K', '2K', '4K'];
    const chosenSize = validSizes.includes(imageSize) ? imageSize : '1K';

    // Enhance prompt with child-friendly artistic details
    const enhancedPrompt = `${prompt}. Art style: magical children's picture book illustration, ${artStyle}, colorful, warm lighting, whimsical character design, soft textures, award-winning storybook art.`;

    let response: any;
    try {
      // First attempt with gemini-3-pro-image-preview as explicitly mandated
      response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: chosenSize as any,
          },
        },
      });
    } catch (modelError: any) {
      console.warn(
        'gemini-3-pro-image-preview failed or not found, falling back to gemini-3-pro-image / gemini-3.1-flash-image:',
        modelError?.message
      );
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-image',
          contents: {
            parts: [{ text: enhancedPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              imageSize: chosenSize as any,
            },
          },
        });
      } catch (fallbackError: any) {
        // Last fallback to gemini-3.1-flash-image
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: {
            parts: [{ text: enhancedPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              imageSize: chosenSize as any,
            },
          },
        });
      }
    }

    const candidate = response.candidates?.[0];
    let imageUrl = '';

    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error('No image was returned by Gemini image generation');
    }

    res.json({
      imageUrl,
      prompt: enhancedPrompt,
      imageSize: chosenSize,
      aspectRatio,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate image',
    });
  }
});

/**
 * Story Generation Endpoint using Gemini
 */
app.post('/api/story/generate', async (req: Request, res: Response) => {
  try {
    const {
      topic = 'a magical bedtime adventure',
      heroName = 'Pip the brave mouse',
      setting = 'The Enchanted Starlight Woods',
      theme = 'friendship and courage',
      ageGroup = '4-7 years old',
      pageCount = 4,
    } = req.body;

    const clampedPages = Math.min(Math.max(Number(pageCount) || 4, 3), 6);

    const prompt = `Create a delightful, engaging children's story for ${ageGroup}.
Topic: ${topic}
Hero: ${heroName}
Setting: ${setting}
Core Theme: ${theme}
Number of Pages: exactly ${clampedPages} pages.

Each page should have:
1. "pageNumber": page index starting at 1
2. "text": 40-70 words of captivating storytelling, gentle rhythm, expressive dialogues, and playful onomatopoeias (e.g. *whoosh!*, *twinkle-twinkle!*, *pitter-patter!*).
3. "illustrationPrompt": vivid artistic description for page illustration depicting the scene, characters, setting, and mood in high detail.
4. "emotion": one feeling word describing the page mood (e.g. "curious", "excited", "peaceful", "triumphant").

Make the story wholesome, positive, and memorable with a gentle reassuring ending.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          "You are a master award-winning children's author writing heartwarming, vivid storybooks.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            tagline: { type: Type.STRING },
            synopsis: { type: Type.STRING },
            ageGroup: { type: Type.STRING },
            moralLesson: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING },
                  illustrationPrompt: { type: Type.STRING },
                  emotion: { type: Type.STRING },
                },
                required: ['pageNumber', 'text', 'illustrationPrompt'],
              },
            },
          },
          required: ['title', 'pages'],
        },
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const parsedStory = JSON.parse(jsonText);

    res.json(parsedStory);
  } catch (error: any) {
    console.error('Error generating story:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate story',
    });
  }
});

/**
 * Multi-turn Chat Companion Endpoint
 * Uses:
 * - gemini-3.1-pro-preview for complex tasks (deep moral inquiry, intricate riddle crafting, story world-building)
 * - gemini-3.5-flash for general tasks (Barnaby the Book Owl story conversation, character Q&A, empathetic listening)
 * - gemini-3.1-flash-lite for fast tasks (Pip the Spark Sprite, rapid word definitions, rhymes, silly jokes)
 */
app.post('/api/chat/message', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      role = 'barnaby', // 'barnaby' | 'pip' | 'eldon'
      taskComplexity = 'general', // 'fast' | 'general' | 'complex'
      currentStoryContext,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    // Model selection based on requirements
    let selectedModel = 'gemini-3.5-flash';
    if (taskComplexity === 'complex' || role === 'eldon') {
      selectedModel = 'gemini-3.1-pro-preview';
    } else if (taskComplexity === 'fast' || role === 'pip') {
      selectedModel = 'gemini-3.1-flash-lite';
    } else {
      selectedModel = 'gemini-3.5-flash';
    }

    // Role system instructions
    let systemInstruction = '';
    if (role === 'pip') {
      systemInstruction = `You are Pip the Spark Sprite, a tiny energetic story fairy for children.
Your voice is super bouncy, playful, and fun! You love making up rhymes, silly sounds (*swoosh!*, *giggle!*), and answering questions super fast with joyful enthusiasm.
Keep your answers brief (2-4 sentences max), punchy, and super easy for kids to understand. Always encourage their imagination!`;
    } else if (role === 'eldon') {
      systemInstruction = `You are Professor Eldon the Story Weaver, a gentle, wise turtle scholar and riddle master.
You specialize in exploring deep story themes, morals, thoughtful questions, and rich imaginary lore.
Speak warmly and kindly with thoughtful depth, inviting young thinkers to consider feelings, courage, kindness, and choices.`;
    } else {
      // Default: Barnaby the Book Owl
      systemInstruction = `You are Barnaby the Book Owl, a cozy, friendly, bespectacled owl companion who sits next to the child while they read.
You are warm, encouraging, curious, and adore books!
Talk directly to the child like a caring friend. Ask them what they think will happen, celebrate when they notice details, explain any big words gently with simple analogies, and cheer their reading journey.`;
    }

    if (currentStoryContext) {
      systemInstruction += `\n\nCURRENT STORY CONTEXT:
Title: "${currentStoryContext.title || 'Unknown'}"
Current Page (${currentStoryContext.currentPage || 1}): "${currentStoryContext.pageText || ''}"
Keep this story context in mind if the child asks about the story or characters.`;
    }

    // Format contents for Gemini SDK
    // Convert incoming [{ role: 'user'|'model', text: string }] into SDK contents format
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text || '' }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const replyText = response.text || "Hoot! That's wonderful to think about!";

    res.json({
      reply: replyText,
      modelUsed: selectedModel,
      role,
    });
  } catch (error: any) {
    console.error('Error in chat message:', error);
    res.status(500).json({
      error: error?.message || 'Chat companion encountered an error',
    });
  }
});

// Setup Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`StoryWonder server running on http://0.0.0.0:${PORT}`);
});
