export const config = { runtime: 'nodejs' }

function bad(res: any, status: number, message: string) {
  res.status(status).json({ success: false, message })
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed')
  try {
    const { phone } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) return bad(res, 400, '请输入正确的手机号')

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return bad(res, 500, '服务未配置')

    const headers = {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    }

    // 查找是否存在
    const sel = await fetch(`${SUPABASE_URL}/rest/v1/user_phones?phone=eq.${encodeURIComponent(phone)}&select=uid,phone&limit=1`, { headers })
    if (!sel.ok) return bad(res, 500, `查询失败: ${sel.status}`)
    const rows = await sel.json()
    if (Array.isArray(rows) && rows.length > 0) {
      return res.status(200).json({ success: true, message: '手机号验证成功', data: rows[0] })
    }

    // 不存在则创建
    const uid = `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const payload = [{ uid, phone, dosage: 10, resettime: new Date().toISOString() }]
    const up = await fetch(`${SUPABASE_URL}/rest/v1/user_phones?on_conflict=uid`, {
      method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(payload),
    })
    if (!up.ok) {
      const t = await up.text()
      return bad(res, 500, `创建失败: ${up.status} ${t}`)
    }
    return res.status(200).json({ success: true, message: '手机号已创建并验证成功', data: { uid, phone } })
  } catch (e: any) {
    return bad(res, 500, e?.message || '服务器内部错误')
  }
}

