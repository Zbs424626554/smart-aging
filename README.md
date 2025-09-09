# 智慧养老综合服务平台

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.4.0-green.svg)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-blue.svg)](https://www.mongodb.com/atlas)

## 📋 项目概述

智慧养老综合服务平台是一个连接家庭用户（老人、家属）、护工（个人或机构）的桥梁，提供安全监控、服务匹配、支付保障，并由后台和AI进行支撑和优化。

### 🎯 核心目标
- **安全监控**: 为老人提供一键紧急呼叫功能
- **服务匹配**: 智能推荐合适的护工服务
- **支付保障**: 安全的在线支付和资金管理
- **健康管理**: 实时健康数据监测和预警
- **统一管理**: 后台管理系统进行全平台监管

## 🏗️ 技术架构

### 前端技术栈
- **React 18+** - 用户端应用框架
- **Vue 3.4.0** - 管理后台框架
- **TypeScript 5.x** - 类型安全
- **Vite** - 构建工具
- **Ant Design Mobile** - 移动端 UI 组件库
- **React Router DOM** - 路由管理
- **Axios** - HTTP客户端

### 后端技术栈
- **Node.js** - 运行环境
- **Express.js** - Web框架
- **TypeScript** - 类型安全
- **MongoDB** - 数据库
- **Mongoose** - ODM
- **JWT + Cookie** - 身份认证（支持多端口 SSO）

### 开发工具
- **ESLint** - 代码规范
- **Prettier** - 代码格式化
- **Husky** - Git Hooks
- **Lint-staged** - 暂存文件检查

## 📁 项目结构

```
smart-aging/
├── apps/                    # 前端应用
│   ├── elderly-app/        # 老人端 (React + Vite)
│   ├── family-app/         # 家属端 (React + Vite)
│   ├── nurse-app/          # 护工端 (React + Vite)
│   └── admin-panel/        # 管理后台 (React + Vite)
├── packages/               # 共享包（组件、服务、页面等）
├── server/                 # 后端服务 (Node.js + Express)
├── docs/                   # 项目文档
```

## 🚀 快速开始

### 环境要求
- **Node.js**: 18.0.0 或更高版本
- **npm**: 9.0.0 或更高版本
- **MongoDB**: 4.4 或更高版本

### 安装依赖
```bash
# 克隆项目
git clone <repository-url>
cd smart-aging
# 安装所有依赖
npm run install:all
```

### 启动开发环境
```bash
# 启动后端服务
npm run start:server
# 启动前端应用（分别启动）
npm run dev:elderly    # 老人端 http://localhost:5173
npm run dev:family     # 家属端 http://localhost:5174
npm run dev:nurse      # 护工端 http://localhost:5175
npm run dev:admin      # 管理后台 http://localhost:5176
```

### 端口分配
| 应用 | 端口 | 访问地址 |
|------|------|----------|
| 后端服务 | 3001 | http://localhost:3001 |
| 老人端 | 5173 | http://localhost:5173 |
| 家属端 | 5174 | http://localhost:5174 |
| 护工端 | 5175 | http://localhost:5175 |
| 管理后台 | 5176 | http://localhost:5176 |

## 🎨 主要功能特性

- **统一登录注册**：所有用户端共用一套登录注册系统，注册时选择角色，登录后根据角色自动跳转到对应端口首页。
- **Cookie SSO**：登录后 token 以 Cookie 形式存储，支持多端口自动登录。
- **路由守卫**：各端口通过 `/api/auth/profile` 校验登录状态和角色。
- **角色分流**：支持老人、家属、护工、管理员多角色分流。
- **健康管理、服务匹配、订单管理、紧急呼叫等核心业务功能**。

## 🔐 认证与权限
- **JWT + Cookie**：后端登录成功后将 token 写入 Cookie，前端 axios 配置 `withCredentials: true`，所有请求自动携带 Cookie。
- **角色权限**：elderly/family/nurse/admin
- **路由守卫**：基于角色的路由保护
- **API权限**：中间件验证 token 和角色

## 📚 相关文档
- [前端架构文档](./docs/frontend-architecture.md)
- [API接口文档](./docs/api-documentation.md)
- [数据库设计文档](./docs/database-design.md)
- [API接口摘要](./docs/api-summary.md)

## 🧪 测试
- **单元测试**: 组件、服务、工具函数测试
- **集成测试**: 路由、权限、API测试

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户。

---

**智慧养老综合服务平台** - 让科技温暖每一个家庭 🏠❤️ 