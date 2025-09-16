// WebSocket服务（家属端）
export interface WebSocketMessage {
  type:
  | "message"
  | "user_online"
  | "user_offline"
  | "typing"
  | "stop_typing"
  | "call_invite"
  | "call_response"
  | "call_cancel"
  | "call_end"
  | "webrtc_offer"
  | "webrtc_answer"
  | "webrtc_ice_candidate"
  | "conversation_updated";
  data: any;
  conversationId?: string;
  sender?: string;
  timestamp?: number;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectTimeoutTimer: NodeJS.Timeout | null = null;
  private backoffMs = 1000; // 指数退避起始
  private readonly maxBackoffMs = 15000;
  private isConnecting = false;
  private currentUser: string | null = null;
  // 记录最近一次收到但可能“页面尚未准备好”的来电邀请
  private lastCallInvite: any | null = null;

  private constructor() { }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // 连接WebSocket
  connect(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // 如果正在连接，等待连接完成
        const checkConnection = () => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            resolve();
          } else if (!this.isConnecting) {
            reject(new Error("Connection failed"));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.currentUser = username;
      this.isConnecting = true;

      // 使用可配置的 WebSocket 地址；若未配置，则根据端口智能推断
      let baseWsUrl = (import.meta as any).env?.VITE_WS_URL as string | undefined;
      if (!baseWsUrl) {
        const isHttps = location.protocol === 'https:';
        const scheme = isHttps ? 'wss' : 'ws';
        const port = location.port || '';
        const isViteDevPort = /^(5173|5174|5175|5176)$/.test(port);
        const isReverseProxyPort = /^(444|4445|446)$/.test(port);
        if (isReverseProxyPort) {
          // 页面走反代端口 -> WS 走 443
          baseWsUrl = `${scheme}://${location.hostname}:443/ws`;
        } else if (isViteDevPort) {
          // 本地开发直连 3001
          baseWsUrl = `${scheme}://${location.hostname}:3001/ws`;
        } else {
          // 生产或其它情况，优先尝试同源 '/ws'
          baseWsUrl = `${scheme}://${location.host}/ws`;
        }
      }
      const wsUrl = `${baseWsUrl}?username=${encodeURIComponent(username)}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("WebSocket连接已建立");
          this.isConnecting = false;
          // 重置退避
          this.backoffMs = 1000;
          // 清理连接超时计时器
          if (this.connectTimeoutTimer) {
            clearTimeout(this.connectTimeoutTimer);
            this.connectTimeoutTimer = null;
          }
          this.startHeartbeat();

          // 发送用户上线消息
          this.send({
            type: "user_online",
            data: { username },
            timestamp: Date.now(),
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          // 调试：日志打印消息类型，辅助定位通话邀请是否发出
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            if (message?.type === 'call_invite' || message?.type === 'webrtc_offer') {
              console.log('[WS] recv', message.type, message);
            }
            // 缓存最后一次来电邀请，便于路由跳转后仍能弹窗
            if (message?.type === 'call_invite') {
              this.lastCallInvite = message.data;
            }
            this.handleMessage(message);
          } catch (error) {
            console.warn("解析WebSocket消息失败:", error);
          }
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket连接已关闭:", event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          if (this.connectTimeoutTimer) {
            clearTimeout(this.connectTimeoutTimer);
            this.connectTimeoutTimer = null;
          }

          // 如果不是主动关闭，尝试重连
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.warn("WebSocket连接错误:", error);
          this.isConnecting = false;
          if (this.connectTimeoutTimer) {
            clearTimeout(this.connectTimeoutTimer);
            this.connectTimeoutTimer = null;
          }
          reject(new Error("WebSocket连接失败"));
        };

        // 连接超时（比如10秒）
        this.connectTimeoutTimer = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            try {
              this.ws.close();
            } catch { }
            this.isConnecting = false;
            reject(new Error("WebSocket连接超时"));
            this.scheduleReconnect();
          }
        }, 10000);
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      // 发送用户下线消息
      if (this.ws.readyState === WebSocket.OPEN && this.currentUser) {
        this.send({
          type: "user_offline",
          data: { username: this.currentUser },
          timestamp: Date.now(),
        });
      }

      this.ws.close(1000, "User disconnect");
      this.ws = null;
    }

    this.currentUser = null;
  }

  // 发送消息
  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket未连接，无法发送消息");
    }
  }

  // 处理接收到的消息
  private handleMessage(message: WebSocketMessage) {
    const { type, data, conversationId } = message;

    // 触发对应类型的监听器
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach((callback) => callback(data));
    }

    // 如果有会话ID，触发会话特定的监听器
    if (conversationId) {
      const conversationListeners = this.listeners.get(
        `conversation:${conversationId}`
      );
      if (conversationListeners) {
        conversationListeners.forEach((callback) => callback(data));
      }
    }

    // 触发全局监听器
    const globalListeners = this.listeners.get("*");
    if (globalListeners) {
      globalListeners.forEach((callback) => callback(message));
    }
  }

  // 添加事件监听器
  addEventListener(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  // 移除事件监听器
  removeEventListener(event: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // 监听特定会话的消息
  subscribeToConversation(
    conversationId: string,
    callback: (data: any) => void
  ) {
    this.addEventListener(`conversation:${conversationId}`, callback);
  }

  // 取消监听特定会话的消息
  unsubscribeFromConversation(
    conversationId: string,
    callback: (data: any) => void
  ) {
    this.removeEventListener(`conversation:${conversationId}`, callback);
  }

  // 发送聊天消息
  sendChatMessage(
    conversationId: string,
    content: string,
    receivers: string[],
    msgType?: string
  ) {
    this.send({
      type: "message",
      data: {
        conversationId,
        content,
        type: msgType,
        receivers,
        sender: this.currentUser,
        sendTime: Date.now(),
      },
      conversationId,
      sender: this.currentUser || undefined,
      timestamp: Date.now(),
    });
  }

  // 发送打字状态
  sendTypingStatus(conversationId: string, isTyping: boolean) {
    this.send({
      type: isTyping ? "typing" : "stop_typing",
      data: {
        conversationId,
        username: this.currentUser,
      },
      conversationId,
      sender: this.currentUser || undefined,
      timestamp: Date.now(),
    });
  }

  // 发送电话邀请
  sendCallInvite(
    conversationId: string,
    callType: "voice" | "video",
    receivers: string[]
  ) {
    this.send({
      type: "call_invite",
      data: {
        conversationId,
        callType,
        receivers,
        caller: this.currentUser,
        timestamp: Date.now(),
      },
      conversationId,
      sender: this.currentUser || undefined,
      timestamp: Date.now(),
    });
  }

  // 发送电话响应
  sendCallResponse(
    conversationId: string,
    response: "accept" | "reject",
    caller: string
  ) {
    this.send({
      type: "call_response",
      data: {
        conversationId,
        response,
        caller,
        responder: this.currentUser,
        timestamp: Date.now(),
      },
      conversationId,
      sender: this.currentUser || undefined,
      timestamp: Date.now(),
    });
  }

  // 发送取消通话消息
  sendCallCancel(conversationId: string, receivers: string[]) {
    this.send({
      type: "call_cancel",
      data: {
        conversationId,
        receivers,
        sender: this.currentUser,
        timestamp: Date.now(),
      },
      conversationId,
      sender: this.currentUser || undefined,
      timestamp: Date.now(),
    });
  }

  // 发送挂断通话消息
  sendCallEnd(conversationId: string, receivers: string[]) {
    this.send({
      type: "call_end",
      data: {
        conversationId,
        receivers,
        sender: this.currentUser,
        timestamp: Date.now(),
      },
      conversationId,
      sender: this.currentUser || undefined,
      timestamp: Date.now(),
    });
  }

  // 发送WebRTC Offer
  sendWebRTCOffer(
    conversationId: string,
    offer: RTCSessionDescriptionInit,
    receivers: string[]
  ) {
    this.send({
      type: "webrtc_offer",
      data: {
        conversationId,
        offer,
        receivers,
        sender: this.currentUser,
        timestamp: Date.now(),
      },
      conversationId,
      sender: this.currentUser || undefined,
      timestamp: Date.now(),
    });
  }

  // 发送WebRTC Answer
  sendWebRTCAnswer(
    conversationId: string,
    answer: RTCSessionDescriptionInit,
    receivers: string[]
  ) {
    this.send({
      type: "webrtc_answer",
      data: {
        conversationId,
        answer,
        receivers,
        sender: this.currentUser,
        timestamp: Date.now(),
      },
      conversationId,
      sender: this.currentUser || undefined,
      timestamp: Date.now(),
    });
  }

  // 发送ICE Candidate
  sendICECandidate(
    conversationId: string,
    candidate: RTCIceCandidate,
    receivers: string[]
  ) {
    this.send({
      type: "webrtc_ice_candidate",
      data: {
        conversationId,
        candidate: {
          candidate: candidate.candidate,
          sdpMLineIndex: candidate.sdpMLineIndex,
          sdpMid: candidate.sdpMid,
        },
        receivers,
        sender: this.currentUser,
        timestamp: Date.now(),
      },
      conversationId,
      sender: this.currentUser || undefined,
      timestamp: Date.now(),
    });
  }

  // 发送会话更新通知
  sendConversationUpdated(conversationId: string, receivers: string[]) {
    this.send({
      type: "conversation_updated",
      data: {
        conversationId,
        receivers,
        sender: this.currentUser,
        timestamp: Date.now(),
      },
      conversationId,
      sender: this.currentUser || undefined,
      timestamp: Date.now(),
    });
  }

  // 计划重连
  private scheduleReconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    this.reconnectInterval = setTimeout(() => {
      if (this.currentUser) {
        console.log("尝试重新连接WebSocket...");
        this.connect(this.currentUser).catch((error) => {
          console.error("重连失败:", error);
          // 继续尝试重连
          this.scheduleReconnect();
        });
      }
    }, this.backoffMs);

    // 指数退避上限
    this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
  }

  // 开始心跳
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // 发送ping以维持连接
        try {
          (this.ws as any).ping?.();
        } catch {
          // Fallback 到应用层 ping
          this.send({ type: "ping" as any, data: { timestamp: Date.now() } });
        }
      }
    }, 25000); // 25秒
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // 获取当前用户
  getCurrentUser(): string | null {
    return this.currentUser;
  }

  // 供页面在挂载后主动取出最近一次来电邀请
  getLastCallInvite(): any | null {
    return this.lastCallInvite;
  }

  // 清空最近一次来电邀请
  clearLastCallInvite() {
    this.lastCallInvite = null;
  }
}

// 导出单例实例
export default WebSocketService.getInstance();