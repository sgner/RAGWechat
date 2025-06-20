Page({
  data: {
    apiBaseUrl: 'http://your-ragflow-api-url/api/v1', // 替换为实际的API地址
    // 知识库选择
    knowledgeBaseOptions: [] as Array<{label: string, value: string}>,
    selectedKnowledgeBase: '',
    currentKnowledgeBase: {
      id: '',
      name: '',
      description: '',
      createTime: '',
      updateTime: '',
      docsCount: 0,
      tags: [] as string[],
      embedding_model: '',
      chunk_method: '',
      parser_config: {}
    } as IKnowledgeBase,
    // 助手选择
    assistantOptions: [] as Array<{label: string, value: string}>,
    selectedAssistant: '',
    assistants: [] as any[],
    // 会话选择
    sessionOptions: [] as Array<{label: string, value: string}>,
    selectedSession: '',
    sessions: [] as any[],
    // 会话信息
    currentChatId: '',
    currentSessionId: '',
    // 消息列表
    messages: [] as IMessage[],
    // 输入消息
    inputMessage: '',
    // 是否正在加载回复
    isLoading: false,
    // 用于自动滚动到最新消息
    scrollToMessage: '',
    // 引用面板
    showReferences: false,
    currentReferences: [] as IDocumentReference[],
    // 分页
    pageLoading: false,
    hasMoreHistory: true,
    historyPage: 1,
    historyPageSize: 20,
    // 记录屏幕高度
    windowHeight: wx.getSystemInfoSync().windowHeight
  },

  onLoad() {
    // 从应用全局获取API基础URL
    const app = getApp<IAppOption>();
    if (app.globalData.apiBaseUrl) {
      this.setData({
        apiBaseUrl: app.globalData.apiBaseUrl
      });
    }
    
    // 获取知识库列表
    this.getKnowledgeBases();
    
    // 获取助手列表
    this.getChatAssistants();
    
    // 检查是否有会话信息
    if (app.globalData.currentSession) {
      this.setData({
        currentChatId: app.globalData.currentSession.chatId,
        currentSessionId: app.globalData.currentSession.id,
        selectedAssistant: app.globalData.currentSession.chatId,
        selectedSession: app.globalData.currentSession.id
      });
      
      // 加载现有会话的消息
      this.getSessionMessages(app.globalData.currentSession.chatId, app.globalData.currentSession.id);
      
      // 加载此助手的会话列表
      this.getSessionsByAssistant(app.globalData.currentSession.chatId);
    } else if (app.globalData.currentKnowledgeBase) {
      this.setCurrentKnowledgeBase(app.globalData.currentKnowledgeBase);
    } else {
      // 初始化消息列表
      this.initMessages();
    }
  },
  
  onShow() {
    // 每次页面显示时检查是否有新选择的知识库
    const app = getApp<IAppOption>();
    
    // 检查是否有新的会话信息
    if (app.globalData.currentSession && 
        app.globalData.currentSession.id !== this.data.currentSessionId) {
      this.setData({
        currentChatId: app.globalData.currentSession.chatId,
        currentSessionId: app.globalData.currentSession.id
      });
      
      // 加载会话的消息
      this.getSessionMessages(app.globalData.currentSession.chatId, app.globalData.currentSession.id);
    } 
    // 如果没有会话但有知识库，检查知识库是否变化
    else if (!app.globalData.currentSession && 
             app.globalData.currentKnowledgeBase && 
             app.globalData.currentKnowledgeBase.id !== this.data.currentKnowledgeBase.id) {
      this.setCurrentKnowledgeBase(app.globalData.currentKnowledgeBase);
      this.resetChat();
    }
  },
  
  // 获取知识库列表
  getKnowledgeBases() {
    wx.request({
      url: `${this.data.apiBaseUrl}/datasets`,
      method: 'GET',
      success: (res: any) => {
        if (res.data && res.data.code === 0 && res.data.data) {
          const datasets = res.data.data || [];
          
          // 转换API数据格式为应用所需格式
          const knowledgeBases: IKnowledgeBase[] = datasets.map((dataset: any) => ({
            id: dataset.id,
            name: dataset.name,
            description: dataset.description || '',
            createTime: dataset.create_date,
            updateTime: dataset.update_date,
            docsCount: dataset.document_count,
            tags: dataset.parser_config && dataset.parser_config.tag_kb_ids ? 
                 dataset.parser_config.tag_kb_ids : [],
            embedding_model: dataset.embedding_model,
            chunk_method: dataset.chunk_method,
            parser_config: dataset.parser_config
          }));
          
          // 构建选择器选项
          const options = knowledgeBases.map((kb: IKnowledgeBase) => ({
            label: kb.name,
            value: kb.id
          }));
          
          // 获取当前选择的知识库
          const app = getApp<IAppOption>();
          const currentKnowledgeBase = app.globalData.currentKnowledgeBase || {
            id: '',
            name: '',
            description: '',
            createTime: '',
            updateTime: '',
            docsCount: 0,
            tags: [],
            embedding_model: '',
            chunk_method: '',
            parser_config: {}
          } as IKnowledgeBase;
          
          this.setData({
            knowledgeBaseOptions: options,
            selectedKnowledgeBase: currentKnowledgeBase.id || '',
            currentKnowledgeBase: currentKnowledgeBase
          });
          
          // 如果已选择知识库，初始化消息
          if (currentKnowledgeBase.id) {
            this.initMessages();
          }
        }
      },
      fail: (err: any) => {
        console.error('获取知识库列表失败:', err);
      }
    });
  },
  
  // 获取会话的消息
  getSessionMessages(chatId: string, sessionId: string) {
    wx.request({
      url: `${this.data.apiBaseUrl}/chats/${chatId}/sessions/${sessionId}`,
      method: 'GET',
      success: (res: any) => {
        if (res.data && res.data.code === 0 && res.data.data) {
          const sessionData = res.data.data;
          const messages = sessionData.messages.map((msg: any, index: number) => ({
            id: `history-${index}`,
            role: msg.role,
            content: msg.content,
            timestamp: Date.now() - (sessionData.messages.length - index) * 60000, // 模拟时间戳
            references: msg.reference ? this.parseReferences(msg.reference) : []
          }));
          
          this.setData({
            messages: messages,
            hasMoreHistory: false // 已加载所有历史消息
          });
          
          // 滚动到最新消息
          if (messages.length > 0) {
            this.scrollToLatest(messages[messages.length - 1].id);
          }
        }
      },
      fail: (err) => {
        console.error('获取会话消息失败:', err);
        // 如果获取失败，使用欢迎消息初始化
        this.initMessages();
      }
    });
  },
  
  // 解析返回的引用数据
  parseReferences(reference: any): IDocumentReference[] {
    if (!reference || !reference.chunks || reference.chunks.length === 0) {
      return [];
    }
    
    return reference.chunks.map((chunk: any) => ({
      documentId: chunk.document_id,
      documentName: chunk.document_name || chunk.document_keyword || '未知文档',
      pageNumbers: ''
    }));
  },
  
  // 设置当前知识库
  setCurrentKnowledgeBase(knowledgeBase: IKnowledgeBase) {
    // 保存到全局数据
    const app = getApp<IAppOption>();
    app.globalData.currentKnowledgeBase = knowledgeBase;
    
    // 更新本地状态
    this.setData({
      selectedKnowledgeBase: knowledgeBase.id,
      currentKnowledgeBase: knowledgeBase
    });
    
    // 初始化消息列表
    this.initMessages();
  },
  
  // 初始化消息列表
  initMessages() {
    // 添加欢迎消息
    const welcomeMessage: IMessage = {
      id: 'welcome',
      role: 'assistant',
      content: this.data.currentKnowledgeBase.name ? 
        `你好！我是基于${this.data.currentKnowledgeBase.name}的AI助手。有什么问题需要我帮助解答吗？` :
        '你好！我是AI助手。请选择一个知识库开始对话。',
      timestamp: Date.now(),
    };
    
    this.setData({
      messages: [welcomeMessage],
      currentChatId: '',
      currentSessionId: ''
    });
  },
  
  // 重置聊天
  resetChat() {
    // 清空消息列表并添加新的欢迎消息
    const welcomeMessage: IMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `你好！我是基于${this.data.currentKnowledgeBase.name}的AI助手。有什么问题需要我帮助解答吗？`,
      timestamp: Date.now(),
    };
    
    this.setData({
      messages: [welcomeMessage],
      inputMessage: '',
      showReferences: false,
      currentReferences: [],
      currentChatId: '',
      currentSessionId: ''
    });
    
    // 清除全局会话信息
    const app = getApp<IAppOption>();
    app.globalData.currentSession = undefined;
  },
  
  // 切换知识库
  onKnowledgeBaseChange(e: any) {
    const { value } = e.detail;
    
    if (value === this.data.selectedKnowledgeBase) return;
    
    // 查找选择的知识库
    const selectedKB = this.data.knowledgeBaseOptions.find(
      (option: any) => option.value === value
    );
    
    if (selectedKB) {
      // 获取完整的知识库信息
      wx.request({
        url: `${this.data.apiBaseUrl}/list/dataset`,
        method: 'POST',
        data: {
          id: value
        },
        success: (res: any) => {
          if (res.data && res.data.code === 0 && res.data.data && res.data.data.length > 0) {
            const dataset = res.data.data[0];
            
            // 构建知识库对象
            const knowledgeBase: IKnowledgeBase = {
              id: dataset.id,
              name: dataset.name,
              description: dataset.description || '',
              createTime: dataset.create_date,
              updateTime: dataset.update_date,
              docsCount: dataset.document_count,
              tags: dataset.parser_config && dataset.parser_config.tag_kb_ids ? 
                   dataset.parser_config.tag_kb_ids : [],
              embedding_model: dataset.embedding_model,
              chunk_method: dataset.chunk_method,
              parser_config: dataset.parser_config
            };
            
            // 设置当前知识库
            this.setCurrentKnowledgeBase(knowledgeBase);
            
            // 重置会话
            this.resetChat();
          }
        }
      });
    }
  },
  
  // 输入框变化
  onInputChange(e: any) {
    this.setData({
      inputMessage: e.detail.value
    });
  },
  
  // 发送消息
  sendMessage() {
    const { inputMessage, messages, currentChatId, currentSessionId, currentKnowledgeBase } = this.data;
    
    // 检查是否有输入
    if (!inputMessage.trim()) {
      return;
    }
    
    // 检查是否选择了知识库
    if (!currentKnowledgeBase.id) {
      this.showKBSelector();
      return;
    }
    
    // 创建用户消息
    const userMessage: IMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: inputMessage,
      timestamp: Date.now()
    };
    
    // 添加消息到列表并清空输入框
    this.setData({
      messages: [...messages, userMessage],
      inputMessage: '',
      isLoading: true
    });
    
    // 滚动到最新消息
    this.scrollToLatest(userMessage.id);
    
    // 调用AI生成回复
    this.getAIResponse(inputMessage);
  },
  
  // 获取AI回复
  getAIResponse(userInput: string) {
    const { currentChatId, currentSessionId, currentKnowledgeBase } = this.data;
    
    // 如果没有现有的会话，首先创建聊天助手和会话
    if (!currentChatId || !currentSessionId) {
      this.createNewChatAndSession(userInput);
      return;
    }
    
    // 有现有会话，直接发送消息
    this.sendMessageToExistingSession(currentChatId, currentSessionId, userInput);
  },
  
  // 创建新的聊天助手和会话
  createNewChatAndSession(userInput: string) {
    // 先检查是否有基于当前知识库的聊天助手
    wx.request({
      url: `${this.data.apiBaseUrl}/chats?name=Chat_with_${this.data.currentKnowledgeBase.name}`,
      method: 'GET',
      success: (res: any) => {
        if (res.data && res.data.code === 0 && res.data.data && res.data.data.length > 0) {
          // 找到现有聊天助手
          const chatAssistant = res.data.data[0];
          const app = getApp<IAppOption>();
          app.globalData.chatAssistantId = chatAssistant.id;
          
          // 创建新的会话
          this.createSessionAndSendMessage(chatAssistant.id, userInput);
        } else {
          // 没有找到，创建新的聊天助手
          this.createChatAssistant(userInput);
        }
      },
      fail: (err) => {
        console.error('获取聊天助手失败:', err);
        this.handleAIResponseError();
      }
    });
  },
  
  // 创建聊天助手
  createChatAssistant(userInput: string) {
    wx.request({
      url: `${this.data.apiBaseUrl}/chats`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        name: `Chat_with_${this.data.currentKnowledgeBase.name}`,
        dataset_ids: [this.data.currentKnowledgeBase.id]
      },
      success: (res: any) => {
        if (res.data && res.data.code === 0 && res.data.data) {
          // 保存聊天助手ID
          const chatId = res.data.data.id;
          const app = getApp<IAppOption>();
          app.globalData.chatAssistantId = chatId;
          
          // 创建新会话
          this.createSessionAndSendMessage(chatId, userInput);
        } else {
          this.handleAIResponseError();
        }
      },
      fail: (err) => {
        console.error('创建聊天助手失败:', err);
        this.handleAIResponseError();
      }
    });
  },
  
  // 创建会话并发送消息
  createSessionAndSendMessage(chatId: string, userInput: string) {
    wx.request({
      url: `${this.data.apiBaseUrl}/chats/${chatId}/sessions`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        name: `${this.data.currentKnowledgeBase.name} - ${new Date().toLocaleString()}`
      },
      success: (res: any) => {
        if (res.data && res.data.code === 0 && res.data.data) {
          // 保存会话信息
          const sessionId = res.data.data.id;
          this.setData({
            currentChatId: chatId,
            currentSessionId: sessionId
          });
          
          const app = getApp<IAppOption>();
          app.globalData.currentSession = {
            id: sessionId,
            chatId: chatId
          };
          
          // 发送消息
          this.sendMessageToExistingSession(chatId, sessionId, userInput);
        } else {
          this.handleAIResponseError();
        }
      },
      fail: (err) => {
        console.error('创建会话失败:', err);
        this.handleAIResponseError();
      }
    });
  },
  
  // 向现有会话发送消息
  sendMessageToExistingSession(chatId: string, sessionId: string, userInput: string) {
    // 创建空白的AI回复消息，用于流式展示
    const assistantMessage: IMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      references: []
    };
    
    // 添加空消息到列表
    this.setData({
      messages: [...this.data.messages, assistantMessage],
      isLoading: true
    });
    
    // 滚动到最新消息
    this.scrollToLatest(assistantMessage.id);
    
    // 使用DeepRAGForge流式API
    wx.request({
      url: `${this.data.apiBaseUrl}/ragflow/api/v1/deepseek`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        chatId: chatId,
        question: userInput,
        sessionId: sessionId,
        userId: getApp<IAppOption>().globalData.userInfo?.nickName || 'user'
      },
      responseType: 'text',
      success: (res: any) => {
        if (res.statusCode === 200) {
          try {
            // 解析响应数据
            const responseData = JSON.parse(res.data);
            if (Array.isArray(responseData) && responseData.length > 0) {
              const chatResponse = responseData[0];
              
              // 处理回复内容
              const answer = chatResponse.answer || '抱歉，无法回答您的问题。';
              
              // 处理引用信息
              const docAggs = chatResponse.docAggs || [];
              const references = docAggs.map((doc: any) => ({
                documentId: doc.doc_id,
                documentName: doc.doc_name || '未知文档',
                pageNumbers: '',
                count: doc.count
              }));
              
              // 更新消息列表中的AI回复
              const messages = [...this.data.messages];
              const messageIndex = messages.findIndex(msg => msg.id === assistantMessage.id);
              
              if (messageIndex !== -1) {
                messages[messageIndex].content = answer;
                messages[messageIndex].references = references;
                
                this.setData({
                  messages,
                  isLoading: false,
                  showReferences: references.length > 0,
                  currentReferences: references
                });
              }
            } else {
              this.handleAIResponseError();
            }
          } catch (error) {
            console.error('解析AI回复失败:', error);
            this.handleAIResponseError();
          }
        } else {
          this.handleAIResponseError();
        }
      },
      fail: (err) => {
        console.error('获取AI回复失败:', err);
        this.handleAIResponseError();
      }
    });
  },
  
  // 处理AI响应错误
  handleAIResponseError() {
    // 创建错误消息
    const errorMessage: IMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: '抱歉，我现在无法回答您的问题。请稍后再试。',
      timestamp: Date.now()
    };
    
    // 更新消息列表
    this.setData({
      messages: [...this.data.messages, errorMessage],
      isLoading: false
    });
    
    // 滚动到最新消息
    this.scrollToLatest(errorMessage.id);
  },
  
  // 滚动到最新消息
  scrollToLatest(messageId: string) {
    this.setData({
      scrollToMessage: messageId
    });
  },
  
  // 加载更多历史消息
  loadMoreMessages() {
    if (this.data.pageLoading || !this.data.hasMoreHistory) return;
    
    this.setData({ pageLoading: true });
    
    // 实际使用中通过分页加载更多历史消息
    const { currentChatId, currentSessionId, historyPage, historyPageSize } = this.data;
    
    if (!currentChatId || !currentSessionId) {
      this.setData({ 
        pageLoading: false,
        hasMoreHistory: false
      });
      return;
    }
    
    const app = getApp<IAppOption>();
    const apiKey = app.globalData.apiKey || '';
    
    // 这里应该根据API实际情况调整，RAGFlow可能不支持分页获取会话消息
    this.setData({ 
      pageLoading: false,
      hasMoreHistory: false
    });
  },
  
  // 切换显示引用面板
  toggleReferences() {
    this.setData({
      showReferences: !this.data.showReferences
    });
  },

  // 新增方法 - 跳转到创建知识库页面
  goToCreateKB() {
    wx.switchTab({
      url: '/pages/home/home',
      success: (res) => {
        const page = getCurrentPages().pop();
        if (page && page.getOpenerEventChannel) {
          const eventChannel = page.getOpenerEventChannel();
          eventChannel.emit('openAddKnowledgeBase');
        }
      }
    });
  },

  // 显示知识库选择器
  showKBSelector() {
    // 触发知识库下拉框选择
    wx.createSelectorQuery()
      .select('.t-dropdown-menu')
      .boundingClientRect()
      .exec(rect => {
        if (rect && rect[0]) {
          const { left, top, width, height } = rect[0];
          
          // 模拟点击下拉框
          wx.createSelectorQuery()
            .select('.t-dropdown-item')
            .boundingClientRect()
            .exec(itemRect => {
              if (itemRect && itemRect[0]) {
                // 在知识库选择器上触发点击
                const event = {
                  touches: [{ 
                    pageX: left + width / 2, 
                    pageY: top + height / 2 
                  }]
                };
                
                // 调用t-dropdown-item组件的click方法
                this.selectComponent('.t-dropdown-item').handleClick(event);
              }
            });
        }
      });
  },

  // 获取聊天助手列表
  getChatAssistants() {
    wx.request({
      url: `${this.data.apiBaseUrl}/ragflow/api/v1/list/assistant`,
      method: 'POST',
      data: {
        page: 1,
        page_size: 50,
        orderby: 'update_time',
        desc: true
      },
      success: (res: any) => {
        // 支持两种响应格式：直接返回数据或嵌套在code=20000的格式中
        let responseData = res.data;
        if (responseData && responseData.code === 20000 && responseData.data) {
          responseData = responseData.data;
        }
        
        if (responseData && (responseData.code === 0 || responseData.code === '0') && responseData.data) {
          const assistants = responseData.data.assistants || [];
          
          // 构建选择器选项
          const options = assistants.map((assistant: any) => ({
            label: assistant.name,
            value: assistant.id
          }));
          
          this.setData({
            assistantOptions: options,
            assistants: assistants
          });
        }
      },
      fail: (err) => {
        console.error('获取聊天助手列表失败:', err);
      }
    });
  },
  
  // 获取特定助手的会话列表
  getSessionsByAssistant(chatId: string) {
    if (!chatId) return;
    
    wx.request({
      url: `${this.data.apiBaseUrl}/ragflow/api/v1/list/session`,
      method: 'POST',
      data: {
        chat_id: chatId,
        page: 1,
        page_size: 50,
        orderby: 'update_time',
        desc: true
      },
      success: (res: any) => {
        // 支持两种响应格式：直接返回数据或嵌套在code=20000的格式中
        let responseData = res.data;
        if (responseData && responseData.code === 20000 && responseData.data) {
          responseData = responseData.data;
        }
        
        if (responseData && (responseData.code === 0 || responseData.code === '0') && responseData.data) {
          const sessions = responseData.data.sessions || [];
          
          // 构建选择器选项
          const options = sessions.map((session: any) => ({
            label: session.name,
            value: session.id
          }));
          
          this.setData({
            sessionOptions: options,
            sessions: sessions
          });
        }
      },
      fail: (err) => {
        console.error('获取会话列表失败:', err);
      }
    });
  },
  
  // 选择助手
  onAssistantChange(e: any) {
    const { value } = e.detail;
    
    if (value === this.data.selectedAssistant) return;
    
    this.setData({
      selectedAssistant: value,
      currentChatId: value,
      selectedSession: '',
      currentSessionId: '',
      messages: []
    });
    
    // 获取该助手的会话列表
    this.getSessionsByAssistant(value);
    
    // 获取助手关联的知识库
    const assistant = this.data.assistants.find(a => a.id === value);
    if (assistant && assistant.dataset_ids && assistant.dataset_ids.length > 0) {
      // 使用第一个关联的知识库
      this.getKnowledgeBaseById(assistant.dataset_ids[0]);
    }
    
    // 初始化欢迎消息
    this.initMessages();
  },
  
  // 选择会话
  onSessionChange(e: any) {
    const { value } = e.detail;
    
    if (value === this.data.selectedSession) return;
    
    this.setData({
      selectedSession: value,
      currentSessionId: value
    });
    
    // 加载会话消息
    this.getSessionMessages(this.data.currentChatId, value);
    
    // 保存会话信息到全局
    const app = getApp<IAppOption>();
    app.globalData.currentSession = {
      id: value,
      chatId: this.data.currentChatId
    };
    
    // 保存到本地存储
    wx.setStorageSync('currentSession', {
      id: value,
      chatId: this.data.currentChatId
    });
  },
  
  // 根据ID获取知识库详情
  getKnowledgeBaseById(id: string) {
    wx.request({
      url: `${this.data.apiBaseUrl}/datasets?id=${id}`,
      method: 'GET',
      success: (res: any) => {
        if (res.data && res.data.code === 0 && res.data.data && res.data.data.length > 0) {
          const dataset = res.data.data[0];
          const knowledgeBase: IKnowledgeBase = {
            id: dataset.id,
            name: dataset.name,
            description: dataset.description || '',
            createTime: dataset.create_date,
            updateTime: dataset.update_date,
            docsCount: dataset.document_count,
            tags: dataset.parser_config && dataset.parser_config.tag_kb_ids ? 
                 dataset.parser_config.tag_kb_ids : [],
            embedding_model: dataset.embedding_model,
            chunk_method: dataset.chunk_method,
            parser_config: dataset.parser_config
          };
          
          this.setData({ 
            currentKnowledgeBase: knowledgeBase,
            selectedKnowledgeBase: knowledgeBase.id
          });
          
          // 将当前知识库信息保存到全局
          const app = getApp<IAppOption>();
          app.globalData.currentKnowledgeBase = knowledgeBase;
        }
      },
      fail: (err) => {
        console.error('获取知识库详情失败:', err);
      }
    });
  },
  
  // 清空输入框
  clearInput() {
    this.setData({
      inputMessage: ''
    });
  },
  
  // 格式化时间戳为可读时间
  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },
}); 