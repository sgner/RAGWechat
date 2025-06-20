# 技术架构详细说明

## 🏗️ 整体架构设计

### 分层架构模式

本项目采用经典的分层架构模式，从上到下分为：

```
┌─────────────────────────────────────────────────────────┐
│                    表现层 (Presentation Layer)          │
│  ├── WXML 模板                                          │
│  ├── WXSS 样式                                          │
│  └── 用户交互逻辑                                       │
├─────────────────────────────────────────────────────────┤
│                    业务逻辑层 (Business Logic Layer)     │
│  ├── 页面控制器 (Page Controllers)                      │
│  ├── 业务服务 (Business Services)                       │
│  └── 状态管理 (State Management)                        │
├─────────────────────────────────────────────────────────┤
│                    数据访问层 (Data Access Layer)       │
│  ├── API 接口封装                                       │
│  ├── 数据转换器                                         │
│  └── 缓存管理                                           │
├─────────────────────────────────────────────────────────┤
│                    基础设施层 (Infrastructure Layer)     │
│  ├── 网络请求                                           │
│  ├── 本地存储                                           │
│  ├── 工具函数                                           │
│  └── 第三方服务                                         │
└─────────────────────────────────────────────────────────┘
```

### 模块化设计

#### 1. 页面模块 (Pages)
```
pages/
├── home/                    # 知识库列表页
│   ├── home.js             # 页面逻辑
│   ├── home.wxml           # 页面模板
│   ├── home.wxss           # 页面样式
│   └── home.json           # 页面配置
├── knowledge-detail/        # 知识库详情页
├── chat/                   # 对话页面
└── profile/                # 个人中心页
```

#### 2. 工具模块 (Utils)
```
utils/
├── api.js                  # API接口封装
├── request.js              # 网络请求封装
├── storage.js              # 本地存储管理
├── markdown-parser.js      # Markdown解析器
├── constants.js            # 常量定义
└── helpers.js              # 工具函数
```

#### 3. 组件模块 (Components)
```
components/
├── common/                 # 通用组件
├── business/               # 业务组件
└── ui/                     # UI组件
```

## 🔧 核心技术实现

### 1. Markdown 解析引擎

#### 架构设计
```javascript
class MarkdownParser {
  constructor() {
    // 初始化解析规则
    this.initializeRules();
    // 初始化节点工厂
    this.nodeFactory = new NodeFactory();
  }
  
  // 主解析流程
  parse(markdown) {
    // 1. 预处理阶段
    const preprocessed = this.preprocess(markdown);
    
    // 2. 词法分析阶段
    const tokens = this.tokenize(preprocessed);
    
    // 3. 语法分析阶段
    const ast = this.parseTokens(tokens);
    
    // 4. 代码生成阶段
    const nodes = this.generateNodes(ast);
    
    return nodes;
  }
}
```

#### 解析规则引擎
```javascript
// 规则定义
const MARKDOWN_RULES = {
  // 块级元素
  BLOCK_ELEMENTS: {
    heading: {
      pattern: /^(#{1,6})\s+(.+)$/gm,
      priority: 10,
      handler: 'createHeadingNode'
    },
    codeBlock: {
      pattern: /```(\w*)\n([\s\S]*?)```/g,
      priority: 20,
      handler: 'createCodeBlockNode'
    },
    blockquote: {
      pattern: /^>\s+(.+)$/gm,
      priority: 15,
      handler: 'createBlockquoteNode'
    }
  },
  
  // 行内元素
  INLINE_ELEMENTS: {
    bold: {
      pattern: /\*\*(.*?)\*\*|__(.*?)__/g,
      priority: 5,
      handler: 'createBoldNode'
    },
    italic: {
      pattern: /\*(.*?)\*|_(.*?)_/g,
      priority: 4,
      handler: 'createItalicNode'
    },
    inlineCode: {
      pattern: /`([^`]+)`/g,
      priority: 8,
      handler: 'createInlineCodeNode'
    }
  }
};
```

#### 节点工厂模式
```javascript
class NodeFactory {
  createNode(type, content, attributes = {}) {
    const nodeCreators = {
      'heading': this.createHeadingNode,
      'paragraph': this.createParagraphNode,
      'codeBlock': this.createCodeBlockNode,
      'list': this.createListNode,
      'blockquote': this.createBlockquoteNode
    };
    
    const creator = nodeCreators[type];
    if (!creator) {
      throw new Error(`Unknown node type: ${type}`);
    }
    
    return creator.call(this, content, attributes);
  }
  
  createHeadingNode(content, { level = 1 } = {}) {
    return {
      name: 'div',
      attrs: {
        style: this.getHeadingStyle(level)
      },
      children: this.parseInlineContent(content)
    };
  }
}
```

### 2. 网络请求架构

#### 请求拦截器设计
```javascript
class RequestInterceptor {
  constructor() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }
  
  // 添加请求拦截器
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }
  
  // 添加响应拦截器
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }
  
  // 执行请求拦截
  async interceptRequest(config) {
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }
    return config;
  }
  
  // 执行响应拦截
  async interceptResponse(response) {
    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response);
    }
    return response;
  }
}
```

#### API 接口抽象层
```javascript
class ApiClient {
  constructor(baseURL, interceptor) {
    this.baseURL = baseURL;
    this.interceptor = interceptor;
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    // 请求拦截：添加认证信息
    this.interceptor.addRequestInterceptor(async (config) => {
      const loginInfo = await this.getLoginInfo();
      if (loginInfo) {
        config.header = {
          ...config.header,
          'Authorization': `Bearer ${loginInfo.token}`
        };
      }
      return config;
    });
    
    // 响应拦截：统一错误处理
    this.interceptor.addResponseInterceptor(async (response) => {
      if (response.statusCode === 401) {
        await this.handleUnauthorized();
      }
      return response;
    });
  }
  
  async request(url, method = 'GET', data = null, options = {}) {
    let config = {
      url: `${this.baseURL}${url}`,
      method,
      data,
      ...options
    };
    
    // 执行请求拦截
    config = await this.interceptor.interceptRequest(config);
    
    // 发送请求
    const response = await this.sendRequest(config);
    
    // 执行响应拦截
    return await this.interceptor.interceptResponse(response);
  }
}
```

### 3. 状态管理系统

#### 全局状态管理
```javascript
class GlobalStateManager {
  constructor() {
    this.state = {
      user: null,
      currentKnowledgeBase: null,
      currentSession: null,
      loginInfo: null
    };
    this.listeners = new Map();
  }
  
  // 订阅状态变化
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
    
    // 返回取消订阅函数
    return () => {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  // 更新状态
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // 通知订阅者
    const callbacks = this.listeners.get(key) || [];
    callbacks.forEach(callback => {
      callback(value, oldValue);
    });
    
    // 持久化关键状态
    this.persistState(key, value);
  }
  
  // 获取状态
  getState(key) {
    return this.state[key];
  }
  
  // 持久化状态
  persistState(key, value) {
    const persistKeys = ['loginInfo', 'currentSession'];
    if (persistKeys.includes(key)) {
      wx.setStorageSync(key, value);
    }
  }
}
```

#### 页面状态管理
```javascript
class PageStateManager {
  constructor(page) {
    this.page = page;
    this.subscriptions = [];
  }
  
  // 绑定全局状态
  bindGlobalState(globalKey, localKey = globalKey) {
    const unsubscribe = globalStateManager.subscribe(globalKey, (newValue) => {
      this.page.setData({
        [localKey]: newValue
      });
    });
    
    this.subscriptions.push(unsubscribe);
    
    // 初始化数据
    const initialValue = globalStateManager.getState(globalKey);
    if (initialValue !== undefined) {
      this.page.setData({
        [localKey]: initialValue
      });
    }
  }
  
  // 页面卸载时清理订阅
  cleanup() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
}
```

### 4. 微信登录系统

#### 登录状态机
```javascript
class LoginStateMachine {
  constructor() {
    this.state = 'LOGGED_OUT';
    this.transitions = {
      'LOGGED_OUT': {
        'LOGIN_START': 'LOGGING_IN',
        'AUTO_LOGIN': 'CHECKING_TOKEN'
      },
      'LOGGING_IN': {
        'LOGIN_SUCCESS': 'LOGGED_IN',
        'LOGIN_FAILURE': 'LOGGED_OUT'
      },
      'CHECKING_TOKEN': {
        'TOKEN_VALID': 'LOGGED_IN',
        'TOKEN_INVALID': 'LOGGED_OUT'
      },
      'LOGGED_IN': {
        'LOGOUT': 'LOGGED_OUT',
        'TOKEN_EXPIRED': 'LOGGED_OUT'
      }
    };
  }
  
  transition(event, data = null) {
    const currentTransitions = this.transitions[this.state];
    const nextState = currentTransitions[event];
    
    if (!nextState) {
      console.warn(`Invalid transition: ${this.state} -> ${event}`);
      return false;
    }
    
    const oldState = this.state;
    this.state = nextState;
    
    // 触发状态变化事件
    this.onStateChange(oldState, nextState, data);
    
    return true;
  }
  
  onStateChange(oldState, newState, data) {
    console.log(`Login state: ${oldState} -> ${newState}`);
    
    // 根据状态执行相应操作
    switch (newState) {
      case 'LOGGED_IN':
        this.handleLoginSuccess(data);
        break;
      case 'LOGGED_OUT':
        this.handleLogout();
        break;
    }
  }
}
```

#### 登录服务
```javascript
class LoginService {
  constructor() {
    this.stateMachine = new LoginStateMachine();
    this.retryCount = 0;
    this.maxRetries = 3;
  }
  
  async checkLoginStatus() {
    const loginInfo = wx.getStorageSync('wxLoginInfo');
    if (!loginInfo) {
      return false;
    }
    
    // 检查是否过期
    const now = Date.now();
    const expireTime = 7 * 24 * 60 * 60 * 1000; // 7天
    if (now - loginInfo.loginTime > expireTime) {
      this.clearLoginInfo();
      return false;
    }
    
    return true;
  }
  
  async login() {
    this.stateMachine.transition('LOGIN_START');
    
    try {
      // 获取微信登录码
      const loginResult = await this.wxLogin();
      const code = loginResult.code;
      
      // 调用后端接口
      const sessionResult = await this.getSessionId(code);
      
      // 保存登录信息
      const loginInfo = {
        code,
        sessionData: sessionResult.data,
        loginTime: Date.now()
      };
      
      this.saveLoginInfo(loginInfo);
      this.stateMachine.transition('LOGIN_SUCCESS', loginInfo);
      
      return loginInfo;
    } catch (error) {
      this.stateMachine.transition('LOGIN_FAILURE', error);
      throw error;
    }
  }
  
  async wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      });
    });
  }
}
```

### 5. 数据持久化策略

#### 存储层次设计
```javascript
class StorageManager {
  constructor() {
    this.memoryCache = new Map();
    this.storageKeys = {
      USER_INFO: 'userInfo',
      LOGIN_INFO: 'wxLoginInfo',
      KNOWLEDGE_BASES: 'knowledgeBases',
      CHAT_HISTORY: 'chatHistory'
    };
  }
  
  // 内存缓存
  setMemoryCache(key, value, ttl = 5 * 60 * 1000) { // 默认5分钟
    this.memoryCache.set(key, {
      value,
      expireTime: Date.now() + ttl
    });
  }
  
  getMemoryCache(key) {
    const item = this.memoryCache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expireTime) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  // 本地存储
  setStorage(key, value) {
    try {
      wx.setStorageSync(key, {
        data: value,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }
  
  getStorage(key, maxAge = null) {
    try {
      const item = wx.getStorageSync(key);
      if (!item) return null;
      
      if (maxAge && Date.now() - item.timestamp > maxAge) {
        this.removeStorage(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }
  
  // 智能存储策略
  smartSet(key, value, options = {}) {
    const { 
      memoryTTL = 5 * 60 * 1000,
      persistToDisk = true,
      maxAge = null 
    } = options;
    
    // 设置内存缓存
    this.setMemoryCache(key, value, memoryTTL);
    
    // 设置本地存储
    if (persistToDisk) {
      this.setStorage(key, value);
    }
  }
  
  smartGet(key, options = {}) {
    const { maxAge = null } = options;
    
    // 先尝试内存缓存
    let value = this.getMemoryCache(key);
    if (value !== null) {
      return value;
    }
    
    // 再尝试本地存储
    value = this.getStorage(key, maxAge);
    if (value !== null) {
      // 回填内存缓存
      this.setMemoryCache(key, value);
    }
    
    return value;
  }
}
```

## 🔄 数据流设计

### 单向数据流
```
用户操作 → Action → Service → API → 后端
    ↑                                  ↓
页面更新 ← State ← Store ← Response ← 数据处理
```

### 数据流实现
```javascript
class DataFlowManager {
  constructor() {
    this.actionQueue = [];
    this.isProcessing = false;
  }
  
  // 分发动作
  async dispatch(action) {
    this.actionQueue.push(action);
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }
  
  async processQueue() {
    this.isProcessing = true;
    
    while (this.actionQueue.length > 0) {
      const action = this.actionQueue.shift();
      await this.processAction(action);
    }
    
    this.isProcessing = false;
  }
  
  async processAction(action) {
    try {
      // 1. 执行业务逻辑
      const result = await this.executeAction(action);
      
      // 2. 更新状态
      this.updateState(action.type, result);
      
      // 3. 触发副作用
      this.triggerSideEffects(action, result);
      
    } catch (error) {
      this.handleError(action, error);
    }
  }
}
```

## 🎯 性能优化策略

### 1. 渲染优化
```javascript
// 虚拟列表实现
class VirtualList {
  constructor(options) {
    this.itemHeight = options.itemHeight;
    this.containerHeight = options.containerHeight;
    this.items = options.items;
    this.visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + 2;
  }
  
  getVisibleItems(scrollTop) {
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleCount, this.items.length);
    
    return {
      items: this.items.slice(startIndex, endIndex),
      startIndex,
      offsetY: startIndex * this.itemHeight
    };
  }
}
```

### 2. 网络优化
```javascript
// 请求去重
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }
  
  async request(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    const promise = requestFn();
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
}

// 请求缓存
class RequestCache {
  constructor() {
    this.cache = new Map();
  }
  
  get(key, maxAge = 5 * 60 * 1000) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

### 3. 内存管理
```javascript
class MemoryManager {
  constructor() {
    this.watchers = [];
    this.cleanupTasks = [];
  }
  
  // 监控内存使用
  startMemoryMonitoring() {
    const monitor = setInterval(() => {
      const memoryInfo = wx.getSystemInfoSync();
      if (memoryInfo.memoryWarning) {
        this.handleMemoryWarning();
      }
    }, 10000);
    
    this.watchers.push(() => clearInterval(monitor));
  }
  
  // 内存警告处理
  handleMemoryWarning() {
    console.warn('Memory warning detected, starting cleanup...');
    
    // 清理缓存
    this.clearCaches();
    
    // 执行清理任务
    this.cleanupTasks.forEach(task => task());
    
    // 强制垃圾回收（如果支持）
    if (typeof gc === 'function') {
      gc();
    }
  }
  
  // 注册清理任务
  registerCleanupTask(task) {
    this.cleanupTasks.push(task);
  }
}
```

## 🔒 安全架构

### 1. 输入验证
```javascript
class InputValidator {
  static validate(input, rules) {
    const errors = [];
    
    for (const rule of rules) {
      const result = rule.validate(input);
      if (!result.valid) {
        errors.push(result.message);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  static createRule(type, options = {}) {
    const rules = {
      required: (value) => ({
        valid: value !== null && value !== undefined && value !== '',
        message: '此字段为必填项'
      }),
      
      maxLength: (value) => ({
        valid: !value || value.length <= options.max,
        message: `长度不能超过${options.max}个字符`
      }),
      
      pattern: (value) => ({
        valid: !value || options.regex.test(value),
        message: options.message || '格式不正确'
      })
    };
    
    return rules[type];
  }
}
```

### 2. 数据加密
```javascript
class CryptoManager {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }
  
  // 生成密钥
  async generateKey() {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  // 加密数据
  async encrypt(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv
      },
      key,
      encodedData
    );
    
    return {
      data: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    };
  }
  
  // 解密数据
  async decrypt(encryptedData, key) {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: new Uint8Array(encryptedData.iv)
      },
      key,
      new Uint8Array(encryptedData.data)
    );
    
    const decodedData = new TextDecoder().decode(decrypted);
    return JSON.parse(decodedData);
  }
}
```

## 📊 监控与日志

### 1. 性能监控
```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }
  
  // 开始性能测量
  startMeasure(name) {
    this.metrics.set(name, {
      startTime: Date.now(),
      startMemory: this.getMemoryUsage()
    });
  }
  
  // 结束性能测量
  endMeasure(name) {
    const metric = this.metrics.get(name);
    if (!metric) return;
    
    const endTime = Date.now();
    const endMemory = this.getMemoryUsage();
    
    const result = {
      name,
      duration: endTime - metric.startTime,
      memoryDelta: endMemory - metric.startMemory,
      timestamp: endTime
    };
    
    this.reportMetric(result);
    this.metrics.delete(name);
  }
  
  // 获取内存使用情况
  getMemoryUsage() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      return systemInfo.memorySize || 0;
    } catch (error) {
      return 0;
    }
  }
  
  // 上报性能指标
  reportMetric(metric) {
    console.log('Performance metric:', metric);
    
    // 发送到监控服务
    this.sendToMonitoringService(metric);
  }
}
```

### 2. 错误监控
```javascript
class ErrorMonitor {
  constructor() {
    this.errorQueue = [];
    this.isReporting = false;
    this.setupGlobalErrorHandler();
  }
  
  setupGlobalErrorHandler() {
    // 捕获未处理的错误
    wx.onError((error) => {
      this.captureError(error, 'unhandled');
    });
    
    // 捕获未处理的Promise拒绝
    wx.onUnhandledRejection((event) => {
      this.captureError(event.reason, 'unhandledRejection');
    });
  }
  
  captureError(error, type = 'manual') {
    const errorInfo = {
      message: error.message || error,
      stack: error.stack,
      type,
      timestamp: Date.now(),
      userAgent: wx.getSystemInfoSync(),
      url: getCurrentPages().pop()?.route
    };
    
    this.errorQueue.push(errorInfo);
    this.reportErrors();
  }
  
  async reportErrors() {
    if (this.isReporting || this.errorQueue.length === 0) {
      return;
    }
    
    this.isReporting = true;
    
    try {
      const errors = this.errorQueue.splice(0, 10); // 批量上报
      await this.sendErrorsToService(errors);
    } catch (reportError) {
      console.error('Failed to report errors:', reportError);
    } finally {
      this.isReporting = false;
    }
  }
}
```

这个技术架构文档详细说明了项目的核心技术实现，包括分层架构、模块化设计、核心组件实现、性能优化策略、安全架构和监控系统。每个部分都提供了具体的代码示例和实现细节，为项目的技术讲解提供了全面的支撑。 