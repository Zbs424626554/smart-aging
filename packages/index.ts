// 导出共享工具
export * from './utils/request';

// 导出共享服务
export * from './services/auth.service';

// 导出共享组件
export * from './components/PrivateRoute';

// 导出认证页面
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

export { default as Login } from './pages/auth/Login';
export { default as Register } from './pages/auth/Register'; 

// 导出主路由组件
export { default as MainRouter } from './routes/MainRouter';