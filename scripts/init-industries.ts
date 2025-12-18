// 临时脚本：初始化行业数据
// 这个脚本只用于一次性初始化数据，之后可以删除

const initIndustries = async () => {
  try {
    console.log('开始初始化行业数据...');
    
    const response = await fetch(`${process.env.AIPA_API_DOMAIN}/api/industries/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 行业数据初始化成功:', result.message);
    } else {
      console.error('❌ 行业数据初始化失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 初始化过程中出错:', error.message);
  }
};

// 如果直接运行此文件，则执行初始化
// 注意：这个检查在ES模块中可能不工作，但保留用于兼容性
if (typeof require !== 'undefined' && (require as any).main) {
  initIndustries();
}

export default initIndustries;