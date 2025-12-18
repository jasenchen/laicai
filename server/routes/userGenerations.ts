import { Hono, Context } from 'hono';
import { db } from '../lib/supaDb';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// 请求参数验证模式
const createGenerationSchema = z.object({
  uid: z.string().min(1, '用户ID不能为空'),
  prompt: z.string().min(1, '提示词不能为空'),
  ref_img: z.string().optional(),
});

const updateGenerationSchema = z.object({
  g_imgurl1: z.string().optional(),
  g_imgurl2: z.string().optional(),
  g_imgurl3: z.string().optional(),
  g_imgurl4: z.string().optional(),
  download_img: z.string().optional(),
});

const createGenerationWithResultSchema = z.object({
  uid: z.string().min(1, '用户ID不能为空'),
  prompt: z.string().min(1, '提示词不能为空'),
  ref_img: z.string().optional(),
  g_imgurl1: z.string().optional(),
  g_imgurl2: z.string().optional(),
  g_imgurl3: z.string().optional(),
  g_imgurl4: z.string().optional(),
  download_img: z.string().optional(),
});

const getGenerationsSchema = z.object({
  uid: z.string().min(1, '用户ID不能为空'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(), // 可选的limit参数，转换为数字
});

const updateDownloadRecordSchema = z.object({
  uid: z.string().min(1, '用户ID不能为空'),
  download_img: z.string().min(1, '下载图片URL不能为空'),
});

const userGenerationsRouter = new Hono();

/**
 * 清除所有用户生成记录
 */
userGenerationsRouter.delete('/clear-all', async (c: Context) => {
  try {
    console.log('[userGenerations] 开始清除所有用户生成记录');

    // 获取当前数据库中所有记录数量
    const beforeCount = await db.collection('4f831654_user_generations').countDocuments();
    console.log('[userGenerations] 清除前记录数量:', beforeCount);

    // 删除所有记录
    const deleteResult = await db.collection('4f831654_user_generations').deleteMany({});
    
    console.log('[userGenerations] 清除所有生成记录成功:', { 
      deletedCount: deleteResult.deletedCount,
      beforeCount 
    });
    
    return c.json({ 
      success: true, 
      message: '所有用户生成记录清除成功',
      data: {
        deletedCount: deleteResult.deletedCount,
        beforeCount
      }
    });
  } catch (error) {
    console.error('[userGenerations] 清除所有生成记录失败:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '清除所有生成记录失败' 
    }, 500);
  }
});

/**
 * 创建生成记录
 */
userGenerationsRouter.post('/', zValidator('json', createGenerationSchema), async (c: Context) => {
  try {
    const { uid, prompt, ref_img } = c.req.valid('json');
    console.log('[userGenerations] 创建生成记录请求:', { uid, prompt: prompt.substring(0, 50) + '...', ref_img });

    // 每次都创建新记录，不再检查或更新已有记录
    const newRecord = {
      uid,
      prompt,
      ...(ref_img && { ref_img }),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('4f831654_user_generations').insertOne(newRecord);
    
    // 返回完整的记录数据
    const savedRecord = await db.collection('4f831654_user_generations').findOne({ _id: result.insertedId });
    
    console.log('[userGenerations] 创建生成记录成功:', { uid, id: result.insertedId });
    return c.json({ 
      success: true, 
      message: '生成记录创建成功',
      data: savedRecord
    });
  } catch (error) {
    console.error('[userGenerations] 创建生成记录失败:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '创建生成记录失败' 
    }, 500);
  }
});



/**
 * 创建包含生成结果的记录
 */
userGenerationsRouter.post('/with-result', zValidator('json', createGenerationWithResultSchema), async (c: Context) => {
  try {
    const { uid, prompt, ref_img, g_imgurl1, g_imgurl2, g_imgurl3, g_imgurl4, download_img } = c.req.valid('json');
    console.log('[userGenerations] 创建包含生成结果的记录:', { 
      uid, 
      prompt: prompt.substring(0, 50) + '...', 
      ref_img: ref_img?.substring(0, 50) + '...',
      g_imgurl1: g_imgurl1?.substring(0, 50) + '...',
      g_imgurl2: g_imgurl2?.substring(0, 50) + '...',
      g_imgurl3: g_imgurl3?.substring(0, 50) + '...',
      g_imgurl4: g_imgurl4?.substring(0, 50) + '...',
      download_img: download_img?.substring(0, 50) + '...'
    });

    // 创建新记录，包含生成结果
    const newRecord = {
      uid,
      prompt,
      ...(ref_img && { ref_img }),
      ...(g_imgurl1 && { g_imgurl1 }),
      ...(g_imgurl2 && { g_imgurl2 }),
      ...(g_imgurl3 && { g_imgurl3 }),
      ...(g_imgurl4 && { g_imgurl4 }),
      ...(download_img && { download_img }),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('4f831654_user_generations').insertOne(newRecord);
    
    // 返回完整的记录数据
    const savedRecord = await db.collection('4f831654_user_generations').findOne({ _id: result.insertedId });
    
    console.log('[userGenerations] 创建包含生成结果的记录成功:', { uid, id: result.insertedId });
    return c.json({ 
      success: true, 
      message: '生成记录创建成功',
      data: savedRecord
    });
  } catch (error) {
    console.error('[userGenerations] 创建包含生成结果的记录失败:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '创建生成记录失败' 
    }, 500);
  }
});

/**
 * 更新下载记录
 */
userGenerationsRouter.put('/update-download', zValidator('json', updateDownloadRecordSchema), async (c: Context) => {
  try {
    const { uid, download_img } = c.req.valid('json');
    console.log('[userGenerations] 更新下载记录:', { uid, download_img: download_img.substring(0, 50) + '...' });

    // 找到用户最新的生成记录
    const latestRecord = await db.collection('4f831654_user_generations')
      .find({ uid })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (latestRecord.length === 0) {
      return c.json({ 
        success: false, 
        message: '未找到生成记录' 
      }, 404);
    }

    // 更新最新记录的下载字段
    const recordId = latestRecord[0]._id;
    const updateResult = await db.collection('4f831654_user_generations').updateOne(
      { _id: recordId },
      { 
        $set: { 
          download_img,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return c.json({ 
        success: false, 
        message: '更新下载记录失败' 
      }, 500);
    }

    // 返回更新后的记录
    const updatedRecord = await db.collection('4f831654_user_generations').findOne({ _id: recordId });
    
    console.log('[userGenerations] 更新下载记录成功:', { uid, recordId });
    return c.json({ 
      success: true, 
      message: '下载记录更新成功',
      data: updatedRecord
    });
  } catch (error) {
    console.error('[userGenerations] 更新下载记录失败:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '更新下载记录失败' 
    }, 500);
  }
});

/**
 * 获取用户生成记录
 */
userGenerationsRouter.get('/', zValidator('query', getGenerationsSchema), async (c: Context) => {
  try {
    const { uid, limit } = c.req.valid('query');
    
    console.log('[userGenerations] 获取用户生成记录请求:', { uid, limit });

    // 构建查询
    let query = db.collection('4f831654_user_generations')
      .find({ uid })
      .sort({ createdAt: -1 });

    // 如果指定了limit，添加限制
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const records = await query.toArray();

    console.log('[userGenerations] 获取生成记录成功:', { uid, count: records.length });
    return c.json({ 
      success: true, 
      message: '获取生成记录成功',
      data: records
    });
  } catch (error) {
    console.error('[userGenerations] 获取生成记录失败:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取生成记录失败' 
    }, 500);
  }
});

/**
 * 删除生成记录
 */
userGenerationsRouter.delete('/:uid', async (c: Context) => {
  try {
    const uid = c.req.param('uid');
    
    console.log('[userGenerations] 删除生成记录请求:', { uid });

    // 检查记录是否存在
    const existingRecord = await db.collection('4f831654_user_generations').findOne({ uid });
    
    if (!existingRecord) {
      return c.json({ 
        success: false, 
        message: '生成记录不存在' 
      }, 404);
    }

    // 删除记录
    await db.collection('4f831654_user_generations').deleteOne({ uid });
    
    console.log('[userGenerations] 删除生成记录成功:', { uid });
    return c.json({ 
      success: true, 
      message: '生成记录删除成功'
    });
  } catch (error) {
    console.error('[userGenerations] 删除生成记录失败:', error);
    return c.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '删除生成记录失败' 
    }, 500);
  }
});

export default userGenerationsRouter;
