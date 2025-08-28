import { ApiService } from '../services/ApiService';
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
  InputNumber,
  Select,
  message,
  Row,
  Col,
  Badge,
  Statistic,
  DatePicker,
  Tooltip,
  Descriptions
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  AccountBookOutlined,
  BankOutlined,
  PayCircleOutlined,
  TransactionOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { confirm } = Modal;

// 交易记录数据接口
interface Transaction {
  id: string;
  orderId: string;
  orderNo: string;
  paymentNo: string;
  amount: number;
  paymentMethod: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  paidAt?: string;
  refundedAt?: string;
  refundReason?: string;
  paymentType: 'payment' | 'refund';
  platformFee: number;
  nurseAmount: number;
}

// 佣金记录数据接口
interface Commission {
  id: string;
  nurseId: string;
  nurseName: string;
  orderId: string;
  orderNo: string;
  amount: number;
  rate: number;
  status: 'pending' | 'settled' | 'canceled';
  createdAt: string;
  settledAt?: string;
}

// 提现申请数据接口
interface Withdrawal {
  id: string;
  nurseId: string;
  nurseName: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  accountName: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectReason?: string;
}

const Payments: React.FC = () => {
  // 状态
  const [activeKey, setActiveKey] = useState<string>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [rejectModalVisible, setRejectModalVisible] = useState<boolean>(false);
  const [rejectForm] = Form.useForm();
  
  // 统计数据
  const [statistics, setStatistics] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    platformRevenue: 0,
    pendingWithdrawals: 0,
    withdrawalAmount: 0
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const api = ApiService.getInstance();

  const loadData = async () => {
    try {
      const txRes: any = await api.get('/admin/payments', { page: 1, pageSize: 10 });
      const wdRes: any = await api.get('/admin/withdrawals', { page: 1, pageSize: 10 });

      const txs: Transaction[] = (txRes?.data?.transactions || []).map((t: any) => ({
        id: String(t._id),
        orderId: String(t.orderId),
        orderNo: t.orderNo || '-',
        paymentNo: t.transactionId || '-',
        amount: t.amount || 0,
        paymentMethod: t.payMethod || 'unknown',
        status: t.status || 'pending',
        createdAt: t.createdAt ? new Date(t.createdAt).toLocaleString() : '-',
        paidAt: t.paidAt ? new Date(t.paidAt).toLocaleString() : undefined,
        paymentType: t.refundAmount ? 'refund' : 'payment',
        platformFee: t.platformFee || 0,
        nurseAmount: t.amount ? (t.amount - (t.platformFee || 0)) : 0,
      }));

      const wds: Withdrawal[] = (wdRes?.data?.withdrawals || []).map((w: any) => ({
        id: String(w._id),
        nurseId: String(w.userId),
        nurseName: w.userName || '-',
        amount: w.amount || 0,
        bankName: w.bankAccount?.bankName || '-',
        bankAccount: w.bankAccount?.accountNumber || '-',
        accountName: w.bankAccount?.name || '-',
        status: (w.status as any) || 'pending',
        createdAt: w.requestedAt ? new Date(w.requestedAt).toLocaleString() : '-',
        processedAt: w.processedAt ? new Date(w.processedAt).toLocaleString() : undefined,
        processedBy: w.processedBy || undefined,
        rejectReason: w.adminNotes || undefined,
      }));

      setTransactions(txs);
      setWithdrawals(wds);

      const successTxs = txs.filter(t => t.status === 'success' && t.paymentType === 'payment');
      const totalTransactions = successTxs.length;
      const totalAmount = successTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
      const platformRevenue = successTxs.reduce((sum, t) => sum + (t.platformFee || 0), 0);
      const pendingWithdrawals = wds.filter(w => w.status === 'pending').length;
      const withdrawalAmount = wds.filter(w => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0);

      setStatistics({ totalTransactions, totalAmount, platformRevenue, pendingWithdrawals, withdrawalAmount });
    } catch (error) {
      console.error('加载支付结算数据失败:', error);
      setTransactions([]);
      setWithdrawals([]);
      setStatistics({ totalTransactions: 0, totalAmount: 0, platformRevenue: 0, pendingWithdrawals: 0, withdrawalAmount: 0 });
    }
  };

  // 显示交易详情
  const showTransactionDetail = (record: Transaction) => {
    setSelectedTransaction(record);
    setSelectedWithdrawal(null);
    setDetailModalVisible(true);
  };

  // 显示提现详情
  const showWithdrawalDetail = (record: Withdrawal) => {
    setSelectedTransaction(null);
    setSelectedWithdrawal(record);
    setDetailModalVisible(true);
  };

  // 显示拒绝提现对话框
  const showRejectWithdrawalModal = (record: Withdrawal) => {
    setSelectedWithdrawal(record);
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  // 处理拒绝提现
  const handleRejectWithdrawal = () => {
    rejectForm.validateFields().then(values => {
      if (selectedWithdrawal) {
        setWithdrawals(prev => 
          prev.map(w => 
            w.id === selectedWithdrawal.id 
              ? { 
                  ...w, 
                  status: 'rejected', 
                  processedAt: new Date().toLocaleString(),
                  processedBy: '当前管理员',
                  rejectReason: values.reason
                } 
              : w
          )
        );
        message.success('已拒绝提现申请');
        setRejectModalVisible(false);
      }
    });
  };

  // 处理通过提现
  const handleApproveWithdrawal = (record: Withdrawal) => {
    confirm({
      title: '确认通过提现申请',
      icon: <ExclamationCircleOutlined />,
      content: `确定通过${record.nurseName}的${record.amount}元提现申请吗？`,
      onOk() {
        setWithdrawals(prev => 
          prev.map(w => 
            w.id === record.id 
              ? { 
                  ...w, 
                  status: 'approved', 
                  processedAt: new Date().toLocaleString(),
                  processedBy: '当前管理员'
                } 
              : w
          )
        );
        message.success('已通过提现申请');
      }
    });
  };

  // 完成提现操作
  const handleCompleteWithdrawal = (record: Withdrawal) => {
    confirm({
      title: '确认提现已打款',
      icon: <ExclamationCircleOutlined />,
      content: `确认已向${record.nurseName}的账户打款${record.amount}元吗？`,
      onOk() {
        setWithdrawals(prev => 
          prev.map(w => 
            w.id === record.id 
              ? { 
                  ...w, 
                  status: 'completed', 
                  processedAt: new Date().toLocaleString(),
                  processedBy: '当前管理员'
                } 
              : w
          )
        );
        message.success('提现已完成');
      }
    });
  };

  // 日期范围变更
  const handleDateRangeChange = (dates: RangePickerProps['value'], dateStrings: [string, string]) => {
    if (dates) {
      setDateRange([dates[0] as dayjs.Dayjs, dates[1] as dayjs.Dayjs]);
      // 可以根据日期筛选数据
      // filterDataByDateRange(dateStrings);
    } else {
      setDateRange(null);
      // 重置数据筛选
      // loadData();
    }
  };

  // 交易记录表格列定义
  const transactionColumns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo'
    },
    {
      title: '支付单号',
      dataIndex: 'paymentNo',
      key: 'paymentNo'
    },
    {
      title: '类型',
      dataIndex: 'paymentType',
      key: 'paymentType',
      render: (type: string) => (
        <Tag color={type === 'payment' ? 'green' : 'orange'}>
          {type === 'payment' ? '支付' : '退款'}
        </Tag>
      )
    },
    {
      title: '金额(元)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = '未知';
        if (status === 'success') {
          color = 'success';
          text = '支付成功';
        } else if (status === 'pending') {
          color = 'processing';
          text = '待支付';
        } else if (status === 'failed') {
          color = 'error';
          text = '支付失败';
        } else if (status === 'refunded') {
          color = 'warning';
          text = '已退款';
        }
        return <Badge status={color as any} text={text} />;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: Transaction, b: Transaction) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Transaction) => (
        <Button 
          type="link" 
          onClick={() => showTransactionDetail(record)}
        >
          查看详情
        </Button>
      )
    }
  ];

  // 佣金记录表格列定义
  const commissionColumns = [
    {
      title: '护工姓名',
      dataIndex: 'nurseName',
      key: 'nurseName'
    },
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo'
    },
    {
      title: '佣金金额(元)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '佣金比例',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: number) => `${(rate * 100).toFixed(0)}%`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = '';
        let text = '';
        if (status === 'pending') {
          color = 'blue';
          text = '待结算';
        } else if (status === 'settled') {
          color = 'green';
          text = '已结算';
        } else if (status === 'canceled') {
          color = 'red';
          text = '已取消';
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '结算时间',
      dataIndex: 'settledAt',
      key: 'settledAt',
      render: (settledAt: string) => settledAt || '-'
    }
  ];

  // 提现申请表格列定义
  const withdrawalColumns = [
    {
      title: '护工姓名',
      dataIndex: 'nurseName',
      key: 'nurseName'
    },
    {
      title: '提现金额(元)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '银行账户',
      key: 'bankAccount',
      render: (_, record: Withdrawal) => `${record.bankName} (${record.bankAccount.substring(0, 4)}****${record.bankAccount.substring(record.bankAccount.length - 4)})`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = '';
        let text = '';
        if (status === 'pending') {
          color = 'blue';
          text = '待审核';
        } else if (status === 'approved') {
          color = 'orange';
          text = '已审核待打款';
        } else if (status === 'rejected') {
          color = 'red';
          text = '已拒绝';
        } else if (status === 'completed') {
          color = 'green';
          text = '已完成';
        }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '处理时间',
      dataIndex: 'processedAt',
      key: 'processedAt',
      render: (processedAt: string) => processedAt || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Withdrawal) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => showWithdrawalDetail(record)}
          >
            查看详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button 
                type="link" 
                style={{ color: '#52c41a' }}
                onClick={() => handleApproveWithdrawal(record)}
              >
                通过
              </Button>
              <Button 
                type="link" 
                danger
                onClick={() => showRejectWithdrawalModal(record)}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button 
              type="link" 
              style={{ color: '#1890ff' }}
              onClick={() => handleCompleteWithdrawal(record)}
            >
              确认打款
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="payments-page">
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="交易总额"
              value={statistics.totalAmount}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="¥"
              suffix={
                <Tooltip title="成功交易总金额">
                  <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平台收入"
              value={statistics.platformRevenue}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix="¥"
              suffix={
                <Tooltip title="平台手续费总额">
                  <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="待处理提现"
              value={statistics.pendingWithdrawals}
              suffix={
                <span>
                  笔 / ¥{statistics.withdrawalAmount.toFixed(2)}
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      <Card 
        style={{ marginTop: 16 }}
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AccountBookOutlined style={{ marginRight: 8 }} />
            <span>支付结算中心</span>
          </div>
        }
        extra={
          <RangePicker onChange={handleDateRangeChange} />
        }
      >
        <Tabs activeKey={activeKey} onChange={setActiveKey}>
          <TabPane 
            tab={
              <span>
                <TransactionOutlined />
                交易记录
              </span>
            } 
            key="transactions"
          >
            <Table 
              columns={transactionColumns} 
              dataSource={transactions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                <DollarOutlined />
                佣金记录
              </span>
            } 
            key="commissions"
          >
            <Table 
              columns={commissionColumns} 
              dataSource={commissions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                <BankOutlined />
                提现管理
                {statistics.pendingWithdrawals > 0 && (
                  <Badge 
                    count={statistics.pendingWithdrawals} 
                    style={{ marginLeft: 8 }}
                  />
                )}
              </span>
            } 
            key="withdrawals"
          >
            <Table 
              columns={withdrawalColumns} 
              dataSource={withdrawals}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>

        {/* 交易详情弹窗 */}
        <Modal
          title="交易详情"
          open={detailModalVisible && selectedTransaction !== null}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>
          ]}
          onCancel={() => setDetailModalVisible(false)}
          width={700}
        >
          {selectedTransaction && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="交易类型" span={2}>
                <Tag color={selectedTransaction.paymentType === 'payment' ? 'green' : 'orange'}>
                  {selectedTransaction.paymentType === 'payment' ? '支付' : '退款'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单编号">{selectedTransaction.orderNo}</Descriptions.Item>
              <Descriptions.Item label="支付单号">{selectedTransaction.paymentNo}</Descriptions.Item>
              <Descriptions.Item label="交易金额">¥{selectedTransaction.amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="支付方式">{selectedTransaction.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="平台手续费">¥{selectedTransaction.platformFee.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="护工收入">¥{selectedTransaction.nurseAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="交易状态">
                <Badge 
                  status={
                    selectedTransaction.status === 'success' ? 'success' :
                    selectedTransaction.status === 'pending' ? 'processing' :
                    selectedTransaction.status === 'failed' ? 'error' :
                    'warning'
                  } 
                  text={
                    selectedTransaction.status === 'success' ? '支付成功' :
                    selectedTransaction.status === 'pending' ? '待支付' :
                    selectedTransaction.status === 'failed' ? '支付失败' :
                    '已退款'
                  } 
                />
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedTransaction.createdAt}</Descriptions.Item>
              {selectedTransaction.paidAt && (
                <Descriptions.Item label="支付时间">{selectedTransaction.paidAt}</Descriptions.Item>
              )}
              {selectedTransaction.refundedAt && (
                <Descriptions.Item label="退款时间">{selectedTransaction.refundedAt}</Descriptions.Item>
              )}
              {selectedTransaction.refundReason && (
                <Descriptions.Item label="退款原因" span={2}>{selectedTransaction.refundReason}</Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* 提现详情弹窗 */}
        <Modal
          title="提现申请详情"
          open={detailModalVisible && selectedWithdrawal !== null}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>,
            selectedWithdrawal?.status === 'pending' && (
              <Button
                key="approve"
                type="primary"
                onClick={() => {
                  setDetailModalVisible(false);
                  if (selectedWithdrawal) {
                    handleApproveWithdrawal(selectedWithdrawal);
                  }
                }}
              >
                通过申请
              </Button>
            ),
            selectedWithdrawal?.status === 'pending' && (
              <Button
                key="reject"
                danger
                onClick={() => {
                  setDetailModalVisible(false);
                  if (selectedWithdrawal) {
                    showRejectWithdrawalModal(selectedWithdrawal);
                  }
                }}
              >
                拒绝申请
              </Button>
            ),
            selectedWithdrawal?.status === 'approved' && (
              <Button
                key="complete"
                type="primary"
                onClick={() => {
                  setDetailModalVisible(false);
                  if (selectedWithdrawal) {
                    handleCompleteWithdrawal(selectedWithdrawal);
                  }
                }}
              >
                确认打款
              </Button>
            )
          ]}
          onCancel={() => setDetailModalVisible(false)}
          width={600}
        >
          {selectedWithdrawal && (
            <Descriptions bordered>
              <Descriptions.Item label="护工姓名">{selectedWithdrawal.nurseName}</Descriptions.Item>
              <Descriptions.Item label="护工ID">{selectedWithdrawal.nurseId}</Descriptions.Item>
              <Descriptions.Item label="提现金额">¥{selectedWithdrawal.amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="收款银行">{selectedWithdrawal.bankName}</Descriptions.Item>
              <Descriptions.Item label="账户名称">{selectedWithdrawal.accountName}</Descriptions.Item>
              <Descriptions.Item label="银行账号">{selectedWithdrawal.bankAccount}</Descriptions.Item>
              <Descriptions.Item label="申请状态">
                <Tag color={
                  selectedWithdrawal.status === 'pending' ? 'blue' :
                  selectedWithdrawal.status === 'approved' ? 'orange' :
                  selectedWithdrawal.status === 'rejected' ? 'red' :
                  'green'
                }>
                  {selectedWithdrawal.status === 'pending' ? '待审核' :
                   selectedWithdrawal.status === 'approved' ? '已审核待打款' :
                   selectedWithdrawal.status === 'rejected' ? '已拒绝' :
                   '已完成'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">{selectedWithdrawal.createdAt}</Descriptions.Item>
              {selectedWithdrawal.processedAt && (
                <Descriptions.Item label="处理时间">{selectedWithdrawal.processedAt}</Descriptions.Item>
              )}
              {selectedWithdrawal.processedBy && (
                <Descriptions.Item label="处理人员">{selectedWithdrawal.processedBy}</Descriptions.Item>
              )}
              {selectedWithdrawal.rejectReason && (
                <Descriptions.Item label="拒绝原因" span={3}>{selectedWithdrawal.rejectReason}</Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* 拒绝提现弹窗 */}
        <Modal
          title="拒绝提现申请"
          open={rejectModalVisible}
          onOk={handleRejectWithdrawal}
          onCancel={() => setRejectModalVisible(false)}
        >
          <Form form={rejectForm}>
            <Form.Item
              name="reason"
              label="拒绝原因"
              rules={[{ required: true, message: '请输入拒绝原因' }]}
            >
              <Input.TextArea rows={4} placeholder="请详细说明拒绝原因" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default Payments; 