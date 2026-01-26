
import { GoogleGenAI, Type } from "@google/genai";
import { MediaType, AnalysisResult, AnalysisProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    labels: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step 4: Automatic tags for indexing (e.g., 'Election', 'Reporter Interview', 'Public Briefing')."
    },
    sentiment: {
      type: Type.STRING,
      description: "Tone of the content (positive/negative/neutral/mixed)."
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Thematic keywords for audience trend analysis."
    },
    transcript: {
      type: Type.STRING,
      description: "Full transcription of audio or OCR text from frame."
    },
    summary: {
      type: Type.STRING,
      description: "Short executive brief of the content."
    },
    moderationConfidence: {
      type: Type.NUMBER,
      description: "Compliance score for brand safety."
    },
    brandMentions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Logos or spoken brands detected."
    },
    detectedObjects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        },
        required: ["name", "confidence"]
      },
      description: "People, faces, or objects detected."
    }
  },
  required: ["labels", "summary", "sentiment", "detectedObjects"]
};

export const analyzeMedia = async (
  file: File,
  type: MediaType,
  profile: AnalysisProfile = 'news-archive'
): Promise<AnalysisResult> => {
  // If no API key, return mock data immediately to avoid "stuck" state
  if (!process.env.API_KEY || process.env.API_KEY === 'YOUR_API_KEY') {
    return getMockAnalysis(file.name, type, profile);
  }

  const base64Data = await fileToBase64(file);
  const mimeType = file.type;

  const prompt = profile === 'news-archive' 
    ? `
    SCENARIO: NEWS AGENCY ARCHIVE (SCENARIO 1)
    ACTING AS: AWS Rekognition + Transcribe + Comprehend Cluster
    
    STEP 3 (Smart Eyes): Identify people's faces, recognize logos, and read words (OCR).
    STEP 4 (Automatic Labels): Generate high-level indexing tags. Include specific categories if relevant: "Election", "Reporter Interview", "Famous Person", "Public Event".
    
    FOCUS: 
    1. Visual Evidence: Identify public figures and logos.
    2. Event Tagging: Provide descriptive labels for rapid search indexing.
    `
    : `
    SCENARIO: MARKETING INSIGHTS & PODCAST ANALYSIS (SCENARIO 2)
    ACTING AS: AWS Transcribe + Comprehend + DynamoDB Sync
    
    FOCUS:
    1. Audience Engagement: Identify emotional tone and recurring thematic trends.
    2. Speech-to-Text: Provide a detailed transcript for keyword extraction.
    3. Brand Analytics: Detect company mentions and sentiment towards products.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: `Analyze this ${type} file named "${file.name}" for SnapStream. ${prompt}` },
            { inlineData: { data: base64Data, mimeType } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    const textOutput = response.text;
    if (!textOutput) throw new Error("Cluster processing timeout");

    return JSON.parse(textOutput) as AnalysisResult;
  } catch (error) {
    console.warn("Gemini API Error, falling back to local simulation:", error);
    return getMockAnalysis(file.name, type, profile);
  }
};

const getMockAnalysis = (filename: string, type: string, profile: string): AnalysisResult => {
  return {
    labels: [profile === 'news-archive' ? 'Broadcast' : 'Campaign', 'Digital Archive', 'Intelligence'],
    sentiment: 'neutral',
    keywords: ['Analysis', 'Metadata', 'Crimson'],
    summary: `Simulation successful for ${filename}. This item was processed using the SnapStream fallback cluster due to environment constraints.`,
    detectedObjects: [
      { name: 'Primary Subject', confidence: 0.98 },
      { name: 'Secondary Context', confidence: 0.85 }
    ]
  };
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};
