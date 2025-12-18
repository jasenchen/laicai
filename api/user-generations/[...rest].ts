import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import userGenerationsRouter from '../../server/routes/userGenerations'

export const config = { runtime: 'nodejs' }

const app = new Hono()

app.use('*', async (c: any, next: any) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (c.req.method === 'OPTIONS') return c.text('ok')
  await next()
})

app.route('/api/user-generations', userGenerationsRouter)

export default handle(app)

