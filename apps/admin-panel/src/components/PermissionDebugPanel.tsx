import React from 'react';
import { Card, List, Tag, Typography } from 'antd';
import { usePermissions } from '../hooks/usePermissions';

const { Title, Text } = Typography;

// 权限调试面板（仅在开发环境中使用）
const PermissionDebugPanel: React.FC = () => {
  const { permissions, role } = usePermissions();
  
  // 仅在开发环境下显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card 
      style={{ marginBottom: 16 }} 
      size="small" 
      title={<Text strong>权限调试面板（仅开发环境可见）</Text>}
    >
      <div style={{ marginBottom: 8 }}>
        <Text>当前角色: <Tag color="blue">{role}</Tag></Text>
      </div>
      
      <List
        size="small"
        header={<Text strong>可访问的页面:</Text>}
        bordered
        dataSource={permissions}
        renderItem={item => (
          <List.Item>
            <Text>{item.label} ({item.key})</Text>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default PermissionDebugPanel; 