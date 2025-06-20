// app.ts
App<IAppOption>({
  globalData: {
    userInfo: undefined,
    currentKnowledgeBase: undefined,
    currentSession: undefined,
    chatAssistantId: '',
    apiBaseUrl: 'http://your-ragflow-api-url/api/v1' // 替换为实际的API地址
  },
  
  onLaunch() {
    // 加载TDesign主题
    wx.loadFontFace({
      family: 'TDesign',
      source: 'url("https://tdesign.gtimg.com/miniprogram/fonts/tdesign-icon-v1.3.0.ttf")',
      success: () => {
        console.log('TDesign字体加载成功');
      },
      fail: (res) => {
        console.error('TDesign字体加载失败', res);
      }
    });
    
    // 获取设备信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    
    // 尝试获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
    
    // 尝试获取保存的会话信息
    const sessionInfo = wx.getStorageSync('currentSession');
    if (sessionInfo) {
      this.globalData.currentSession = sessionInfo;
    }
    
    // 尝试获取保存的聊天助手ID
    const chatAssistantId = wx.getStorageSync('chatAssistantId');
    if (chatAssistantId) {
      this.globalData.chatAssistantId = chatAssistantId;
    }
    
    // 登录
    wx.login({
      success: res => {
        console.log('微信登录成功，code:', res.code);
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    });
  }
}); 