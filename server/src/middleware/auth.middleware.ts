import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../utils/jwt';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // 从 cookie 中获取 token
  let token = req.cookies?.token as string | undefined;
  // 兜底：从 Authorization Bearer 读取
  if (!token) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      token = auth.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  try {
    // 使用你现有的 verifyToken 函数
    const decoded = verifyToken(token) as any;
    (req as any).userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: '无效的认证令牌' });
  }
};