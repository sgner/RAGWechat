// 登录重试机制测试文件
import { datasetApi, chatAssistantApi, wxLoginApi } from './api.js';

// 测试登录重试机制
export const testLoginRetryMechanism = () => {
  console.log('=== 开始测试登录重试机制 ===');
  
  // 清除现有登录信息，模拟未登录状态
  wxLoginApi.clearLoginInfo();
  console.log('已清除登录信息，模拟未登录状态');
  
  // 测试1: 单个请求的登录重试
  console.log('\n--- 测试1: 单个请求的登录重试 ---');
  datasetApi.listDatasets({ page: 1, limit: 10 })
    .then(result => {
      console.log('✅ 测试1成功: 获取数据集列表成功', result);
    })
    .catch(error => {
      console.error('❌ 测试1失败:', error.message);
    });
  
  // 测试2: 并发请求的登录处理
  console.log('\n--- 测试2: 并发请求的登录处理 ---');
  
  const requests = [
    datasetApi.listDatasets({ page: 1, limit: 5 }),
    chatAssistantApi.listAssistants({ page: 1, limit: 5 }),
    datasetApi.listDatasets({ page: 2, limit: 5 })
  ];
  
  Promise.allSettled(requests)
    .then(results => {
      console.log('✅ 测试2完成: 并发请求结果');
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`  请求${index + 1}: 成功`);
        } else {
          console.error(`  请求${index + 1}: 失败 -`, result.reason.message);
        }
      });
    });
  
  // 测试3: 延迟请求测试
  console.log('\n--- 测试3: 延迟请求测试 ---');
  
  setTimeout(() => {
    console.log('发送延迟请求...');
    chatAssistantApi.listAssistants({ page: 1, limit: 3 })
      .then(result => {
        console.log('✅ 测试3成功: 延迟请求成功', result);
      })
      .catch(error => {
        console.error('❌ 测试3失败:', error.message);
      });
  }, 2000);
};

// 测试登录状态检查
export const testLoginStatusCheck = () => {
  console.log('\n=== 测试登录状态检查 ===');
  
  const status = wxLoginApi.checkLoginStatus();
  if (status) {
    console.log('✅ 用户已登录:', {
      username: status.userInfo.username,
      id: status.userInfo.id,
      loginTime: new Date(status.loginTime).toLocaleString()
    });
  } else {
    console.log('❌ 用户未登录');
  }
};

// 测试请求阻止机制
export const testRequestBlocking = () => {
  console.log('\n=== 测试请求阻止机制 ===');
  
  // 清除登录信息
  wxLoginApi.clearLoginInfo();
  
  // 模拟登录失败的情况（可以通过修改网络或服务器来测试）
  console.log('发送需要登录的请求，观察是否会被阻止...');
  
  datasetApi.listDatasets({ page: 1, limit: 1 })
    .then(result => {
      console.log('✅ 请求成功（登录成功）:', result);
    })
    .catch(error => {
      console.error('❌ 请求被阻止（登录失败）:', error.message);
    });
};

// 测试登录重试次数
export const testLoginRetryCount = () => {
  console.log('\n=== 测试登录重试次数 ===');
  
  // 清除登录信息
  wxLoginApi.clearLoginInfo();
  
  // 记录开始时间
  const startTime = Date.now();
  
  datasetApi.listDatasets({ page: 1, limit: 1 })
    .then(result => {
      const endTime = Date.now();
      console.log(`✅ 登录重试成功，耗时: ${endTime - startTime}ms`);
    })
    .catch(error => {
      const endTime = Date.now();
      console.error(`❌ 登录重试失败，耗时: ${endTime - startTime}ms，错误:`, error.message);
    });
};

// 综合测试
export const runAllTests = () => {
  console.log('🚀 开始运行所有登录重试机制测试...\n');
  
  // 测试1: 登录重试机制
  testLoginRetryMechanism();
  
  // 等待3秒后测试登录状态
  setTimeout(() => {
    testLoginStatusCheck();
  }, 3000);
  
  // 等待5秒后测试请求阻止
  setTimeout(() => {
    testRequestBlocking();
  }, 5000);
  
  // 等待8秒后测试重试次数
  setTimeout(() => {
    testLoginRetryCount();
  }, 8000);
  
  console.log('\n📝 测试说明:');
  console.log('1. 观察控制台日志，查看登录重试过程');
  console.log('2. 检查是否有重复的登录请求');
  console.log('3. 验证并发请求是否等待同一个登录流程');
  console.log('4. 确认登录失败时请求被正确阻止');
  console.log('5. 测试完成后检查最终登录状态\n');
};

// 页面测试示例
export const pageTestExample = {
  data: {
    testResults: [],
    isTestingLogin: false
  },
  
  onLoad() {
    console.log('页面加载，准备测试登录重试机制');
  },
  
  // 测试按钮点击
  onTestLoginRetry() {
    if (this.data.isTestingLogin) {
      wx.showToast({
        title: '测试进行中...',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isTestingLogin: true });
    
    wx.showLoading({
      title: '测试中...',
      mask: true
    });
    
    // 运行测试
    runAllTests();
    
    // 10秒后结束测试
    setTimeout(() => {
      wx.hideLoading();
      this.setData({ isTestingLogin: false });
      
      wx.showModal({
        title: '测试完成',
        content: '登录重试机制测试已完成，请查看控制台日志了解详细结果。',
        showCancel: false,
        confirmText: '确定'
      });
    }, 10000);
  },
  
  // 清除登录信息测试
  onClearLoginInfo() {
    wxLoginApi.clearLoginInfo();
    wx.showToast({
      title: '登录信息已清除',
      icon: 'success'
    });
  },
  
  // 检查登录状态
  onCheckLoginStatus() {
    const status = wxLoginApi.checkLoginStatus();
    
    wx.showModal({
      title: '登录状态',
      content: status ? 
        `已登录\n用户: ${status.userInfo.username}\nID: ${status.userInfo.id}` : 
        '未登录',
      showCancel: false,
      confirmText: '确定'
    });
  }
}; 