import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order, IOrder } from '../models/order.model';
import { verifyToken } from '../utils/jwt';

const router = Router();

function getUserIdFromReq(req: Request): string | null {
    try {
        // Prefer Authorization header (Bearer)
        const auth = req.headers.authorization;
        if (auth && auth.startsWith('Bearer ')) {
            const token = auth.slice(7);
            const payload = verifyToken(token) as any;
            return payload?.id || null;
        }
        // Fallback to cookie token
        const cookieToken = (req as any).cookies?.token;
        if (cookieToken) {
            const payload = verifyToken(cookieToken) as any;
            return payload?.id || null;
        }
    } catch { }
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

type UiStatus = 'assigned' | 'processing' | 'completed' | 'cancelled';

function mapDbToUiStatus(status: IOrder['status']): UiStatus {
    switch (status) {
        case 'started':
            return 'processing';
        case 'completed':
        case 'confirmed':
            return 'completed';
        case 'canceled':
            return 'cancelled';
        case 'pending':
        case 'accepted':
        default:
            return 'assigned';
    }
}

function mapUiToDbStatus(status: UiStatus): IOrder['status'] {
    switch (status) {
        case 'processing':
            return 'started';
        case 'completed':
            return 'completed';
        case 'cancelled':
            return 'canceled';
        case 'assigned':
        default:
            return 'accepted';
    }
}

// 列出可接单（未分配护士且处于待处理）
router.get('/available', async (req: Request, res: Response) => {
    try {
        const userId = getUserIdFromReq(req);
        const nurseObjectId = toObjectIdOrNull(userId);
        const orQuery: any[] = [
            {
                status: { $in: ['pending'] },
                $or: [{ nurseId: { $exists: false } }, { nurseId: null }],
            },
        ];
        // 将“指派给我但未开始(accepted)”的订单也作为待接收显示
        if (nurseObjectId) {
            orQuery.push({ status: 'accepted', nurseId: nurseObjectId });
        }

        const orders = await Order.find({ $or: orQuery })
            .sort({ orderTime: -1 })
            .lean();

        const data = orders.map((o) => ({
            ...o,
            uiStatus: mapDbToUiStatus(o.status),
            id: (o as any)._id?.toString(),
        }));

        return res.json({ code: 200, message: 'ok', data });
    } catch (error) {
        return res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// 获取订单详情（路由需放在 /my 之后，避免被 '/:id' 吃掉；并限制为 24位hex）
// 注意：此处仅移除原位置，详细路由在文件底部定义

// 列出我的订单（当前护士）
router.get('/my', async (req: Request, res: Response) => {
    try {
        const userId = getUserIdFromReq(req);
        const nurseObjectId = toObjectIdOrNull(userId);
        if (!nurseObjectId) {
            return res.json({ code: 401, message: '未登录', data: null });
        }
        const orders = await Order.find({ nurseId: nurseObjectId })
            .sort({ orderTime: -1 })
            .lean();

        const data = orders.map((o) => ({
            ...o,
            uiStatus: mapDbToUiStatus(o.status),
            id: (o as any)._id?.toString(),
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

        // 只能在未分配时指派
        if (order.nurseId) {
            return res.json({ code: 409, message: '订单已被分配', data: null });
        }

        // 使用原子更新，避免因其他字段缺失触发验证失败
        const updated = await Order.findByIdAndUpdate(
            id,
            { $set: { nurseId: nurseObjectId, status: 'accepted' } },
            { new: true }
        ).lean();

        const data = {
            ...updated,
            uiStatus: mapDbToUiStatus(updated!.status as IOrder['status']),
            id: (updated as any)?._id?.toString(),
        };
        return res.json({ code: 200, message: 'ok', data });
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

        const order = await Order.findById(id).select('nurseId startTime');
        if (!order) {
            return res.json({ code: 404, message: '订单不存在', data: null });
        }

        // 仅允许订单护士本人修改
        if (!order.nurseId || order.nurseId.toString() !== nurseObjectId.toString()) {
            return res.json({ code: 403, message: '无权限修改该订单', data: null });
        }

        const dbStatus = mapUiToDbStatus(status);
        const update: any = { status: dbStatus };
        const now = new Date();
        if (dbStatus === 'started' && !order.startTime) {
            update.startTime = now;
        }
        if (dbStatus === 'completed') {
            update.endTime = now;
        }

        const updated = await Order.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();

        const data = {
            ...updated,
            uiStatus: mapDbToUiStatus(updated!.status as IOrder['status']),
            id: (updated as any)?._id?.toString(),
        };
        return res.json({ code: 200, message: 'ok', data });
    } catch (error) {
        return res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// 获取订单详情（避免与 /my、/available 冲突，使用明确前缀）
router.get('/detail/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id).lean();
        if (!order) {
            return res.json({ code: 404, message: '订单不存在', data: null });
        }
        const data = {
            ...order,
            uiStatus: mapDbToUiStatus(order.status),
            id: (order as any)?._id?.toString(),
        };
        return res.json({ code: 200, message: 'ok', data });
    } catch (error) {
        return res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

export default router;


