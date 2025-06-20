/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    currentKnowledgeBase?: IKnowledgeBase,
    systemInfo?: WechatMiniprogram.SystemInfo,
    apiKey?: string,
    chatAssistantId?: string,
    currentSession?: {
      id: string,
      chatId: string
    },
    apiBaseUrl?: string
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}

// 知识库接口
interface IKnowledgeBase {
  id: string;
  name: string;
  description: string;
  createTime: string;
  updateTime: string;
  docsCount: number;
  tags: string[];
  embedding_model?: string;
  chunk_method?: string;
  parser_config?: {
    chunk_token_num?: number;
    delimiter?: string;
    html4excel?: boolean;
    layout_recognize?: string;
    raptor?: {
      use_raptor: boolean;
    };
    [key: string]: any;
  };
}

// 文档接口
interface IDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  createTime: string;
}

// 消息接口
interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  references?: IDocumentReference[];
}

// 文档引用接口
interface IDocumentReference {
  documentId: string;
  documentName: string;
  pageNumbers?: string;
}

// RAGFlow API接口

// 数据集接口
interface IRagflowDataset {
  id: string;
  name: string;
  description: string;
  embedding_model: string;
  chunk_method: string;
  create_date: string;
  update_date: string;
  document_count: number;
  chunk_count: number;
  parser_config: any;
}

// 文档接口
interface IRagflowDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  location: string;
  create_date: string;
  update_date: string;
  chunk_count: number;
}

// 聊天助手接口
interface IRagflowChatAssistant {
  id: string;
  name: string;
  description: string;
  dataset_ids: string[];
  llm: any;
  prompt: any;
}

// 会话接口
interface IRagflowSession {
  id: string;
  name: string;
  chat_id: string;
  messages: IRagflowMessage[];
  create_date: string;
  update_date: string;
}

// 消息接口
interface IRagflowMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reference?: IRagflowReference;
}

// 引用接口
interface IRagflowReference {
  chunks: IRagflowChunk[];
  doc_aggs: IRagflowDocAgg[];
  total: number;
}

// 块接口
interface IRagflowChunk {
  id: string;
  content: string;
  document_id: string;
  document_name: string;
  document_keyword: string;
  similarity: number;
}

// 文档聚合接口
interface IRagflowDocAgg {
  doc_id: string;
  doc_name: string;
  count: number;
}