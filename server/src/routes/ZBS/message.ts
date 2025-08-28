import { Router, Request, Response } from "express";
import { Message } from "../../models/message.model";
import {
  broadcastConversationCreated,
  broadcastConversationUpdated,
} from "../../index";

const router = Router();

// 获取消息列表接口
router.get("/messagelist", async (req: Request, res: Response) => {
  try {
    const { username, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    // 如果提供了用户名，筛选包含该用户的对话
    if (username) {
      query = { "users.username": username as string };
    }

    // 查询对话列表，按更新时间倒序排列
    const conversations = await Message.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // 获取总数
    const total = await Message.countDocuments(query);

    // 转换数据格式，适配前端需要的格式
    const messageList = conversations.map((conversation) => {
      // 获取最后一条消息
      const lastMessage =
        conversation.messages[conversation.messages.length - 1];

      // 获取对话参与者信息
      const participants = conversation.users.map((user) => ({
        username: user.username,
        realname: user.realname || user.username,
        role: user.role,
      }));

      return {
        id: conversation._id,
        users: participants,
        lastMessage: lastMessage
          ? {
              sender: lastMessage.sender,
              content: lastMessage.content,
              sendTime: lastMessage.send_time,
              type: lastMessage.type,
              receiver: lastMessage.receiver,
            }
          : null,
        messageCount: conversation.messages.length,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    });

    res.json({
      code: 200,
      message: "获取消息列表成功",
      data: {
        list: messageList,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("获取消息列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取消息列表失败",
      data: null,
    });
  }
});

// 根据用户获取对话列表
router.get("/messagelist/:username", async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 查找包含指定用户的所有对话
    const conversations = await Message.find({ "users.username": username })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments({ "users.username": username });

    // 转换为聊天列表格式
    const chatList = conversations.map((conversation) => {
      // 找到对话中的其他用户（排除当前用户）
      const otherUser = conversation.users.find(
        (user) => user.username !== username
      );
      const lastMessage =
        conversation.messages[conversation.messages.length - 1];

      return {
        id: conversation._id,
        name: otherUser?.realname || otherUser?.username || "未知用户",
        avatar: "", // 可以后续添加头像逻辑
        lastMessage: lastMessage
          ? {
              id: `${conversation._id}_${conversation.messages.length - 1}`,
              content: lastMessage.content,
              timestamp: new Date(lastMessage.send_time),
              isRead: true, // 简化处理，后续可以添加已读逻辑
              type: lastMessage.type || "text",
            }
          : null,
        unreadCount: 0, // 简化处理，后续可以添加未读计数逻辑
        isOnline: false, // 简化处理，后续可以添加在线状态逻辑
        role: otherUser?.role || "family",
        updatedAt: conversation.updatedAt,
      };
    });

    res.json({
      code: 200,
      message: "获取用户对话列表成功",
      data: {
        list: chatList,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("获取用户对话列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取用户对话列表失败",
      data: null,
    });
  }
});

// 获取具体对话的消息详情
router.get(
  "/conversation/:conversationId",
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const conversation = await Message.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          code: 404,
          message: "对话不存在",
          data: null,
        });
      }

      // 分页处理消息
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const messages = conversation.messages.slice(startIndex, endIndex);

      res.json({
        code: 200,
        message: "获取对话详情成功",
        data: {
          conversationId: conversation._id,
          users: conversation.users,
          messages: messages.map((msg, index) => ({
            id: `${conversationId}_${startIndex + index}`,
            sender: msg.sender,
            content: msg.content,
            sendTime: msg.send_time,
            type: msg.type,
            receiver: msg.receiver,
          })),
          total: conversation.messages.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(conversation.messages.length / Number(limit)),
        },
      });
    } catch (error) {
      console.error("获取对话详情失败:", error);
      res.status(500).json({
        code: 500,
        message: "获取对话详情失败",
        data: null,
      });
    }
  }
);

// 发送消息接口 - 对特定对话发送消息
router.post(
  "/conversation/:conversationId/send",
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { sender, content, type = "text", status, time } = req.body;

      // 验证必要参数
      if (!sender || !content) {
        return res.status(400).json({
          code: 400,
          message: "发送者和消息内容为必填项",
          data: null,
        });
      }

      // 根据conversationId查找对话
      const conversation = await Message.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({
          code: 404,
          message: "对话不存在",
          data: null,
        });
      }

      // 验证发送者是否是对话参与者
      const isParticipant = conversation.users.some(
        (user) => user.username === sender
      );
      if (!isParticipant) {
        return res.status(403).json({
          code: 403,
          message: "您不是此对话的参与者",
          data: null,
        });
      }

      const receivers = conversation.users
        .filter((user) => user.username !== sender)
        .map((user) => user.username);

      // 检查接收者列表是否为空
      if (receivers.length === 0) {
        return res.status(400).json({
          code: 400,
          message: "无法找到接收者，对话中可能只有发送者一人或发送者不在对话中",
          data: {
            conversationUsers: conversation.users,
            sender: sender,
          },
        });
      }

      // 创建新消息
      const newMessage: any = {
        sender: sender,
        send_time: Date.now(),
        content: content,
        type: type,
        receiver: receivers,
      };
      if (status) newMessage.status = status;
      if (typeof time === "number") newMessage.time = time;

      // 添加消息到对话中
      conversation.messages.push(newMessage);
      await conversation.save();

      // 广播对话更新事件
      try {
        broadcastConversationUpdated({
          conversationId: conversation._id,
          participants: conversation.users.map((user) => user.username),
          lastMessage: {
            sender: sender,
            content: content,
            sendTime: newMessage.send_time,
            type: type,
            receiver: receivers,
            ...(status ? { status } : {}),
            ...(typeof time === "number" ? { time } : {}),
          },
          timestamp: Date.now(),
        });
      } catch (error) {
        console.warn("广播对话更新事件失败:", error);
      }

      // 返回成功响应
      res.json({
        code: 200,
        message: "消息发送成功",
        data: {
          conversationId: conversation._id,
          messageId: `${conversation._id}_${conversation.messages.length - 1}`,
          sender: sender,
          receiver: receivers,
          content: content,
          sendTime: newMessage.send_time,
          type: type,
          ...(status ? { status } : {}),
          ...(typeof time === "number" ? { time } : {}),
        },
      });
    } catch (error) {
      console.error("发送消息失败:", error);
      res.status(500).json({
        code: 500,
        message: "发送消息失败",
        data: null,
      });
    }
  }
);

// 通用发送消息接口 - 用于创建新对话或在没有conversationId时发送消息
router.post("/send", async (req: Request, res: Response) => {
  try {
    const {
      sender,
      receiver,
      content,
      type = "text",
      status = "unread",
      time,
      senderRole,
      receiverRole,
      senderRealname,
      receiverRealname,
    } = req.body;

    // 验证必要参数
    if (!sender || !receiver || !content) {
      return res.status(400).json({
        code: 400,
        message: "发送者、接收者和消息内容为必填项",
        data: null,
      });
    }

    // 查找或创建对话
    let conversation = await Message.findOne({
      "users.username": { $all: [sender, receiver] },
      $expr: { $eq: [{ $size: "$users" }, 2] },
    });

    // 如果对话不存在，创建新对话
    if (!conversation) {
      conversation = new Message({
        users: [
          {
            username: sender,
            realname: senderRealname || sender,
            role: senderRole || "family",
          },
          {
            username: receiver,
            realname: receiverRealname || receiver,
            role: receiverRole || "nurse",
          },
        ],
        messages: [],
      });
    }

    // 创建新消息
    const newMessage = {
      sender: sender,
      send_time: Date.now(),
      content: content,
      type: type,
      status: status,
      time: time,
      receiver: [receiver],
    };

    // 判断是否为新创建的对话
    const isNewConversation = conversation.messages.length === 0;

    // 添加消息到对话中
    conversation.messages.push(newMessage);
    await conversation.save();

    // 广播事件
    try {
      if (isNewConversation) {
        // 新对话创建事件
        broadcastConversationCreated({
          conversationId: conversation._id,
          participants: [sender, receiver],
          participantDetails: conversation.users,
          isNew: true,
          timestamp: Date.now(),
        });
      } else {
        // 对话更新事件
        broadcastConversationUpdated({
          conversationId: conversation._id,
          participants: [sender, receiver],
          lastMessage: {
            sender: sender,
            content: content,
            sendTime: newMessage.send_time,
            type: type,
            receiver: [receiver],
          },
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.warn("广播对话事件失败:", error);
    }

    // 返回成功响应
    res.json({
      code: 200,
      message: "消息发送成功",
      data: {
        conversationId: conversation._id,
        messageId: `${conversation._id}_${conversation.messages.length - 1}`,
        sender: sender,
        receiver: receiver,
        content: content,
        sendTime: newMessage.send_time,
        type: type,
      },
    });
  } catch (error) {
    console.error("发送消息失败:", error);
    res.status(500).json({
      code: 500,
      message: "发送消息失败",
      data: null,
    });
  }
});

// 创建新对话接口
router.post("/conversation/create", async (req: Request, res: Response) => {
  try {
    const { participants, initialMessage } = req.body;

    // 验证参数
    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length < 2
    ) {
      return res.status(400).json({
        code: 400,
        message: "至少需要两个参与者才能创建对话",
        data: null,
      });
    }

    // 检查是否已存在相同参与者的对话（两人对话）
    if (participants.length === 2) {
      const usernames = participants.map((p) => p.username);
      const existingConversation = await Message.findOne({
        "users.username": { $all: usernames },
        $expr: { $eq: [{ $size: "$users" }, 2] },
      });

      if (existingConversation) {
        return res.json({
          code: 200,
          message: "对话已存在",
          data: {
            conversationId: existingConversation._id,
            isExisting: true,
          },
        });
      }
    }

    // 创建新对话
    const newConversation = new Message({
      users: participants.map((p) => ({
        username: p.username,
        realname: p.realname || p.username,
        role: p.role,
      })),
      messages: [],
    });

    // 如果提供了初始消息，添加到对话中
    if (initialMessage && initialMessage.content) {
      const firstMessage = {
        sender: participants[0].username,
        send_time: Date.now(),
        content: initialMessage.content,
        type: initialMessage.type || "text",
        receiver: participants.slice(1).map((p) => p.username),
      };
      newConversation.messages.push(firstMessage);
    }

    await newConversation.save();

    // 广播对话创建事件
    try {
      broadcastConversationCreated({
        conversationId: newConversation._id,
        participants: participants.map((p) => p.username),
        participantDetails: participants,
        isNew: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn("广播对话创建事件失败:", error);
    }

    res.json({
      code: 200,
      message: "对话创建成功",
      data: {
        conversationId: newConversation._id,
        isExisting: false,
      },
    });
  } catch (error) {
    console.error("创建对话失败:", error);
    res.status(500).json({
      code: 500,
      message: "创建对话失败",
      data: null,
    });
  }
});

export default router;
