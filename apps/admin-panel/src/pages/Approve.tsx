import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tabs,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Badge,
  Descriptions,
  Divider,
  Avatar,
  Image,
  Typography
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TeamOutlined,
  IdcardOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { ApiService } from '../services/ApiService';

const { Text } = Typography;
const { confirm } = Modal;
// 移除TabPane导入，使用现代items API

// 护工审核数据接口
interface NurseVerification {
  id: string;
  nurseId: string;
  nurseName: string;
  phone: string;
  idCard: string;
  certificateNo: string;
  certificateType: string;
  certificateImage: string;
  idCardFront: string;
  idCardBack: string;
  status: 'pending' | 'approved' | 'rejected';
  submitTime: string;
  reviewTime?: string;
  reviewBy?: string;
  rejectReason?: string;
}

// 家属绑定数据接口
interface FamilyBinding {
  id: string;
  familyId: string;
  familyName: string;
  elderlyId: string;
  elderlyName: string;
  relationship: string;
  status: 'pending' | 'approved' | 'rejected';
  submitTime: string;
  reviewTime?: string;
  reviewBy?: string;
  rejectReason?: string;
}

const Approve: React.FC = () => {
  // 状态
  const [activeKey, setActiveKey] = useState<string>('nurse');
  const [nurseVerifications, setNurseVerifications] = useState<NurseVerification[]>([]);
  const [familyBindings, setFamilyBindings] = useState<FamilyBinding[]>([]);
  const [selectedNurse, setSelectedNurse] = useState<NurseVerification | null>(null);
  const [selectedBinding, setSelectedBinding] = useState<FamilyBinding | null>(null);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [rejectModalVisible, setRejectModalVisible] = useState<boolean>(false);
  const [rejectForm] = Form.useForm();

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const api = ApiService.getInstance();

  const loadData = async () => {
    try {
      // 从后端读取 test.approves 集合
      const approvesRes: any = await api.get('/approves');
      const nv: NurseVerification[] = (approvesRes?.data || []).map((d: any) => ({
        id: String(d.id || d._id),
        nurseId: String(d.nurseId || ''),
        nurseName: d.nurseName || '—',
        phone: d.phone || '—',
        idCard: d.idCard || '—',
        certificateNo: d.certificateNo || '—',
        certificateType: d.certificateType || '—',
        certificateImage: d.certificateImage || '',
        idCardFront: d.idCardFront || '',
        idCardBack: d.idCardBack || '',
        status: d.status || 'pending',
        submitTime: d.submitTime || '-',
        reviewTime: d.reviewTime,
        reviewBy: d.reviewBy,
        rejectReason: d.rejectReason,
      }));

      // 家属绑定仍然占位（如后端提供再替换）
      const fb: FamilyBinding[] = [];

      setNurseVerifications(nv);
      setFamilyBindings(fb);
    } catch (error) {
      console.error('加载审核数据失败:', error);
      setNurseVerifications([]);
      setFamilyBindings([]);
    }
  };

  // 显示护工审核详情
  const showNurseDetail = (nurse: NurseVerification) => {
    setSelectedNurse(nurse);
    setDetailVisible(true);
  };

  // 显示绑定详情
  const showBindingDetail = (binding: FamilyBinding) => {
    setSelectedBinding(binding);
    setDetailVisible(true);
  };

  // 显示拒绝原因对话框
  const showRejectModal = (type: 'nurse' | 'family', record: NurseVerification | FamilyBinding) => {
    if (type === 'nurse') {
      setSelectedNurse(record as NurseVerification);
      setSelectedBinding(null);
    } else {
      setSelectedBinding(record as FamilyBinding);
      setSelectedNurse(null);
    }
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  // 处理拒绝
  const handleReject = () => {
    rejectForm.validateFields().then(values => {
      if (selectedNurse) {
        // 处理护工拒绝 -> 调用后端
        api.post(`/approves/${selectedNurse.id}/reject`, { reason: values.reason }).then(() => {
          setNurseVerifications(prevState =>
            prevState.map(nurse =>
              nurse.id === selectedNurse.id
                ? {
                  ...nurse,
                  status: 'rejected',
                  reviewTime: new Date().toLocaleString(),
                  reviewBy: '当前管理员',
                  rejectReason: values.reason
                }
                : nurse
            )
          );
          message.success('已拒绝护工认证申请');
        });
      } else if (selectedBinding) {
        // 处理绑定拒绝
        setFamilyBindings(prevState =>
          prevState.map(binding =>
            binding.id === selectedBinding.id
              ? {
                ...binding,
                status: 'rejected',
                reviewTime: new Date().toLocaleString(),
                reviewBy: '当前管理员',
                rejectReason: values.reason
              }
              : binding
          )
        );
        message.success('已拒绝家属绑定申请');
      }
      setRejectModalVisible(false);
    });
  };

  // 处理批准
  const handleApprove = (type: 'nurse' | 'family', record: NurseVerification | FamilyBinding) => {
    confirm({
      title: '确认审核通过',
      icon: <ExclamationCircleOutlined />,
      content: type === 'nurse' ? '确定通过该护工的认证申请吗？' : '确定通过该家属绑定申请吗？',
      onOk() {
        if (type === 'nurse') {
          // 处理护工批准 -> 调用后端
          api.post(`/approves/${(record as NurseVerification).id}/approve`).then(() => {
            setNurseVerifications(prevState =>
              prevState.map(nurse =>
                nurse.id === record.id
                  ? {
                    ...nurse,
                    status: 'approved',
                    reviewTime: new Date().toLocaleString(),
                    reviewBy: '当前管理员'
                  }
                  : nurse
              )
            );
            message.success('已通过护工认证申请');
          });
        } else {
          // 处理绑定批准
          setFamilyBindings(prevState =>
            prevState.map(binding =>
              binding.id === record.id
                ? {
                  ...binding,
                  status: 'approved',
                  reviewTime: new Date().toLocaleString(),
                  reviewBy: '当前管理员'
                }
                : binding
            )
          );
          message.success('已通过家属绑定申请');
        }
      }
    });
  };

  // 护工审核表格列定义
  const nurseColumns = [
    {
      title: '护工姓名',
      dataIndex: 'nurseName',
      key: 'nurseName'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '证书类型',
      dataIndex: 'certificateType',
      key: 'certificateType'
    },
    {
      title: '证书编号',
      dataIndex: 'certificateNo',
      key: 'certificateNo'
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = '未知';
        if (status === 'pending') {
          color = 'processing';
          text = '待审核';
        } else if (status === 'approved') {
          color = 'success';
          text = '已通过';
        } else if (status === 'rejected') {
          color = 'error';
          text = '已拒绝';
        }
        return <Badge status={color as any} text={text} />;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: NurseVerification) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showNurseDetail(record)}
          >
            查看详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleApprove('nurse', record)}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => showRejectModal('nurse', record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  // 家属绑定表格列定义
  const bindingColumns = [
    {
      title: '家属姓名',
      dataIndex: 'familyName',
      key: 'familyName'
    },
    {
      title: '老人姓名',
      dataIndex: 'elderlyName',
      key: 'elderlyName'
    },
    {
      title: '关系',
      dataIndex: 'relationship',
      key: 'relationship',
      render: (relationship: string) => <Tag color="blue">{relationship}</Tag>
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = '未知';
        if (status === 'pending') {
          color = 'processing';
          text = '待审核';
        } else if (status === 'approved') {
          color = 'success';
          text = '已通过';
        } else if (status === 'rejected') {
          color = 'error';
          text = '已拒绝';
        }
        return <Badge status={color as any} text={text} />;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FamilyBinding) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showBindingDetail(record)}
          >
            查看详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleApprove('family', record)}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => showRejectModal('family', record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="approve-page">
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SafetyOutlined style={{ marginRight: 8 }} />
            <span>审核控制中心</span>
          </div>
        }
      >
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[
            {
              key: 'nurse',
              label: (
                <span>
                  <IdcardOutlined />
                  护工资质审核
                  <Badge
                    count={nurseVerifications.filter(n => n.status === 'pending').length}
                    style={{ marginLeft: 8 }}
                  />
                </span>
              ),
              children: (
                <Table
                  columns={nurseColumns}
                  dataSource={nurseVerifications}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              )
            },
            {
              key: 'family',
              label: (
                <span>
                  <TeamOutlined />
                  家属绑定审核
                  <Badge
                    count={familyBindings.filter(b => b.status === 'pending').length}
                    style={{ marginLeft: 8 }}
                  />
                </span>
              ),
              children: (
                <Table
                  columns={bindingColumns}
                  dataSource={familyBindings}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              )
            }
          ]}
        />

        {/* 护工审核详情弹窗 */}
        <Modal
          title="护工资质审核详情"
          open={detailVisible && selectedNurse !== null}
          footer={[
            <Button key="back" onClick={() => setDetailVisible(false)}>
              关闭
            </Button>,
            selectedNurse?.status === 'pending' && (
              <Button
                key="approve"
                type="primary"
                onClick={() => {
                  setDetailVisible(false);
                  if (selectedNurse) {
                    handleApprove('nurse', selectedNurse);
                  }
                }}
              >
                通过审核
              </Button>
            ),
            selectedNurse?.status === 'pending' && (
              <Button
                key="reject"
                danger
                onClick={() => {
                  setDetailVisible(false);
                  if (selectedNurse) {
                    showRejectModal('nurse', selectedNurse);
                  }
                }}
              >
                拒绝
              </Button>
            )
          ]}
          onCancel={() => setDetailVisible(false)}
          width={800}
        >
          {selectedNurse && (
            <div>
              <Descriptions title="基本信息" bordered>
                <Descriptions.Item label="护工姓名">{selectedNurse.nurseName}</Descriptions.Item>
                <Descriptions.Item label="手机号码">{selectedNurse.phone}</Descriptions.Item>
                <Descriptions.Item label="身份证号">{selectedNurse.idCard}</Descriptions.Item>
                <Descriptions.Item label="证书类型">{selectedNurse.certificateType}</Descriptions.Item>
                <Descriptions.Item label="证书编号">{selectedNurse.certificateNo}</Descriptions.Item>
                <Descriptions.Item label="申请状态">
                  <Tag color={
                    selectedNurse.status === 'approved' ? 'green' :
                      selectedNurse.status === 'rejected' ? 'red' : 'blue'
                  }>
                    {selectedNurse.status === 'approved' ? '已通过' :
                      selectedNurse.status === 'rejected' ? '已拒绝' : '待审核'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="提交时间">{selectedNurse.submitTime}</Descriptions.Item>
                {selectedNurse.reviewTime && (
                  <Descriptions.Item label="审核时间">{selectedNurse.reviewTime}</Descriptions.Item>
                )}
                {selectedNurse.reviewBy && (
                  <Descriptions.Item label="审核人">{selectedNurse.reviewBy}</Descriptions.Item>
                )}
                {selectedNurse.rejectReason && (
                  <Descriptions.Item label="拒绝原因" span={3}>
                    {selectedNurse.rejectReason}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider>证件照片</Divider>

              <Row gutter={16}>
                <Col span={8}>
                  <Card title="身份证正面" variant="borderless">
                    <Image src={selectedNurse.idCardFront} alt="身份证正面" />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="身份证背面" variant="borderless">
                    <Image src={selectedNurse.idCardBack} alt="身份证背面" />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card title="资格证书" variant="borderless">
                    <Image src={selectedNurse.certificateImage} alt="资格证书" />
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* 家属绑定详情弹窗 */}
        <Modal
          title="家属绑定审核详情"
          open={detailVisible && selectedBinding !== null}
          footer={[
            <Button key="back" onClick={() => setDetailVisible(false)}>
              关闭
            </Button>,
            selectedBinding?.status === 'pending' && (
              <Button
                key="approve"
                type="primary"
                onClick={() => {
                  setDetailVisible(false);
                  if (selectedBinding) {
                    handleApprove('family', selectedBinding);
                  }
                }}
              >
                通过审核
              </Button>
            ),
            selectedBinding?.status === 'pending' && (
              <Button
                key="reject"
                danger
                onClick={() => {
                  setDetailVisible(false);
                  if (selectedBinding) {
                    showRejectModal('family', selectedBinding);
                  }
                }}
              >
                拒绝
              </Button>
            )
          ]}
          onCancel={() => setDetailVisible(false)}
          width={600}
        >
          {selectedBinding && (
            <div>
              <Descriptions title="绑定信息" bordered>
                <Descriptions.Item label="家属姓名">{selectedBinding.familyName}</Descriptions.Item>
                <Descriptions.Item label="家属ID">{selectedBinding.familyId}</Descriptions.Item>
                <Descriptions.Item label="老人姓名">{selectedBinding.elderlyName}</Descriptions.Item>
                <Descriptions.Item label="老人ID">{selectedBinding.elderlyId}</Descriptions.Item>
                <Descriptions.Item label="关系">{selectedBinding.relationship}</Descriptions.Item>
                <Descriptions.Item label="申请状态">
                  <Tag color={
                    selectedBinding.status === 'approved' ? 'green' :
                      selectedBinding.status === 'rejected' ? 'red' : 'blue'
                  }>
                    {selectedBinding.status === 'approved' ? '已通过' :
                      selectedBinding.status === 'rejected' ? '已拒绝' : '待审核'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="提交时间">{selectedBinding.submitTime}</Descriptions.Item>
                {selectedBinding.reviewTime && (
                  <Descriptions.Item label="审核时间">{selectedBinding.reviewTime}</Descriptions.Item>
                )}
                {selectedBinding.reviewBy && (
                  <Descriptions.Item label="审核人">{selectedBinding.reviewBy}</Descriptions.Item>
                )}
                {selectedBinding.rejectReason && (
                  <Descriptions.Item label="拒绝原因" span={3}>
                    {selectedBinding.rejectReason}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          )}
        </Modal>

        {/* 拒绝原因弹窗 */}
        <Modal
          title={selectedNurse ? "拒绝护工资质审核" : "拒绝家属绑定申请"}
          open={rejectModalVisible}
          onOk={handleReject}
          onCancel={() => setRejectModalVisible(false)}
        >
          <Form form={rejectForm}>
            <Form.Item
              name="reason"
              label="拒绝原因"
              rules={[{ required: true, message: '请输入拒绝原因' }]}
            >
              <Input.TextArea rows={4} placeholder="请详细说明拒绝该申请的原因" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default Approve; 