import { Card, Space, Tag, Modal, Form, InputNumber, Input, message } from 'antd'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { http } from '../utils/request'

type Metric = {
  key: string
  label: string
  icon: string
  value: string
  unit: string
  statusText: '正常' | '偏低' | '偏高'
  statusColor: string
  accent: string
}

const formatDateTime = (input?: string | Date) => {
  try {
    if (!input) return '—'
    const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return '—'
  }
}

const getTempStatus = (t?: number) => {
  if (typeof t !== 'number' || Number.isNaN(t) || t === 0) return { text: '正常' as const, color: '#52c41a' }
  if (t < 36.0) return { text: '偏低' as const, color: '#ff4d4f' }
  if (t > 37.2) return { text: '偏高' as const, color: '#ff4d4f' }
  return { text: '正常' as const, color: '#52c41a' }
}

const getSugarStatus = (s?: number) => {
  if (typeof s !== 'number' || Number.isNaN(s) || s === 0) return { text: '正常' as const, color: '#52c41a' }
  if (s < 3.9) return { text: '偏低' as const, color: '#ff4d4f' }
  if (s > 6.1) return { text: '偏高' as const, color: '#ff4d4f' }
  return { text: '正常' as const, color: '#52c41a' }
}

const getHrStatus = (hr?: number) => {
  if (typeof hr !== 'number' || Number.isNaN(hr) || hr === 0) return { text: '正常' as const, color: '#52c41a' }
  if (hr < 60) return { text: '偏低' as const, color: '#ff4d4f' }
  if (hr > 100) return { text: '偏高' as const, color: '#ff4d4f' }
  return { text: '正常' as const, color: '#52c41a' }
}

const getOxygenStatus = (o?: number) => {
  if (typeof o !== 'number' || Number.isNaN(o) || o === 0) return { text: '正常' as const, color: '#52c41a' }
  if (o < 95) return { text: '偏低' as const, color: '#ff4d4f' }
  return { text: '正常' as const, color: '#52c41a' }
}

const getBpStatus = (bp?: string) => {
  try {
    const [s, d] = String(bp || '').split('/').map((x) => Number(x))
    if (!Number.isFinite(s) || !Number.isFinite(d)) return { text: '正常' as const, color: '#52c41a' }
    if (s < 90 || d < 60) return { text: '偏低' as const, color: '#ff4d4f' }
    if (s > 140 || d > 90) return { text: '偏高' as const, color: '#ff4d4f' }
    return { text: '正常' as const, color: '#52c41a' }
  } catch {
    return { text: '正常' as const, color: '#52c41a' }
  }
}

export default function Healthce() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 确保URL中总是有elderlyId参数
  const targetElderlyId = '6895545541f397093c0ed96c' // 目标elderlyId
  const urlElderlyId = searchParams.get('elderlyId') || searchParams.get('elderId') || searchParams.get('elderID')

  // 如果URL中没有elderlyId，就添加一个
  React.useEffect(() => {
    if (!urlElderlyId) {
      setSearchParams({ elderlyId: targetElderlyId })
    }
  }, [urlElderlyId, setSearchParams, targetElderlyId])

  const elderlyId = urlElderlyId || targetElderlyId

  const [measureTime, setMeasureTime] = useState<string>('—')
  const [metrics, setMetrics] = useState<Metric[]>([
    { key: 'temperature', label: '体温', icon: '/imgs/体温.png', value: '—', unit: '℃', statusText: '正常', statusColor: '#52c41a', accent: '#69b1ff' },
    { key: 'sugar', label: '血糖', icon: '/imgs/血糖.png', value: '—', unit: 'mmol/L', statusText: '正常', statusColor: '#52c41a', accent: '#b37feb' },
    { key: 'bp', label: '血压', icon: '/imgs/血压.png', value: '—', unit: 'mmHg', statusText: '正常', statusColor: '#52c41a', accent: '#5cdbd3' },
    { key: 'hr', label: '心率', icon: '/imgs/心率.png', value: '—', unit: 'bpm', statusText: '正常', statusColor: '#52c41a', accent: '#ff9c6e' },
    { key: 'spo2', label: '血氧', icon: '/imgs/血氧.png', value: '—', unit: '%', statusText: '正常', statusColor: '#52c41a', accent: '#95de64' },
  ])

  const [editOpen, setEditOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [form] = (Form as any).useForm?.() || ({} as any)

  const loadArchive = async (id: string) => {
    if (!id) {
      console.error('loadArchive: id is empty')
      return null
    }

    try {
      // 使用标准的elderhealth接口
      const response = await http.get<any>(`/elderhealth/${id}`, { showError: false })
      if (response?.data) {
        console.log('📋 Loaded existing archive for:', id)
        return response.data
      }
    } catch (error) {
      console.warn('Failed to load via standard endpoint:', error)
    }

    try {
      // 如果没找到，尝试使用护士端初始化接口（该接口也优先使用查询参数）
      const response = await http.post<any>(`/elderhealth/init?elderId=${id}`, {}, { showError: false })
      if (response?.data) {
        console.log('🆕 Archive initialized for:', id)
        return response.data
      }
    } catch (error) {
      console.warn('Failed to initialize archive:', error)
    }

    console.warn('No archive found or created for id:', id)
    return null
  }

  const updateVitals = async (payload: any) => {
    if (!elderlyId) {
      throw new Error('elderlyId is missing')
    }

    console.log('🔄 Updating vitals with payload:', payload)
    console.log('🔄 Using elderlyId:', elderlyId)
    console.log('🔄 URL search params:', Object.fromEntries(new URLSearchParams(window.location.search).entries()))

    try {
      // 使用标准 elderhealth/vitals 接口，在请求体中也传递 elderID 来确保使用正确的 ID
      const payloadWithElderID = { ...payload, elderID: elderlyId }
      console.log('🌐 Calling API:', `/elderhealth/vitals?elderId=${elderlyId}`)
      console.log('📤 Request payload:', payloadWithElderID)

      const response = await http.post(`/elderhealth/vitals?elderId=${elderlyId}`, payloadWithElderID)

      console.log('📥 API response:', response)

      if (!response?.data) {
        throw new Error('服务器返回无效数据')
      }

      console.log('✅ Update successful using correct elderlyId:', elderlyId)
      return response.data
    } catch (error: any) {
      console.error('❌ Update failed:', error)
      console.error('❌ Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message
      })

      // 如果是404错误，可能需要先初始化档案
      if (error?.response?.status === 404) {
        console.log('🔄 Archive not found, trying to initialize first...')
        try {
          await http.post(`/elderhealth/init?elderId=${elderlyId}`, {})
          console.log('🆕 Archive initialized, retrying update...')

          // 重试更新
          const retryPayload = { ...payload, elderID: elderlyId }
          const retryResponse = await http.post(`/elderhealth/vitals?elderId=${elderlyId}`, retryPayload)
          if (retryResponse?.data) {
            console.log('✅ Retry successful')
            return retryResponse.data
          }
        } catch (initError) {
          console.error('❌ Initialization failed:', initError)
        }
      }

      throw error
    }
  }

  useEffect(() => {
    const run = async () => {
      if (!elderlyId) {
        console.warn('elderlyId is missing:', elderlyId)
        return
      }

      console.log('🔍 Loading archive for elderlyId:', elderlyId)
      console.log('🔍 URL search params:', Object.fromEntries(searchParams.entries()))
      console.log('🔍 Target elderlyId should be: 6895545541f397093c0ed96c')

      try {
        // 从档案获取数据，只获取已存在的档案
        const archiveData = await loadArchive(elderlyId)

        if (!archiveData) {
          console.warn('未找到健康档案，无法加载生命体征数据')
          // 保持默认的占位符状态
          return
        }

        console.log('Loaded archive data:', archiveData)

        // 使用档案的更新时间作为测量时间
        setMeasureTime(formatDateTime(archiveData.updatedAt || archiveData.createdAt))

        // 计算各项指标的状态
        const tempStatus = getTempStatus(archiveData.temperature)
        const sugarStatus = getSugarStatus(archiveData.bloodSugar)
        const hrStatus = getHrStatus(archiveData.heartRate)
        const oxyStatus = getOxygenStatus(archiveData.oxygenLevel)
        const bpStatus = getBpStatus(archiveData.bloodPressure)

        // 更新指标显示
        setMetrics([
          {
            key: 'temperature',
            label: '体温',
            icon: '/imgs/体温.png',
            value: (typeof archiveData.temperature === 'number' ? archiveData.temperature.toFixed(1) : '—'),
            unit: '℃',
            statusText: tempStatus.text,
            statusColor: tempStatus.color,
            accent: '#69b1ff'
          },
          {
            key: 'sugar',
            label: '血糖',
            icon: '/imgs/血糖.png',
            value: (typeof archiveData.bloodSugar === 'number' ? archiveData.bloodSugar.toFixed(1) : '—'),
            unit: 'mmol/L',
            statusText: sugarStatus.text,
            statusColor: sugarStatus.color,
            accent: '#b37feb'
          },
          {
            key: 'bp',
            label: '血压',
            icon: '/imgs/血压.png',
            value: (archiveData.bloodPressure || '—'),
            unit: 'mmHg',
            statusText: bpStatus.text,
            statusColor: bpStatus.color,
            accent: '#5cdbd3'
          },
          {
            key: 'hr',
            label: '心率',
            icon: '/imgs/心率.png',
            value: (typeof archiveData.heartRate === 'number' ? String(archiveData.heartRate) : '—'),
            unit: 'bpm',
            statusText: hrStatus.text,
            statusColor: hrStatus.color,
            accent: '#ff9c6e'
          },
          {
            key: 'spo2',
            label: '血氧',
            icon: '/imgs/血氧.png',
            value: (typeof archiveData.oxygenLevel === 'number' ? String(archiveData.oxygenLevel) : '—'),
            unit: '%',
            statusText: oxyStatus.text,
            statusColor: oxyStatus.color,
            accent: '#95de64'
          },
        ])
      } catch (error) {
        console.error('加载健康档案失败:', error)
        // 保持默认的占位符状态
      }
    }
    run()
  }, [elderlyId])

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {metrics.map((m) => (
          <Card
            key={m.key}
            style={{ borderRadius: 16, boxShadow: '0 8px 28px rgba(0,0,0,0.06)', border: 'none' }}
            bodyStyle={{ padding: 16 }}
            onClick={() => {
              setEditingKey(m.key)
              // 预填表单
              const initial: any = {}
              if (m.key === 'temperature') initial.temperature = (m.value !== '—' ? Number(m.value) : undefined)
              if (m.key === 'sugar') initial.bloodSugar = (m.value !== '—' ? Number(m.value) : undefined)
              if (m.key === 'hr') initial.heartRate = (m.value !== '—' ? Number(m.value) : undefined)
              if (m.key === 'spo2') initial.oxygenLevel = (m.value !== '—' ? Number(m.value) : undefined)
              if (m.key === 'bp') initial.bloodPressure = (m.value !== '—' ? String(m.value) : undefined)
              try { form?.setFieldsValue?.(initial) } catch { }
              setEditOpen(true)
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                  }}
                >
                  <img src={m.icon} alt={m.label} style={{ width: 40, height: 50, objectFit: 'contain' }} />
                </div>
                <div style={{ marginLeft: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{measureTime}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#262626' }}>{m.value}</span>
                  <span style={{ color: '#8c8c8c' }}>{m.unit}</span>
                </div>
                <Tag color={m.statusColor}>{m.statusText}</Tag>
              </div>
            </div>
          </Card>
        ))}
      </Space>

      <Modal
        title="修改数据"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={async () => {
          try {
            const values = await form?.validateFields?.()
            const payload: any = {}

            // 根据编辑的字段构建payload
            if (editingKey === 'temperature' && values.temperature != null) {
              payload.temperature = values.temperature
            }
            if (editingKey === 'sugar' && values.bloodSugar != null) {
              payload.bloodSugar = values.bloodSugar
            }
            if (editingKey === 'bp' && values.bloodPressure) {
              payload.bloodPressure = values.bloodPressure
            }
            if (editingKey === 'hr' && values.heartRate != null) {
              payload.heartRate = values.heartRate
            }
            if (editingKey === 'spo2' && values.oxygenLevel != null) {
              payload.oxygenLevel = values.oxygenLevel
            }

            // 使用新的更新函数
            const updatedData = await updateVitals(payload)

            message.success('更新成功')

            // 使用返回的数据更新界面
            setMeasureTime(formatDateTime(updatedData.updatedAt || updatedData.createdAt))

            // 重新计算状态
            const tempStatus = getTempStatus(updatedData.temperature)
            const sugarStatus = getSugarStatus(updatedData.bloodSugar)
            const hrStatus = getHrStatus(updatedData.heartRate)
            const oxyStatus = getOxygenStatus(updatedData.oxygenLevel)
            const bpStatus = getBpStatus(updatedData.bloodPressure)

            // 更新显示
            setMetrics([
              { key: 'temperature', label: '体温', icon: '/imgs/体温.png', value: (typeof updatedData.temperature === 'number' ? updatedData.temperature.toFixed(1) : '—'), unit: '℃', statusText: tempStatus.text, statusColor: tempStatus.color, accent: '#69b1ff' },
              { key: 'sugar', label: '血糖', icon: '/imgs/血糖.png', value: (typeof updatedData.bloodSugar === 'number' ? updatedData.bloodSugar.toFixed(1) : '—'), unit: 'mmol/L', statusText: sugarStatus.text, statusColor: sugarStatus.color, accent: '#b37feb' },
              { key: 'bp', label: '血压', icon: '/imgs/血压.png', value: (updatedData.bloodPressure || '—'), unit: 'mmHg', statusText: bpStatus.text, statusColor: bpStatus.color, accent: '#5cdbd3' },
              { key: 'hr', label: '心率', icon: '/imgs/心率.png', value: (typeof updatedData.heartRate === 'number' ? String(updatedData.heartRate) : '—'), unit: 'bpm', statusText: hrStatus.text, statusColor: hrStatus.color, accent: '#ff9c6e' },
              { key: 'spo2', label: '血氧', icon: '/imgs/血氧.png', value: (typeof updatedData.oxygenLevel === 'number' ? String(updatedData.oxygenLevel) : '—'), unit: '%', statusText: oxyStatus.text, statusColor: oxyStatus.color, accent: '#95de64' },
            ])

            setEditOpen(false)
          } catch (error: any) {
            console.error('更新失败:', error)
            message.error(error?.message || '更新失败，请重试')
          }
        }}
      >
        <Form form={form} layout="vertical">
          {editingKey === 'temperature' && (
            <Form.Item
              name="temperature"
              label="体温(℃)"
              rules={[{ required: true, message: '请输入体温' }]}
            >
              <InputNumber
                min={30}
                max={45}
                step={0.1}
                style={{ width: '100%' }}
                placeholder="请输入体温"
              />
            </Form.Item>
          )}
          {editingKey === 'sugar' && (
            <Form.Item
              name="bloodSugar"
              label="血糖(mmol/L)"
              rules={[{ required: true, message: '请输入血糖值' }]}
            >
              <InputNumber
                min={0}
                max={50}
                step={0.1}
                style={{ width: '100%' }}
                placeholder="请输入血糖值"
              />
            </Form.Item>
          )}
          {editingKey === 'bp' && (
            <Form.Item
              name="bloodPressure"
              label="血压(mmHg)"
              rules={[
                { required: true, message: '请输入血压' },
                { pattern: /^\d+\/\d+$/, message: '血压格式应为 收缩压/舒张压（如120/80）' }
              ]}
            >
              <Input placeholder="如 120/80" />
            </Form.Item>
          )}
          {editingKey === 'hr' && (
            <Form.Item
              name="heartRate"
              label="心率(bpm)"
              rules={[{ required: true, message: '请输入心率' }]}
            >
              <InputNumber
                min={0}
                max={300}
                style={{ width: '100%' }}
                placeholder="请输入心率"
              />
            </Form.Item>
          )}
          {editingKey === 'spo2' && (
            <Form.Item
              name="oxygenLevel"
              label="血氧(%)"
              rules={[{ required: true, message: '请输入血氧值' }]}
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: '100%' }}
                placeholder="请输入血氧值"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
