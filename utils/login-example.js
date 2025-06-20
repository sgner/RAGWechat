// 微信登录使用示例
import { wxLoginApi, userApi } from './api.js';

// 示例：用户手动登录（带无限重试机制）
export const handleUserLogin = (maxRetries = Infinity) => {
  return new Promise((resolve, reject) => {
    // 首先询问用户是否要登录
    wx.showModal({
      title: '需要登录',
      content: '此操作需要微信登录，是否立即登录？',
      confirmText: '立即登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户确认登录，开始手动重试流程
          performManualLoginWithRetry(maxRetries)
            .then(resolve)
            .catch(reject);
        } else {
          // 用户取消登录
          reject(new Error('用户取消登录'));
        }
      },
      fail: () => {
        reject(new Error('登录确认弹窗失败'));
      }
    });
  });
};

// 执行手动登录重试（支持无限重试）
const performManualLoginWithRetry = (maxRetries = Infinity) => {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    
    const attemptLogin = () => {
      const isInfinite = maxRetries === Infinity;
      
      wx.showLoading({ 
        title: `登录中...(第${retryCount + 1}次)`,
        mask: true
      });
      
      wxLoginApi.wxLogin()
        .then((loginResult) => {
          wx.hideLoading();
          
          console.log('登录成功:', loginResult);
          
          // 登录结果包含以下信息：
          // loginResult.code - 微信登录code
          // loginResult.jwt - JWT令牌
          // loginResult.loginData - 完整的登录数据（包含jwt和user）
          // loginResult.userData - 用户数据
          // loginResult.userInfo - 格式化的用户信息
          
          const userInfo = loginResult.userInfo;
          
          wx.showToast({
            title: `欢迎，${userInfo.username}！`,
            icon: 'success'
          });
          
          resolve(loginResult);
        })
        .catch((error) => {
          wx.hideLoading();
          console.error(`登录失败 (第${retryCount + 1}次尝试):`, error);
          
          retryCount++;
          
          // 询问用户是否重试（无限重试模式）
          wx.showModal({
            title: '登录失败',
            content: `${error.message || '登录失败'}，是否重试？${isInfinite ? '' : `(剩余${maxRetries - retryCount + 1}次机会)`}`,
            confirmText: '重试',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                // 用户选择重试
                console.log(`用户确认进行第${retryCount + 1}次登录重试...`);
                setTimeout(() => {
                  attemptLogin();
                }, 500);
              } else {
                // 用户取消重试
                reject(new Error('用户取消登录重试'));
              }
            },
            fail: () => {
              reject(error);
            }
          });
        });
    };
    
    // 开始第一次登录尝试
    attemptLogin();
  });
};

// 示例：检查登录状态
export const checkUserLoginStatus = () => {
  const loginStatus = wxLoginApi.checkLoginStatus();
  
  if (loginStatus) {
    console.log('用户已登录:', loginStatus.userInfo);
    return {
      isLoggedIn: true,
      userInfo: loginStatus.userInfo,
      jwt: loginStatus.jwt
    };
  } else {
    console.log('用户未登录');
    return {
      isLoggedIn: false,
      userInfo: null,
      jwt: null
    };
  }
};

// 示例：获取当前用户信息
export const getCurrentUserInfo = () => {
  const userInfo = wxLoginApi.getCurrentUser();
  
  if (userInfo) {
    console.log('当前用户信息:', userInfo);
    return userInfo;
  } else {
    console.log('未找到用户信息，可能需要重新登录');
    return null;
  }
};

// 示例：获取JWT令牌
export const getCurrentJWT = () => {
  const loginStatus = wxLoginApi.checkLoginStatus();
  
  if (loginStatus && loginStatus.jwt) {
    console.log('当前JWT令牌:', loginStatus.jwt);
    return loginStatus.jwt;
  } else {
    console.log('未找到JWT令牌，可能需要重新登录');
    return null;
  }
};

// 示例：验证JWT令牌有效性
export const validateJWTToken = () => {
  return new Promise((resolve, reject) => {
    const loginStatus = wxLoginApi.checkLoginStatus();
    
    if (!loginStatus || !loginStatus.jwt) {
      reject(new Error('JWT令牌不存在'));
      return;
    }
    
    // 通过发起一个简单的API请求来验证JWT有效性
    userApi.getUserInfo()
      .then((userInfo) => {
        console.log('JWT令牌验证成功，用户信息:', userInfo);
        resolve({
          isValid: true,
          jwt: loginStatus.jwt,
          userInfo: userInfo
        });
      })
      .catch((error) => {
        console.error('JWT令牌验证失败:', error);
        
        // 如果是401错误，说明JWT已过期或无效
        if (error.code === 401 || error.code === 403) {
          // 清除无效的登录信息
          wxLoginApi.clearLoginInfo();
          reject(new Error('JWT令牌已过期或无效'));
        } else {
          reject(error);
        }
      });
  });
};

// 示例：更新用户信息
export const updateCurrentUserInfo = (newInfo) => {
  return new Promise((resolve, reject) => {
    // 先更新本地存储
    const updatedInfo = wxLoginApi.updateUserInfo(newInfo);
    
    if (updatedInfo) {
      // 如果需要，也可以同步到服务器
      userApi.updateUserInfo(newInfo)
        .then((serverResponse) => {
          console.log('用户信息已同步到服务器:', serverResponse);
          resolve(updatedInfo);
        })
        .catch((error) => {
          console.error('同步用户信息到服务器失败:', error);
          // 即使服务器同步失败，本地更新仍然有效
          resolve(updatedInfo);
        });
    } else {
      reject(new Error('更新本地用户信息失败'));
    }
  });
};

// 示例：用户登出
export const handleUserLogout = () => {
  return new Promise((resolve) => {
    wx.showModal({
      title: '确认登出',
      content: '确定要退出登录吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wxLoginApi.clearLoginInfo();
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
          
          console.log('用户已登出');
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
};

// 示例：智能登录（先检查状态，再决定是否需要登录）
export const smartLogin = (options = {}) => {
  const { 
    maxRetries = Infinity, 
    showToast = true 
  } = options;
  
  return new Promise((resolve, reject) => {
    // 先检查登录状态
    const loginStatus = checkUserLoginStatus();
    
    if (loginStatus.isLoggedIn) {
      // 已登录，直接返回
      if (showToast) {
        wx.showToast({
          title: `欢迎回来，${loginStatus.userInfo.username}！`,
          icon: 'success'
        });
      }
      resolve(loginStatus);
    } else {
      // 未登录，需要手动登录
      handleUserLogin(maxRetries)
        .then((loginResult) => {
          resolve({
            isLoggedIn: true,
            userInfo: loginResult.userInfo,
            jwt: loginResult.jwt,
            loginResult: loginResult
          });
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
};

// 示例：在页面中使用
export const pageLoginExample = {
  data: {
    userInfo: null,
    isLoggedIn: false,
    isLogging: false,
    jwt: null
  },
  
  onLoad() {
    // 页面加载时检查登录状态
    this.checkLoginStatus();
  },
  
  checkLoginStatus() {
    const status = checkUserLoginStatus();
    this.setData({
      isLoggedIn: status.isLoggedIn,
      userInfo: status.userInfo,
      jwt: status.jwt
    });
  },
  
  // 登录按钮点击事件
  onLoginTap() {
    if (this.data.isLogging) {
      console.log('正在登录中，请勿重复点击');
      return;
    }
    
    this.setData({ isLogging: true });
    
    // 可以自定义重试次数，默认无限次
    handleUserLogin()
      .then((loginResult) => {
        this.setData({
          isLoggedIn: true,
          userInfo: loginResult.userInfo,
          jwt: loginResult.jwt,
          isLogging: false
        });
        
        // 登录成功后可以执行其他操作
        console.log('用户登录成功，可以进行后续操作');
      })
      .catch((error) => {
        console.error('最终登录失败:', error);
        
        // 登录最终失败的处理
        this.setData({
          isLoggedIn: false,
          userInfo: null,
          jwt: null,
          isLogging: false
        });
      });
  },
  
  // 智能登录按钮点击事件
  onSmartLoginTap() {
    if (this.data.isLogging) {
      console.log('正在登录中，请勿重复点击');
      return;
    }
    
    this.setData({ isLogging: true });
    
    smartLogin({ showToast: true })
      .then((result) => {
        this.setData({
          isLoggedIn: result.isLoggedIn,
          userInfo: result.userInfo,
          jwt: result.jwt,
          isLogging: false
        });
      })
      .catch((error) => {
        console.error('智能登录失败:', error);
        this.setData({
          isLoggedIn: false,
          userInfo: null,
          jwt: null,
          isLogging: false
        });
      });
  },
  
  // 登出按钮点击事件
  onLogoutTap() {
    handleUserLogout()
      .then((loggedOut) => {
        if (loggedOut) {
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            jwt: null
          });
        }
      });
  },
  
  // 更新用户信息示例
  onUpdateUserInfo() {
    const newInfo = {
      username: '新用户名',
      email: 'new@example.com'
    };
    
    updateCurrentUserInfo(newInfo)
      .then((updatedInfo) => {
        this.setData({
          userInfo: updatedInfo
        });
        
        wx.showToast({
          title: '信息更新成功',
          icon: 'success'
        });
      })
      .catch((error) => {
        console.error('更新用户信息失败:', error);
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      });
  },
  
  // 验证JWT令牌示例
  onValidateJWT() {
    wx.showLoading({ title: '验证中...' });
    
    validateJWTToken()
      .then((result) => {
        wx.hideLoading();
        
        wx.showModal({
          title: 'JWT验证成功',
          content: `令牌有效，用户: ${result.userInfo.username}`,
          showCancel: false
        });
      })
      .catch((error) => {
        wx.hideLoading();
        
        wx.showModal({
          title: 'JWT验证失败',
          content: error.message,
          showCancel: false
        });
        
        // 如果JWT无效，更新页面状态
        if (error.message.includes('过期') || error.message.includes('无效')) {
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            jwt: null
          });
        }
      });
  },
  
  // 显示JWT令牌信息
  onShowJWTInfo() {
    const jwt = getCurrentJWT();
    
    if (jwt) {
      const shortJWT = jwt.substring(0, 50) + '...';
      
      wx.showModal({
        title: 'JWT令牌信息',
        content: `令牌: ${shortJWT}`,
        showCancel: false
      });
    } else {
      wx.showToast({
        title: '未找到JWT令牌',
        icon: 'none'
      });
    }
  }
}; 