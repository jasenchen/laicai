import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../server/lib/supaDb'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const industries = await db.collection('4f831654_industries')
      .find({})
      .sort({ sort_order: 1 })
      .toArray()

    const grouped: Record<string, string[]> = {}
    const primary: string[] = []

    for (const item of industries as any[]) {
      const pri = item.primary_category
      if (item.level === 1) {
        if (!primary.includes(pri)) primary.push(pri)
        if (!grouped[pri]) grouped[pri] = []
      } else if (item.level === 2) {
        if (!primary.includes(pri)) primary.push(pri)
        if (!grouped[pri]) grouped[pri] = []
        if (item.secondary_category) grouped[pri].push(item.secondary_category)
      }
    }

    Object.keys(grouped).forEach(k => grouped[k].sort())

    res.status(200).json({ success: true, data: { primaryCategories: primary, secondaryCategories: grouped } })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || '服务器内部错误' })
  }
}

