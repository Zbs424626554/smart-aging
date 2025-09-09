import React, { useEffect, useMemo, useRef, useState } from "react";
import { Empty, Space } from "antd-mobile";
import { HeartOutline, HeartFill, MessageOutline, ClockCircleOutline, LeftOutline, RightOutline, CloseOutline } from "antd-mobile-icons";
import { Dialog, Toast, Button, TextArea, DotLoading, PullToRefresh } from "antd-mobile";
import { http } from "../utils/request";
import { AuthService } from "../services/auth.service";
import NavBal from "../components/NavBal";
import { MessageService } from "../services/message.service";
import { UserService } from "../services/user.service";
import { useNavigate } from "react-router-dom";

type CommentItem = {
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  replyTo?: {
    userId: string;
    username: string;
  };
};

type PostItem = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  images: string[];
  publishedAt: string;
  likes: string[];
  comments: CommentItem[];
};

const STORAGE_KEY = "community_posts";

const Community: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as PostItem[]) : [];
      setPosts(
        parsed
          .map((p) => ({
            ...p,
            images: Array.isArray(p.images) ? p.images : [],
            likes: Array.isArray(p.likes) ? p.likes : [],
            comments: Array.isArray(p.comments) ? p.comments : [],
          }))
          .sort(
            (a, b) =>
              new Date(b.publishedAt).getTime() -
              new Date(a.publishedAt).getTime()
          )
      );
    } catch {
      setPosts([]);
    }

    // 从后端拉取最新帖子列表并进行字段映射
    void fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const resp = await http.get<any[]>("/community/post");
      const list = Array.isArray(resp.data) ? resp.data : [];
      const mapped = list
        .map((item: any): PostItem => ({
          id: String(item._id || item.id || ""),
          authorId: String(item.authorId || ""),
          authorName: String(item.authorName || item.author || "匿名"),
          content: String(item.content || ""),
          images: Array.isArray(item.images) ? item.images.map((x: any) => String(x || "")).filter(Boolean) : [],
          publishedAt: item.publishedAt || item.createdAt || new Date().toISOString(),
          likes: Array.isArray(item.likes)
            ? item.likes
              .map((lk: any) => {
                const id = lk && typeof lk === "object" ? lk.userId || lk._id || lk : lk;
                return String(id || "");
              })
              .filter(Boolean)
            : [],
          comments: Array.isArray(item.comments)
            ? item.comments.map((c: any) => ({
              userId: String(c?.userId || ""),
              username: String(c?.username || "匿名"),
              content: String(c?.content || ""),
              createdAt: c?.createdAt || new Date().toISOString(),
              replyTo: c?.replyTo
                ? {
                  userId: String(c.replyTo.userId || ""),
                  username: String(c.replyTo.username || ""),
                }
                : undefined,
            }))
            : [],
        }))
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      setPosts(mapped);
    } catch {
      // 后端不可用时，保留本地缓存渲染
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchPosts();
    Toast.show({ content: "已刷新" });
  };

  // posts 改变时同步到本地缓存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch { }
  }, [posts]);

  const hasNoPosts = useMemo(() => posts.length === 0, [posts]);

  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
  const formatPostTime = (input: string) => {
    try {
      const date = new Date(input);
      if (Number.isNaN(date.getTime())) return "";
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffMs = startOfToday.getTime() - startOfTarget.getTime();
      const diffDays = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
      const hhmm = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
      if (diffDays === 0) return `今天 ${hhmm}`;
      if (diffDays === 1) return `昨天 ${hhmm}`;
      if (diffDays === 2) return `前天 ${hhmm}`;
      return `${diffDays}天前 ${hhmm}`;
    } catch {
      return "";
    }
  };

  // 预览状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewRotate, setPreviewRotate] = useState(0);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewTranslate, setPreviewTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<boolean>(false);
  const [replyTarget, setReplyTarget] = useState<{ postId: string; userId: string; username: string } | null>(null);

  const imgContainerRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const lastTapTimeRef = useRef(0);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);

  const openPreview = (images: string[], index: number) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setPreviewRotate(0);
    setPreviewScale(1);
    setPreviewTranslate({ x: 0, y: 0 });
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
    setPreviewVisible(true);
  };
  const closePreview = () => setPreviewVisible(false);
  const showPrev = () => {
    setPreviewIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length);
    setPreviewRotate(0);
    setPreviewScale(1);
    setPreviewTranslate({ x: 0, y: 0 });
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
  };
  const showNext = () => {
    setPreviewIndex((prev) => (prev + 1) % previewImages.length);
    setPreviewRotate(0);
    setPreviewScale(1);
    setPreviewTranslate({ x: 0, y: 0 });
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
  };
  const rotateRight = () => setPreviewRotate((r) => (r + 90) % 360);
  const rotateLeft = () => setPreviewRotate((r) => (r + 270) % 360);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  // 鼠标滚轮缩放
  const handleWheel = (e: any) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const next = clamp(scaleRef.current + delta, 1, 4);
    scaleRef.current = next;
    setPreviewScale(next);
  };

  // 鼠标拖拽平移
  const handleMouseDown = (e: any) => {
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX - translateRef.current.x, y: e.clientY - translateRef.current.y };
  };
  const handleMouseMove = (e: any) => {
    if (!isPanningRef.current) return;
    translateRef.current = { x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y };
    setPreviewTranslate({ ...translateRef.current });
  };
  const handleMouseUp = () => {
    isPanningRef.current = false;
  };

  // 触控：单指平移、双指缩放
  const getDistance = (t1: Touch, t2: Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  const handleTouchStart = (e: any) => {
    if (e.touches.length === 2) {
      pinchStartDistRef.current = getDistance(e.touches[0], e.touches[1]);
      pinchStartScaleRef.current = scaleRef.current;
    } else if (e.touches.length === 1) {
      isPanningRef.current = true;
      const t = e.touches[0];
      panStartRef.current = { x: t.clientX - translateRef.current.x, y: t.clientY - translateRef.current.y };
    }
  };
  const handleTouchMove = (e: any) => {
    if (e.touches.length === 2 && pinchStartDistRef.current) {
      const dist = getDistance(e.touches[0], e.touches[1]);
      const ratio = dist / pinchStartDistRef.current;
      const next = clamp(pinchStartScaleRef.current * ratio, 1, 4);
      scaleRef.current = next;
      setPreviewScale(next);
    } else if (e.touches.length === 1 && isPanningRef.current) {
      const t = e.touches[0];
      translateRef.current = { x: t.clientX - panStartRef.current.x, y: t.clientY - panStartRef.current.y };
      setPreviewTranslate({ ...translateRef.current });
    }
  };
  const handleTouchEnd = (e: any) => {
    if (e.touches.length === 0) {
      isPanningRef.current = false;
      pinchStartDistRef.current = null;

      // 双击/双指快速点按：300ms 内二次点击放大/还原
      const now = Date.now();
      if (now - lastTapTimeRef.current < 100) {
        const toggled = scaleRef.current > 1 ? 1 : 2;
        scaleRef.current = toggled;
        setPreviewScale(toggled);
        if (toggled === 1) {
          translateRef.current = { x: 0, y: 0 };
          setPreviewTranslate({ x: 0, y: 0 });
        }
      }
      lastTapTimeRef.current = now;
    }
  };

  const renderImages = (images: string[]) => {
    if (!images || images.length === 0) return null;
    const gridTemplateColumns =
      images.length === 1 ? "1fr" : images.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr";
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns,
          gap: 6,
          marginTop: 8,
        }}
      >
        {images.map((src, idx) => (
          <div
            key={idx}
            style={{
              width: "100%",
              position: "relative",
              overflow: "hidden",
              borderRadius: 8,
              background: "#f5f5f5",
              cursor: "pointer",
            }}
            onClick={() => openPreview(images, idx)}
          >
            <img
              src={src}
              alt="post"
              style={{
                width: "100%",
                height: images.length === 1 ? "auto" : 100,
                objectFit: images.length === 1 ? "contain" : "cover",
                display: "block",
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  const currentUser = AuthService.getCurrentUser();
  const currentUserId = String((currentUser as any)?.id || (currentUser as any)?._id || "");

  // 将 likes 归一化为用户ID字符串数组（兼容对象/字符串）
  const getLikeUserIds = (likes: any): string[] => {
    const arr = Array.isArray(likes) ? likes : [];
    return arr
      .map((lk: any) => {
        if (lk && typeof lk === "object") {
          return String(lk.userId || lk._id || "");
        }
        return String(lk || "");
      })
      .filter(Boolean);
  };

  const isLikedByMe = (post: PostItem) => {
    if (!currentUserId) return false;
    return getLikeUserIds(post.likes).some((uid) => uid === currentUserId);
  };

  const toggleCommentBox = (postId: string) => {
    setCommentingPostId((prev) => (prev === postId ? null : postId));
  };

  const handleChangeComment = (postId: string, text: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: text }));
  };

  const handleSendComment = async (post: PostItem) => {
    try {
      if (!currentUser) {
        Toast.show({ content: "请先登录" });
        return;
      }
      const text = (commentDrafts[post.id] || "").trim();
      if (!text) {
        Toast.show({ content: "评论内容不能为空" });
        return;
      }
      setSendingComment(true);
      const payload: any = { content: text };
      if (replyTarget && replyTarget.postId === post.id) {
        payload.replyTo = { userId: replyTarget.userId, username: replyTarget.username };
      }
      const resp = await http.post(`/community/post/${post.id}/comment`, payload);
      const updated = (resp as any)?.data || {};
      const mappedComments = Array.isArray(updated.comments)
        ? updated.comments.map((c: any) => ({
          userId: String(c?.userId || ""),
          username: String(c?.username || "匿名"),
          content: String(c?.content || ""),
          createdAt: c?.createdAt || new Date().toISOString(),
          replyTo: c?.replyTo
            ? {
              userId: String(c.replyTo.userId || ""),
              username: String(c.replyTo.username || ""),
            }
            : undefined,
        }))
        : [];
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, comments: mappedComments } : p)));
      setCommentDrafts((prev) => ({ ...prev, [post.id]: "" }));
      setCommentingPostId(null);
      setReplyTarget(null);
    } catch (err: any) {
      Toast.show({ content: err?.message || "评论失败" });
    } finally {
      setSendingComment(false);
    }
  };

  const handleToggleLike = async (post: PostItem) => {
    try {
      if (!currentUser) {
        Toast.show({ content: "请先登录" });
        return;
      }
      const liked = isLikedByMe(post);
      if (!liked) {
        // 先乐观更新
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, likes: [...(p.likes || []), String(currentUserId)] } : p
          )
        );
        try {
          await http.post(`/community/post/${post.id}/like`, {
            username: (currentUser as any)?.realname || (currentUser as any)?.username,
          });
        } catch (e) {
          // 回滚
          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id ? { ...p, likes: (p.likes || []).filter((x) => String(x) !== String(currentUserId)) } : p
            )
          );
          throw e;
        }
      } else {
        // 已点赞，弹出确认
        const result = await Dialog.confirm({ content: "取消点赞该动态？" });
        if (!result) return;
        // 乐观更新
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, likes: (p.likes || []).filter((x) => String(x) !== String(currentUserId)) } : p
          )
        );
        try {
          await http.post(`/community/post/${post.id}/unlike`);
        } catch (e) {
          // 回滚
          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id ? { ...p, likes: [...(p.likes || []), String(currentUserId)] } : p
            )
          );
          throw e;
        }
      }
      // 本地同步由 useEffect([posts]) 统一处理
    } catch (err: any) {
      Toast.show({ content: err?.message || "操作失败" });
    }
  };

  // 手机号脱敏：显示前三后四位，中间四位使用 ****
  const maskPhone = (input?: string) => {
    try {
      const s = String(input || "").trim();
      if (!s) return "-";
      // 仅对11位数字进行脱敏处理
      if (/^\d{11}$/.test(s)) {
        return s.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
      }
      // 其它长度：尽量保持中间脱敏
      return s.replace(/(\d{3})(\d+)(\d{4})/, (_m, a, b, c) => `${a}${"*".repeat(Math.max(4, String(b).length))}${c}`);
    } catch {
      return String(input || "-");
    }
  };

  const handleShowAuthor = async (authorId: string) => {
    if (!authorId) {
      Toast.show({ content: "无法获取作者信息" });
      return;
    }
    const loading = Dialog.show({
      content: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
          <DotLoading color="primary" /> 加载中…
        </div>
      ),
      closeOnMaskClick: false,
    });
    try {
      const resp = await http.get<any>(`/users/elderly/${authorId}`);
      const elderly = (resp as any)?.data?.elderly || (resp as any)?.data?.user || (resp as any)?.data || null;
      loading.close?.();
      if (!elderly) {
        Dialog.show({ content: "未找到用户信息" });
        return;
      }
      const isSelf = (currentUser as any)?.id === elderly.id || (currentUser as any)?.username === elderly.username;
      let infoDialog: any;
      infoDialog = Dialog.show({
        title: <div style={{ fontSize: 22, fontWeight: 800 }}>用户资料</div>,
        content: (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 20 }}>
            <div>
              <span style={{ color: "#000", fontSize: 22, fontWeight: 600 }}>用户名：</span>
              <span style={{ color: "#333", fontWeight: 600, fontSize: 22 }}>{elderly.username || "-"}</span>
            </div>
            <div>
              <span style={{ color: "#000", fontSize: 22, fontWeight: 600 }}>昵　称：</span>
              <span style={{ color: "#333", fontSize: 22, fontWeight: 600 }}>{elderly.realname || elderly.username || "-"}</span>
            </div>
            <div>
              <span style={{ color: "#000", fontSize: 22, fontWeight: 600 }}>手机号：</span>
              <span style={{ color: "#333", fontSize: 22, fontWeight: 600 }}>{maskPhone(elderly.phone)}</span>
            </div>
            {!isSelf && (
              <div style={{ display: "flex", gap: 12, marginTop: 12, width: "95%", marginLeft: "auto", marginRight: "auto" }}>
                <Button size="large" style={{ flex: 1, fontSize: 23 }} color="primary" onClick={async () => {
                  try {
                    Toast.show({ icon: 'loading', content: '处理中...', duration: 800 });
                    const participants = [
                      {
                        username: (currentUser as any)?.username,
                        realname: (currentUser as any)?.realname || (currentUser as any)?.username,
                        role: (currentUser as any)?.role,
                      },
                      {
                        username: elderly.username,
                        realname: elderly.realname || elderly.username,
                        role: 'elderly',
                      },
                    ];
                    const res = await MessageService.createConversation({ participants });
                    if (res && res.conversationId) {
                      Toast.show({ icon: 'success', content: '已建立联系' });
                      infoDialog?.close?.();
                      navigate(`/chat/${res.conversationId}`);
                    } else if (res && res.isExisting && res.conversationId) {
                      infoDialog?.close?.();
                      navigate(`/chat/${res.conversationId}`);
                    }
                  } catch (err: any) {
                    Toast.show({ icon: 'fail', content: err?.message || '操作失败' });
                  }
                }}>发消息</Button>
                <Button size="large" style={{ flex: 1, fontSize: 23 }} color="primary" fill="outline" onClick={async () => {
                  try {
                    const payload = {
                      fromUserId: (currentUser as any)?.id || (currentUser as any)?._id,
                      fromUsername: (currentUser as any)?.username,
                      fromRealname: (currentUser as any)?.realname,
                      toUserId: elderly.id || elderly._id,
                      toUsername: elderly.username,
                      toRealname: elderly.realname,
                      message: "通过社区添加您为好友",
                    } as any;
                    const resp = await UserService.createFriendRequest(payload);
                    if ((resp as any)?.code === 200) {
                      Toast.show({ icon: 'success', content: (resp as any)?.message || '好友申请已发送' });
                    } else {
                      Toast.show({ content: (resp as any)?.message || '提交失败' });
                    }
                  } catch (e: any) {
                    Toast.show({ content: e?.message || '提交失败' });
                  }
                }}>加好友</Button>
              </div>
            )}
          </div>
        ),
        closeOnMaskClick: true,
        actions: [{ key: "ok", text: "关闭" }],
        onAction: () => {
          infoDialog?.close?.();
        },
      });
    } catch (e: any) {
      loading.close?.();
      Dialog.show({ content: e?.message || "获取用户信息失败" });
    }
  };

  return (
    <div style={{ background: "#f7f8fa", minHeight: "100%" }}>
      <NavBal title="社区" hideBack />
      <div style={{ padding: 12 }}>
        <PullToRefresh onRefresh={handleRefresh}>
          {hasNoPosts ? (
            <Empty description="暂无动态" style={{ padding: "60px 0" }} />
          ) : (
            <Space direction="vertical" style={{ width: "100%" }}>
              {posts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #e0e0e0", // 每条动态1px灰色边框
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  {/* 头部：作者 + 时间 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div onClick={() => handleShowAuthor(post.authorId)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: "1px solid #eee",
                          background: "#fafafa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src="/imgs/elderly.png"
                          alt="avatar"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#333" }}>
                        {post.authorName || "匿名"}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 18,
                        color: "#555",
                        background: "#f2f4f5",
                        padding: "4px 8px",
                        borderRadius: 16,
                        lineHeight: 1,
                      }}
                    >
                      <ClockCircleOutline style={{ fontSize: 18 }} />
                      <span style={{ fontWeight: 600 }}>{formatPostTime(post.publishedAt)}</span>
                    </div>
                  </div>

                  {/* 内容 */}
                  {post.content && (
                    <div style={{ marginTop: 10, fontSize: 22, color: "#333", lineHeight: 2.0 }}>
                      {post.content}
                    </div>
                  )}

                  {/* 图片网格 */}
                  {renderImages(post.images)}

                  {/* 底部：点赞/评论数量 */}
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 28,
                      color: "#333",
                      fontSize: 22,
                    }}
                  >
                    <div onClick={() => handleToggleLike(post)} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      {isLikedByMe(post) ? (
                        <HeartFill style={{ fontSize: 24, color: "#ff4d4f" }} />
                      ) : (
                        <HeartOutline style={{ fontSize: 24 }} />
                      )}
                      <span style={{ fontWeight: 700 }}>
                        {(post.likes || []).length}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }} onClick={() => toggleCommentBox(post.id)}>
                      <MessageOutline style={{ fontSize: 24 }} />
                      <span style={{ fontWeight: 700 }}>
                        {(post.comments || []).length}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: 1,
                      background: "#eaeaea",
                      margin: "12px auto 0",
                    }}
                  />

                  {/* 评论输入框 */}
                  {commentingPostId === post.id && (
                    <div style={{ marginTop: 10, background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
                      <TextArea
                        value={commentDrafts[post.id] || ""}
                        onChange={(val) => handleChangeComment(post.id, val)}
                        placeholder={replyTarget && replyTarget.postId === post.id ? "请输入评论内容..." : "写下你的评论…"}
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        maxLength={100}
                        showCount
                        style={{ fontSize: 14 }}
                      />
                      <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
                        <Button color="primary" size="small" loading={sendingComment} onClick={() => handleSendComment(post)}>
                          发送
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 评论区 */}
                  <div style={{ marginTop: 10 }}>
                    {post.comments && post.comments.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {post.comments.map((c, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 10, cursor: "pointer" }} onClick={() => { setCommentingPostId(post.id); setReplyTarget({ postId: post.id, userId: c.userId, username: c.username }); }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                overflow: "hidden",
                                flex: "0 0 auto",
                                background: "#f5f5f5",
                                border: "1px solid #eee",
                              }}
                            >
                              <img src="/imgs/elderly.png" alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>{c.username || "匿名"}</span>
                                <span style={{ fontSize: 12, color: "#999" }}>{formatPostTime(c.createdAt)}</span>
                              </div>
                              <div style={{ marginTop: 4, fontSize: 16, color: "#333", lineHeight: 1.6 }}>
                                {c.replyTo && c.replyTo.username ? (
                                  <>
                                    <span style={{ color: "#999" }}>回复了 {c.replyTo.username}：</span>
                                    {c.content}
                                  </>
                                ) : (
                                  c.content
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: "start", color: "#999", fontSize: 16, padding: "6px 0" }}>还没有评论</div>
                    )}
                  </div>
                </div>
              ))}
            </Space>
          )}
        </PullToRefresh>
      </div>

      {loading && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            background: "rgba(255,255,255,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "#333" }}>
            <DotLoading color="primary" />
            加载中…
          </div>
        </div>
      )}


      {/* 图片预览遮罩 */}
      {previewVisible && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <div onClick={closePreview} style={{ color: "#fff", fontSize: 28, padding: 12, cursor: "pointer" }}>
              <CloseOutline />
            </div>
          </div>
          <div
            ref={imgContainerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", touchAction: "none" }}
          >
            {/* 上一张 */}
            {previewImages.length > 1 && (
              <div
                onClick={showPrev}
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#fff", fontSize: 28, padding: 10, cursor: "pointer" }}
              >
                <LeftOutline />
              </div>
            )}

            {/* 图片 */}
            <img
              src={previewImages[previewIndex]}
              alt="preview"
              style={{
                maxWidth: "92vw",
                maxHeight: "72vh",
                transform: `translate(${previewTranslate.x}px, ${previewTranslate.y}px) rotate(${previewRotate}deg) scale(${previewScale})`,
                transition: "transform 0.08s ease-out",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                cursor: previewScale > 1 ? "grab" : "default",
              }}
            />

            {/* 下一张 */}
            {previewImages.length > 1 && (
              <div
                onClick={showNext}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#fff", fontSize: 28, padding: 10, cursor: "pointer" }}
              >
                <RightOutline />
              </div>
            )}
          </div>
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              color: "#fff",
              fontSize: 16,
            }}
          >
            <button onClick={rotateLeft} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.35)", background: "transparent", color: "#fff", fontSize: 16, cursor: "pointer" }}>左旋转</button>
            <span style={{ opacity: 0.8 }}>{previewIndex + 1} / {previewImages.length}</span>
            <button onClick={rotateRight} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.35)", background: "transparent", color: "#fff", fontSize: 16, cursor: "pointer" }}>右旋转</button>
            <button onClick={() => { scaleRef.current = 1; translateRef.current = { x: 0, y: 0 }; setPreviewScale(1); setPreviewTranslate({ x: 0, y: 0 }); }} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.35)", background: "transparent", color: "#fff", fontSize: 16, cursor: "pointer" }}>复位</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Community;
