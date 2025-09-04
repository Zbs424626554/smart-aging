import React from "react";
import { Card, Button, Avatar, Tag } from "antd-mobile";
import {
  UserOutline,
  SetOutline,
  CloseOutline,
  RightOutline,
} from "antd-mobile-icons";
import styles from "./Profile.module.css";
import { useNavigate } from "react-router-dom";

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const userInfo = {
    name: "张女士",
    phone: "138****8888",
    avatar: "",
    memberLevel: "VIP会员",
    points: 1280,
    joinDate: "2023-01-15",
  };

  const menuItems = [
    {
      icon: <UserOutline />,
      title: "消息中心",
      subtitle: "查看系统消息和通知",
      action: () => {
        navigate("/message");
      },
    },
    {
      icon: <UserOutline />,
      title: "我的收藏",
      subtitle: "收藏的护工和服务",
      action: () => {},
    },
    {
      icon: <UserOutline />,
      title: "服务评价",
      subtitle: "查看历史评价",
      action: () => {},
    },
    {
      icon: <UserOutline />,
      title: "帮助中心",
      subtitle: "常见问题和客服",
      action: () => {},
    },
  ];

  const handleLogout = () => {
    // 退出登录
    navigate("/login");
  };

  return (
    <div className={styles.profile}>
      {/* 个人信息头部 */}
      <Card className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          <Avatar
            className={styles.profileAvatar}
            src={userInfo.avatar || ""}
          />
          <div className={styles.profileDetails}>
            <div className={styles.profileName}>{userInfo.name}</div>
            <div className={styles.profilePhone}>{userInfo.phone}</div>
            {/* <div className={styles.profileMembership}>
              <Tag color="primary">{userInfo.memberLevel}</Tag>
              <span className={styles.profilePoints}>
                积分: {userInfo.points}
              </span>
            </div> */}
          </div>
          <Button className={styles.editProfileBtn} size="small" fill="outline">
            编辑
          </Button>
        </div>
      </Card>

      {/* 会员信息 */}
      {/* <Card className={styles.membershipCard}>
        <div className={styles.membershipHeader}>
          <div className={styles.membershipTitle}>
            <UserOutline className={styles.membershipIcon} />
            <span>会员信息</span>
          </div>
          <RightOutline className={styles.arrowIcon} />
        </div>
        <div className={styles.membershipContent}>
          <div className={styles.membershipItem}>
            <div className={styles.itemLabel}>会员等级</div>
            <div className={styles.itemValue}>{userInfo.memberLevel}</div>
          </div>
          <div className={styles.membershipItem}>
            <div className={styles.itemLabel}>注册时间</div>
            <div className={styles.itemValue}>{userInfo.joinDate}</div>
          </div>
          <div className={styles.membershipItem}>
            <div className={styles.itemLabel}>累计积分</div>
            <div className={styles.itemValue}>{userInfo.points}</div>
          </div>
        </div>
      </Card> */}

      {/* 功能菜单 */}
      <Card className={styles.menuCard}>
        <div className={styles.menuList}>
          {menuItems.map((item, index) => (
            <div key={index} className={styles.menuItem} onClick={item.action}>
              <div className={styles.menuIcon}>{item.icon}</div>
              <div className={styles.menuContent}>
                <div className={styles.menuTitle}>{item.title}</div>
                <div className={styles.menuSubtitle}>{item.subtitle}</div>
              </div>
              <RightOutline className={styles.menuArrow} />
            </div>
          ))}
        </div>
      </Card>

      {/* 设置选项 */}
      <Card className={styles.settingsCard}>
        <div className={styles.settingsList}>
          <div className={styles.settingItem} onClick={() => {}}>
            <div className={styles.settingContent}>
              <div className={styles.settingTitle}>关于我们</div>
              <div className={styles.settingDesc}>了解更多信息</div>
            </div>
            <RightOutline className={styles.settingArrow} />
          </div>
          <div className={styles.settingItem} onClick={() => {}}>
            <div className={styles.settingContent}>
              <div className={styles.settingTitle}>隐私政策</div>
              <div className={styles.settingDesc}>保护您的隐私</div>
            </div>
            <RightOutline className={styles.settingArrow} />
          </div>
          <div className={styles.settingItem} onClick={() => {}}>
            <div className={styles.settingContent}>
              <div className={styles.settingTitle}>用户协议</div>
              <div className={styles.settingDesc}>服务条款</div>
            </div>
            <RightOutline className={styles.settingArrow} />
          </div>
        </div>
      </Card>

      {/* 退出登录 */}
      <div className={styles.logoutSection}>
        <Button
          className={styles.logoutButton}
          color="danger"
          fill="outline"
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </div>
    </div>
  );
};

export default Profile;
