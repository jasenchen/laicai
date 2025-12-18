import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { imagesRouter } from '../server/routes/images'
import { authRouter } from '../server/routes/auth'
import industriesRouter from '../server/routes/industries'
import userGenerationsRouter from '../server/routes/userGenerations'
import fileUploadRouter from '../server/routes/fileUpload'

export const config = { runtime: 'nodejs' }

const app = new Hono()

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  await next()
})

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.route('/api/images', imagesRouter)
app.route('/api/auth', authRouter)
app.route('/api/industries', industriesRouter)
app.route('/api/user-generations', userGenerationsRouter)
app.route('/api', fileUploadRouter)

app.notFound((c) => c.json({ error: '接口不存在' }, 404))

export default handle(app)
