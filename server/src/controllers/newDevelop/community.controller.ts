import { Request, Response } from "express";
import { verifyToken } from "../../utils/jwt";
import { CommunityPost } from "../../models/community.model";
import { User } from "../../models/user.model";

export class NewDevelopCommunityController {
  // 创建社区动态帖子
  static async createPost(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization;
      let userId: string | null = null;

      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        try {
          const payload = verifyToken(token) as any;
          userId = payload?.id || null;
        } catch {
          // ignore token errors
        }
      }

      if (!userId) {
        return res.json({ code: 401, message: "未登录", data: null });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.json({ code: 404, message: "用户不存在", data: null });
      }

      const { content, images } = req.body || {};
      const text = (content || "").trim();
      if (!text && (!Array.isArray(images) || images.length === 0)) {
        return res.json({ code: 400, message: "内容或图片至少填写一项", data: null });
      }

      const imgs: string[] = Array.isArray(images)
        ? images.map((x: any) => String(x || "")).filter(Boolean)
        : [];

      const created = await CommunityPost.create({
        authorId: user._id,
        authorName: user.realname || user.username,
        content: text,
        images: imgs,
        publishedAt: new Date(),
        likes: [],
        comments: [],
      });

      return res.json({ code: 200, message: "发布成功", data: created });
    } catch (error: any) {
      console.error("[newDevelop] 创建社区动态失败:", error);
      return res.status(500).json({ code: 500, message: "服务器错误", data: null });
    }
  }

  // 点赞帖子
  static async likePost(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization;
      let userId: string | null = null;

      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        try {
          const payload = verifyToken(token) as any;
          userId = payload?.id || null;
        } catch {}
      }
      if (!userId) return res.json({ code: 401, message: "未登录", data: null });

      const postId = String(req.params.id || "").trim();
      if (!postId) return res.json({ code: 400, message: "缺少帖子ID", data: null });

      const exist = await CommunityPost.findById(postId).select("_id");
      if (!exist) return res.json({ code: 404, message: "帖子不存在", data: null });

      // 优先使用前端传入的 username；未传则从数据库读取
      const bodyUsername = String((req.body as any)?.username || "").trim();
      const user = await User.findById(userId);
      const finalUsername = bodyUsername || (user?.realname || user?.username || "");

      // 原子追加（仅当该用户尚未点赞）
      await CommunityPost.updateOne(
        { _id: postId, "likes.userId": { $ne: userId } },
        { $push: { likes: { userId, username: finalUsername } } }
      );

      const updated = await CommunityPost.findById(postId);
      return res.json({ code: 200, message: "点赞成功", data: updated });
    } catch (error: any) {
      console.error("[newDevelop] 点赞失败:", error);
      return res.status(500).json({ code: 500, message: "服务器错误", data: null });
    }
  }

  // 取消点赞
  static async unlikePost(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization;
      let userId: string | null = null;

      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        try {
          const payload = verifyToken(token) as any;
          userId = payload?.id || null;
        } catch {}
      }
      if (!userId) return res.json({ code: 401, message: "未登录", data: null });

      const postId = String(req.params.id || "").trim();
      if (!postId) return res.json({ code: 400, message: "缺少帖子ID", data: null });

      const exist = await CommunityPost.findById(postId).select("_id");
      if (!exist) return res.json({ code: 404, message: "帖子不存在", data: null });

      await CommunityPost.updateOne(
        { _id: postId },
        { $pull: { likes: { userId } } }
      );

      const updated = await CommunityPost.findById(postId);
      return res.json({ code: 200, message: "已取消点赞", data: updated });
    } catch (error: any) {
      console.error("[newDevelop] 取消点赞失败:", error);
      return res.status(500).json({ code: 500, message: "服务器错误", data: null });
    }
  }

  // 添加评论
  static async addComment(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization;
      let userId: string | null = null;
      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        try {
          const payload = verifyToken(token) as any;
          userId = payload?.id || null;
        } catch {}
      }
      if (!userId) return res.json({ code: 401, message: "未登录", data: null });

      const postId = String(req.params.id || "").trim();
      if (!postId) return res.json({ code: 400, message: "缺少帖子ID", data: null });

      const { content, replyTo } = req.body || {};
      const text = (content || "").trim();
      if (!text) return res.json({ code: 400, message: "评论内容不能为空", data: null });

      const user = await User.findById(userId);
      if (!user) return res.json({ code: 404, message: "用户不存在", data: null });

      const post = await CommunityPost.findById(postId);
      if (!post) return res.json({ code: 404, message: "帖子不存在", data: null });

      const replyPayload = (() => {
        if (replyTo && typeof replyTo === "object") {
          const toUserId = (replyTo as any).userId || (replyTo as any)._id || null;
          const toUsername = (replyTo as any).username || "";
          if (toUserId) return { userId: toUserId, username: toUsername };
        }
        return undefined;
      })();

      (post.comments as any).push({
        userId,
        username: user.realname || user.username,
        content: text,
        createdAt: new Date(),
        replyTo: replyPayload,
      });
      await post.save();

      return res.json({ code: 200, message: "评论成功", data: post });
    } catch (error: any) {
      console.error("[newDevelop] 评论失败:", error);
      return res.status(500).json({ code: 500, message: "服务器错误", data: null });
    }
  }

  // 获取帖子列表
  static async listPosts(_req: Request, res: Response) {
    try {
      const posts = await CommunityPost.find().sort({ publishedAt: -1 });
      return res.json({ code: 200, message: "ok", data: posts });
    } catch (error: any) {
      console.error("[newDevelop] 获取帖子列表失败:", error);
      return res.status(500).json({ code: 500, message: "服务器错误", data: null });
    }
  }
}

export default NewDevelopCommunityController;


