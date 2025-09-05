import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ServiceType,IServiceType } from '../models/service.model';
import { verifyToken } from '../utils/jwt';

const router = Router();

router.get('/getService',async(req,res)=>{
    let list=await ServiceType.find()
    

    res.send({
        code:200,
        list
    })
})






export default router;