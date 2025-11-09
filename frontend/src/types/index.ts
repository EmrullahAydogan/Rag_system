export interface Tag {
  id: number;
  name: string;
  color: string;
  document_count?: number;
}

export interface Document {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunks_count: number;
  metadata: Record<string, any>;
  upload_date: string;
  processed_date?: string;
  error_message?: string;
  tags?: Tag[];
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources: Source[];
  metadata: Record<string, any>;
  timestamp: string;
}

export interface Source {
  document_id: number;
  filename: string;
  chunk_index: number;
  score: number;
}

export interface Conversation {
  id: number;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface ConversationListItem {
  id: number;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatRequest {
  message: string;
  conversation_id?: number;
  llm_provider?: string;
  model?: string;
  document_ids?: number[];
}

export interface AnalyticsSummary {
  total_conversations: number;
  total_messages: number;
  total_documents: number;
  avg_messages_per_conversation: number;
  avg_response_time?: number;
  total_feedback: number;
  avg_rating?: number;
}

export interface TimeSeriesData {
  date: string;
  count: number;
}

export interface TopicData {
  topic: string;
  count: number;
}

export interface LLMProvider {
  provider: string;
  models: string[];
}
