/**
 * 清除用户生成记录的临时脚本
 * 这个脚本用于清除 user_generations 表中的所有数据
 */

// 直接执行清除操作
async function clearUserGenerations() {
  try {
    console.log('[clearUserGenerations] 开始清除所有用户生成记录');

    // 获取当前数据库中所有记录数量
    const beforeCount = await db.collection('4f831654_user_generations').countDocuments();
    console.log('[clearUserGenerations] 清除前记录数量:', beforeCount);

    // 删除所有记录
    const deleteResult = await db.collection('4f831654_user_generations').deleteMany({});
    
    console.log('[clearUserGenerations] 清除所有生成记录成功:', { 
      deletedCount: deleteResult.deletedCount,
      beforeCount 
    });
    
    return { 
      success: true, 
      deletedCount: deleteResult.deletedCount,
      beforeCount
    };
  } catch (error) {
    console.error('[clearUserGenerations] 清除所有生成记录失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '清除所有生成记录失败' 
    };
  }
}

// 立即执行清除操作
clearUserGenerations().then(result => {
  console.log('[clearUserGenerations] 清除操作完成:', result);
}).catch(error => {
  console.error('[clearUserGenerations] 清除操作失败:', error);
});