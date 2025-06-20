// JWT登录功能测试
import { wxLoginApi, datasetApi } from './api.js';

// 测试JWT登录流程
export const testJWTLogin = () => {
  console.log('=== 开始JWT登录测试 ===');
  
  return new Promise((resolve, reject) => {
    // 清除现有登录信息
    wxLoginApi.clearLoginInfo();
    
    // 执行登录
    wxLoginApi.wxLogin()
      .then((loginResult) => {
        console.log('JWT登录成功:', loginResult);
        
        // 验证返回的数据结构
        if (!loginResult.jwt) {
          throw new Error('登录结果中缺少JWT令牌');
        }
        
        if (!loginResult.loginData || !loginResult.loginData.user) {
          throw new Error('登录结果中缺少用户数据');
        }
        
        console.log('✅ JWT令牌:', loginResult.jwt);
        console.log('✅ 用户信息:', loginResult.userInfo);
        
        // 测试登录状态检查
        const loginStatus = wxLoginApi.checkLoginStatus();
        if (!loginStatus || !loginStatus.jwt) {
          throw new Error('登录状态检查失败，缺少JWT');
        }
        
        console.log('✅ 登录状态检查通过');
        
        resolve(loginResult);
      })
      .catch((error) => {
        console.error('❌ JWT登录测试失败:', error);
        reject(error);
      });
  });
};

// 测试JWT请求头
export const testJWTRequest = () => {
  console.log('=== 开始JWT请求头测试 ===');
  
  return new Promise((resolve, reject) => {
    // 检查登录状态
    const loginStatus = wxLoginApi.checkLoginStatus();
    
    if (!loginStatus || !loginStatus.jwt) {
      reject(new Error('未登录或缺少JWT令牌'));
      return;
    }
    
    console.log('当前JWT令牌:', loginStatus.jwt);
    
    // 发起一个需要认证的请求
    datasetApi.listDatasets({ page: 1, limit: 10 })
      .then((result) => {
        console.log('✅ JWT认证请求成功:', result);
        resolve(result);
      })
      .catch((error) => {
        console.error('❌ JWT认证请求失败:', error);
        reject(error);
      });
  });
};

// 测试JWT令牌存储和恢复
export const testJWTStorage = () => {
  console.log('=== 开始JWT存储测试 ===');
  
  return new Promise((resolve, reject) => {
    try {
      // 获取当前存储的JWT
      const storedJWT = wx.getStorageSync('wxJWT');
      const storedLoginData = wx.getStorageSync('wxLoginData');
      
      if (!storedJWT) {
        throw new Error('本地存储中未找到JWT令牌');
      }
      
      if (!storedLoginData || !storedLoginData.jwt) {
        throw new Error('本地存储中的登录数据无效');
      }
      
      if (storedJWT !== storedLoginData.jwt) {
        throw new Error('JWT令牌存储不一致');
      }
      
      console.log('✅ JWT令牌存储正常');
      console.log('✅ 登录数据存储正常');
      
      // 测试登录状态恢复
      const loginStatus = wxLoginApi.checkLoginStatus();
      
      if (!loginStatus || loginStatus.jwt !== storedJWT) {
        throw new Error('登录状态恢复失败');
      }
      
      console.log('✅ 登录状态恢复正常');
      
      resolve({
        jwt: storedJWT,
        loginData: storedLoginData,
        loginStatus: loginStatus
      });
    } catch (error) {
      console.error('❌ JWT存储测试失败:', error);
      reject(error);
    }
  });
};

// 测试用户信息更新
export const testUserInfoUpdate = () => {
  console.log('=== 开始用户信息更新测试 ===');
  
  return new Promise((resolve, reject) => {
    try {
      const originalUserInfo = wxLoginApi.getCurrentUser();
      
      if (!originalUserInfo) {
        throw new Error('未找到原始用户信息');
      }
      
      console.log('原始用户信息:', originalUserInfo);
      
      // 更新用户信息
      const newInfo = {
        email: 'test@example.com',
        username: originalUserInfo.username + '_updated'
      };
      
      const updatedUserInfo = wxLoginApi.updateUserInfo(newInfo);
      
      if (!updatedUserInfo) {
        throw new Error('用户信息更新失败');
      }
      
      // 验证更新结果
      if (updatedUserInfo.email !== newInfo.email) {
        throw new Error('邮箱更新失败');
      }
      
      if (!updatedUserInfo.username.includes('_updated')) {
        throw new Error('用户名更新失败');
      }
      
      console.log('✅ 用户信息更新成功:', updatedUserInfo);
      
      // 验证登录数据也被更新
      const loginData = wx.getStorageSync('wxLoginData');
      if (!loginData.user || loginData.user.email !== newInfo.email) {
        throw new Error('登录数据中的用户信息未同步更新');
      }
      
      console.log('✅ 登录数据同步更新成功');
      
      resolve(updatedUserInfo);
    } catch (error) {
      console.error('❌ 用户信息更新测试失败:', error);
      reject(error);
    }
  });
};

// 运行所有JWT测试
export const runAllJWTTests = () => {
  console.log('🚀 开始运行所有JWT测试...');
  
  return testJWTLogin()
    .then(() => testJWTStorage())
    .then(() => testJWTRequest())
    .then(() => testUserInfoUpdate())
    .then(() => {
      console.log('🎉 所有JWT测试通过！');
      
      wx.showModal({
        title: '测试完成',
        content: '所有JWT登录测试都通过了！',
        showCancel: false,
        confirmText: '确定'
      });
    })
    .catch((error) => {
      console.error('💥 JWT测试失败:', error);
      
      wx.showModal({
        title: '测试失败',
        content: `JWT测试失败: ${error.message}`,
        showCancel: false,
        confirmText: '确定'
      });
      
      throw error;
    });
};

// 快速JWT登录测试（用于调试）
export const quickJWTTest = () => {
  console.log('⚡ 快速JWT测试...');
  
  // 检查当前登录状态
  const loginStatus = wxLoginApi.checkLoginStatus();
  
  if (loginStatus && loginStatus.jwt) {
    console.log('✅ 已登录，JWT令牌存在');
    console.log('JWT:', loginStatus.jwt.substring(0, 50) + '...');
    console.log('用户:', loginStatus.userInfo.username);
    
    wx.showToast({
      title: `已登录: ${loginStatus.userInfo.username}`,
      icon: 'success'
    });
  } else {
    console.log('❌ 未登录或JWT令牌缺失');
    
    wx.showToast({
      title: '未登录',
      icon: 'none'
    });
  }
  
  return loginStatus;
};

export default {
  testJWTLogin,
  testJWTRequest,
  testJWTStorage,
  testUserInfoUpdate,
  runAllJWTTests,
  quickJWTTest
}; 