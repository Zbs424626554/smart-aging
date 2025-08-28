import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/images');
fs.mkdirSync(uploadDir, { recursive: true });

// 配置 multer 存储
const storage = multer.diskStorage({
    destination: (_req: any, _file: any, cb: any) => {
        cb(null, uploadDir);
    },
    filename: (_req: any, file: any, cb: any) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname) || '.jpg';
        const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
        cb(null, `${timestamp}_${Math.floor(Math.random() * 100000)}_${base}${ext}`);
    }
});

const fileFilter: multer.Options['fileFilter'] = (_req: any, file: any, cb: any) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('仅支持图片文件'));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: Number(process.env.UPLOAD_MAX_SIZE || 5 * 1024 * 1024), // 默认 5MB
        files: Number(process.env.UPLOAD_MAX_FILES || 5)
    }
});

// 单文件上传：字段名 image
router.post('/image', upload.single('image'), (req: Request, res: Response) => {
    try {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) return res.status(400).json({ code: 400, message: '未接收到文件', data: null });
        const publicUrl = `/uploads/images/${file.filename}`;
        return res.json({
            code: 200,
            message: 'ok',
            data: {
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                url: publicUrl
            }
        });
    } catch (error: any) {
        return res.status(500).json({ code: 500, message: error.message || '上传失败', data: null });
    }
});

// 多文件上传：字段名 images
router.post('/images', upload.array('images'), (req: Request, res: Response) => {
    try {
        const files = ((req as any).files as Express.Multer.File[]) || [];
        const list = files.map((f) => ({
            filename: f.filename,
            originalName: f.originalname,
            size: f.size,
            mimetype: f.mimetype,
            url: `/uploads/images/${f.filename}`
        }));
        return res.json({ code: 200, message: 'ok', data: list });
    } catch (error: any) {
        return res.status(500).json({ code: 500, message: error.message || '上传失败', data: null });
    }
});

export default router;


