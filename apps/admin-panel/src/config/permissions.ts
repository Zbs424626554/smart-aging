// 定义不同角色可访问的菜单项
export interface Permission {
  key: string;     // 路由路径
  label: string;   // 菜单名称
  apiEndpoints?: string[];  // 关联的API端点
}

export type RolePermissions = Record<string, Permission[]>;

// 后端权限码到前端页面路由前缀的映射
// 注意：这里的值不以斜杠开头，便于与现有比较逻辑对齐
const backendPermissionToRoutePrefix: Record<string, string> = {
  // 新旧混合权限码做兼容（例如 user_view 等简写）
  user_view: 'dashboard/users',
  service_manage: 'dashboard/services',
  order_view: 'dashboard/orders',
  order_intervene: 'dashboard/disputes',
  review_view: 'dashboard/reviews-complaints',
  complaint_process: 'dashboard/reviews-complaints',
  support_manage: 'dashboard/support-tickets',
  content_view: 'dashboard/announcements',
  // 用户与审核
  user_manage: 'dashboard/users',
  user_audit: 'dashboard/approve',
  // 订单/纠纷
  order_manage: 'dashboard/orders',
  // 服务/内容
  // 注意：避免重复键，已保留上方简写，不在此处重复 service_manage/support_manage
  content_manage: 'dashboard/announcements',
  // 评价/投诉/工单
  review_manage: 'dashboard/reviews-complaints',
  complaint_manage: 'dashboard/reviews-complaints',
  // support_manage 已在上方简写映射
  // 统计/系统
  statistics_view: 'dashboard/data-summary',
  system_config: 'dashboard/settings',
};

// 规范化后端返回的页面权限，转为前端路由前缀集合（不带开头的斜杠）
export const normalizePagePermissions = (userPermissions?: string[]): string[] => {
  if (!userPermissions || userPermissions.length === 0) return [];
  const mapped = userPermissions
    .map((perm) => backendPermissionToRoutePrefix[perm] || perm)
    .filter(Boolean);
  // 确保始终包含仪表盘
  if (!mapped.includes('dashboard')) {
    mapped.unshift('dashboard');
  }
  return Array.from(new Set(mapped));
};

// 定义各角色可访问的菜单权限
export const rolePermissions: RolePermissions = {
  // 超级管理员可以访问所有菜单
  admin_super: [
    { key: '/dashboard', label: '仪表盘' },
    {
      key: '/dashboard/users',
      label: '用户管理',
      apiEndpoints: [
        'GET /api/admin/user/list',
        'POST /api/admin/user/audit',
        'POST /api/admin/user/add',
        'POST /api/admin/user/status',
        'POST /api/admin/user/role',
        'POST /api/admin/user/delete',
        // 统计接口用于页面头部数据
        'GET /api/admin/statistics'
      ]
    },
    {
      key: '/dashboard/permissions',
      label: '权限管理',
      apiEndpoints: ['GET /api/admin/user/list', 'POST /api/admin/user/permissions']
    },
    {
      key: '/dashboard/approve',
      label: '审核控制',
      apiEndpoints: [
        'POST /api/admin/user/audit',
        'GET /api/approves',
        'GET /api/approves/*',
        'POST /api/approves/*'
      ]
    },
    {
      key: '/dashboard/orders',
      label: '订单管理',
      apiEndpoints: ['GET /api/admin/order/list']
    },
    {
      key: '/dashboard/payments',
      label: '支付结算',
      apiEndpoints: ['GET /api/admin/order/list']
    },
    {
      key: '/dashboard/services',
      label: '服务管理',
      apiEndpoints: ['GET /api/admin/service/list']
    },
    {
      key: '/dashboard/disputes',
      label: '纠纷处理',
      apiEndpoints: ['GET /api/admin/support/list']
    },
    {
      key: '/dashboard/reviews-complaints',
      label: '评价与投诉',
      apiEndpoints: ['GET /api/admin/review/list', 'GET /api/admin/support/list']
    },
    {
      key: '/dashboard/data-summary',
      label: '数据汇总',
      apiEndpoints: ['GET /api/admin/statistics']
    },
    {
      key: '/dashboard/settings',
      label: '系统设置',
      apiEndpoints: ['POST /api/admin/config']
    },
    {
      key: '/dashboard/announcements',
      label: '内容管理',
      apiEndpoints: ['POST /api/admin/announcement']
    },
    {
      key: '/dashboard/support-tickets',
      label: '客服工单',
      apiEndpoints: ['GET /api/admin/support/list']
    },
    {
      key: '/dashboard/config',
      label: '基础配置',
      apiEndpoints: ['POST /api/admin/config']
    },
  ],

  // 顶层 admin（未分配子角色时）：默认只给仪表盘，实际导航由 pagePermissions 控制
  admin: [
    { key: '/dashboard', label: '仪表盘' },
  ],

  // 客服主管
  cs_manager: [
    { key: '/dashboard', label: '仪表盘' },
    {
      key: '/dashboard/users',
      label: '用户管理',
      apiEndpoints: ['GET /api/admin/user/list']
    },
    {
      key: '/dashboard/services',
      label: '服务管理',
      apiEndpoints: ['GET /api/admin/service/list']
    },
    {
      key: '/dashboard/orders',
      label: '订单管理',
      apiEndpoints: ['GET /api/admin/order/list']
    },
    {
      key: '/dashboard/disputes',
      label: '纠纷处理',
      apiEndpoints: ['GET /api/admin/support/list']
    },
    {
      key: '/dashboard/reviews-complaints',
      label: '评价与投诉',
      apiEndpoints: ['GET /api/admin/review/list', 'GET /api/admin/support/list']
    },
    {
      key: '/dashboard/support-tickets',
      label: '客服工单',
      apiEndpoints: ['GET /api/admin/support/list']
    },
    {
      key: '/dashboard/announcements',
      label: '内容管理',
      apiEndpoints: ['POST /api/admin/announcement']
    },
  ],

  // 审核员
  reviewer: [
    { key: '/dashboard', label: '仪表盘' },
    {
      key: '/dashboard/approve',
      label: '审核控制',
      apiEndpoints: [
        'POST /api/admin/user/audit',
        'GET /api/approves',
        'GET /api/approves/*',
        'POST /api/approves/*'
      ]
    },
    {
      key: '/dashboard/reviews-complaints',
      label: '评价与投诉',
      apiEndpoints: ['GET /api/admin/review/list']
    },
    {
      key: '/dashboard/support-tickets',
      label: '客服工单',
      apiEndpoints: ['GET /api/admin/support/list']
    },
  ],

  // 财务
  finance: [
    { key: '/dashboard', label: '仪表盘' },
    {
      key: '/dashboard/payments',
      label: '支付结算',
      apiEndpoints: ['GET /api/admin/order/list']
    },
    {
      key: '/dashboard/data-summary',
      label: '数据汇总',
      apiEndpoints: ['GET /api/admin/statistics']
    },
    {
      key: '/dashboard/orders',
      label: '订单管理',
      apiEndpoints: ['GET /api/admin/order/list']
    },
  ],

  // 内容管理员
  content_manager: [
    { key: '/dashboard', label: '仪表盘' },
    {
      key: '/dashboard/announcements',
      label: '内容管理',
      apiEndpoints: ['POST /api/admin/announcement']
    },
    {
      key: '/dashboard/services',
      label: '服务管理',
      apiEndpoints: ['GET /api/admin/service/list']
    },
  ],

  // 系统管理员
  system_admin: [
    { key: '/dashboard', label: '仪表盘' },
    {
      key: '/dashboard/users',
      label: '用户管理',
      apiEndpoints: [
        'GET /api/admin/user/list',
        'POST /api/admin/user/add',
        'POST /api/admin/user/status',
        'POST /api/admin/user/role',
        'POST /api/admin/user/delete'
      ]
    },
    {
      key: '/dashboard/permissions',
      label: '权限管理',
      apiEndpoints: ['GET /api/admin/user/list', 'POST /api/admin/user/permissions']
    },
    {
      key: '/dashboard/settings',
      label: '系统设置',
      apiEndpoints: ['POST /api/admin/config']
    },
    {
      key: '/dashboard/config',
      label: '基础配置',
      apiEndpoints: ['POST /api/admin/config']
    },
  ],

  // 默认角色（最小权限）
  default: [
    { key: '/dashboard', label: '仪表盘' },
  ]
};

// 获取指定角色可访问的菜单项
export const getPermissionsByRole = (role: string): Permission[] => {
  return rolePermissions[role] || rolePermissions.default;
};

// 检查指定角色是否可以访问特定路径
export const canAccessRoute = (role: string, routePath: string, _userPermissions?: string[]): boolean => {
  // 超级管理员放行
  if (role === 'admin_super') return true;
  const permissions = getPermissionsByRole(role);
  return permissions.some((p) => routePath.startsWith(p.key));
};

// 获取指定角色可访问的API端点
export const getApiEndpointsByRole = (role: string): string[] => {
  const permissions = getPermissionsByRole(role);
  const endpoints: string[] = [];

  permissions.forEach(permission => {
    if (permission.apiEndpoints) {
      endpoints.push(...permission.apiEndpoints);
    }
  });

  return [...new Set(endpoints)]; // 去重
};

// 获取所有可用页面路径
export const getAllAvailablePages = (): Permission[] => {
  return rolePermissions.admin_super;
}; 