// Markdown解析功能测试
import { parseMarkdown } from './markdown-parser';

// 测试用例集合
const testCases = {
  // 基础文本测试
  basicText: {
    input: "这是一段普通文本。",
    description: "基础文本测试"
  },

  // 标题测试
  headings: {
    input: `# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题`,
    description: "标题格式测试"
  },

  // 文本格式测试
  textFormatting: {
    input: `这是**粗体文本**和*斜体文本*。
这是~~删除线文本~~。
这是\`行内代码\`示例。`,
    description: "文本格式测试"
  },

  // 代码块测试
  codeBlocks: {
    input: `这是一个JavaScript代码示例：

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
  return "success";
}
\`\`\`

这是Python代码：

\`\`\`python
def greet(name):
    print(f"Hello, {name}!")
    return True
\`\`\``,
    description: "代码块测试"
  },

  // 列表测试
  lists: {
    input: `无序列表：
- 第一项
- 第二项
- 第三项

有序列表：
1. 第一步
2. 第二步
3. 第三步`,
    description: "列表格式测试"
  },

  // 引用测试
  blockquotes: {
    input: `> 这是一个引用块。
> 它可以包含多行内容。

普通文本。

> 另一个引用块。`,
    description: "引用块测试"
  },

  // 链接和图片测试
  linksAndImages: {
    input: `这是一个[链接示例](https://example.com)。
这是一个![图片示例](https://example.com/image.jpg)。`,
    description: "链接和图片测试"
  },

  // 水平分割线测试
  horizontalRules: {
    input: `段落一

---

段落二

***

段落三`,
    description: "水平分割线测试"
  },

  // 混合格式测试
  mixedContent: {
    input: `# AI助手功能介绍

## 主要特性

我是一个**智能AI助手**，具有以下特点：

- 支持*自然语言*对话
- 可以处理~~复杂~~多样的问题
- 提供\`准确\`的信息

### 代码示例

\`\`\`javascript
// 示例代码
const ai = {
  name: "AI助手",
  version: "1.0.0",
  features: ["对话", "分析", "建议"]
};
\`\`\`

> 注意：这只是一个演示示例。

---

**联系方式：** [官方网站](https://example.com)

![AI助手](https://example.com/ai.png)`,
    description: "混合格式综合测试"
  },

  // 特殊字符测试
  specialCharacters: {
    input: `特殊字符测试：
- HTML标签：<div>内容</div>
- 符号：& < > " '
- 数学：2 + 2 = 4
- 引用编号：##1$$ ##2$$`,
    description: "特殊字符处理测试"
  }
};

// 执行单个测试
function runSingleTest(testName, testCase) {
  console.log(`\n=== ${testCase.description} ===`);
  console.log('输入:', testCase.input);
  
  try {
    const result = parseMarkdown(testCase.input);
    console.log('解析结果:', JSON.stringify(result, null, 2));
    console.log('✅ 测试通过');
    return true;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 执行所有测试
function runAllTests() {
  console.log('开始Markdown解析功能测试...\n');
  
  let passedTests = 0;
  let totalTests = Object.keys(testCases).length;
  
  for (const [testName, testCase] of Object.entries(testCases)) {
    if (runSingleTest(testName, testCase)) {
      passedTests++;
    }
  }
  
  console.log(`\n=== 测试总结 ===`);
  console.log(`通过: ${passedTests}/${totalTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  return passedTests === totalTests;
}

// 测试特定格式
function testSpecificFormat(format, input) {
  console.log(`\n=== 测试${format}格式 ===`);
  console.log('输入:', input);
  
  try {
    const result = parseMarkdown(input);
    console.log('解析结果:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('解析失败:', error);
    return null;
  }
}

// 性能测试
function performanceTest() {
  console.log('\n=== 性能测试 ===');
  
  const largeText = `# 大文本测试
  
${'这是一段重复的文本。'.repeat(100)}

## 代码块测试

\`\`\`javascript
${'// 这是重复的注释\n'.repeat(50)}
\`\`\`

### 列表测试

${Array.from({length: 50}, (_, i) => `- 列表项 ${i + 1}`).join('\n')}
`;

  const startTime = Date.now();
  
  try {
    const result = parseMarkdown(largeText);
    const endTime = Date.now();
    
    console.log(`解析时间: ${endTime - startTime}ms`);
    console.log(`输入长度: ${largeText.length} 字符`);
    console.log(`输出节点数: ${result.length}`);
    console.log('✅ 性能测试通过');
    
    return true;
  } catch (error) {
    console.error('❌ 性能测试失败:', error);
    return false;
  }
}

// 导出测试函数
export {
  runAllTests,
  runSingleTest,
  testSpecificFormat,
  performanceTest,
  testCases
};

// 默认导出
export default {
  runAllTests,
  runSingleTest,
  testSpecificFormat,
  performanceTest,
  testCases
}; 