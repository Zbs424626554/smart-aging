import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Input,
  Button,
  Avatar,
  Spin,
  message,
  List,
  Typography,
  Space,
  Image,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  SmileOutlined,
  PlusOutlined,
  PictureOutlined,
  CameraOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import EmojiPicker from "emoji-picker-react";
import {
  MessageService,
  type ChatMessage,
  type ConversationDetail,
} from "../services/message.service";
import WebSocketService from "../services/websocket.service";
import { MicRecorder, blobToBase64 } from "../utils/recorder";

const { TextArea } = Input;
const { Text } = Typography;

// 语音播放器组件
const VoicePlayer: React.FC<{
  src: string;
  isCurrentUser: boolean;
}> = ({ src, isCurrentUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}
      </style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          backgroundColor: isCurrentUser
            ? "rgba(255, 255, 255, 0.1)"
            : "#f8f9fa",
          borderRadius: "20px",
          minWidth: "200px",
          maxWidth: "280px",
          transition: "all 0.2s ease",
          cursor: "default",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* 播放/暂停按钮 */}
        <button
          onClick={togglePlay}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: isCurrentUser ? "#fff" : "#007bff",
            color: isCurrentUser ? "#1890ff" : "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease",
            transform: isPlaying ? "scale(1.05)" : "scale(1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = isPlaying
              ? "scale(1.1)"
              : "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isPlaying
              ? "scale(1.05)"
              : "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
          }}
          title={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? (
            <div
              style={{
                width: "12px",
                height: "12px",
                display: "flex",
                gap: "2px",
              }}
            >
              <div
                style={{
                  width: "3px",
                  height: "12px",
                  backgroundColor: "currentColor",
                  borderRadius: "1px",
                }}
              />
              <div
                style={{
                  width: "3px",
                  height: "12px",
                  backgroundColor: "currentColor",
                  borderRadius: "1px",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "8px solid currentColor",
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                marginLeft: "2px",
              }}
            />
          )}
        </button>

        {/* 时间显示 */}
        <span
          style={{
            fontSize: "12px",
            color: isCurrentUser ? "rgba(255, 255, 255, 0.8)" : "#6c757d",
            minWidth: "35px",
            textAlign: "center",
          }}
        >
          {formatTime(currentTime)}
        </span>

        {/* 进度条 */}
        <div
          style={{
            flex: 1,
            height: "4px",
            backgroundColor: isCurrentUser
              ? "rgba(255, 255, 255, 0.3)"
              : "#e9ecef",
            borderRadius: "2px",
            overflow: "hidden",
            position: "relative",
            cursor: "pointer",
          }}
          onClick={(e) => {
            const audio = audioRef.current;
            if (!audio) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickPercent = clickX / rect.width;
            const newTime = clickPercent * audio.duration;

            audio.currentTime = newTime;
            setCurrentTime(newTime);
          }}
          title="点击跳转播放位置"
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: isCurrentUser ? "#fff" : "#007bff",
              borderRadius: "2px",
              transition: "width 0.1s ease",
              position: "relative",
            }}
          >
            {/* 进度条上的小圆点指示器 */}
            {isPlaying && (
              <div
                style={{
                  position: "absolute",
                  right: "-2px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "currentColor",
                  borderRadius: "50%",
                  boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                }}
              />
            )}
          </div>
        </div>

        {/* 总时长 - 已移除 */}

        {/* 音量图标 */}
        <div
          style={{
            width: "16px",
            height: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isCurrentUser ? "rgba(255, 255, 255, 0.6)" : "#adb5bd",
            animation: isPlaying ? "pulse 1.5s ease-in-out infinite" : "none",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: "16px", height: "16px" }}
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        </div>

        {/* 隐藏的音频元素 */}
        <audio ref={audioRef} src={src} preload="metadata" />
      </div>
    </>
  );
};

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MicRecorder | null>(null);
  const recordStartTimeRef = useRef<number | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const albumInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
  } | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [callInvite, setCallInvite] = useState<{
    isVisible: boolean;
    caller?: string;
    callerName?: string;
    callType?: "voice" | "video";
    conversationId?: string;
  }>({
    isVisible: false,
  });
  const [callSession, setCallSession] = useState<{
    isActive: boolean;
    callType?: "voice" | "video";
    status: "calling" | "connected" | "ended";
    startTime?: number;
    targetUser?: string;
    targetUserName?: string;
    caller?: string; // 通话发起者
    callerName?: string; // 通话发起者显示名称
  }>({
    isActive: false,
    status: "ended",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 记录最近一次取消/挂断的时间，防止取消后乱序到达的邀请重新弹出
  const lastCancelTimeRef = useRef<Map<string, number>>(new Map());
  const lastEndTimeRef = useRef<Map<string, number>>(new Map());

  // WebRTC相关refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  // 自定义拍照（相机）相关
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [cameraMode, setCameraMode] = useState<"live" | "preview">("live");
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  // 图片预览
  const [imagePreview, setImagePreview] = useState<{
    visible: boolean;
    index: number;
  }>({ visible: false, index: 0 });
  const imageUrls = useMemo(
    () => messages.filter((m) => m.type === "image").map((m) => m.content),
    [messages]
  );
  const openImagePreview = (src: string) => {
    const idx = imageUrls.indexOf(src);
    setImagePreview((prev) => {
      if (prev.visible && imageUrls[prev.index] === src) {
        return { visible: false, index: 0 };
      }
      return { visible: true, index: idx >= 0 ? idx : 0 };
    });
  };

  // 点击弹出框外关闭表情面板
  useEffect(() => {
    if (!showEmoji) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (
        emojiPickerRef.current &&
        target &&
        !emojiPickerRef.current.contains(target)
      ) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showEmoji]);

  // 点击弹出框外关闭“+”更多面板
  useEffect(() => {
    if (!showActions) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (
        actionsRef.current &&
        target &&
        !actionsRef.current.contains(target)
      ) {
        setShowActions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showActions]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  // 获取当前用户信息并连接WebSocket
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setCurrentUser({ username: user.username, role: user.role });

        // 异步连接WebSocket，不阻塞其他功能
        setTimeout(() => {
          connectWebSocket(user.username);
        }, 100);
      } catch (error) {
        console.error("解析用户信息失败:", error);
      }
    }

    // 组件卸载时断开WebSocket连接
    return () => {
      try {
        // 移除事件监听器
        WebSocketService.removeEventListener("message", handleNewMessage);
        WebSocketService.removeEventListener("typing", handleTypingStart);
        WebSocketService.removeEventListener("stop_typing", handleTypingStop);
        WebSocketService.removeEventListener("call_invite", handleCallInvite);
        WebSocketService.removeEventListener(
          "call_response",
          handleCallResponse
        );
        WebSocketService.removeEventListener("call_cancel", handleCallCancel);
        WebSocketService.removeEventListener("call_end", handleCallEnd);
        WebSocketService.removeEventListener("webrtc_offer", handleWebRTCOffer);
        WebSocketService.removeEventListener(
          "webrtc_answer",
          handleWebRTCAnswer
        );
        WebSocketService.removeEventListener(
          "webrtc_ice_candidate",
          handleWebRTCICECandidate
        );
        WebSocketService.removeEventListener(
          "conversation_updated",
          handleConversationUpdated
        );

        WebSocketService.disconnect();
      } catch (error) {
        // 静默处理断开连接的错误
        console.warn("WebSocket断开连接时出错:", error);
      }
    };
  }, []);

  // 预注册 WebSocket 事件监听，避免连接握手期间丢失取消/挂断事件
  const registerWebSocketListeners = () => {
    WebSocketService.addEventListener("message", handleNewMessage);
    WebSocketService.addEventListener("typing", handleTypingStart);
    WebSocketService.addEventListener("stop_typing", handleTypingStop);
    WebSocketService.addEventListener("call_invite", handleCallInvite);
    WebSocketService.addEventListener("call_response", handleCallResponse);
    WebSocketService.addEventListener("call_cancel", handleCallCancel);
    WebSocketService.addEventListener("call_end", handleCallEnd);
    WebSocketService.addEventListener("webrtc_offer", handleWebRTCOffer);
    WebSocketService.addEventListener("webrtc_answer", handleWebRTCAnswer);
    WebSocketService.addEventListener(
      "webrtc_ice_candidate",
      handleWebRTCICECandidate
    );
    WebSocketService.addEventListener(
      "conversation_updated",
      handleConversationUpdated
    );
  };

  // 连接WebSocket
  const connectWebSocket = async (username: string) => {
    try {
      // 先注册监听，后连接，降低极端情况下事件丢失的风险
      registerWebSocketListeners();

      await WebSocketService.connect(username);
      setIsWebSocketConnected(true);
      // console.log("WebSocket连接成功");
    } catch (error) {
      console.warn("WebSocket连接失败，将使用传统模式:", error);
      setIsWebSocketConnected(false);
      // 静默处理WebSocket连接失败，不影响其他功能
    }
  };

  // 处理接收到的新消息
  const handleNewMessage = (messageData: any) => {
    if (messageData.conversationId === id) {
      const newMessage: ChatMessage = {
        id: messageData.id || `ws_${Date.now()}`,
        sender: messageData.sender,
        content: messageData.content,
        sendTime: messageData.sendTime || Date.now(),
        type: messageData.type || "text",
        receiver: messageData.receivers || [],
      };

      setMessages((prev) => {
        // 避免重复消息
        const exists = prev.some(
          (msg) =>
            msg.id === newMessage.id ||
            (msg.sender === newMessage.sender &&
              msg.content === newMessage.content &&
              Math.abs(msg.sendTime - newMessage.sendTime) < 1000)
        );

        if (!exists) {
          return [...prev, newMessage];
        }
        return prev;
      });
    }
  };

  // 处理打字开始
  const handleTypingStart = (data: any) => {
    if (data.conversationId === id && data.username !== currentUser?.username) {
      setTypingUsers((prev) => new Set([...prev, data.username]));
    }
  };

  // 处理打字停止
  const handleTypingStop = (data: any) => {
    if (data.conversationId === id) {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
    }
  };

  // 处理收到电话邀请
  const handleCallInvite = (data: any) => {
    if (data.caller !== currentUser?.username) {
      // 如果刚记录过取消/挂断（5秒内），忽略此次邀请，避免乱序导致仍在拨号
      const now = Date.now();
      const lastCancel =
        lastCancelTimeRef.current.get(data.conversationId) || 0;
      const lastEnd = lastEndTimeRef.current.get(data.conversationId) || 0;
      if (now - lastCancel < 500 || now - lastEnd < 500) return;

      // 仅当当前路由会话匹配，或尚未指定会话但收到邀请时显示
      if (!id || data.conversationId === id) {
        setCallInvite({
          isVisible: true,
          caller: data.caller,
          callerName: data.callerName || data.caller,
          callType: data.callType,
          conversationId: data.conversationId,
        });
      }
    }
  };

  // 处理电话响应
  const handleCallResponse = async (data: any) => {
    if (data.conversationId === id) {
      if (data.response === "accept") {
        // 发起方开始建立WebRTC连接（语音/视频通话均需建立）
        try {
          await initializeWebRTCCall();
        } catch (error) {
          console.error("初始化WebRTC连接失败:", error);
          message.error("建立通话连接失败");
        }

        // 更新通话状态为已连接
        setCallSession((prev) => ({
          ...prev,
          status: "connected",
          startTime: Date.now(),
        }));
      } else if (data.response === "reject") {
        // 对方拒绝了通话，先立即关闭本地设备
        cleanupWebRTC();
        // 发起方在被拒绝时不创建任何聊天记录，由接收方创建（sender 为发起方）
        setCallSession({
          isActive: false,
          status: "ended",
          caller: callSession.caller,
          callerName: callSession.callerName,
        });
        // 记录时间，用于抑制可能的乱序邀请/offer
        if (id) {
          lastCancelTimeRef.current.set(id, Date.now());
        }
      }
    }
  };

  // 初始化WebRTC通话（发起方）
  const initializeWebRTCCall = async () => {
    if (!conversation || !currentUser || !id) return;

    try {
      // 根据通话类型选择本地媒体
      if (callSession.callType === "video") {
        const stream = await getVideoStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => { });
        }
      } else {
        await getAudioStream();
      }

      // 创建PeerConnection
      const pc = createPeerConnection();

      // 添加本地音/视频轨到 RTCPeerConnection
      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getTracks();
        if (tracks.length === 0) {
          console.warn("本地流没有可用轨道");
        }
        tracks.forEach((track) => pc.addTrack(track, localStreamRef.current!));
      }

      // 创建Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 发送Offer
      const receivers = conversation.users
        .filter((user) => user.username !== currentUser.username)
        .map((user) => user.username);

      WebSocketService.sendWebRTCOffer(id, offer, receivers);
      // WebRTC Offer发送成功
    } catch (error) {
      console.error("初始化WebRTC通话失败:", error);
      throw error;
    }
  };

  // 处理对方挂断通话
  const handleCallEnd = async (data: any) => {
    if (
      data.sender !== currentUser?.username &&
      (data.conversationId === id ||
        (callInvite.isVisible && callInvite.caller === data.sender))
    ) {
      // 始终关闭来电邀请弹窗（幂等）
      setCallInvite({ isVisible: false });

      // 计算通话时长（如果已连接）
      const wasConnected = callSession.status === "connected";
      const callDuration =
        wasConnected && callSession.startTime
          ? Math.floor((Date.now() - callSession.startTime) / 1000)
          : undefined;

      // 先立即关闭本地设备
      cleanupWebRTC();
      setCallSession({
        isActive: false,
        status: "ended",
        caller: callSession.caller,
        callerName: callSession.callerName,
      });

      // 保存通话记录（仅在本端有通话激活时）
      if (callSession.isActive) {
        if (wasConnected && callDuration !== undefined) {
          await saveCallRecord("connect", callDuration);
        }
      }

      // 记录挂断时间，避免随后乱序到达的邀请干扰
      lastEndTimeRef.current.set(data.conversationId, Date.now());
    }
  };

  // 处理对方取消通话
  const handleCallCancel = (data: any) => {
    if (
      data.sender !== currentUser?.username &&
      (data.conversationId === id ||
        (callInvite.isVisible && callInvite.caller === data.sender))
    ) {
      // 始终关闭来电邀请弹窗（幂等）
      setCallInvite({ isVisible: false });

      // 无论当前处于何种状态，都统一结束通话，避免一端仍然保持“拨号中”
      cleanupWebRTC();
      setCallSession({
        isActive: false,
        status: "ended",
        caller: callSession.caller,
        callerName: callSession.callerName,
      });

      // 记录取消时间，避免随后乱序到达的邀请干扰
      lastCancelTimeRef.current.set(data.conversationId, Date.now());
    }
  };

  // WebRTC配置
  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // 获取音频流
  const getAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("获取音频流失败:", error);
      message.error("无法访问麦克风，请检查权限设置");
      throw error;
    }
  };

  // 获取音视频流（用于视频通话）
  const getVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("获取摄像头/麦克风失败:", error);
      message.error("无法访问摄像头或麦克风，请检查权限设置");
      throw error;
    }
  };

  // 创建PeerConnection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    // 处理ICE候选
    pc.onicecandidate = (event) => {
      if (
        event.candidate &&
        isWebSocketConnected &&
        conversation &&
        currentUser &&
        id
      ) {
        const receivers = conversation.users
          .filter((user) => user.username !== currentUser.username)
          .map((user) => user.username);

        WebSocketService.sendICECandidate(id, event.candidate, receivers);
      }
    };

    // 处理远程媒体流
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (!remoteStream) return;
      const hasVideo =
        remoteStream.getVideoTracks().length > 0 ||
        event.track.kind === "video";
      if (hasVideo) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch((error) => {
            console.warn("播放远程视频失败:", error);
          });
        }
      } else {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch((error) => {
            console.warn("播放远程音频失败:", error);
          });
        }
      }
    };

    // 连接状态变化
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        // WebRTC连接建立成功
      } else if (
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        // WebRTC连接失败或关闭
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // 清理WebRTC资源
  const cleanupWebRTC = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // 保存通话记录
  const saveCallRecord = async (
    status: "cancel" | "refusal" | "connect",
    callDuration?: number,
    callerOverride?: string // 新增参数，用于override caller
  ) => {
    // 通话记录参数

    const effectiveCaller = callerOverride || callSession.caller;

    if (!id || !effectiveCaller || !conversation) {
      console.error("保存通话记录失败: 缺少必要参数", {
        id,
        caller: callSession.caller,
        callerOverride,
        effectiveCaller,
        conversation: !!conversation,
      });
      return;
    }

    try {
      // 找到通话发起者和接收者
      const callerUser = conversation.users.find(
        (user) => user.username === effectiveCaller
      );
      const receiverUser = conversation.users.find(
        (user) => user.username !== effectiveCaller
      );

      if (!callerUser || !receiverUser) {
        console.error("保存通话记录失败: 找不到通话双方用户信息");
        return;
      }

      // sender始终是通话发起者，receiver始终是接收者
      const isVideo = callSession.callType === "video";
      const requestData = {
        sender: callerUser.username,
        receiver: receiverUser.username,
        content: getCallRecordContent(status, callDuration),
        type: isVideo ? "video_call" : "voice_call",
        status: status,
        time: callDuration || undefined,
        senderRole: callerUser.role,
        receiverRole: receiverUser.role,
        senderRealname: (callerUser as any).realname || callerUser.username,
        receiverRealname:
          (receiverUser as any).realname || receiverUser.username,
      };

      // 正在保存通话记录

      // 直接调用服务器API保存通话记录
      const response = await fetch("http://localhost:3001/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      // API响应状态

      if (response.ok) {
        const responseData = await response.json();
        // 通话记录已保存成功

        // 刷新聊天记录显示新的通话记录
        await fetchConversationDetail(true);

        // 通知对方会话已更新
        if (isWebSocketConnected && conversation && currentUser) {
          const receivers = conversation.users
            .filter((user) => user.username !== currentUser.username)
            .map((user) => user.username);

          if (receivers.length > 0) {
            WebSocketService.sendConversationUpdated(id, receivers);
          }
        }
      } else {
        const errorText = await response.text();
        console.error(
          "保存通话记录失败 - 服务器响应:",
          response.status,
          errorText
        );
      }
    } catch (error) {
      console.error("保存通话记录失败 - 网络错误:", error);
    }
  };

  // 获取通话记录内容
  const getCallRecordContent = (
    status: "cancel" | "refusal" | "connect",
    callDuration?: number
  ) => {
    switch (status) {
      case "cancel":
        return "已取消通话";
      case "refusal":
        return "已拒绝通话";
      case "connect":
        if (callDuration !== undefined) {
          const minutes = Math.floor(callDuration / 60);
          const seconds = callDuration % 60;
          return `通话时长 ${minutes}:${seconds.toString().padStart(2, "0")}`;
        }
        return "通话已结束";
      default:
        return "通话记录";
    }
  };

  // 处理WebRTC Offer
  const handleWebRTCOffer = async (data: any) => {
    if (data.conversationId === id && data.sender !== currentUser?.username) {
      try {
        // 根据 offer 判断是否视频通话：视频则申请 audio+video，语音则仅 audio
        const offerHasVideo = !!(
          data.offer?.sdp && data.offer.sdp.includes("m=video")
        );
        if (offerHasVideo) {
          const stream = await getVideoStream();
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.muted = true;
            localVideoRef.current.play().catch(() => { });
          }
        } else {
          await getAudioStream();
        }

        // 创建PeerConnection
        const pc = createPeerConnection();

        // 添加本地音频流
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current!);
          });
        }

        // 设置远程描述
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        // 创建答案
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // 发送答案
        const receivers = [data.sender];
        WebSocketService.sendWebRTCAnswer(id!, answer, receivers);

        // WebRTC Answer发送成功
      } catch (error) {
        console.error("处理WebRTC Offer失败:", error);
        message.error("建立音频连接失败");
      }
    }
  };

  // 处理WebRTC Answer
  const handleWebRTCAnswer = async (data: any) => {
    if (
      data.conversationId === id &&
      data.sender !== currentUser?.username &&
      peerConnectionRef.current
    ) {
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        // WebRTC Answer处理成功
      } catch (error) {
        console.error("处理WebRTC Answer失败:", error);
      }
    }
  };

  // 处理ICE候选
  const handleWebRTCICECandidate = async (data: any) => {
    if (
      data.conversationId === id &&
      data.sender !== currentUser?.username &&
      peerConnectionRef.current
    ) {
      try {
        const candidate = new RTCIceCandidate(data.candidate);
        await peerConnectionRef.current.addIceCandidate(candidate);
        // ICE候选添加成功
      } catch (error) {
        console.error("添加ICE候选失败:", error);
      }
    }
  };

  // 处理会话更新通知
  const handleConversationUpdated = async (data: any) => {
    if (data.conversationId === id && data.sender !== currentUser?.username) {
      // 收到会话更新通知，刷新对话详情
      // 刷新对话详情以显示新的通话记录
      await fetchConversationDetail();
    }
  };

  // 接听电话
  const acceptCall = async () => {
    if (callInvite.caller && callInvite.conversationId) {
      // 接听前确保拿到本地媒体流：视频通话申请摄像头+麦克风，语音只申请麦克风
      try {
        if (callInvite.callType === "video") {
          const stream = await getVideoStream();
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.muted = true;
            localVideoRef.current.play().catch(() => { });
          }
        } else {
          await getAudioStream();
        }
      } catch (e) {
        message.error("未获得所需设备权限，无法接听通话");
        return;
      }
      WebSocketService.sendCallResponse(
        callInvite.conversationId,
        "accept",
        callInvite.caller
      );

      // 显示电话页面
      setCallSession({
        isActive: true,
        callType: callInvite.callType!,
        status: "connected",
        startTime: Date.now(),
        targetUser: callInvite.caller,
        targetUserName: callInvite.callerName || callInvite.caller,
        caller: callInvite.caller, // 通话发起者是邀请方
        callerName: callInvite.callerName || callInvite.caller,
      });

      message.success("已接听通话");
    }
    setCallInvite({ isVisible: false });
  };

  // 拒绝电话
  const rejectCall = async () => {
    if (callInvite.caller && callInvite.conversationId) {
      WebSocketService.sendCallResponse(
        callInvite.conversationId,
        "reject",
        callInvite.caller
      );

      // 保存拒绝通话记录
      await saveCallRecord("refusal", undefined, callInvite.caller);

      message.info("已拒绝通话");
    }
    setCallInvite({ isVisible: false });
  };

  // 结束通话
  const endCall = async () => {
    // 计算通话时长和状态
    const wasConnected = callSession.status === "connected";
    const callDuration =
      wasConnected && callSession.startTime
        ? Math.floor((Date.now() - callSession.startTime) / 1000)
        : undefined;

    // 先立即关闭本地设备，及时释放摄像头/麦克风
    cleanupWebRTC();

    // 如果当前在通话中，通知对方
    if (
      callSession.isActive &&
      conversation &&
      currentUser &&
      isWebSocketConnected &&
      id
    ) {
      try {
        const receivers = conversation.users
          .filter((user) => user.username !== currentUser.username)
          .map((user) => user.username);

        if (receivers.length > 0) {
          if (callSession.status === "calling") {
            // 如果是呼叫状态下取消，发送取消通知
            WebSocketService.sendCallCancel(id, receivers);
          } else {
            // 如果是已连接状态下挂断，发送挂断通知
            WebSocketService.sendCallEnd(id, receivers);
          }
        }
      } catch (error) {
        console.warn("发送通知失败:", error);
      }
    }

    // 保存通话记录
    if (callSession.isActive) {
      if (wasConnected && callDuration !== undefined) {
        // 如果是已连接状态下挂断，保存通话记录
        await saveCallRecord("connect", callDuration);
      } else if (callSession.status === "calling") {
        // 如果是呼叫状态下挂断，保存取消记录
        await saveCallRecord("cancel");
      }
    }

    // 结束本地通话
    setCallSession({
      isActive: false,
      status: "ended",
      caller: callSession.caller,
      callerName: callSession.callerName,
    });
  };

  // 格式化通话时间
  const formatCallDuration = (startTime: number) => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    // 始终显示为分:秒格式
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // 获取通话状态文本
  const getCallStatusText = () => {
    switch (callSession.status) {
      case "calling":
        return "正在呼叫...";
      case "connected":
        return callSession.startTime
          ? formatCallDuration(callSession.startTime)
          : "通话中";
      case "ended":
        return "通话已结束";
      default:
        return "";
    }
  };

  // 获取对话详情
  const fetchConversationDetail = async (silent: boolean = false) => {
    if (!id) return;

    try {
      if (!silent) setLoading(true);
      // 支持超时与取消，提供指数退避重试
      const controller = new AbortController();
      const maxAttempts = 3;
      let attempt = 0;
      let data: any;
      let lastErr: any;
      while (attempt < maxAttempts) {
        try {
          data = await MessageService.getConversationDetail(id, {
            timeoutMs: 8000,
            signal: controller.signal,
          });
          break;
        } catch (e: any) {
          lastErr = e;
          attempt += 1;
          if (attempt >= maxAttempts) throw e;
          // 退避等待
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
      setConversation(data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("获取对话详情失败:", error);
      message.error("获取聊天记录失败，已自动重试");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim() || !id || !currentUser || !conversation) {
      return;
    }

    // 获取接收者列表（排除当前用户）
    const receivers = conversation.users
      .filter((user) => user.username !== currentUser.username)
      .map((user) => user.username);

    if (receivers.length === 0) {
      message.error("没有找到接收者");
      return;
    }

    const messageContent = inputMessage.trim();

    try {
      setSending(true);

      // 创建新消息对象并立即添加到本地状态
      const newMessage: ChatMessage = {
        id: `temp_${Date.now()}`,
        sender: currentUser.username,
        content: messageContent,
        sendTime: Date.now(),
        type: "text",
        receiver: receivers,
      };

      setMessages((prev) => [...prev, newMessage]);
      setInputMessage("");

      // 通过WebSocket发送实时消息（如果连接可用）
      if (isWebSocketConnected) {
        WebSocketService.sendChatMessage(id, messageContent, receivers);
      }

      // 发送HTTP请求保存到数据库
      await MessageService.sendMessage({
        conversationId: id,
        sender: currentUser.username,
        content: messageContent,
        type: "text",
        receiver: receivers,
      });

      // 停止打字状态
      if (isWebSocketConnected) {
        WebSocketService.sendTypingStatus(id, false);
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      message.error("发送消息失败");

      // 如果发送失败，移除临时消息
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== `temp_${Date.now()}`)
      );
    } finally {
      setSending(false);
    }
  };

  // 发送语音消息
  const sendVoiceMessage = async (audioDataUrl: string) => {
    if (!id || !currentUser || !conversation) return;

    const receivers = conversation.users
      .filter((user) => user.username !== currentUser.username)
      .map((user) => user.username);

    if (receivers.length === 0) return;

    // 立即在本地显示
    const localMsg: ChatMessage = {
      id: `temp_voice_${Date.now()}`,
      sender: currentUser.username,
      content: audioDataUrl,
      sendTime: Date.now(),
      type: "voice",
      receiver: receivers,
    };
    setMessages((prev) => [...prev, localMsg]);

    try {
      if (isWebSocketConnected) {
        WebSocketService.sendChatMessage(id, audioDataUrl, receivers, "voice");
      }
      await MessageService.sendMessage({
        conversationId: id,
        sender: currentUser.username,
        content: audioDataUrl,
        type: "voice",
        receiver: receivers,
      });
    } catch (e) {
      console.error("发送语音失败", e);
      message.error("发送语音失败");
    }
  };

  // 录音控制
  const startRecording = async () => {
    try {
      recorderRef.current = new MicRecorder();
      await recorderRef.current.start();
      recordStartTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (e) {
      console.error("无法开始录音", e);
      message.error("无法访问麦克风");
      setIsRecording(false);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recorderRef.current) return;
    try {
      const minDurationMs = 400;
      const start = recordStartTimeRef.current || Date.now();
      const duration = Date.now() - start;
      const blob = await recorderRef.current.stop();
      setIsRecording(false);
      recorderRef.current = null;
      recordStartTimeRef.current = null;
      if (duration < minDurationMs) {
        message.info("说话时间太短");
        return;
      }
      const dataUrl = await blobToBase64(blob);
      await sendVoiceMessage(dataUrl);
    } catch (e) {
      console.error("停止录音失败", e);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    try {
      if (recorderRef.current) {
        // 停止但不发送
        recorderRef.current.stop().catch(() => { });
      }
    } finally {
      setIsRecording(false);
      recorderRef.current = null;
      recordStartTimeRef.current = null;
    }
  };

  const handleVoicePressStart = () => {
    if (!isVoiceMode) return;
    void startRecording();
  };

  const handleVoicePressEnd = () => {
    if (!isVoiceMode) return;
    void stopRecordingAndSend();
  };

  const handleVoicePressCancel = () => {
    if (!isVoiceMode) return;
    cancelRecording();
  };

  // 相册/拍照发送图片
  const sendImageFile = async (file: File) => {
    if (!id || !currentUser || !conversation) return;
    const receivers = conversation.users
      .filter((user) => user.username !== currentUser.username)
      .map((user) => user.username);
    if (receivers.length === 0) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // 本地显示
    const localMsg: ChatMessage = {
      id: `temp_img_${Date.now()}`,
      sender: currentUser.username,
      content: dataUrl,
      sendTime: Date.now(),
      type: "image",
      receiver: receivers,
    };
    setMessages((prev) => [...prev, localMsg]);

    try {
      if (isWebSocketConnected) {
        WebSocketService.sendChatMessage(id, dataUrl, receivers, "image");
      }
      await MessageService.sendMessage({
        conversationId: id,
        sender: currentUser.username,
        content: dataUrl,
        type: "image",
        receiver: receivers,
      });
    } catch (e) {
      console.error("发送图片失败", e);
      message.error("发送图片失败");
    }
  };

  // 发送 base64 图片
  const sendImageDataUrl = async (dataUrl: string) => {
    if (!id || !currentUser || !conversation) return;
    const receivers = conversation.users
      .filter((user) => user.username !== currentUser.username)
      .map((user) => user.username);
    if (receivers.length === 0) return;

    const localMsg: ChatMessage = {
      id: `temp_img_${Date.now()}`,
      sender: currentUser.username,
      content: dataUrl,
      sendTime: Date.now(),
      type: "image",
      receiver: receivers,
    };
    setMessages((prev) => [...prev, localMsg]);

    try {
      if (isWebSocketConnected) {
        WebSocketService.sendChatMessage(id, dataUrl, receivers, "image");
      }
      await MessageService.sendMessage({
        conversationId: id,
        sender: currentUser.username,
        content: dataUrl,
        type: "image",
        receiver: receivers,
      });
    } catch (e) {
      console.error("发送图片失败", e);
      message.error("发送图片失败");
    }
  };

  const handleChooseAlbum = () => {
    albumInputRef.current?.click();
    setShowActions(false);
  };

  // 打开内置相机覆盖层
  const openCameraOverlay = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setIsCameraVisible(true);
      setCameraMode("live");
      setCapturedDataUrl(null);
      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(() => { });
        }
      }, 0);
    } catch (e) {
      message.error("无法打开摄像头，请检查权限");
    }
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
  };

  const closeCameraOverlay = () => {
    stopCameraStream();
    setIsCameraVisible(false);
    setCapturedDataUrl(null);
    setCameraMode("live");
  };

  const capturePhoto = () => {
    const video = cameraVideoRef.current;
    if (!video) return;
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    if (!width || !height) {
      message.warning("相机未就绪");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(dataUrl);
    setCameraMode("preview");
    stopCameraStream();
  };

  const retakePhoto = async () => {
    setCapturedDataUrl(null);
    setCameraMode("live");
    await openCameraOverlay();
  };

  const handleTakePhoto = () => {
    void openCameraOverlay();
    setShowActions(false);
  };

  // 发送位置
  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      message.error("该设备不支持定位");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const content = `geo:${latitude},${longitude}`;
        if (!id || !currentUser || !conversation) return;
        const receivers = conversation.users
          .filter((user) => user.username !== currentUser.username)
          .map((user) => user.username);
        if (receivers.length === 0) return;

        // 本地显示
        const localMsg: ChatMessage = {
          id: `temp_loc_${Date.now()}`,
          sender: currentUser.username,
          content,
          sendTime: Date.now(),
          type: "location",
          receiver: receivers,
        };
        setMessages((prev) => [...prev, localMsg]);

        try {
          if (isWebSocketConnected) {
            WebSocketService.sendChatMessage(
              id,
              content,
              receivers,
              "location"
            );
          }
          await MessageService.sendMessage({
            conversationId: id,
            sender: currentUser.username,
            content,
            type: "location",
            receiver: receivers,
          });
        } catch (e) {
          console.error("发送位置失败", e);
          message.error("发送位置失败");
        }
      },
      () => message.error("获取位置失败"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    setShowActions(false);
  };

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // 发送打字状态
    if (isWebSocketConnected && id) {
      if (value.trim()) {
        // 开始打字
        WebSocketService.sendTypingStatus(id, true);

        // 清除之前的定时器
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // 设置新的定时器，2秒后停止打字状态
        typingTimeoutRef.current = setTimeout(() => {
          WebSocketService.sendTypingStatus(id!, false);
        }, 2000);
      } else {
        // 输入为空时停止打字状态
        WebSocketService.sendTypingStatus(id, false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
  };

  // 获取打字状态显示文本
  const getTypingText = () => {
    if (typingUsers.size === 0) return null;

    const userNames = Array.from(typingUsers).map((username) =>
      getUserDisplayName(username)
    );

    if (userNames.length === 1) {
      return `${userNames[0]} 正在输入...`;
    } else if (userNames.length === 2) {
      return `${userNames.join(" 和 ")} 正在输入...`;
    } else {
      return `${userNames.slice(0, 2).join(", ")} 等 ${userNames.length} 人正在输入...`;
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (messageDate.getTime() === today.getTime()) {
      // 今天的消息只显示时间
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      // 其他日期显示日期和时间
      return date.toLocaleString("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // 获取用户显示名称
  const getUserDisplayName = (username: string) => {
    const user = conversation?.users.find((u) => u.username === username);
    return user?.realname || username;
  };

  // 获取用户角色标签
  const getRoleLabel = (username: string) => {
    const user = conversation?.users.find((u) => u.username === username);
    const roleLabels: { [key: string]: string } = {
      elderly: "老人",
      family: "家属",
      nurse: "护工",
      admin: "管理员",
    };
    return roleLabels[user?.role || ""] || user?.role || "";
  };

  // 根据用户角色获取头像
  const getUserAvatar = (username: string) => {
    const user = conversation?.users.find((u) => u.username === username);
    const roleAvatars: { [key: string]: string } = {
      elderly: "/imgs/elderly.png",
      family: "/imgs/family.png",
      nurse: "/imgs/nurse.png",
    };
    return roleAvatars[user?.role || ""] || null;
  };

  // 处理语音通话
  const handleVoiceCall = async () => {
    if (callSession.isActive) {
      // 如果已经在通话中，则结束通话
      endCall();
      return;
    }

    if (!conversation || !currentUser || !isWebSocketConnected || !id) {
      message.error("无法发起通话，请检查网络连接");
      return;
    }

    // 拨打前请求麦克风权限
    try {
      await getAudioStream();
    } catch (e) {
      message.error("未获得麦克风权限，无法发起通话");
      return;
    }

    const receivers = conversation.users
      .filter((user) => user.username !== currentUser.username)
      .map((user) => user.username);

    const targetUser = conversation.users.find(
      (user) => user.username !== currentUser.username
    );

    if (receivers.length === 0 || !targetUser) {
      message.error("没有找到通话对象");
      return;
    }

    // 发送语音通话邀请
    WebSocketService.sendCallInvite(id, "voice", receivers);

    // 立即显示电话页面
    setCallSession({
      isActive: true,
      callType: "voice",
      status: "calling",
      targetUser: targetUser.username,
      targetUserName: targetUser.realname || targetUser.username,
      caller: currentUser.username, // 设置通话发起者
      callerName: (currentUser as any).realname || currentUser.username,
    });
  };

  // 处理视频通话
  const handleVideoCall = async () => {
    if (callSession.isActive) {
      // 如果已经在通话中，则结束通话
      endCall();
      return;
    }

    if (!conversation || !currentUser || !isWebSocketConnected || !id) {
      message.error("无法发起通话，请检查网络连接");
      return;
    }

    const receivers = conversation.users
      .filter((user) => user.username !== currentUser.username)
      .map((user) => user.username);

    const targetUser = conversation.users.find(
      (user) => user.username !== currentUser.username
    );

    if (receivers.length === 0 || !targetUser) {
      message.error("没有找到通话对象");
      return;
    }

    // 视频拨打前先申请摄像头与麦克风权限并本地预览
    try {
      const stream = await getVideoStream();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => { });
      }
    } catch (e) {
      message.error("未获得摄像头或麦克风权限，无法发起视频通话");
      return;
    }

    // 发送视频通话邀请
    WebSocketService.sendCallInvite(id, "video", receivers);

    // 立即显示电话页面
    setCallSession({
      isActive: true,
      callType: "video",
      status: "calling",
      targetUser: targetUser.username,
      targetUserName: targetUser.realname || targetUser.username,
      caller: currentUser.username, // 设置通话发起者
      callerName: (currentUser as any).realname || currentUser.username,
    });
  };

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      await fetchConversationDetail();
      if (!canceled) scrollToBottom();
    };
    run();
    return () => {
      canceled = true;
    };
  }, [id]);

  useEffect(() => {
    const t = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(t);
  }, [messages]);

  // 当视频通话界面已渲染且本地流已获取时，绑定本地预览到 video 元素
  useEffect(() => {
    if (
      callSession.isActive &&
      callSession.callType === "video" &&
      localStreamRef.current &&
      localVideoRef.current
    ) {
      try {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.muted = true;
        void localVideoRef.current.play();
      } catch (e) {
        console.warn("本地视频预览绑定失败:", e);
      }
    }
  }, [callSession.isActive, callSession.callType]);

  // 实时更新通话时间
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (
      callSession.isActive &&
      callSession.status === "connected" &&
      callSession.startTime
    ) {
      interval = setInterval(() => {
        // 强制重新渲染以更新时间显示
        setCallSession((prev) => ({ ...prev }));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [callSession.isActive, callSession.status, callSession.startTime]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          color: "#999",
        }}
      >
        对话不存在或已被删除
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 来电邀请弹窗 */}
      {callInvite.isVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "30px",
              borderRadius: "15px",
              textAlign: "center",
              minWidth: "300px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Avatar
              size={80}
              style={{ marginBottom: "20px" }}
              src={getUserAvatar(callInvite.caller!)}
              icon={<UserOutlined />}
            />
            <h3 style={{ margin: "10px 0", color: "#333" }}>
              {callInvite.callerName}
            </h3>
            <p
              style={{ color: "#666", marginBottom: "30px", fontSize: "16px" }}
            >
              {callInvite.callType === "video"
                ? "视频通话邀请"
                : "语音通话邀请"}
            </p>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                style={{
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                  borderRadius: "50%",
                  width: "60px",
                  height: "60px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                icon={<PhoneOutlined />}
                onClick={acceptCall}
                title="接听"
              />
              <Button
                danger
                size="large"
                style={{
                  borderRadius: "50%",
                  width: "60px",
                  height: "60px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                icon={<PhoneOutlined style={{ transform: "rotate(135deg)" }} />}
                onClick={rejectCall}
                title="拒绝"
              />
            </Space>
          </div>
        </div>
      )}

      {/* 电话页面 */}
      {callSession.isActive && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#000",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9998,
          }}
        >
          {callSession.callType === "video" ? (
            // 视频通话界面
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                color: "#fff",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {/* 远端视频 */}
                <video
                  ref={remoteVideoRef}
                  style={{
                    width: "90%",
                    maxWidth: 640,
                    background: "#000",
                    borderRadius: 8,
                  }}
                  playsInline
                  autoPlay
                />
                {/* 本地视频预览 */}
                <video
                  ref={localVideoRef}
                  style={{
                    position: "absolute",
                    right: 16,
                    bottom: 120,
                    width: 120,
                    height: 160,
                    background: "#000",
                    borderRadius: 8,
                  }}
                  muted
                  playsInline
                  autoPlay
                />
                <h2 style={{ color: "#fff", margin: "10px 0" }}>
                  {callSession.targetUserName}
                </h2>
                <p
                  style={{
                    color: "#ccc",
                    fontSize: "18px",
                    marginBottom: "10px",
                  }}
                >
                  视频通话
                </p>
                <p style={{ color: "#999", fontSize: "16px" }}>
                  {getCallStatusText()}
                </p>
              </div>
            </div>
          ) : (
            // 语音通话界面
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                color: "#fff",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Avatar
                  size={150}
                  style={{ marginBottom: "30px" }}
                  src={getUserAvatar(callSession.targetUser!)}
                  icon={<UserOutlined />}
                />
                <h2
                  style={{ color: "#fff", margin: "10px 0", fontSize: "24px" }}
                >
                  {callSession.targetUserName}
                </h2>
                <p
                  style={{
                    color: "#ccc",
                    fontSize: "18px",
                    marginBottom: "10px",
                  }}
                >
                  语音通话
                </p>
                <p style={{ color: "#999", fontSize: "16px" }}>
                  {getCallStatusText()}
                </p>
              </div>
            </div>
          )}

          {/* 通话控制按钮 */}
          <div
            style={{
              padding: "30px",
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              paddingBottom: "50px",
            }}
          >
            <Button
              danger
              size="large"
              style={{
                borderRadius: "50%",
                width: "70px",
                height: "70px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                fontSize: "24px",
              }}
              icon={<PhoneOutlined style={{ transform: "rotate(135deg)" }} />}
              onClick={endCall}
              title="挂断"
            />
          </div>

          {/* 隐藏的音频元素用于播放远程音频 */}
          <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />
        </div>
      )}

      {/* 聊天头部 */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Space>
          <Avatar
            src={
              conversation.users
                .filter((user) => user.username !== currentUser?.username)
                .map((user) => getUserAvatar(user.username))[0] || undefined
            }
            icon={<UserOutlined />}
          />
          <div>
            <Text strong>
              {conversation.users
                .filter((user) => user.username !== currentUser?.username)
                .map((user) => user.realname || user.username)
                .join(", ")}
            </Text>
            <Text type="secondary" style={{ marginLeft: 8, fontSize: "12px" }}>
              {conversation.users
                .filter((user) => user.username !== currentUser?.username)
                .map((user) => getRoleLabel(user.username))
                .join(", ")}
            </Text>
          </div>
        </Space>

        {/* 通话功能按钮 */}
        <Space>
          <Button
            type="text"
            icon={
              callSession.isActive && callSession.callType === "voice" ? (
                <PhoneOutlined style={{ transform: "rotate(135deg)" }} />
              ) : (
                <PhoneOutlined />
              )
            }
            onClick={handleVoiceCall}
            style={{
              color:
                callSession.isActive && callSession.callType === "voice"
                  ? "#ff4d4f"
                  : "#52c41a",
              border: `1px solid ${callSession.isActive && callSession.callType === "voice"
                  ? "#ff4d4f"
                  : "#52c41a"
                }`,
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={
              callSession.isActive && callSession.callType === "voice"
                ? "挂断语音通话"
                : "语音通话"
            }
          />
          <Button
            type="text"
            icon={
              callSession.isActive && callSession.callType === "video" ? (
                <PhoneOutlined style={{ transform: "rotate(135deg)" }} />
              ) : (
                <VideoCameraOutlined />
              )
            }
            onClick={handleVideoCall}
            style={{
              color:
                callSession.isActive && callSession.callType === "video"
                  ? "#ff4d4f"
                  : "#1890ff",
              border: `1px solid ${callSession.isActive && callSession.callType === "video"
                  ? "#ff4d4f"
                  : "#1890ff"
                }`,
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={
              callSession.isActive && callSession.callType === "video"
                ? "挂断视频通话"
                : "视频通话"
            }
          />
        </Space>
      </div>

      {/* 消息列表 */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px",
          backgroundColor: "#f5f5f5",
        }}
      >
        <List
          dataSource={messages}
          split={false}
          renderItem={(item) => {
            const isCurrentUser = item.sender === currentUser?.username;

            return (
              <List.Item
                style={{
                  padding: "8px 0",
                  border: "none",
                  justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: item.type === "image" ? "50%" : "70%",
                    display: "flex",
                    flexDirection: isCurrentUser ? "row-reverse" : "row",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <Avatar
                    size={40}
                    src={getUserAvatar(item.sender)}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: getUserAvatar(item.sender)
                        ? undefined
                        : isCurrentUser
                          ? "#1890ff"
                          : "#52c41a",
                      flexShrink: 0,
                      marginTop: "28px",
                      border: "1px solid #ccc",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        marginBottom: "4px",
                        textAlign: isCurrentUser ? "right" : "left",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: "12px",
                          color: "#999",
                        }}
                      >
                        {getUserDisplayName(item.sender)} ·{" "}
                        {formatTime(item.sendTime)}
                      </Text>
                    </div>
                    <div
                      style={{
                        padding: item.type === "image" ? 0 : "12px 16px",
                        borderRadius: 12,
                        backgroundColor:
                          item.type === "image"
                            ? "transparent"
                            : isCurrentUser
                              ? "#1890ff"
                              : "#fff",
                        color:
                          item.type === "image" || item.type === "voice"
                            ? "#000"
                            : isCurrentUser
                              ? "#fff"
                              : "#000",
                        wordBreak: "break-word",
                        boxShadow:
                          item.type === "image"
                            ? "none"
                            : "0 1px 3px rgba(0,0,0,0.1)",
                        maxWidth: item.type === "image" ? "100%" : 360,
                        width: item.type === "image" ? "100%" : undefined,
                        overflow: item.type === "image" ? "hidden" : undefined,
                      }}
                    >
                      {item.type === "image" ? (
                        <img
                          src={item.content}
                          alt="图片"
                          style={{
                            display: "block",
                            width: "100%",
                            height: "auto",
                            borderRadius: 0,
                            cursor: "zoom-in",
                          }}
                          onClick={() => openImagePreview(item.content)}
                        />
                      ) : item.type === "voice" ? (
                        <VoicePlayer
                          src={item.content}
                          isCurrentUser={isCurrentUser}
                        />
                      ) : item.type === "voice_call" ||
                        item.type === "video_call" ? (
                        <span>
                          {item.content}
                          {typeof (item as any).time === "number"
                            ? `（${Math.floor((item as any).time / 60)}:${(
                              (item as any).time % 60
                            )
                              .toString()
                              .padStart(2, "0")}）`
                            : ""}
                        </span>
                      ) : item.type === "location" ? (
                        <a
                          href={`https://maps.google.com/?q=${item.content.replace(
                            /^geo:/,
                            ""
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: isCurrentUser ? "#fff" : "#1890ff" }}
                        >
                          发送了一个位置
                        </a>
                      ) : (
                        item.content
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />

        {/* 打字状态显示 */}
        {getTypingText() && (
          <div
            style={{
              padding: "8px 16px",
              color: "#999",
              fontSize: "12px",
              fontStyle: "italic",
              borderTop: "1px solid #f0f0f0",
              backgroundColor: "#fafafa",
            }}
          >
            {getTypingText()}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 消息输入区域 */}
      <div
        style={{
          padding: "10px 12px",
          backgroundColor: "#fff",
          borderTop: "1px solid #f0f0f0",
          flexShrink: 0,
          boxShadow: "0 -1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* 语音切换按钮 */}
          <Button
            type={isVoiceMode ? "primary" : "default"}
            icon={<AudioOutlined />}
            onClick={() => setIsVoiceMode((v) => !v)}
            title={isVoiceMode ? "切换文字输入" : "切换语音发送"}
            style={{
              flexShrink: 0,
              height: 32,
              width: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          />

          {/* 中间区域：文本/按住说话 */}
          <div style={{ flex: 1, display: "flex" }}>
            {!isVoiceMode ? (
              <TextArea
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="输入消息"
                autoSize={false}
                style={{
                  height: 32,
                  lineHeight: "22px",
                  resize: "none",
                  padding: "4px 8px",
                }}
                disabled={sending}
              />
            ) : (
              <Button
                block
                style={{
                  height: 32,
                  background: isRecording ? "#ffccc7" : "#fafafa",
                  borderColor: isRecording ? "#ff4d4f" : "#d9d9d9",
                  color: isRecording ? "#a8071a" : "#595959",
                }}
                onMouseDown={handleVoicePressStart}
                onMouseUp={handleVoicePressEnd}
                onMouseLeave={handleVoicePressCancel}
                onTouchStart={handleVoicePressStart}
                onTouchEnd={handleVoicePressEnd}
                onTouchCancel={handleVoicePressCancel}
              >
                {isRecording ? "松开发送" : "按住 说话"}
              </Button>
            )}
          </div>

          {/* 表情 */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <Button
                icon={<SmileOutlined />}
                onClick={() => setShowEmoji((s) => !s)}
                title="表情"
                style={{
                  height: 32,
                  width: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              />
              {showEmoji && (
                <div
                  ref={emojiPickerRef}
                  style={{
                    maxWidth: 260,
                    position: "absolute",
                    bottom: 40,
                    right: 0,
                    zIndex: 20,
                  }}
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      // emojiData.emoji 为选中的字符
                      // 兼容类型定义差异
                      const emoji =
                        (emojiData as any).emoji || (emojiData as any).native;
                      if (emoji) setInputMessage((v) => v + emoji);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* + 号操作面板 */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setShowActions((s) => !s)}
              title="更多"
              style={{
                height: 32,
                width: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            />
            {showActions && (
              <div
                ref={actionsRef}
                style={{
                  position: "fixed",
                  left: 0,
                  right: 0,
                  bottom: 53,
                  margin: "0 auto",
                  background: "#fff",
                  borderTop: "1px solid #f0f0f0",
                  borderRadius: "12px 12px 0 0",
                  boxShadow: "0 -4px 16px rgba(0,0,0,0.15)",
                  padding: 12,
                  zIndex: 9999,
                  width: "90%",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                  }}
                >
                  <Button
                    icon={<PictureOutlined />}
                    onClick={handleChooseAlbum}
                  >
                    相册
                  </Button>
                  <Button icon={<CameraOutlined />} onClick={handleTakePhoto}>
                    拍照
                  </Button>
                  <Button
                    icon={<EnvironmentOutlined />}
                    onClick={handleSendLocation}
                  >
                    位置
                  </Button>
                  <Button
                    icon={<PhoneOutlined />}
                    onClick={() => {
                      handleVoiceCall();
                      setShowActions(false);
                    }}
                  >
                    语音通话
                  </Button>
                  <Button
                    icon={<VideoCameraOutlined />}
                    onClick={() => {
                      handleVideoCall();
                      setShowActions(false);
                    }}
                  >
                    视频通话
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 发送按钮 */}
          {!isVoiceMode && (
            <Button
              type="primary"
              onClick={sendMessage}
              loading={sending}
              disabled={!inputMessage.trim()}
              style={{
                height: 32,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
              }}
            >
              发送
            </Button>
          )}
        </div>

        {/* 隐藏文件输入 */}
        <input
          ref={albumInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void sendImageFile(file);
            e.currentTarget.value = ""; // 允许重复选择相同文件
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void sendImageFile(file);
            e.currentTarget.value = "";
          }}
        />
      </div>
      {/* 内置相机覆盖层 */}
      {isCameraVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            {cameraMode === "live" ? (
              <video
                ref={cameraVideoRef as any}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                playsInline
                autoPlay
                muted
              />
            ) : (
              capturedDataUrl && (
                <img
                  src={capturedDataUrl}
                  alt="预览"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#000",
                  }}
                />
              )
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              background: "rgba(0,0,0,0.6)",
            }}
          >
            <Button onClick={closeCameraOverlay}>退出</Button>
            {cameraMode === "live" ? (
              <Button type="primary" onClick={capturePhoto}>
                拍照
              </Button>
            ) : (
              <div style={{ display: "flex", gap: 12 }}>
                <Button onClick={retakePhoto}>重拍</Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    if (capturedDataUrl)
                      await sendImageDataUrl(capturedDataUrl);
                    closeCameraOverlay();
                  }}
                >
                  发送
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 全屏图片预览 */}
      {imagePreview.visible && imageUrls.length > 0 && (
        <div
          onClick={() => setImagePreview({ visible: false, index: 0 })}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: "none",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "90%",
              height: "90%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={imageUrls[imagePreview.index]}
              alt="预览"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                display: "block",
                objectFit: "contain",
              }}
              onClick={() => setImagePreview({ visible: false, index: 0 })}
            />
            {/* 左右切换 */}
            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setImagePreview((p) => ({
                      visible: true,
                      index:
                        (p.index - 1 + imageUrls.length) % imageUrls.length,
                    }))
                  }
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "#fff",
                    fontSize: 24,
                    cursor: "pointer",
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setImagePreview((p) => ({
                      visible: true,
                      index: (p.index + 1) % imageUrls.length,
                    }))
                  }
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "#fff",
                    fontSize: 24,
                    cursor: "pointer",
                  }}
                >
                  ›
                </button>
              </>
            )}
            {/* 关闭 */}
            <button
              onClick={() => setImagePreview({ visible: false, index: 0 })}
              style={{
                position: "absolute",
                right: 8,
                top: 8,
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "rgba(0,0,0,0.6)",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
