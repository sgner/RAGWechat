// pages/home/home.ts
Page({
  data: {
    apiBaseUrl: 'http://localhost/api/v1', // 替换为实际的API地址
    knowledgeBases: [] as IKnowledgeBase[],
    // 加载状态
    loading: true,
    loadingMore: false,
    currentPage: 1,
    pageSize: 30,
    hasMore: true,
    // 添加知识库相关数据
    showAddDialog: false,
    newKnowledgeBase: {
      name: '',
      description: '',
      tags: [] as string[],
      embedding_model: 'BAAI/bge-large-zh-v1.5@BAAI',
      chunk_method: 'naive',
      parser_config: {
        chunk_token_num: 128,
        delimiter: "\\n",
        html4excel: false,
        layout_recognize: "DeepDOC",
        raptor: {
          use_raptor: false
        }
      }
    },
    inputTag: '',
    // 编辑知识库相关数据
    showEditDialog: false,
    editingKnowledgeBase: {
      id: '',
      name: '',
      description: '',
      createTime: '',
      updateTime: '',
      docsCount: 0,
      tags: [] as string[],
      embedding_model: 'BAAI/bge-large-zh-v1.5@BAAI',
      chunk_method: 'naive',
      parser_config: {
        chunk_token_num: 128,
        delimiter: "\\n",
        html4excel: false,
        layout_recognize: "DeepDOC",
        raptor: {
          use_raptor: false
        }
      }
    },
    editInputTag: '',
    // 删除知识库相关数据
    showDeleteDialog: false,
    deletingKnowledgeBaseId: '',
    // 标签选择器
    tagOptions: ['技术', '开发', '产品', '设计', '文档', '学习', '工具', '微信'],
    showTagPicker: false,
    // 嵌入模型选项
    embeddingModelOptions: [
      { label: '默认嵌入模型', value: 'BAAI/bge-large-zh-v1.5@BAAI' }
    ],
    // 分块方法选项
    chunkMethodOptions: [
      { label: '通用', value: 'naive' },
      { label: '书籍', value: 'book' },
      { label: '邮件', value: 'email' },
      { label: '法律文件', value: 'laws' },
      { label: '手册', value: 'manual' },
      { label: '单页', value: 'one' },
      { label: '论文', value: 'paper' },
      { label: '图片', value: 'picture' },
      { label: '演示文稿', value: 'presentation' },
      { label: '问答', value: 'qa' },
      { label: '表格', value: 'table' },
      { label: '标签', value: 'tag' }
    ]
  },

  onLoad() {
    // 获取知识库列表
    this.getKnowledgeBases(true);
    
    // 监听来自聊天页面的事件
    const eventChannel = this.getOpenerEventChannel();
    if (eventChannel) {
      eventChannel.on('openAddKnowledgeBase', () => {
        this.onAddKnowledgeBase();
      });
    }
  },
  
  onPullDownRefresh() {
    // 下拉刷新
    this.refreshKnowledgeBases();
  },

  // 下拉刷新数据
  refreshKnowledgeBases() {
    this.setData({
      currentPage: 1,
      hasMore: true
    }, () => {
      this.getKnowledgeBases(true);
    });
  },

  // 加载更多数据
  loadMoreKnowledgeBases() {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }

    this.setData({
      loadingMore: true,
      currentPage: this.data.currentPage + 1
    }, () => {
      this.getKnowledgeBases(false);
    });
  },

  // 跳转到知识库详情页
  goToDetail(e: WechatMiniprogram.BaseEvent) {
    const { id } = e.currentTarget.dataset;
    const knowledgeBase = this.data.knowledgeBases.find((item) => item.id === id);
    
    // 将选择的知识库信息保存到全局数据
    const app = getApp<IAppOption>();
    app.globalData.currentKnowledgeBase = knowledgeBase;
    
    wx.navigateTo({
      url: `/pages/knowledge-detail/knowledge-detail?id=${id}`
    });
  },

  // 跳转到对话页面
  goToChat() {
    wx.switchTab({
      url: '/pages/chat/chat'
    });
  },

  // 添加知识库 - 打开对话框
  onAddKnowledgeBase() {
    this.setData({
      showAddDialog: true,
      newKnowledgeBase: {
        name: '',
        description: '',
        tags: [],
        embedding_model: 'BAAI/bge-large-zh-v1.5@BAAI',
        chunk_method: 'naive',
        parser_config: {
          chunk_token_num: 128,
          delimiter: "\\n",
          html4excel: false,
          layout_recognize: "DeepDOC",
          raptor: {
            use_raptor: false
          }
        }
      },
      inputTag: ''
    });
  },

  // 处理输入变化
  onInputChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`newKnowledgeBase.${field}`]: value
    });
  },

  // 处理标签输入
  onTagInputChange(e: any) {
    this.setData({
      inputTag: e.detail.value
    });
  },

  // 添加标签
  addTag() {
    const { inputTag, newKnowledgeBase } = this.data;
    if (inputTag && !newKnowledgeBase.tags.includes(inputTag)) {
      this.setData({
        'newKnowledgeBase.tags': [...newKnowledgeBase.tags, inputTag],
        'inputTag': ''
      });
    }
  },

  // 从选项添加标签
  addTagFromOption(e: any) {
    const { tag } = e.currentTarget.dataset;
    const { newKnowledgeBase } = this.data;
    
    if (!newKnowledgeBase.tags.includes(tag)) {
      this.setData({
        'newKnowledgeBase.tags': [...newKnowledgeBase.tags, tag],
        'showTagPicker': false
      });
    }
  },

  // 显示标签选择器
  toggleTagPicker() {
    this.setData({
      showTagPicker: !this.data.showTagPicker
    });
  },

  // 移除标签
  removeTag(e: any) {
    const { index } = e.currentTarget.dataset;
    const { newKnowledgeBase } = this.data;
    
    const updatedTags = [...newKnowledgeBase.tags];
    updatedTags.splice(index, 1);
    
    this.setData({
      'newKnowledgeBase.tags': updatedTags
    });
  },

  // 处理解析器配置变化
  onParserConfigChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`newKnowledgeBase.parser_config.${field}`]: value
    });
  },
  
  // 处理解析器配置复选框变化
  onParserConfigCheckChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`newKnowledgeBase.parser_config.${field}`]: value
    });
  },

  // 确认添加知识库
  confirmAdd() {
    const { newKnowledgeBase } = this.data;
    
    // 验证表单
    if (!newKnowledgeBase.name) {
      wx.showToast({
        title: '请输入知识库名称',
        icon: 'none'
      });
      return;
    }
    
    if (!newKnowledgeBase.embedding_model) {
      wx.showToast({
        title: '请选择嵌入模型',
        icon: 'none'
      });
      return;
    }
    
    if (!newKnowledgeBase.chunk_method) {
      wx.showToast({
        title: '请选择分块方法',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '创建中...' });
    
    // 构建API请求数据
    const requestData = {
      name: newKnowledgeBase.name,
      description: newKnowledgeBase.description,
      embedding_model: newKnowledgeBase.embedding_model,
      chunk_method: newKnowledgeBase.chunk_method,
      parser_config: newKnowledgeBase.parser_config
    };
    
    // 调用API创建知识库
    wx.request({
      url: `${this.data.apiBaseUrl}/datasets`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: requestData,
      success: (res: any) => {
        wx.hideLoading();
        
        if (res.data && res.data.code === 0) {
          wx.showToast({
            title: '创建成功',
            icon: 'success'
          });
          
          // 关闭对话框并刷新列表
          this.setData({
            showAddDialog: false
          });
          this.refreshKnowledgeBases();
        } else {
          wx.showToast({
            title: res.data.message || '创建失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('创建知识库失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 取消添加
  cancelAdd() {
    this.setData({
      showAddDialog: false
    });
  },
  
  // 编辑知识库 - 打开对话框
  onEditKnowledgeBase(e: WechatMiniprogram.BaseEvent) {
    const { id } = e.currentTarget.dataset;
    const knowledgeBase = this.data.knowledgeBases.find((item) => item.id === id);
    
    if (knowledgeBase) {
      // 确保有parser_config对象
      const parser_config = knowledgeBase.parser_config || {
        chunk_token_num: 128,
        delimiter: "\\n",
        html4excel: false,
        layout_recognize: "DeepDOC",
        raptor: {
          use_raptor: false
        }
      };
      
      this.setData({
        showEditDialog: true,
        editingKnowledgeBase: {
          ...knowledgeBase,
          tags: knowledgeBase.tags || [],
          embedding_model: knowledgeBase.embedding_model || 'BAAI/bge-large-zh-v1.5@BAAI',
          chunk_method: knowledgeBase.chunk_method || 'naive',
          parser_config
        }
      });
    }
  },
  
  // 编辑知识库 - 处理输入变化
  onEditInputChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`editingKnowledgeBase.${field}`]: value
    });
  },
  
  // 编辑知识库 - 处理标签输入
  onEditTagInputChange(e: any) {
    this.setData({
      editInputTag: e.detail.value
    });
  },
  
  // 编辑知识库 - 添加标签
  addEditTag() {
    const { editInputTag, editingKnowledgeBase } = this.data;
    if (editInputTag && !editingKnowledgeBase.tags.includes(editInputTag)) {
      this.setData({
        'editingKnowledgeBase.tags': [...editingKnowledgeBase.tags, editInputTag],
        'editInputTag': ''
      });
    }
  },
  
  // 编辑知识库 - 从选项添加标签
  addEditTagFromOption(e: any) {
    const { tag } = e.currentTarget.dataset;
    const { editingKnowledgeBase } = this.data;
    
    if (!editingKnowledgeBase.tags.includes(tag)) {
      this.setData({
        'editingKnowledgeBase.tags': [...editingKnowledgeBase.tags, tag],
        'showTagPicker': false
      });
    }
  },
  
  // 编辑知识库 - 移除标签
  removeEditTag(e: any) {
    const { index } = e.currentTarget.dataset;
    const { editingKnowledgeBase } = this.data;
    
    const updatedTags = [...editingKnowledgeBase.tags];
    updatedTags.splice(index, 1);
    
    this.setData({
      'editingKnowledgeBase.tags': updatedTags
    });
  },
  
  // 处理编辑时解析器配置变化
  onEditParserConfigChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`editingKnowledgeBase.parser_config.${field}`]: value
    });
  },
  
  // 处理编辑时解析器配置复选框变化
  onEditParserConfigCheckChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`editingKnowledgeBase.parser_config.${field}`]: value
    });
  },
  
  // 确认编辑知识库
  confirmEdit() {
    const { editingKnowledgeBase } = this.data;
    
    // 验证表单
    if (!editingKnowledgeBase.name) {
      wx.showToast({
        title: '请输入知识库名称',
        icon: 'none'
      });
      return;
    }
    
    if (!editingKnowledgeBase.embedding_model) {
      wx.showToast({
        title: '请选择嵌入模型',
        icon: 'none'
      });
      return;
    }
    
    if (!editingKnowledgeBase.chunk_method) {
      wx.showToast({
        title: '请选择分块方法',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '更新中...' });
    
    // 构建API请求数据
    const requestData = {
      name: editingKnowledgeBase.name,
      description: editingKnowledgeBase.description,
      embedding_model: editingKnowledgeBase.embedding_model,
      chunk_method: editingKnowledgeBase.chunk_method,
      parser_config: editingKnowledgeBase.parser_config
    };
    
    // 调用API更新知识库
    wx.request({
      url: `${this.data.apiBaseUrl}/datasets/${editingKnowledgeBase.id}`,
      method: 'PUT',
      header: {
        'Content-Type': 'application/json'
      },
      data: requestData,
      success: (res: any) => {
        wx.hideLoading();
        
        if (res.data && res.data.code === 0) {
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
          
          // 更新本地数据
          const updatedKnowledgeBases = this.data.knowledgeBases.map(kb => {
            if (kb.id === editingKnowledgeBase.id) {
              return {
                ...kb,
                name: editingKnowledgeBase.name,
                description: editingKnowledgeBase.description,
                tags: editingKnowledgeBase.tags,
                embedding_model: editingKnowledgeBase.embedding_model,
                chunk_method: editingKnowledgeBase.chunk_method,
                updateTime: new Date().toISOString().split('T')[0]
              };
            }
            return kb;
          });
          
          this.setData({
            knowledgeBases: updatedKnowledgeBases,
            showEditDialog: false
          });
        } else {
          wx.showToast({
            title: res.data.message || '更新失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('更新知识库失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 取消编辑
  cancelEdit() {
    this.setData({
      showEditDialog: false
    });
  },
  
  // 删除知识库 - 打开对话框
  onDeleteKnowledgeBase(e: WechatMiniprogram.BaseEvent) {
    const { id } = e.currentTarget.dataset;
    const knowledgeBase = this.data.knowledgeBases.find((item) => item.id === id);
    
    if (knowledgeBase) {
      this.setData({
        showDeleteDialog: true,
        deletingKnowledgeBaseId: id
      });
    }
  },
  
  // 确认删除知识库
  confirmDelete() {
    const { deletingKnowledgeBaseId } = this.data;
    
    wx.showLoading({ title: '删除中...' });
    
    // 调用API删除知识库
    wx.request({
      url: `${this.data.apiBaseUrl}/datasets`,
      method: 'DELETE',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        ids: [deletingKnowledgeBaseId]
      },
      success: (res: any) => {
        wx.hideLoading();
        
        if (res.data && res.data.code === 0) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          // 更新本地数据
          const updatedKnowledgeBases = this.data.knowledgeBases.filter(
            kb => kb.id !== deletingKnowledgeBaseId
          );
          
          this.setData({
            knowledgeBases: updatedKnowledgeBases,
            showDeleteDialog: false
          });
        } else {
          wx.showToast({
            title: res.data.message || '删除失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('删除知识库失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 取消删除
  cancelDelete() {
    this.setData({
      showDeleteDialog: false
    });
  },
  
  // 获取知识库列表
  getKnowledgeBases(refresh = false) {
    const { currentPage, pageSize, knowledgeBases } = this.data;
    
    if (refresh) {
      this.setData({ loading: true });
      wx.stopPullDownRefresh();
    }
    
    wx.request({
      url: `${this.data.apiBaseUrl}/datasets?page=${currentPage}&page_size=${pageSize}&orderby=update_time&desc=true`,
      method: 'GET',
      success: (res: any) => {
        if (res.data && res.data.code === 0) {
          const datasets = res.data.data || [];
          
          // 转换API数据格式为应用所需格式
          const formattedDatasets = datasets.map((dataset: any) => ({
            id: dataset.id,
            name: dataset.name,
            description: dataset.description || '',
            createTime: dataset.create_date,
            updateTime: dataset.update_date,
            docsCount: dataset.document_count,
            tags: dataset.parser_config && dataset.parser_config.tag_kb_ids ? 
                 dataset.parser_config.tag_kb_ids : [],
            embedding_model: dataset.embedding_model,
            chunk_method: dataset.chunk_method
          }));
          
          // 如果是刷新，直接替换数据；否则追加
          this.setData({
            knowledgeBases: refresh ? formattedDatasets : [...knowledgeBases, ...formattedDatasets],
            hasMore: formattedDatasets.length >= pageSize,
            loadingMore: false,
            loading: false
          });
        } else {
          this.setData({
            loadingMore: false,
            loading: false,
            hasMore: false
          });
          
          if (res.data && res.data.code !== 0) {
            wx.showToast({
              title: res.data.message || '获取数据失败',
              icon: 'none'
            });
          }
        }
      },
      fail: (err) => {
        console.error('获取知识库列表失败:', err);
        this.setData({
          loadingMore: false,
          loading: false
        });
        
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 获取嵌入模型显示名称
  getEmbeddingModelLabel(value: string): string {
    if (!value) return '请选择嵌入模型';
    
    const option = this.data.embeddingModelOptions.find(item => item.value === value);
    return option ? option.label : value;
  },
  
  // 获取分块方法显示名称
  getChunkMethodLabel(value: string): string {
    if (!value) return '请选择分块方法';
    
    const option = this.data.chunkMethodOptions.find(item => item.value === value);
    return option ? option.label : value;
  }
}); 