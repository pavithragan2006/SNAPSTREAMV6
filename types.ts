
export type MediaType = 'image' | 'video' | 'audio';
export type UserRole = 'user' | 'admin';
export type AppView = 'home' | 'about' | 'dashboard' | 'profile';
export type AnalysisProfile = 'news-archive' | 'marketing-insights';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  mfaEnabled: boolean;
  lastLogin: string;
  iamPolicy?: string;
  apiKey?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: 'Node.js Gateway' | 'Flask API' | 'AWS Lambda' | 'System' | 'SQLite DB' | 'Auth Service';
  message: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'database';
}

export interface MediaMetadata {
  id: string;
  name: string;
  type: MediaType;
  size: number;
  uploadDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url: string;
  thumbnailUrl?: string;
  profile?: AnalysisProfile;
}

export interface AnalysisResult {
  labels?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  keywords?: string[];
  transcript?: string;
  summary?: string;
  moderationConfidence?: number;
  detectedObjects?: Array<{ name: string; confidence: number }>;
  brandMentions?: string[];
  targetAudience?: string;
}

export interface MediaItem extends MediaMetadata {
  analysis?: AnalysisResult;
}

export enum AWS_SERVICE {
  REKOGNITION = 'Amazon Rekognition',
  TRANSCRIBE = 'Amazon Transcribe',
  COMPREHEND = 'Amazon Comprehend',
  S3 = 'Amazon S3',
  LAMBDA = 'AWS Lambda',
  DYNAMODB = 'Amazon DynamoDB',
  SQLITE = 'Local SQLite'
}
