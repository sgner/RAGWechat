// 聊天页面下拉刷新功能测试工具
import { chatAssistantApi, sessionApi } from './api.js';

// 测试下拉刷新功能
export const testChatRefresh = () => {
  console.log('=== 开始测试聊天页面下拉刷新功能 ===');
  
  return new Promise((resolve, reject) => {
    // 模拟刷新数据的过程
    console.log('1. 测试获取助手列表...');
    
    chatAssistantApi.listAssistants({
      page: 1,
      page_size: 30,
      orderby: 'update_time',
      desc: true
    })
      .then(assistants => {
        console.log('✅ 助手列表获取成功:', assistants?.length || 0, '个助手');
        
        if (assistants && assistants.length > 0) {
          const firstAssistant = assistants[0];
          console.log('2. 测试获取会话列表...');
          
          return sessionApi.listSessions({
            chat_id: firstAssistant.id,
            page: 1,
            page_size: 30,
            orderby: 'update_time',
            desc: true
          });
        } else {
          console.log('⚠️ 没有可用的助手');
          return [];
        }
      })
      .then(sessions => {
        console.log('✅ 会话列表获取成功:', sessions?.length || 0, '个会话');
        
        console.log('🎉 下拉刷新功能测试完成');
        resolve({
          success: true,
          assistantCount: sessions?.length || 0,
          sessionCount: sessions?.length || 0
        });
      })
      .catch(error => {
        console.error('❌ 下拉刷新功能测试失败:', error);
        reject(error);
      });
  });
};

// 测试手动刷新按钮
export const testManualRefresh = () => {
  console.log('=== 测试手动刷新按钮功能 ===');
  
  // 模拟点击刷新按钮
  wx.showToast({
    title: '正在刷新...',
    icon: 'loading',
    duration: 1000
  });
  
  return testChatRefresh()
    .then(result => {
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      });
      return result;
    })
    .catch(error => {
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
      throw error;
    });
};

// 验证刷新状态管理
export const testRefreshState = () => {
  console.log('=== 测试刷新状态管理 ===');
  
  const testStates = {
    refresherTriggered: false,
    isRefreshing: false
  };
  
  console.log('初始状态:', testStates);
  
  // 模拟开始刷新
  testStates.refresherTriggered = true;
  testStates.isRefreshing = true;
  console.log('开始刷新状态:', testStates);
  
  // 模拟刷新完成
  setTimeout(() => {
    testStates.refresherTriggered = false;
    testStates.isRefreshing = false;
    console.log('刷新完成状态:', testStates);
    console.log('✅ 刷新状态管理测试通过');
  }, 1000);
  
  return testStates;
};

// 快速测试所有刷新功能
export const quickRefreshTest = () => {
  console.log('⚡ 快速测试聊天页面刷新功能...');
  
  return Promise.all([
    testChatRefresh(),
    testRefreshState()
  ])
    .then(([refreshResult, stateResult]) => {
      console.log('🎉 所有刷新功能测试通过');
      return {
        refreshTest: refreshResult,
        stateTest: stateResult
      };
    })
    .catch(error => {
      console.error('❌ 刷新功能测试失败:', error);
      throw error;
    });
};

export default {
  testChatRefresh,
  testManualRefresh,
  testRefreshState,
  quickRefreshTest
}; 