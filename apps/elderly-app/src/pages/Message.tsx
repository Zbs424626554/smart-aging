import { useState, useEffect, useRef } from "react";
import {
  List,
  SearchBar,
  Badge,
  Empty,
  SpinLoading,
  NavBar,
} from "antd-mobile";
import { RedoOutline } from "antd-mobile-icons";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { MessageService, type ChatItem } from "../services/message.service";
import { UserService } from "../services/user.service";

import { useNavigate } from "react-router-dom";
import WebSocketService from "../services/websocket.service";

// 聊天消息类型定义
interface ChatMessage {
  id: string;
  content: any; // 支持位置对象或 geo: 字符串
  timestamp: Date;
  isRead: boolean;
  type: "text" | "image" | "voice" | "system" | "location";
}

// 聊天联系人类型定义
interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: ChatMessage;
  unreadCount: number;
  isOnline: boolean;
  role: "nurse" | "family" | "admin" | "system";
}

export default function Message() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatList, setChatList] = useState<ChatContact[]>([]);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [friendPreview, setFriendPreview] = useState<{ createdAt: string; fromName: string } | null>(null);

  // 获取当前用户信息
  const getCurrentUser = () => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        return JSON.parse(userInfo);
      } catch {
        return null;
      }
    }
    return null;
  };

  // 将API返回的聊天数据转换为组件需要的格式
  const convertToChatContacts = (chatItems: ChatItem[]): ChatContact[] => {
    return chatItems.map((item) => ({
      id: item.id,
      name: item.name,
      avatar: item.avatar,
      lastMessage: item.lastMessage
        ? {
          id: item.lastMessage.id,
          content: item.lastMessage.content,
          timestamp: new Date(item.lastMessage.timestamp),
          isRead: item.lastMessage.isRead,
          type: item.lastMessage.type as
            | "text"
            | "image"
            | "voice"
            | "system",
        }
        : {
          id: "",
          content: "暂无消息",
          timestamp: new Date(),
          isRead: true,
          type: "text" as const,
        },
      unreadCount: item.unreadCount,
      isOnline: item.isOnline,
      role: item.role as "nurse" | "family" | "admin" | "system",
    }));
  };

  // 加载对话列表
  const loadChatList = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const currentUser = getCurrentUser();

      if (!currentUser || !currentUser.username) {
        // 用户未登录或用户名不存在
        setChatList([]);
        return;
      }

      // 调用API获取用户的对话列表
      const response = await MessageService.getUserChatList(
        currentUser.username
      );

      // 验证响应数据
      if (response && response.list && Array.isArray(response.list)) {
        const chatContacts = convertToChatContacts(response.list as ChatItem[]);
        // console.log(chatContacts);
        setChatList(chatContacts);
      } else {
        // API返回的数据格式不正确
        setChatList([]);
      }
      // 加载好友申请预览
      try {
        const reqResp = await UserService.getReceivedFriendRequests({ toUserId: currentUser.id || currentUser._id });
        const reqList = (reqResp as any)?.data?.list || [];
        if (Array.isArray(reqList) && reqList.length > 0) {
          const first = reqList[0];
          setFriendPreview({ createdAt: first.createdAt, fromName: first.fromRealname || first.fromUsername || "" });
        } else {
          setFriendPreview(null);
        }
      } catch { }
    } catch (error) {
      console.error("加载对话列表失败:", error);
      setChatList([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // 连接WebSocket用于实时更新
  const connectWebSocket = async (username: string) => {
    try {
      await WebSocketService.connect(username);
      setIsWebSocketConnected(true);
      // Message页面WebSocket连接成功

      // 监听对话创建/更新事件
      WebSocketService.addEventListener(
        "conversation_created",
        handleConversationUpdate
      );
      WebSocketService.addEventListener(
        "conversation_updated",
        handleConversationUpdate
      );
      WebSocketService.addEventListener("message", handleNewMessage);
    } catch (error) {
      console.warn("Message页面WebSocket连接失败:", error);
      setIsWebSocketConnected(false);
    }
  };

  // 处理对话创建/更新事件
  const handleConversationUpdate = (_data: any) => {
    // 收到对话更新事件
    // 延迟刷新，避免频繁更新
    debouncedRefreshChatList();
  };

  // 处理新消息事件
  const handleNewMessage = (_data: any) => {
    // 收到新消息事件
    // 延迟刷新聊天列表以更新最后消息
    debouncedRefreshChatList();
  };

  // 防抖刷新聊天列表（自动刷新，不显示加载圈）
  const debouncedRefreshChatList = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      loadChatList(false); // 自动刷新时不显示加载圈
    }, 1000); // 1秒延迟，避免频繁刷新
  };

  // 初始化和清理
  useEffect(() => {
    loadChatList();

    // 连接WebSocket用于实时更新
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username) {
      // 异步连接WebSocket，不阻塞页面加载
      setTimeout(() => {
        connectWebSocket(currentUser.username);
      }, 500);
    }

    // 清理函数
    return () => {
      try {
        // 移除事件监听器
        WebSocketService.removeEventListener(
          "conversation_created",
          handleConversationUpdate
        );
        WebSocketService.removeEventListener(
          "conversation_updated",
          handleConversationUpdate
        );
        WebSocketService.removeEventListener("message", handleNewMessage);

        // 清理定时器
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      } catch (error) {
        console.warn("清理WebSocket监听器时出错:", error);
      }
    };
  }, []);

  // 过滤聊天列表
  const filteredChatList = chatList.filter((chat) =>
    chat.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // 列表最后一条消息展示文案
  const getLastMessagePreview = (msg: ChatMessage) => {
    if (!msg) return "暂无消息";
    if (msg.type === "image") return "[ 图片 ]";
    if (msg.type === "voice") return "[ 语音 ]";
    if (msg.type === "location") return "[ 位置信息 ]";
    return msg.content;
  };

  // 格式化时间显示
  const formatTime = (date: Date | string | number) => {
    // 确保 date 是一个有效的 Date 对象
    let validDate: Date;
    try {
      if (date instanceof Date) {
        validDate = date;
      } else {
        validDate = new Date(date);
      }

      // 检查是否是有效的日期
      if (isNaN(validDate.getTime())) {
        return "刚刚";
      }
    } catch {
      return "刚刚";
    }

    const now = new Date();
    const diffInHours =
      (now.getTime() - validDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(validDate, { addSuffix: true, locale: zhCN });
    } else if (diffInHours < 48) {
      return "昨天";
    } else {
      return validDate.toLocaleDateString("zh-CN");
    }
  };

  // 获取角色头像图片路径
  const getRoleAvatar = (role: string) => {
    switch (role) {
      case "nurse":
        return "/imgs/nurse.png";
      case "family":
        return "/imgs/family.png";
      case "admin":
        return "/imgs/family.png"; // 管理员使用家属头像
      case "system":
        return "/imgs/elderly.png"; // 系统消息使用老人头像
      default:
        return "/imgs/elderly.png"; // 默认使用老人头像
    }
  };

  // 获取角色颜色
  const getRoleColor = (role: string) => {
    switch (role) {
      case "nurse":
        return "#1890ff";
      case "family":
        return "#52c41a";
      case "admin":
        return "#722ed1";
      case "system":
        return "#fa8c16";
      default:
        return "#666";
    }
  };

  // 处理聊天项点击
  const handleChatClick = (chat: ChatContact) => {
    // 这里可以跳转到具体的聊天页面
    navigate(`/chat/${chat.id}`);
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  // 刷新对话列表（手动刷新，显示加载圈）
  const handleRefresh = () => {
    loadChatList(true); // 手动刷新时显示加载圈
  };

  // 跳转到新朋友（好友申请）页
  const handleGoNewFriends = () => {
    navigate('/addFriends');
  };


  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", paddingBottom: "50px" }}>
      {/* 顶部导航栏 */}
      <NavBar
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #f0f0f0",
        }}
        backArrow={false}
        right={
          <div
            onClick={handleRefresh}
            style={{
              cursor: "pointer",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#fff",
              border: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              marginLeft: "60px"
            }}
            aria-label="刷新"
            role="button"
          >
            <RedoOutline style={{ fontSize: 18 }} />
          </div>
        }
      >
        消息{isWebSocketConnected ? '' : ''}
      </NavBar>

      {/* 搜索框 */}
      <div style={{ padding: "12px", backgroundColor: "#fff" }}>
        <SearchBar
          placeholder="搜索聊天"
          value={searchValue}
          onChange={handleSearch}
          style={{
            "--border-radius": "8px",
            "--background": "#f5f5f5",
          }}
        />
      </div>



      {/* 新朋友消息（通知项） */}
      <div style={{ background: "#fff" }}>
        <List style={{ "--border-top": "none", "--border-bottom": "none" }}>
          <List.Item
            onClick={handleGoNewFriends}
            style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}
            prefix={
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: `2px solid #ddd`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f5f5f5",
                  }}
                >
                  <img
                    src="/imgs/添加.png"
                    alt="新的朋友"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.style.display = "none";
                      const p = t.parentElement;
                      if (p) {
                        p.innerHTML = '<span style="font-size:36px;color:#52c41a">＋</span>';
                      }
                    }}
                  />
                </div>
              </div>
            }
            title={
              <div
                style={{
                  width: "280px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#333" }}>新的朋友</span>
                <span style={{ fontSize: "12px", color: "#999" }}>
                  {friendPreview ? formatTime(friendPreview.createdAt) : ""}
                </span>
              </div>
            }
            description={
              <span style={{ fontSize: "14px", color: "#333" }}>
                {friendPreview ? `${friendPreview.fromName} 添加您为好友` : "暂无好友申请"}
              </span>
            }
            arrow={false}
          />
        </List>
      </div>

      {/* 聊天列表 */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 12 }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}
          >
            <SpinLoading color="primary" />
          </div>
        ) : filteredChatList.length === 0 ? (
          <Empty
            style={{ padding: "60px 0" }}
            imageStyle={{ width: 128 }}
            description={searchValue ? "没有找到相关聊天" : "暂无聊天消息"}
          />
        ) : (
          <List style={{ "--border-top": "none", "--border-bottom": "none" }}>
            {filteredChatList.map((chat) => (
              <List.Item
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#fff",
                  borderBottom: "1px solid #f0f0f0",
                }}
                prefix={
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: `2px solid #ddd`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={getRoleAvatar(chat.role)}
                        alt={chat.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          // 图片加载失败时的备用方案
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.style.backgroundColor = getRoleColor(
                              chat.role
                            );
                            parent.innerHTML = `<span style="color: #fff; font-size: 20px;">${chat.name.charAt(0)}</span>`;
                          }
                        }}
                      />
                    </div>
                    {chat.isOnline && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "2px",
                          right: "2px",
                          width: "12px",
                          height: "12px",
                          backgroundColor: "#52c41a",
                          borderRadius: "50%",
                          border: "2px solid #fff",
                        }}
                      />
                    )}
                  </div>
                }
                title={
                  <div
                    style={{
                      width: "280px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: chat.unreadCount > 0 ? "600" : "400",
                        color: "#333",
                      }}
                    >
                      {chat.name}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#999",
                      }}
                    >
                      {formatTime(chat.lastMessage.timestamp)}
                    </span>
                  </div>
                }
                description={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: chat.lastMessage.isRead ? "#999" : "#333",
                        fontWeight: chat.lastMessage.isRead ? "400" : "500",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {chat.lastMessage.type === "system" && "🔔 "}
                      {getLastMessagePreview(chat.lastMessage)}
                    </span>
                    {chat.unreadCount > 0 && (
                      <Badge
                        content={
                          chat.unreadCount > 99 ? "99+" : chat.unreadCount
                        }
                        style={{
                          "--right": "0",
                          "--top": "0",
                        }}
                      />
                    )}
                  </div>
                }
                arrow={false}
              />
            ))}
          </List>
        )}
      </div>


    </div>
  );
}
