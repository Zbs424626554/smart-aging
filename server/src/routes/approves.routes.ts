import { Router, Request, Response } from 'express';
import { Approve } from '../models';
import mongoose from 'mongoose';
import { verifyToken } from '../utils/jwt';

const router = Router();

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
    } catch { }
    return null;
}

// 列出资质审批记录（来自 test 数据库的 approves 集合）
router.get('/', async (req: Request, res: Response) => {
    try {
        const { status } = req.query as { status?: string };
        const query: any = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.status = status;
        }

        const docs = await Approve.find(query)
            .sort({ submitTime: -1 })
            .lean();

        const data = docs.map((d: any) => ({
            id: d._id?.toString?.() || String(d._id),
            nurseId: d.nurseId?.toString?.() || d.nurseId,
            nurseName: d.nurseName,
            phone: '—',
            idCard: d.idcard, // 注意：集合字段为 idcard，这里输出为 idCard 以适配前端
            certificateNo: d.certificateNumber || '—',
            certificateType: d.certificateType || '—',
            certificateImage: d.certificateImage || '',
            idCardFront: d.idCardFront || '',
            idCardBack: d.idCardBack || '',
            status: d.status,
            submitTime: d.submitTime ? new Date(d.submitTime).toLocaleString() : '-',
            reviewTime: d.reviewTime ? new Date(d.reviewTime).toLocaleString() : undefined,
            reviewBy: d.reviewBy ? d.reviewBy.toString() : undefined,
            rejectReason: d.rejectReason || undefined,
        }));

        return res.json({ code: 200, message: 'ok', data });
    } catch (error) {
        console.error('获取审批列表失败:', error);
        return res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// 提交资质认证申请
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = getUserIdFromReq(req);
        const body = req.body as any;
        const nurseName = body.nurseName;
        const idcard = body.idcard;
        const certificateImage = body.certificateImage;
        const idCardFront = body.idCardFront;
        const idCardBack = body.idCardBack;

        const doc = await Approve.create({
            ...(userId && { nurseId: new mongoose.Types.ObjectId(userId) }),
            ...(nurseName && { nurseName }),
            ...(idcard && { idcard }),
            ...(certificateImage && { certificateImage }),
            ...(idCardFront && { idCardFront }),
            ...(idCardBack && { idCardBack }),
            certificateType: 'both',
            status: 'pending',
            submitTime: new Date(),
        } as any);

        return res.json({ code: 200, message: 'ok', data: { id: doc._id?.toString?.() } });
    } catch (error: any) {
        console.error('提交审批失败:', error);
        console.error('错误详情:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            name: error.name
        });
        console.error('请求体:', req.body);
        console.error('用户ID:', getUserIdFromReq(req));
        if (error?.code === 11000) {
            return res.json({ code: 409, message: '该身份证已提交过申请', data: null });
        }
        return res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// 审核通过
router.patch('/:id/approve', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const reviewerId = getUserIdFromReq(req);
        const updated = await Approve.findByIdAndUpdate(
            id,
            { $set: { status: 'approved', reviewTime: new Date(), reviewBy: reviewerId ? new mongoose.Types.ObjectId(reviewerId) : undefined } },
            { new: true }
        ).lean();
        if (!updated) {
            return res.json({ code: 404, message: '记录不存在', data: null });
        }
        return res.json({ code: 200, message: 'ok', data: { id: id } });
    } catch (error) {
        console.error('审核通过失败:', error);
        return res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// 兼容POST方式的审核通过
router.post('/:id/approve', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const reviewerId = getUserIdFromReq(req);
        const updated = await Approve.findByIdAndUpdate(
            id,
            { $set: { status: 'approved', reviewTime: new Date(), reviewBy: reviewerId ? new mongoose.Types.ObjectId(reviewerId) : undefined } },
            { new: true }
        ).lean();
        if (!updated) {
            return res.json({ code: 404, message: '记录不存在', data: null });
        }
        return res.json({ code: 200, message: 'ok', data: { id: id } });
    } catch (error) {
        console.error('审核通过失败:', error);
        return res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// 审核拒绝
router.patch('/:id/reject', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body as { reason?: string };
        const reviewerId = getUserIdFromReq(req);
        const updated = await Approve.findByIdAndUpdate(
            id,
            { $set: { status: 'rejected', reviewTime: new Date(), reviewBy: reviewerId ? new mongoose.Types.ObjectId(reviewerId) : undefined, rejectReason: reason || '' } },
            { new: true }
        ).lean();
        if (!updated) {
            return res.json({ code: 404, message: '记录不存在', data: null });
        }
        return res.json({ code: 200, message: 'ok', data: { id: id } });
    } catch (error) {
        console.error('审核拒绝失败:', error);
        return res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// 兼容POST方式的审核拒绝
router.post('/:id/reject', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body as { reason?: string };
        const reviewerId = getUserIdFromReq(req);
        const updated = await Approve.findByIdAndUpdate(
            id,
            { $set: { status: 'rejected', reviewTime: new Date(), reviewBy: reviewerId ? new mongoose.Types.ObjectId(reviewerId) : undefined, rejectReason: reason || '' } },
            { new: true }
        ).lean();
        if (!updated) {
            return res.json({ code: 404, message: '记录不存在', data: null });
        }
        return res.json({ code: 200, message: 'ok', data: { id: id } });
    } catch (error) {
        console.error('审核拒绝失败:', error);
        return res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

// 获取单条审批详情
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const d: any = await (Approve as any).findById(id).lean();
        if (!d) {
            return res.json({ code: 404, message: '记录不存在', data: null });
        }
        const data = {
            id: d._id?.toString?.() || String(d._id),
            nurseId: d.nurseId?.toString?.() || d.nurseId,
            nurseName: d.nurseName,
            phone: '—',
            idCard: d.idcard,
            certificateNo: d.certificateNumber || '—',
            certificateType: d.certificateType || '—',
            certificateImage: d.certificateImage || '',
            idCardFront: d.idCardFront || '',
            idCardBack: d.idCardBack || '',
            status: d.status,
            submitTime: d.submitTime ? new Date(d.submitTime).toLocaleString() : '-',
            reviewTime: d.reviewTime ? new Date(d.reviewTime).toLocaleString() : undefined,
            reviewBy: d.reviewBy ? d.reviewBy.toString() : undefined,
            rejectReason: d.rejectReason || undefined,
        };
        return res.json({ code: 200, message: 'ok', data });
    } catch (error) {
        console.error('获取审批详情失败:', error);
        return res.status(500).json({ code: 500, message: '服务器错误', data: null });
    }
});

export default router;


