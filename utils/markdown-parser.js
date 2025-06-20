// Markdown解析工具 - 将Markdown转换为微信小程序rich-text格式
class MarkdownParser {
  constructor() {
    // 初始化解析规则
    this.rules = {
      // 标题规则 (# ## ### #### ##### ######)
      heading: /^(#{1,6})\s+(.+)$/gm,
      // 粗体规则 (**text** 或 __text__)
      bold: /\*\*(.*?)\*\*|__(.*?)__/g,
      // 斜体规则 (*text* 或 _text_)
      italic: /\*(.*?)\*|_(.*?)_/g,
      // 删除线规则 (~~text~~)
      strikethrough: /~~(.*?)~~/g,
      // 行内代码规则 (`code`)
      inlineCode: /`([^`]+)`/g,
      // 代码块规则 (```language\ncode\n```)
      codeBlock: /```(\w*)\n([\s\S]*?)```/g,
      // 链接规则 ([text](url))
      link: /\[([^\]]+)\]\(([^)]+)\)/g,
      // 图片规则 (![alt](src))
      image: /!\[([^\]]*)\]\(([^)]+)\)/g,
      // 无序列表规则 (- item 或 * item)
      unorderedList: /^[\s]*[-*]\s+(.+)$/gm,
      // 有序列表规则 (1. item)
      orderedList: /^[\s]*\d+\.\s+(.+)$/gm,
      // 引用规则 (> text)
      blockquote: /^>\s+(.+)$/gm,
      // 水平分割线规则 (--- 或 ***)
      hr: /^(---|\*\*\*)$/gm,
      // 换行规则
      lineBreak: /\n/g,
      // 段落规则
      paragraph: /^(?!#|>|-|\*|\d+\.|```).+$/gm
    };
  }

  // 主解析方法
  parse(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return [];
    }

    try {
      // 预处理：标准化换行符
      let content = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // 解析代码块（优先处理，避免内部内容被其他规则影响）
      content = this.parseCodeBlocks(content);
      
      // 解析其他元素
      const nodes = this.parseContent(content);
      
      return nodes;
    } catch (error) {
      console.error('Markdown解析错误:', error);
      // 解析失败时返回原始文本
      return [{ type: 'text', text: markdown }];
    }
  }

  // 解析代码块
  parseCodeBlocks(content) {
    const codeBlocks = [];
    let index = 0;
    
    content = content.replace(this.rules.codeBlock, (match, language, code) => {
      const placeholder = `__CODE_BLOCK_${index}__`;
      codeBlocks[index] = {
        type: 'code-block',
        language: language || 'text',
        code: code.trim()
      };
      index++;
      return placeholder;
    });
    
    this.codeBlocks = codeBlocks;
    return content;
  }

  // 解析内容
  parseContent(content) {
    const lines = content.split('\n');
    const nodes = [];
    let currentParagraph = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 空行处理
      if (!line) {
        if (currentParagraph.length > 0) {
          nodes.push(this.createParagraphNode(currentParagraph.join('\n')));
          currentParagraph = [];
        }
        continue;
      }
      
      // 检查是否是代码块占位符
      if (line.startsWith('__CODE_BLOCK_')) {
        if (currentParagraph.length > 0) {
          nodes.push(this.createParagraphNode(currentParagraph.join('\n')));
          currentParagraph = [];
        }
        
        const blockIndex = parseInt(line.match(/\d+/)[0]);
        const codeBlock = this.codeBlocks[blockIndex];
        if (codeBlock) {
          nodes.push(this.createCodeBlockNode(codeBlock));
        }
        continue;
      }
      
      // 检查标题
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        if (currentParagraph.length > 0) {
          nodes.push(this.createParagraphNode(currentParagraph.join('\n')));
          currentParagraph = [];
        }
        nodes.push(this.createHeadingNode(headingMatch[1].length, headingMatch[2]));
        continue;
      }
      
      // 检查引用
      const blockquoteMatch = line.match(/^>\s+(.+)$/);
      if (blockquoteMatch) {
        if (currentParagraph.length > 0) {
          nodes.push(this.createParagraphNode(currentParagraph.join('\n')));
          currentParagraph = [];
        }
        nodes.push(this.createBlockquoteNode(blockquoteMatch[1]));
        continue;
      }
      
      // 检查列表
      const unorderedListMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
      const orderedListMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      
      if (unorderedListMatch || orderedListMatch) {
        if (currentParagraph.length > 0) {
          nodes.push(this.createParagraphNode(currentParagraph.join('\n')));
          currentParagraph = [];
        }
        
        const listItem = unorderedListMatch ? unorderedListMatch[1] : orderedListMatch[1];
        const listType = unorderedListMatch ? 'ul' : 'ol';
        nodes.push(this.createListItemNode(listType, listItem));
        continue;
      }
      
      // 检查水平分割线
      if (line.match(/^(---|\*\*\*)$/)) {
        if (currentParagraph.length > 0) {
          nodes.push(this.createParagraphNode(currentParagraph.join('\n')));
          currentParagraph = [];
        }
        nodes.push(this.createHrNode());
        continue;
      }
      
      // 普通段落内容
      currentParagraph.push(line);
    }
    
    // 处理最后的段落
    if (currentParagraph.length > 0) {
      nodes.push(this.createParagraphNode(currentParagraph.join('\n')));
    }
    
    return nodes;
  }

  // 创建标题节点
  createHeadingNode(level, text) {
    const styles = {
      1: 'font-size: 40rpx; font-weight: 600; margin: 20rpx 0 12rpx 0; color: #1a202c; border-bottom: 3rpx solid #e2e8f0; padding-bottom: 8rpx; line-height: 1.3;',
      2: 'font-size: 36rpx; font-weight: 600; margin: 20rpx 0 12rpx 0; color: #2d3748; border-bottom: 2rpx solid #e2e8f0; padding-bottom: 6rpx; line-height: 1.3;',
      3: 'font-size: 32rpx; font-weight: 600; margin: 20rpx 0 12rpx 0; color: #4a5568; line-height: 1.3;',
      4: 'font-size: 28rpx; font-weight: 600; margin: 20rpx 0 12rpx 0; color: #4a5568; line-height: 1.3;',
      5: 'font-size: 26rpx; font-weight: 600; margin: 20rpx 0 12rpx 0; color: #718096; line-height: 1.3;',
      6: 'font-size: 24rpx; font-weight: 600; margin: 20rpx 0 12rpx 0; color: #718096; line-height: 1.3;'
    };
    
    return {
      name: 'div',
      attrs: {
        style: styles[level]
      },
      children: this.parseInlineElements(text)
    };
  }

  // 创建段落节点
  createParagraphNode(text) {
    return {
      name: 'div',
      attrs: {
        style: 'margin: 16rpx 0; line-height: 1.7; color: #4a5568;'
      },
      children: this.parseInlineElements(text)
    };
  }

  // 创建代码块节点
  createCodeBlockNode(codeBlock) {
    return {
      name: 'div',
      attrs: {
        style: 'background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20rpx; margin: 16rpx 0; border-radius: 12rpx; border-left: 6rpx solid #007bff; overflow-x: auto; box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08); position: relative;'
      },
      children: [
        {
          name: 'div',
          attrs: {
            style: 'font-size: 22rpx; color: #6c757d; margin-bottom: 12rpx; font-weight: 500;'
          },
          children: [{ type: 'text', text: codeBlock.language || 'code' }]
        },
        {
          name: 'pre',
          attrs: {
            style: 'font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace; font-size: 26rpx; color: #2d3748; white-space: pre-wrap; word-break: break-all; margin: 0;'
          },
          children: [{ type: 'text', text: codeBlock.code }]
        }
      ]
    };
  }

  // 创建引用节点
  createBlockquoteNode(text) {
    return {
      name: 'div',
      attrs: {
        style: 'border-left: 6rpx solid #4299e1; padding: 16rpx 20rpx; margin: 16rpx 0; color: #4a5568; font-style: italic; background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%); border-radius: 0 12rpx 12rpx 0; box-shadow: 0 2rpx 8rpx rgba(66, 153, 225, 0.1);'
      },
      children: this.parseInlineElements(text)
    };
  }

  // 创建列表项节点
  createListItemNode(listType, text) {
    const bullet = listType === 'ul' ? '•' : '1.';
    
    return {
      name: 'div',
      attrs: {
        style: 'margin: 12rpx 0; padding-left: 32rpx; position: relative; line-height: 1.7; color: #4a5568;'
      },
      children: [
        {
          name: 'span',
          attrs: {
            style: `position: absolute; left: ${listType === 'ul' ? '8rpx' : '4rpx'}; color: #4299e1; font-weight: ${listType === 'ul' ? 'bold' : '600'}; font-size: ${listType === 'ul' ? '28rpx' : '24rpx'};`
          },
          children: [{ type: 'text', text: bullet }]
        },
        ...this.parseInlineElements(text)
      ]
    };
  }

  // 创建水平分割线节点
  createHrNode() {
    return {
      name: 'div',
      attrs: {
        style: 'height: 3rpx; background: linear-gradient(90deg, transparent 0%, #4299e1 20%, #4299e1 80%, transparent 100%); margin: 32rpx 0; border-radius: 2rpx;'
      },
      children: []
    };
  }

  // 解析行内元素
  parseInlineElements(text) {
    if (!text) return [];
    
    const nodes = [];
    let currentText = text;
    let lastIndex = 0;
    
    // 处理行内代码（优先级最高）
    currentText = currentText.replace(this.rules.inlineCode, (match, code, offset) => {
      // 添加前面的文本
      if (offset > lastIndex) {
        const beforeText = text.substring(lastIndex, offset);
        nodes.push(...this.parseTextWithFormatting(beforeText));
      }
      
      // 添加代码节点
      nodes.push({
        name: 'span',
        attrs: {
          style: 'background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%); padding: 4rpx 10rpx; border-radius: 8rpx; font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Courier New", monospace; font-size: 24rpx; color: #c53030; border: 1rpx solid #feb2b2; box-shadow: 0 2rpx 4rpx rgba(197, 48, 48, 0.1);'
        },
        children: [{ type: 'text', text: code }]
      });
      
      lastIndex = offset + match.length;
      return '';
    });
    
    // 处理剩余文本
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      nodes.push(...this.parseTextWithFormatting(remainingText));
    }
    
    return nodes.length > 0 ? nodes : [{ type: 'text', text: text }];
  }

  // 解析文本格式（粗体、斜体、删除线等）
  parseTextWithFormatting(text) {
    if (!text) return [];
    
    const nodes = [];
    let processedText = text;
    
    // 处理链接
    processedText = processedText.replace(this.rules.link, (match, linkText, url) => {
      nodes.push({
        name: 'span',
        attrs: {
          style: 'color: #4299e1; text-decoration: none; border-bottom: 2rpx solid #4299e1; padding-bottom: 2rpx;'
        },
        children: [{ type: 'text', text: linkText }]
      });
      return '';
    });
    
    // 处理图片
    processedText = processedText.replace(this.rules.image, (match, alt, src) => {
      nodes.push({
        name: 'span',
        attrs: {
          style: 'color: #666; font-style: italic;'
        },
        children: [{ type: 'text', text: `[图片: ${alt || '图片'}]` }]
      });
      return '';
    });
    
    // 处理粗体
    processedText = processedText.replace(this.rules.bold, (match, text1, text2) => {
      const boldText = text1 || text2;
      nodes.push({
        name: 'span',
        attrs: {
          style: 'font-weight: 600; color: #2d3748;'
        },
        children: [{ type: 'text', text: boldText }]
      });
      return '';
    });
    
    // 处理斜体
    processedText = processedText.replace(this.rules.italic, (match, text1, text2) => {
      const italicText = text1 || text2;
      nodes.push({
        name: 'span',
        attrs: {
          style: 'font-style: italic; color: #4a5568;'
        },
        children: [{ type: 'text', text: italicText }]
      });
      return '';
    });
    
    // 处理删除线
    processedText = processedText.replace(this.rules.strikethrough, (match, text) => {
      nodes.push({
        name: 'span',
        attrs: {
          style: 'text-decoration: line-through; color: #a0aec0; opacity: 0.8;'
        },
        children: [{ type: 'text', text: text }]
      });
      return '';
    });
    
    // 添加剩余的普通文本
    if (processedText.trim()) {
      nodes.push({ type: 'text', text: processedText });
    }
    
    return nodes.length > 0 ? nodes : [{ type: 'text', text: text }];
  }
}

// 创建全局实例
const markdownParser = new MarkdownParser();

// 导出解析方法
export const parseMarkdown = (markdown) => {
  return markdownParser.parse(markdown);
};

// 导出类（用于自定义实例）
export { MarkdownParser };

// 默认导出
export default {
  parseMarkdown,
  MarkdownParser
}; 