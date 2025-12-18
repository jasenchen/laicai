import { supabase } from './supabase'

type Filter = Record<string, any>

const COLLECTION_MAP: Record<string, string> = {
  '4f831654_user_phones': 'user_phones',
  '4f831654_industries': 'industries',
  '4f831654_user_generations': 'user_generations',
}

class QueryBuilder {
  private table: string
  private filter: Filter
  private order: { column?: string; ascending?: boolean } = {}
  private limitValue?: number

  constructor(table: string, filter: Filter) {
    this.table = table
    this.filter = filter
  }

  sort(sortObj: Record<string, 1 | -1>) {
    const [column, dir] = Object.entries(sortObj)[0] || []
    if (column) {
      const mapped = column === 'createdAt' ? 'createdat' : column === 'updatedAt' ? 'updatedat' : column
      this.order = { column: mapped, ascending: dir === 1 }
    }
    return this
  }

  limit(n: number) {
    this.limitValue = n
    return this
  }

  async toArray() {
    let query = supabase.from(this.table).select('*')
    for (const [k, v] of Object.entries(this.filter || {})) {
      const mapped = k === 'createdAt' ? 'createdat' : k === 'updatedAt' ? 'updatedat' : k
      query = query.eq(mapped, v)
    }
    if (this.order.column) {
      query = query.order(this.order.column, { ascending: !!this.order.ascending })
    }
    if (this.limitValue && this.limitValue > 0) {
      query = query.limit(this.limitValue)
    }
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data || []) as any[]
  }
}

function resolveTable(name: string) {
  const table = COLLECTION_MAP[name]
  if (!table) throw new Error(`Unknown collection: ${name}`)
  return table
}

function collection(name: string) {
  const table = resolveTable(name)
  return {
    async countDocuments(filter: Filter = {}) {
      let query = supabase.from(table).select('*', { count: 'exact', head: true })
      for (const [k, v] of Object.entries(filter)) {
        const mapped = k === 'createdAt' ? 'createdat' : k === 'updatedAt' ? 'updatedat' : k
        query = query.eq(mapped, v)
      }
      const { count, error } = await query
      if (error) throw new Error(error.message)
      return count || 0
    },
    async insertMany(docs: any[]) {
      const mappedDocs = docs.map((d) => {
        const nd: any = { ...d }
        if ('createdAt' in nd) { nd.createdat = nd.createdAt; delete nd.createdAt }
        if ('updatedAt' in nd) { nd.updatedat = nd.updatedAt; delete nd.updatedAt }
        return nd
      })
      const { data, error } = await supabase.from(table).insert(mappedDocs)
      if (error) throw new Error(error.message)
      return { insertedCount: (data || []).length }
    },
    async insertOne(doc: any) {
      const nd: any = { ...doc }
      if ('createdAt' in nd) { nd.createdat = nd.createdAt; delete nd.createdAt }
      if ('updatedAt' in nd) { nd.updatedat = nd.updatedAt; delete nd.updatedAt }
      const { data, error } = await supabase.from(table).insert(nd).select('*').limit(1)
      if (error) throw new Error(error.message)
      const arr = (data || []) as any[]
      const inserted = Array.isArray(arr) ? arr[0] : arr
      return { insertedId: inserted?.id ?? inserted?._id ?? inserted?.uid }
    },
    async findOne(filter: Filter) {
      let query = supabase.from(table).select('*').limit(1)
      for (const [k, v] of Object.entries(filter)) {
        const mapped = k === 'createdAt' ? 'createdat' : k === 'updatedAt' ? 'updatedat' : k
        query = query.eq(mapped, v)
      }
      const { data, error } = await query
      if (error) throw new Error(error.message)
      const arr = (data || []) as any[]
      return Array.isArray(arr) ? arr[0] : arr
    },
    async updateOne(filter: Filter, update: { $set?: any }) {
      const values = update?.$set || {}
      const nv: any = { ...values }
      if ('createdAt' in nv) { nv.createdat = nv.createdAt; delete nv.createdAt }
      if ('updatedAt' in nv) { nv.updatedat = nv.updatedAt; delete nv.updatedAt }
      let query = supabase.from(table).update(nv)
      for (const [k, v] of Object.entries(filter)) {
        const mapped = k === 'createdAt' ? 'createdat' : k === 'updatedAt' ? 'updatedat' : k
        query = query.eq(mapped, v)
      }
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return { matchedCount: Array.isArray(data) ? data.length : data ? 1 : 0 }
    },
    async deleteOne(filter: Filter) {
      let query = supabase.from(table).delete()
      for (const [k, v] of Object.entries(filter)) {
        const mapped = k === 'createdAt' ? 'createdat' : k === 'updatedAt' ? 'updatedat' : k
        query = query.eq(mapped, v)
      }
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return { deletedCount: Array.isArray(data) ? data.length : data ? 1 : 0 }
    },
    async deleteMany(filter: Filter = {}) {
      let query = supabase.from(table).delete()
      for (const [k, v] of Object.entries(filter)) {
        const mapped = k === 'createdAt' ? 'createdat' : k === 'updatedAt' ? 'updatedat' : k
        query = query.eq(mapped, v)
      }
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return { deletedCount: Array.isArray(data) ? data.length : data ? 1 : 0 }
    },
    find(filter: Filter) {
      return new QueryBuilder(table, filter)
    },
  }
}

export const db = { collection }
