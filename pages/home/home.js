// pages/home/home.js
import { datasetApi, wxLoginApi } from '../../utils/api.js';

Page({
  data: {
    knowledgeBases: [],
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
    editInputTag: '',
    // 删除知识库相关数据
    showDeleteDialog: false,
    deletingKnowledgeBaseId: '',
    // 标签选择器
    tagOptions: ['技术', '开发', '产品', '设计', '文档', '学习', '工具', '微信'],
    showTagPicker: false,
    // 嵌入模型选项
    embeddingModelOptions: [
      { label: 'BGE-中文大模型', value: 'BAAI/bge-large-zh-v1.5@BAAI' },
      { label: 'BGE-多语言模型', value: 'BAAI/bge-large-en-v1.5@BAAI' },
      { label: 'M3E-文本嵌入', value: 'moka-ai/m3e-base@BAAI' },
      { label: 'Sentence-BERT', value: 'sentence-transformers/all-MiniLM-L6-v2@Cohere' },
      { label: 'Embedding-v3', value: 'text-embedding-3-large@OpenAI' }
    ],
    // 分块方法选项
    chunkMethodOptions: [
      { label: '通用分块', value: 'naive' },
      { label: '书籍智能分块', value: 'book' },
      { label: '邮件分析分块', value: 'email' },
      { label: '法律文件分块', value: 'laws' },
      { label: '手册文档分块', value: 'manual' },
      { label: '单页模式分块', value: 'one' },
      { label: '论文智能分块', value: 'paper' },
      { label: '图片内容分块', value: 'picture' },
      { label: '演示文稿分块', value: 'presentation' },
      { label: '问答式分块', value: 'qa' },
      { label: '表格智能分块', value: 'table' },
      { label: '标签式分块', value: 'tag' }
    ],
    formSubmitting: false, // 新增：表单提交状态
    formErrors: {}, // 新增：表单错误信息
    
    // Picker相关状态
    embeddingModelVisible: false, // 添加时嵌入模型选择器可见性
    chunkMethodVisible: false, // 添加时分块方法选择器可见性
    editEmbeddingModelVisible: false, // 编辑时嵌入模型选择器可见性
    editChunkMethodVisible: false, // 编辑时分块方法选择器可见性
  },

  onLoad() {
    // 获取知识库列表（会自动检查登录状态）
    this.getKnowledgeBases(true);
    
    // 监听来自聊天页面的事件
    try {
      const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
      if (eventChannel && typeof eventChannel.on === 'function') {
        eventChannel.on('openAddKnowledgeBase', () => {
          this.onAddKnowledgeBase();
        });
      }
    } catch (error) {
      console.log('事件通道初始化失败', error);
    }
  },

  onShow() {
    // 检查登录状态并更新全局数据
    this.checkAndUpdateLoginStatus();
    
    // 检查全局变量是否需要打开添加知识库对话框
    const app = getApp();
    if (app.globalData && app.globalData.shouldOpenAddKnowledgeBase) {
      // 重置标志
      app.globalData.shouldOpenAddKnowledgeBase = false;
      // 打开添加知识库对话框
      this.onAddKnowledgeBase();
    }
  },

  // 检查并更新登录状态
  checkAndUpdateLoginStatus() {
    const loginStatus = wxLoginApi.checkLoginStatus();
    const app = getApp();
    
    if (loginStatus) {
      // 更新全局登录信息
      app.globalData.wxLoginInfo = loginStatus;
      console.log('Home页面 - 检测到有效登录状态');
    } else {
      // 清除全局登录信息
      app.globalData.wxLoginInfo = null;
      console.log('Home页面 - 未检测到有效登录状态');
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
  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    const knowledgeBase = this.data.knowledgeBases.find((item) => item.id === id);
    
    // 将选择的知识库信息保存到全局数据
    const app = getApp();
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
      formErrors: {}, // 重置表单错误
      formSubmitting: false,
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
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    let value;
    
    // 处理不同类型的事件输入
    if (e.detail && typeof e.detail.value !== 'undefined') {
      // 普通组件的情况
      value = e.detail.value;
    } else if (e.detail && e.detail.selectedOptions && e.detail.selectedOptions[0]) {
      // TDesign Picker组件的情况
      value = e.detail.selectedOptions[0].value;
      console.log(`选择了${field}:`, value);
    } else if (typeof e.detail !== 'undefined') {
      value = e.detail;
    }
    
    if (!value) return;
    
    // 清除该字段的错误
    if (this.data.formErrors[field]) {
      const formErrors = { ...this.data.formErrors };
      delete formErrors[field];
      this.setData({ formErrors });
    }
    
    this.setData({
      [`newKnowledgeBase.${field}`]: value
    });
  },

  // 处理标签输入
  onTagInputChange(e) {
    this.setData({
      inputTag: e.detail.value
    });
  },

  // 添加标签
  addTag() {
    const { inputTag, newKnowledgeBase } = this.data;
    if (!inputTag || inputTag.trim() === '') return;
    
    if (!newKnowledgeBase.tags.includes(inputTag)) {
      this.setData({
        'newKnowledgeBase.tags': [...newKnowledgeBase.tags, inputTag],
        'inputTag': ''
      });
    }
  },

  // 从选项添加标签
  addTagFromOption(e) {
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
  removeTag(e) {
    const { index } = e.currentTarget.dataset;
    const { newKnowledgeBase } = this.data;
    
    const updatedTags = [...newKnowledgeBase.tags];
    updatedTags.splice(index, 1);
    
    this.setData({
      'newKnowledgeBase.tags': updatedTags
    });
  },

  // 处理解析器配置变化
  onParserConfigChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`newKnowledgeBase.parser_config.${field}`]: value
    });
  },
  
  // 处理解析器配置复选框变化
  onParserConfigCheckChange(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`newKnowledgeBase.parser_config.${field}`]: value
    });
  },

  // 获取知识库列表
  getKnowledgeBases(refresh = false) {
    const { currentPage, pageSize, knowledgeBases } = this.data;
    
    if (refresh) {
      this.setData({ loading: true });
      wx.stopPullDownRefresh();
    }

    const params = {
      page: currentPage,
      page_size: pageSize,
      orderby: "update_time",
      desc: true
    };

    console.log('发送请求参数:', params);

    datasetApi.listDatasets(params)
      .then(response => {
        console.log('=== API返回数据分析 ===');
        console.log('原始响应:', response);
        console.log('响应类型:', typeof response);
        console.log('是否为数组:', Array.isArray(response));
        
        // 处理不同的数据结构
        let datasets = [];
        
        if (Array.isArray(response)) {
          // 如果直接是数组
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
          } else if (Array.isArray(response.records)) {
            console.log('找到数据：response.records');
            datasets = response.records;
          } else if (response.data && typeof response.data === 'object') {
            console.log('data字段是对象，继续解析...');
            const dataObj = response.data;
            console.log('data对象键:', Object.keys(dataObj));
            
            if (Array.isArray(dataObj.datasets)) {
              console.log('找到数据：response.data.datasets');
              datasets = dataObj.datasets;
            } else if (Array.isArray(dataObj.items)) {
              console.log('找到数据：response.data.items');
              datasets = dataObj.items;
            } else if (Array.isArray(dataObj.list)) {
              console.log('找到数据：response.data.list');
              datasets = dataObj.list;
            } else if (Array.isArray(dataObj.records)) {
              console.log('找到数据：response.data.records');
              datasets = dataObj.records;
            } else {
              console.warn('data对象中未找到数组字段:', dataObj);
              datasets = [];
            }
          } else {
            console.warn('无法识别的数据结构:', response);
            datasets = [];
          }
        } else {
          console.warn('API返回的数据不是预期的格式:', response);
          datasets = [];
        }
        
        console.log('解析后的数据集数组:', datasets);
        console.log('数据集数量:', datasets.length);
        
        // 确保datasets是数组
        if (!Array.isArray(datasets)) {
          console.error('数据集不是数组格式:', datasets);
          datasets = [];
        }
        
        // 如果数据为空，显示提示
        if (datasets.length === 0) {
          console.log('数据集为空');
          if (refresh) {
            wx.showToast({
              title: '暂无数据',
              icon: 'none'
            });
          }
        }
        
        // 转换API数据格式为应用所需格式
        const formattedDatasets = datasets.map((dataset, index) => {
          console.log(`格式化数据集 ${index}:`, dataset);
          return {
            id: dataset.id,
            name: dataset.name,
            description: dataset.description || '',
            language: dataset.language || '未知语言',
            avatar: dataset.avatar || '',
            createTime: this.formatDate(dataset.create_date),
            updateTime: this.formatDate(dataset.update_date),
            createTimestamp: dataset.create_time,
            updateTimestamp: dataset.update_time,
            docsCount: dataset.document_count || 0,
            chunkCount: dataset.chunk_count || 0,
            tokenNum: dataset.token_num || 0,
            tags: dataset.parser_config && dataset.parser_config.tag_kb_ids ? 
                 dataset.parser_config.tag_kb_ids : [],
            embedding_model: dataset.embedding_model,
            chunk_method: dataset.chunk_method,
            parser_config: dataset.parser_config || {}
          };
        });
        
        console.log('格式化后的数据:', formattedDatasets);
        
        // 如果是刷新，直接替换数据；否则追加
        this.setData({
          knowledgeBases: refresh ? formattedDatasets : [...knowledgeBases, ...formattedDatasets],
          hasMore: formattedDatasets.length >= pageSize,
          loadingMore: false,
          loading: false
        });
        
        console.log('页面数据更新完成');
      })
      .catch(err => {
        console.error('=== API请求失败 ===');
        console.error('错误详情:', err);
        console.error('错误消息:', err.message);
        console.error('错误堆栈:', err.stack);
        
        wx.showToast({
          title: err.message || '获取数据失败',
          icon: 'none'
        });
        this.setData({
          loadingMore: false,
          loading: false
        });
      });
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

  // 获取嵌入模型显示名称
  getEmbeddingModelLabel(value) {
    if (!value) return '未指定';
    
    const option = this.data.embeddingModelOptions.find(item => item.value === value);
    return option ? option.label : value.split('@')[0] || value;
  },
  
  // 获取分块方法显示名称
  getChunkMethodLabel(value) {
    if (!value) return '未指定';
    
    const option = this.data.chunkMethodOptions.find(item => item.value === value);
    return option ? option.label : value;
  },

  // 确认添加知识库
  confirmAdd() {
    const { newKnowledgeBase } = this.data;
    
    // 防止重复提交
    if (this.data.formSubmitting) return;
    
    // 重置表单错误
    const formErrors = {};
    let hasError = false;
    
    // 验证表单
    if (!newKnowledgeBase.name) {
      formErrors.name = '请输入知识库名称';
      hasError = true;
    }
    
    if (!newKnowledgeBase.embedding_model) {
      formErrors.embedding_model = '请选择嵌入模型';
      hasError = true;
    }
    
    if (!newKnowledgeBase.chunk_method) {
      formErrors.chunk_method = '请选择分块方法';
      hasError = true;
    }
    
    if (hasError) {
      this.setData({ formErrors });
      
      // 显示错误震动动画
      wx.vibrateShort({
        type: 'medium'
      });
      
      // 显示错误提示
      if (formErrors.name) {
        wx.showToast({
          title: formErrors.name,
          icon: 'none'
        });
      } else if (formErrors.embedding_model) {
        wx.showToast({
          title: formErrors.embedding_model,
          icon: 'none'
        });
      } else if (formErrors.chunk_method) {
        wx.showToast({
          title: formErrors.chunk_method,
          icon: 'none'
        });
      }
      
      return;
    }
    
    // 设置提交状态
    this.setData({ formSubmitting: true });
    
    wx.showLoading({ title: '创建中...' });
    
    // 构建API请求数据
    const requestData = {
      name: newKnowledgeBase.name,
      description: newKnowledgeBase.description,
      embedding_model: newKnowledgeBase.embedding_model,
      chunk_method: newKnowledgeBase.chunk_method,
      parser_config: newKnowledgeBase.parser_config || {}
    };
    
    // 如果有标签，添加到parser_config中
    if (newKnowledgeBase.tags && newKnowledgeBase.tags.length > 0) {
      if (!requestData.parser_config) {
        requestData.parser_config = {};
      }
      requestData.parser_config.tag_kb_ids = newKnowledgeBase.tags;
    }
    
    // 调用API创建知识库
    datasetApi.createDataset(requestData)
      .then(() => {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });
        
        // 关闭对话框并刷新列表
        this.setData({
          showAddDialog: false,
          formSubmitting: false
        });
        this.refreshKnowledgeBases();
      })
      .catch(err => {
        console.error('创建知识库失败:', err);
        this.setData({ formSubmitting: false });
      });
  },
  
  // 取消添加
  cancelAdd() {
    this.setData({
      showAddDialog: false
    });
  },
  
  // 编辑知识库 - 打开对话框
  onEditKnowledgeBase(e) {
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
      
      // 设置默认值，确保在模型不匹配时使用有效值
      let embedding_model = knowledgeBase.embedding_model;
      if (!embedding_model || !this.data.embeddingModelOptions.find(option => option.value === embedding_model)) {
        embedding_model = this.data.embeddingModelOptions[0].value;
      }
      
      let chunk_method = knowledgeBase.chunk_method;
      if (!chunk_method || !this.data.chunkMethodOptions.find(option => option.value === chunk_method)) {
        chunk_method = this.data.chunkMethodOptions[0].value;
      }
      
      console.log('编辑知识库:', {
        embedding_model,
        chunk_method
      });
      
      this.setData({
        showEditDialog: true,
        editingKnowledgeBase: {
          ...knowledgeBase,
          tags: knowledgeBase.tags || [],
          embedding_model: embedding_model,
          chunk_method: chunk_method,
          parser_config
        }
      });
    }
  },
  
  // 编辑知识库 - 处理输入变化
  onEditInputChange(e) {
    const { field } = e.currentTarget.dataset;
    let value;
    
    // 处理不同类型的事件输入
    if (e.detail && typeof e.detail.value !== 'undefined') {
      // 普通组件的情况
      value = e.detail.value;
    } else if (e.detail && e.detail.selectedOptions && e.detail.selectedOptions[0]) {
      // TDesign Picker组件的情况 
      value = e.detail.selectedOptions[0].value;
      console.log(`编辑时选择了${field}:`, value);
    } else if (typeof e.detail !== 'undefined') {
      value = e.detail;
    }
    
    if (!value) return;
    
    this.setData({
      [`editingKnowledgeBase.${field}`]: value
    });
  },
  
  // 编辑知识库 - 处理标签输入
  onEditTagInputChange(e) {
    this.setData({
      editInputTag: e.detail.value
    });
  },
  
  // 编辑知识库 - 添加标签
  addEditTag() {
    const { editInputTag, editingKnowledgeBase } = this.data;
    if (!editInputTag || editInputTag.trim() === '') return;
    
    if (!editingKnowledgeBase.tags.includes(editInputTag)) {
      this.setData({
        'editingKnowledgeBase.tags': [...editingKnowledgeBase.tags, editInputTag],
        'editInputTag': ''
      });
    }
  },
  
  // 编辑知识库 - 从选项添加标签
  addEditTagFromOption(e) {
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
  removeEditTag(e) {
    const { index } = e.currentTarget.dataset;
    const { editingKnowledgeBase } = this.data;
    
    const updatedTags = [...editingKnowledgeBase.tags];
    updatedTags.splice(index, 1);
    
    this.setData({
      'editingKnowledgeBase.tags': updatedTags
    });
  },
  
  // 编辑知识库 - 处理解析器配置变化
  onEditParserConfigChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`editingKnowledgeBase.parser_config.${field}`]: value
    });
  },
  
  // 编辑知识库 - 处理编辑时解析器配置复选框变化
  onEditParserConfigCheckChange(e) {
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
      description: editingKnowledgeBase.description || '',
      embedding_model: editingKnowledgeBase.embedding_model,
      chunk_method: editingKnowledgeBase.chunk_method,
      parser_config: editingKnowledgeBase.parser_config || {}
    };
    
    // 如果有标签，添加到parser_config中
    if (editingKnowledgeBase.tags && editingKnowledgeBase.tags.length > 0) {
      if (!requestData.parser_config) {
        requestData.parser_config = {};
      }
      requestData.parser_config.tag_kb_ids = editingKnowledgeBase.tags;
    }
    
    // 调用API更新知识库
    datasetApi.updateDataset(editingKnowledgeBase.id, requestData)
      .then(() => {
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
        
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
      })
      .catch(err => {
        console.error('更新知识库失败:', err);
      });
  },
  
  // 取消编辑
  cancelEdit() {
    this.setData({
      showEditDialog: false
    });
  },
  
  // 删除知识库 - 打开对话框
  onDeleteKnowledgeBase(e) {
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
    datasetApi.deleteDataset([deletingKnowledgeBaseId])
      .then(() => {
        // 更新本地数据
        const updatedKnowledgeBases = this.data.knowledgeBases.filter(
          kb => kb.id !== deletingKnowledgeBaseId
        );
        
        this.setData({
          knowledgeBases: updatedKnowledgeBases,
          showDeleteDialog: false
        });
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
      })
      .catch(err => {
        console.error('删除知识库失败:', err);
      });
  },
  
  // 取消删除
  cancelDelete() {
    this.setData({
      showDeleteDialog: false
    });
  },

  // 阻止事件冒泡
  stopEvent(e) {
    e.stopPropagation();
  },

  // 打开添加知识库的嵌入模型选择器
  onEmbeddingModelPicker() {
    this.setData({ embeddingModelVisible: true });
  },

  // 打开添加知识库的分块方法选择器
  onChunkMethodPicker() {
    this.setData({ chunkMethodVisible: true });
  },

  // 打开编辑知识库的嵌入模型选择器
  onEditEmbeddingModelPicker() {
    this.setData({ editEmbeddingModelVisible: true });
  },

  // 打开编辑知识库的分块方法选择器
  onEditChunkMethodPicker() {
    this.setData({ editChunkMethodVisible: true });
  },

  // Picker选择事件处理
  onPickerChange(e) {
    const { key } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    console.log('picker change:', e.detail);
    
    // TDesign的t-picker的value直接是选中的值数组
    if (key === 'embeddingModel') {
      this.setData({
        embeddingModelVisible: false,
        'newKnowledgeBase.embedding_model': value[0] // 直接使用value[0]
      });
    } else if (key === 'chunkMethod') {
      this.setData({
        chunkMethodVisible: false,
        'newKnowledgeBase.chunk_method': value[0] // 直接使用value[0]
      });
    } else if (key === 'editEmbeddingModel') {
      this.setData({
        editEmbeddingModelVisible: false,
        'editingKnowledgeBase.embedding_model': value[0] // 直接使用value[0]
      });
    } else if (key === 'editChunkMethod') {
      this.setData({
        editChunkMethodVisible: false,
        'editingKnowledgeBase.chunk_method': value[0] // 直接使用value[0]
      });
    }
    
    // 清除可能的表单错误
    if (key === 'embeddingModel' && this.data.formErrors.embedding_model) {
      const formErrors = { ...this.data.formErrors };
      delete formErrors.embedding_model;
      this.setData({ formErrors });
    } else if (key === 'chunkMethod' && this.data.formErrors.chunk_method) {
      const formErrors = { ...this.data.formErrors };
      delete formErrors.chunk_method;
      this.setData({ formErrors });
    }
  },

  // Picker取消事件处理
  onPickerCancel(e) {
    const { key } = e.currentTarget.dataset;
    console.log('picker cancel:', key);
    
    if (key === 'embeddingModel') {
      this.setData({ embeddingModelVisible: false });
    } else if (key === 'chunkMethod') {
      this.setData({ chunkMethodVisible: false });
    } else if (key === 'editEmbeddingModel') {
      this.setData({ editEmbeddingModelVisible: false });
    } else if (key === 'editChunkMethod') {
      this.setData({ editChunkMethodVisible: false });
    }
  },

  // 列选择变化事件
  onColumnChange(e) {
    console.log('column change:', e.detail);
  },
});