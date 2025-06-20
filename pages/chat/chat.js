// pages/chat/chat.js
import { datasetApi, documentApi, chatAssistantApi, sessionApi, chatApi } from '../../utils/api';
import { parseMarkdown } from '../../utils/markdown-parser';

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    showEmpty: true,
    currentKnowledgeBase: {
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
    },
    // 当前助手
    currentAssistant: {
      id: '',
      name: '',
      description: '',
      datasets: []
    },
    // 助手选择
    assistantOptions: [],
    selectedAssistant: '',
    assistants: [],
    // 会话选择
    sessionOptions: [],
    selectedSession: '',
    sessions: [],
    // 会话信息
    currentChatId: '',
    currentSessionId: '',
    // 输入消息
    inputMessage: '',
    // 是否正在加载回复
    isLoading: false,
    // 用于自动滚动到最新消息
    scrollToMessage: '',
    // 引用面板
    showReferences: false,
    currentReferences: [],
    // 分页
    pageLoading: false,
    hasMoreHistory: true,
    historyPage: 1,
    historyPageSize: 20,
    // 记录屏幕高度
    windowHeight: wx.getSystemInfoSync().windowHeight,
    // 下拉刷新状态
    refresherTriggered: false,
    isRefreshing: false
  },

  onLoad() {
    // 从应用全局获取API基础URL和用户信息
    const app = getApp();
    if (app.globalData.apiBaseUrl) {
      this.setData({
        apiBaseUrl: app.globalData.apiBaseUrl
      });
    }
    
    // 获取用户ID
    if (app.globalData.userId) {
      console.log('从app.js获取用户ID:', app.globalData.userId);
    } else {
      // 如果app.js中没有，尝试从本地存储获取
      const storedUserId = wx.getStorageSync('userId');
      if (storedUserId) {
        app.globalData.userId = storedUserId;
        console.log('从本地存储获取用户ID:', storedUserId);
      } else {
        // 生成默认用户ID
        const defaultUserId = 'user_' + Date.now();
        app.globalData.userId = defaultUserId;
        wx.setStorageSync('userId', defaultUserId);
        console.log('生成默认用户ID:', defaultUserId);
      }
    }
    
    // 初始化流式请求引用
    this.currentStreamRequest = null;
    
    // 获取助手列表
    this.getChatAssistants();
    
    // 检查是否有会话信息
    if (app.globalData.currentSession) {
      const session = app.globalData.currentSession;
      console.log('===== onLoad检测到全局会话信息 =====');
      console.log('会话ID:', session.id);
      console.log('助手ID:', session.chatId);
      
      this.setData({
        currentChatId: session.chatId,
        currentSessionId: session.id,
        selectedAssistant: session.chatId,
        selectedSession: session.id
      });
      
      // 加载现有会话的消息
      this.getSessionMessages(session.chatId, session.id);
    } else {
      console.log('===== onLoad未检测到全局会话信息 =====');
      // 初始化消息列表
      this.initMessages();
    }
    
    // 添加页面状态调试信息
    console.log('===== onLoad完成后的页面状态 =====');
    console.log('userId:', app.globalData.userId);
    console.log('currentAssistant:', this.data.currentAssistant);
    console.log('currentAssistant.id:', this.data.currentAssistant.id);
    console.log('assistantOptions:', this.data.assistantOptions);
    console.log('assistants:', this.data.assistants);
    console.log('currentChatId:', this.data.currentChatId);
    console.log('currentSessionId:', this.data.currentSessionId);
    console.log('selectedAssistant:', this.data.selectedAssistant);
    console.log('selectedSession:', this.data.selectedSession);
    console.log('是否显示输入区域:', !!this.data.currentAssistant.id);
    console.log('===== 页面状态调试结束 =====');
  },

  onShow() {
    // 每次页面显示时检查是否有新选择的知识库
    const app = getApp();
    
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
    datasetApi.listDatasets({})
      .then(response => {
        console.log('=== 知识库列表API返回数据分析 ===');
        console.log('原始响应:', response);
        console.log('响应类型:', typeof response);
        console.log('是否为数组:', Array.isArray(response));
        
        // 严格按照接口返回结构解析数据
        let datasets = [];
        
        if (Array.isArray(response)) {
          // 如果直接返回数组
          console.log('数据格式：直接数组');
          datasets = response;
        } else if (response && typeof response === 'object') {
          console.log('数据格式：对象，开始解析...');
          console.log('对象键:', Object.keys(response));
          
          // 尝试从不同字段获取数据
          if (Array.isArray(response.data)) {
            console.log('找到数据：response.data');
            datasets = response.data;
          } else if (Array.isArray(response.datasets)) {
            console.log('找到数据：response.datasets');
            datasets = response.datasets;
          } else if (Array.isArray(response.items)) {
            console.log('找到数据：response.items');
            datasets = response.items;
          } else if (Array.isArray(response.list)) {
            console.log('找到数据：response.list');
            datasets = response.list;
          } else {
            console.warn('未在响应中找到数据集数组数据');
            console.log('可用字段:', Object.keys(response));
            // 如果响应对象的值本身可能是数组，遍历查找
            for (const key of Object.keys(response)) {
              if (Array.isArray(response[key])) {
                console.log(`发现数组字段: ${key}，长度: ${response[key].length}`);
                if (response[key].length > 0 && response[key][0].id) {
                  console.log(`使用字段 ${key} 作为数据集数据`);
                  datasets = response[key];
                  break;
                }
              }
            }
          }
        }
        
        console.log('解析后的数据集数组:', datasets);
        console.log('数据集数量:', datasets.length);
        
        // 转换API数据格式为应用所需格式
        const knowledgeBases = datasets.map((dataset) => ({
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
        const options = knowledgeBases.map((kb) => ({
          label: kb.name,
          value: kb.id
        }));
        
        // 获取当前选择的知识库
        const app = getApp();
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
        };
        
        this.setData({
          knowledgeBaseOptions: options,
          selectedKnowledgeBase: currentKnowledgeBase.id || '',
          currentKnowledgeBase: currentKnowledgeBase
        });
        
        // 如果已选择知识库，初始化消息
        if (currentKnowledgeBase.id) {
          this.initMessages();
        }
      })
      .catch(err => {
        console.error('获取知识库列表失败:', err);
      });
  },
  
  // 获取会话的消息
  getSessionMessages(chatId, sessionId) {
    console.log('===== 开始获取会话消息 =====');
    console.log('助手ID:', chatId);
    console.log('会话ID:', sessionId);
    
    if (!chatId || !sessionId) {
      console.log('无效的会话ID或助手ID，初始化消息');
      wx.hideLoading();
      this.initMessages();
      return;
    }
    
    console.log(`正在获取会话消息: 助手ID=${chatId}, 会话ID=${sessionId}`);
    
    // 设置会话标识符
    this.setData({
      currentChatId: chatId,
      currentSessionId: sessionId
    });
    
    // 尝试从本地缓存快速加载消息（先显示本地数据提升体验）
    let localMessages = null;
    try {
      localMessages = wx.getStorageSync(`session_messages_${sessionId}`);
      if (localMessages && localMessages.length > 0) {
        console.log('从本地缓存快速加载消息:', localMessages.length, '条');
        
        // 先显示本地缓存的消息（提高响应速度）
        this.setData({
          messages: localMessages,
          hasMoreHistory: false
        });
        
        // 滚动到最新消息
        if (localMessages.length > 0) {
          this.scrollToLatest(localMessages[localMessages.length - 1].id);
        }
      }
    } catch (e) {
      console.warn('读取本地缓存消息失败:', e);
    }
    
    // 如果没有显示加载提示，则显示
    if (!wx.getStorageSync('isLoading')) {
      wx.showLoading({ title: '加载消息...' });
    }
    
    // 请求服务器获取最新消息
    sessionApi.getSessionDetail(chatId, sessionId)
      .then(response => {
        // 确保关闭加载提示
        wx.hideLoading();
        
        console.log('=== 会话消息API响应分析 ===');
        console.log('原始响应:', response);
        console.log('响应类型:', typeof response);
        console.log('是否为数组:', Array.isArray(response));
        
        // 严格按照接口返回结构解析数据
        let sessionData = null;
        
        if (Array.isArray(response)) {
          // 如果直接返回数组，取第一个元素作为会话数据
          console.log('数据格式：直接数组，长度:', response.length);
          if (response.length > 0) {
            sessionData = response[0];
            console.log('提取的会话数据:', sessionData);
          }
        } else if (response && typeof response === 'object') {
          // 如果返回对象，尝试从不同字段获取会话数据
          console.log('数据格式：对象，键:', Object.keys(response));
          
          if (Array.isArray(response.data) && response.data.length > 0) {
            sessionData = response.data[0];
            console.log('从response.data中提取会话数据');
          } else if (Array.isArray(response.sessions) && response.sessions.length > 0) {
            sessionData = response.sessions[0];
            console.log('从response.sessions中提取会话数据');
          } else if (Array.isArray(response.items) && response.items.length > 0) {
            sessionData = response.items[0];
            console.log('从response.items中提取会话数据');
          } else if (response.messages || response.conversation_id) {
            // 直接就是会话数据
            sessionData = response;
            console.log('响应本身就是会话数据');
          }
        }
        
        console.log('最终解析的会话数据:', sessionData);
        
        if (sessionData && sessionData.messages && Array.isArray(sessionData.messages)) {
          console.log(`获取到${sessionData.messages.length}条消息 - 准备处理和显示`);
          
          const messages = sessionData.messages.map((msg, index) => {
            // 处理消息内容
            const processedContent = this.processMessageContent(msg.content);
            
            // 处理引用数据 - 统一引用格式
            let references = [];
            
            // 处理msg.reference格式
            if (msg.reference && (msg.reference.chunks || msg.reference.sources)) {
              const refData = msg.reference.chunks || msg.reference.sources || [];
              references = refData.map(chunk => ({
                documentId: chunk.doc_id || chunk.document_id || chunk.documentId || '',
                documentName: chunk.doc_name || chunk.document_name || chunk.documentName || chunk.title || chunk.document_keyword || '未知文档',
                pageNumbers: chunk.page_numbers || chunk.pageNumbers || ''
              }));
            }
            // 处理msg.docAggs格式
            else if (msg.docAggs && Array.isArray(msg.docAggs)) {
              references = msg.docAggs.map(doc => ({
                documentId: doc.doc_id || doc.document_id || doc.documentId || '',
                documentName: doc.doc_name || doc.document_name || doc.documentName || doc.title || '未知文档',
                pageNumbers: doc.page_numbers || doc.pageNumbers || ''
              }));
            }
            // 处理旧引用格式
            else if (msg.references && Array.isArray(msg.references)) {
              references = msg.references;
            }
            
            // 确定思考内容是否应该显示（历史消息默认隐藏思考内容）
            const hasThinking = processedContent.thinking && processedContent.thinking.trim() !== '';
            
            return {
              id: `history-${sessionId}-${index}`, // 使用会话ID作为前缀，避免ID冲突
              role: msg.role,
              content: processedContent.text || '',
              richNodes: processedContent.richNodes || [],
              thinking: processedContent.thinking || '',
              showThinking: false, // 历史消息默认隐藏思考内容
              hasThinking: hasThinking, // 标记是否有思考内容
              timestamp: msg.timestamp || Date.now() - (sessionData.messages.length - index) * 60000,
              references: references,
              isLoading: false,
              isStreaming: false
            };
          });
          
          console.log(`处理完成，显示${messages.length}条消息`);
          
          // 显示消息并保存到本地 - 服务器数据始终覆盖本地数据
          this.setData({
            messages: messages, // 完全覆盖本地数据
            hasMoreHistory: false // 已加载所有历史消息
          });
          
          // 保存最新会话数据到本地存储
          try {
            wx.setStorageSync(`session_messages_${sessionId}`, messages);
            console.log('已更新并保存服务器最新消息到本地');
          } catch (err) {
            console.error('保存会话消息到本地存储失败:', err);
          }
          
          // 滚动到最新消息
          if (messages.length > 0) {
            setTimeout(() => {
              this.scrollToLatest(messages[messages.length - 1].id);
            }, 100);
          }
          
          // 更新全局会话信息
          const app = getApp();
          app.globalData.currentSession = {
            id: sessionId,
            chatId: chatId
          };
          
          // 保存到本地存储
          wx.setStorageSync('currentSession', {
            id: sessionId,
            chatId: chatId
          });
          
          // 显示成功提示
          wx.showToast({
            title: '会话加载完成',
            icon: 'success',
            duration: 1000
          });
        } else {
          console.warn('未找到有效的会话消息数据');
          console.log('会话数据结构:', sessionData);
          
          // 如果服务器没有返回有效消息但本地有缓存，保留本地缓存的消息
          if (!localMessages || localMessages.length === 0) {
            // 没有本地缓存，则初始化欢迎消息
            this.initMessages();
          }
          
          wx.showToast({
            title: '该会话暂无消息',
            icon: 'none'
          });
        }
        
        console.log('===== 获取会话消息完成 =====');
      })
      .catch(err => {
        // 确保关闭加载提示
        wx.hideLoading();
        
        console.error('获取会话消息失败:', err);
        
        // 如果网络请求失败但本地有缓存，保留本地缓存的消息
        if (!localMessages || localMessages.length === 0) {
          // 尝试从本地存储加载消息（备选方案）
          try {
            const cachedMessages = wx.getStorageSync(`session_messages_${sessionId}`);
            if (cachedMessages && cachedMessages.length > 0) {
              console.log('从本地存储加载消息(备选方案)');
              this.setData({
                messages: cachedMessages,
                hasMoreHistory: false
              });
              
              // 滚动到最新消息
              this.scrollToLatest(cachedMessages[cachedMessages.length - 1].id);
              return;
            }
          } catch (storageErr) {
            console.error('从本地存储加载消息失败:', storageErr);
          }
          
          // 如果获取失败且缓存不可用，使用欢迎消息初始化
          this.initMessages();
        }
        
        wx.showToast({
          title: '获取会话消息失败',
          icon: 'none'
        });
        
        console.log('===== 获取会话消息出错结束 =====');
      });
  },
  
  // 处理消息内容，提取和处理<think>标签，并解析Markdown
  processMessageContent(content) {
    if (!content) return { text: '', thinking: '', richNodes: [] };
    
    // 初始化返回对象
    let thinkContent = '';
    let processedContent = content;
    
    // 检查是否存在<think>标签
    const hasOpenThinkTag = content.includes('<think>');
    const hasCloseThinkTag = content.includes('</think>');
    
    if (hasOpenThinkTag) {
      // 情况1: 完整的<think>...</think>对
      if (hasCloseThinkTag) {
        // 提取完整<think>标签内容
        const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch && thinkMatch[1]) {
          thinkContent = thinkMatch[1].trim();
        }
        
        // 移除<think>...</think>标签及其内容
        processedContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      } 
      // 情况2: 只有<think>开始标签，没有结束标签
      else {
        // 提取<think>后面的所有内容作为思考内容
        const parts = content.split('<think>');
        if (parts.length > 1) {
          // 第一部分是<think>前面的内容
          processedContent = parts[0].trim();
          // 其余部分都是思考内容
          thinkContent = parts.slice(1).join('<think>').trim();
          
          console.log('检测到不完整的<think>标签，已提取思考内容');
        }
      }
    }
    
    // 检查处理后的内容是否为空
    if (!processedContent || processedContent.trim() === '') {
      // 如果移除思考内容后为空，生成统一回复
      processedContent = '我正在思考这个问题的解决方案...';
    }
    
    // 格式化引用编号 ##数字$$ 为HTML上标
    processedContent = processedContent.replace(/##(\d+)\$\$/g, '<sup class="reference-number">[$1]</sup>');
    
    // 解析Markdown内容为rich-text节点
    let richNodes = [];
    try {
      // 使用Markdown解析器解析内容
      richNodes = parseMarkdown(processedContent);
      console.log('Markdown解析成功，节点数量:', richNodes.length);
    } catch (error) {
      console.error('Markdown解析失败:', error);
      // 解析失败时使用原始文本
      richNodes = [{ type: 'text', text: processedContent }];
    }
    
    // 返回包含处理后内容、思考内容和rich-text节点的对象
    return {
      text: processedContent,
      thinking: thinkContent,
      richNodes: richNodes
    };
  },
  
  // 解析返回的引用数据
  parseReferences(reference) {
    if (!reference || !reference.chunks || reference.chunks.length === 0) {
      return [];
    }
    
    return reference.chunks.map((chunk) => ({
      documentId: chunk.document_id,
      documentName: chunk.document_name || chunk.document_keyword || '未知文档',
      pageNumbers: ''
    }));
  },
  
  // 设置当前知识库
  setCurrentKnowledgeBase(knowledgeBase) {
    // 保存到全局数据
    const app = getApp();
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
    const welcomeMessage = {
      id: 'welcome',
      role: 'assistant',
      content: this.data.currentAssistant.id ? 
        `你好！我是${this.data.currentAssistant.name}。${this.data.currentAssistant.datasets && this.data.currentAssistant.datasets.length > 0 ? `我基于"${this.data.currentAssistant.datasets[0].name}"知识库回答问题。` : ''}有什么问题需要我帮助解答吗？` :
        '你好！我是AI助手。请选择一个助手开始对话。',
      thinking: '',
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
    const welcomeMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `你好！我是${this.data.currentAssistant.name}。${this.data.currentAssistant.datasets && this.data.currentAssistant.datasets.length > 0 ? `我基于"${this.data.currentAssistant.datasets[0].name}"知识库回答问题。` : ''}有什么问题需要我帮助解答吗？`,
      thinking: '',
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
    const app = getApp();
    app.globalData.currentSession = undefined;
  },
  
  // 切换知识库
  onKnowledgeBaseChange(e) {
    const { value } = e.detail;
    
    if (value === this.data.selectedKnowledgeBase) return;
    
    // 获取知识库详情
    datasetApi.getDatasetById(value)
      .then(response => {
        console.log('=== 知识库详情API返回数据分析 ===');
        console.log('原始响应:', response);
        
        // 使用统一的数据解析逻辑
        let datasets = [];
        
        if (Array.isArray(response)) {
          datasets = response;
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.data)) {
            datasets = response.data;
          } else if (Array.isArray(response.datasets)) {
            datasets = response.datasets;
          } else if (Array.isArray(response.items)) {
            datasets = response.items;
          } else if (Array.isArray(response.list)) {
            datasets = response.list;
          } else if (response.id) {
            // 如果直接返回单个数据集对象
            datasets = [response];
          } else {
            // 遍历查找数组字段或单个对象
            for (const key of Object.keys(response)) {
              if (Array.isArray(response[key])) {
                if (response[key].length > 0 && response[key][0].id) {
                  datasets = response[key];
                  break;
                }
              } else if (response[key] && typeof response[key] === 'object' && response[key].id) {
                datasets = [response[key]];
                break;
              }
            }
          }
        }
        
        if (datasets && datasets.length > 0) {
          const dataset = datasets[0];
          
          // 构建知识库对象
          const knowledgeBase = {
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
          
          // 查找基于此知识库的助手
          this.findAssistantsForKnowledgeBase(knowledgeBase.id);
        } else {
          console.error('未找到知识库数据');
          wx.showToast({
            title: '获取知识库详情失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('获取知识库详情失败:', err);
        wx.showToast({
          title: '获取知识库详情失败',
          icon: 'none'
        });
      });
  },
  
  // 查找基于知识库的助手
  findAssistantsForKnowledgeBase(knowledgeBaseId) {
    // 显示加载提示
    wx.showLoading({ title: '加载助手...' });
    
    // 获取所有助手
    chatAssistantApi.listAssistants({
      page: 1, 
      page_size: 30,
      orderby: 'update_time',
      desc: true
    })
      .then(response => {
        // 隐藏加载提示
        wx.hideLoading();
        
        console.log('=== 查找知识库助手API返回数据分析 ===');
        console.log('原始响应:', response);
        
        // 使用统一的数据解析逻辑
        let assistants = [];
        
        if (Array.isArray(response)) {
          assistants = response;
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.data)) {
            assistants = response.data;
          } else if (Array.isArray(response.assistants)) {
            assistants = response.assistants;
          } else if (Array.isArray(response.items)) {
            assistants = response.items;
          } else if (Array.isArray(response.list)) {
            assistants = response.list;
          } else {
            // 遍历查找数组字段
            for (const key of Object.keys(response)) {
              if (Array.isArray(response[key]) && response[key].length > 0 && response[key][0].id) {
                assistants = response[key];
                break;
              }
            }
          }
        }
        
        if (assistants && assistants.length > 0) {
          // 过滤出使用该知识库的助手
          const relevantAssistants = assistants.filter(assistant => 
            assistant.dataset_ids && assistant.dataset_ids.includes(knowledgeBaseId)
          );
          
          if (relevantAssistants.length > 0) {
            // 选择最新的助手（列表已按更新时间排序）
            const latestAssistant = relevantAssistants[0];
            
            // 更新助手选择
            this.setData({
              selectedAssistant: latestAssistant.id,
              currentChatId: latestAssistant.id
            });
            
            // 查找该助手的会话
            this.findSessionsForAssistant(latestAssistant.id);
          } else {
            // 没有找到相关助手，重置会话
            this.resetChat();
            
            wx.showToast({
              title: '未找到与此知识库关联的助手',
              icon: 'none'
            });
          }
        } else {
          // 未获取到助手列表，重置会话
          this.resetChat();
        }
      })
      .catch(err => {
        // 隐藏加载提示
        wx.hideLoading();
        
        console.error('获取助手列表失败:', err);
        // 重置会话
        this.resetChat();
        
        wx.showToast({
          title: '获取助手列表失败',
          icon: 'none'
        });
      });
  },
  
  // 为助手查找会话
  findSessionsForAssistant(assistantId) {
    if (!assistantId) {
      console.warn('查找会话失败: 无效的助手ID');
      return;
    }
    
    console.log(`查找助手(${assistantId})的会话列表`);
    
    // 显示加载提示
    wx.showLoading({ title: '加载会话...' });
    
    // 获取助手的会话列表
    sessionApi.listSessions({
      chat_id: assistantId,
      page: 1,
      page_size: 30,
      orderby: 'update_time',
      desc: true
    })
      .then(response => {
        // 隐藏加载提示
        wx.hideLoading();
        
        console.log('=== 会话列表API返回数据分析 ===');
        console.log('原始响应:', response);
        console.log('响应类型:', typeof response);
        console.log('是否为数组:', Array.isArray(response));
        
        // 严格按照接口返回结构解析数据
        let sessions = [];
        
        if (Array.isArray(response)) {
          // 如果直接返回数组
          console.log('数据格式：直接数组，长度:', response.length);
          sessions = response;
        } else if (response && typeof response === 'object') {
          // 如果返回对象，尝试从不同字段获取会话数据
          console.log('数据格式：对象，键:', Object.keys(response));
          
          if (Array.isArray(response.data)) {
            console.log('从response.data中提取会话数据');
            sessions = response.data;
          } else if (Array.isArray(response.sessions)) {
            console.log('从response.sessions中提取会话数据');
            sessions = response.sessions;
          } else if (Array.isArray(response.items)) {
            console.log('从response.items中提取会话数据');
            sessions = response.items;
          } else if (Array.isArray(response.list)) {
            console.log('从response.list中提取会话数据');
            sessions = response.list;
          } else {
            console.warn('未在响应中找到会话数组数据');
            console.log('可用字段:', Object.keys(response));
            // 如果响应对象的值本身可能是数组，遍历查找
            for (const key of Object.keys(response)) {
              if (Array.isArray(response[key])) {
                console.log(`发现数组字段: ${key}，长度: ${response[key].length}`);
                if (response[key].length > 0 && response[key][0].id) {
                  console.log(`使用字段 ${key} 作为会话数据`);
                  sessions = response[key];
                  break;
                }
              }
            }
          }
        }
        
        console.log('解析后的会话数组:', sessions);
        console.log('会话数量:', sessions.length);
        
        if (sessions && Array.isArray(sessions) && sessions.length > 0) {
          try {
            console.log('===== 开始处理会话数据 =====');
            
            // 确保每个会话有chat字段，因为API返回的chat为null
            const processedSessions = sessions.map((session, index) => {
              if (!session) {
                console.warn(`发现无效的会话对象(null/undefined) at index ${index}`);
                return null;
              }
              
              console.log(`处理会话 ${index}:`, {
                id: session.id,
                name: session.name,
                chat: session.chat,
                assistantId: assistantId
              });
              
              // 由于API返回的chat字段为null，强制使用当前助手ID
              const processedSession = { 
                ...session, 
                chat: assistantId // 强制使用传入的助手ID，修复chat为null的问题
              };
              
              console.log(`会话 ${session.id} 已设置chat字段为: ${assistantId}`);
              return processedSession;
            }).filter(session => session !== null); // 过滤掉无效的会话
            
            console.log('处理后的会话列表:', processedSessions);
            
            // 再次检查处理后的会话列表是否为空
            if (processedSessions.length === 0) {
              console.warn('处理后的会话列表为空');
              throw new Error('处理后的会话列表为空');
            }
            
            // 构建选择器选项
            const options = processedSessions.map((session) => ({
              label: session.name || `会话 ${session.id}`, // 确保有显示内容
              value: session.id
            }));
            
            console.log('构建的会话选择器选项:', options);
            
            // 更新会话选择器
            this.setData({
              sessionOptions: options,
              sessions: processedSessions
            });
            
            console.log('会话选择器已更新');
            
            // 确保latestSession存在且有效
            const latestSession = processedSessions[0];
            if (!latestSession || !latestSession.id) {
              console.warn('最新会话无效或缺少ID');
              throw new Error('最新会话无效');
            }
            
            console.log('选择最新会话:', latestSession);
            
            // 更新会话选择
            this.setData({
              selectedSession: latestSession.id,
              currentSessionId: latestSession.id
            });
            
            console.log('会话选择状态已更新');
            
            // 加载会话消息
            console.log('开始加载会话消息...');
            this.getSessionMessages(assistantId, latestSession.id);
            
            // 保存会话信息到全局
            const app = getApp();
            app.globalData.currentSession = {
              id: latestSession.id,
              chatId: assistantId
            };
            
            // 保存到本地存储
            try {
              wx.setStorageSync('currentSession', {
                id: latestSession.id,
                chatId: assistantId
              });
              console.log('会话信息已保存到本地存储');
            } catch (storageError) {
              console.error('保存会话到本地存储失败:', storageError);
              // 存储失败不影响主流程
            }
            
            console.log('===== 会话数据处理完成 =====');
          } catch (processError) {
            // 处理会话数据时发生错误
            console.error('处理会话数据时出错:', processError);
            handleSessionError();
          }
        } else {
          console.log('会话列表为空，初始化欢迎消息');
          handleSessionError();
        }
      })
      .catch(err => {
        // 隐藏加载提示
        wx.hideLoading();
        
        console.error('获取会话列表失败:', err);
        handleSessionError();
      });
    
    // 会话错误处理封装函数
    const handleSessionError = () => {
      // 清空会话选择器
      this.setData({
        sessionOptions: [],
        sessions: [],
        selectedSession: '',
        currentSessionId: ''
      });
      
      // 初始化欢迎消息
      this.initMessages();
      
      // 更新界面提示（使用更温和的提示）
      wx.showToast({
        title: '暂无会话，开始新对话吧',
        icon: 'none',
        duration: 2000
      });
    };
  },
  
  // 输入框变化
  onInputChange(e) {
    this.setData({
      inputMessage: e.detail.value
    });
  },
  
  // 清空输入框
  clearInput() {
    this.setData({
      inputMessage: ''
    });
  },

  // 发送消息
  sendMessage() {
    console.log('===== 开始发送消息 =====');
    const { inputMessage, messages, currentChatId, currentSessionId, currentAssistant } = this.data;
    
    console.log('输入消息:', inputMessage);
    console.log('当前助手ID:', currentAssistant.id);
    console.log('当前聊天ID:', currentChatId);
    console.log('当前会话ID:', currentSessionId);
    console.log('当前消息数量:', messages.length);
    
    // 检查是否有输入
    if (!inputMessage.trim()) {
      console.log('输入为空，退出');
      return;
    }
    
    // 检查是否选择了助手
    if (!currentAssistant.id) {
      console.log('未选择助手，显示提示');
      wx.showToast({
        title: '请先选择一个助手',
        icon: 'none'
      });
      return;
    }
    
    console.log('验证通过，继续发送消息');
    
    // 如果有正在进行的流式请求，取消它
    this._terminateExistingRequest();
    
    // 创建用户消息
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      thinking: '',
      timestamp: Date.now()
    };
    
    // 添加消息到列表并清空输入框
    this.setData({
      messages: [...messages, userMessage],
      inputMessage: '',
      isLoading: true
    });
    
    // 立即滚动到最新消息（用户消息）
    this.scrollToLatest(userMessage.id);
    
    // 调用AI生成回复
    this.getAIResponse(inputMessage);
  },
  
  // 终止所有现有请求
  _terminateExistingRequest() {
    if (this.currentStreamRequest) {
      console.log('终止现有的流式请求');
      
      try {
        // 尝试多种方法终止请求
        if (typeof this.currentStreamRequest.abort === 'function') {
          this.currentStreamRequest.abort();
          console.log('使用abort()成功终止请求');
        } else if (typeof this.currentStreamRequest.close === 'function') {
          this.currentStreamRequest.close();
          console.log('使用close()成功终止请求');
        } else if (typeof this.currentStreamRequest.cancel === 'function') {
          this.currentStreamRequest.cancel();
          console.log('使用cancel()成功终止请求');
        } else {
          console.warn('请求对象没有可用的终止方法');
        }
      } catch (error) {
        console.error('终止流式请求失败:', error);
      }
      
      // 强制解引用请求对象
      this.currentStreamRequest = null;
      
      // 清除所有相关计时器
      this._clearAllTimers();
    }
  },
  
  // 清除所有计时器
  _clearAllTimers() {
    if (this.messageTimeoutTimer) {
      clearTimeout(this.messageTimeoutTimer);
      this.messageTimeoutTimer = null;
    }
    
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    
    if (this.backupRequestTimer) {
      clearTimeout(this.backupRequestTimer);
      this.backupRequestTimer = null;
    }
  },
  
  // 页面卸载时取消当前请求和清理资源
  onUnload() {
    // 终止所有现有请求
    this._terminateExistingRequest();
  },
  
  // 获取AI回复
  getAIResponse(userInput) {
    console.log('===== 进入getAIResponse =====');
    const { currentChatId, currentSessionId, currentAssistant } = this.data;
    
    console.log('用户输入:', userInput);
    console.log('当前聊天ID:', currentChatId);
    console.log('当前会话ID:', currentSessionId);
    console.log('当前助手:', currentAssistant);
    
    // 如果没有现有的会话，首先创建会话
    if (!currentChatId || !currentSessionId) {
      console.log('没有现有会话，创建新会话');
      this.createSessionAndSendMessage(currentAssistant.id, userInput);
      return;
    }
    
    console.log('有现有会话，直接发送消息');
    // 有现有会话，直接发送消息
    this.sendMessageToExistingSession(currentChatId, currentSessionId, userInput);
  },
  
  // 创建会话并发送消息
  createSessionAndSendMessage(chatId, userInput) {
    const sessionData = {
      name: `${this.data.currentAssistant.name} - ${new Date().toLocaleString()}`
    };
    
    sessionApi.createSession(chatId, sessionData)
      .then(data => {
        // 保存会话信息
        const sessionId = data.id;
      this.setData({
          currentChatId: chatId,
          currentSessionId: sessionId,
          selectedSession: sessionId
        });
        
        const app = getApp();
        app.globalData.currentSession = {
          id: sessionId,
          chatId: chatId
        };
        
        // 保存到本地存储
        wx.setStorageSync('currentSession', {
          id: sessionId,
          chatId: chatId
        });
        
        // 发送消息
        this.sendMessageToExistingSession(chatId, sessionId, userInput);
      })
      .catch(err => {
        console.error('创建会话失败:', err);
        this.handleAIResponseError();
      });
  },
  
  // 向现有会话发送消息
  sendMessageToExistingSession(chatId, sessionId, userInput) {
    console.log('===== 开始发送消息 =====');
    console.log('发送消息到现有会话: chatId=%s, sessionId=%s', chatId, sessionId);
    console.log('用户输入:', userInput);
    console.log('输入时间:', new Date().toISOString());

    // 终止可能存在的之前的请求
    this._terminateExistingRequest();

    // 创建一个临时的AI消息，显示正在思考状态
    const tempAIMessage = {
      id: `msg-ai-${Date.now()}`,
      role: 'assistant',
      content: '',
      thinking: '',
      showThinking: true, // 默认显示思考状态
      isStreaming: true, // 使用流式加载指示器而非思考框
      timestamp: Date.now()
    };

    // 添加临时AI消息到消息列表
    this.setData({
      messages: [...this.data.messages, tempAIMessage],
      isLoading: true
    });

    // 滚动到最新消息
    this.scrollToLatest(tempAIMessage.id);
    console.log('临时AI消息已创建，ID:', tempAIMessage.id);
    
    // 构建API回调
    const callbacks = {
      onStart: () => {
        console.log('开始获取AI响应');
      },
      onData: (responseData) => {
        try {
          console.log('===== Chat.js收到SSE数据 =====');
          
          // 显示接收到的响应数据
          console.log('接收到的响应数据:');
          console.log(responseData);
          
          // 禁止打印Uint8Array等二进制数据
          if (responseData instanceof Uint8Array) {
            console.log('检测到Uint8Array数据，应该在API层已转换');
            return;
          }
          
          // 确保responseData是一个有效的对象
          if (!responseData || typeof responseData !== 'object') {
            console.warn('收到无效的响应数据，跳过处理');
            return;
          }
          
          // 使用processMessageContent方法处理消息内容
          let content = '';
          let thinking = '';
          let richNodes = [];
          
          // 从新的消息格式中获取content
          if (responseData.content) {
            content = responseData.content;
            
            // 处理思考内容和富文本节点
            const processedContent = this.processMessageContent(content);
            content = processedContent.text || '';
            thinking = processedContent.thinking || '';
            richNodes = processedContent.richNodes || [];
          }
          
          // 如果没有有效内容，设置默认消息
          if (!content || content.trim() === '') {
            content = '我正在思考这个问题的解决方案...';
            richNodes = [{ type: 'text', text: content }];
          }
          
          // 确保richNodes始终是有效数组
          if (!Array.isArray(richNodes) || richNodes.length === 0) {
            richNodes = [{ type: 'text', text: content }];
          }
          
          // 处理引用数据，转换为与历史消息一致的格式
          let references = [];
          if (responseData.docAggs && Array.isArray(responseData.docAggs)) {
            console.log('处理docAggs引用数据:', responseData.docAggs);
            references = responseData.docAggs.map((doc) => {
              const ref = {
                documentId: doc.doc_id || doc.document_id || doc.documentId || '',
                documentName: doc.doc_name || doc.document_name || doc.documentName || doc.title || '未知文档',
                pageNumbers: doc.page_numbers || doc.pageNumbers || '',
                count: doc.count || 1
              };
              console.log('转换引用:', { 原始: doc, 转换后: ref });
              return ref;
            });
            console.log('最终引用数组:', references);
          } else if (responseData.sources || responseData.references) {
            const sources = responseData.sources || responseData.references || [];
            references = sources.map(source => ({
              documentId: source.doc_id || source.document_id || source.documentId || '',
              documentName: source.doc_name || source.document_name || source.documentName || source.title || '未知文档',
              pageNumbers: source.page_numbers || source.pageNumbers || '',
              count: source.count || 1
            }));
          }
          
          // 更新消息列表中的AI回复 - 覆盖式更新
          const messages = [...this.data.messages];
          const lastMessageIndex = messages.length - 1;
          
          if (lastMessageIndex >= 0 && messages[lastMessageIndex].role === 'assistant') {
            const currentMessage = messages[lastMessageIndex];
            
            // 覆盖式更新消息内容，格式与历史消息保持一致
            messages[lastMessageIndex] = {
              ...currentMessage,
              content: content,
              richNodes: richNodes,
              thinking: thinking,
              showThinking: thinking ? true : false, // 流式生成过程中显示思考内容
              hasThinking: !!thinking,
              isStreaming: true,
              timestamp: Date.now(),
              references: references.length > 0 ? references : currentMessage.references || []
            };
            
            console.log('消息已更新 -> chat.wxml:', {
              messageId: currentMessage.id,
              contentLength: content.length,
              hasThinking: !!thinking,
              referencesCount: references.length,
              richNodesCount: richNodes.length
            });
            
            // 更新页面数据
            this.setData({ messages });
            
            // 滚动到最新消息
            this.scrollToLatest(messages[lastMessageIndex].id);
          }
          
          console.log('===== Chat.js数据处理完成 =====');
        } catch (error) {
          console.error('Chat.js处理SSE响应数据时出错:', error);
        }
      },
      
      onError: (error) => {
        console.log('===== SSE错误开始 =====');
        console.log('错误时间:', new Date().toISOString());
        console.log('错误信息:', error);
        
        // 清除所有计时器
        this._clearAllTimers();
        
        // 获取友好的错误消息
        let errorMsg = '抱歉，我现在无法回答您的问题。';
        
        if (error) {
          if (error.message) {
            errorMsg = error.message;
          } else if (typeof error === 'string') {
            errorMsg = error;
          }
        }
        
        // 调用错误处理函数 - 不重试
        this.handleAIResponseError(errorMsg);
      },
      
      onComplete: () => {
        console.log('===== SSE流式请求完成 =====');
        console.log('完成时间:', new Date().toISOString());
        
        // 清除所有计时器
        this._clearAllTimers();
        
        // 确保清除请求引用，避免继续请求
        this.currentStreamRequest = null;
        
        // 完成时移除流式加载指示器
        const messages = [...this.data.messages];
        const lastMessageIndex = messages.length - 1;
        
        if (lastMessageIndex >= 0 && messages[lastMessageIndex].role === 'assistant') {
          // 更新消息状态：停止流式加载，隐藏思考内容
          messages[lastMessageIndex].isStreaming = false;
          
          // 流式生成完成后隐藏思考内容
          if (messages[lastMessageIndex].thinking && messages[lastMessageIndex].thinking.trim()) {
            messages[lastMessageIndex].showThinking = false;
            console.log('流式生成完成，隐藏思考内容');
          }
          
          // 确保最终消息有正确的格式
          if (!messages[lastMessageIndex].content || messages[lastMessageIndex].content.trim() === '') {
            messages[lastMessageIndex].content = '回答生成完成';
            messages[lastMessageIndex].richNodes = [{ type: 'text', text: '回答生成完成' }];
          }
          
          // 确保richNodes有效
          if (!Array.isArray(messages[lastMessageIndex].richNodes) || messages[lastMessageIndex].richNodes.length === 0) {
            messages[lastMessageIndex].richNodes = [{ type: 'text', text: messages[lastMessageIndex].content }];
          }
          
          // 保存最终的会话消息到本地存储
          try {
            const sessionId = this.data.currentSessionId;
            if (sessionId) {
              wx.setStorageSync(`session_messages_${sessionId}`, messages);
              console.log('流式请求完成，已保存最终消息到本地存储');
            }
          } catch (err) {
            console.error('保存最终消息到本地存储失败:', err);
          }
          
          this.setData({ messages });
          console.log('消息状态已更新为完成状态');
        }
        
        // 更新UI状态
        this.setData({
          isLoading: false
        });
        
        // 显示成功提示
        wx.showToast({
          title: '回答已生成',
          icon: 'success',
          duration: 500
        });
      }
    };
    
    // 使用SSE模拟API获取回复 - 禁止重试
    try {
      console.log('使用标准HTTP SSE处理请求回复，禁止重试');
      
      // 使用非阻塞式提示
      wx.showToast({
        title: '正在思考中...',
        icon: 'none',
        duration: 2000,
        mask: false // 不使用蒙层，避免阻塞用户操作
      });
      
      // 设置请求超时时间（只有一次机会，不重试）
      const timeoutMs = 60000; // 60秒超时
      
      console.log('===== 准备创建SSE请求 =====');
      console.log('chatId:', chatId);
      console.log('userInput:', userInput);
      console.log('sessionId:', sessionId);
      console.log('callbacks对象:', callbacks);
      console.log('callbacks.onData是否存在:', typeof callbacks.onData);
      console.log('callbacks.onError是否存在:', typeof callbacks.onError);
      console.log('callbacks.onComplete是否存在:', typeof callbacks.onComplete);
      console.log('超时时间:', timeoutMs);
      console.log('禁止重试模式');
      
      const requestTask = chatApi.streamCompletionSSE(chatId, userInput, sessionId, callbacks, timeoutMs);
      
      console.log('===== SSE请求创建完成 =====');
      console.log('requestTask:', requestTask);
      console.log('requestTask类型:', typeof requestTask);
      console.log('SSE请求已发送，等待响应...');
      
      // 保存请求任务引用，以便可以在需要时中止请求
      this.currentStreamRequest = requestTask;
      
      // 设置最终超时检测（一次性，不重试）
      this.timeoutTimer = setTimeout(() => {
        console.log('请求超时，终止连接（不重试）');
        
        if (this.currentStreamRequest) {
          try {
            this.currentStreamRequest.abort();
            console.log('成功终止超时请求');
          } catch (error) {
            console.error('终止超时请求失败:', error);
          }
          this.currentStreamRequest = null;
        }
        
        // 显示超时错误，不重试
        this.handleAIResponseError('请求超时，请重新发送消息');
      }, timeoutMs);
      
    } catch (error) {
      console.error('启动SSE请求失败:', error);
      // 请求启动失败，不重试
      this.handleAIResponseError('请求发送失败，请重试');
    }
  },
  
  // 处理AI响应错误
  handleAIResponseError(customMessage) {
    // 创建错误消息
    const errorMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: customMessage || '抱歉，我现在无法回答您的问题。请稍后再试。',
      thinking: '',
      timestamp: Date.now()
    };
    
    // 检查是否需要替换现有的消息
    const messages = [...this.data.messages];
    const lastMessageIndex = messages.length - 1;
    
    if (lastMessageIndex >= 0 && 
        messages[lastMessageIndex].role === 'assistant' && 
        (!messages[lastMessageIndex].content || messages[lastMessageIndex].isStreaming)) {
      // 替换现有的不完整消息
      messages[lastMessageIndex] = errorMessage;
      this.setData({
        messages: messages,
        isLoading: false
      });
    } else {
      // 添加新的错误消息
      this.setData({
        messages: [...this.data.messages, errorMessage],
        isLoading: false
      });
    }
    
    // 滚动到最新消息
    this.scrollToLatest(errorMessage.id);
    
    // 显示错误提示
    wx.showToast({
      title: '回答生成失败',
      icon: 'none',
      duration: 2000
    });
  },
  
  // 滚动到最新消息
  scrollToLatest(messageId) {
    // 设置滚动目标，去掉msg-前缀因为WXML中已经修改
    this.setData({
      scrollToMessage: messageId
    });
    
    // 延迟一点确保DOM更新完成后再滚动
    setTimeout(() => {
      this.setData({
        scrollToMessage: messageId
      });
    }, 100);
  },

  // 加载更多历史消息
  loadMoreMessages() {
    if (this.data.pageLoading || !this.data.hasMoreHistory) return;
    
    console.log('触发加载更多历史消息');
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
    
    // 这里应该根据API实际情况调整，RAGFlow可能不支持分页获取会话消息
    setTimeout(() => {
      this.setData({ 
        pageLoading: false,
        hasMoreHistory: false
      });
    }, 1000);
  },

  // 切换显示引用面板
  toggleReferences() {
    this.setData({
      showReferences: !this.data.showReferences
    });
  },
  
  // 切换显示思考内容
  toggleThinking(e) {
    const messageId = e.currentTarget.dataset.id;
    const messages = [...this.data.messages];
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      // 切换当前消息的showThinking属性
      messages[messageIndex].showThinking = !messages[messageIndex].showThinking;
      
      this.setData({ messages });
    }
  },
  
  // 跳转到创建知识库页面
  goToCreateKB() {
    // 使用全局变量代替事件通道
    const app = getApp();
    app.globalData.shouldOpenAddKnowledgeBase = true;
    
    wx.switchTab({
      url: '/pages/home/home'
    });
  },
  
  // 获取聊天助手列表
  getChatAssistants() {
    // 显示加载提示
    wx.showLoading({ title: '加载助手...' });
    
    chatAssistantApi.listAssistants({
      page: 1,
      page_size: 30,
      orderby: 'update_time',
      desc: true
    })
      .then(response => {
        console.log('=== 助手列表API返回数据分析 ===');
        console.log('原始响应:', response);
        console.log('响应类型:', typeof response);
        console.log('是否为数组:', Array.isArray(response));
        
        // 处理不同的数据结构
        let assistants = [];
        
        if (Array.isArray(response)) {
          // 如果直接是数组
          console.log('数据格式：直接数组');
          assistants = response;
        } else if (response && typeof response === 'object') {
          console.log('数据格式：对象，开始解析...');
          console.log('对象键:', Object.keys(response));
          
          // 尝试从不同字段获取数据
          if (Array.isArray(response.data)) {
            console.log('找到数据：response.data');
            assistants = response.data;
          } else if (Array.isArray(response.assistants)) {
            console.log('找到数据：response.assistants');
            assistants = response.assistants;
          } else if (Array.isArray(response.items)) {
            console.log('找到数据：response.items');
            assistants = response.items;
          } else if (Array.isArray(response.list)) {
            console.log('找到数据：response.list');
            assistants = response.list;
          } else {
            console.warn('未在响应中找到助手数组数据');
            console.log('可用字段:', Object.keys(response));
            // 如果响应对象的值本身可能是数组，遍历查找
            for (const key of Object.keys(response)) {
              if (Array.isArray(response[key])) {
                console.log(`发现数组字段: ${key}，长度: ${response[key].length}`);
                if (response[key].length > 0 && response[key][0].id) {
                  console.log(`使用字段 ${key} 作为助手数据`);
                  assistants = response[key];
                  break;
                }
              }
            }
          }
        }
        
        console.log('解析后的助手数组:', assistants);
        console.log('助手数量:', assistants.length);
        
        // 隐藏加载提示
        wx.hideLoading();
        
        if (assistants && assistants.length > 0) {
          // 构建选择器选项
          const options = assistants.map((assistant) => ({
            label: assistant.name,
            value: assistant.id
          }));
          
          this.setData({
            assistantOptions: options,
            assistants: assistants
          });
          
          // 如果当前没有选择助手，自动选择第一个
          if (!this.data.currentAssistant.id && assistants.length > 0) {
            const firstAssistant = assistants[0];
            console.log('自动选择第一个助手:', firstAssistant);
            this.selectAssistant(firstAssistant);
          }
          
          console.log('助手列表加载成功，助手数量:', assistants.length);
          
          // 添加详细调试信息
          console.log('===== 助手列表调试信息 =====');
          console.log('assistants数组:', assistants);
          console.log('assistantOptions:', options);
          console.log('当前currentAssistant.id:', this.data.currentAssistant.id);
          console.log('是否自动选择第一个助手:', !this.data.currentAssistant.id && assistants.length > 0);
          console.log('===== 助手列表调试结束 =====');
        } else {
          // 没有助手可用
          console.warn('未找到可用助手');
          wx.showToast({
            title: '未找到可用助手',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        // 隐藏加载提示
        wx.hideLoading();
        
        console.error('获取聊天助手列表失败:', err);
        wx.showToast({
          title: '获取助手列表失败',
          icon: 'none'
        });
      });
  },
  
  // 选择助手的通用方法
  selectAssistant(assistant) {
    if (!assistant || !assistant.id) {
      console.warn('selectAssistant: 无效的助手对象', assistant);
      return;
    }
    
    console.log('选择助手:', assistant);
    
    // 更新当前选择的助手
    this.setData({
      currentAssistant: assistant,
      selectedAssistant: assistant.id,
      currentChatId: assistant.id
    });
    
    console.log('助手已设置，currentAssistant.id:', this.data.currentAssistant.id);
    
    // 从助手获取知识库信息
    if (assistant.datasets && assistant.datasets.length > 0) {
      const dataset = assistant.datasets[0];
      
      // 更新知识库信息
      const knowledgeBase = {
        id: dataset.id,
        name: dataset.name,
        description: dataset.description || '',
        createTime: dataset.create_date,
        updateTime: dataset.update_date,
        docsCount: dataset.document_count || 0,
        tags: dataset.parser_config && dataset.parser_config.tag_kb_ids ? 
             dataset.parser_config.tag_kb_ids : [],
        embedding_model: dataset.embedding_model,
        chunk_method: dataset.chunk_method,
        parser_config: dataset.parser_config
      };
      
      this.setData({
        currentKnowledgeBase: knowledgeBase
      });
      
      console.log('知识库信息已更新:', knowledgeBase.name);
    }
    
    // 查找该助手的会话
    this.findSessionsForAssistant(assistant.id);
    
    // 添加状态检查
    setTimeout(() => {
      console.log('=== 页面状态检查 ===');
      console.log('currentAssistant:', this.data.currentAssistant);
      console.log('currentAssistant.id:', this.data.currentAssistant.id);
      console.log('页面应该显示聊天界面:', !!this.data.currentAssistant.id);
      console.log('页面应该显示输入区域:', !!this.data.currentAssistant.id);
      console.log('=== 状态检查完成 ===');
    }, 100);
  },
  
  // 选择会话
  onSessionChange(e) {
    const { value } = e.detail;
    
    if (value === this.data.selectedSession) return;
    
    console.log(`===== 开始切换会话 =====`);
    console.log('选择的会话ID:', value);
    console.log('当前助手ID:', this.data.currentAssistant.id);
    console.log('当前会话列表:', this.data.sessions);
    
    // 查找选择的会话
    const selectedSession = this.data.sessions.find(s => s.id === value);
    if (!selectedSession) {
      console.error('未找到选择的会话:', value);
      wx.showToast({
        title: '会话不存在',
        icon: 'none'
      });
      return;
    }
    
    console.log('找到的会话对象:', selectedSession);
    
    // 使用当前助手ID（因为我们已经修复了会话数据中的chat字段）
    const finalChatId = this.data.currentAssistant.id || this.data.currentChatId;
    
    if (!finalChatId) {
      console.error('无法确定助手ID');
      wx.showToast({
        title: '助手信息异常',
        icon: 'none'
      });
      return;
    }
    
    console.log('使用的助手ID:', finalChatId);
    
    // 显示加载提示
    wx.showLoading({ title: '切换会话中...' });
    
    // 更新状态
    this.setData({
      selectedSession: value,
      currentSessionId: value,
      currentChatId: finalChatId
    });
    
    console.log('状态更新完成，开始加载会话消息');
    
    // 加载会话消息
    this.getSessionMessages(finalChatId, value);
    
    // 保存会话信息到全局
    const app = getApp();
    app.globalData.currentSession = {
      id: value,
      chatId: finalChatId
    };
    
    // 保存到本地存储
    try {
      wx.setStorageSync('currentSession', {
        id: value,
        chatId: finalChatId
      });
      console.log('会话信息已保存到本地存储');
    } catch (error) {
      console.error('保存会话信息失败:', error);
    }
    
    console.log('===== 会话切换处理完成 =====');
  },
  
  // 格式化时间戳为可读时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },
  
  // 格式化日期为可读日期
  formatDate(dateStr) {
    if (!dateStr) return '未知时间';
    
    try {
      // 处理iOS不支持的日期格式
      let date;
      if (dateStr.includes(',')) {
        // 处理 "Thu, 22 May 2025 01:30:37 GMT" 格式
        // 移除星期和逗号，将月份名称转换为数字
        const parts = dateStr.split(' ');
        const day = parts[2];
        const month = this.getMonthNumber(parts[1]);
        const year = parts[3];
        
        // 创建iOS支持的日期格式 "YYYY-MM-DD"
        const formattedDateStr = `${year}-${month}-${day}`;
        date = new Date(formattedDateStr);
      } else {
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) {
        return dateStr; // 无法解析则返回原始字符串
      }
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      return `${year}年${month}月${day}日`;
    } catch (e) {
      console.error('日期格式化错误:', e);
      return dateStr;
    }
  },
  
  // 获取月份名称对应的数字
  getMonthNumber(monthName) {
    const months = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    return months[monthName] || '01';
  },
  
  // 选择助手
  onAssistantChange(e) {
    const { value } = e.detail;
    
    if (value === this.data.selectedAssistant) return;
    
    // 查找选择的助手
    const assistant = this.data.assistants.find(a => a.id === value);
    if (assistant) {
      this.selectAssistant(assistant);
    }
  },

  // 下拉刷新
  onRefresh() {
    console.log('触发下拉刷新');
    
    // 防止重复刷新
    if (this.data.isRefreshing) {
      console.log('正在刷新中，忽略此次下拉');
      this.setData({
        refresherTriggered: false
      });
      return;
    }
    
    this.setData({
      refresherTriggered: true,
      isRefreshing: true
    });
    
    this.refreshData()
      .finally(() => {
        this.setData({
          refresherTriggered: false,
          isRefreshing: false
        });
      });
  },

  // 手动刷新按钮
  onManualRefresh() {
    if (this.data.isRefreshing) return;
    
    console.log('手动触发刷新');
    this.setData({
      isRefreshing: true
    });
    
    this.refreshData()
      .finally(() => {
        this.setData({
          isRefreshing: false
        });
      });
  },

  // 刷新数据的核心方法
  refreshData() {
    return new Promise((resolve) => {
      console.log('开始刷新助手和会话数据...');
      
      // 显示刷新提示
      wx.showToast({
        title: '正在刷新...',
        icon: 'loading',
        duration: 1000
      });
      
      // 保存当前选择状态
      const currentAssistantId = this.data.currentAssistant.id;
      const currentSessionId = this.data.currentSessionId;
      
      // 重新获取助手列表
      chatAssistantApi.listAssistants({
        page: 1,
        page_size: 30,
        orderby: 'update_time',
        desc: true
      })
        .then(response => {
          console.log('=== 刷新助手列表API返回数据分析 ===');
          console.log('原始响应:', response);
          
          // 使用统一的数据解析逻辑
          let assistants = [];
          
          if (Array.isArray(response)) {
            assistants = response;
          } else if (response && typeof response === 'object') {
            if (Array.isArray(response.data)) {
              assistants = response.data;
            } else if (Array.isArray(response.assistants)) {
              assistants = response.assistants;
            } else if (Array.isArray(response.items)) {
              assistants = response.items;
            } else if (Array.isArray(response.list)) {
              assistants = response.list;
            } else {
              // 遍历查找数组字段
              for (const key of Object.keys(response)) {
                if (Array.isArray(response[key]) && response[key].length > 0 && response[key][0].id) {
                  assistants = response[key];
                  break;
                }
              }
            }
          }
          
          if (assistants && assistants.length > 0) {
            // 构建选择器选项
            const options = assistants.map((assistant) => ({
              label: assistant.name,
              value: assistant.id
            }));
            
            this.setData({
              assistantOptions: options,
              assistants: assistants
            });
            
            // 尝试恢复之前选择的助手
            let targetAssistant = null;
            if (currentAssistantId) {
              targetAssistant = assistants.find(a => a.id === currentAssistantId);
            }
            
            // 如果之前的助手不存在，选择第一个
            if (!targetAssistant && assistants.length > 0) {
              targetAssistant = assistants[0];
            }
            
            if (targetAssistant) {
              // 更新助手信息
              this.setData({
                currentAssistant: targetAssistant,
                selectedAssistant: targetAssistant.id,
                currentChatId: targetAssistant.id
              });
              
              // 刷新会话列表
              return this.refreshSessions(targetAssistant.id, currentSessionId);
            } else {
              console.log('没有可用的助手');
              resolve();
            }
          } else {
            console.log('助手列表为空');
            wx.showToast({
              title: '暂无助手',
              icon: 'none'
            });
            resolve();
          }
        })
        .catch(err => {
          console.error('刷新助手列表失败:', err);
          wx.showToast({
            title: '刷新失败',
            icon: 'none'
          });
          resolve();
        });
    });
  },

  // 刷新会话列表
  refreshSessions(assistantId, targetSessionId) {
    return new Promise((resolve) => {
      console.log(`刷新助手(${assistantId})的会话列表`);
      
      sessionApi.listSessions({
        chat_id: assistantId,
        page: 1,
        page_size: 30,
        orderby: 'update_time',
        desc: true
      })
        .then(response => {
          console.log('=== 刷新会话列表API返回数据分析 ===');
          console.log('原始响应:', response);
          
          // 使用统一的数据解析逻辑
          let sessions = [];
          
          if (Array.isArray(response)) {
            sessions = response;
          } else if (response && typeof response === 'object') {
            if (Array.isArray(response.data)) {
              sessions = response.data;
            } else if (Array.isArray(response.sessions)) {
              sessions = response.sessions;
            } else if (Array.isArray(response.items)) {
              sessions = response.items;
            } else if (Array.isArray(response.list)) {
              sessions = response.list;
            } else {
              // 遍历查找数组字段
              for (const key of Object.keys(response)) {
                if (Array.isArray(response[key]) && response[key].length > 0 && response[key][0].id) {
                  sessions = response[key];
                  break;
                }
              }
            }
          }
          
          if (sessions && Array.isArray(sessions) && sessions.length > 0) {
            try {
              console.log('===== 开始处理会话数据 =====');
              
              // 确保每个会话有chat字段，因为API返回的chat为null
              const processedSessions = sessions.map((session, index) => {
                if (!session) {
                  console.warn(`发现无效的会话对象(null/undefined) at index ${index}`);
                  return null;
                }
                
                console.log(`处理会话 ${index}:`, {
                  id: session.id,
                  name: session.name,
                  chat: session.chat,
                  assistantId: assistantId
                });
                
                // 由于API返回的chat字段为null，强制使用当前助手ID
                const processedSession = { 
                  ...session, 
                  chat: assistantId // 强制使用传入的助手ID，修复chat为null的问题
                };
                
                console.log(`会话 ${session.id} 已设置chat字段为: ${assistantId}`);
                return processedSession;
              }).filter(session => session !== null); // 过滤掉无效的会话
              
              console.log('处理后的会话列表:', processedSessions);
              
              // 再次检查处理后的会话列表是否为空
              if (processedSessions.length === 0) {
                console.warn('处理后的会话列表为空');
                throw new Error('处理后的会话列表为空');
              }
              
              // 构建选择器选项
              const options = processedSessions.map((session) => ({
                label: session.name || `会话 ${session.id}`, // 确保有显示内容
                value: session.id
              }));
              
              console.log('构建的会话选择器选项:', options);
              
              // 更新会话选择器
              this.setData({
                sessionOptions: options,
                sessions: processedSessions
              });
              
              console.log('会话选择器已更新');
              
              // 确保latestSession存在且有效
              const latestSession = processedSessions[0];
              if (!latestSession || !latestSession.id) {
                console.warn('最新会话无效或缺少ID');
                throw new Error('最新会话无效');
              }
              
              console.log('选择最新会话:', latestSession);
              
              // 更新会话选择
              this.setData({
                selectedSession: latestSession.id,
                currentSessionId: latestSession.id
              });
              
              console.log('会话选择状态已更新');
              
              // 加载会话消息
              console.log('开始加载会话消息...');
              this.getSessionMessages(assistantId, latestSession.id);
              
              // 保存会话信息到全局
              const app = getApp();
              app.globalData.currentSession = {
                id: latestSession.id,
                chatId: assistantId
              };
              
              // 保存到本地存储
              try {
                wx.setStorageSync('currentSession', {
                  id: latestSession.id,
                  chatId: assistantId
                });
                console.log('会话信息已保存到本地存储');
              } catch (storageError) {
                console.error('保存会话到本地存储失败:', storageError);
                // 存储失败不影响主流程
              }
              
              console.log('===== 会话数据处理完成 =====');
            } catch (processError) {
              // 处理会话数据时发生错误
              console.error('处理会话数据时出错:', processError);
              handleSessionError();
            }
          } else {
            console.log('会话列表为空，初始化欢迎消息');
            handleSessionError();
          }
          
          resolve();
        })
        .catch(err => {
          console.error('刷新会话列表失败:', err);
          wx.showToast({
            title: '刷新会话失败',
            icon: 'none'
          });
          resolve();
        });
    });
  },

  // 下拉刷新相关事件处理
  onRefresherPulling() {
    console.log('下拉刷新 - pulling');
  },

  onRefresherRestore() {
    console.log('下拉刷新 - restore');
  },

  onRefresherAbort() {
    console.log('下拉刷新 - abort');
    this.setData({
      refresherTriggered: false,
      isRefreshing: false
    });
  },
  
  // 添加消息超时计时器方法
  _resetMessageTimeoutTimer: function() {
    // 清除现有计时器
    if (this.messageTimeoutTimer) {
      clearTimeout(this.messageTimeoutTimer);
    }
    
    // 设置10秒超时
    this.messageTimeoutTimer = setTimeout(() => {
      console.log('UI层检测到10秒无新消息，强制结束流');
      
      // 尝试中止当前请求
      if (this.currentStreamRequest) {
        try {
          this.currentStreamRequest.abort();
          console.log('成功中止超时的流请求');
        } catch (err) {
          console.error('中止超时流请求时出错:', err);
        }
        this.currentStreamRequest = null;
      }
      
      // 调用完成回调处理，确保UI正确更新
      if (this.backupRequestTimer) {
        clearTimeout(this.backupRequestTimer);
        this.backupRequestTimer = null;
      }
      
      // 更新UI状态
      const messages = [...this.data.messages];
      const lastMessageIndex = messages.length - 1;
      
      if (lastMessageIndex >= 0 && messages[lastMessageIndex].role === 'assistant') {
        messages[lastMessageIndex].isStreaming = false;
        
        // 如果有思考内容，默认隐藏
        if (messages[lastMessageIndex].thinking && messages[lastMessageIndex].thinking.trim()) {
          messages[lastMessageIndex].showThinking = false;
        }
        
        this.setData({
          messages,
          isLoading: false
        });
      } else {
        this.setData({ isLoading: false });
      }
      
      // 显示提示
      wx.showToast({
        title: '回答已生成',
        icon: 'success',
        duration: 500
      });
    }, 10000); // 10秒超时
  },

  // 根据文档名称获取对应的图标
  getDocumentIcon: function(documentName) {
    if (!documentName) return 'file';
    
    const fileName = documentName.toLowerCase();
    
    // PDF文档
    if (fileName.endsWith('.pdf')) {
      return 'file-pdf';
    }
    // Word文档
    else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return 'file-word';
    }
    // Excel文档
    else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return 'file-excel';
    }
    // PowerPoint文档
    else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      return 'file-powerpoint';
    }
    // 文本文档
    else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
      return 'file-text';
    }
    // 图片文件
    else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || 
             fileName.endsWith('.gif') || fileName.endsWith('.bmp') || fileName.endsWith('.webp')) {
      return 'image';
    }
    // 压缩文件
    else if (fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z')) {
      return 'file-zip';
    }
    // 代码文件
    else if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.jsx') || 
             fileName.endsWith('.tsx') || fileName.endsWith('.html') || fileName.endsWith('.css') ||
             fileName.endsWith('.py') || fileName.endsWith('.java') || fileName.endsWith('.cpp') ||
             fileName.endsWith('.c') || fileName.endsWith('.php') || fileName.endsWith('.go')) {
      return 'file-code';
    }
    // 默认文件图标
    else {
      return 'file';
    }
  },

  // 根据文档名称获取对应的图标颜色
  getDocumentIconColor: function(documentName) {
    if (!documentName) return '#666';
    
    const fileName = documentName.toLowerCase();
    
    // PDF文档 - 红色
    if (fileName.endsWith('.pdf')) {
      return '#E53E3E';
    }
    // Word文档 - 蓝色
    else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return '#2B6CB0';
    }
    // Excel文档 - 绿色
    else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return '#38A169';
    }
    // PowerPoint文档 - 橙色
    else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      return '#DD6B20';
    }
    // 文本文档 - 灰色
    else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
      return '#4A5568';
    }
    // 图片文件 - 紫色
    else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || 
             fileName.endsWith('.gif') || fileName.endsWith('.bmp') || fileName.endsWith('.webp')) {
      return '#805AD5';
    }
    // 压缩文件 - 黄色
    else if (fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z')) {
      return '#D69E2E';
    }
    // 代码文件 - 青色
    else if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.jsx') || 
             fileName.endsWith('.tsx') || fileName.endsWith('.html') || fileName.endsWith('.css') ||
             fileName.endsWith('.py') || fileName.endsWith('.java') || fileName.endsWith('.cpp') ||
             fileName.endsWith('.c') || fileName.endsWith('.php') || fileName.endsWith('.go')) {
      return '#319795';
    }
    // 默认颜色
    else {
      return '#666';
    }
  },

  // 测试按钮点击事件
  testButtonClick() {
    console.log('===== 测试按钮被点击 =====');
    console.log('当前时间:', new Date().toISOString());
    console.log('currentAssistant.id:', this.data.currentAssistant.id);
    console.log('inputMessage:', this.data.inputMessage);
    
    // 调用真正的sendMessage
    this.sendMessage();
  }
});