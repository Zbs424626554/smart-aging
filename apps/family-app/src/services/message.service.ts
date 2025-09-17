import { http } from "../utils/request";

// 消息列表项接口
export interface MessageListItem {
  id: string;
  users: Array<{
    username: string;
    realname: string;
    role: string;
  }>;
  lastMessage?: {
    sender: string;
    content: any;
    sendTime: number;
    type: string;
    receiver: string[];
  };
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

// 聊天联系人接口
export interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: {
    id: string;
    content: string;
    timestamp: Date | string | number;
    isRead: boolean;
    type: string;
  };
  unreadCount: number;
  isOnline: boolean;
  role: string;
  updatedAt: string;
}

// 消息类型与状态（与后端模型对齐，并扩展前端使用场景）
export type MessageType =
  | "text"
  | "image"
  | "voice" // 语音消息
  | "voice_call" // 语音通话记录
  | "video_call" // 视频通话记录
  | "video"
  | "file"
  | "location";

export type MessageStatus =
  | "unread"
  | "read"
  | "connect"
  | "refusal"
  | "cancel";

// 聊天消息（统一结构，便于扩展）
export interface ChatMessage {
  id: string;
  sender: string;
  content: any;
  sendTime: number;
  type: MessageType;
  receiver: string[];
  // 可选：用于通话记录等
  status?: MessageStatus;
  time?: number; // 通话时长（秒）
}

// 对话详情接口
export interface ConversationDetail {
  conversationId: string;
  users: Array<{
    username: string;
    realname?: string;
    role: string;
  }>;
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API响应接口
export interface MessageListResponse {
  list: MessageListItem[] | ChatItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class MessageService {
  // 获取消息列表
  static async getMessageList(
    params: {
      username?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<MessageListResponse> {
    const { data } = await http.get<MessageListResponse>("/messagelist", {
      params,
    });
    return data;
  }

  // 根据用户名获取对话列表
  static async getUserChatList(
    username: string,
    params: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<MessageListResponse> {
    const { data } = await http.get<MessageListResponse>(
      `/messagelist/${username}`,
      {
        params,
      }
    );
    return data;
  }

  // 获取对话详情
  static async getConversationDetail(
    conversationId: string,
    options: {
      page?: number;
      limit?: number;
      timeoutMs?: number;
      signal?: AbortSignal;
    } = {}
  ) {
    const { page, limit, timeoutMs, signal } = options;
    const { data } = await http.get(`/conversation/${conversationId}`, {
      params: { page, limit },
      timeout: timeoutMs,
      signal,
    });
    return data;
  }

  // 发送消息
  static async sendMessage(data: {
    conversationId: string;
    content: string;
    sender: string;
    type?: string;
    receiver: string[];
  }) {
    const { data: responseData } = await http.post(
      `/conversation/${data.conversationId}/send`,
      {
        content: data.content,
        sender: data.sender,
        type: data.type || "text",
        receiver: data.receiver,
      }
    );
    return responseData;
  }

  // 创建新对话
  static async createConversation(data: {
    participants: Array<{
      username: string;
      realname?: string;
      role: string;
    }>;
    initialMessage?: {
      content: string;
      type?: string;
    };
  }) {
    const { data: responseData } = await http.post(
      "/conversation/create",
      data
    );
    return responseData;
  }

  // 兜底：通过 /send 在两人间新建对话并发第一条消息
  static async sendMessageByPair(data: {
    sender: string;
    receiver: string;
    content: string;
    type?: string;
    senderRole?: string;
    receiverRole?: string;
    senderRealname?: string;
    receiverRealname?: string;
  }) {
    const { data: responseData } = await http.post(
      "/send",
      data
    );
    return responseData;
  }
}
