# 快速开始指南

## 🚀 项目简介

这是一个基于微信小程序的知识库管理与对话助手项目，具有以下特色：

- 📚 **知识库管理**：创建、编辑、删除知识库，支持文档上传
- 🤖 **智能对话**：基于知识库的AI助手对话功能
- 🎨 **Markdown渲染**：自研解析引擎，支持丰富的Markdown格式
- 🔐 **微信登录**：优雅的微信登录系统，用户主动确认
- 📱 **精美UI**：现代化设计，流畅的用户体验

## 📋 环境要求

### 开发环境
- **微信开发者工具** 1.06.0 或更高版本
- **Node.js** 14.0 或更高版本
- **npm** 6.0 或更高版本

### 后端服务
- **RAGFlow服务** 或兼容的API服务
- **微信小程序AppID** （用于真机调试）

## 🛠️ 快速安装

### 1. 克隆项目
```bash
git clone [项目地址]
cd miniprogram-9
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置API地址
编辑 `utils/api.js` 文件，修改API基础地址：
```javascript
const baseUrl = 'http://your-ragflow-api-url/api/v1';
```

### 4. 导入微信开发者工具
1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择项目根目录
4. 填写AppID（测试可使用测试号）

### 5. 启动项目
在微信开发者工具中点击"编译"按钮即可启动项目。

## 📁 项目结构

```
miniprogram-9/
├── pages/                    # 页面文件
│   ├── home/                # 知识库列表页
│   ├── knowledge-detail/    # 知识库详情页
│   ├── chat/                # 对话页面
│   └── profile/             # 个人中心页
├── utils/                   # 工具函数
│   ├── api.js              # API接口封装
│   ├── request.js          # 网络请求封装
│   ├── markdown-parser.js  # Markdown解析器
│   └── constants.js        # 常量定义
├── assets/                  # 静态资源
│   ├── icons/              # 图标文件
│   └── images/             # 图片文件
├── docs/                    # 项目文档
├── prototype/               # 原型文件
├── app.js                   # 小程序入口文件
├── app.json                 # 小程序配置文件
├── app.wxss                 # 全局样式文件
└── project.config.json      # 项目配置文件
```

## 🔧 核心功能使用

### 知识库管理

#### 创建知识库
1. 进入主页
2. 点击右上角"+"按钮
3. 填写知识库信息
4. 点击"创建"按钮

#### 上传文档
1. 进入知识库详情页
2. 点击"上传文档"按钮
3. 选择文件
4. 等待上传完成

### 智能对话

#### 开始对话
1. 切换到"对话"标签页
2. 选择知识库助手
3. 输入问题并发送
4. 查看AI回复

#### Markdown渲染
AI回复支持以下Markdown格式：
- 标题（H1-H6）
- 文本格式（粗体、斜体、删除线）
- 代码块和行内代码
- 列表（有序、无序）
- 引用块
- 链接和图片
- 水平分割线

### 微信登录

#### 登录流程
1. 执行需要登录的操作
2. 系统弹出登录确认对话框
3. 用户确认后自动完成登录
4. 登录信息自动保存

#### 查看登录状态
1. 切换到"我的"标签页
2. 查看"微信登录状态"区域
3. 可手动重新登录或清除登录信息

## 🎨 自定义配置

### 修改主题色彩
编辑 `app.wxss` 文件中的CSS变量：
```css
:root {
  --primary-color: #0052d9;      /* 主色调 */
  --primary-light: #e3f2fd;      /* 浅色调 */
  --primary-dark: #1976d2;       /* 深色调 */
}
```

### 配置API接口
编辑 `utils/api.js` 文件：
```javascript
// 修改基础URL
const baseUrl = 'http://your-api-url/api/v1';

// 添加新的API接口
export const customApi = {
  getData: () => request('/custom/data'),
  postData: (data) => request('/custom/data', 'POST', data)
};
```

### 自定义Markdown样式
编辑 `pages/chat/chat.wxss` 文件中的Markdown样式：
```css
/* 自定义代码块样式 */
.message-content pre {
  background: your-custom-background;
  border-left: 6rpx solid your-custom-color;
}
```

## 🔍 调试技巧

### 控制台调试
在微信开发者工具中打开控制台，查看日志输出：
```javascript
console.log('调试信息:', data);
console.error('错误信息:', error);
```

### 网络请求调试
1. 打开"Network"面板
2. 查看API请求和响应
3. 检查请求参数和返回数据

### 存储数据调试
在控制台中查看本地存储：
```javascript
// 查看所有存储数据
console.log(wx.getStorageInfoSync());

// 查看特定数据
console.log(wx.getStorageSync('wxLoginInfo'));
```

### 真机调试
1. 在微信开发者工具中点击"预览"
2. 使用微信扫码在真机上测试
3. 通过vConsole查看真机日志

## 🚨 常见问题

### Q1: 编译错误 "expect end-tag"
**解决方案：** 检查WXML文件中的标签是否正确闭合，特别注意`<view>`和`<block>`标签的嵌套。

### Q2: API请求失败
**解决方案：**
1. 检查网络连接
2. 确认API地址配置正确
3. 检查后端服务是否正常运行
4. 查看控制台错误信息

### Q3: 微信登录失败
**解决方案：**
1. 确认AppID配置正确
2. 检查后端登录接口是否正常
3. 确认网络请求域名已配置

### Q4: Markdown渲染异常
**解决方案：**
1. 检查Markdown语法是否正确
2. 查看控制台是否有解析错误
3. 确认rich-text组件支持的节点格式

### Q5: 样式显示异常
**解决方案：**
1. 检查WXSS文件是否正确引入
2. 确认样式选择器是否正确
3. 查看是否有样式冲突

## 📚 进阶开发

### 添加新页面
1. 在`pages`目录下创建新页面文件夹
2. 创建`.js`、`.wxml`、`.wxss`、`.json`文件
3. 在`app.json`中注册新页面

### 扩展API接口
1. 在`utils/api.js`中添加新的API方法
2. 使用统一的请求封装
3. 添加错误处理和缓存机制

### 自定义组件
1. 在`components`目录下创建组件
2. 定义组件的属性和方法
3. 在页面中引入和使用组件

### 性能优化
1. 使用分包加载减少首次加载时间
2. 实现图片懒加载
3. 优化网络请求，减少重复请求
4. 使用缓存机制提升响应速度

## 🔗 相关资源

### 官方文档
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [TDesign组件库文档](https://tdesign.tencent.com/miniprogram/overview)

### 项目文档
- [项目设计概览](./project-design-overview.md)
- [技术架构说明](./technical-architecture.md)
- [演示脚本](./presentation-script.md)
- [Markdown功能指南](../utils/markdown-guide.md)
- [微信登录指南](./wx-login-guide.md)

### 开发工具
- [微信开发者工具下载](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- [代码编辑器推荐](https://code.visualstudio.com/)

## 🤝 贡献指南

### 提交代码
1. Fork项目到个人仓库
2. 创建功能分支
3. 提交代码并推送到个人仓库
4. 创建Pull Request

### 报告问题
1. 在GitHub Issues中创建新问题
2. 详细描述问题现象和复现步骤
3. 提供相关的错误日志和截图

### 功能建议
1. 在GitHub Issues中提出功能建议
2. 详细描述功能需求和使用场景
3. 讨论实现方案和技术细节

## 📄 许可证

本项目采用 MIT 许可证，详情请查看 [LICENSE](../LICENSE) 文件。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- **GitHub Issues**: [项目Issues页面]
- **邮箱**: [联系邮箱]
- **微信群**: [微信群二维码]

---

## 🎉 开始使用

现在您已经了解了项目的基本使用方法，可以开始探索和开发了！

1. **首次使用**：按照安装步骤完成环境搭建
2. **功能体验**：尝试创建知识库和进行对话
3. **代码学习**：阅读源码了解实现细节
4. **自定义开发**：根据需求进行功能扩展

祝您使用愉快！🚀 