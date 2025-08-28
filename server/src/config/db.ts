import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.warn('⚠️  MongoDB URI 未配置，使用默认连接');
    try {
      await mongoose.connect('mongodb+srv://424626554:Zbs424626554@zbs.ngrjull.mongodb.net/test');
      console.log('MongoDB 连接成功 -> 使用默认数据库: elder_care');
    } catch (error) {
      console.error('MongoDB 连接失败，但服务器将继续运行:', error);
      console.log('某些功能可能不可用，但支付功能仍可正常使用');
    }
    return;
  }

  try {
    await mongoose.connect(uri);
    const dbName = mongoose.connection?.db?.databaseName;
    console.log(`MongoDB 连接成功 -> 当前数据库: ${dbName || '未知'}`);
  } catch (error) {
    console.error('MongoDB 连接失败，但服务器将继续运行:', error);
    console.log('某些功能可能不可用，但支付功能仍可正常使用');
  }
};
