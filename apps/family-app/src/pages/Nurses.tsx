import React, { useEffect, useState } from "react";
import type { RefObject } from "react";
import { useNavigate } from 'react-router-dom';
import styles from './Nurses.module.css';
import {ElderlyService} from '../services/elderly.service'
import type { ElderlyUser } from "../services/elderly.service";
import {
  Form,
  Input,
  Button,
  Dialog,
  TextArea,
  DatePicker,
  Selector,
} from 'antd-mobile'
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);
import type { DatePickerRef } from 'antd-mobile/es/components/date-picker'
import axios from "axios";
axios.defaults.baseURL='http://localhost:3001/api'
interface IService extends Document {
  _id:string;
  name: string;
  price: number;
  priceUnit: string;
  description: string;
  category: string;
  subcategory?: string;
  status: 'active' | 'disabled';
  requirements?: string[];
  imageUrl?: string;
  createdBy?: string
  updatedBy?:string
}


const Nurses: React.FC = () => {
  const navigate = useNavigate();
  const [elderly,setelderly]=useState<ElderlyUser[]>([])
  const [service,setservice]=useState<IService[]>([])
  const [form]=Form.useForm()
  const onFinish = (values: any) => {
    console.log(values);
    const newvalues={...values,elderlyId:values.elderlyId[0],serviceId:values.serviceId[0],userId:JSON.parse(localStorage.getItem('userInfo') as string)._id}
    localStorage.setItem("orderInfo", JSON.stringify(newvalues));
    navigate("/home/gozhifu");
  }

  //获得绑定的老人
  const getelder=async()=>{
    let res=await ElderlyService.getElderlyList()
    if(res.code==200){
      console.log(res);
      setelderly(res.data.list)
    }else{
      console.log('获取老人错误');
    }
  }

  //获取服务表数据
  const getservice=async()=>{
    let res=await axios.get('/service/getService')
    if(res.data.code==200){
      setservice(res.data.list)
    }else{
      console.log('获取服务错误');
      
    }
  }

  useEffect(()=>{
    getelder()
    getservice()
  },[])

  return (
    <div className={styles.nurses}>
      <div className={styles.header}>发布需求</div>
      <Form
        layout='horizontal'
        onFinish={onFinish}
        footer={
          <Button block type='submit' color='primary' size='large'>
            去支付
          </Button>
        }
        form={form}
        onValuesChange={(changedValues, allValues)=>{
          
          if(changedValues.serviceId){
            console.log(1,changedValues.serviceId);
            
            const info=service.find(i=>i._id===changedValues.serviceId[0])
            form.setFieldValue('price',info?.price||'')
          }
        }}
      >
        <Form.Item
          name='elderlyId'
          label='老人选择'
          rules={[{ required: true, message: '请选择需要的老人' }]}
        >
          <Selector
            style={{width:'180px'}}
            columns={2}
            options={elderly.map(i=>({label:i.username,value:i.id}))}
          />
        </Form.Item>

        <Form.Item label="服务类型">
          <div style={{ overflowX: 'auto', maxWidth: '100vw' }}>
            <Form.Item name="serviceId" noStyle>
              <Selector
                columns={service.length}
                style={{ minWidth: 'max-content' }}
                options={service.map(i => ({ label: i.name, value: i._id }))}
              />
            </Form.Item>
          </div>
        </Form.Item>



        <Form.Item
          name='scheduledStartTime'
          label='预约开始时间'
          trigger='onConfirm'
          onClick={(e, datePickerRef: RefObject<DatePickerRef>) => {
            datePickerRef.current?.open()
          }}
          rules={[{ required: true, message: '请选择开始时间' }]}
        >
          <DatePicker>
            {value =>
              value ? dayjs(value).format('YYYY-MM-DD') : '请选择开始时间'
            }
          </DatePicker>
        </Form.Item>

        <Form.Item
          name='scheduledEndTime'
          label='预约结束时间'
          trigger='onConfirm'
          rules={[{ required: true, message: '请选择结束时间' },{
            validator: async (_, value) => {
              const startTime = form.getFieldValue('scheduledStartTime');
              if (!startTime || !value) return Promise.resolve();
      
              const start = dayjs(startTime);
              const end = dayjs(value);
      
              if (end.isSameOrBefore(start)) {
                return Promise.reject(new Error('结束时间必须晚于开始时间'));
              }
              return Promise.resolve();
            },
          }]}
          onClick={(e, datePickerRef: RefObject<DatePickerRef>) => {
            datePickerRef.current?.open()
          }}
        >
          <DatePicker>
            {value =>
              value ? dayjs(value).format('YYYY-MM-DD') : '请选择结束时间'
            }
          </DatePicker>
        </Form.Item>

        <Form.Item
          name='price'
          label='价格(元)'
        >
          <Input onChange={console.log} placeholder='请先选择服务' />
        </Form.Item>



        <Form.Item
          name='address'
          label='地址信息'
          rules={[{ required: true, message: '地址信息不能为空不能为空' }]}
        >
          <Input placeholder='请输入地址信息' />
        </Form.Item>
      </Form>


    </div>
  );
};

export default Nurses;


