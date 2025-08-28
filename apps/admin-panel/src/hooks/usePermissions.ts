// hooks/usePermissions.ts
import { useState, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
import { getPermissionsByRole, canAccessRoute, Permission, getAllAvailablePages, normalizePagePermissions } from '../config/permissions';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const currentRole = AuthService.getCurrentRole();
  const userPagePermissions = AuthService.getUserPermissions();

  useEffect(() => {
    // 若分配了 pagePermissions：严格按白名单渲染（唯一数据源）
    if (Array.isArray(userPagePermissions) && userPagePermissions.length > 0) {
      const normalizedPrefixes = normalizePagePermissions(userPagePermissions);
      const allPages = getAllAvailablePages();
      const pages = allPages.filter(page => {
        const normalizedKey = page.key.startsWith('/') ? page.key.substring(1) : page.key;
        return normalizedPrefixes.some(prefix => normalizedKey === prefix || normalizedKey.startsWith(prefix + '/'));
      });
      setPermissions(pages);
      setLoading(false);
      return;
    }

    // 未分配 pagePermissions：退化为角色默认菜单
    const pages = getPermissionsByRole(currentRole);
    setPermissions(pages);
    setLoading(false);
  }, [currentRole, userPagePermissions]);

  // 已取消页面级拦截，统一返回 true
  const checkAccess = (_routePath: string): boolean => true;

  return {
    permissions,
    checkAccess,
    loading,
    role: currentRole
  };
}; 