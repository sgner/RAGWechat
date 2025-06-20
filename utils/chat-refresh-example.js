// 聊天页面下拉刷新功能使用示例
import { testChatRefresh, testManualRefresh, quickRefreshTest } from './chat-refresh-test.js';

// 示例1: 基本的下拉刷新测试
export const basicRefreshExample = () => {
  console.log('=== 基本下拉刷新示例 ===');
  
  // 模拟用户下拉刷新操作
  console.log('用户执行下拉刷新...');
  
  return testChatRefresh()
    .then(result => {
      console.log('✅ 下拉刷新成功:', result);
      
      // 显示成功提示
      wx.showToast({
        title: `刷新成功！获取到${result.assistantCount}个助手`,
        icon: 'success',
        duration: 2000
      });
      
      return result;
    })
    .catch(error => {
      console.error('❌ 下拉刷新失败:', error);
      
      // 显示错误提示
      wx.showToast({
        title: '刷新失败，请重试',
        icon: 'none',
        duration: 2000
      });
      
      throw error;
    });
};

// 示例2: 手动刷新按钮测试
export const manualRefreshExample = () => {
  console.log('=== 手动刷新按钮示例 ===');
  
  // 模拟用户点击刷新按钮
  console.log('用户点击刷新按钮...');
  
  return testManualRefresh()
    .then(result => {
      console.log('✅ 手动刷新成功:', result);
      return result;
    })
    .catch(error => {
      console.error('❌ 手动刷新失败:', error);
      throw error;
    });
};

// 示例3: 完整的刷新流程演示
export const completeRefreshExample = () => {
  console.log('=== 完整刷新流程示例 ===');
  
  return new Promise((resolve, reject) => {
    // 步骤1: 显示开始提示
    wx.showModal({
      title: '刷新演示',
      content: '即将演示完整的刷新流程，包括助手列表和会话列表的更新',
      confirmText: '开始',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户确认，开始演示
          console.log('开始完整刷新流程演示...');
          
          // 步骤2: 执行刷新测试
          quickRefreshTest()
            .then(result => {
              console.log('✅ 完整刷新流程成功:', result);
              
              // 步骤3: 显示结果
              wx.showModal({
                title: '刷新完成',
                content: `刷新成功！\n助手数量: ${result.refreshTest.assistantCount}\n会话数量: ${result.refreshTest.sessionCount}`,
                showCancel: false,
                confirmText: '确定'
              });
              
              resolve(result);
            })
            .catch(error => {
              console.error('❌ 完整刷新流程失败:', error);
              
              // 显示错误信息
              wx.showModal({
                title: '刷新失败',
                content: `刷新过程中出现错误: ${error.message}`,
                showCancel: false,
                confirmText: '确定'
              });
              
              reject(error);
            });
        } else {
          // 用户取消
          console.log('用户取消了刷新演示');
          reject(new Error('用户取消操作'));
        }
      },
      fail: () => {
        reject(new Error('显示确认弹窗失败'));
      }
    });
  });
};

// 示例4: 页面集成示例
export const pageIntegrationExample = {
  // 在页面的data中添加刷新状态
  data: {
    refresherTriggered: false,
    isRefreshing: false,
    assistants: [],
    sessions: [],
    currentAssistant: {},
    currentSession: {}
  },
  
  // 下拉刷新事件处理
  onRefresh() {
    console.log('页面触发下拉刷新');
    
    this.setData({
      refresherTriggered: true,
      isRefreshing: true
    });
    
    // 执行刷新逻辑
    this.performRefresh()
      .finally(() => {
        this.setData({
          refresherTriggered: false,
          isRefreshing: false
        });
      });
  },
  
  // 手动刷新按钮点击
  onManualRefresh() {
    if (this.data.isRefreshing) {
      console.log('刷新正在进行中，忽略重复操作');
      return;
    }
    
    console.log('页面触发手动刷新');
    
    this.setData({
      isRefreshing: true
    });
    
    this.performRefresh()
      .finally(() => {
        this.setData({
          isRefreshing: false
        });
      });
  },
  
  // 执行刷新的核心方法
  performRefresh() {
    return testChatRefresh()
      .then(result => {
        console.log('页面刷新成功:', result);
        
        // 更新页面数据
        this.setData({
          assistants: result.assistants || [],
          sessions: result.sessions || []
        });
        
        wx.showToast({
          title: '刷新成功',
          icon: 'success'
        });
        
        return result;
      })
      .catch(error => {
        console.error('页面刷新失败:', error);
        
        wx.showToast({
          title: '刷新失败',
          icon: 'none'
        });
        
        throw error;
      });
  }
};

// 示例5: 错误处理示例
export const errorHandlingExample = () => {
  console.log('=== 错误处理示例 ===');
  
  // 模拟网络错误情况
  const simulateNetworkError = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('模拟网络连接失败'));
      }, 1000);
    });
  };
  
  // 测试错误处理
  return simulateNetworkError()
    .then(result => {
      console.log('不应该执行到这里');
      return result;
    })
    .catch(error => {
      console.log('✅ 成功捕获错误:', error.message);
      
      // 显示用户友好的错误提示
      wx.showToast({
        title: '网络连接失败，请检查网络后重试',
        icon: 'none',
        duration: 3000
      });
      
      // 返回默认数据
      return {
        success: false,
        error: error.message,
        assistantCount: 0,
        sessionCount: 0
      };
    });
};

// 导出所有示例
export default {
  basicRefreshExample,
  manualRefreshExample,
  completeRefreshExample,
  pageIntegrationExample,
  errorHandlingExample
}; 