import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order, IOrder } from '../models/order.model';
import { verifyToken } from '../utils/jwt';

const router = Router();

router.post('/addOrder',async(req,res)=>{
    const info=req.body
    console.log(info);
    await Order.create(info)
    res.send({
        code:200
    })
})

router.get('/getOrders',async(req,res)=>{
    let list=await Order.find()
    res.send({
        code:200,
        data:list
    })
})









function getUserIdFromReq(req: Request): string | null {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      const payload = verifyToken(token) as any;
      return payload?.id || null;
    }
    const cookieToken = (req as any).cookies?.token;
    if (cookieToken) {
      const payload = verifyToken(cookieToken) as any;
      return payload?.id || null;
    }
  } catch {}
  return null;
}

function toObjectIdOrNull(id: string | null): mongoose.Types.ObjectId | null {
  try {
    if (!id) return null;
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

// UI 层状态（保留你原来的 4 个）
type UiStatus = 'assigned' | 'processing' | 'completed' | 'cancelled';

// 映射：DB -> UI（按你现在的四态模型）
function mapDbToUiStatus(status: IOrder['status']): UiStatus {
  switch (status) {
    case 'in_progress':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'assigned':
    case 'published':
    default:
      return 'assigned';
  }
}

// 映射：UI -> DB（无取消态，收到 cancelled 时这里直接按 completed 处理，避免前端报错）
function mapUiToDbStatus(status: UiStatus): IOrder['status'] {
  switch (status) {
    case 'processing':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
      // 你的模型没有 cancelled，这里稳妥起见映射为 completed（如需别的逻辑，自行改）
      return 'completed';
    case 'assigned':
    default:
      // UI 的“可接单/已指派”统一落到 assigned
      return 'assigned';
  }
}

// 列出可接单（未分配护士且处于待处理/或已指派给我但未开始）
router.get('/available', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const nurseObjectId = toObjectIdOrNull(userId);

    const orQuery: any[] = [
      {
        status: { $in: ['published'] }, // 原来 pending -> published
        $or: [{ nurseId: { $exists: false } }, { nurseId: null }],
      },
    ];
    // 将“指派给我但未开始(assigned)”的订单也作为待接收显示
    if (nurseObjectId) {
      orQuery.push({ status: 'assigned', nurseId: nurseObjectId });
    }

    const orders = await Order.find({ $or: orQuery })
      // 原来按 orderTime 排序；模型无该字段，这里用创建时间
      .sort({ createdAt: -1 })
      .lean();

    const data = orders.map((o: any) => ({
      ...o,
      uiStatus: mapDbToUiStatus(o.status as IOrder['status']),
      id: o._id?.toString(),
    }));

    return res.json({ code: 200, message: 'ok', data });
  } catch (error) {
    return res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 列出我的订单（当前护士）
router.get('/my', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const nurseObjectId = toObjectIdOrNull(userId);
    if (!nurseObjectId) {
      return res.json({ code: 401, message: '未登录', data: null });
    }
    const orders = await Order.find({ nurseId: nurseObjectId })
      .sort({ createdAt: -1 }) // 同上，按创建时间
      .lean();

    const data = orders.map((o: any) => ({
      ...o,
      uiStatus: mapDbToUiStatus(o.status as IOrder['status']),
      id: o._id?.toString(),
    }));

    return res.json({ code: 200, message: 'ok', data });
  } catch (error) {
    return res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 把订单指派给自己（护士）
router.patch('/:id/assign-me', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const nurseObjectId = toObjectIdOrNull(userId);
    if (!nurseObjectId) {
      return res.json({ code: 401, message: '未登录', data: null });
    }
    const { id } = req.params;
    const order = await Order.findById(id).select('nurseId status');
    if (!order) {
      return res.json({ code: 404, message: '订单不存在', data: null });
    }

    // 只能在未分配时指派（nurseId 为空）
    if (order.nurseId) {
      return res.json({ code: 409, message: '订单已被分配', data: null });
    }

    // 设置为 assigned（原代码是 accepted）
    const updated = await Order.findByIdAndUpdate(
      id,
      { $set: { nurseId: nurseObjectId, status: 'assigned' as IOrder['status'] } },
      { new: true }
    ).lean();

    return res.json({ code: 200, message: 'ok', data: updated });
  } catch (error) {
    return res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 更新订单状态（UI层的四种状态）
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const nurseObjectId = toObjectIdOrNull(userId);
    if (!nurseObjectId) {
      return res.json({ code: 401, message: '未登录', data: null });
    }
    const { id } = req.params;
    const { status } = req.body as { status: UiStatus };
    if (!status) {
      return res.json({ code: 400, message: '缺少status参数', data: null });
    }

    const order = await Order.findById(id).select('nurseId actualStartTime actualEndTime status');
    if (!order) {
      return res.json({ code: 404, message: '订单不存在', data: null });
    }

    // 仅允许订单护士本人修改
    if (!order.nurseId || order.nurseId.toString() !== nurseObjectId.toString()) {
      return res.json({ code: 403, message: '无权限修改该订单', data: null });
    }

    const dbStatus: IOrder['status'] = mapUiToDbStatus(status);
    const update: any = { status: dbStatus };
    const now = new Date();

    // 开始服务时，补 actualStartTime
    if (dbStatus === 'in_progress' && !order.actualStartTime) {
      update.actualStartTime = now;
    }
    // 完成服务时，补 actualEndTime
    if (dbStatus === 'completed' && !order.actualEndTime) {
      update.actualEndTime = now;
    }

    const updated = await Order.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();

    return res.json({ code: 200, message: 'ok', data: updated });
  } catch (error) {
    return res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取订单详情
router.get('/detail/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).lean();
    if (!order) {
      return res.json({ code: 404, message: '订单不存在', data: null });
    }
    return res.json({ code: 200, message: 'ok', data: order });
  } catch (error) {
    return res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
