// pages/knowledge-detail/knowledge-detail.js
import { datasetApi, documentApi, chatAssistantApi, sessionApi, wxLoginApi } from '../../utils/api';
import api from '../../utils/api';

Page({
  data: {
    id: '',
    knowledgeBase: {},
    documents: [],
    showEditDialog: false,
    editingDocument: {},
    editingDocIndex: -1,
    loading: false,
    pageNum: 1,
    pageSize: 30,
    totalDocs: 0,
    hasMore: true,
    // 添加配置详情对话框相关数据
    showConfigDetailDialog: false,
    configDetailItems: []
  },

  // 检查JWT认证状态的辅助函数
  checkJWTAuth() {
    try {
      const wxJWT = wx.getStorageSync('wxJWT');
      const loginTime = wx.getStorageSync('loginTime');
      
      if (!wxJWT || !loginTime) {
        console.log('JWT检查失败: 未找到认证信息');
        return { valid: false, reason: 'no_auth' };
      }
      
      // 检查JWT格式是否正确（基本格式验证）
      const jwtParts = wxJWT.split('.');
      if (jwtParts.length !== 3) {
        console.log('JWT检查失败: JWT格式无效');
        // 清除无效的JWT
        wx.removeStorageSync('wxJWT');
        wx.removeStorageSync('loginTime');
        return { valid: false, reason: 'invalid_format' };
      }
      
      // 检查JWT是否过期（7天）
      const currentTime = new Date().getTime();
      const expireTime = 7 * 24 * 60 * 60 * 1000; // 7天
      
      if (currentTime - loginTime > expireTime) {
        console.log('JWT检查失败: 认证信息已过期');
        // 清除过期的JWT
        wx.removeStorageSync('wxJWT');
        wx.removeStorageSync('loginTime');
        return { valid: false, reason: 'expired' };
      }
      
      // 尝试解析JWT payload来进一步验证
      try {
        const payload = JSON.parse(atob(jwtParts[1]));
        const currentTimestamp = Math.floor(Date.now() / 1000);
        
        // 检查JWT内部的过期时间
        if (payload.exp && payload.exp < currentTimestamp) {
          console.log('JWT检查失败: JWT内部时间戳显示已过期');
          wx.removeStorageSync('wxJWT');
          wx.removeStorageSync('loginTime');
          return { valid: false, reason: 'jwt_expired' };
        }
        
        console.log('JWT检查成功: 认证信息有效', {
          userId: payload.sub || payload.user_id,
          expiresAt: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : '未设置'
        });
      } catch (parseError) {
        console.warn('JWT解析失败，但将继续使用（可能是加密的JWT）:', parseError);
      }
      
      console.log('JWT检查成功: 认证信息有效');
      return { valid: true, jwt: wxJWT };
    } catch (error) {
      console.error('JWT检查出错:', error);
      // 清除可能损坏的认证信息
      try {
        wx.removeStorageSync('wxJWT');
        wx.removeStorageSync('loginTime');
      } catch (clearError) {
        console.error('清除损坏的认证信息失败:', clearError);
      }
      return { valid: false, reason: 'error' };
    }
  },

  // 执行重新登录的方法
  performReLogin() {
    console.log('开始执行重新登录流程');
    
    // 清除所有认证相关信息
    wxLoginApi.clearLoginInfo();
    
    // 使用包装好的手动登录方法，支持用户确认和无限重试
    return wxLoginApi.performManualLogin();
  },

  // 测试JWT认证的调试函数
  testJWTAuth() {
    const authCheck = this.checkJWTAuth();
    console.log('JWT认证测试结果:', authCheck);
    
    if (!authCheck.valid) {
      wx.showToast({
        title: 'JWT认证无效',
        icon: 'none'
      });
      return;
    }
    
    // 测试一个简单的API调用来验证JWT
    console.log('测试JWT认证 - 调用知识库列表API');
    datasetApi.listDatasets({ page: 1, page_size: 1 })
      .then(result => {
        console.log('JWT认证测试成功:', result);
        wx.showToast({
          title: 'JWT认证正常',
          icon: 'success'
        });
      })
      .catch(error => {
        console.error('JWT认证测试失败:', error);
        wx.showToast({
          title: 'JWT认证失败',
          icon: 'none'
        });
      });
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ id });
    
    // 获取知识库详情
    this.getKnowledgeBaseById(id);

    // 获取文档列表
    this.data.loading = false
    this.getDocuments(id);
  },
  
  // 根据ID获取知识库详情
  getKnowledgeBaseById(id) {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });
    
    // 使用listDatasets API并通过ID过滤获取特定数据集
    datasetApi.listDatasets({
      id: id,  // 通过ID过滤
      page: 1,
      page_size: 1
    })
      .then(response => {
        console.log('获取知识库详情响应:', response);
        
        // 处理不同的数据结构
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
          } else if (response.data && typeof response.data === 'object') {
            const dataObj = response.data;
            if (Array.isArray(dataObj.datasets)) {
              datasets = dataObj.datasets;
            } else if (Array.isArray(dataObj.items)) {
              datasets = dataObj.items;
            } else if (Array.isArray(dataObj.list)) {
              datasets = dataObj.list;
            }
          }
        }
        
        // 查找匹配的数据集
        const dataset = datasets.find(item => item.id === id) || datasets[0];
        
        if (dataset) {
          const knowledgeBase = {
            id: dataset.id,
            name: dataset.name,
            description: dataset.description || '',
            createTime: this.formatDate(dataset.create_date),
            updateTime: this.formatDate(dataset.update_date),
            createTimestamp: dataset.create_time,
            updateTimestamp: dataset.update_time,
            docsCount: dataset.document_count || 0,
            chunkCount: dataset.chunk_count || 0,
            tokenNum: dataset.token_num || 0,
            language: dataset.language || '未知语言',
            avatar: dataset.avatar || '',
            tags: dataset.parser_config && dataset.parser_config.tag_kb_ids ? 
                 dataset.parser_config.tag_kb_ids : [],
            embedding_model: dataset.embedding_model,
            chunk_method: dataset.chunk_method,
            parser_config: dataset.parser_config || {}
          };
          
          this.setData({ knowledgeBase });
          
          // 将当前知识库信息保存到全局
          const app = getApp();
          app.globalData.currentKnowledgeBase = knowledgeBase;
        } else {
          console.error('未找到指定的知识库:', id);
          wx.showToast({
            title: '知识库不存在',
            icon: 'none'
          });
          
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      })
      .catch(err => {
        console.error('获取知识库详情失败:', err);
        wx.showToast({
          title: '获取知识库失败',
          icon: 'none'
        });
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .finally(() => {
        this.setData({ loading: false });
        wx.hideLoading();
      });
  },
  
  // 获取知识库下的文档列表
  getDocuments(datasetId, page = 1, replace = true) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    if (page === 1) {
      wx.showLoading({ title: '加载中...' });
    }
    
    const params = {
      page: page,
      page_size: this.data.pageSize,
      orderby: "create_time",
      desc: true
    };
    
    console.log('获取文档列表参数:', params);
    
    documentApi.listDocuments(datasetId, params)
      .then(response => {
        console.log('=== 文档列表API返回数据分析 ===');
        console.log('原始响应:', response);
        console.log('响应类型:', typeof response);
        console.log('是否为数组:', Array.isArray(response));
        
        // 处理不同的数据结构
        let docsData = null;
        let docs = [];
        let total = 0;
        
        if (response) {
          // 尝试从不同的数据结构中提取文档列表
          if (Array.isArray(response)) {
            // 如果直接是数组，假设是文档列表
            console.log('数据格式：直接数组');
            docs = response;
            total = response.length;
          } else if (response && typeof response === 'object') {
            console.log('数据格式：对象，开始解析...');
            console.log('对象键:', Object.keys(response));
            
            // 尝试从不同字段获取数据
            if (response.docs && Array.isArray(response.docs)) {
              console.log('找到数据：response.docs');
              docs = response.docs;
              total = response.total || response.docs.length;
            } else if (response.data && typeof response.data === 'object') {
              console.log('data字段是对象，继续解析...');
              const dataObj = response.data;
              console.log('data对象键:', Object.keys(dataObj));
              
              if (dataObj.docs && Array.isArray(dataObj.docs)) {
                console.log('找到数据：response.data.docs');
                docs = dataObj.docs;
                total = dataObj.total || dataObj.docs.length;
              } else if (dataObj.documents && Array.isArray(dataObj.documents)) {
                console.log('找到数据：response.data.documents');
                docs = dataObj.documents;
                total = dataObj.total || dataObj.documents.length;
              } else if (dataObj.items && Array.isArray(dataObj.items)) {
                console.log('找到数据：response.data.items');
                docs = dataObj.items;
                total = dataObj.total || dataObj.items.length;
              } else if (dataObj.list && Array.isArray(dataObj.list)) {
                console.log('找到数据：response.data.list');
                docs = dataObj.list;
                total = dataObj.total || dataObj.list.length;
              } else {
                console.warn('data对象中未找到文档数组字段:', dataObj);
              }
            } else if (response.documents && Array.isArray(response.documents)) {
              console.log('找到数据：response.documents');
              docs = response.documents;
              total = response.total || response.documents.length;
            } else if (response.items && Array.isArray(response.items)) {
              console.log('找到数据：response.items');
              docs = response.items;
              total = response.total || response.items.length;
            } else if (response.list && Array.isArray(response.list)) {
              console.log('找到数据：response.list');
              docs = response.list;
              total = response.total || response.list.length;
            } else {
              console.warn('无法识别的数据结构:', response);
            }
          } else {
            console.warn('API返回的数据不是预期的格式:', response);
          }
        }
        
        console.log('解析后的文档数组:', docs);
        console.log('文档数量:', docs.length);
        console.log('总数:', total);
        
        // 确保docs是数组
        if (!Array.isArray(docs)) {
          console.error('文档列表不是数组格式:', docs);
          docs = [];
        }
        
        // 如果数据为空，显示提示
        if (docs.length === 0) {
          console.log('文档列表为空');
          if (replace && page === 1) {
            wx.showToast({
              title: '暂无文档',
              icon: 'none'
            });
          }
        }
        
        // 转换API数据格式为应用所需格式
        const formattedDocs = docs.map((doc, index) => {
          console.log(`格式化文档 ${index}:`, doc);
          return {
            id: doc.id,
            name: doc.name,
            size: this.formatFileSize(doc.size || 0),
            type: this.getFileType(doc.name || ''),
            createTime: doc.create_date || doc.create_time,
            chunkCount: doc.chunk_count || 0,
            tokenCount: doc.token_count || 0,
            status: doc.run || doc.status
          };
        });
        
        console.log('格式化后的文档:', formattedDocs);
        
        this.setData({
          documents: replace ? formattedDocs : [...this.data.documents, ...formattedDocs],
          totalDocs: total,
          pageNum: page,
          hasMore: formattedDocs.length >= this.data.pageSize && (page * this.data.pageSize) < total
        });
        
        console.log('文档列表页面数据更新完成');
      })
      .catch(err => {
        console.error('=== 获取文档列表失败 ===');
        console.error('错误详情:', err);
        console.error('错误消息:', err.message);
        
        wx.showToast({
          title: err.message || '获取文档失败',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ loading: false });
        if (page === 1) {
          wx.hideLoading();
        }
      });
  },
  
  // 加载更多文档
  loadMoreDocuments() {
    if (!this.data.hasMore || this.data.loading) return;
    
    const nextPage = this.data.pageNum + 1;
    this.getDocuments(this.data.id, nextPage, false);
  },
  
  // 基于知识库开始对话
  startChat() {
    // 保存当前选择的知识库到全局
    const app = getApp();
    app.globalData.currentKnowledgeBase = this.data.knowledgeBase;
    
    wx.showLoading({ title: '准备中...' });
    
    // 获取助手列表
    chatAssistantApi.listAssistants({
      page: 1,
      page_size: 10,
      orderby: 'update_time',
      desc: true  // 按更新时间降序，最新的排在前面
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
          } else if (response.data && typeof response.data === 'object') {
            console.log('data字段是对象，继续解析...');
            const dataObj = response.data;
            console.log('data对象键:', Object.keys(dataObj));
            
            if (Array.isArray(dataObj.assistants)) {
              console.log('找到数据：response.data.assistants');
              assistants = dataObj.assistants;
            } else if (Array.isArray(dataObj.items)) {
              console.log('找到数据：response.data.items');
              assistants = dataObj.items;
            } else if (Array.isArray(dataObj.list)) {
              console.log('找到数据：response.data.list');
              assistants = dataObj.list;
            } else {
              console.warn('data对象中未找到助手数组字段:', dataObj);
            }
          } else {
            console.warn('无法识别的数据结构:', response);
          }
        } else {
          console.warn('API返回的数据不是预期的格式:', response);
        }
        
        console.log('解析后的助手数组:', assistants);
        console.log('助手数量:', assistants.length);
        
        // 确保assistants是数组
        if (!Array.isArray(assistants)) {
          console.error('助手列表不是数组格式:', assistants);
          assistants = [];
        }
        
        if (assistants.length > 0) {
          // 有助手，使用最新的（列表第一个）
          const latestAssistant = assistants[0];
          
          // 保存助手ID
          app.globalData.chatAssistantId = latestAssistant.id;
          wx.setStorageSync('chatAssistantId', latestAssistant.id);
          
          // 获取该助手的会话列表
          this.getAssistantSessions(latestAssistant.id);
        } else {
          // 没有助手，创建一个新的
          this.createChatAssistant();
        }
      })
      .catch(err => {
        console.error('获取聊天助手失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '创建聊天失败',
          icon: 'none'
        });
      });
  },
  
  // 获取助手的会话列表
  getAssistantSessions(chatId) {
    const app = getApp();
    
    sessionApi.listSessions({
      chat_id: chatId,
      page: 1,
      page_size: 10,
      orderby: 'update_time',
      desc: true  // 按更新时间降序，最新的排在前面
    })
      .then(response => {
        console.log('=== 会话列表API返回数据分析 ===');
        console.log('原始响应:', response);
        console.log('响应类型:', typeof response);
        console.log('是否为数组:', Array.isArray(response));
        
        // 处理不同的数据结构
        let sessions = [];
        
        if (Array.isArray(response)) {
          // 如果直接是数组
          console.log('数据格式：直接数组');
          sessions = response;
        } else if (response && typeof response === 'object') {
          console.log('数据格式：对象，开始解析...');
          console.log('对象键:', Object.keys(response));
          
          // 尝试从不同字段获取数据
          if (Array.isArray(response.data)) {
            console.log('找到数据：response.data');
            sessions = response.data;
          } else if (Array.isArray(response.sessions)) {
            console.log('找到数据：response.sessions');
            sessions = response.sessions;
          } else if (Array.isArray(response.items)) {
            console.log('找到数据：response.items');
            sessions = response.items;
          } else if (Array.isArray(response.list)) {
            console.log('找到数据：response.list');
            sessions = response.list;
          } else if (response.data && typeof response.data === 'object') {
            console.log('data字段是对象，继续解析...');
            const dataObj = response.data;
            console.log('data对象键:', Object.keys(dataObj));
            
            if (Array.isArray(dataObj.sessions)) {
              console.log('找到数据：response.data.sessions');
              sessions = dataObj.sessions;
            } else if (Array.isArray(dataObj.items)) {
              console.log('找到数据：response.data.items');
              sessions = dataObj.items;
            } else if (Array.isArray(dataObj.list)) {
              console.log('找到数据：response.data.list');
              sessions = dataObj.list;
            } else {
              console.warn('data对象中未找到会话数组字段:', dataObj);
            }
          } else {
            console.warn('无法识别的数据结构:', response);
          }
        } else {
          console.warn('API返回的数据不是预期的格式:', response);
        }
        
        console.log('解析后的会话数组:', sessions);
        console.log('会话数量:', sessions.length);
        
        // 确保sessions是数组
        if (!Array.isArray(sessions)) {
          console.error('会话列表不是数组格式:', sessions);
          sessions = [];
        }
        
        if (sessions.length > 0) {
          // 有会话，使用最新的（列表第一个）
          const latestSession = sessions[0];
          
          // 保存会话信息到全局
          app.globalData.currentSession = {
            id: latestSession.id,
            chatId: chatId
          };
          
          // 保存到本地存储
          wx.setStorageSync('currentSession', {
            id: latestSession.id,
            chatId: chatId
          });
          
          wx.hideLoading();
          
          // 跳转到聊天页面
          wx.switchTab({
            url: '/pages/chat/chat'
          });
        } else {
          // 没有会话，创建新的
          this.createChatSession(chatId);
        }
      })
      .catch(err => {
        console.error('获取会话列表失败:', err);
        // 失败时创建新的会话
        this.createChatSession(chatId);
      });
  },
  
  // 创建聊天助手
  createChatAssistant() {
    const app = getApp();
    
    const assistantData = {
      name: `Chat with ${this.data.knowledgeBase.name}`,
      description: `基于${this.data.knowledgeBase.name}的智能助手`,
      dataset_ids: [this.data.id],
      // 设置默认的LLM配置
      llm: {
        model_name: "deepseek-r1:1.5b@Ollama",
        temperature: 0.1,
        top_p: 0.3,
        max_tokens: 512,
        frequency_penalty: 0.7,
        presence_penalty: 0.4
      },
      // 设置默认的Prompt配置
      prompt: {
        opener: "你好！ 我是你的助理，有什么可以帮到你的吗？",
        prompt: "你是一个智能助手，请总结知识库的内容来回答问题，请列举知识库中的数据详细回答。当所有知识库内容都与问题无关时，你的回答必须包括\"知识库中未找到您要的答案！\"这句话。回答需要考虑聊天历史。\n        以下是知识库：\n        {knowledge}\n        以上是知识库。",
        variables: [
          {
            key: "knowledge",
            optional: false
          }
        ],
        similarity_threshold: 0.2,
        top_n: 8,
        keywords_similarity_weight: 0.7,
        empty_response: "",
        rerank_model: ""
      },
      language: "Chinese",
      do_refer: "1",
      prompt_type: "simple",
      top_k: 1024
    };
    
    chatAssistantApi.createAssistant(assistantData)
      .then(data => {
        const chatId = data.id;
        
        // 保存聊天助手ID
        app.globalData.chatAssistantId = chatId;
        
        // 保存到本地存储
        wx.setStorageSync('chatAssistantId', chatId);
        
        // 创建会话
        this.createChatSession(chatId);
      })
      .catch(err => {
        console.error('创建聊天助手失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '创建聊天失败',
          icon: 'none'
        });
      });
  },
  
  // 创建聊天会话
  createChatSession(chatId) {
    const app = getApp();
    
    const sessionData = {
      name: `${this.data.knowledgeBase.name} - ${new Date().toLocaleString()}`
    };
    
    sessionApi.createSession(chatId, sessionData)
      .then(data => {
        // 获取会话ID
        const sessionId = data.id;
        
        // 保存会话信息到全局
        app.globalData.currentSession = {
          id: sessionId,
          chatId: chatId
        };
        
        // 保存到本地存储
        wx.setStorageSync('currentSession', {
          id: sessionId,
          chatId: chatId
        });
        
        wx.hideLoading();
        
        // 跳转到聊天页面
        wx.switchTab({
          url: '/pages/chat/chat'
        });
      })
      .catch(err => {
        console.error('创建会话失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '创建会话失败',
          icon: 'none'
        });
      });
  },

  // 上传文档
  uploadDocument() {
    // 检查JWT认证状态
    const authCheck = this.checkJWTAuth();
    
    if (!authCheck.valid) {
      let message = '请先登录';
      if (authCheck.reason === 'expired' || authCheck.reason === 'jwt_expired') {
        message = 'JWT已过期，请重新登录';
      } else if (authCheck.reason === 'invalid_format') {
        message = 'JWT格式无效，请重新登录';
      } else if (authCheck.reason === 'error') {
        message = '认证信息已损坏，请重新登录';
      }
      
      wx.showModal({
        title: 'JWT认证失败',
        content: message,
        showCancel: false,
        confirmText: '重新登录',
        success: (res) => {
          if (res.confirm) {
            // 清除所有认证相关信息
            wx.removeStorageSync('wxJWT');
            wx.removeStorageSync('wxLoginCode');
            wx.removeStorageSync('wxLoginData');
            wx.removeStorageSync('loginTime');
            wx.removeStorageSync('userInfo');
            
            // 触发重新登录
            this.performReLogin()
              .then(() => {
                wx.showToast({
                  title: '登录成功，请重新上传',
                  icon: 'success'
                });
              })
              .catch(() => {
                wx.showToast({
                  title: '登录失败',
                  icon: 'none'
                });
              });
          }
        }
      });
      return;
    }
    
    console.log('=== 开始文档上传流程 ===');
    console.log('文档上传前JWT认证检查通过');
    
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0];
        
        console.log('=== 用户选择文件信息 ===');
        console.log('文件名:', file.name);
        console.log('文件大小:', file.size, '字节');
        console.log('文件路径:', file.path);
        console.log('文件类型:', file.type);
        
        // 显示上传进度对话框
        wx.showLoading({
          title: '准备上传...',
        });

        // 生成唯一文件ID
        const fileId = `file_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const fileName = file.name;
        const fileSize = file.size;
        
        // 确定分块大小和总分块数
        const chunkSize = 5 * 1024 * 1024; // 5MB
        const totalChunks = Math.ceil(fileSize / chunkSize);
        
        console.log('=== 文件分块信息 ===');
        console.log('文件ID:', fileId);
        console.log('文件名:', fileName);
        console.log('文件大小:', fileSize, '字节');
        console.log('分块大小:', chunkSize, '字节');
        console.log('总分块数:', totalChunks);
        console.log('知识库ID:', this.data.id);
        console.log('当前JWT状态:', authCheck.jwt ? '已获取' : '未获取');
        
        // 初始化上传
        console.log('=== 调用初始化上传接口 ===');
        api.uploadApi.initUpload({
          fileId,
          fileName,
          fileSize,
          totalChunks
        }).then(() => {
          console.log('=== 初始化上传成功 ===');
          console.log('开始分块上传，文件路径:', file.path);
          // 开始分块上传
          this.uploadChunks(file.path, fileId, chunkSize, totalChunks, this.data.id);
        }).catch(error => {
          console.error('=== 初始化上传失败 ===');
          console.error('错误详情:', error);
          console.error('错误消息:', error.message);
          
          // 检查是否是JWT过期错误
          if (error.message && (error.message.includes('登录') || error.message.includes('401') || error.message.includes('403') || error.message.includes('JWT'))) {
            // JWT过期，清除本地认证信息
            wx.removeStorageSync('wxJWT');
            wx.removeStorageSync('loginTime');
            
            wx.showModal({
              title: 'JWT已过期',
              content: '您的登录信息已过期，请重新登录后再上传文档',
              showCancel: false,
              confirmText: '重新登录',
              success: (res) => {
                if (res.confirm) {
                  // 跳转到登录页面或触发登录流程
                  this.performReLogin()
                    .then(() => {
                      wx.showToast({
                        title: '登录成功，请重新上传',
                        icon: 'success'
                      });
                    })
                    .catch(() => {
                      wx.showToast({
                        title: '登录失败',
                        icon: 'none'
                      });
                    });
                }
              }
            });
          } else {
            wx.showToast({
              title: '初始化上传失败',
              icon: 'none'
            });
          }
          wx.hideLoading();
        });
      },
      fail: (error) => {
        console.error('=== 选择文件失败 ===');
        console.error('错误详情:', error);
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 分块上传文件
  uploadChunks(filePath, fileId, chunkSize, totalChunks, kbId) {
    console.log('=== 开始分块上传流程 ===');
    console.log('分块上传参数:', {
      filePath: filePath,
      fileId: fileId,
      chunkSize: chunkSize,
      totalChunks: totalChunks,
      kbId: kbId
    });
    
    // 再次检查JWT认证状态，确保分块上传时JWT仍然有效
    const authCheck = this.checkJWTAuth();
    
    if (!authCheck.valid) {
      console.error('=== 分块上传JWT认证失败 ===');
      console.error('认证失败原因:', authCheck.reason);
      
      wx.hideLoading();
      let message = '认证信息无效，请重新登录';
      if (authCheck.reason === 'expired' || authCheck.reason === 'jwt_expired') {
        message = 'JWT已过期，请重新登录';
      } else if (authCheck.reason === 'invalid_format') {
        message = 'JWT格式无效，请重新登录';
      } else if (authCheck.reason === 'error') {
        message = '认证信息已损坏，请重新登录';
      }
      
      wx.showModal({
        title: 'JWT认证失败',
        content: message,
        showCancel: false,
        confirmText: '重新登录',
        success: (res) => {
          if (res.confirm) {
            // 清除所有认证相关信息
            wx.removeStorageSync('wxJWT');
            wx.removeStorageSync('wxLoginCode');
            wx.removeStorageSync('wxLoginData');
            wx.removeStorageSync('loginTime');
            wx.removeStorageSync('userInfo');
            
            // 触发重新登录
            this.performReLogin()
              .then(() => {
                wx.showToast({
                  title: '登录成功，请重新上传',
                  icon: 'success'
                });
              })
              .catch(() => {
                wx.showToast({
                  title: '登录失败',
                  icon: 'none'
                });
              });
          }
        }
      });
      return;
    }
    
    console.log('=== 分块上传JWT认证检查通过 ===');
    
    // 获取文件系统管理器
    const fs = wx.getFileSystemManager();
    
    try {
      // 获取文件状态并安全地获取文件大小
      console.log('=== 获取文件状态 ===');
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;
      console.log('文件实际大小:', fileSize, '字节');
      
      // 创建上传进度显示
      wx.showLoading({
        title: '上传中(0%)',
      });
      
      // 一次性读取整个文件到内存（对于小文件更高效）
      console.log('=== 读取完整文件到内存 ===');
      console.log('开始读取文件:', filePath);
      const fullFileData = fs.readFileSync(filePath);
      console.log('文件读取成功，数据大小:', fullFileData.byteLength, '字节');
      
      // 上传每个分块
      const uploadPromises = [];
      console.log('=== 开始创建和上传分块 ===');
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, fileSize);
        
        // 创建临时分块文件
        const tempChunkPath = `${wx.env.USER_DATA_PATH}/temp_chunk_${fileId}_${i}.dat`;
        
        console.log(`=== 处理分块 ${i + 1}/${totalChunks} ===`);
        console.log('分块范围:', `${start} - ${end} (${end - start} 字节)`);
        console.log('用户数据目录:', wx.env.USER_DATA_PATH);
        console.log('临时文件路径:', tempChunkPath);
        
        try {
          // 从内存中的完整文件数据中提取分块
          const chunkData = fullFileData.slice(start, end);
          console.log('分块数据提取成功，大小:', chunkData.byteLength, '字节');
          
          // 将分块数据写入临时文件
          fs.writeFileSync(tempChunkPath, chunkData);
          console.log('分块临时文件创建成功');
          
          // 验证临时文件
          try {
            const tempStats = fs.statSync(tempChunkPath);
            console.log('临时文件验证成功，大小:', tempStats.size, '字节');
          } catch (verifyError) {
            console.error('临时文件验证失败:', verifyError);
          }
          
          console.log(`创建分块 ${i + 1}/${totalChunks}，大小: ${chunkData.byteLength} 字节`);
          
          // 上传分块 - 现在传递临时文件路径
          const uploadPromise = api.uploadApi.uploadFile({
            fileId,
            chunkIndex: i,
            chunkFilePath: tempChunkPath, // 传递临时文件路径
            kbName: this.data.knowledgeBase.name || '', // 使用实际的知识库名称
            kbId
          }).then(() => {
            console.log(`=== 分块 ${i + 1}/${totalChunks} 上传成功 ===`);
            
            // 清理临时分块文件
            try {
              fs.unlinkSync(tempChunkPath);
              console.log('临时分块文件清理成功');
            } catch (cleanupError) {
              console.warn(`清理临时分块文件失败 ${tempChunkPath}:`, cleanupError);
            }
            
            // 更新进度
            const progress = Math.floor(((i + 1) / totalChunks) * 100);
            wx.showLoading({
              title: `上传中(${progress}%)`,
            });
            console.log(`分块 ${i + 1}/${totalChunks} 上传成功，进度: ${progress}%`);
            return i;
          }).catch(error => {
            console.error(`=== 分块 ${i + 1}/${totalChunks} 上传失败 ===`);
            console.error('上传错误详情:', error);
            console.error('错误消息:', error.message);
            
            // 清理临时分块文件
            try {
              fs.unlinkSync(tempChunkPath);
              console.log('失败后临时分块文件清理成功');
            } catch (cleanupError) {
              console.warn(`清理临时分块文件失败 ${tempChunkPath}:`, cleanupError);
            }
            
            // 如果是认证错误，直接终止所有上传
            if (error.message && (error.message.includes('登录') || error.message.includes('401') || error.message.includes('403') || error.message.includes('JWT'))) {
              // JWT过期，清除本地认证信息
              wx.removeStorageSync('wxJWT');
              wx.removeStorageSync('loginTime');
              throw new Error('JWT已过期，请重新登录');
            }
            throw error;
          });
          
          uploadPromises.push(uploadPromise);
        } catch (chunkError) {
          console.error(`=== 创建分块 ${i + 1} 失败 ===`);
          console.error('分块创建错误详情:', chunkError);
          console.error('错误消息:', chunkError.message);
          throw new Error(`创建分块 ${i + 1} 失败: ${chunkError.message}`);
        }
      }
      
      console.log('=== 等待所有分块上传完成 ===');
      console.log('总共创建了', uploadPromises.length, '个上传任务');
      
      // 所有分块上传完成后
      Promise.all(uploadPromises)
        .then(() => {
          console.log('=== 所有分块上传完成 ===');
          wx.hideLoading();
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
          
          // 重新加载文档列表
          console.log('=== 重新加载文档列表 ===');
          this.getDocuments(this.data.id);
          
          // 解析新上传的文档
          // 这里需要查询新上传的文档ID，暂时延迟1秒后刷新列表
          setTimeout(() => {
            console.log('=== 延迟刷新文档列表 ===');
            this.getDocuments(this.data.id);
          }, 1000);
        })
        .catch(error => {
          console.error('=== 分块上传整体失败 ===');
          console.error('整体上传错误详情:', error);
          console.error('错误消息:', error.message);
          
          wx.hideLoading();
          
          // 检查是否是认证错误
          if (error.message && (error.message.includes('认证') || error.message.includes('登录') || error.message.includes('JWT') || error.message.includes('401') || error.message.includes('403'))) {
            // JWT过期，清除本地认证信息
            wx.removeStorageSync('wxJWT');
            wx.removeStorageSync('loginTime');
            
            wx.showModal({
              title: 'JWT已过期',
              content: '您的登录信息已过期，请重新登录后再试',
              showCancel: false,
              confirmText: '重新登录',
              success: (res) => {
                if (res.confirm) {
                  // 触发重新登录
                  this.performReLogin()
                    .then(() => {
                      wx.showToast({
                        title: '登录成功，请重新上传',
                        icon: 'success'
                      });
                    })
                    .catch(() => {
                      wx.showToast({
                        title: '登录失败',
                        icon: 'none'
                      });
                    });
                }
              }
            });
          } else {
            // 显示具体的错误信息
            let errorMessage = '上传失败';
            if (error.message) {
              if (error.message.includes('S3存储桶配置错误')) {
                errorMessage = 'S3存储配置错误，请联系管理员';
              } else if (error.message.includes('存储桶名称配置错误')) {
                errorMessage = '存储配置错误，请联系管理员';
              } else {
                errorMessage = error.message;
              }
            }
            
            wx.showToast({
              title: errorMessage,
              icon: 'none',
              duration: 3000
            });
          }
        });
    } catch (error) {
      console.error('=== 获取文件状态失败 ===');
      console.error('文件状态错误详情:', error);
      console.error('错误消息:', error.message);
      
      wx.hideLoading();
      wx.showToast({
        title: '获取文件状态失败',
        icon: 'none'
      });
    }
  },
  
  // 解析文档
  parseDocument(documentId) {
    documentApi.parseDocument(this.data.id, [documentId])
      .then(() => {
        wx.showToast({
          title: '开始解析文档',
          icon: 'success'
        });
      })
      .catch(err => {
        console.error('请求解析文档失败:', err);
      });
  },

  // 编辑文档
  editDocument(e) {
    const docId = e.currentTarget.dataset.id;
    const docIndex = this.data.documents.findIndex(doc => doc.id === docId);
    
    if (docIndex !== -1) {
      const doc = this.data.documents[docIndex];
      this.setData({
        editingDocument: { ...doc },
        editingDocIndex: docIndex,
        showEditDialog: true
      });
    }
  },

  // 关闭编辑对话框
  closeEditDialog() {
    this.setData({
      showEditDialog: false,
      editingDocument: null,
      editingDocIndex: -1
    });
  },

  // 文档名称修改事件
  onDocNameChange(e) {
    if (this.data.editingDocument) {
      this.setData({
        'editingDocument.name': e.detail.value
      });
    }
  },

  // 确认编辑文档
  confirmEditDocument() {
    const { editingDocument, editingDocIndex, documents, id } = this.data;
    
    if (editingDocument && editingDocIndex !== -1) {
      wx.showLoading({ title: '更新中...' });
      
      const updateData = {
        name: editingDocument.name
      };
      
      documentApi.updateDocument(id, editingDocument.id, updateData)
        .then(() => {
          // 深拷贝文档数组
          const updatedDocs = [...documents];
          updatedDocs[editingDocIndex] = {
            ...updatedDocs[editingDocIndex],
            name: editingDocument.name,
          };
          
          this.setData({
            documents: updatedDocs,
            showEditDialog: false,
            editingDocument: null,
            editingDocIndex: -1
          });
          
          wx.showToast({
            title: '编辑成功',
            icon: 'success'
          });
        })
        .catch(err => {
          console.error('更新文档失败:', err);
        })
        .finally(() => {
          wx.hideLoading();
        });
    }
  },

  // 删除文档
  deleteDocument(e) {
    const docId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该文档吗？删除后无法恢复。',
      confirmColor: '#FF0000',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          documentApi.deleteDocument(this.data.id, [docId])
            .then(() => {
              const updatedDocs = this.data.documents.filter(doc => doc.id !== docId);
              this.setData({
                documents: updatedDocs,
                totalDocs: Math.max(0, this.data.totalDocs - 1)
              });
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            })
            .catch(err => {
              console.error('删除文档失败:', err);
            })
            .finally(() => {
              wx.hideLoading();
            });
        }
      }
    });
  },
  
  // 查看所有文档
  viewAllDocuments() {
    // 重新加载文档列表的第一页
    this.getDocuments(this.data.id);
  },
  
  // 格式化文件大小
  formatFileSize(sizeInBytes) {
    if (sizeInBytes < 1024) {
      return sizeInBytes + 'B';
    } else if (sizeInBytes < 1024 * 1024) {
      return (sizeInBytes / 1024).toFixed(1) + 'KB';
    } else if (sizeInBytes < 1024 * 1024 * 1024) {
      return (sizeInBytes / (1024 * 1024)).toFixed(1) + 'MB';
    } else {
      return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
    }
  },
  
  // 根据文件名获取文件类型
  getFileType(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ext;
  },
  
  // 格式化日期为中文格式
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
        const time = parts[4];
        
        // 创建iOS支持的日期格式 "YYYY-MM-DD HH:MM:SS"
        const formattedDateStr = `${year}-${month}-${day} ${time}`;
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
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
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

  // 显示配置详情对话框
  showConfigDetail() {
    if (!this.data.knowledgeBase.parser_config) {
      wx.showToast({
        title: '暂无配置详情',
        icon: 'none'
      });
      return;
    }
    
    // 转换配置对象为列表项
    const configItems = this.formatConfigToItems(this.data.knowledgeBase.parser_config);
    
    this.setData({
      configDetailItems: configItems,
      showConfigDetailDialog: true
    });
  },
  
  // 关闭配置详情对话框
  closeConfigDetail() {
    this.setData({
      showConfigDetailDialog: false
    });
  },
  
  // 将解析器配置对象转换为列表项
  formatConfigToItems(config) {
    if (!config) return [];
    
    const items = [];
    
    const formatValue = (value) => {
      if (value === null || value === undefined) return '无';
      if (typeof value === 'boolean') return value ? '是' : '否';
      if (typeof value === 'object') return JSON.stringify(value, null, 2);
      return String(value);
    };
    
    // 添加常规配置字段
    const labelMap = {
      chunk_token_num: '分块大小(tokens)',
      delimiter: '分隔符',
      html4excel: 'Excel转HTML',
      layout_recognize: '布局识别',
      auto_keywords: '自动关键词数量',
      auto_questions: '自动问题数量',
      task_page_size: 'PDF任务页面大小'
    };
    
    for (const key in config) {
      // 跳过复杂对象单独处理
      if (key === 'raptor' || key === 'graphrag' || key === 'tag_kb_ids') continue;
      
      items.push({
        key,
        label: labelMap[key] || key,
        value: formatValue(config[key])
      });
    }
    
    // 添加raptor配置
    if (config.raptor) {
      items.push({
        key: 'raptor',
        label: 'RAPTOR设置',
        value: formatValue(config.raptor)
      });
    }
    
    // 添加graphrag配置
    if (config.graphrag) {
      items.push({
        key: 'graphrag',
        label: 'GRAPHRAG设置',
        value: formatValue(config.graphrag)
      });
    }
    
    // 添加标签集IDs
    if (config.tag_kb_ids && config.tag_kb_ids.length) {
      items.push({
        key: 'tag_kb_ids',
        label: '标签集IDs',
        value: formatValue(config.tag_kb_ids)
      });
    }
    
    return items;
  }
});