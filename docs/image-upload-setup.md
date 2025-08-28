# 图片上传功能配置指南

## 📋 功能概述

本文档说明如何配置和使用图片上传功能，该功能支持评价系统中的图片上传需求。

## 🛠️ 后端配置

### 1. 安装依赖

确保已安装必要的依赖包：

```bash
cd server
npm install multer @types/multer
```

### 2. 目录结构

系统会自动创建以下目录结构：

```
server/
  uploads/
    images/          # 上传的图片存储目录
```

### 3. API端点

#### 单个图片上传
```
POST /api/upload/image
Content-Type: multipart/form-data
Field: image (file)
```

#### 多个图片上传
```
POST /api/upload/images  
Content-Type: multipart/form-data
Field: images (file[])
```

#### 删除图片
```
DELETE /api/upload/image/:filename
```

#### 获取图片信息
```
GET /api/upload/image/:filename
```

### 4. 文件限制

- **文件类型**: JPG, PNG, GIF, WEBP
- **文件大小**: 最大 5MB
- **数量限制**: 最多 5 个文件

### 5. 响应格式

#### 成功上传响应
```json
{
  "success": true,
  "message": "图片上传成功",
  "data": {
    "filename": "1642234567890_123.jpg",
    "originalName": "photo.jpg", 
    "size": 1024000,
    "mimetype": "image/jpeg",
    "url": "http://localhost:3001/uploads/images/1642234567890_123.jpg"
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "message": "文件大小不能超过5MB"
}
```

## 💻 前端配置

### 1. 上传组件配置

```typescript
const uploadProps = {
  name: 'image',
  action: 'http://localhost:3001/api/upload/image',
  listType: 'picture-card',
  withCredentials: true, // 发送认证cookie
  beforeUpload: (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isLt5M = file.size / 1024 / 1024 < 5;
    
    if (!isImage) {
      message.error('只能上传图片文件');
      return false;
    }
    if (!isLt5M) {
      message.error('图片大小不能超过5MB');
      return false;
    }
    return true;
  },
  onChange: (info: any) => {
    if (info.file.status === 'done') {
      message.success('图片上传成功');
    } else if (info.file.status === 'error') {
      message.error('图片上传失败');
    }
  }
};
```

### 2. 使用示例

```tsx
import { Upload, Button, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';

const ImageUpload: React.FC = () => {
  return (
    <Upload {...uploadProps}>
      <div>
        <CameraOutlined />
        <div style={{ marginTop: 8 }}>上传图片</div>
      </div>
    </Upload>
  );
};
```

## 🔧 安全特性

### 1. 文件验证
- MIME类型检查
- 文件大小限制
- 文件数量限制
- 恶意文件过滤

### 2. 存储安全
- 随机文件名生成
- 目录遍历防护
- 访问权限控制

### 3. 认证授权
- 需要用户登录认证
- Cookie自动验证
- 上传权限检查

## 📁 文件管理

### 1. 文件命名规则

上传的文件会按以下规则重命名：
```
{timestamp}_{random}.{extension}
例: 1642234567890_123.jpg
```

### 2. 访问URL

上传成功的文件可通过以下URL访问：
```
http://localhost:3001/uploads/images/{filename}
```

### 3. 文件清理

可以通过以下方式清理无用文件：

#### 手动删除
```bash
# 删除7天前的文件
find server/uploads/images -name "*.jpg" -mtime +7 -delete
find server/uploads/images -name "*.png" -mtime +7 -delete
```

#### API删除
```javascript
fetch(`/api/upload/image/${filename}`, {
  method: 'DELETE',
  credentials: 'include'
});
```

## 🚨 故障排除

### 常见问题

#### 1. 404错误 - API不存在
**症状**: `POST http://localhost:3001/api/upload/image 404 (Not Found)`

**解决方案**:
- 确保已导入并注册上传路由
- 检查服务器是否正常启动
- 验证API路径是否正确

#### 2. 权限错误
**症状**: `403 Forbidden` 或认证失败

**解决方案**:
- 确保用户已登录
- 检查Cookie是否正确发送
- 验证认证中间件配置

#### 3. 文件大小错误
**症状**: `文件大小不能超过5MB`

**解决方案**:
- 压缩图片文件
- 调整服务器文件大小限制
- 检查前端文件验证逻辑

#### 4. 上传目录不存在
**症状**: 服务器内部错误

**解决方案**:
```bash
mkdir -p server/uploads/images
chmod 755 server/uploads/images
```

### 调试模式

启用调试日志：
```typescript
// 在upload.controller.ts中添加
console.log('Upload request:', req.file);
console.log('Upload directory:', path.join(__dirname, '../../uploads/images'));
```

## 🔄 环境变量配置

可选的环境变量配置：

```bash
# .env文件
UPLOAD_MAX_SIZE=5242880          # 5MB in bytes
UPLOAD_MAX_FILES=5               # 最多文件数
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_DIR=uploads/images        # 上传目录
```

## 📞 技术支持

如遇问题请检查：
1. 服务器端口是否正确 (默认3001)
2. 网络连接是否正常
3. 文件权限是否正确
4. 依赖包是否正确安装

---

**版本**: v1.0.0  
**更新时间**: 2024-01-15  
**维护团队**: 智慧养老平台技术团队






