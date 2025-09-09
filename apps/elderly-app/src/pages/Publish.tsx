import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ImageUploader, Space, TextArea, Toast } from "antd-mobile";
import { AudioOutlined } from "@ant-design/icons";
import NavBal from "../components/NavBal";
import { AuthService } from "../services/auth.service";
import { http } from "../utils/request";
import { useNavigate } from "react-router-dom";

type CommentItem = {
  userId: string;
  username: string;
  content: string;
  createdAt: string;
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

export default function Publish() {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [content, setContent] = useState<string>("");
  const [fileList, setFileList] = useState<Array<{ url?: string; file?: File }>>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  // 本地语音识别已移除
  const [isBackendRecording, setIsBackendRecording] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const backendStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // 已删除评论区域

  const canSubmit = useMemo(() => {
    return content.trim().length > 0 || fileList.some((f) => !!f.url);
  }, [content, fileList]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as PostItem[]) : [];
      setPosts(parsed.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()));
    } catch {
      setPosts([]);
    }
  }, []);

  const savePosts = (next: PostItem[]) => {
    setPosts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const upload = async (file: File) => {
    try {
      const dataUrl = await fileToBase64(file);
      return { url: dataUrl } as any;
    } catch (err: any) {
      Toast.show({ content: err?.message || "转换失败" });
      throw err;
    }
  };

  // 本地语音识别逻辑已移除

  // 后端录音转写：使用 MediaRecorder 采集音频，结束后上传到后端转写
  const startBackendVoice = async () => {
    if (isBackendRecording) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Toast.show({ content: "当前环境不支持音频录制" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      backendStreamRef.current = stream;
      chunksRef.current = [];

      const mimeType = (window as any).MediaRecorder && (MediaRecorder as any).isTypeSupported && (MediaRecorder as any).isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsBackendRecording(false);
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
          chunksRef.current = [];

          // 释放麦克风
          try {
            backendStreamRef.current?.getTracks().forEach((t) => t.stop());
          } catch { }
          backendStreamRef.current = null;

          // 转为 base64 dataURL
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(blob);
          });

          Toast.show({ content: "正在转写…" });
          const resp = await http.post<{ text: string }>("/stt/transcribe", { base64 });
          const text = resp.data?.text || "";
          if (text) {
            setContent((prev) => (prev ? prev + text : text));
            Toast.show({ content: "转写完成" });
          } else {
            Toast.show({ content: "未识别到有效内容" });
          }
        } catch (e: any) {
          Toast.show({ content: e?.message || "转写失败" });
        }
      };

      recorder.start();
      setIsBackendRecording(true);
    } catch (e: any) {
      setIsBackendRecording(false);
      Toast.show({ content: e?.message || "无法获取麦克风" });
    }
  };

  const stopBackendVoice = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch { }
  };

  const handlePublish = async () => {
    if (!currentUser) {
      Toast.show({ content: "请先登录" });
      return;
    }
    if (!canSubmit) {
      Toast.show({ content: "请输入内容或添加图片" });
      return;
    }
    try {
      setPublishing(true);
      const images = fileList.map((f) => f.url!).filter(Boolean);

      // 调用后端 newDevelop 接口发布动态（通过统一 http 工具，自动拼接 API 基础地址并附带 token）
      const json = await http.post("/community/post", {
        content: content.trim(),
        images,
      });

      // 前端本地列表立即显示（与后端返回一致字段做最小映射）
      const created = json.data;
      const mapped: PostItem = {
        id: created._id || `${Date.now()}`,
        authorId: created.authorId,
        authorName: created.authorName,
        content: created.content,
        images: created.images || [],
        publishedAt: created.publishedAt || new Date().toISOString(),
        likes: (created.likes || []).map((x: any) => String(x)),
        comments: (created.comments || []).map((c: any) => ({
          userId: String(c.userId),
          username: c.username,
          content: c.content,
          createdAt: c.createdAt || new Date().toISOString(),
        })),
      };
      const next = [mapped, ...posts];
      savePosts(next);
      setContent("");
      setFileList([]);
      Toast.show({ content: "发布成功", icon: "success" });
      setTimeout(() => {
        navigate("/home/community", { replace: true });
      }, 1000);
    } catch (err: any) {
      Toast.show({ content: err?.message || "发布失败" });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <NavBal title="发布动态" />
      <div style={{ padding: 12, fontSize: 20, lineHeight: 2.0 }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: 12 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <TextArea
              value={content}
              onChange={setContent}
              placeholder="这一刻的想法..."
              autoSize={{ minRows: 3, maxRows: 8 }}
              maxLength={500}
              showCount
              style={{ fontSize: 20, border: "1px solid #e0e0e0", borderRadius: 10, padding: 8 }}
            />
            <div style={{ width: "100%" }}>
              <div onMouseLeave={() => stopBackendVoice()} onTouchCancel={() => stopBackendVoice()}>
                <div style={{ marginTop: 6, textAlign: "center", color: "#777", fontSize: 18 }}>
                  {isBackendRecording ? "录音中…" : "长按进行语音输入"}
                </div>
                <Button
                  block
                  onMouseDown={() => startBackendVoice()}
                  onMouseUp={() => stopBackendVoice()}
                  onTouchStart={() => startBackendVoice()}
                  onTouchEnd={() => stopBackendVoice()}
                  style={{
                    height: 48,
                    fontSize: 20,
                    background: isBackendRecording ? "#e6f4ff" : "#fff",
                    color: "#1677ff",
                    border: "1px solid #1677ff",
                    borderRadius: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    letterSpacing: "5px",
                    gap: 8,
                  }}
                >
                  <AudioOutlined style={{ marginRight: "20px" }} />
                  {isBackendRecording ? "松开结束" : "按住说话"}
                </Button>
              </div>

            </div>
            <ImageUploader
              value={fileList as any}
              onChange={setFileList as any}
              upload={upload}
              multiple
              maxCount={9}
              style={{ "--cell-size": "100px" } as any}
            />
            <Button color="primary" block loading={publishing} onClick={handlePublish} disabled={!canSubmit || publishing} style={{ height: 48, fontSize: 25, letterSpacing: "20px" }}>
              {publishing ? "发布中···" : "发布"}
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
