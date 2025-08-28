import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  DatePicker,
  message,
  Space,
  Typography
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { request } from '../utils/request';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title } = Typography;

interface HealthDataInputProps {
  onSuccess?: () => void;
}

const HealthDataInput: React.FC<HealthDataInputProps> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 获取当前用户ID
      const userResponse = await request.get('/api/auth/profile');
      const userId = userResponse.data._id;

      const healthData = {
        elderlyId: userId,
        recordType: values.recordType,
        value: values.value,
        measuredAt: values.measuredAt.toDate(),
        recordedBy: userId
      };

      // 这里应该调用健康记录的API，暂时模拟
      // 健康数据已提交

      message.success('健康数据记录成功');
      form.resetFields();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('记录健康数据失败:', error);
      message.error('记录健康数据失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="记录健康数据" style={{ marginBottom: '16px' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          measuredAt: dayjs(),
          recordType: 'bloodPressure'
        }}
      >
        <Form.Item
          name="recordType"
          label="数据类型"
          rules={[{ required: true, message: '请选择数据类型' }]}
        >
          <Select>
            <Option value="bloodPressure">血压</Option>
            <Option value="bloodSugar">血糖</Option>
            <Option value="medication">用药记录</Option>
            <Option value="other">其他</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="value"
          label="数值"
          rules={[{ required: true, message: '请输入数值' }]}
        >
          <Input placeholder="如: 120/80 (血压) 或 5.6 (血糖)" />
        </Form.Item>

        <Form.Item
          name="measuredAt"
          label="测量时间"
          rules={[{ required: true, message: '请选择测量时间' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlusOutlined />}
            >
              记录数据
            </Button>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default HealthDataInput; 