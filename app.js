// app.js
App({
    globalData: {
      userInfo: undefined,
      currentKnowledgeBase: undefined,
      currentSession: undefined,
      chatAssistantId: '',
      userId: '', // 添加用户ID
      apiBaseUrl: 'http://localhost:9880',
      shouldOpenAddKnowledgeBase: false,
      wxLoginInfo: undefined, // 微信登录信息
      // 添加消息格式标准化配置
      messageConfig: {
        showThinking: false, // 默认隐藏思考内容
        autoScrollToBottom: true, // 自动滚动到底部
        enableMarkdown: true // 启用Markdown解析
      }
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
        // 设置用户ID
        if (userInfo.id) {
          this.globalData.userId = userInfo.id;
        }
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
      
      // 尝试获取保存的用户ID
      const userId = wx.getStorageSync('userId');
      if (userId && !this.globalData.userId) {
        this.globalData.userId = userId;
      }
      
      // 如果还没有用户ID，生成一个默认的
      if (!this.globalData.userId) {
        this.globalData.userId = 'user_' + Date.now();
        wx.setStorageSync('userId', this.globalData.userId);
      }
      
      console.log('App启动完成，全局数据:', {
        userId: this.globalData.userId,
        userInfo: !!this.globalData.userInfo,
        currentSession: !!this.globalData.currentSession,
        chatAssistantId: this.globalData.chatAssistantId
      });
    }
  });