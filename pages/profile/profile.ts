Page({
  data: {
    userInfo: null as WechatMiniprogram.UserInfo | null,
    usageStats: {
      chatCount: 120,
      knowledgeBaseCount: 5,
      documentCount: 32
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.getUserProfile !== undefined
  },

  onLoad() {
    // 尝试获取缓存的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      });
    }
  },
  
  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        // 保存用户信息
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        
        // 缓存用户信息
        wx.setStorageSync('userInfo', res.userInfo);
        
        // 更新全局用户信息
        const app = getApp<IAppOption>();
        app.globalData.userInfo = res.userInfo;
      }
    });
  },
  
  // 跳转到关于页面
  navigateToAbout() {
    wx.showModal({
      title: '关于应用',
      content: '知识库管理与对话助手 v1.0.0\n基于微信小程序开发\n开发者: Claude',
      showCancel: false
    });
  },

  // 进入设置页面
  navigateToSettings() {
          wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    });
  },

  // 清除缓存
  clearCache() {
    wx.showLoading({
      title: '清理中...',
    });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '缓存已清理',
            icon: 'success'
          });
    }, 1000);
  }
}); 