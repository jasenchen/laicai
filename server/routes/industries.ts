import { Hono, Context } from 'hono';
import { db } from '../lib/supaDb';
import { z } from 'zod';

const industriesRouter = new Hono();

// 获取所有行业分类数据
industriesRouter.get('/', async (c) => {
  try {
    console.log('[IndustriesAPI] 获取行业分类数据');
    
    const industries = await db.collection('4f831654_industries')
      .find({})
      .sort({ sort_order: 1 })
      .toArray();
    
    console.log('[IndustriesAPI] 查询到行业数据:', industries.length, '条');
    
    // 如果数据为空，自动初始化
    if (industries.length === 0) {
      console.log('[IndustriesAPI] 数据为空，开始自动初始化...');
      
      // 清空现有数据
      await db.collection('4f831654_industries').deleteMany({});
      
      const industryData = [
        // 一级分类
        { id: 'food_primary', primary_category: '美食', secondary_category: '', level: 1, sort_order: 1 },
        { id: 'shopping_primary', primary_category: '购物', secondary_category: '', level: 1, sort_order: 2 },
        
        // 美食类二级分类
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
        
        // 购物类二级分类
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
        { id: '28', primary_category: '购物', secondary_category: '其他购物', level: 2, sort_order: 28 }
      ];
      
      await db.collection('4f831654_industries').insertMany(industryData);
      
      console.log('[IndustriesAPI] 自动初始化完成，插入', industryData.length, '条数据');
      
      // 重新查询数据
      const newIndustries = await db.collection('4f831654_industries')
        .find({})
        .sort({ sort_order: 1 })
        .toArray();
      
      return processIndustriesData(newIndustries, c);
    }
    
    return processIndustriesData(industries, c);
  } catch (error) {
    console.error('[IndustriesAPI] 获取行业数据失败:', error.message);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// 处理行业数据的辅助函数
function processIndustriesData(industries: any[], c: Context) {
  // 按一级分类分组
  const groupedData: Record<string, string[]> = {};
  const primaryCategories: string[] = [];
  
  industries.forEach(item => {
    const primary = item.primary_category;
    
    // 一级分类处理
    if (item.level === 1) {
      if (!primaryCategories.includes(primary)) {
        primaryCategories.push(primary);
      }
      if (!groupedData[primary]) {
        groupedData[primary] = [];
      }
    } 
    // 二级分类处理
    else if (item.level === 2) {
      if (!primaryCategories.includes(primary)) {
        primaryCategories.push(primary);
      }
      if (!groupedData[primary]) {
        groupedData[primary] = [];
      }
      if (item.secondary_category) {
        groupedData[primary].push(item.secondary_category);
      }
    }
  });
  
  // 排序二级分类
  Object.keys(groupedData).forEach(key => {
    groupedData[key].sort();
  });
  
  const result = {
    primaryCategories,
    secondaryCategories: groupedData
  };
  
  console.log('[IndustriesAPI] 返回分组数据:', {
    primaryCount: primaryCategories.length,
    secondaryCategories: Object.keys(groupedData).length
  });
  
  return c.json({
    success: true,
    data: result
  });
}

// 初始化行业数据（仅用于初始化）
industriesRouter.post('/init', async (c) => {
  try {
    console.log('[IndustriesAPI] 初始化行业数据');
    
    // 清空现有数据
    await db.collection('4f831654_industries').deleteMany({});
    
    const industryData = [
      // 一级分类
      { id: 'food_primary', primary_category: '美食', secondary_category: '', level: 1, sort_order: 1 },
      { id: 'shopping_primary', primary_category: '购物', secondary_category: '', level: 1, sort_order: 2 },
      
      // 美食类二级分类
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
      
      // 购物类二级分类
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
      { id: '28', primary_category: '购物', secondary_category: '其他购物', level: 2, sort_order: 28 }
    ];
    
    await db.collection('4f831654_industries').insertMany(industryData);
    
    console.log('[IndustriesAPI] 初始化完成，插入', industryData.length, '条数据');
    
    return c.json({
      success: true,
      message: `成功初始化 ${industryData.length} 条行业数据`
    });
  } catch (error) {
    console.error('[IndustriesAPI] 初始化行业数据失败:', error.message);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

export default industriesRouter;
