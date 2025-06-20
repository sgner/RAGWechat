// pages/profile/profile.js
import { chatAssistantApi, sessionApi, wxLoginApi } from '../../utils/api';

Page({
  data: {
    apiBaseUrl: 'http://your-ragflow-api-url/api/v1',
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    // 微信登录相关数据
    wxLoginInfo: null,
    isWxLoggedIn: false
  },
  
  onLoad() {
    // 初始化加载操作
    this.checkWxLoginStatus();
  },

  onShow() {
    // 每次显示页面时检查登录状态
    this.checkWxLoginStatus();
  },

  // 检查微信登录状态
  checkWxLoginStatus() {
    const app = getApp();
    const wxLoginInfo = app.globalData.wxLoginInfo || wxLoginApi.checkLoginStatus();
    
    if (wxLoginInfo) {
      // 格式化登录时间
      let formattedLoginTime = '';
      if (wxLoginInfo.loginTime) {
        const loginDate = new Date(wxLoginInfo.loginTime);
        formattedLoginTime = loginDate.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      this.setData({
        wxLoginInfo: {
          ...wxLoginInfo,
          formattedLoginTime: formattedLoginTime
        },
        isWxLoggedIn: true
      });
      console.log('Profile页面 - 微信登录状态有效:', wxLoginInfo);
    } else {
      this.setData({
        wxLoginInfo: null,
        isWxLoggedIn: false
      });
      console.log('Profile页面 - 未检测到有效的微信登录状态');
    }
  },

  // 手动触发微信登录
  triggerWxLogin() {
    wx.showModal({
      title: '确认登录',
      content: '是否进行微信登录？',
      confirmText: '确认登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '登录中...'
          });

          wxLoginApi.wxLogin()
            .then((loginResult) => {
              wx.hideLoading();
              console.log('手动微信登录成功:', loginResult);
              
              // 更新全局数据
              const app = getApp();
              app.globalData.wxLoginInfo = loginResult;
              
              // 更新页面数据
              this.setData({
                wxLoginInfo: {
                  ...loginResult,
                  formattedLoginTime: new Date(loginResult.loginTime).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                },
                isWxLoggedIn: true
              });
              
              wx.showToast({
                title: '登录成功',
                icon: 'success'
              });
            })
            .catch((error) => {
              wx.hideLoading();
              console.error('手动微信登录失败:', error);
              
              wx.showToast({
                title: '登录失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  // 清除微信登录信息
  clearWxLogin() {
    wx.showModal({
      title: '确认退出',
      content: '确定要清除微信登录信息吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wxLoginApi.clearLoginInfo();
          
          // 清除全局数据
          const app = getApp();
          app.globalData.wxLoginInfo = null;
          
          // 更新页面数据
          this.setData({
            wxLoginInfo: null,
            isWxLoggedIn: false
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },
  
  getUserProfile() {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
      }
    });
  },
  
  // 清除所有会话
  clearAllSessions() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有会话记录吗？此操作不可撤销。',
      confirmColor: '#FF0000',
      success: (res) => {
        if (res.confirm) {
          this.getAllChats().then(chats => {
            if (chats && chats.length > 0) {
              // 收集所有删除会话的Promise
              const deletePromises = chats.map(chat => {
                return this.getSessionsByChatId(chat.id).then(sessions => {
                  const sessionIds = sessions.map(session => session.id);
                  if (sessionIds.length > 0) {
                    return sessionApi.deleteSessions(chat.id, sessionIds);
                  }
                  return Promise.resolve();
                });
              });
              
              // 等待所有删除操作完成
              Promise.all(deletePromises).then(() => {
                wx.showToast({
                  title: '清除成功',
                  icon: 'success'
                });
                
                // 重置全局状态
                const app = getApp();
                app.globalData.currentSession = null;
              }).catch(err => {
                console.error('清除会话失败:', err);
                wx.showToast({
                  title: '清除失败',
                  icon: 'none'
                });
              });
            } else {
              wx.showToast({
                title: '没有会话可清除',
                icon: 'none'
              });
            }
          }).catch(err => {
            console.error('获取聊天助手失败:', err);
          });
        }
      }
    });
  },
  
  // 获取所有聊天助手
  getAllChats() {
    return chatAssistantApi.listAssistants({
      page: 1,
      page_size: 100
    });
  },
  
  // 获取指定聊天助手的会话
  getSessionsByChatId(chatId) {
    return sessionApi.listSessions({
      chat_id: chatId,
      page: 1,
      page_size: 100
    });
  },
  
  // 关于应用
  showAbout() {
    wx.showModal({
      title: '关于RAG知识库小程序',
      content: '该应用基于DeepRAGForge API构建，提供知识库创建与管理、文档解析、基于知识的聊天等功能。\n\nVersion: 1.0.0\n© 2023 DeepRAGForge',
      showCancel: false
    });
  },
  
  // 联系我们
  contactUs() {
    wx.showModal({
      title: '联系我们',
      content: '如果您有任何问题或反馈，请通过以下方式联系我们：\n\nEmail: support@deepragforge.com\n官网: www.deepragforge.com',
      showCancel: false
    });
  }
});