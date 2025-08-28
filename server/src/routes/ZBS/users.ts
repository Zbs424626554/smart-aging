import { Router, Request, Response } from "express";
import { User } from "../../models/user.model";
import { authenticateToken } from "../../middleware/auth.middleware";

const router = Router();

// 获取所有用户接口
router.get("/users", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, role, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    let query: any = {};

    // 如果指定了角色，则筛选特定角色
    if (role) {
      query.role = role as string;
    }

    // 如果指定了状态，则筛选特定状态
    if (status !== undefined) {
      query.status = status === "true";
    }

    // 查询用户列表，排除密码字段
    const users = await User.find(query)
      .select("-password") // 排除密码字段
      .sort({ createdTime: -1 })
      .skip(skip)
      .limit(Number(limit));

    // 获取总数
    const total = await User.countDocuments(query);

    // 转换数据格式，适配前端需要的格式
    const userList = users.map((user) => ({
      id: user._id,
      username: user.username,
      realname: user.realname || user.username,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar || "",
      status: user.status,
      createdTime: user.createdTime,
      lastLogin: user.lastLogin,
    }));

    res.json({
      code: 200,
      message: "获取用户列表成功",
      data: {
        list: userList,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取用户列表失败",
      data: null,
    });
  }
});

// 修改当前登录用户密码
router.post(
  "/users/change-password",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId as string;
      const { oldPassword, newPassword } = req.body as {
        oldPassword?: string;
        newPassword?: string;
      };

      if (!oldPassword || !newPassword) {
        return res.json({ code: 400, message: "缺少必要参数", data: null });
      }

      if (newPassword.length < 6) {
        return res.json({
          code: 400,
          message: "新密码长度不能少于6位",
          data: null,
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.json({ code: 404, message: "用户不存在", data: null });
      }

      const match = await user.comparePassword(oldPassword);
      if (!match) {
        return res.json({ code: 401, message: "旧密码不正确", data: null });
      }

      user.password = newPassword;
      await user.save();

      return res.json({ code: 200, message: "密码修改成功", data: null });
    } catch (error) {
      console.error("修改密码失败:", error);
      return res
        .status(500)
        .json({ code: 500, message: "修改密码失败", data: null });
    }
  }
);

// 根据角色获取用户列表
router.get("/users/role/:role", async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 验证角色参数
    const validRoles = ["elderly", "family", "nurse", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        code: 400,
        message: "无效的角色参数",
        data: null,
      });
    }

    // 查询指定角色的用户
    const users = await User.find({ role, status: true })
      .select("-password")
      .sort({ createdTime: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments({ role, status: true });

    const userList = users.map((user) => ({
      id: user._id,
      username: user.username,
      realname: user.realname || user.username,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar || "",
      status: user.status,
      createdTime: user.createdTime,
      lastLogin: user.lastLogin,
    }));

    res.json({
      code: 200,
      message: `获取${role}用户列表成功`,
      data: {
        list: userList,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取用户列表失败",
      data: null,
    });
  }
});

// 搜索用户
router.get("/users/search", async (req: Request, res: Response) => {
  try {
    const { keyword, role, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!keyword) {
      return res.status(400).json({
        code: 400,
        message: "搜索关键词不能为空",
        data: null,
      });
    }

    // 构建搜索条件
    let query: any = {
      $and: [
        {
          $or: [
            { username: { $regex: keyword, $options: "i" } },
            { realname: { $regex: keyword, $options: "i" } },
            { phone: { $regex: keyword, $options: "i" } },
          ],
        },
      ],
    };

    // 如果指定了角色，则添加角色筛选
    if (role) {
      query.$and.push({ role: role as string });
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdTime: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    const userList = users.map((user) => ({
      id: user._id,
      username: user.username,
      realname: user.realname || user.username,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar || "",
      status: user.status,
      createdTime: user.createdTime,
      lastLogin: user.lastLogin,
    }));

    res.json({
      code: 200,
      message: "搜索用户成功",
      data: {
        list: userList,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("搜索用户失败:", error);
    res.status(500).json({
      code: 500,
      message: "搜索用户失败",
      data: null,
    });
  }
});

export default router;
