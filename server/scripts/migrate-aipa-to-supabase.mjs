const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const AIPA = process.env.AIPA_API_DOMAIN || process.env.EXPO_PUBLIC_AIPA_API_DOMAIN

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!AIPA) {
  console.error('缺少 AIPA_API_DOMAIN/EXPO_PUBLIC_AIPA_API_DOMAIN，用于拉取现有数据')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
}

async function restInsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`插入 ${table} 失败: ${res.status} ${t}`)
  }
  return res.json()
}

async function restUpsert(table, rows, onConflict) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Upsert ${table} 失败: ${res.status} ${t}`)
  }
  return res.json()
}

async function restSelectOne(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, { headers })
  if (!res.ok) throw new Error(`查询 ${table} 失败: ${res.status}`)
  return res.json()
}

async function migrateIndustries() {
  const existing = await restSelectOne('industries')
  if (existing && existing.length > 0) {
    console.log('[migrate] industries 已存在，跳过')
    return
  }
  const industryData = [
    { id: 'food_primary', primary_category: '美食', secondary_category: '', level: 1, sort_order: 1 },
    { id: 'shopping_primary', primary_category: '购物', secondary_category: '', level: 1, sort_order: 2 },
    { id: '1', primary_category: '美食', secondary_category: '地方菜', level: 2, sort_order: 1 },
    { id: '2', primary_category: '美食', secondary_category: '东南亚菜', level: 2, sort_order: 2 },
    { id: '3', primary_category: '美食', secondary_category: '自助餐', level: 2, sort_order: 3 },
    { id: '4', primary_category: '美食', secondary_category: '火锅', level: 2, sort_order: 4 },
    { id: '5', primary_category: '美食', secondary_category: '西餐', level: 2, sort_order: 5 },
    { id: '6', primary_category: '美食', secondary_category: '面包甜点', level: 2, sort_order: 6 },
    { id: '7', primary_category: '美食', secondary_category: '饮品', level: 2, sort_order: 7 },
    { id: '8', primary_category: '美食', secondary_category: '快餐小吃', level: 2, sort_order: 8 },
    { id: '9', primary_category: '美食', secondary_category: '音乐餐厅', level: 2, sort_order: 9 },
    { id: '10', primary_category: '美食', secondary_category: '热门/特色菜', level: 2, sort_order: 10 },
    { id: '11', primary_category: '美食', secondary_category: '日韩料理', level: 2, sort_order: 11 },
    { id: '12', primary_category: '美食', secondary_category: '生鲜果蔬', level: 2, sort_order: 12 },
    { id: '13', primary_category: '美食', secondary_category: '美食城', level: 2, sort_order: 13 },
    { id: '14', primary_category: '美食', secondary_category: '食品滋补', level: 2, sort_order: 14 },
    { id: '15', primary_category: '美食', secondary_category: '其他美食', level: 2, sort_order: 15 },
    { id: '16', primary_category: '购物', secondary_category: '3C数码', level: 2, sort_order: 16 },
    { id: '17', primary_category: '购物', secondary_category: '服饰鞋帽', level: 2, sort_order: 17 },
    { id: '18', primary_category: '购物', secondary_category: '美妆个护', level: 2, sort_order: 18 },
    { id: '19', primary_category: '购物', secondary_category: '日用商超', level: 2, sort_order: 19 },
    { id: '20', primary_category: '购物', secondary_category: '家居建材', level: 2, sort_order: 20 },
    { id: '21', primary_category: '购物', secondary_category: '交通工具', level: 2, sort_order: 21 },
    { id: '22', primary_category: '购物', secondary_category: '鲜花绿植', level: 2, sort_order: 22 },
    { id: '23', primary_category: '购物', secondary_category: '配饰', level: 2, sort_order: 23 },
    { id: '24', primary_category: '购物', secondary_category: '特色集市', level: 2, sort_order: 24 },
    { id: '25', primary_category: '购物', secondary_category: '百货商超', level: 2, sort_order: 25 },
    { id: '26', primary_category: '购物', secondary_category: '珠宝首饰', level: 2, sort_order: 26 },
    { id: '27', primary_category: '购物', secondary_category: '母婴用品', level: 2, sort_order: 27 },
    { id: '28', primary_category: '购物', secondary_category: '其他购物', level: 2, sort_order: 28 },
  ]
  await restInsert('industries', industryData)
  console.log('[migrate] industries 初始化完成: ', industryData.length)
}

async function migrateUserPhonesAndGenerations() {
  const codesRes = await fetch(`${AIPA}/api/auth/codes`)
  if (!codesRes.ok) throw new Error(`获取 codes 失败: ${codesRes.status}`)
  const codesJson = await codesRes.json()
  const list = codesJson?.data || []
  console.log('[migrate] 用户数量: ', list.length)

  for (const item of list) {
    const { uid, phone } = item
    let dosage = 10
    try {
      const chk = await fetch(`${AIPA}/api/auth/check-dosage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      })
      if (chk.ok) {
        const j = await chk.json()
        dosage = j?.data?.dosage ?? 10
      }
    } catch {}

    await restUpsert('user_phones', [{
      uid, phone, dosage, resettime: new Date().toISOString(), updatedat: new Date().toISOString()
    }], 'uid')

    try {
      const gensRes = await fetch(`${AIPA}/api/user-generations?uid=${encodeURIComponent(uid)}&limit=100`)
      if (gensRes.ok) {
        const gensJson = await gensRes.json()
        const records = (gensJson?.data || []).map(r => ({
          uid: r.uid,
          prompt: r.prompt,
          ref_img: r.ref_img ?? null,
          g_imgurl1: r.g_imgurl1 ?? null,
          g_imgurl2: r.g_imgurl2 ?? null,
          g_imgurl3: r.g_imgurl3 ?? null,
          g_imgurl4: r.g_imgurl4 ?? null,
          download_img: r.download_img ?? null,
          createdat: r.createdAt ?? new Date().toISOString(),
          updatedat: r.updatedAt ?? new Date().toISOString(),
        }))
        if (records.length) {
          await restInsert('user_generations', records)
          console.log(`[migrate] 导入 ${uid} 的生成记录: ${records.length}`)
        }
      }
    } catch {}
  }
}

async function main() {
  await migrateIndustries()
  await migrateUserPhonesAndGenerations()
  console.log('[migrate] 完成')
}

main().catch((e) => {
  console.error('[migrate] 失败: ', e.message)
  process.exit(1)
})
