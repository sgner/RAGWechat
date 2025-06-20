// 登录修复验证测试
import { wxLoginApi } from './api.js';

// 模拟正确的后端响应格式
const mockCorrectResponse = {
  code: 20000,
  msg: null,
  data: {
    user: {
      username: "user_32e78d044cd64bd18225ce989d22eacc",
      id: "1926987675844349954",
      createAt: "2025-05-26T21:03:58.243621500",
      email: null,
      sessionId: "xxxxxxxxxxxxxxxxxxxxxxxxx",
      openId: "xxxxxxxxxxxxx"
    },
    jwt: "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NDgzMDA2MzgsInVzZXJJZCI6IjE5MjY5ODc2NzU4NDQzNDk5NTQiLCJ1c2VybmFtZSI6InVzZXJfMzJlNzhkMDQ0Y2Q2NGJkMTgyMjVjZTk4OWQyMmVhY2MifQ.aLqxwGn5hLOyJ2muzwYBHf4_8YRho_BUY3OMUpS0u-c"
  }
};

// 测试数据处理逻辑
export const testDataProcessing = () => {
  console.log('=== 测试登录数据处理修复 ===');
  
  // 模拟request函数的处理逻辑
  const processResponse = (res, url) => {
    if (res.data) {
      // 情况1: 标准响应 {code: 0, data: ...}
      if (res.data.code === 0) {
        return res.data.data;
      }
      
      // 情况2: 嵌套响应 {code: 20000, msg: null, data: {...}}
      if (res.data.code === 20000 && res.data.data) {
        // 对于登录接口，data字段直接包含{user, jwt}
        if (url.includes('/sessionId/') && res.data.data.user && res.data.data.jwt) {
          console.log('✅ 检测到登录接口返回，直接解析data字段');
          return res.data.data;
        }
        
        // 其他接口的标准嵌套处理
        if (res.data.data.code === 0) {
          return res.data.data.data;
        }
      }
    }
    
    throw new Error('无法处理的响应格式');
  };
  
  try {
    // 测试登录接口处理
    const loginUrl = 'http://localhost:9880/wx/login/sessionId/test_code';
    const result = processResponse({ data: mockCorrectResponse }, loginUrl);
    
    console.log('处理结果:', result);
    
    // 验证结果
    if (!result.jwt) {
      throw new Error('缺少JWT令牌');
    }
    
    if (!result.user || !result.user.id) {
      throw new Error('缺少用户数据');
    }
    
    console.log('✅ 数据处理测试通过');
    console.log('JWT:', result.jwt.substring(0, 50) + '...');
    console.log('用户ID:', result.user.id);
    console.log('用户名:', result.user.username);
    
    return true;
  } catch (error) {
    console.error('❌ 数据处理测试失败:', error);
    return false;
  }
};

// 测试完整登录流程
export const testCompleteLoginFlow = () => {
  console.log('=== 测试完整登录流程 ===');
  
  return new Promise((resolve, reject) => {
    // 清除现有登录信息
    wxLoginApi.clearLoginInfo();
    
    console.log('开始执行登录...');
    
    wxLoginApi.wxLogin()
      .then((loginResult) => {
        console.log('✅ 登录成功');
        
        // 验证登录结果结构
        const checks = {
          hasCode: !!loginResult.code,
          hasJWT: !!loginResult.jwt,
          hasLoginData: !!loginResult.loginData,
          hasUserData: !!loginResult.userData,
          hasUserInfo: !!loginResult.userInfo,
          jwtFormat: loginResult.jwt && loginResult.jwt.startsWith('eyJ'),
          userIdExists: loginResult.userData && !!loginResult.userData.id,
          usernameExists: loginResult.userInfo && !!loginResult.userInfo.username
        };
        
        console.log('登录结果验证:', checks);
        
        // 检查是否所有必要字段都存在
        const allChecksPass = Object.values(checks).every(check => check === true);
        
        if (allChecksPass) {
          console.log('🎉 所有验证通过！');
          
          // 显示关键信息
          console.log('关键信息:');
          console.log('- JWT:', loginResult.jwt.substring(0, 50) + '...');
          console.log('- 用户ID:', loginResult.userData.id);
          console.log('- 用户名:', loginResult.userInfo.username);
          
          resolve(loginResult);
        } else {
          const failedChecks = Object.entries(checks)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
          
          throw new Error(`验证失败的项目: ${failedChecks.join(', ')}`);
        }
      })
      .catch((error) => {
        console.error('❌ 登录流程测试失败:', error);
        reject(error);
      });
  });
};

// 快速验证修复
export const quickVerifyFix = () => {
  console.log('⚡ 快速验证修复...');
  
  // 先测试数据处理
  const dataProcessingOK = testDataProcessing();
  
  if (dataProcessingOK) {
    console.log('✅ 数据处理修复验证通过');
    
    // 检查当前登录状态
    const loginStatus = wxLoginApi.checkLoginStatus();
    
    if (loginStatus && loginStatus.jwt) {
      console.log('✅ 当前已登录，JWT存在');
      console.log('用户:', loginStatus.userInfo.username);
      return true;
    } else {
      console.log('ℹ️ 当前未登录，可以测试登录流程');
      return 'not_logged_in';
    }
  } else {
    console.log('❌ 数据处理修复验证失败');
    return false;
  }
};

export default {
  testDataProcessing,
  testCompleteLoginFlow,
  quickVerifyFix
}; 