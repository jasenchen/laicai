import { Hono } from 'hono';

// 导入路由
import { imagesRouter } from './routes/images';
import { authRouter } from './routes/auth';
import industriesRouter from './routes/industries';
import userGenerationsRouter from './routes/userGenerations';
import fileUploadRouter from './routes/fileUpload';

const app = new Hono();

// 中间件配置
app.use('*', async (c, next) => {
  // 设置CORS头
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 记录请求日志
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  
  await next();
});

// 健康检查路由
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 注册路由
app.route('/api/images', imagesRouter);
app.route('/api/auth', authRouter);
app.route('/api/industries', industriesRouter);
app.route('/api/user-generations', userGenerationsRouter);
app.route('/api', fileUploadRouter);

// 404处理
app.notFound((c) => {
  return c.json({ error: '接口不存在' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('[Server Error]', err);
  return c.json(
    { 
      error: err.message || '服务器内部错误',
      timestamp: new Date().toISOString()
    },
    500
  );
});

// 导出应用实例
export default app;