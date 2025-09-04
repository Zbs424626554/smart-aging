import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import {Popup, Space, Button,Form ,Input } from 'antd-mobile'
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons'
import axios from 'axios';
axios.defaults.baseURL='http://localhost:3001'
const Home: React.FC = () => {
  const navigate = useNavigate();
  const [visible,setvisible]=useState(false)
  const [Visible, setVisible] = useState(false)
  const handleFunctionClick = (type: string) => {
    // 功能点击处理
  };
  const [form]=Form.useForm()

  const handleQuickAction = (action: string) => {
    // 根据操作类型进行导航
    switch (action) {
      case 'elderly-management':
        navigate('/elderly');
        break;
      case 'health-data':
        navigate('/warnings');
        break;
      case 'nurse-service':
        navigate('/home/nurses');
        break;
      case 'order-management':
        navigate('/orders');
        break;
      case 'health-warning':
        navigate('/warnings');
        break;
      // case 'add-elderly':
      //   navigate('/elderly');
      //   break;
      case 'emergency-contact':
        // 可以导航到紧急联系页面或显示联系方式
        break;
      case 'emergency-call':
        // 紧急呼叫功能
        break;
      case 'health-monitor':
        navigate('/home/health');
        break;
    }
  };

  const quickActions = [
    {
      icon: <i className="fas fa-users"></i>,
      title: '老人管理',
      subtitle: '管理老人信息',
      action: 'elderly-management'
    },
    {
      icon: <i className="fas fa-heartbeat"></i>,
      title: '健康预警',
      subtitle: '查看健康状态',
      action: 'health-data'
    },
    {
      icon: <i className="fas fa-user-nurse"></i>,
      title: '发布需求',
      subtitle: '预约护工服务',
      action: 'nurse-service'
    },
    {
      icon: <i className="fas fa-clipboard-list"></i>,
      title: '消息中心',
      subtitle: '查看老人消息',
      action: 'order-management'
    },
  ];


  const onFinish =async (values: any) => {
    // Dialog.alert({
    //   content: <pre>{JSON.stringify(values, null, 2)}</pre>,
    // })
    console.log(JSON.stringify(values));
    let res = await axios.post("/api/users/adduser", values, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.data.code == 200) {
      console.log("添加成功", res.data.msg);
      setvisible(false)
      form.resetFields()
    } else {
      console.log("添加失败");
    }
  }
  return (
    <div>
      {/* 欢迎卡片 */}
      <div className={styles.welcomeCard}>
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeText}>
            <h2>早上好, 张女士</h2>
            <p>今天有2位老人的健康数据需要关注</p>
          </div>
          <div className={styles.welcomeAvatar}>
            <div className={styles.avatarCircle}>张</div>
          </div>
        </div>
      </div>

      {/* 功能网格 */}
      <div className={styles.functionGrid}>
        {quickActions.map((action, index) => (
          <div
            key={index}
            className={styles.functionCard}
            onClick={() => handleQuickAction(action.action)}
          >
            <div
              className={styles.functionIcon}
              style={{
                background: action.title == "健康预警" ? "red" : "#0077C2",
              }}
            >
              {action.icon}
            </div>
            <div className={styles.functionTitle}>{action.title}</div>
            <div className={styles.functionSubtitle}>{action.subtitle}</div>
          </div>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className={styles["quick-actions"]}>
        <div className={styles["quick-actions-header"]}>
          <h3>快捷操作</h3>
        </div>
        {/* 弹窗 */}
        <Popup
          visible={visible}
          onMaskClick={() => {
            setvisible(false);
            form.resetFields()
          }}
          onClose={() => {
            setvisible(false);
          }}
          // closeOnMaskClick={false}
          bodyStyle={{ height: "50vh" }}
        >
          <Form
            name="form"
            form={form}
            onFinish={onFinish}
            footer={
              <div style={{textAlign:'center'}}>
                <Button style={{marginBottom:'10px'}} block type="submit" color="primary" size="large">
                提交
              </Button>
              <span style={{color:'grey'}}>添加的老人会默认绑定到当前登录家属</span>
              </div>
            }
          >
            <Form.Item
              name="username"
              label="姓名"
              rules={[{ required: true, message: "姓名不能为空" }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item
            label='密码'
            name='password'
            extra={
              <div className={styles.eye}>
                {!Visible ? (
                  <EyeInvisibleOutline onClick={() => setVisible(true)} />
                ) : (
                  <EyeOutline onClick={() => setVisible(false)} />
                )}
              </div>
            }
          >
            <Input
              placeholder='请输入密码'
              clearable
              type={Visible ? 'text' : 'password'}
            />
          </Form.Item>

            <Form.Item
              name="phone"
              label="手机号"
              rules={[{ required: true, message: "手机号不能为空" }]}
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>

            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: "角色不能为空" }]}
            >
              <Input placeholder="请选择角色" />
            </Form.Item>


          </Form>
        </Popup>
        <div className={styles["quick-actions-list"]}>
          <div
            className={styles["action-item"]}
            onClick={() => setvisible(true)}
          >
            <div
              className={styles["action-icon"]}
              style={{ background: "#667eea" }}
            >
              <i className="fas fa-plus"></i>
            </div>
            <div className={styles["action-content"]}>
              <div className={styles["action-title"]}>添加老人</div>
              <div className={styles["action-subtitle"]}>绑定新的老人信息</div>
            </div>
            <div className={styles["action-arrow"]}>›</div>
          </div>

          <div
            className={styles["action-item"]}
            onClick={() => handleQuickAction("health-warning")}
          >
            <div
              className={styles["action-icon"]}
              style={{ background: "#ff6b6b" }}
            >
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className={styles["action-content"]}>
              <div className={styles["action-title"]}>健康预警</div>
              <div className={styles["action-subtitle"]}>查看异常提醒</div>
            </div>
            <div className={styles["action-arrow"]}>›</div>
          </div>

          <div
            className={styles["action-item"]}
            onClick={() => handleQuickAction("emergency-contact")}
          >
            <div
              className={styles["action-icon"]}
              style={{ background: "#4ecdc4" }}
            >
              <i className="fas fa-phone"></i>
            </div>
            <div className={styles["action-content"]}>
              <div className={styles["action-title"]}>紧急联系</div>
              <div className={styles["action-subtitle"]}>一键联系护工</div>
            </div>
            <div className={styles["action-arrow"]}>›</div>
          </div>
        </div>
      </div>

      {/* 健康提醒 */}
      <div className={styles["health-reminder"]}>
        <div className={styles["reminder-header"]}>
          <h3>今日健康提醒</h3>
          <div className={styles["reminder-count"]}>2</div>
        </div>
        <div className={styles["reminder-list"]}>
          <div className={styles["reminder-item"]}>
            <div
              className={styles["reminder-icon"]}
              style={{ color: "#ff6b6b" }}
            >
              <i className="fas fa-heartbeat"></i>
            </div>
            <div className={styles["reminder-content"]}>
              <div className={styles["reminder-title"]}>张爷爷血压偏高</div>
              <div className={styles["reminder-desc"]}>
                建议及时关注血压变化
              </div>
            </div>
            <div className={styles["reminder-time"]}>10分钟前</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;