export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
}

export interface ChatSession {
  chatId: string;
  userId: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  slug?: string;
}

export interface MessageFile {
  name: string;
  size: number;
  type: string;
  content: string; // Base64 or extracted text content
}

export interface ChatMessage {
  messageId: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  fileData?: string | null; // Base64 data if it's an image
  createdAt: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'NVIDIA' | 'Google';
  description: string;
  badge: string;
  maxTokens: number;
  isVision: boolean;
}

export interface ChatConfig {
  modelId: string;
  systemInstruction: string;
  temperature: number;
  maxTokens: number;
}
