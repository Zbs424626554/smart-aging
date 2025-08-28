import { useState, useEffect } from "react";
import {
  Popup,
  List,
  SearchBar,
  Button,
  Avatar,
  Badge,
  SpinLoading,
  Empty,
  Tabs,
  Toast,
} from "antd-mobile";
import { UserService, type User } from "../services/user.service";

interface UserSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export default function UserSelector({
  visible,
  onClose,
  onSelectUser,
}: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeRole, setActiveRole] = useState("all");

  // 获取当前用户信息
  const getCurrentUser = () => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        return JSON.parse(userInfo);
      } catch {
        return null;
      }
    }
    return null;
  };

  // 加载用户列表
  const loadUsers = async (role = "all", search = "") => {
    try {
      setLoading(true);
      let response;

      if (search) {
        // 搜索用户
        response = await UserService.searchUsers(search, {
          role: role === "all" ? undefined : role,
          limit: 100,
        });
      } else if (role === "all") {
        // 获取所有用户
        response = await UserService.getUsers({
          status: true,
          limit: 100,
        });
      } else {
        // 根据角色获取用户
        response = await UserService.getUsersByRole(role, {
          limit: 100,
        });
      }

      // 过滤掉当前用户
      const currentUser = getCurrentUser();
      const filteredUsers = response.list.filter(
        (user) => user.username !== currentUser?.username
      );

      setUsers(filteredUsers);
    } catch (error) {
      console.error("加载用户列表失败:", error);
      Toast.show("加载用户列表失败");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
    loadUsers(activeRole, value);
  };

  // 处理角色标签切换
  const handleRoleChange = (role: string) => {
    setActiveRole(role);
    setSearchValue("");
    loadUsers(role);
  };

  // 处理用户选择
  const handleUserSelect = (user: User) => {
    onSelectUser(user);
    onClose();
  };

  // 获取角色显示名称
  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      elderly: "老人",
      family: "家属",
      nurse: "护士",
      admin: "管理员",
    };
    return roleMap[role] || role;
  };

  // 获取角色颜色
  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      elderly: "#1890ff",
      family: "#52c41a",
      nurse: "#722ed1",
      admin: "#fa8c16",
    };
    return colorMap[role] || "#666";
  };

  // 获取角色图标
  const getRoleIcon = (role: string) => {
    const iconMap: Record<string, string> = {
      elderly: "👴",
      family: "👨‍👩‍👧‍👦",
      nurse: "👩‍⚕️",
      admin: "👨‍💼",
    };
    return iconMap[role] || "👤";
  };

  // 组件挂载时加载用户列表
  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible]);

  const tabs = [
    { key: "all", title: "全部" },
    { key: "elderly", title: "老人" },
    { key: "family", title: "家属" },
    { key: "nurse", title: "护士" },
    { key: "admin", title: "管理员" },
  ];

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{
        height: "70vh",
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
      }}
    >
      <div style={{ padding: "16px 0" }}>
        {/* 标题栏 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 16px 16px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
            选择联系人
          </h3>
          <Button
            size="small"
            fill="none"
            onClick={onClose}
            style={{ color: "#999" }}
          >
            取消
          </Button>
        </div>

        {/* 搜索框 */}
        <div style={{ padding: "16px" }}>
          <SearchBar
            placeholder="搜索用户名、姓名或手机号"
            value={searchValue}
            onChange={handleSearch}
            style={{
              "--border-radius": "8px",
              "--background": "#f5f5f5",
            }}
          />
        </div>

        {/* 角色标签 */}
        <div style={{ padding: "0 16px 16px" }}>
          <Tabs
            activeKey={activeRole}
            onChange={handleRoleChange}
            style={{
              "--content-padding": "0",
              "--title-font-size": "14px",
            }}
          >
            {tabs.map((tab) => (
              <Tabs.Tab title={tab.title} key={tab.key} />
            ))}
          </Tabs>
        </div>

        {/* 用户列表 */}
        <div style={{ height: "calc(70vh - 200px)", overflow: "auto" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <SpinLoading color="primary" />
            </div>
          ) : users.length === 0 ? (
            <Empty
              style={{ padding: "60px 0" }}
              imageStyle={{ width: 100 }}
              description={searchValue ? "没有找到相关用户" : "暂无用户"}
            />
          ) : (
            <List style={{ "--border-top": "none", "--border-bottom": "none" }}>
              {users.map((user) => (
                <List.Item
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f5f5f5",
                  }}
                  prefix={
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: getRoleColor(user.role),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        color: "#fff",
                      }}
                    >
                      {getRoleIcon(user.role)}
                    </div>
                  }
                  extra={
                    <Badge
                      content={getRoleName(user.role)}
                      style={{
                        padding: "6px",
                        "--right": "0",
                        "--top": "0",
                        "--background": getRoleColor(user.role),
                      }}
                    />
                  }
                >
                  <div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "500",
                        color: "#333",
                        marginBottom: "4px",
                      }}
                    >
                      {user.realname}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#999",
                        marginBottom: "2px",
                      }}
                    >
                      用户名: {user.username}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#999",
                      }}
                    >
                      手机: {user.phone}
                    </div>
                  </div>
                </List.Item>
              ))}
            </List>
          )}
        </div>
      </div>
    </Popup>
  );
}
