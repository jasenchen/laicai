import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import imagesRouter from '../server/routes/images'
import authRouter from '../server/routes/auth'
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

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.route('/images', imagesRouter)
app.route('/auth', authRouter)
app.route('/industries', industriesRouter)
app.route('/user-generations', userGenerationsRouter)
app.route('/', fileUploadRouter)

export default handle(app)

