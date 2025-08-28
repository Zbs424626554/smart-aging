// API配置文件
export const API_CONFIG = {
  // 后端基础URL
  BASE_URL: 'http://localhost:3001/api',

  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    CREATE_ELDERLY: '/auth/create-elderly',
    PROFILE: '/auth/profile'
  },

  // 用户管理
  USERS: {
    GET_ELDERLY_LIST: '/users/elderly',
    GET_ALL_ELDERLY_USERS: '/users/role/elderly/all',
    GET_USER_BY_ID: (id: string) => `/users/elderly/${id}`,
    UPDATE_USER: (id: string) => `/users/${id}`,
    DELETE_USER: (id: string) => `/users/${id}`,
    GET_ALL_USERS: '/users',
    BIND_ELDERLY: '/users/bind-elderly',
    UNBIND_ELDERLY: (id: string) => `/users/unbind-elderly/${id}`,
  },

  // 健康数据
  HEALTH: {
    GET_LATEST_DATA: (elderlyId: string) => `/health-records/${elderlyId}/latest`,
    GET_HISTORY: (elderlyId: string) => `/health-records/${elderlyId}/history`,
    CREATE_RECORD: '/health-records',
    UPDATE_RECORD: (id: string) => `/health-records/${id}`,
    GET_STATS: (elderlyId: string) => `/health-records/${elderlyId}/stats`,
    GET_WARNINGS: (elderlyId: string) => `/health-records/${elderlyId}/warnings`
  },

  // 老人健康档案
  ELDER_HEALTH: {
    GET_ARCHIVE: (elderlyId: string) => `/elderhealth/${elderlyId}`,
    GET_ALL_ARCHIVES: '/elderhealth',
    CREATE_OR_UPDATE: '/elderhealth'
  },

  // 紧急情况
  EMERGENCY: {
    CREATE_ALERT: '/emergency',
    GET_ALERTS: '/emergency'
  }
};

// 请求超时时间（毫秒）
export const REQUEST_TIMEOUT = 10000;

// 分页默认值
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20
};
