import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET) {
  console.error('缺少环境变量 SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_BUCKET')
  process.exit(1)
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const fileArg = process.argv[2] || path.resolve('tmp/test.png')
const exists = fs.existsSync(fileArg)
if (!exists) {
  console.error(`测试文件不存在: ${fileArg}`)
  process.exit(1)
}

const buffer = fs.readFileSync(fileArg)
const ext = path.extname(fileArg).replace('.', '') || 'png'
const uploadPath = `uploads/test-${Date.now()}.${ext}`

console.log('开始上传: ', { bucket: SUPABASE_BUCKET, uploadPath, size: buffer.length })
const { error: uploadError } = await client
  .storage
  .from(SUPABASE_BUCKET)
  .upload(uploadPath, buffer, { contentType: 'image/png' })

if (uploadError) {
  console.error('上传失败: ', uploadError.message)
  process.exit(1)
}

const pub = client.storage.from(SUPABASE_BUCKET).getPublicUrl(uploadPath)
if (pub?.data?.publicUrl) {
  console.log('上传成功，公共 URL:')
  console.log(pub.data.publicUrl)
  process.exit(0)
}

const { data: signed, error: signError } = await client
  .storage
  .from(SUPABASE_BUCKET)
  .createSignedUrl(uploadPath, 60 * 60 * 24 * 7)

if (signError || !signed?.signedUrl) {
  console.error('生成签名 URL 失败: ', signError?.message || '未知错误')
  process.exit(1)
}

console.log('上传成功，签名 URL:')
console.log(signed.signedUrl)
