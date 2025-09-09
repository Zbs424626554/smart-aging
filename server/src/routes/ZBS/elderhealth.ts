import { Router, Request, Response } from "express";
import { ElderHealthArchive } from "../../models/elderhealth.model";
import { User } from "../../models/user.model";
import { verifyToken } from "../../utils/jwt";

const router = Router();

// 获取当前登录老人的健康档案
router.get("/elderhealth/me", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;

    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore token errors to allow fallback to query
      }
    }

    // 允许通过查询参数传入 elderId 作为兜底
    const elderIdFromQuery = (req.query.elderId as string) || null;
    // 护士端更新指定老人，应优先使用查询参数 elderId，其次再回退到 token 中的 id
    const elderId = elderIdFromQuery || userId;

    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    const archive = await ElderHealthArchive.findOne({ elderID: elderId });
    return res.json({
      code: 200,
      message: archive ? "ok" : "未找到健康档案",
      data: archive,
    });
  } catch (error) {
    console.error("获取健康档案失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

// 根据 elderId 获取健康档案
router.get("/elderhealth/:elderId", async (req: Request, res: Response) => {
  try {
    const { elderId } = req.params;
    const archive = await ElderHealthArchive.findOne({ elderID: elderId });
    return res.json({
      code: 200,
      message: archive ? "ok" : "未找到健康档案",
      data: archive,
    });
  } catch (error) {
    console.error("获取健康档案失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

// 添加用药时间设置
router.post("/elderhealth/medication", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;

    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore token errors
      }
    }

    const elderIdFromQuery = (req.query.elderId as string) || null;
    const elderId = userId || elderIdFromQuery;

    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    const { name, times, time } = req.body || {};
    const medicationName = (name || "").trim();
    let incomingTimes: string[] = Array.isArray(times) ? times : (time ? [String(time)] : []);

    if (!medicationName || incomingTimes.length === 0) {
      return res.json({
        code: 400,
        message: "药品名称和时间不能为空",
        data: null,
      });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    incomingTimes = incomingTimes
      .map((t) => String(t || "").trim())
      .filter(Boolean);
    if (incomingTimes.some((t) => !timeRegex.test(t))) {
      return res.json({
        code: 400,
        message: "时间格式不正确，请使用HH:MM格式",
        data: null,
      });
    }

    // 读出现有数据并归一化
    const archive = await ElderHealthArchive.findOne({ elderID: elderId });
    const nameToTimes = new Map<string, Set<string>>();
    if (archive?.useMedication) {
      for (const item of archive.useMedication as any[]) {
        const nm = (item?.name || "").trim();
        if (!nm) continue;
        const set = nameToTimes.get(nm) || new Set<string>();
        if (Array.isArray(item?.times)) for (const t of item.times) if (t) set.add(String(t));
        if (item?.time) set.add(String(item.time));
        nameToTimes.set(nm, set);
      }
    }

    // 覆盖该药品的时间集合
    nameToTimes.set(medicationName, new Set(incomingTimes));

    // 写回规范结构
    const normalized: any[] = [];
    for (const [nm, set] of nameToTimes.entries()) {
      const arr = Array.from(set).sort();
      normalized.push({ name: nm, times: arr });
    }

    await ElderHealthArchive.updateOne(
      { elderID: elderId },
      { $setOnInsert: { elderID: elderId }, $set: { useMedication: normalized } },
      { upsert: true }
    );

    const updated = await ElderHealthArchive.findOne({ elderID: elderId });
    return res.json({ code: 200, message: "保存成功", data: updated });
  } catch (error) {
    console.error("添加用药时间设置失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

export default router;

// 新增/更新紧急联系人
router.post("/elderhealth/emcontact", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;

    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore
      }
    }

    const elderIdFromQuery = (req.query.elderId as string) || null;
    const elderId = userId || elderIdFromQuery;

    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    const { username, realname, phone } = req.body || {};

    // 构建查询条件（根据提供的字段筛选）
    const query: any = {};
    if (username) query.username = username;
    if (realname) query.realname = realname;
    if (phone) query.phone = phone;

    if (Object.keys(query).length === 0) {
      return res.json({ code: 400, message: "缺少查询参数", data: null });
    }

    const contact = await User.findOne(query);
    if (!contact) {
      return res.json({ code: 404, message: "未找到该联系人", data: null });
    }

    // 仅更新，不创建
    const archive = await ElderHealthArchive.findOne({ elderID: elderId });
    if (!archive) {
      return res.json({ code: 404, message: "未找到健康档案", data: null });
    }

    archive.emcontact = {
      username: contact.username,
      phone: contact.phone,
      realname: contact.realname,
    } as any;
    await archive.save();

    return res.json({ code: 200, message: "保存成功", data: archive });
  } catch (error) {
    console.error("保存紧急联系人失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

// 初始化健康档案：如果不存在则根据 elderId 对应用户创建
router.post("/elderhealth/init", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;

    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore token errors
      }
    }

    const elderIdFromQuery = (req.query.elderId as string) || null;
    const elderId = userId || elderIdFromQuery;

    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    let archive = await ElderHealthArchive.findOne({ elderID: elderId });
    if (!archive) {
      const elderUser = await User.findById(elderId).select("realname phone");
      // 使用 upsert 保证并发下只创建一次
      await ElderHealthArchive.updateOne(
        { elderID: elderId },
        {
          $setOnInsert: {
            elderID: elderId,
            name: elderUser?.realname || undefined,
            phone: elderUser?.phone,
          },
        },
        { upsert: true }
      );
      archive = await ElderHealthArchive.findOne({ elderID: elderId });
    }

    return res.json({ code: 200, message: "ok", data: archive });
  } catch (error) {
    console.error("初始化健康档案失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

// 更新地址
router.post("/elderhealth/address", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;

    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore token errors
      }
    }

    const elderIdFromQuery = (req.query.elderId as string) || null;
    const elderId = userId || elderIdFromQuery;

    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    const { address } = req.body || {};
    const trimmed = (address || "").trim();
    if (!trimmed) {
      return res.json({ code: 400, message: "地址不能为空", data: null });
    }

    const archive = await ElderHealthArchive.findOne({ elderID: elderId });
    if (!archive) {
      return res.json({ code: 404, message: "未找到健康档案", data: null });
    }

    archive.address = trimmed;
    await archive.save();

    return res.json({ code: 200, message: "保存成功", data: archive });
  } catch (error) {
    console.error("更新地址失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

// 更新姓名
router.post("/elderhealth/name", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;
    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore
      }
    }
    const elderIdFromQuery = (req.query.elderId as string) || null;
    const elderId = userId || elderIdFromQuery;
    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    const { name } = req.body || {};
    const trimmed = (name || "").trim();
    if (!trimmed) {
      return res.json({ code: 400, message: "姓名不能为空", data: null });
    }

    const archive = await ElderHealthArchive.findOne({ elderID: elderId });
    if (!archive) {
      return res.json({ code: 404, message: "未找到健康档案", data: null });
    }
    archive.name = trimmed;
    await archive.save();
    return res.json({ code: 200, message: "保存成功", data: archive });
  } catch (error) {
    console.error("更新姓名失败:", error);
    return res.status(500).json({ code: 500, message: "服务器错误", data: null });
  }
});

// 更新性别
router.post("/elderhealth/gender", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;
    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore
      }
    }
    const elderIdFromQuery = (req.query.elderId as string) || null;
    const elderId = userId || elderIdFromQuery;
    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    const { gender } = req.body || {};
    const allowed = ["male", "female", "secret"];
    const normalized = String(gender || "").toLowerCase();
    if (!allowed.includes(normalized)) {
      return res.json({ code: 400, message: "性别参数不合法", data: null });
    }

    const archive = await ElderHealthArchive.findOne({ elderID: elderId });
    if (!archive) {
      return res.json({ code: 404, message: "未找到健康档案", data: null });
    }
    (archive as any).gender = normalized;
    await archive.save();
    return res.json({ code: 200, message: "保存成功", data: archive });
  } catch (error) {
    console.error("更新性别失败:", error);
    return res.status(500).json({ code: 500, message: "服务器错误", data: null });
  }
});

// 添加一条疾病史
router.post("/elderhealth/medicals", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;

    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore token errors
      }
    }

    const elderIdFromQuery = (req.query.elderId as string) || null;
    const elderId = userId || elderIdFromQuery;

    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    const { item, name, disease } = req.body || {};
    const toAdd = ((item || name || disease || "") as string).trim();
    if (!toAdd) {
      return res.json({ code: 400, message: "疾病名称不能为空", data: null });
    }

    // 使用原子更新，避免并发问题，并使用 $addToSet 去重
    await ElderHealthArchive.updateOne(
      { elderID: elderId },
      { $addToSet: { medicals: toAdd } }
    );

    const updated = await ElderHealthArchive.findOne({ elderID: elderId });
    return res.json({ code: 200, message: "保存成功", data: updated });
  } catch (error) {
    console.error("添加疾病史失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

// 添加一条过敏史
router.post("/elderhealth/allergies", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;

    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore token errors
      }
    }

    const elderIdFromQuery = (req.query.elderId as string) || null;
    const elderId = userId || elderIdFromQuery;

    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    const { item, name, allergy } = req.body || {};
    const toAdd = ((item || name || allergy || "") as string).trim();
    if (!toAdd) {
      return res.json({ code: 400, message: "过敏源不能为空", data: null });
    }

    // 使用原子更新，避免并发问题，并使用 $addToSet 去重
    await ElderHealthArchive.updateOne(
      { elderID: elderId },
      { $addToSet: { allergies: toAdd } }
    );

    const updated = await ElderHealthArchive.findOne({ elderID: elderId });
    return res.json({ code: 200, message: "保存成功", data: updated });
  } catch (error) {
    console.error("添加过敏史失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

// 更新年龄
router.post("/elderhealth/age", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;

    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore token errors
      }
    }

    const elderIdFromQuery = (req.query.elderId as string) || null;
    const elderId = userId || elderIdFromQuery;

    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    const { age } = req.body || {};

    // 验证年龄参数
    if (typeof age !== "number" || isNaN(age) || age < 0 || age > 150) {
      return res.json({
        code: 400,
        message: "年龄必须是0-150之间的有效数字",
        data: null,
      });
    }

    const archive = await ElderHealthArchive.findOne({ elderID: elderId });
    if (!archive) {
      return res.json({ code: 404, message: "未找到健康档案", data: null });
    }

    // 更新年龄
    archive.age = age;
    await archive.save();

    return res.json({ code: 200, message: "年龄更新成功", data: archive });
  } catch (error) {
    console.error("更新年龄失败:", error);
    return res
      .status(500)
      .json({ code: 500, message: "服务器错误", data: null });
  }
});

// 更新健康状态（血压、血糖、血氧、体温、心率）
router.post("/elderhealth/vitals", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    let userId: string | null = null;

    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      try {
        const payload = verifyToken(token) as any;
        userId = payload?.id || null;
      } catch (err) {
        // ignore token errors
      }
    }

    const elderIdFromQuery = (req.query.elderId as string) || null;
    const elderId = userId || elderIdFromQuery;

    if (!elderId) {
      return res.json({ code: 401, message: "未登录", data: null });
    }

    const {
      bloodPressure,
      bloodSugar,
      oxygenLevel,
      temperature,
      heartRate,
      name,
    } = req.body || {};

    // 简单校验
    const bpOk = typeof bloodPressure === "string" && /^\d{2,3}\/\d{2,3}$/.test(bloodPressure);
    const bsOk = bloodSugar === undefined || (typeof bloodSugar === "number" && bloodSugar >= 0 && bloodSugar <= 50);
    const oxOk = oxygenLevel === undefined || (typeof oxygenLevel === "number" && oxygenLevel >= 0 && oxygenLevel <= 100);
    const tpOk = temperature === undefined || (typeof temperature === "number" && temperature >= 30 && temperature <= 45);
    const hrOk = heartRate === undefined || (typeof heartRate === "number" && heartRate >= 0 && heartRate <= 300);

    if (!bpOk || !bsOk || !oxOk || !tpOk || !hrOk) {
      return res.json({ code: 400, message: "参数不合法", data: null });
    }

    // 组装更新字段
    const $set: any = {
      bloodPressure,
      bloodSugar,
      oxygenLevel,
      temperature,
      heartRate,
    };
    if (name) $set.name = name;

    // upsert 档案并更新 vitals
    await ElderHealthArchive.updateOne(
      { elderID: elderId },
      {
        $setOnInsert: { elderID: elderId },
        $set,
      },
      { upsert: true }
    );

    const updated = await ElderHealthArchive.findOne({ elderID: elderId });
    return res.json({ code: 200, message: "保存成功", data: updated });
  } catch (error) {
    console.error("更新健康状态失败:", error);
    return res.status(500).json({ code: 500, message: "服务器错误", data: null });
  }
});