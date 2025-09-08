import { Request, Response } from "express";
import { FriendRequest } from "../../models/friend-request.model";
import { User } from "../../models/user.model";
import { Message } from "../../models/message.model";

export class NewDevelopFriendController {
  /** 提交好友申请 */
  static async createRequest(req: Request, res: Response) {
    try {
      const { fromUserId, fromUsername, fromRealname, toUserId, toUsername, toRealname, message } = req.body || {};

      if (!fromUserId || !toUserId || !fromUsername || !toUsername) {
        return res.json({ code: 400, message: "缺少必要参数", data: null });
      }

      if (String(fromUserId) === String(toUserId) || String(fromUsername) === String(toUsername)) {
        return res.json({ code: 400, message: "不能向自己发起申请", data: null });
      }

      // 校验用户是否存在
      const [fromUser, toUser] = await Promise.all([
        User.findById(fromUserId),
        User.findById(toUserId),
      ]);
      if (!fromUser || !toUser) {
        return res.json({ code: 404, message: "申请用户不存在", data: null });
      }

      // 若存在未处理的相同申请，直接返回
      const existing = await FriendRequest.findOne({
        fromUserId,
        toUserId,
        status: "pending",
      });
      if (existing) {
        return res.json({ code: 200, message: "已存在待处理申请", data: { request: existing } });
      }

      const request = await FriendRequest.create({
        fromUserId,
        fromUsername,
        fromRealname,
        toUserId,
        toUsername,
        toRealname,
        message: message || "",
        status: "pending",
      });

      return res.json({ code: 200, message: "申请已提交", data: { request } });
    } catch (error) {
      console.error("创建好友申请失败:", error);
      return res.json({ code: 500, message: "创建好友申请失败", data: null });
    }
  }

  /** 获取指定接收者的好友申请列表（收到的申请） */
  static async getReceivedRequests(req: Request, res: Response) {
    try {
      const { toUserId, toUsername, status } = (req.query || {}) as any;

      if (!toUserId && !toUsername) {
        return res.json({ code: 400, message: "缺少接收者参数", data: null });
      }

      const query: any = {};
      if (toUserId) query.toUserId = toUserId;
      if (toUsername) query.toUsername = toUsername;
      if (status) query.status = status;

      const list = await FriendRequest.find(query).sort({ createdAt: -1 });
      return res.json({ code: 200, message: "ok", data: { list } });
    } catch (error) {
      console.error("获取好友申请失败:", error);
      return res.json({ code: 500, message: "获取好友申请失败", data: null });
    }
  }

  /** 更新好友申请状态 */
  static async updateRequestStatus(req: Request, res: Response) {
    try {
      const { id } = req.params as any;
      const { status } = (req.body || {}) as any;
      if (!id) return res.json({ code: 400, message: "缺少申请ID", data: null });
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.json({ code: 400, message: "无效的状态", data: null });
      }
      const requestDoc = await FriendRequest.findById(id);
      if (!requestDoc) return res.json({ code: 404, message: "申请不存在", data: null });

      // 更新状态
      const updated = await FriendRequest.findByIdAndUpdate(id, { status }, { new: true });
      if (!updated) return res.json({ code: 500, message: "更新失败", data: null });

      // 若通过，则互相添加为好友
      if (status === "approved") {
        try {
          await Promise.all([
            User.updateOne(
              { _id: requestDoc.fromUserId, "friends.userId": { $ne: requestDoc.toUserId } },
              { $push: { friends: { userId: requestDoc.toUserId, username: requestDoc.toUsername, relationship: "friend" } } }
            ),
            User.updateOne(
              { _id: requestDoc.toUserId, "friends.userId": { $ne: requestDoc.fromUserId } },
              { $push: { friends: { userId: requestDoc.fromUserId, username: requestDoc.fromUsername, relationship: "friend" } } }
            ),
          ]);
          // 生成系统消息：对方通过了你的好友申请
          const sender = requestDoc.toUsername; // 接收者作为发送者发系统通知
          const receiver = requestDoc.fromUsername;
          let conversation = await Message.findOne({
            "users.username": { $all: [sender, receiver] },
            $expr: { $eq: [{ $size: "$users" }, 2] },
          });
          const contentText = `通过了你的好友申请`;
          if (!conversation) {
            conversation = await Message.create({
              users: [
                { username: sender, realname: requestDoc.toRealname || sender, role: "elderly" },
                { username: receiver, realname: requestDoc.fromRealname || receiver, role: "elderly" },
              ],
              messages: [
                {
                  sender,
                  send_time: Date.now(),
                  content: contentText,
                  type: "text",
                  status: "unread",
                  receiver: [receiver],
                },
              ],
            });
          } else {
            conversation.messages.push({
              sender,
              send_time: Date.now(),
              content: contentText,
              type: "text",
              status: "unread",
              receiver: [receiver],
            });
            await conversation.save();
          }
        } catch (e) {
          // 即使好友写入失败，也返回状态更新结果
          console.warn("写入好友关系失败:", e);
        }
      }
      if (!updated) return res.json({ code: 404, message: "申请不存在", data: null });
      return res.json({ code: 200, message: "更新成功", data: { request: updated } });
    } catch (error) {
      console.error("更新好友申请状态失败:", error);
      return res.json({ code: 500, message: "更新好友申请状态失败", data: null });
    }
  }
}


