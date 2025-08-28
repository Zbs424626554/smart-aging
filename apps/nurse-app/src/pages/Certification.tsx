import React, { useState, useEffect } from 'react';
import {
  Typography,
  Form,
  Input,
  Upload,
  Button,
  Select,
  message,
  Steps,
  Space,
  Divider,
  Alert,
  Card,
  Row,
  Col,
  Tag
} from 'antd';
import {
  UploadOutlined,
  UserOutlined,
  FileTextOutlined,
  TagsOutlined,
  GlobalOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import request from '../utils/request';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CertificationForm {
  realName: string;
  idNumber: string;
  nursingCert: UploadFile[];
  healthCert: UploadFile[];
  skills: string[];
  serviceAreas: string[];
  selfIntroduction: string;
}

const Certification: React.FC = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nursingCertFiles, setNursingCertFiles] = useState<any[]>([]);
  const [healthCertFiles, setHealthCertFiles] = useState<any[]>([]);
  const [certificationStatus, setCertificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // 查询认证状态
  const checkCertificationStatus = async () => {
    try {
      console.log('开始查询认证状态...');
      const response = await request.get('/approves', {
        params: {}
      });

      console.log('认证状态查询响应:', response);
      console.log('响应数据:', response.data);

      const list = response?.data as any[] | undefined;
      if (Array.isArray(list) && list.length > 0) {
        const latestCert = list[0];
        console.log('最新认证记录:', latestCert);
        setCertificationStatus(latestCert.status);

        switch (latestCert.status) {
          case 'approved':
            setStatusMessage('资质认证已通过');
            break;
          case 'rejected':
            setStatusMessage('资质认证已拒绝');
            break;
          case 'pending':
            setStatusMessage('资质认证待审核');
            break;
          default:
            setStatusMessage('未知状态');
        }
      } else {
        console.log('没有找到认证记录，设置默认状态');
        setCertificationStatus('pending');
        setStatusMessage('资质认证待审核');
      }
    } catch (error) {
      console.error('查询认证状态失败:', error);
      console.log('查询失败，设置默认状态');
      setCertificationStatus('pending');
      setStatusMessage('资质认证待审核');
    }
  };

  useEffect(() => {
    checkCertificationStatus();
  }, []);

  // 技能选项
  const skillOptions = [
    '基础护理', '老年护理', '康复护理', '心理护理',
    '急救技能', '营养配餐', '用药指导', '伤口护理',
    '导尿护理', '鼻饲护理', '压疮护理', '糖尿病护理',
    '高血压护理', '心脏病护理', '中风护理', '痴呆症护理'
  ];

  // 服务范围选项
  const serviceAreaOptions = [
    '居家护理', '医院陪护', '康复中心', '养老院',
    '日间照料', '夜间陪护', '临时护理', '长期护理',
    '术后护理', '慢性病护理', '临终关怀', '健康咨询'
  ];

  const steps = [
    {
      title: '基本信息',
      icon: <UserOutlined />,
      content: (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input
              placeholder="请输入您的真实姓名"
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="idNumber"
            label="身份证号"
            rules={[
              { required: true, message: '请输入身份证号' },
              { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号' }
            ]}
          >
            <Input
              placeholder="请输入18位身份证号"
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
        </Card>
      )
    },
    {
      title: '资质证明',
      icon: <FileTextOutlined />,
      content: (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Alert
            message="资质证明要求"
            description="请上传清晰的证件照片，支持jpg、png格式，文件大小不超过5MB"
            type="info"
            showIcon
            style={{ marginBottom: 24, borderRadius: '8px' }}
          />

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="nursingCert"
                label="护理证"
              >
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                  accept=".jpg,.jpeg,.png"
                  action=""
                  fileList={nursingCertFiles}
                  onChange={({ fileList }) => {
                    console.log('nursingCert onChange fileList:', fileList);
                    setNursingCertFiles(fileList);
                  }}
                  style={{ width: '100%' }}
                >
                  <div style={{ padding: '20px 0' }}>
                    <UploadOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div style={{ marginTop: 8, color: '#666' }}>上传护理证</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="healthCert"
                label="健康证"
              >
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                  accept=".jpg,.jpeg,.png"
                  action=""
                  fileList={healthCertFiles}
                  onChange={({ fileList }) => {
                    console.log('healthCert onChange fileList:', fileList);
                    setHealthCertFiles(fileList);
                  }}
                  style={{ width: '100%' }}
                >
                  <div style={{ padding: '20px 0' }}>
                    <UploadOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div style={{ marginTop: 8, color: '#666' }}>上传健康证</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      title: '技能标签',
      icon: <TagsOutlined />,
      content: (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: '14px' }}>
            请选择您具备的护理技能，这将帮助客户更好地了解您的专业能力
          </Text>

          <Form.Item
            name="skills"
            label="护理技能"
            rules={[{ required: true, message: '请至少选择一项技能' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择您的护理技能"
              style={{ width: '100%' }}
              size="large"
              options={skillOptions.map(skill => ({ label: skill, value: skill }))}
              tagRender={(props) => (
                <Tag
                  {...props}
                  style={{
                    margin: '4px',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    backgroundColor: '#f0f8ff',
                    borderColor: '#1890ff',
                    color: '#1890ff'
                  }}
                >
                  {props.label}
                </Tag>
              )}
            />
          </Form.Item>
        </Card>
      )
    },
    {
      title: '服务范围',
      icon: <GlobalOutlined />,
      content: (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: '14px' }}>
            请选择您愿意提供的服务类型和范围
          </Text>

          <Form.Item
            name="serviceAreas"
            label="服务范围"
            rules={[{ required: true, message: '请至少选择一项服务范围' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择您的服务范围"
              style={{ width: '100%' }}
              size="large"
              options={serviceAreaOptions.map(area => ({ label: area, value: area }))}
              tagRender={(props) => (
                <Tag
                  {...props}
                  style={{
                    margin: '4px',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    backgroundColor: '#f6ffed',
                    borderColor: '#52c41a',
                    color: '#52c41a'
                  }}
                >
                  {props.label}
                </Tag>
              )}
            />
          </Form.Item>
        </Card>
      )
    },
    {
      title: '自我介绍',
      icon: <EditOutlined />,
      content: (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: '14px' }}>
            请简要介绍您的护理经验、专业特长和服务理念
          </Text>

          <Form.Item
            name="selfIntroduction"
            label="自我介绍"
            rules={[
              { required: true, message: '请输入自我介绍' },
              { min: 10, message: '自我介绍至少10字' },
              { max: 500, message: '自我介绍不能超过500字' }
            ]}
          >
            <TextArea
              rows={6}
              placeholder="请介绍您的护理经验、专业特长、服务理念等..."
              showCount
              maxLength={500}
              style={{ borderRadius: '8px', resize: 'none' }}
            />
          </Form.Item>
        </Card>
      )
    }
  ];

  const handleSubmit = async (values: CertificationForm) => {
    console.log('Form values received in handleSubmit:', values);
    console.log('Form instance values:', form.getFieldsValue());
    setLoading(true);
    try {
      const uploadOnce = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('image', file);
        try {
          const resp: any = await request.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log('Upload success response:', resp);
          console.log('Upload response data:', resp.data);
          if (!resp.data || !resp.data.url) {
            console.error('Upload response missing URL:', resp);
            message.error('文件上传失败：响应中缺少URL');
            return '';
          }
          return resp.data.url as string;
        } catch (error) {
          console.error('文件上传失败:', error);
          message.error('文件上传失败，请重试');
          return '';
        }
      };

      const pickFile = async (list: any[] | undefined): Promise<File | null> => {
        console.log('pickFile input:', list);
        if (!list || list.length === 0) return null;
        const item: any = list[0];
        console.log('pickFile item:', item);
        console.log('item.originFileObj:', item.originFileObj);
        console.log('item.thumbUrl:', item.thumbUrl);
        console.log('item.url:', item.url);
        if (item.originFileObj) return item.originFileObj as File;
        const dataUrl: string | undefined = item.thumbUrl || item.url;
        if (dataUrl && dataUrl.startsWith('data:')) {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          return new File([blob], item.name || 'upload.png', { type: blob.type || 'image/png' });
        }
        console.log('pickFile failed - no valid file data found');
        return null;
      };

      const nursingFile = await pickFile(nursingCertFiles);
      const healthFile = await pickFile(healthCertFiles);
      let nursingUrl = '';
      let healthUrl = '';

      if (nursingFile) {
        nursingUrl = await uploadOnce(nursingFile);
        console.log('Generated nursingUrl:', nursingUrl);
      }

      if (healthFile) {
        healthUrl = await uploadOnce(healthFile);
        console.log('Generated healthUrl:', healthUrl);
      }

      const payload = {
        nurseName: values.realName,
        idcard: values.idNumber,
        certificateImage: nursingUrl,
        idCardFront: healthUrl,
        certificateType: 'both',
      };

      console.log('Final payload for /approves:', payload);

      await request.post('/approves', payload);

      message.success('认证信息已提交，请等待审核');
      setSubmitted(true);
      setTimeout(() => {
        checkCertificationStatus();
      }, 1000);
    } catch (error) {
      message.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const stepFields: (keyof CertificationForm)[][] = [
      ['realName', 'idNumber'],
      [],
      ['skills'],
      ['serviceAreas'],
      ['selfIntroduction']
    ];
    const fields = stepFields[currentStep] as any;

    if (currentStep === 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    form.validateFields(fields)
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch((error) => {
        console.error('表单验证失败:', error);
      });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getStatusIcon = () => {
    switch (certificationStatus) {
      case 'approved':
        return <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
      case 'rejected':
        return <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />;
    }
  };

  if (submitted) {
    return (
      <div style={{
        padding: '32px 24px',
        textAlign: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <CheckCircleOutlined style={{ fontSize: '80px', color: '#52c41a', marginBottom: '24px' }} />
          <Title level={2} style={{ color: '#333', marginBottom: '16px' }}>认证信息已提交</Title>
          <Text style={{ display: 'block', marginBottom: '32px', fontSize: '16px', color: '#666' }}>
            您的认证信息已成功提交，我们将在3-5个工作日内完成审核
          </Text>

          <Card style={{ textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              {getStatusIcon()}
              <span style={{ marginLeft: '12px', fontSize: '18px', fontWeight: 'bold' }}>
                审核状态
              </span>
            </div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
              当前状态：<strong>{statusMessage}</strong>
            </div>
            {certificationStatus === 'pending' && (
              <div style={{ color: '#666' }}>预计完成时间：3-5个工作日</div>
            )}
            {certificationStatus === 'rejected' && (
              <div style={{ color: '#666' }}>拒绝原因：请联系客服了解详情</div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '24px 16px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '24px'
        }}>
          <Title level={1} style={{
            textAlign: 'center',
            marginBottom: '32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            资质认证
          </Title>

          {/* 认证状态显示 */}
          {certificationStatus !== null && (
            <Card
              style={{
                marginBottom: '32px',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                {getStatusIcon()}
                <span style={{ marginLeft: '12px', fontSize: '18px', fontWeight: 'bold' }}>
                  当前认证状态
                </span>
              </div>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                <strong>{statusMessage}</strong>
              </div>
              {certificationStatus === 'pending' && (
                <div style={{ color: '#666', fontSize: '14px' }}>
                  预计完成时间：3-5个工作日
                </div>
              )}
              {certificationStatus === 'rejected' && (
                <div style={{ color: '#666', fontSize: '14px' }}>
                  如有疑问，请联系客服
                </div>
              )}
            </Card>
          )}

          <Steps
            current={currentStep}
            style={{ marginBottom: '32px' }}
            progressDot
            size="small"
          >
            {steps.map((step, index) => (
              <Steps.Step
                key={index}
                title={step.title}
                icon={step.icon}
                style={{
                  fontSize: '14px',
                  fontWeight: currentStep === index ? 'bold' : 'normal'
                }}
              />
            ))}
          </Steps>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              realName: '',
              idNumber: '',
              skills: [],
              serviceAreas: []
            }}
          >
            {steps[currentStep].content}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #f0f0f0'
            }}>
              <Button
                disabled={currentStep === 0}
                onClick={prevStep}
                size="large"
                style={{
                  borderRadius: '8px',
                  padding: '8px 24px',
                  height: 'auto'
                }}
              >
                上一步
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="primary"
                  onClick={nextStep}
                  size="large"
                  style={{
                    borderRadius: '8px',
                    padding: '8px 24px',
                    height: 'auto',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  下一步
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  style={{
                    borderRadius: '8px',
                    padding: '8px 32px',
                    height: 'auto',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  提交认证
                </Button>
              )}
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Certification; 