import { Hono } from 'hono';
import { db } from '../lib/supaDb';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const userPhoneSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
});

const updateIndustrySchema = z.object({
  uid: z.string().min(1, '用户ID不能为空'),
  industry: z.object({
    primary: z.string().min(1, '一级分类不能为空'),
    secondary: z.string().min(1, '二级分类不能为空')
  })
});

// 用户生图次数相关schema
const checkDosageSchema = z.object({
  uid: z.string().min(1, '用户ID不能为空')
});

const consumeDosageSchema = z.object({
  uid: z.string().min(1, '用户ID不能为空')
});

const resetDosageSchema = z.object({
  uid: z.string().min(1, '用户ID不能为空')
});

const authRouter = new Hono();

// 初始化用户手机号数据
authRouter.post('/init', async (c) => {
  try {
    console.log('[Auth] 开始初始化用户手机号数据');
    
    // 检查是否已存在数据
    const existingCount = await db.collection('4f831654_user_phones').countDocuments();
    console.log('[Auth] 现有用户数量:', existingCount);
    
    if (existingCount === 0) {
      const userPhones = [];
      const testPhones = [
        '13800138000',
        '13900139000', 
        '15000150000',
        '18600186000',
        '13700137000',
        '15800158000',
        '18900189000',
        '13600136000',
        '15900159000',
        '18000180000'
      ];
      
      for (let i = 0; i < 10; i++) {
        const uid = `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const phone = testPhones[i];
        
        userPhones.push({
          uid,
          phone,
          dosage: 10, // 默认10次生图机会
          resettime: new Date() // 记录当前日期为Date对象
        });
        
        console.log(`[Auth] 生成用户 ${i + 1}: ${phone}, 生图次数: 10`);
      }
      
      await db.collection('4f831654_user_phones').insertMany(userPhones);
      console.log('[Auth] 成功初始化10个用户手机号');
      
      return c.json({
        success: true,
        message: '用户手机号初始化成功',
        data: userPhones.map(user => ({
          phone: user.phone
        }))
      });
    } else {
      console.log('[Auth] 用户手机号已存在，跳过初始化');
      return c.json({
        success: true,
        message: '用户手机号已存在',
        data: []
      });
    }
  } catch (error) {
    console.error('[Auth] 初始化用户手机号失败:', error.message);
    return c.json({
      success: false,
      message: '初始化失败',
      error: error.message
    }, 500);
  }
});

// 验证手机号
authRouter.post('/verify', zValidator('json', userPhoneSchema), async (c) => {
  try {
    const { phone } = c.req.valid('json');
    console.log('[Auth] 验证手机号:', phone);
    
    const result = await db.collection('4f831654_user_phones').findOne({
      phone: phone
    });
    
    if (result) {
      console.log('[Auth] 手机号验证成功:', result.uid);
      return c.json({
        success: true,
        message: '手机号验证成功',
        data: {
          uid: result.uid,
          phone: result.phone
        }
      });
    } else {
      console.log('[Auth] 手机号验证失败: 手机号不存在');
      return c.json({
        success: false,
        message: '手机号有误，请重新输入'
      }, 400);
    }
  } catch (error) {
    console.error('[Auth] 验证手机号时发生错误:', error.message);
    return c.json({
      success: false,
      message: '验证失败',
      error: error.message
    }, 500);
  }
});

// 获取所有手机号（调试用）
authRouter.get('/codes', async (c) => {
  try {
    const phones = await db.collection('4f831654_user_phones').find({}).toArray();
    console.log('[Auth] 获取手机号列表，数量:', phones.length);
    
    return c.json({
      success: true,
      message: '获取成功',
      data: phones.map(user => ({
        uid: user.uid,
        phone: user.phone
      }))
    });
  } catch (error) {
    console.error('[Auth] 获取手机号列表失败:', error.message);
    return c.json({
      success: false,
      message: '获取失败',
      error: error.message
    }, 500);
  }
});

// 更新用户行业信息
authRouter.put('/update-industry', zValidator('json', updateIndustrySchema), async (c) => {
  try {
    const { uid, industry } = c.req.valid('json');
    
    console.log('[AuthRouter] 更新用户行业信息:', { uid, industry });
    
    // 查找并更新用户手机号记录
    const result = await db.collection('4f831654_user_phones').updateOne(
      { uid },
      { 
        $set: { 
          industry: {
            primary: industry.primary,
            secondary: industry.secondary
          },
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return c.json({
        success: false,
        message: '用户不存在'
      }, 404);
    }
    
    // 获取更新后的用户信息
    const updatedUser = await db.collection('4f831654_user_phones').findOne({ uid });
    
    console.log('[AuthRouter] 更新用户行业信息成功:', updatedUser);
    
    return c.json({
      success: true,
      message: '更新行业信息成功',
      data: {
        uid: updatedUser.uid,
        phone: updatedUser.phone,
        industry: updatedUser.industry
      }
    });
  } catch (error) {
    console.error('[AuthRouter] 更新用户行业信息失败:', error);
    return c.json({
      success: false,
      message: '更新行业信息失败: ' + (error as Error).message
    }, 500);
  }
});

// 检查用户生图次数
authRouter.post('/check-dosage', zValidator('json', checkDosageSchema), async (c) => {
  try {
    const { uid } = c.req.valid('json');
    console.log('[Auth] 检查用户生图次数:', uid);
    
    const user = await db.collection('4f831654_user_phones').findOne({ uid });
    
    if (!user) {
      console.log('[Auth] 用户不存在:', uid);
      return c.json({
        success: false,
        message: '用户不存在'
      }, 404);
    }
    
    console.log('[Auth] 找到用户数据:', {
      uid: user.uid,
      phone: user.phone,
      dosage: user.dosage,
      resettime: user.resettime
    });
    
    const today = new Date().toDateString();
    const lastResetTime = user.resettime ? new Date(user.resettime).toDateString() : null;
    let dosage = user.dosage !== undefined ? user.dosage : 10; // 明确检查undefined，只在没有值时使用默认10次
    
    console.log('[Auth] 日期检查:', {
      today,
      lastResetTime,
      currentDosage: dosage,
      needsReset: lastResetTime !== today
    });
    
    // 如果不是今天的重置时间，则重置
    if (lastResetTime !== today) {
      dosage = 10;
      await db.collection('4f831654_user_phones').updateOne(
        { uid },
        { 
          $set: { 
            dosage: dosage,
            resettime: new Date(),
            updatedAt: new Date()
          }
        }
      );
      console.log('[Auth] 重置用户生图次数:', { uid, dosage, resettime: today });
    } else {
      console.log('[Auth] 无需重置，使用当前次数:', { uid, dosage });
    }
    
    const response = {
      success: true,
      message: '检查成功',
      data: {
        dosage: dosage,
        canGenerate: dosage > 0
      }
    };
    
    console.log('[Auth] 返回检查结果:', response);
    return c.json(response);
  } catch (error) {
    console.error('[Auth] 检查用户生图次数失败:', error.message);
    return c.json({
      success: false,
      message: '检查失败',
      error: error.message
    }, 500);
  }
});

// 消耗用户生图次数
authRouter.post('/consume-dosage', zValidator('json', consumeDosageSchema), async (c) => {
  try {
    const { uid } = c.req.valid('json');
    console.log('[Auth] 消耗用户生图次数:', uid);
    
    // 先检查并重置（如果需要）
    const checkResult = await db.collection('4f831654_user_phones').findOne({ uid });
    if (!checkResult) {
      return c.json({
        success: false,
        message: '用户不存在'
      }, 404);
    }
    
    const today = new Date().toDateString();
    const lastResetTime = checkResult.resettime ? new Date(checkResult.resettime).toDateString() : null;
    let currentDosage = checkResult.dosage !== undefined ? checkResult.dosage : 10;
    
    // 如果不是今天的重置时间，先重置
    if (lastResetTime !== today) {
      currentDosage = 10;
      await db.collection('4f831654_user_phones').updateOne(
        { uid },
        { 
          $set: { 
            dosage: currentDosage,
            resettime: new Date(),
            updatedAt: new Date()
          }
        }
      );
    }
    
    // 检查是否有足够的次数
    if (currentDosage <= 0) {
      return c.json({
        success: false,
        message: '今日生成次数已用完'
      }, 400);
    }
    
    // 消耗一次
    const newDosage = currentDosage - 1;
    await db.collection('4f831654_user_phones').updateOne(
      { uid },
      { 
        $set: { 
          dosage: newDosage,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('[Auth] 消耗生图次数成功:', { uid, newDosage });
    
    return c.json({
      success: true,
      message: '消耗成功',
      data: {
        dosage: newDosage,
        canGenerate: newDosage > 0
      }
    });
  } catch (error) {
    console.error('[Auth] 消耗用户生图次数失败:', error.message);
    return c.json({
      success: false,
      message: '消耗失败',
      error: error.message
    }, 500);
  }
});

// 重置用户生图次数
authRouter.post('/reset-dosage', zValidator('json', resetDosageSchema), async (c) => {
  try {
    const { uid } = c.req.valid('json');
    console.log('[Auth] 重置用户生图次数:', uid);
    
    const result = await db.collection('4f831654_user_phones').updateOne(
      { uid },
      { 
        $set: { 
          dosage: 10,
          resettime: new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return c.json({
        success: false,
        message: '用户不存在'
      }, 404);
    }
    
    console.log('[Auth] 重置生图次数成功:', { uid, dosage: 10 });
    
    return c.json({
      success: true,
      message: '重置成功',
      data: {
        dosage: 10,
        resettime: new Date()
      }
    });
  } catch (error) {
    console.error('[Auth] 重置用户生图次数失败:', error.message);
    return c.json({
      success: false,
      message: '重置失败',
      error: error.message
    }, 500);
  }
});

export { authRouter };
