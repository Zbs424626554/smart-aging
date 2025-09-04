// server/src/index.ts
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import emergencyRoutes from "./routes/emergency.routes";
import userRoutes from "./routes/users.routes";
import healthRoutes from "./routes/health.routes";
import ordersRoutes from "./routes/orders.routes";
import approvesRoutes from "./routes/approves.routes";
import uploadRoutes from "./routes/upload.routes";
import paymentRoutes from "./routes/payment.routes";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { initSocket } from "./config/socket";
import { WebSocket, WebSocketServer } from "ws";
import messageRoutes from "./routes/ZBS/message";
import userRoutesZBS from "./routes/ZBS/users";
import elderHealthRoutes from "./routes/ZBS/elderhealth";
import elderOrderRoutes from "./routes/ZBS/elderorder";
import newDevelopElderHealthRoutes from "./routes/newDevelop/elderhealth";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(morgan("dev"));

// 禁用 ETag 并禁止缓存，避免接口返回 304 导致前端拿不到数据
app.set("etag", false);
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

connectDB();

// 静态文件服务
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API路由
app.use("/api/auth", authRoutes);
app.use("/api/emergency", emergencyRoutes(io));
app.use("/api/users", userRoutes);
app.use("/api/health-records", healthRoutes);
app.use("/api/elderhealth", elderHealthRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/approves", approvesRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api", messageRoutes);
app.use("/api", userRoutesZBS);
app.use("/api", elderHealthRoutes);
app.use("/api", newDevelopElderHealthRoutes);
app.use("/api/elderorder", elderOrderRoutes);

// WebSocket服务器设置

app.use("/api", messageRoutes);
app.use("/api", userRoutes);
app.use("/api/elderorder", elderOrderRoutes);

// WebSocket服务器设置（启用压缩与最大负载限制）
const wss = new WebSocketServer({
  server,
  path: "/ws",
  perMessageDeflate: true,
  maxPayload: 1024 * 1024, // 1MB
});

// 存储用户连接
interface UserConnection {
  ws: WebSocket;
  username: string;
  lastSeen: number;
}

const userConnections = new Map<string, UserConnection>();
const conversationUsers = new Map<string, Set<string>>(); // conversationId -> Set of usernames

// WebSocket连接处理
// 为心跳追踪扩展属性
type AliveWebSocket = WebSocket & { isAlive?: boolean };

// 心跳：服务端定期ping，未响应的连接将被清理
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((client) => {
    const c = client as AliveWebSocket;
    if (c.isAlive === false) {
      try {
        c.terminate();
      } catch {}
      return;
    }
    c.isAlive = false;
    try {
      c.ping();
    } catch {}
  });
}, 30000);

wss.on("connection", (ws: WebSocket, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const username = url.searchParams.get("username");

  if (!username) {
    ws.close(1008, "Username required");
    return;
  }

  // 用户已连接WebSocket

  // 存储用户连接
  userConnections.set(username, {
    ws,
    username,
    lastSeen: Date.now(),
  });

  // 标记连接存活并监听pong
  const aliveWs = ws as AliveWebSocket;
  aliveWs.isAlive = true;
  ws.on("pong", () => {
    aliveWs.isAlive = true;
  });

  // 发送连接确认
  ws.send(
    JSON.stringify({
      type: "connected",
      data: { username, timestamp: Date.now() },
    })
  );

  // 处理消息
  ws.on("message", (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      handleWebSocketMessage(username, message);
    } catch (error) {
      console.error("WebSocket消息解析错误:", error);
    }
  });

  // 处理断开连接
  ws.on("close", () => {
    userConnections.delete(username);

    // 从所有会话中移除用户
    conversationUsers.forEach((users, conversationId) => {
      if (users.has(username)) {
        users.delete(username);
        if (users.size === 0) {
          conversationUsers.delete(conversationId);
        }
      }
    });
  });

  // 处理错误
  ws.on("error", (error) => {
    console.error(`WebSocket错误 (${username}):`, error);
  });
});

// 处理WebSocket消息
function handleWebSocketMessage(senderUsername: string, message: any) {
  const { type, data, conversationId } = message;

  switch (type) {
    case "message":
      // 聊天消息
      if (conversationId && data.receivers) {
        // 将发送者添加到会话用户列表
        if (!conversationUsers.has(conversationId)) {
          conversationUsers.set(conversationId, new Set());
        }
        conversationUsers.get(conversationId)!.add(senderUsername);

        // 广播消息到接收者
        data.receivers.forEach((receiverUsername: string) => {
          const receiverConn = userConnections.get(receiverUsername);
          if (receiverConn && receiverConn.ws.readyState === WebSocket.OPEN) {
            receiverConn.ws.send(
              JSON.stringify({
                type: "message",
                data: {
                  id: `ws_${Date.now()}_${Math.random()}`,
                  conversationId,
                  sender: senderUsername,
                  content: data.content,
                  sendTime: data.sendTime || Date.now(),
                  type: data.type || "text",
                  receivers: data.receivers,
                },
              })
            );
          }
        });
      }
      break;

    case "typing":
    case "stop_typing":
      // 打字状态
      if (conversationId) {
        const conversationUserSet = conversationUsers.get(conversationId);
        if (conversationUserSet) {
          conversationUserSet.forEach((username) => {
            if (username !== senderUsername) {
              const userConn = userConnections.get(username);
              if (userConn && userConn.ws.readyState === WebSocket.OPEN) {
                userConn.ws.send(
                  JSON.stringify({
                    type,
                    data: {
                      conversationId,
                      username: senderUsername,
                    },
                  })
                );
              }
            }
          });
        }
      }
      break;

    case "ping":
      // 心跳回应
      const senderConn = userConnections.get(senderUsername);
      if (senderConn && senderConn.ws.readyState === WebSocket.OPEN) {
        senderConn.ws.send(
          JSON.stringify({
            type: "pong",
            data: { timestamp: Date.now() },
          })
        );
        senderConn.lastSeen = Date.now();
      }
      break;

    case "user_online":
      // 用户上线通知
      broadcastUserStatus(senderUsername, "online");
      break;

    case "user_offline":
      // 用户下线通知
      broadcastUserStatus(senderUsername, "offline");
      break;

    case "call_invite":
      // 电话邀请
      if (data.receivers) {
        data.receivers.forEach((receiverUsername: string) => {
          const receiverConn = userConnections.get(receiverUsername);
          if (receiverConn && receiverConn.ws.readyState === WebSocket.OPEN) {
            receiverConn.ws.send(
              JSON.stringify({
                type: "call_invite",
                data: {
                  conversationId: data.conversationId,
                  callType: data.callType,
                  caller: senderUsername,
                  callerName: data.callerName || senderUsername,
                  timestamp: Date.now(),
                },
                conversationId: data.conversationId,
                sender: senderUsername,
                timestamp: Date.now(),
              })
            );
          }
        });
      }
      break;

    case "call_response":
      // 电话响应
      if (data.caller) {
        const callerConn = userConnections.get(data.caller);
        if (callerConn && callerConn.ws.readyState === WebSocket.OPEN) {
          callerConn.ws.send(
            JSON.stringify({
              type: "call_response",
              data: {
                conversationId: data.conversationId,
                response: data.response,
                responder: senderUsername,
                timestamp: Date.now(),
              },
              conversationId: data.conversationId,
              sender: senderUsername,
              timestamp: Date.now(),
            })
          );
        }
      }
      break;

    case "call_cancel":
      // 取消通话
      if (data.receivers) {
        data.receivers.forEach((receiverUsername: string) => {
          const receiverConn = userConnections.get(receiverUsername);
          if (receiverConn && receiverConn.ws.readyState === WebSocket.OPEN) {
            receiverConn.ws.send(
              JSON.stringify({
                type: "call_cancel",
                data: {
                  conversationId: data.conversationId,
                  sender: senderUsername,
                  timestamp: Date.now(),
                },
                conversationId: data.conversationId,
                sender: senderUsername,
                timestamp: Date.now(),
              })
            );
          }
        });
      }
      break;

    case "call_end":
      // 挂断通话
      if (data.receivers) {
        data.receivers.forEach((receiverUsername: string) => {
          const receiverConn = userConnections.get(receiverUsername);
          if (receiverConn && receiverConn.ws.readyState === WebSocket.OPEN) {
            receiverConn.ws.send(
              JSON.stringify({
                type: "call_end",
                data: {
                  conversationId: data.conversationId,
                  sender: senderUsername,
                  timestamp: Date.now(),
                },
                conversationId: data.conversationId,
                sender: senderUsername,
                timestamp: Date.now(),
              })
            );
          }
        });
      }
      break;

    case "webrtc_offer":
      // WebRTC Offer
      if (data.receivers) {
        data.receivers.forEach((receiverUsername: string) => {
          const receiverConn = userConnections.get(receiverUsername);
          if (receiverConn && receiverConn.ws.readyState === WebSocket.OPEN) {
            receiverConn.ws.send(
              JSON.stringify({
                type: "webrtc_offer",
                data: {
                  conversationId: data.conversationId,
                  offer: data.offer,
                  sender: senderUsername,
                  timestamp: Date.now(),
                },
                conversationId: data.conversationId,
                sender: senderUsername,
                timestamp: Date.now(),
              })
            );
          }
        });
      }
      break;

    case "webrtc_answer":
      // WebRTC Answer
      if (data.receivers) {
        data.receivers.forEach((receiverUsername: string) => {
          const receiverConn = userConnections.get(receiverUsername);
          if (receiverConn && receiverConn.ws.readyState === WebSocket.OPEN) {
            receiverConn.ws.send(
              JSON.stringify({
                type: "webrtc_answer",
                data: {
                  conversationId: data.conversationId,
                  answer: data.answer,
                  sender: senderUsername,
                  timestamp: Date.now(),
                },
                conversationId: data.conversationId,
                sender: senderUsername,
                timestamp: Date.now(),
              })
            );
          }
        });
      }
      break;

    case "webrtc_ice_candidate":
      // WebRTC ICE Candidate
      if (data.receivers) {
        data.receivers.forEach((receiverUsername: string) => {
          const receiverConn = userConnections.get(receiverUsername);
          if (receiverConn && receiverConn.ws.readyState === WebSocket.OPEN) {
            receiverConn.ws.send(
              JSON.stringify({
                type: "webrtc_ice_candidate",
                data: {
                  conversationId: data.conversationId,
                  candidate: data.candidate,
                  sender: senderUsername,
                  timestamp: Date.now(),
                },
                conversationId: data.conversationId,
                sender: senderUsername,
                timestamp: Date.now(),
              })
            );
          }
        });
      }
      break;

    case "conversation_updated":
      // 会话更新通知
      if (data.receivers) {
        data.receivers.forEach((receiverUsername: string) => {
          const receiverConn = userConnections.get(receiverUsername);
          if (receiverConn && receiverConn.ws.readyState === WebSocket.OPEN) {
            receiverConn.ws.send(
              JSON.stringify({
                type: "conversation_updated",
                data: {
                  conversationId: data.conversationId,
                  sender: senderUsername,
                  timestamp: Date.now(),
                },
                conversationId: data.conversationId,
                sender: senderUsername,
                timestamp: Date.now(),
              })
            );
          }
        });
      }
      break;

    default:
    // 未知消息类型，忽略
  }
}

// 广播用户状态
function broadcastUserStatus(username: string, status: "online" | "offline") {
  const statusMessage = JSON.stringify({
    type: `user_${status}`,
    data: { username, timestamp: Date.now() },
  });

  userConnections.forEach((conn, connUsername) => {
    if (connUsername !== username && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(statusMessage);
    }
  });
}

// 广播对话创建事件
export function broadcastConversationCreated(conversationData: any) {
  const message = JSON.stringify({
    type: "conversation_created",
    data: conversationData,
    timestamp: Date.now(),
  });

  // 向对话参与者广播
  if (conversationData.participants) {
    conversationData.participants.forEach((username: string) => {
      const userConn = userConnections.get(username);
      if (userConn && userConn.ws.readyState === WebSocket.OPEN) {
        userConn.ws.send(message);
      }
    });
  }
}

// 广播对话更新事件（有新消息时）
export function broadcastConversationUpdated(conversationData: any) {
  const message = JSON.stringify({
    type: "conversation_updated",
    data: conversationData,
    timestamp: Date.now(),
  });

  // 向对话参与者广播
  if (conversationData.participants) {
    conversationData.participants.forEach((username: string) => {
      const userConn = userConnections.get(username);
      if (userConn && userConn.ws.readyState === WebSocket.OPEN) {
        userConn.ws.send(message);
      }
    });
  }
}

// 清理不活跃连接
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5分钟超时

  userConnections.forEach((conn, username) => {
    if (now - conn.lastSeen > timeout) {
      conn.ws.close();
      userConnections.delete(username);
    }
  });
}, 60000); // 每分钟检查一次

// 进程结束时清理心跳定时器
process.on("exit", () => clearInterval(heartbeatInterval));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
});
