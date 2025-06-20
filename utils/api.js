const baseUrl = 'http://localhost:9880/ragflow/api/v1';
const uploadBaseUrl = 'http://localhost:9880'
const loginBaseUrl = 'http://localhost:9880/wx/login'

/**
 * 微信小程序SSE客户端实现
 * 模拟标准的EventSource行为
 */
class MiniProgramSSEClient {
  constructor(url, data, callbacks, timeout = 60000) {
    this.url = url;
    this.data = data;
    this.callbacks = callbacks || {};
    this.timeout = timeout;
    this.connected = false;
    this.completed = false;
    this.messageBuffer = '';
    this.lastEventId = '';
    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;
    this.request = null;
    
    // 超时计时器
    this.connectionTimeout = null;
    this.dataTimeout = null;
    this.retryTimeout = null;
    
    // 流结束检测
    this.emptyMessageCount = 0;
    this.lastDataTime = Date.now();
    this.hasReceivedData = false;
    
    // 有效消息后2秒强制断开计时器
    this.validMessageTimeout = null;
    this.lastValidMessageTime = 0;
    this.emptyDataCount = 0; // 初始化空数据计数器
    
    // 绑定回调
    this.onData = callbacks.onData;
    this.onError = callbacks.onError;
    this.onComplete = callbacks.onComplete;
    this.onStart = callbacks.onStart;
  }

  /**
   * 打开SSE连接
   */
  connect() {
    console.log('===== SSE客户端开始连接 =====');
    console.log('URL:', this.url);
    console.log('数据:', this.data);
    console.log('回调函数:', this.callbacks);
    console.log('超时时间:', this.timeout);
    console.log('已连接状态:', this.connected);
    
    if (this.connected) {
      console.warn('SSE连接已存在，请先关闭再重新连接');
      return;
    }

    console.log('建立SSE连接...', this.url);
    console.log('SSE请求数据:', JSON.stringify(this.data));

    // 添加特殊SSE请求头
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    };

    // 如果有上次的事件ID，添加到请求头中
    if (this.lastEventId) {
      headers['Last-Event-ID'] = this.lastEventId;
    }

    // 获取JWT用于认证
    const wxJWT = wx.getStorageSync('wxJWT');
    if (wxJWT) {
      headers['Authorization'] = `Bearer ${wxJWT}`;
    }

    try {
      console.log('使用enableChunked=true进行SSE流式数据接收');
      
      this.request = wx.request({
        url: this.url,
        method: 'POST',
        data: this.data,
        header: headers,
        enableChunked: true, // 必须启用分块传输接收SSE数据
        success: (res) => {
          console.log('===== SSE请求成功 =====');
          console.log('响应状态码:', res.statusCode);
          console.log('响应头:', res.header);
          console.log('响应数据类型:', typeof res.data);
          console.log('响应数据长度:', res.data ? res.data.length : 0);
          
          this.connected = true;
          
          // 启动连接监控和超时管理
          this._startConnectionMonitoring();
          
          if (this.callbacks.onOpen) {
            console.log('调用onOpen回调');
            this.callbacks.onOpen();
          }
          
          // 如果响应中包含数据（非流式情况的后备方案）
          if (res.data) {
            console.log('收到非流式响应数据作为后备方案');
          }
        },
        fail: (error) => {
          console.error('===== SSE请求失败 =====');
          console.error('错误对象:', error);
          console.error('错误消息:', error.errMsg);
          
          // 如果连接已经完成，不再处理错误（避免abort引起的误报错误）
          if (this.completed) {
            console.log('连接已完成，忽略SSE请求fail错误');
            return;
          }
          
          // 检查是否是主动abort引起的错误
          if (error && error.errMsg && error.errMsg.includes('abort')) {
            console.log('检测到abort错误，可能是正常的强制关闭，不触发错误处理');
            return;
          }
          
          this._handleError(error);
        }
      });
      
      // 添加分块数据接收回调
      if (this.request && typeof this.request.onChunkReceived === 'function') {
        console.log('设置onChunkReceived回调处理分块数据');
        this.request.onChunkReceived((chunk) => {
          // 改进数据提取逻辑，处理不同的数据结构
          let chunkData = null;
          
          if (chunk && chunk.data) {
            // 标准结构：{ data: ArrayBuffer/Uint8Array/String }
            chunkData = chunk.data;
            console.log('收到分块数据（chunk.data），长度:', chunkData.byteLength || chunkData.length || 0);
          } else if (chunk instanceof ArrayBuffer) {
            // 直接是ArrayBuffer
            chunkData = chunk;
            console.log('收到分块数据（ArrayBuffer），长度:', chunkData.byteLength);
          } else if (chunk instanceof Uint8Array) {
            // 直接是Uint8Array
            chunkData = chunk;
            console.log('收到分块数据（Uint8Array），长度:', chunkData.length);
          } else if (typeof chunk === 'string') {
            // 直接是字符串
            chunkData = chunk;
            console.log('收到分块数据（String），长度:', chunkData.length);
          } else {
            // 其他情况，尝试直接使用
            chunkData = chunk;
            console.log('收到分块数据（其他类型），类型:', typeof chunk, '，内容:', chunk);
          }
          
          // 处理分块数据
          this._processChunkData(chunkData);
        });
      } else {
        console.warn('当前环境不支持onChunkReceived，将使用success回调作为后备方案');
      }
      
    } catch (error) {
      console.error('建立SSE连接失败:', error);
      this._handleError(error);
    }
  }

  /**
   * 处理SSE流式响应数据
   */
  _processSSEResponse(responseData) {
    console.log('===== 开始处理SSE响应 =====');
    console.log('响应数据:', responseData);
    
    if (!responseData) {
      console.log('响应数据为空，结束处理');
      this.close();
      return;
    }

    try {
      // 将响应数据设置为消息缓冲区
      this.messageBuffer = responseData;
      this._processMessageBuffer();
      
      // 处理完成后关闭连接
      console.log('SSE响应处理完成，关闭连接');
      this.close();
    } catch (error) {
      console.error('处理SSE响应失败:', error);
      this._handleError(error);
    }
  }

  /**
   * 处理消息缓冲区，解析SSE事件
   */
  _processMessageBuffer() {
    console.log('===== 处理消息缓冲区 =====');
    console.log('缓冲区长度:', this.messageBuffer.length);
    console.log('缓冲区预览:', this.messageBuffer.substring(0, 200) + (this.messageBuffer.length > 200 ? '...' : ''));
    
    if (!this.messageBuffer) {
      console.log('消息缓冲区为空');
      return;
    }

    // 按行分割数据
    const lines = this.messageBuffer.split('\n');
    console.log('分割后行数:', lines.length);
    
    let event = {};
    let hasValidEvent = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 空行表示一个事件的结束
      if (line === '') {
        if (hasValidEvent) {
          console.log('处理SSE事件:', event);
          this._handleSSEEvent(event);
          event = {};
          hasValidEvent = false;
        }
        continue;
      }
      
      // 跳过注释行（以:开头）
      if (line.startsWith(':')) {
        console.log('跳过注释行:', line);
        continue;
      }
      
      // 解析SSE字段：field: value
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const field = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        
        if (field === 'data') {
          event.data = (event.data || '') + value;
          hasValidEvent = true;
        } else if (field === 'event') {
          event.event = value;
          hasValidEvent = true;
        } else if (field === 'id') {
          event.id = value;
          hasValidEvent = true;
        } else if (field === 'retry') {
          event.retry = parseInt(value);
          hasValidEvent = true;
        }
      }
    }
    
    // 处理最后一个事件（如果没有以空行结尾）
    if (hasValidEvent) {
      console.log('处理最后一个SSE事件:', event);
      this._handleSSEEvent(event);
    }
    
    console.log('消息缓冲区处理完成');
  }

  /**
   * 处理SSE事件
   */
  _handleSSEEvent(eventType, eventData) {
    try {
      console.log('===== 处理SSE事件 =====');
      console.log('事件类型:', eventType);
      console.log('事件原始数据:');
      console.log(eventData);
      
      // 跳过空事件
      if (!eventData || eventData.trim() === '') {
        console.log('跳过空事件数据');
        return;
      }
      
      // 尝试解析事件数据
      let parsedData = null;
      
      try {
        // 直接尝试JSON解析
        parsedData = JSON.parse(eventData);
        console.log('直接JSON解析成功:');
        console.log(parsedData);
      } catch (jsonError) {
        console.log('直接JSON解析失败，尝试处理ChatResponse格式');
        
        // 处理ChatResponse[answer=xxx, docAggs=[...]]格式
        if (eventData.includes('ChatResponse[')) {
          try {
            parsedData = this._parseChatResponse(eventData);
            console.log('ChatResponse格式解析成功:');
            console.log(parsedData);
          } catch (chatResponseError) {
            console.error('ChatResponse格式解析失败:', chatResponseError);
            console.log('原始数据:', eventData);
            return;
          }
        } else {
          console.error('无法解析的事件数据格式:', eventData);
          return;
        }
      }
      
      // 如果解析失败，跳过
      if (!parsedData) {
        console.log('事件数据解析失败，跳过');
        return;
      }
      
      // 显示解析后的JSON对象
      console.log('解析后的JSON对象:');
      console.log(parsedData);
      
      // 检查是否为结束标识
      const isEndSignal = this._checkEndSignal(parsedData);
      if (isEndSignal) {
        console.log('检测到流结束标识，立即结束连接');
        this._forceCloseAndComplete();
        return;
      }
      
      // 转换数据格式：将ChatResponse格式转换为标准消息格式
      const messageData = {
        content: parsedData.answer || parsedData.content || '',
        role: 'assistant',
        docAggs: parsedData.docAggs || [] // 直接传递原始的docAggs格式
      };
      
      console.log('转换后的消息数据:');
      console.log(messageData);
      
      // 触发数据事件，传递转换后的数据
      if (this.onData) {
        console.log('调用onData回调，传递消息数据');
        this.onData(messageData);
      }
      
    } catch (error) {
      console.error('处理SSE事件时出错:', error);
      console.log('错误的事件数据:', eventData);
    }
  }
  
  /**
   * 检查是否为流结束标识
   * 根据后端代码分析，结束条件是：data字段为true
   * 后端使用SSE_DONE_PREDICATE检查data字段是否为true来停止流
   */
  _checkEndSignal(parsedData) {
    if (!parsedData || typeof parsedData !== 'object') {
      return false;
    }
    
    // 主要结束条件：检查data字段是否为true（后端的实际停止机制）
    const dataFieldIsTrue = parsedData.data === true;
    
    // 备用结束条件：answer是null且docAggs也是null或空数组（用户之前提到的条件）
    const answer = parsedData.answer;
    const docAggs = parsedData.docAggs;
    const answerIsNull = answer === null || answer === undefined;
    const docAggsIsNullOrEmpty = docAggs === null || 
                                 docAggs === undefined || 
                                 (Array.isArray(docAggs) && docAggs.length === 0);
    const alternativeEndCondition = answerIsNull && docAggsIsNullOrEmpty;
    
    // 任何一个结束条件满足都认为是流结束
    const isEndSignal = dataFieldIsTrue || alternativeEndCondition;
    
    console.log('结束信号检测:', {
      data: parsedData.data,
      dataFieldIsTrue: dataFieldIsTrue,
      answer: answer,
      answerIsNull: answerIsNull,
      docAggs: docAggs,
      docAggsIsNullOrEmpty: docAggsIsNullOrEmpty,
      alternativeEndCondition: alternativeEndCondition,
      isEndSignal: isEndSignal
    });
    
    if (dataFieldIsTrue) {
      console.log('检测到后端主要结束标识: data=true');
    } else if (alternativeEndCondition) {
      console.log('检测到备用结束标识: answer=null && docAggs=null/[]');
    }
    
    return isEndSignal;
  }

  /**
   * 解析ChatResponse格式的数据
   */
  _parseChatResponse(chatResponseStr) {
    console.log('开始解析ChatResponse格式:', chatResponseStr);
    
    // 移除ChatResponse[和最后的]
    let content = chatResponseStr;
    if (content.startsWith('ChatResponse[')) {
      content = content.substring(13); // 移除"ChatResponse["
    }
    if (content.endsWith(']')) {
      content = content.substring(0, content.length - 1); // 移除最后的"]"
    }
    
    console.log('移除包装后的内容:', content);
    
    const result = {
      answer: null,
      docAggs: null,
      data: null // 添加data字段解析
    };
    
    // 解析answer字段，正确处理null值
    const answerMatch = content.match(/answer=([^,]*?)(?=,\s*(?:docAggs|data)=|$)/s);
    if (answerMatch && answerMatch[1] !== undefined) {
      const answerValue = answerMatch[1].trim();
      if (answerValue === 'null') {
        result.answer = null;
        console.log('提取的answer: null');
      } else {
        result.answer = answerValue;
        console.log('提取的answer:', result.answer);
      }
    }
    
    // 解析docAggs字段，正确处理null值和空数组
    const docAggsMatch = content.match(/docAggs=([^,]*?)(?=,\s*data=|$)/s);
    if (docAggsMatch && docAggsMatch[1] !== undefined) {
      const docAggsValue = docAggsMatch[1].trim();
      
      if (docAggsValue === 'null') {
        result.docAggs = null;
        console.log('提取的docAggs: null');
      } else if (docAggsValue === '[]') {
        result.docAggs = [];
        console.log('提取的docAggs: []');
      } else if (docAggsValue.startsWith('[') && docAggsValue.endsWith(']')) {
        try {
          console.log('docAggs字符串:', docAggsValue);
          
          // 简单的docAggs解析（处理DocAgg[doc_name=xxx, doc_id=xxx, count=xxx]格式）
          const docAggItems = [];
          const docAggMatches = docAggsValue.match(/DocAgg\[[^\]]+\]/g);
          
          if (docAggMatches) {
            for (const docAggMatch of docAggMatches) {
              console.log('处理DocAgg项:', docAggMatch);
              
              const docAgg = {};
              
              // 提取doc_name
              const nameMatch = docAggMatch.match(/doc_name=([^,\]]+)/);
              if (nameMatch) {
                docAgg.doc_name = nameMatch[1].trim();
              }
              
              // 提取doc_id
              const idMatch = docAggMatch.match(/doc_id=([^,\]]+)/);
              if (idMatch) {
                docAgg.doc_id = idMatch[1].trim();
              }
              
              // 提取count
              const countMatch = docAggMatch.match(/count=(\d+)/);
              if (countMatch) {
                docAgg.count = parseInt(countMatch[1]);
              }
              
              console.log('解析的DocAgg对象:', docAgg);
              docAggItems.push(docAgg);
            }
          }
          
          result.docAggs = docAggItems;
          console.log('最终的docAggs数组:', result.docAggs);
          
        } catch (docAggsError) {
          console.error('解析docAggs失败:', docAggsError);
          result.docAggs = [];
        }
      } else {
        console.warn('未识别的docAggs格式:', docAggsValue);
        result.docAggs = [];
      }
    }
    
    // 解析data字段（后端用来标识流结束）
    const dataMatch = content.match(/data=([^,]*?)(?:,|$)/s);
    if (dataMatch && dataMatch[1] !== undefined) {
      const dataValue = dataMatch[1].trim();
      if (dataValue === 'true') {
        result.data = true;
        console.log('提取的data: true (流结束标识)');
      } else if (dataValue === 'false') {
        result.data = false;
        console.log('提取的data: false');
      } else if (dataValue === 'null') {
        result.data = null;
        console.log('提取的data: null');
      } else {
        result.data = dataValue;
        console.log('提取的data:', result.data);
      }
    }
    
    console.log('ChatResponse解析结果:', result);
    return result;
  }

  /**
   * 重置数据超时
   */
  _resetDataTimeout() {
    if (this.dataTimeout) {
      clearTimeout(this.dataTimeout);
    }
    
    // 根据数据接收状态设置不同的超时时间
    let timeoutDuration;
    
    if (!this.hasReceivedData) {
      // 还没收到任何数据，给30秒建立连接时间
      timeoutDuration = 30000;
    } else {
      // 已经收到数据了，给8秒等待后续数据（减少超时时间）
      timeoutDuration = 8000;
    }
    
    console.log(`设置数据超时时间: ${timeoutDuration}ms (已收到数据: ${this.hasReceivedData})`);
    
    // 重新设置数据超时
    this.dataTimeout = setTimeout(() => {
      if (!this.completed && this.connected) {
        const timeSinceLastData = Date.now() - this.lastDataTime;
        console.log(`数据超时触发，距离上次数据: ${timeSinceLastData}ms`);
        
        if (this.hasReceivedData && timeSinceLastData > timeoutDuration - 1000) {
          console.log('流式数据接收完成，主动结束连接');
        } else {
          console.log('初始连接超时，主动结束连接');
        }
        
        // 主动关闭连接
        this.close();
      }
    }, timeoutDuration);
  }

  /**
   * 监控连接状态和超时 - 启动连接监控
   */
  _startConnectionMonitoring() {
    console.log('启动SSE连接监控');
    
    // 设置整体超时（总超时时间）
    if (this.timeout && this.timeout > 0) {
      this.connectionTimeout = setTimeout(() => {
        if (!this.completed) {
          console.log(`SSE连接总超时 (${this.timeout}ms)，主动关闭`);
          this.close();
        }
      }, this.timeout);
      
      console.log(`设置总超时时间: ${this.timeout}ms`);
    }

    // 初始数据接收超时
    this._resetDataTimeout();
  }

  /**
   * 处理错误
   */
  _handleError(error) {
    // 如果连接已经完成，不再处理错误（避免abort引起的误报错误）
    if (this.completed) {
      console.log('连接已完成，忽略后续错误:', error);
      return;
    }
    
    console.error('SSE错误:', error);
    
    this.connected = false;
    
    // 检查是否是主动abort引起的错误
    if (error && error.errMsg && error.errMsg.includes('abort')) {
      console.log('检测到abort错误，可能是正常的强制关闭，不触发错误回调');
      return;
    }
    
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
    
    // 禁用重试机制，直接关闭连接
    console.log('发生错误，不重试，直接关闭连接');
    this.close();
  }

  /**
   * 处理分块数据（来自onChunkReceived回调）
   */
  _processChunkData(chunkData) {
    console.log('===== 处理分块数据 =====');
    
    // 如果已经完成，拒绝处理任何数据
    if (this.completed) {
      console.log('连接已完成，拒绝处理分块数据');
      this._forceDisconnect(); // 强制断开连接
      return;
    }
    
    // 增强的数据类型检测
    const isArrayBuffer = chunkData instanceof ArrayBuffer;
    const isUint8Array = chunkData instanceof Uint8Array || 
                        (chunkData && chunkData.constructor && chunkData.constructor.name === 'Uint8Array') ||
                        (chunkData && typeof chunkData === 'object' && chunkData.buffer instanceof ArrayBuffer) ||
                        (chunkData && chunkData.BYTES_PER_ELEMENT === 1 && typeof chunkData.length === 'number');
    
    let textData = '';
    
    try {
      // 检查数据类型并转换
      if (isArrayBuffer) {
        console.log('检测到ArrayBuffer数据，长度:', chunkData.byteLength);
        
        // 检查是否为空数据
        if (chunkData.byteLength === 0) {
          console.log('收到空的ArrayBuffer数据');
          this._handleEmptyData();
          return;
        }
        
        // 将ArrayBuffer转换为Uint8Array，然后转换为UTF-8文本
        try {
          const uint8Array = new Uint8Array(chunkData);
          const decoder = new TextDecoder('utf-8');
          textData = decoder.decode(uint8Array);
          console.log('ArrayBuffer -> UTF-8转换成功，文本长度:', textData.length);
          
          // 显示转换后的文本内容（前100个字符）
          console.log('转换后的文本预览:', textData.substring(0, 100) + (textData.length > 100 ? '...' : ''));
          
        } catch (decodeError) {
          console.warn('ArrayBuffer转换失败，尝试手动转换');
          // 手动转换ArrayBuffer为字符串（备用方案）
          const uint8Array = new Uint8Array(chunkData);
          textData = String.fromCharCode.apply(null, Array.from(uint8Array));
          console.log('手动转换成功，文本长度:', textData.length);
        }
      } else if (isUint8Array) {
        console.log('检测到Uint8Array数据，长度:', chunkData.length);
        
        // 检查是否为空数据
        if (chunkData.length === 0) {
          console.log('收到空的Uint8Array数据');
          this._handleEmptyData();
          return;
        }
        
        // 使用TextDecoder转换为UTF-8文本
        try {
          const decoder = new TextDecoder('utf-8');
          textData = decoder.decode(chunkData);
          console.log('Uint8Array -> UTF-8转换成功，文本长度:', textData.length);
          
          // 显示转换后的文本内容（前100个字符）
          console.log('转换后的文本预览:', textData.substring(0, 100) + (textData.length > 100 ? '...' : ''));
          
        } catch (decodeError) {
          console.warn('Uint8Array转换失败，尝试手动转换');
          // 手动转换Uint8Array为字符串（备用方案）
          textData = String.fromCharCode.apply(null, Array.from(chunkData));
          console.log('手动转换成功，文本长度:', textData.length);
        }
      } else if (typeof chunkData === 'string') {
        textData = chunkData;
        console.log('分块数据已是字符串，长度:', textData.length);
        console.log('字符串内容预览:', textData.substring(0, 100) + (textData.length > 100 ? '...' : ''));
      } else if (typeof chunkData === 'object' && chunkData && chunkData.data) {
        textData = chunkData.data;
        console.log('从data字段提取的文本，长度:', textData.length);
        console.log('文本内容预览:', textData.substring(0, 100) + (textData.length > 100 ? '...' : ''));
      } else if (!chunkData || chunkData === null || chunkData === undefined) {
        console.log('收到null/undefined数据');
        this._handleEmptyData();
        return;
      } else {
        // 尝试强制转换，但先检查是否真的可以转换
        console.log('未知数据类型，尝试强制转换:', typeof chunkData, chunkData.constructor?.name);
        textData = String(chunkData);
        console.log('强制转换结果:', textData.substring(0, 100) + (textData.length > 100 ? '...' : ''));
        
        // 如果转换结果是 "[object ArrayBuffer]" 这样的无用字符串，说明转换失败
        if (textData === '[object ArrayBuffer]' || textData === '[object Object]') {
          console.error('数据转换失败，无法处理该类型的数据');
          this._handleEmptyData();
          return;
        }
      }
      
      // 检查转换后的文本是否为空
      if (!textData || textData.trim() === '') {
        console.log('转换后的文本为空');
        this._handleEmptyData();
        return;
      }
      
      // 检查是否为心跳消息，如果是则直接跳过
      // 后端心跳格式：comment: keep-alive（每15秒发送一次）
      if (textData && (textData.trim() === ':keep-alive' || 
                       textData.trim().startsWith(': keep-alive') ||
                       textData.trim().startsWith(':keep-alive') ||
                       textData.includes('comment: keep-alive'))) {
        console.log('收到心跳消息，直接跳过不处理');
        
        // 如果已经完成但仍收到心跳，说明连接没有正确关闭，强制断开
        if (this.completed) {
          console.log('流已完成但仍收到心跳，强制断开连接');
          this._forceDisconnect();
        }
        
        return; // 不处理心跳消息，不更新任何时间或状态
      }
      
      // 重置空数据计数（收到有效数据）
      this.emptyDataCount = 0;
      
      // 累积到消息缓冲区
      this.messageBuffer += textData;
      
      // 更新数据接收时间
      this.lastDataTime = Date.now();
      this.hasReceivedData = true;
      
      // 只有收到实际数据时才重置超时
      this._resetDataTimeout();
      
      // 尝试解析缓冲区中的完整SSE事件
      this._parseBufferedEvents();
      
    } catch (error) {
      console.error('处理分块数据失败:', error);
      // 继续处理，不中断流
    }
  }
  
  /**
   * 处理空数据
   */
  _handleEmptyData() {
    this.emptyDataCount = (this.emptyDataCount || 0) + 1;
    console.log(`收到第${this.emptyDataCount}个空数据`);
    
    // 由于现在有了明确的结束标识(answer=null, docAggs=null/[])
    // 可以适当放宽空数据的结束条件，避免过早结束
    // 连续3次空数据才认为是流结束（给更多容错空间）
    if (this.emptyDataCount >= 3) {
      console.log('连续收到3个空数据，流可能结束，强制断开连接');
      this._forceCloseAndComplete();
    } else {
      console.log(`收到第${this.emptyDataCount}个空数据，等待更多数据或明确结束标识`);
    }
  }

  /**
   * 解析缓冲区中的完整SSE事件
   */
  _parseBufferedEvents() {
    if (!this.messageBuffer) {
      return;
    }
    
    try {
      // 按双换行符分割事件（SSE标准）
      const events = this.messageBuffer.split('\n\n');
      
      // 保留最后一个可能不完整的事件
      this.messageBuffer = events.pop() || '';
      
      // 处理完整的事件
      for (const eventText of events) {
        if (eventText.trim()) {
          this._parseSSEEvent(eventText.trim());
        }
      }
    } catch (error) {
      console.error('解析缓冲区事件失败:', error);
    }
  }

  /**
   * 处理单个SSE事件文本
   */
  _parseSSEEvent(eventText) {
    try {
      const lines = eventText.split('\n');
      const event = {};
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 跳过注释行（以:开头的行）
        if (trimmedLine.startsWith(':')) {
          continue;
        }
        
        // 解析字段
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex !== -1) {
          const field = trimmedLine.substring(0, colonIndex).trim();
          const value = trimmedLine.substring(colonIndex + 1).trim();
          
          if (field === 'data') {
            event.data = (event.data || '') + value;
          } else if (field === 'event') {
            event.event = value;
          } else if (field === 'id') {
            event.id = value;
          } else if (field === 'retry') {
            event.retry = parseInt(value);
          }
        }
      }
      
      // 如果有有效的事件数据，处理它
      if (event.data) {
        this._handleSSEEvent(event.event, event.data);
      }
    } catch (error) {
      console.error('解析SSE事件失败:', error);
    }
  }

  /**
   * 安全关闭连接
   */
  close() {
    if (this.completed) {
      console.log('连接已关闭，避免重复关闭');
      return;
    }
    
    console.log('开始关闭SSE连接');
    this.completed = true;
    
    // 清除所有计时器
    this._clearAllTimers();
    
    // 尝试多种方式关闭请求
    if (this.request) {
      try {
        // 尝试abort方法
        if (typeof this.request.abort === 'function') {
          this.request.abort();
          console.log('使用abort()关闭请求');
        }
        // 尝试close方法
        else if (typeof this.request.close === 'function') {
          this.request.close();
          console.log('使用close()关闭请求');
        }
        // 尝试cancel方法
        else if (typeof this.request.cancel === 'function') {
          this.request.cancel();
          console.log('使用cancel()关闭请求');
        }
        // 尝试直接设置状态
        else if (this.request.readyState !== undefined) {
          console.log('设置请求状态为终止');
        }
        
        // 清除请求对象引用
        this.request = null;
        
      } catch (error) {
        console.error('关闭请求时出错:', error);
      }
    }
    
    // 清空缓冲区
    this.messageBuffer = '';
    
    // 触发完成回调
    try {
      if (this.callbacks && typeof this.callbacks.onComplete === 'function') {
        console.log('触发onComplete回调');
        this.callbacks.onComplete();
      }
    } catch (error) {
      console.error('onComplete回调执行失败:', error);
    }
    
    console.log('SSE连接关闭完成');
  }

  /**
   * 清除所有计时器
   */
  _clearAllTimers() {
    // 清除连接超时计时器
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // 清除数据接收超时计时器
    if (this.dataTimeout) {
      clearTimeout(this.dataTimeout);
      this.dataTimeout = null;
    }
    
    // 清除重试超时计时器
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    // 清除有效消息超时计时器
    if (this.validMessageTimeout) {
      clearTimeout(this.validMessageTimeout);
      this.validMessageTimeout = null;
    }
    
    // 清除连接监控间隔计时器（如果存在）
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // 清除心跳计时器（如果存在）
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    console.log('所有计时器已清除');
  }

  /**
   * 强制清除所有相关连接和计时器，并标记为成功完成
   */
  _forceCloseAndComplete() {
    if (this.completed) {
      console.log('连接已完成，避免重复强制关闭');
      return;
    }
    
    console.log('开始强制清除所有相关连接和计时器');
    
    // 立即标记为完成，防止其他操作
    this.completed = true;
    this.connected = false;
    
    // 先触发完成回调，再关闭连接，避免abort触发错误回调
    try {
      if (this.callbacks && typeof this.callbacks.onComplete === 'function') {
        console.log('强制触发onComplete回调，标记为成功完成');
        this.callbacks.onComplete();
      }
    } catch (error) {
      console.error('强制执行onComplete回调失败:', error);
    }
    
    // 清除所有计时器
    this._clearAllTimers();
    
    // 延迟一点再关闭连接，确保onComplete回调先执行
    setTimeout(() => {
      // 强制关闭请求连接
      if (this.request) {
        try {
          // 尝试多种方式关闭请求
          if (typeof this.request.abort === 'function') {
            this.request.abort();
            console.log('使用abort()强制关闭请求');
          } else if (typeof this.request.close === 'function') {
            this.request.close();
            console.log('使用close()强制关闭请求');
          } else if (typeof this.request.cancel === 'function') {
            this.request.cancel();
            console.log('使用cancel()强制关闭请求');
          }
          
          // 清除请求对象引用
          this.request = null; 
          
        } catch (error) {
          console.error('强制关闭请求时出错:', error);
          // 继续执行，不让错误阻止清理过程
        }
      }
      
      // 清空缓冲区
      this.messageBuffer = '';
      this.emptyMessageCount = 0;
      
      console.log('强制清除完成，连接已成功结束');
      
      // 再次确保连接彻底断开
      setTimeout(() => {
        if (this.request) {
          console.log('检测到连接未完全断开，执行彻底断开');
          this._forceDisconnect();
        }
      }, 100);
    }, 10); // 延迟10毫秒
  }

  /**
   * 重置有效消息超时计时器
   * 在收到有效消息后2秒内如果没有新的有效消息，就强制断开连接
   */
  _resetValidMessageTimeout() {
    // 清除之前的计时器
    if (this.validMessageTimeout) {
      clearTimeout(this.validMessageTimeout);
    }
    
    console.log('设置有效消息2秒超时计时器');
    
    // 设置2秒超时
    this.validMessageTimeout = setTimeout(() => {
      if (!this.completed && this.connected) {
        const timeSinceLastValidMessage = Date.now() - this.lastValidMessageTime;
        console.log(`有效消息2秒超时触发，距离上次有效消息: ${timeSinceLastValidMessage}ms`);
        console.log('最后一个有效消息后2秒内无新消息，强制断开连接');
        
        // 强制断开连接
        this._forceCloseAndComplete();
      }
    }, 2000);
  }

  /**
   * 强制断开连接（比_forceCloseAndComplete更彻底）
   */
  _forceDisconnect() {
    console.log('开始强制断开连接');
    
    // 立即标记为完成
    this.completed = true;
    this.connected = false;
    
    // 清除所有计时器
    this._clearAllTimers();
    
    // 强制关闭并清除请求对象
    if (this.request) {
      try {
        // 清除onChunkReceived回调，停止接收数据
        if (typeof this.request.offChunkReceived === 'function') {
          this.request.offChunkReceived();
          console.log('已清除onChunkReceived回调');
        }
        
        // 尝试多种方式强制关闭
        if (typeof this.request.abort === 'function') {
          this.request.abort();
          console.log('已调用abort()');
        }
        
        // 强制设置为null，断开引用
        this.request = null;
        console.log('已清除request对象引用');
        
      } catch (error) {
        console.error('强制断开连接时出错:', error);
      }
    }
    
    // 清空所有状态
    this.messageBuffer = '';
    this.emptyMessageCount = 0;
    this.emptyDataCount = 0;
    
    console.log('强制断开连接完成');
  }
}

// 登录管理器
const loginManager = {
  isLoggingIn: false,
  pendingRequests: [],
  
  resetLoginState() {
    this.isLoggingIn = false;
    this.clearPendingRequests();
  },
  
  addPendingRequest(requestPromise) {
    this.pendingRequests.push(requestPromise);
  },
  
  clearPendingRequests() {
    this.pendingRequests = [];
  },
  
  performLogin() {
    return new Promise((resolve, reject) => {
      if (this.isLoggingIn) {
        console.log('正在登录中，等待登录完成...');
        this.addPendingRequest({ resolve, reject });
        return;
    }
    
    this.isLoggingIn = true;
      
      // 尝试自动登录
      wxLoginApi.wxLogin()
        .then((result) => {
          this.isLoggingIn = false;
          resolve(result);
          
          // 处理等待中的请求
          this.pendingRequests.forEach(pending => {
            pending.resolve(result);
          });
          this.clearPendingRequests();
        })
        .catch((error) => {
          this.isLoggingIn = false;
          reject(error);
          
          // 处理等待中的请求
          this.pendingRequests.forEach(pending => {
            pending.reject(error);
          });
          this.clearPendingRequests();
        });
    });
  },
  
  performManualLogin() {
    return new Promise((resolve, reject) => {
      if (this.isLoggingIn) {
        console.log('正在登录中，等待登录完成...');
        this.addPendingRequest({ resolve, reject });
        return;
    }
    
    this.isLoggingIn = true;
      
      wx.showModal({
        title: '需要登录',
        content: '您的登录信息已过期，是否重新登录？',
        confirmText: '登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.attemptManualLoginWithRetry()
              .then((result) => {
                this.isLoggingIn = false;
                resolve(result);
                
                // 处理等待中的请求
                this.pendingRequests.forEach(pending => {
                  pending.resolve(result);
                });
                this.clearPendingRequests();
        })
        .catch((error) => {
                this.isLoggingIn = false;
          reject(error);
                
                // 处理等待中的请求
                this.pendingRequests.forEach(pending => {
                  pending.reject(error);
                });
                this.clearPendingRequests();
              });
          } else {
            this.isLoggingIn = false;
            const cancelError = new Error('用户取消登录');
            reject(cancelError);
            
            // 处理等待中的请求
            this.pendingRequests.forEach(pending => {
              pending.reject(cancelError);
            });
            this.clearPendingRequests();
          }
        }
      });
    });
  },
  
  attemptManualLoginWithRetry(maxRetries = Infinity) {
    return new Promise((resolve, reject) => {
      let retryCount = 0;
      
      const attemptLogin = () => {
        console.log(`尝试登录，第 ${retryCount + 1} 次`);
        
        wxLoginApi.wxLogin()
          .then((result) => {
            console.log('登录成功:', result);
            resolve(result);
          })
          .catch((error) => {
            console.error(`登录失败，第 ${retryCount + 1} 次:`, error);
            retryCount++;
            
            if (retryCount < maxRetries) {
            wx.showModal({
              title: '登录失败',
                content: `登录失败: ${error.message}，是否重试？`,
              confirmText: '重试',
              cancelText: '取消',
              success: (res) => {
                if (res.confirm) {
                    setTimeout(attemptLogin, 1000);
                } else {
                    reject(new Error('用户取消重试'));
                  }
                }
              });
            } else {
              reject(error);
            }
          });
      };
      
      attemptLogin();
    });
  }
};

const request = (url, method, data, showLoading = true, requireLogin = true) => {
  return new Promise((resolve, reject) => {
    const executeRequest = (loginResult) => {
      const requestOptions = {
        url,
        method,
        data,
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
      if (showLoading) {
            wx.hideLoading();
          }
          
          try {
            const responseData = standardizeResponseData(res.data);
            
            // 根据接口文档和实际使用情况，支持多种成功状态码
            if (responseData.code === 20000 || responseData.code === 0 || responseData.code === '0') {
              resolve(responseData.data || responseData);
            } else {
              const errorMessage = getReadableErrorMessage(responseData);
              console.error('API请求失败:', errorMessage);
              reject(new Error(errorMessage));
            }
          } catch (parseError) {
            console.error('解析响应数据失败:', parseError);
            reject(new Error('服务器响应格式错误'));
          }
        },
        fail: (err) => {
        if (showLoading) {
          wx.hideLoading();
        }
          
          console.error('网络请求失败:', err);
          
          let errorMessage = '网络请求失败';
          if (err.errMsg) {
            if (err.errMsg.includes('timeout')) {
              errorMessage = '请求超时，请检查网络连接';
            } else if (err.errMsg.includes('fail')) {
              errorMessage = '网络连接失败，请检查网络设置';
            } else {
              errorMessage = err.errMsg;
            }
          }
          
          reject(new Error(errorMessage));
        }
      };
      
      // 如果需要登录且有JWT，添加到请求头
      if (requireLogin && loginResult && loginResult.jwt) {
        requestOptions.header['Authorization'] = `Bearer ${loginResult.jwt}`;
      } else if (requireLogin) {
        // 尝试从本地存储获取JWT
        try {
          const storedJWT = wx.getStorageSync('wxJWT');
          if (storedJWT) {
            requestOptions.header['Authorization'] = `Bearer ${storedJWT}`;
          }
        } catch (storageError) {
          console.warn('获取本地JWT失败:', storageError);
        }
      }
      
          if (showLoading) {
        wx.showLoading({ title: '请求中...' });
      }
      
      wx.request(requestOptions);
    };
    
    // 标准化响应数据格式
    function standardizeResponseData(data) {
      if (!data) {
        return { code: -1, message: '服务器无响应', data: null };
      }
      
      // 如果已经是标准格式，直接返回
      if (typeof data === 'object' && data.hasOwnProperty('code')) {
        return data;
      }
      
      // 如果是数组，包装成标准格式
      if (Array.isArray(data)) {
        return { code: 20000, message: 'success', data: data };
      }
      
      // 如果是其他对象，包装成标准格式
      if (typeof data === 'object') {
        return { code: 20000, message: 'success', data: data };
      }
      
      // 其他情况，包装成标准格式
      return { code: 20000, message: 'success', data: data };
    }
    
    // 获取可读的错误信息
    function getReadableErrorMessage(responseData) {
      if (responseData.message) {
        return responseData.message;
      }
      
      if (responseData.msg) {
        return responseData.msg;
      }
      
      if (responseData.error) {
        return responseData.error;
      }
      
      return `请求失败 (错误码: ${responseData.code})`;
    }
    
    // 如果不需要登录，直接执行请求
    if (!requireLogin) {
      executeRequest(null);
      return;
    }
    
    // 检查是否已有有效的登录状态
    const loginStatus = wxLoginApi.checkLoginStatus();
    if (loginStatus) {
      executeRequest(loginStatus);
      return;
    }
    
    // 需要登录但没有有效登录状态，尝试自动登录
    console.log('需要登录，尝试自动登录...');
    
    loginManager.performLogin()
        .then((loginResult) => {
        console.log('自动登录成功，执行原始请求');
          executeRequest(loginResult);
        })
      .catch((loginError) => {
        console.error('自动登录失败:', loginError);
        
        // 自动登录失败，尝试手动登录
        loginManager.performManualLogin()
          .then((loginResult) => {
            console.log('手动登录成功，执行原始请求');
            executeRequest(loginResult);
          })
          .catch((manualLoginError) => {
            console.error('手动登录失败:', manualLoginError);
            reject(new Error(`登录失败: ${manualLoginError.message}`));
          });
      });
  });
};

// 数据集相关API - 根据接口文档更新
export const datasetApi = {
  // 获取数据集列表
  listDatasets: (params) => {
    return request(`${baseUrl}/list/dataset`, 'POST', params, true, true);
  },
  
  // 根据ID获取数据集详情（通过listDatasets实现）
  getDatasetById: (id) => {
    return request(`${baseUrl}/list/dataset`, 'POST', { 
      id: id,
      page: 1, 
      page_size: 1 
    }, true, true);
  },
  
  // 获取数据集列表（兼容TypeScript版本，修正：使用POST请求）
  getDatasets: (params = {}) => {
    return request(`${baseUrl}/list/dataset`, 'POST', {
      page: 1,
      page_size: 50,
      ...params
    }, true, true);
  },
  
  // 创建数据集
  createDataset: (datasetData) => {
    return request(`${baseUrl}/create/dataset`, 'POST', datasetData, true, true);
  },
  
  // 更新数据集
  updateDataset: (id, datasetData) => {
    return request(`${baseUrl}/update/dataset/${id}`, 'PUT', datasetData, true, true);
  },
  
  // 删除数据集
  deleteDataset: (ids) => {
    return request(`${baseUrl}/delete/dataset`, 'DELETE', { ids }, true, true);
  }
};

// 文档相关API - 根据接口文档更新
export const documentApi = {
  // 获取文档列表
  listDocuments: (datasetId, params) => {
    return request(`${baseUrl}/list/document/${datasetId}`, 'POST', params, true, true);
  },
  
  // 更新文档
  updateDocument: (datasetId, documentId, documentData) => {
    return request(`${baseUrl}/update/document/${datasetId}/${documentId}`, 'PUT', documentData, true, true);
  },
  
  // 下载文档
  downloadDocument: (datasetId, documentId) => {
    return request(`${baseUrl}/download/document/${datasetId}/${documentId}`, 'GET', null, true, true);
  },
  
  // 删除文档
  deleteDocument: (datasetId, documentIds) => {
    return request(`${baseUrl}/delete/document/${datasetId}`, 'DELETE', { ids: documentIds }, true, true);
  },
  
  // 解析文档
  parseDocument: (datasetId, documentIds) => {
    return request(`${baseUrl}/parse/document/${datasetId}`, 'POST', { document_ids: documentIds }, true, true);
  },
  
  // 停止解析文档
  stopParseDocument: (datasetId, documentIds) => {
    return request(`${baseUrl}/parse/document/stop/${datasetId}`, 'POST', { document_ids: documentIds }, true, true);
  }
};

// 聊天助手相关API
export const chatAssistantApi = {
  // 获取聊天助手列表
  listAssistants: (params) => {
    return request(`${baseUrl}/list/assistant`, 'POST', params, true, true);
  },
  
  // 获取聊天助手列表（兼容TypeScript版本的不同端点）
  getAssistants: (params) => {
    return request(`${baseUrl}/list/assistant`, 'POST', params, true, true);
  },
  
  // 创建聊天助手
  createAssistant: (assistantData) => {
    return request(`${baseUrl}/create/assistant`, 'POST', assistantData, true, true);
  },
  
  // 更新聊天助手
  updateAssistant: (chatId, assistantData) => {
    return request(`${baseUrl}/update/assistant/${chatId}`, 'POST', assistantData, true, true);
  },
  
  // 删除聊天助手
  deleteAssistant: (ids) => {
    return request(`${baseUrl}/delete/assistant`, 'DELETE', { ids }, true, true);
  }
};

// 会话相关API
export const sessionApi = {
  // 获取会话列表
  listSessions: (params) => {
    return request(`${baseUrl}/list/session`, 'POST', params, true, true);
  },
  
  // 获取特定会话的详情和消息（修正：根据API文档调整参数）
  getSessionDetail: (chatId, sessionId) => {
    if (sessionId) {
      // 传入sessionId时，获取特定会话的消息，使用id参数
      return request(`${baseUrl}/list/session`, 'POST', {
        chat_id: chatId,
        id: sessionId, // 使用id参数而不是conversation_id，匹配API文档
        page: 1,
        page_size: 100 // 获取会话的所有消息
      }, true, true);
    } else {
      // 不传sessionId时，获取会话列表
      return request(`${baseUrl}/list/session`, 'POST', {
        chat_id: chatId,
        page: 1,
        page_size: 100
      }, true, true);
    }
  },
  
  // 获取会话消息（兼容TypeScript版本的调用，修正：使用POST请求）
  getSessionMessages: (chatId, sessionId) => {
    return request(`${baseUrl}/list/session`, 'POST', {
      chat_id: chatId,
      conversation_id: sessionId,
      page: 1,
      page_size: 100 // 获取会话的所有消息
    }, true, true);
  },
  
  // 创建会话
  createSession: (chatId, sessionData) => {
    return request(`${baseUrl}/create/session/${chatId}`, 'POST', sessionData, true, true);
  },
  
  // 更新会话
  updateSession: (chatId, sessionId, sessionData) => {
    return request(`${baseUrl}/update/session/${chatId}/${sessionId}`, 'POST', sessionData, true, true);
  },
  
  // 删除会话
  deleteSession: (chatId, sessionIds) => {
    return request(`${baseUrl}/delete/session/${chatId}`, 'POST', { ids: sessionIds }, true, true);
  },
  
  // 删除会话（别名方法，兼容不同的调用方式）
  deleteSessions: (chatId, sessionIds) => {
    return request(`${baseUrl}/delete/session/${chatId}`, 'POST', { ids: sessionIds }, true, true);
  }
};

// 聊天相关API - 根据接口文档更新
export const chatApi = {
  // DeepSeek API - 使用SSE
  deepSeekApi: (data, callbacks) => {
    const url = `${baseUrl}/deepseek`;
    
    console.log('创建DeepSeek SSE客户端，URL:', url);
    console.log('发送数据:', data);
    
    const sseClient = new MiniProgramSSEClient(url, data, callbacks);
    sseClient.connect();
    
    return sseClient;
  },
  
  // 流式聊天完成 - 使用SSE，调用/ragflow/api/v1/deepseek接口
  streamCompletionSSE: (chatId, message, sessionId, callbacks, timeout = 60000) => {
    const url = `${baseUrl}/deepseek`; // 使用/ragflow/api/v1/deepseek接口
    
    // 获取用户ID（从本地存储或全局数据获取）
    const app = getApp();
    const userId = app.globalData.userId || wx.getStorageSync('userId') || 'default-user';
    
    // 构建符合DeepSeekApiDto的请求数据
    const data = {
      chatId: chatId,           // 助手ID
      question: message,        // 用户问题
      sessionId: sessionId,     // 会话ID
      userId: userId           // 用户ID
    };
    
    console.log('创建DeepSeek流式聊天SSE客户端，URL:', url);
    console.log('发送数据:', data);
    console.log('请求参数详情:', {
      chatId: chatId,
      question: message,
      sessionId: sessionId,
      userId: userId
    });
    
    const sseClient = new MiniProgramSSEClient(url, data, callbacks, timeout);
    sseClient.connect();
    
    return sseClient;
  },
  
  // 非流式聊天完成（兼容TypeScript版本）
  completion: (data) => {
    return request(`${baseUrl}/deepseek`, 'POST', data, true, true);
  },
  
  // 创建聊天助手（兼容TypeScript版本）
  createChatAssistant: (assistantData) => {
    return request(`${baseUrl}/create/assistant`, 'POST', assistantData, true, true);
  },
  
  // 相关问题推荐
  relateQuestions: (question) => {
    return request(`${baseUrl}/relateQuestions`, 'POST', { question }, true, true);
  }
};

// 文件上传相关API - 根据接口文档更新
export const uploadApi = {
  // 初始化文件上传
  initUpload: (fileInfo) => {
    return request(`${uploadBaseUrl}/upload/init`, 'POST', {
      fileId: fileInfo.fileId,
      fileName: fileInfo.fileName,
      fileSize: fileInfo.fileSize,
      totalChunks: fileInfo.totalChunks
    }, true, true);
  },
  
  // 上传文件分块 - 使用 wx.uploadFile 上传 MultipartFile
  uploadFile: (chunkInfo) => {
    return new Promise((resolve, reject) => {
      // 获取JWT用于认证
      const wxJWT = wx.getStorageSync('wxJWT');
      
      if (!wxJWT) {
        reject(new Error('未找到JWT认证信息，请先登录'));
        return;
      }
      
      console.log('=== 开始上传分块 ===');
      console.log('上传分块详细信息:', {
        fileId: chunkInfo.fileId,
        chunkIndex: chunkInfo.chunkIndex,
        kbId: chunkInfo.kbId,
        kbName: chunkInfo.kbName,
        chunkFilePath: chunkInfo.chunkFilePath,
        url: `${uploadBaseUrl}/upload/files`,
        hasJWT: !!wxJWT,
        jwtPrefix: wxJWT ? wxJWT.substring(0, 20) + '...' : 'none'
      });
      
      // 使用 wx.uploadFile 上传文件
      wx.uploadFile({
        url: `${uploadBaseUrl}/upload/files`,
        filePath: chunkInfo.chunkFilePath, // 使用传入的临时文件路径
        name: 'chunk', // 对应后端 @RequestParam MultipartFile chunk
        formData: {
          fileId: chunkInfo.fileId,
          chunkIndex: chunkInfo.chunkIndex.toString(),
          kbName: chunkInfo.kbName || '',
          kbId: chunkInfo.kbId
        },
        header: {
          'Authorization': `Bearer ${wxJWT}`
        },
        success: (res) => {
          console.log('=== 上传分块响应 ===');
          console.log('HTTP状态码:', res.statusCode);
          console.log('响应头:', res.header);
          console.log('原始响应数据:', res.data);
          console.log('响应数据类型:', typeof res.data);
          
          if (res.statusCode === 200) {
            try {
              let responseData;
              
              // 尝试解析JSON响应
              if (typeof res.data === 'string') {
                responseData = JSON.parse(res.data);
              } else {
                responseData = res.data;
              }
              
              console.log('解析后的响应数据:', responseData);
              console.log('响应代码:', responseData.code);
              console.log('响应消息:', responseData.msg);
              
              // 根据接口文档，成功状态码是20000
              if (responseData.code === 20000) {
                console.log('分块上传成功');
                resolve(responseData);
              } else if (responseData.data === null && responseData.msg === null) {
                // 特殊情况：如果data和msg都是null，也认为是成功
                console.log('分块上传成功（特殊情况：data和msg为null）');
                resolve(responseData);
              } else {
                console.error('服务器返回错误:', {
                  code: responseData.code,
                  message: responseData.msg || responseData.message,
                  data: responseData.data
                });
                
                // 提供更具体的错误信息
                let errorMessage = responseData.msg || responseData.message || '上传失败';
                
                // 特殊处理S3相关错误
                if (errorMessage.includes('bucket name') && errorMessage.includes('Amazon S3')) {
                  errorMessage = 'S3存储桶配置错误，请联系管理员检查存储配置';
                } else if (errorMessage.includes('deepragforge_null')) {
                  errorMessage = '存储桶名称配置错误（包含null值），请联系管理员';
                }
                
                reject(new Error(errorMessage));
              }
            } catch (parseError) {
              console.error('解析响应数据失败:', parseError);
              console.error('原始响应数据:', res.data);
              
              // 如果解析失败但HTTP状态码是200，可能是成功的
              if (res.statusCode === 200) {
                console.log('虽然解析失败，但HTTP状态码200，认为上传成功');
                resolve({ code: 20000, message: '上传成功' });
              } else {
                reject(new Error('响应数据解析失败'));
              }
            }
          } else {
            console.error('HTTP状态码错误:', res.statusCode);
            reject(new Error(`HTTP ${res.statusCode}: ${res.data || '上传失败'}`));
          }
        },
        fail: (error) => {
          console.error('=== 上传分块失败 ===');
          console.error('错误详情:', error);
          console.error('错误消息:', error.errMsg);
          reject(new Error(error.errMsg || '上传失败'));
        }
      });
    });
  },
  
  // 获取已上传的分块
  getChunks: (fileId) => {
    return request(`${uploadBaseUrl}/upload/get/chunks?fileId=${fileId}`, 'GET', null, true, true);
  }
};

// 微信登录相关API
export const wxLoginApi = {
  // 获取微信sessionId、JWT令牌和用户信息
  getSessionId: (code) => {
    return request(`${loginBaseUrl}/sessionId/${code}`, 'GET', null, true, false);
  },
  
  // 微信登录
  wxLogin: () => {
    return new Promise((resolve, reject) => {
      console.log('开始微信登录流程...');
      
      // 调用微信登录接口获取code
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            console.log('获取微信登录code成功:', loginRes.code);
            
            // 调用后端接口获取用户信息
            wxLoginApi.getSessionId(loginRes.code)
              .then((loginData) => {
                console.log('获取登录信息成功:', loginData);
                
                // 验证返回的登录数据结构
                if (!loginData || !loginData.jwt || !loginData.user || !loginData.user.id) {
                  throw new Error('服务器返回的登录数据无效');
                }
                
                const { jwt, user } = loginData;
                
                // 保存登录信息到本地存储
                try {
                  wx.setStorageSync('wxLoginCode', loginRes.code);
                  wx.setStorageSync('wxLoginData', loginData);
                  wx.setStorageSync('wxJWT', jwt);
                  wx.setStorageSync('loginTime', new Date().getTime());
                  
                  // 单独保存用户信息，方便其他地方使用
                  wx.setStorageSync('userInfo', {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    openId: user.openId,
                    sessionId: user.sessionId,
                    createAt: user.createAt
                  });
                  
                  console.log('微信登录信息已保存到本地存储');
                } catch (storageError) {
                  console.error('保存登录信息到本地存储失败:', storageError);
                  // 存储失败不影响登录流程，继续执行
                }
                
                resolve({
                  code: loginRes.code,
                  jwt: jwt,
                  loginData: loginData,
                  userData: user,
                  userInfo: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    openId: user.openId,
                    sessionId: user.sessionId,
                    createAt: user.createAt
                  }
                });
              })
              .catch((error) => {
                console.error('获取用户信息失败:', error);
                
                // 提供更详细的错误信息
                let errorMessage = '获取用户信息失败';
                if (error.message) {
                  if (error.message.includes('网络')) {
                    errorMessage = '网络连接失败，请检查网络设置';
                  } else if (error.message.includes('超时')) {
                    errorMessage = '请求超时，请稍后重试';
                  } else if (error.message.includes('500')) {
                    errorMessage = '服务器内部错误，请稍后重试';
                  } else {
                    errorMessage = error.message;
                  }
                }
                
                reject(new Error(errorMessage));
              });
          } else {
            const errorMsg = loginRes.errMsg || '未知错误';
            console.error('获取微信登录code失败:', errorMsg);
            
            // 根据错误类型提供友好的错误信息
            let friendlyError = '微信登录失败';
            if (errorMsg.includes('deny')) {
              friendlyError = '用户拒绝授权登录';
            } else if (errorMsg.includes('cancel')) {
              friendlyError = '用户取消登录';
            } else if (errorMsg.includes('fail')) {
              friendlyError = '微信登录服务异常，请稍后重试';
            }
            
            reject(new Error(friendlyError));
          }
        },
        fail: (error) => {
          console.error('微信登录失败:', error);
          
          // 提供友好的错误信息
          let errorMessage = '微信登录失败';
          if (error.errMsg) {
            if (error.errMsg.includes('network')) {
              errorMessage = '网络连接失败，请检查网络设置';
            } else if (error.errMsg.includes('system')) {
              errorMessage = '系统错误，请重启小程序后重试';
            } else {
              errorMessage = `微信登录失败: ${error.errMsg}`;
            }
          }
          
          reject(new Error(errorMessage));
        }
      });
    });
  },
  
  // 手动重新登录（包装loginManager.performManualLogin）
  performManualLogin: () => {
    return loginManager.performManualLogin();
  },
  
  // 检查登录状态
  checkLoginStatus: () => {
    try {
      const wxLoginCode = wx.getStorageSync('wxLoginCode');
      const wxLoginData = wx.getStorageSync('wxLoginData');
      const wxJWT = wx.getStorageSync('wxJWT');
      const loginTime = wx.getStorageSync('loginTime');
      
      if (!wxLoginCode || !wxLoginData || !wxJWT || !loginTime) {
        console.log('本地未找到登录信息');
        return false;
      }
      
      // 检查登录是否过期，假设7天过期
      const currentTime = new Date().getTime();
      const expireTime = 7 * 24 * 60 * 60 * 1000; // 7天
      
      if (currentTime - loginTime > expireTime) {
        console.log('登录信息已过期');
        // 清除过期的登录信息
        wxLoginApi.clearLoginInfo();
        return false;
      }
      
      console.log('登录状态正常');
      return {
        code: wxLoginCode,
        jwt: wxJWT,
        loginData: wxLoginData,
        userData: wxLoginData.user,
        userInfo: {
          id: wxLoginData.user.id,
          username: wxLoginData.user.username,
          email: wxLoginData.user.email,
          openId: wxLoginData.user.openId,
          sessionId: wxLoginData.user.sessionId,
          createAt: wxLoginData.user.createAt
        },
        loginTime: loginTime
      };
    } catch (error) {
      console.error('检查登录状态失败', error);
      return false;
    }
  },
  
  // 获取当前用户信息
  getCurrentUser: () => {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        console.log('获取当前用户信息:', userInfo);
        return userInfo;
      } else {
        console.log('未找到用户信息');
        return null;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },
  
  // 更新用户信息
  updateUserInfo: (newUserInfo) => {
    try {
      const currentUserInfo = wx.getStorageSync('userInfo') || {};
      const updatedUserInfo = { ...currentUserInfo, ...newUserInfo };
      
      wx.setStorageSync('userInfo', updatedUserInfo);
      
      // 同时更新完整的登录数据
      const wxLoginData = wx.getStorageSync('wxLoginData') || {};
      if (wxLoginData.user) {
        const updatedLoginData = {
          ...wxLoginData,
          user: { ...wxLoginData.user, ...newUserInfo }
        };
        wx.setStorageSync('wxLoginData', updatedLoginData);
      }
      
      console.log('用户信息已更新', updatedUserInfo);
      return updatedUserInfo;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return null;
    }
  },
  
  // 清除登录信息
  clearLoginInfo: () => {
    try {
      wx.removeStorageSync('wxLoginCode');
      wx.removeStorageSync('wxLoginData');
      wx.removeStorageSync('wxJWT');
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('loginTime');
      console.log('登录信息已清除');
    } catch (error) {
      console.error('清除登录信息失败:', error);
    }
  }
};

export default {
  baseUrl,
  datasetApi,
  documentApi,
  chatAssistantApi,
  sessionApi,
  chatApi,
  uploadApi,
  wxLoginApi
}; 