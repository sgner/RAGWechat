import api from '../../utils/api';

Page({
  data: {
    id: '',
    knowledgeBase: {} as IKnowledgeBase,
    documents: [] as IDocument[],
    showEditDialog: false,
    editingDocument: {} as IDocument | null,
    editingDocIndex: -1,
    apiBaseUrl: 'http://your-ragflow-api-url/api/v1', // 替换为实际的API地址
    loading: false,
    pageNum: 1,
    pageSize: 30,
    totalDocs: 0,
    hasMore: true,
    showConfigDetailDialog: false,
    configDetailItems: [] as Array<{key: string, label: string, value: string}>
  },

  onLoad(options: Record<string, string>) {
    const { id } = options;
    this.setData({ id });
    
    // 获取知识库详情
      this.getKnowledgeBaseById(id);
    
    // 获取文档列表
    this.getDocuments(id);
  },
  
  // 根据ID获取知识库详情
  getKnowledgeBaseById(id: string) {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });
    
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
                 dataset.parser_config.tag_kb_ids : []
          };
          
          this.setData({ knowledgeBase });
          
          // 将当前知识库信息保存到全局
          const app = getApp<IAppOption>();
          app.globalData.currentKnowledgeBase = knowledgeBase;
        } else {
          wx.showToast({
            title: res.data.message || '获取知识库失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取知识库详情失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
      wx.hideLoading();
      }
    });
  },
  
  // 获取知识库下的文档列表
  getDocuments(datasetId: string, page: number = 1, replace: boolean = true) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    if (page === 1) {
      wx.showLoading({ title: '加载中...' });
    }
    
    wx.request({
      url: `${this.data.apiBaseUrl}/ragflow/api/v1/list/document/${datasetId}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        page: page,
        page_size: this.data.pageSize,
        orderby: 'update_time',
        desc: true
      },
      success: (res: any) => {
        console.log('文档列表响应:', res.data);
        
        // 支持两种响应格式：直接返回数据或嵌套在code=20000的格式中
        let responseData = res.data;
        if (responseData && responseData.code === 20000 && responseData.data) {
          responseData = responseData.data;
        }
        
        if (responseData && (responseData.code === 0 || responseData.code === '0') && responseData.data) {
          const docsData = responseData.data;
          const docs = docsData.docs.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            size: this.formatFileSize(doc.size || 0),
            type: this.getFileType(doc.name),
            createTime: doc.create_date,
            updateTime: doc.update_date,
            status: doc.run || 'UNKNOWN',
            progress: doc.progress || 0,
            progressPercent: Math.round((doc.progress || 0) * 100),
            chunkCount: doc.chunk_count || 0,
            tokenCount: doc.token_count || 0,
            processMsg: doc.progress_msg || '',
            chunkMethod: doc.chunk_method || 'naive',
            location: doc.location || '',
            thumbnail: doc.thumbnail || ''
          }));
          
      this.setData({
            documents: replace ? docs : [...this.data.documents, ...docs],
            totalDocs: docsData.total,
            pageNum: page,
            hasMore: docs.length >= this.data.pageSize && (page * this.data.pageSize) < docsData.total
          });
        } else {
          const errorMsg = responseData?.message || '获取文档列表失败';
          console.error('获取文档列表失败:', errorMsg);
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取文档列表失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
        if (page === 1) {
          wx.hideLoading();
        }
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
    const app = getApp<IAppOption>();
    app.globalData.currentKnowledgeBase = this.data.knowledgeBase;
    
    wx.showLoading({ title: '准备中...' });
    
    // 先检查是否已有基于当前知识库的助手
    wx.request({
      url: `${this.data.apiBaseUrl}/ragflow/api/v1/list/assistant`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        page: 1,
        page_size: 10
      },
      success: (res: any) => {
        // 支持两种响应格式：直接返回数据或嵌套在code=20000的格式中
        let responseData = res.data;
        if (responseData && responseData.code === 20000 && responseData.data) {
          responseData = responseData.data;
        }
        
        if (responseData && (responseData.code === 0 || responseData.code === '0') && responseData.data) {
          const assistants = responseData.data.assistants || [];
          
          // 查找是否有使用当前知识库的助手
          const currentKbAssistant = assistants.find((assistant: any) => 
            assistant.dataset_ids && 
            assistant.dataset_ids.includes(this.data.id)
          );
          
          if (currentKbAssistant) {
            // 有现成的助手，使用它创建会话
            this.createSessionWithExistingChat(currentKbAssistant.id);
          } else {
            // 没有找到，创建新的聊天助手
            this.createChatAssistant();
          }
        } else {
          // 响应错误，创建新的聊天助手
          this.createChatAssistant();
        }
      },
      fail: (err) => {
        console.error('获取聊天助手失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 创建聊天助手
  createChatAssistant() {
    wx.request({
      url: `${this.data.apiBaseUrl}/ragflow/api/v1/create/assistant`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        name: `Chat with ${this.data.knowledgeBase.name}`,
        dataset_ids: [this.data.id],
        llm: {
          model_name: "deepseek-chat",
          temperature: 0.7,
          top_p: 0.8,
          max_token: 2000
        },
        prompt: {
          top_k: 3,
          similarity_threshold: 0.7,
          show_quote: true
        }
      },
      success: (res: any) => {
        // 支持两种响应格式：直接返回数据或嵌套在code=20000的格式中
        let responseData = res.data;
        if (responseData && responseData.code === 20000 && responseData.data) {
          responseData = responseData.data;
        }
        
        if (responseData && (responseData.code === 0 || responseData.code === '0')) {
          const chatId = responseData.data.id;
          
          // 保存聊天助手ID
          const app = getApp<IAppOption>();
          app.globalData.chatAssistantId = chatId;
          
          // 保存到本地存储
          wx.setStorageSync('chatAssistantId', chatId);
          
          // 创建新会话
          this.createSessionWithExistingChat(chatId);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: responseData?.message || '创建聊天助手失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('创建聊天助手失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 使用现有聊天助手创建会话
  createSessionWithExistingChat(chatId: string) {
    wx.request({
      url: `${this.data.apiBaseUrl}/ragflow/api/v1/create/session/${chatId}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        name: `${this.data.knowledgeBase.name} - ${new Date().toLocaleString()}`
      },
      success: (res: any) => {
        wx.hideLoading();
        
        // 支持两种响应格式：直接返回数据或嵌套在code=20000的格式中
        let responseData = res.data;
        if (responseData && responseData.code === 20000 && responseData.data) {
          responseData = responseData.data;
        }
        
        if (responseData && (responseData.code === 0 || responseData.code === '0')) {
          // 保存会话信息
          const sessionId = responseData.data.id;
          
          const app = getApp<IAppOption>();
          app.globalData.currentSession = {
            id: sessionId,
            chatId: chatId
          };
          
          // 保存到本地存储
          wx.setStorageSync('currentSession', {
            id: sessionId,
            chatId: chatId
          });
          
          // 跳转到聊天页面
          wx.switchTab({
            url: '/pages/chat/chat'
          });
        } else {
          wx.showToast({
            title: responseData?.message || '创建会话失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('创建会话失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 上传文档
  uploadDocument() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0];
        
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
        
        // 初始化上传
        api.uploadApi.initUpload({
          fileId,
          fileName,
          fileSize,
          totalChunks
        }).then(() => {
          // 开始分块上传
          this.uploadChunks(file.path, fileId, chunkSize, totalChunks, this.data.id);
        }).catch(error => {
          console.error('初始化上传失败:', error);
          wx.hideLoading();
          wx.showToast({
            title: '初始化上传失败',
            icon: 'none'
          });
        });
      }
    });
  },
  
  // 分块上传文件
  uploadChunks(filePath: string, fileId: string, chunkSize: number, totalChunks: number, kbId: string) {
    // 先获取已上传的分块
    api.uploadApi.getChunks(fileId).then(uploadedChunks => {
      const uploadedIndices = new Set(uploadedChunks || []);
      
      // 读取文件
      const fs = wx.getFileSystemManager();
      
      try {
        // 获取文件状态并安全地获取文件大小
        const fileStats = fs.statSync(filePath) as WechatMiniprogram.Stats;
        const fileSize = fileStats.size;
        
        // 创建上传进度显示
        wx.showLoading({
          title: '上传中(0%)',
        });
        
        // 上传每个分块
        const uploadPromises = [];
        for (let i = 0; i < totalChunks; i++) {
          // 如果分块已上传，跳过
          if (uploadedIndices.has(i)) {
            continue;
          }
          
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, fileSize);
          
          // 读取分块数据
          const chunkData = fs.readFileSync(filePath, 'base64', start, end - start);
          
          // 上传分块
          const uploadPromise = api.uploadApi.uploadFile({
            fileId,
            chunkIndex: i,
            chunk: chunkData,
            kbName: this.data.knowledgeBase?.name || '',
            kbId
          }).then(() => {
            // 更新进度
            const progress = Math.floor(((i + 1) / totalChunks) * 100);
            wx.showLoading({
              title: `上传中(${progress}%)`,
            });
            return i;
          });
          
          uploadPromises.push(uploadPromise);
        }
        
        // 所有分块上传完成后
        Promise.all(uploadPromises)
          .then(() => {
            wx.hideLoading();
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            });
            
            // 重新加载文档列表
            this.getDocuments(this.data.id);
            
            // 解析新上传的文档
            // 这里需要查询新上传的文档ID，暂时延迟1秒后刷新列表
            setTimeout(() => {
              this.getDocuments(this.data.id);
            }, 1000);
          })
          .catch(error => {
            console.error('分块上传失败:', error);
            wx.hideLoading();
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            });
          });
      } catch (error) {
        console.error('获取文件状态失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '获取文件状态失败',
          icon: 'none'
        });
      }
    }).catch(error => {
      console.error('获取已上传分块失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '获取已上传分块失败',
        icon: 'none'
      });
    });
  },
  
  // 解析文档
  parseDocument(documentId: string) {
    wx.showLoading({ title: '准备解析...' });
    
    wx.request({
      url: `${this.data.apiBaseUrl}/ragflow/api/v1/parse/document/${this.data.id}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        document_ids: [documentId]
      },
      success: (res: any) => {
        // 支持两种响应格式：直接返回数据或嵌套在code=20000的格式中
        let responseData = res.data;
        if (responseData && responseData.code === 20000 && responseData.data) {
          responseData = responseData.data;
        }
        
        if (responseData && (responseData.code === 0 || responseData.code === '0')) {
          wx.showToast({
            title: '开始解析文档',
            icon: 'success'
          });
          
          // 短暂延迟后刷新文档列表，以显示进度
          setTimeout(() => {
            this.getDocuments(this.data.id);
          }, 2000);
        } else {
          const errorMsg = responseData?.message || '解析文档请求失败';
          console.error('解析文档失败:', errorMsg);
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('请求解析文档失败:', err);
    wx.showToast({
          title: '网络错误，请重试',
      icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 编辑文档
  editDocument(e: WechatMiniprogram.BaseEvent) {
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
  onDocNameChange(e: any) {
    if (this.data.editingDocument) {
      this.setData({
        'editingDocument.name': e.detail.value
      });
    }
  },

  // 确认编辑文档
  confirmEditDocument() {
    const { editingDocument, editingDocIndex, documents } = this.data;
    
    if (editingDocument && editingDocIndex !== -1) {
      wx.showLoading({ title: '更新中...' });
      
      wx.request({
        url: `${this.data.apiBaseUrl}/datasets/${this.data.id}/documents/${editingDocument.id}`,
        method: 'PUT',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          name: editingDocument.name
        },
        success: (res: any) => {
          if (res.data && res.data.code === 0) {
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
          } else {
            wx.showToast({
              title: res.data.message || '更新失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          console.error('更新文档失败:', err);
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    }
  },

  // 删除文档
  deleteDocument(e: WechatMiniprogram.BaseEvent) {
    const docId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该文档吗？删除后无法恢复。',
      confirmColor: '#FF0000',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          wx.request({
            url: `${this.data.apiBaseUrl}/ragflow/api/v1/delete/document/${this.data.id}`,
            method: 'DELETE',
            header: {
              'Content-Type': 'application/json'
            },
            data: {
              ids: [docId]
            },
            success: (res: any) => {
              // 支持两种响应格式：直接返回数据或嵌套在code=20000的格式中
              let responseData = res.data;
              if (responseData && responseData.code === 20000 && responseData.data) {
                responseData = responseData.data;
              }
              
              if (responseData && (responseData.code === 0 || responseData.code === '0')) {
                const updatedDocs = this.data.documents.filter(doc => doc.id !== docId);
                this.setData({
                  documents: updatedDocs,
                  totalDocs: Math.max(0, this.data.totalDocs - 1)
                });
                
          wx.showToast({
            title: '删除成功',
                  icon: 'success'
                });
              } else {
                const errorMsg = responseData?.message || '删除失败';
                console.error('删除文档失败:', errorMsg);
                wx.showToast({
                  title: errorMsg,
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              console.error('删除文档失败:', err);
              wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              });
            },
            complete: () => {
              wx.hideLoading();
            }
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
  formatFileSize(sizeInBytes: number): string {
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
  getFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ext;
  },
  
  // 格式化日期
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
  formatConfigToItems(config: any) {
    if (!config) return [];
    
    const items: Array<{key: string, label: string, value: string}> = [];
    
    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return '无';
      if (typeof value === 'boolean') return value ? '是' : '否';
      if (typeof value === 'object') return JSON.stringify(value, null, 2);
      return String(value);
    };
    
    // 添加常规配置字段
    const labelMap: Record<string, string> = {
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