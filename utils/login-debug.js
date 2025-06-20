// 登录调试工具
import { wxLoginApi } from './api.js';

// 调试登录数据处理
export const debugLoginDataProcessing = () => {
  console.log('=== 开始调试登录数据处理 ===');
  
  // 清除现有登录信息
  wxLoginApi.clearLoginInfo();
  
  // 模拟后端返回的数据结构（实际格式）
  const mockBackendResponse = {
    user: {
      createAt: "2025-05-26T21:03:58.243621500",
      email: null,
      id: "1926987675844349954",
      openId: "xxxxxxxxxxxxx",
      sessionId: "xxxxxxxxxxxxxxxxxxxxxxxxx",
      username: "user_32e78d044cd64bd18225ce989d22eacc"
    },
    jwt: "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NDgzMDA2MzgsInVzZXJJZCI6IjE5MjY5ODc2NzU4NDQzNDk5NTQiLCJ1c2VybmFtZSI6InVzZXJfMzJlNzhkMDQ0Y2Q2NGJkMTgyMjVjZTk4OWQyMmVhY2MifQ.aLqxwGn5hLOyJ2muzwYBHf4_8YRho_BUY3OMUpS0u-c"
  };
  
  console.log('模拟后端返回数据:', mockBackendResponse);
  
  // 验证数据结构
  if (!mockBackendResponse.jwt) {
    console.error('❌ 缺少JWT令牌');
    return false;
  }
  
  if (!mockBackendResponse.user || !mockBackendResponse.user.id) {
    console.error('❌ 缺少用户数据');
    return false;
  }
  
  console.log('✅ 数据结构验证通过');
  
  // 模拟登录数据处理
  try {
    const { jwt, user } = mockBackendResponse;
    
    // 保存登录信息到本地存储
    wx.setStorageSync('wxLoginCode', 'mock_code');
    wx.setStorageSync('wxLoginData', mockBackendResponse);
    wx.setStorageSync('wxJWT', jwt);
    wx.setStorageSync('loginTime', new Date().getTime());
    
    // 单独保存用户信息
    wx.setStorageSync('userInfo', {
      id: user.id,
      username: user.username,
      email: user.email,
      openId: user.openId,
      sessionId: user.sessionId,
      createAt: user.createAt
    });
    
    console.log('✅ 登录数据保存成功');
    
    // 验证登录状态检查
    const loginStatus = wxLoginApi.checkLoginStatus();
    
    if (!loginStatus) {
      console.error('❌ 登录状态检查失败');
      return false;
    }
    
    if (!loginStatus.jwt) {
      console.error('❌ 登录状态中缺少JWT');
      return false;
    }
    
    if (!loginStatus.userData || !loginStatus.userData.id) {
      console.error('❌ 登录状态中缺少用户数据');
      return false;
    }
    
    console.log('✅ 登录状态检查通过');
    console.log('登录状态:', {
      hasJWT: !!loginStatus.jwt,
      userId: loginStatus.userData.id,
      username: loginStatus.userData.username
    });
    
    return true;
  } catch (error) {
    console.error('❌ 登录数据处理失败:', error);
    return false;
  }
};

// 测试真实登录流程
export const testRealLogin = () => {
  console.log('=== 开始测试真实登录流程 ===');
  
  return new Promise((resolve, reject) => {
    // 清除现有登录信息
    wxLoginApi.clearLoginInfo();
    
    // 执行真实登录
    wxLoginApi.wxLogin()
      .then((loginResult) => {
        console.log('✅ 真实登录成功');
        console.log('登录结果结构:', {
          hasCode: !!loginResult.code,
          hasJWT: !!loginResult.jwt,
          hasLoginData: !!loginResult.loginData,
          hasUserData: !!loginResult.userData,
          hasUserInfo: !!loginResult.userInfo
        });
        
        console.log('JWT令牌:', loginResult.jwt ? loginResult.jwt.substring(0, 50) + '...' : '无');
        console.log('用户信息:', loginResult.userInfo);
        
        // 验证本地存储
        const storedJWT = wx.getStorageSync('wxJWT');
        const storedLoginData = wx.getStorageSync('wxLoginData');
        const storedUserInfo = wx.getStorageSync('userInfo');
        
        console.log('本地存储验证:', {
          hasStoredJWT: !!storedJWT,
          hasStoredLoginData: !!storedLoginData,
          hasStoredUserInfo: !!storedUserInfo
        });
        
        resolve(loginResult);
      })
      .catch((error) => {
        console.error('❌ 真实登录失败:', error);
        reject(error);
      });
  });
};

// 快速调试函数
export const quickDebug = () => {
  console.log('⚡ 快速调试登录状态...');
  
  const loginStatus = wxLoginApi.checkLoginStatus();
  
  if (loginStatus) {
    console.log('当前登录状态:', {
      hasJWT: !!loginStatus.jwt,
      hasUserData: !!loginStatus.userData,
      hasUserInfo: !!loginStatus.userInfo,
      userId: loginStatus.userData?.id,
      username: loginStatus.userInfo?.username
    });
    
    // 检查本地存储
    const storedJWT = wx.getStorageSync('wxJWT');
    const storedLoginData = wx.getStorageSync('wxLoginData');
    
    console.log('本地存储状态:', {
      storedJWT: storedJWT ? storedJWT.substring(0, 50) + '...' : '无',
      storedLoginData: !!storedLoginData
    });
  } else {
    console.log('❌ 未登录');
  }
  
  return loginStatus;
};

export default {
  debugLoginDataProcessing,
  testRealLogin,
  quickDebug
}; 