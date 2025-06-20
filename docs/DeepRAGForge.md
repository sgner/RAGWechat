---
title: DeepRAGForge
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# DeepRAGForge

Base URLs:

# Authentication

# RAGFlowController

## POST deepSeekOpenAiApi

POST /ragflow/api/v1/deepseek/openai

> Body 请求参数

```json
{
  "message": "string",
  "chat_id": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[DeepSeekOpenAiApiDto](#schemadeepseekopenaiapidto)| 否 |none|

> 返回示例

> 200 Response

```json
[
  ""
]
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## POST deepSeekApi

POST /ragflow/api/v1/deepseek

> Body 请求参数

```json
{
  "chatId": "string",
  "question": "string",
  "sessionId": "string",
  "userId": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[DeepSeekApiDto](#schemadeepseekapidto)| 否 |none|

> 返回示例

> 200 Response

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|*anonymous*|[[ServerSentEvent«ChatResponse»](#schemaserversentevent«chatresponse»)]|false|none||none|
|» id|string¦null|false|none||none|
|» event|string¦null|false|none||none|
|» retry|[Duration](#schemaduration)|false|none||none|
|»» seconds|integer¦null|false|none||The number of seconds in the duration.|
|»» nanos|integer¦null|false|none||The number of nanoseconds in the duration, expressed as a fraction of the<br />number of seconds. This is always positive, and never exceeds 999,999,999.|
|» comment|string¦null|false|none||none|
|» data|[ChatResponse](#schemachatresponse)|false|none||none|
|»» answer|string¦null|false|none||none|
|»» docAggs|[[DocAgg](#schemadocagg)]¦null|false|none||none|
|»»» doc_name|string¦null|false|none||none|
|»»» doc_id|string¦null|false|none||none|
|»»» count|integer¦null|false|none||none|

## POST createDataset

POST /ragflow/api/v1/create/dataset

> Body 请求参数

```json
{
  "name": "string",
  "avatar": "string",
  "description": "string",
  "language": "ENGLISH",
  "embedding_model": "string",
  "permission": "ME",
  "chunk_method": "NAIVE",
  "parser_config": "new ParserConfig()"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[CreateDatasetRequest](#schemacreatedatasetrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## PUT updateDataset

PUT /ragflow/api/v1/update/dataset/{id}

> Body 请求参数

```json
{
  "embedding_model": "string",
  "chunk_method": "NAIVE",
  "name": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|id|path|string| 是 |none|
|body|body|[UpdateDatasetRequest](#schemaupdatedatasetrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST listDatasets

POST /ragflow/api/v1/list/dataset

> Body 请求参数

```json
{
  "page_size": "10",
  "page": "1",
  "orderby": "create_time",
  "desc": "true",
  "name": "string",
  "id": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[ListDatasetsRequest](#schemalistdatasetsrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## DELETE deleteDataset

DELETE /ragflow/api/v1/delete/dataset

> Body 请求参数

```json
{
  "ids": [
    "string"
  ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[DeleteDatasetRequest](#schemadeletedatasetrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## PUT updateDocument

PUT /ragflow/api/v1/update/document/{dataset_id}/{document_id}

> Body 请求参数

```json
{
  "name": "string",
  "metaFields": {
    "key": {}
  },
  "chunkMethod": "NAIVE",
  "parserConfig": {}
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|dataset_id|path|string| 是 |none|
|document_id|path|string| 是 |none|
|body|body|[UpdateDocumentRequest](#schemaupdatedocumentrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## GET downloadDocument

GET /ragflow/api/v1/download/document/{dataset_id}/{document_id}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|dataset_id|path|string| 是 |none|
|document_id|path|string| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 20000,
  "msg": "",
  "data": {}
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST listDocument

POST /ragflow/api/v1/list/document/{dataset_id}

> Body 请求参数

```json
{
  "page_size": "10",
  "document_id": "string",
  "page": "1",
  "orderby": "update_time",
  "desc": "true",
  "keywords": "string",
  "name": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|dataset_id|path|string| 是 |none|
|body|body|[ListDocumentsRequest](#schemalistdocumentsrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## DELETE deleteDocument

DELETE /ragflow/api/v1/delete/document/{dataset_id}

> Body 请求参数

```json
{
  "ids": [
    "string"
  ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|dataset_id|path|string| 是 |none|
|body|body|[DeleteDocumentRequest](#schemadeletedocumentrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST parseDocument

POST /ragflow/api/v1/parse/document/{dataset_id}

> Body 请求参数

```json
{
  "document_ids": [
    "string"
  ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|dataset_id|path|string| 是 |none|
|body|body|[ParseDocumentRequest](#schemaparsedocumentrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST stopParseDocument

POST /ragflow/api/v1/parse/document/stop/{dataset_id}

> Body 请求参数

```json
{
  "document_ids": [
    "string"
  ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|dataset_id|path|string| 是 |none|
|body|body|[ParseDocumentRequest](#schemaparsedocumentrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST createAssistantResponse

POST /ragflow/api/v1/create/assistant

> Body 请求参数

```json
{
  "dataset_ids": [
    "string"
  ],
  "name": "string",
  "avatar": "string",
  "llm": {
    "model_name": "string",
    "top_p": 0,
    "presence_penalty": 0,
    "frequency_penalty": 0,
    "max_token": 0,
    "temperature": 0
  },
  "prompt": {
    "similarity_threshold": 0,
    "keywords_similarity_weight": 0,
    "top_n": 0,
    "rerank_model": "string",
    "top_k": 0,
    "empty_response": "string",
    "show_quote": true,
    "variables": [
      {
        "key": "string",
        "optional": true
      }
    ],
    "opener": "string",
    "prompt": "string"
  }
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[CreateAssistantRequest](#schemacreateassistantrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST updateAssistant

POST /ragflow/api/v1/update/assistant/{chat_id}

> Body 请求参数

```json
{
  "dataset_ids": [
    "string"
  ],
  "name": "string",
  "avatar": "string",
  "llm": {
    "model_name": "string",
    "top_p": 0,
    "presence_penalty": 0,
    "frequency_penalty": 0,
    "max_token": 0,
    "temperature": 0
  },
  "prompt": {
    "similarity_threshold": 0,
    "keywords_similarity_weight": 0,
    "top_n": 0,
    "rerank_model": "string",
    "top_k": 0,
    "empty_response": "string",
    "show_quote": true,
    "variables": [
      {
        "key": "string",
        "optional": true
      }
    ],
    "opener": "string",
    "prompt": "string"
  }
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|chat_id|path|string| 是 |none|
|body|body|[UpdateAssistantRequest](#schemaupdateassistantrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## DELETE deleteAssistant

DELETE /ragflow/api/v1/delete/assistant

> Body 请求参数

```json
{
  "ids": [
    "string"
  ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[DeleteAssistantRequest](#schemadeleteassistantrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST listAssistants

POST /ragflow/api/v1/list/assistant

> Body 请求参数

```json
{
  "page": "1",
  "page_size": "30",
  "orderby": "update_time",
  "desc": "true",
  "id": "string",
  "name": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[ListAssistantsRequest](#schemalistassistantsrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST createSession

POST /ragflow/api/v1/create/session/{chat_id}

> Body 请求参数

```json
{
  "user_id": "string",
  "name": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|chat_id|path|string| 是 |none|
|body|body|[CreateSessionRequest](#schemacreatesessionrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST updateSession

POST /ragflow/api/v1/update/session/{chat_id}/{session_id}

> Body 请求参数

```json
{
  "user_id": "string",
  "name": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|chat_id|path|string| 是 |none|
|session_id|path|string| 是 |none|
|body|body|[UpdateSessionRequest](#schemaupdatesessionrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST listSession

POST /ragflow/api/v1/list/session

> Body 请求参数

```json
{
  "chat_id": "string",
  "page_size": "30",
  "user_id": "string",
  "page": "1",
  "orderby": "create_time",
  "desc": "true",
  "name": "string",
  "id": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[ListChatSessionRequest](#schemalistchatsessionrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST deleteChatSession

POST /ragflow/api/v1/delete/session/{chat_id}

> Body 请求参数

```json
{
  "ids": [
    "string"
  ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|chat_id|path|string| 是 |none|
|body|body|[DeleteChatSessionRequest](#schemadeletechatsessionrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST relateQuestions

POST /ragflow/api/v1/relateQuestions

> Body 请求参数

```json
{
  "question": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[RelatedQuestionRequest](#schemarelatedquestionrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

# UploadController

## POST uploadFile

POST /upload/files

> Body 请求参数

```yaml
chunk: string

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|fileId|query|string| 是 |none|
|chunkIndex|query|integer| 是 |none|
|kbName|query|string| 是 |none|
|kbId|query|string| 是 |none|
|body|body|object| 否 |none|
|» chunk|body|string(binary)| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 20000,
  "msg": null,
  "data": {}
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## GET getChunks

GET /upload/get/chunks

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|fileId|query|string| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

## POST initUpload

POST /upload/init

> Body 请求参数

```json
{
  "fileId": "string",
  "fileName": "string",
  "fileSize": 0,
  "totalChunks": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[FileInitRequest](#schemafileinitrequest)| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 20000,
  "msg": null,
  "data": {}
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

# WxLoginController

## GET getSessionID

GET /wx/login/sessionId/{code}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|code|path|string| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": null,
  "msg": null,
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[R](#schemar)|

# 数据模型

<h2 id="tocS_Pet">Pet</h2>

<a id="schemapet"></a>
<a id="schema_Pet"></a>
<a id="tocSpet"></a>
<a id="tocspet"></a>

```json
{
  "id": 1,
  "category": {
    "id": 1,
    "name": "string"
  },
  "name": "doggie",
  "photoUrls": [
    "string"
  ],
  "tags": [
    {
      "id": 1,
      "name": "string"
    }
  ],
  "status": "available"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|true|none||宠物ID编号|
|category|[Category](#schemacategory)|true|none||分组|
|name|string|true|none||名称|
|photoUrls|[string]|true|none||照片URL|
|tags|[[Tag](#schematag)]|true|none||标签|
|status|string|true|none||宠物销售状态|

#### 枚举值

|属性|值|
|---|---|
|status|available|
|status|pending|
|status|sold|

<h2 id="tocS_Category">Category</h2>

<a id="schemacategory"></a>
<a id="schema_Category"></a>
<a id="tocScategory"></a>
<a id="tocscategory"></a>

```json
{
  "id": 1,
  "name": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||分组ID编号|
|name|string|false|none||分组名称|

<h2 id="tocS_Tag">Tag</h2>

<a id="schematag"></a>
<a id="schema_Tag"></a>
<a id="tocStag"></a>
<a id="tocstag"></a>

```json
{
  "id": 1,
  "name": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||标签ID编号|
|name|string|false|none||标签名称|

<h2 id="tocS_DeepSeekOpenAiApiDto">DeepSeekOpenAiApiDto</h2>

<a id="schemadeepseekopenaiapidto"></a>
<a id="schema_DeepSeekOpenAiApiDto"></a>
<a id="tocSdeepseekopenaiapidto"></a>
<a id="tocsdeepseekopenaiapidto"></a>

```json
{
  "message": "string",
  "chat_id": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|message|string¦null|false|none||none|
|chat_id|string¦null|false|none||none|

<h2 id="tocS_DocAgg">DocAgg</h2>

<a id="schemadocagg"></a>
<a id="schema_DocAgg"></a>
<a id="tocSdocagg"></a>
<a id="tocsdocagg"></a>

```json
{
  "doc_name": "string",
  "doc_id": "string",
  "count": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|doc_name|string¦null|false|none||none|
|doc_id|string¦null|false|none||none|
|count|integer¦null|false|none||none|

<h2 id="tocS_Duration">Duration</h2>

<a id="schemaduration"></a>
<a id="schema_Duration"></a>
<a id="tocSduration"></a>
<a id="tocsduration"></a>

```json
{
  "seconds": 0,
  "nanos": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|seconds|integer¦null|false|none||The number of seconds in the duration.|
|nanos|integer¦null|false|none||The number of nanoseconds in the duration, expressed as a fraction of the<br />number of seconds. This is always positive, and never exceeds 999,999,999.|

<h2 id="tocS_ChatResponse">ChatResponse</h2>

<a id="schemachatresponse"></a>
<a id="schema_ChatResponse"></a>
<a id="tocSchatresponse"></a>
<a id="tocschatresponse"></a>

```json
{
  "answer": "string",
  "docAggs": [
    {
      "doc_name": "string",
      "doc_id": "string",
      "count": 0
    }
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|answer|string¦null|false|none||none|
|docAggs|[[DocAgg](#schemadocagg)]¦null|false|none||none|

<h2 id="tocS_UploadFileRequest">UploadFileRequest</h2>

<a id="schemauploadfilerequest"></a>
<a id="schema_UploadFileRequest"></a>
<a id="tocSuploadfilerequest"></a>
<a id="tocsuploadfilerequest"></a>

```json
{
  "fileId": "string",
  "chunkIndex": 0,
  "chunk": "string",
  "kbName": "string",
  "kbId": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|fileId|string¦null|false|none||none|
|chunkIndex|integer¦null|false|none||none|
|chunk|string¦null|false|none||none|
|kbName|string¦null|false|none||none|
|kbId|string¦null|false|none||none|

<h2 id="tocS_DeepSeekApiDto">DeepSeekApiDto</h2>

<a id="schemadeepseekapidto"></a>
<a id="schema_DeepSeekApiDto"></a>
<a id="tocSdeepseekapidto"></a>
<a id="tocsdeepseekapidto"></a>

```json
{
  "chatId": "string",
  "question": "string",
  "sessionId": "string",
  "userId": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|chatId|string¦null|false|none||none|
|question|string¦null|false|none||none|
|sessionId|string¦null|false|none||none|
|userId|string¦null|false|none||none|

<h2 id="tocS_FileInitRequest">FileInitRequest</h2>

<a id="schemafileinitrequest"></a>
<a id="schema_FileInitRequest"></a>
<a id="tocSfileinitrequest"></a>
<a id="tocsfileinitrequest"></a>

```json
{
  "fileId": "string",
  "fileName": "string",
  "fileSize": 0,
  "totalChunks": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|fileId|string¦null|false|none||none|
|fileName|string¦null|false|none||none|
|fileSize|integer¦null|false|none||none|
|totalChunks|integer¦null|false|none||none|

<h2 id="tocS_R">R</h2>

<a id="schemar"></a>
<a id="schema_R"></a>
<a id="tocSr"></a>
<a id="tocsr"></a>

```json
{
  "code": null,
  "msg": null,
  "data": null
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|code|null¦null|false|none||none|
|msg|null¦null|false|none||none|
|data|null¦null|false|none||none|

<h2 id="tocS_ServerSentEvent«ChatResponse»">ServerSentEvent«ChatResponse»</h2>

<a id="schemaserversentevent«chatresponse»"></a>
<a id="schema_ServerSentEvent«ChatResponse»"></a>
<a id="tocSserversentevent«chatresponse»"></a>
<a id="tocsserversentevent«chatresponse»"></a>

```json
{
  "id": "string",
  "event": "string",
  "retry": {
    "seconds": 0,
    "nanos": 0
  },
  "comment": "string",
  "data": {
    "answer": "string",
    "docAggs": [
      {
        "doc_name": "string",
        "doc_id": "string",
        "count": 0
      }
    ]
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|string¦null|false|none||none|
|event|string¦null|false|none||none|
|retry|[Duration](#schemaduration)|false|none||none|
|comment|string¦null|false|none||none|
|data|[ChatResponse](#schemachatresponse)|false|none||none|

<h2 id="tocS_Object">Object</h2>

<a id="schemaobject"></a>
<a id="schema_Object"></a>
<a id="tocSobject"></a>
<a id="tocsobject"></a>

```json
{}

```

### 属性

*None*

<h2 id="tocS_CreateDatasetRequest">CreateDatasetRequest</h2>

<a id="schemacreatedatasetrequest"></a>
<a id="schema_CreateDatasetRequest"></a>
<a id="tocScreatedatasetrequest"></a>
<a id="tocscreatedatasetrequest"></a>

```json
{
  "name": "string",
  "avatar": "string",
  "description": "string",
  "language": "ENGLISH",
  "embedding_model": "string",
  "permission": "ME",
  "chunk_method": "NAIVE",
  "parser_config": "new ParserConfig()"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|name|string¦null|false|none||none|
|avatar|string¦null|false|none||none|
|description|string¦null|false|none||none|
|language|string¦null|false|none||none|
|embedding_model|string¦null|false|none||none|
|permission|string¦null|false|none||none|
|chunk_method|string¦null|false|none||none|
|parser_config|[ParserConfig](#schemaparserconfig)|false|none||none|

#### 枚举值

|属性|值|
|---|---|
|language|ENGLISH|
|language|CHINESE|
|permission|ME|
|permission|TEAM|
|chunk_method|NAIVE|
|chunk_method|MANUAL|
|chunk_method|QA|
|chunk_method|TABLE|
|chunk_method|PAPER|
|chunk_method|BOOK|
|chunk_method|LAWS|
|chunk_method|PRESENTATION|
|chunk_method|PICTURE|
|chunk_method|ONE|
|chunk_method|KNOWLEDGE_GRAPH|
|chunk_method|EMAIL|

<h2 id="tocS_UpdateDatasetRequest">UpdateDatasetRequest</h2>

<a id="schemaupdatedatasetrequest"></a>
<a id="schema_UpdateDatasetRequest"></a>
<a id="tocSupdatedatasetrequest"></a>
<a id="tocsupdatedatasetrequest"></a>

```json
{
  "embedding_model": "string",
  "chunk_method": "NAIVE",
  "name": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|embedding_model|string¦null|false|none||none|
|chunk_method|string¦null|false|none||none|
|name|string¦null|false|none||none|

#### 枚举值

|属性|值|
|---|---|
|chunk_method|NAIVE|
|chunk_method|MANUAL|
|chunk_method|QA|
|chunk_method|TABLE|
|chunk_method|PAPER|
|chunk_method|BOOK|
|chunk_method|LAWS|
|chunk_method|PRESENTATION|
|chunk_method|PICTURE|
|chunk_method|ONE|
|chunk_method|EMAIL|
|chunk_method|KNOWLEDGE_GRAPH|

<h2 id="tocS_RaptorConfig">RaptorConfig</h2>

<a id="schemaraptorconfig"></a>
<a id="schema_RaptorConfig"></a>
<a id="tocSraptorconfig"></a>
<a id="tocsraptorconfig"></a>

```json
{
  "useRaptor": "false"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|useRaptor|boolean¦null|false|none||none|

<h2 id="tocS_ListDatasetsRequest">ListDatasetsRequest</h2>

<a id="schemalistdatasetsrequest"></a>
<a id="schema_ListDatasetsRequest"></a>
<a id="tocSlistdatasetsrequest"></a>
<a id="tocslistdatasetsrequest"></a>

```json
{
  "page_size": "10",
  "page": "1",
  "orderby": "create_time",
  "desc": "true",
  "name": "string",
  "id": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page_size|integer¦null|false|none||none|
|page|integer¦null|false|none||none|
|orderby|string¦null|false|none||none|
|desc|boolean¦null|false|none||none|
|name|string¦null|false|none||none|
|id|string¦null|false|none||none|

<h2 id="tocS_DeleteDatasetRequest">DeleteDatasetRequest</h2>

<a id="schemadeletedatasetrequest"></a>
<a id="schema_DeleteDatasetRequest"></a>
<a id="tocSdeletedatasetrequest"></a>
<a id="tocsdeletedatasetrequest"></a>

```json
{
  "ids": [
    "string"
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|ids|[string]¦null|false|none||none|

<h2 id="tocS_key">key</h2>

<a id="schemakey"></a>
<a id="schema_key"></a>
<a id="tocSkey"></a>
<a id="tocskey"></a>

```json
{}

```

### 属性

*None*

<h2 id="tocS_Map«Object»">Map«Object»</h2>

<a id="schemamap«object»"></a>
<a id="schema_Map«Object»"></a>
<a id="tocSmap«object»"></a>
<a id="tocsmap«object»"></a>

```json
{
  "key": {}
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|key|[key](#schemakey)|false|none||none|

<h2 id="tocS_ParserConfig">ParserConfig</h2>

<a id="schemaparserconfig"></a>
<a id="schema_ParserConfig"></a>
<a id="tocSparserconfig"></a>
<a id="tocsparserconfig"></a>

```json
{
  "chunk_token_count": "128",
  "layout_recognize": "true",
  "html4excel": "false",
  "delimiter": "\n!?。；！？",
  "task_page_size": "12",
  "raptor": "new RaptorConfig()",
  "entity_types": "Arrays.asList(\"organization\", \"person\", \"location\", \"event\", \"time\")"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|chunk_token_count|integer¦null|false|none||none|
|layout_recognize|boolean¦null|false|none||none|
|html4excel|boolean¦null|false|none||none|
|delimiter|string¦null|false|none||none|
|task_page_size|integer¦null|false|none||none|
|raptor|[RaptorConfig](#schemaraptorconfig)|false|none||none|
|entity_types|[string]¦null|false|none||none|

<h2 id="tocS_UpdateDocumentRequest">UpdateDocumentRequest</h2>

<a id="schemaupdatedocumentrequest"></a>
<a id="schema_UpdateDocumentRequest"></a>
<a id="tocSupdatedocumentrequest"></a>
<a id="tocsupdatedocumentrequest"></a>

```json
{
  "name": "string",
  "metaFields": {
    "key": {}
  },
  "chunkMethod": "NAIVE",
  "parserConfig": {}
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|name|string¦null|false|none||none|
|metaFields|[Map«Object»](#schemamap«object»)|false|none||none|
|chunkMethod|string¦null|false|none||none|
|parserConfig|[ParserConfig1](#schemaparserconfig1)|false|none||none|

#### 枚举值

|属性|值|
|---|---|
|chunkMethod|NAIVE|
|chunkMethod|MANUAL|
|chunkMethod|QA|
|chunkMethod|TABLE|
|chunkMethod|PAPER|
|chunkMethod|BOOK|
|chunkMethod|LAWS|
|chunkMethod|PRESENTATION|
|chunkMethod|PICTURE|
|chunkMethod|ONE|
|chunkMethod|EMAIL|
|chunkMethod|KNOWLEDGE_GRAPH|

<h2 id="tocS_ListDocumentsRequest">ListDocumentsRequest</h2>

<a id="schemalistdocumentsrequest"></a>
<a id="schema_ListDocumentsRequest"></a>
<a id="tocSlistdocumentsrequest"></a>
<a id="tocslistdocumentsrequest"></a>

```json
{
  "page_size": "10",
  "document_id": "string",
  "page": "1",
  "orderby": "update_time",
  "desc": "true",
  "keywords": "string",
  "name": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page_size|integer¦null|false|none||none|
|document_id|string¦null|false|none||none|
|page|integer¦null|false|none||none|
|orderby|string¦null|false|none||none|
|desc|boolean¦null|false|none||none|
|keywords|string¦null|false|none||none|
|name|string¦null|false|none||none|

<h2 id="tocS_DeleteDocumentRequest">DeleteDocumentRequest</h2>

<a id="schemadeletedocumentrequest"></a>
<a id="schema_DeleteDocumentRequest"></a>
<a id="tocSdeletedocumentrequest"></a>
<a id="tocsdeletedocumentrequest"></a>

```json
{
  "ids": [
    "string"
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|ids|[string]¦null|false|none||none|

<h2 id="tocS_ParserConfig1">ParserConfig1</h2>

<a id="schemaparserconfig1"></a>
<a id="schema_ParserConfig1"></a>
<a id="tocSparserconfig1"></a>
<a id="tocsparserconfig1"></a>

```json
{}

```

### 属性

*None*

<h2 id="tocS_ParseDocumentRequest">ParseDocumentRequest</h2>

<a id="schemaparsedocumentrequest"></a>
<a id="schema_ParseDocumentRequest"></a>
<a id="tocSparsedocumentrequest"></a>
<a id="tocsparsedocumentrequest"></a>

```json
{
  "document_ids": [
    "string"
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|document_ids|[string]¦null|false|none||none|

<h2 id="tocS_LlmConfig">LlmConfig</h2>

<a id="schemallmconfig"></a>
<a id="schema_LlmConfig"></a>
<a id="tocSllmconfig"></a>
<a id="tocsllmconfig"></a>

```json
{
  "model_name": "string",
  "top_p": 0,
  "presence_penalty": 0,
  "frequency_penalty": 0,
  "max_token": 0,
  "temperature": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|model_name|string¦null|false|none||none|
|top_p|number¦null|false|none||none|
|presence_penalty|number¦null|false|none||none|
|frequency_penalty|number¦null|false|none||none|
|max_token|integer¦null|false|none||none|
|temperature|number¦null|false|none||none|

<h2 id="tocS_Variable">Variable</h2>

<a id="schemavariable"></a>
<a id="schema_Variable"></a>
<a id="tocSvariable"></a>
<a id="tocsvariable"></a>

```json
{
  "key": "string",
  "optional": true
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|key|string¦null|false|none||none|
|optional|boolean¦null|false|none||none|

<h2 id="tocS_PromptConfig">PromptConfig</h2>

<a id="schemapromptconfig"></a>
<a id="schema_PromptConfig"></a>
<a id="tocSpromptconfig"></a>
<a id="tocspromptconfig"></a>

```json
{
  "similarity_threshold": 0,
  "keywords_similarity_weight": 0,
  "top_n": 0,
  "rerank_model": "string",
  "top_k": 0,
  "empty_response": "string",
  "show_quote": true,
  "variables": [
    {
      "key": "string",
      "optional": true
    }
  ],
  "opener": "string",
  "prompt": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|similarity_threshold|number¦null|false|none||none|
|keywords_similarity_weight|number¦null|false|none||none|
|top_n|integer¦null|false|none||none|
|rerank_model|string¦null|false|none||none|
|top_k|integer¦null|false|none||none|
|empty_response|string¦null|false|none||none|
|show_quote|boolean¦null|false|none||none|
|variables|[[Variable](#schemavariable)]¦null|false|none||none|
|opener|string¦null|false|none||none|
|prompt|string¦null|false|none||none|

<h2 id="tocS_CreateAssistantRequest">CreateAssistantRequest</h2>

<a id="schemacreateassistantrequest"></a>
<a id="schema_CreateAssistantRequest"></a>
<a id="tocScreateassistantrequest"></a>
<a id="tocscreateassistantrequest"></a>

```json
{
  "dataset_ids": [
    "string"
  ],
  "name": "string",
  "avatar": "string",
  "llm": {
    "model_name": "string",
    "top_p": 0,
    "presence_penalty": 0,
    "frequency_penalty": 0,
    "max_token": 0,
    "temperature": 0
  },
  "prompt": {
    "similarity_threshold": 0,
    "keywords_similarity_weight": 0,
    "top_n": 0,
    "rerank_model": "string",
    "top_k": 0,
    "empty_response": "string",
    "show_quote": true,
    "variables": [
      {
        "key": "string",
        "optional": true
      }
    ],
    "opener": "string",
    "prompt": "string"
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|dataset_ids|[string]¦null|false|none||none|
|name|string¦null|false|none||none|
|avatar|string¦null|false|none||none|
|llm|[LlmConfig](#schemallmconfig)|false|none||none|
|prompt|[PromptConfig](#schemapromptconfig)|false|none||none|

<h2 id="tocS_LlmConfig2">LlmConfig2</h2>

<a id="schemallmconfig2"></a>
<a id="schema_LlmConfig2"></a>
<a id="tocSllmconfig2"></a>
<a id="tocsllmconfig2"></a>

```json
{
  "model_name": "string",
  "top_p": 0,
  "presence_penalty": 0,
  "frequency_penalty": 0,
  "max_token": 0,
  "temperature": 0
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|model_name|string¦null|false|none||none|
|top_p|number¦null|false|none||none|
|presence_penalty|number¦null|false|none||none|
|frequency_penalty|number¦null|false|none||none|
|max_token|integer¦null|false|none||none|
|temperature|number¦null|false|none||none|

<h2 id="tocS_Variable3">Variable3</h2>

<a id="schemavariable3"></a>
<a id="schema_Variable3"></a>
<a id="tocSvariable3"></a>
<a id="tocsvariable3"></a>

```json
{
  "key": "string",
  "optional": true
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|key|string¦null|false|none||none|
|optional|boolean¦null|false|none||none|

<h2 id="tocS_PromptConfig4">PromptConfig4</h2>

<a id="schemapromptconfig4"></a>
<a id="schema_PromptConfig4"></a>
<a id="tocSpromptconfig4"></a>
<a id="tocspromptconfig4"></a>

```json
{
  "similarity_threshold": 0,
  "keywords_similarity_weight": 0,
  "top_n": 0,
  "rerank_model": "string",
  "top_k": 0,
  "empty_response": "string",
  "show_quote": true,
  "variables": [
    {
      "key": "string",
      "optional": true
    }
  ],
  "opener": "string",
  "prompt": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|similarity_threshold|number¦null|false|none||none|
|keywords_similarity_weight|number¦null|false|none||none|
|top_n|integer¦null|false|none||none|
|rerank_model|string¦null|false|none||none|
|top_k|integer¦null|false|none||none|
|empty_response|string¦null|false|none||none|
|show_quote|boolean¦null|false|none||none|
|variables|[[Variable3](#schemavariable3)]¦null|false|none||none|
|opener|string¦null|false|none||none|
|prompt|string¦null|false|none||none|

<h2 id="tocS_UpdateAssistantRequest">UpdateAssistantRequest</h2>

<a id="schemaupdateassistantrequest"></a>
<a id="schema_UpdateAssistantRequest"></a>
<a id="tocSupdateassistantrequest"></a>
<a id="tocsupdateassistantrequest"></a>

```json
{
  "dataset_ids": [
    "string"
  ],
  "name": "string",
  "avatar": "string",
  "llm": {
    "model_name": "string",
    "top_p": 0,
    "presence_penalty": 0,
    "frequency_penalty": 0,
    "max_token": 0,
    "temperature": 0
  },
  "prompt": {
    "similarity_threshold": 0,
    "keywords_similarity_weight": 0,
    "top_n": 0,
    "rerank_model": "string",
    "top_k": 0,
    "empty_response": "string",
    "show_quote": true,
    "variables": [
      {
        "key": "string",
        "optional": true
      }
    ],
    "opener": "string",
    "prompt": "string"
  }
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|dataset_ids|[string]¦null|false|none||none|
|name|string¦null|false|none||none|
|avatar|string¦null|false|none||none|
|llm|[LlmConfig2](#schemallmconfig2)|false|none||none|
|prompt|[PromptConfig4](#schemapromptconfig4)|false|none||none|

<h2 id="tocS_CreateSessionRequest">CreateSessionRequest</h2>

<a id="schemacreatesessionrequest"></a>
<a id="schema_CreateSessionRequest"></a>
<a id="tocScreatesessionrequest"></a>
<a id="tocscreatesessionrequest"></a>

```json
{
  "user_id": "string",
  "name": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|user_id|string¦null|false|none||none|
|name|string¦null|false|none||none|

<h2 id="tocS_UpdateSessionRequest">UpdateSessionRequest</h2>

<a id="schemaupdatesessionrequest"></a>
<a id="schema_UpdateSessionRequest"></a>
<a id="tocSupdatesessionrequest"></a>
<a id="tocsupdatesessionrequest"></a>

```json
{
  "user_id": "string",
  "name": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|user_id|string¦null|false|none||none|
|name|string¦null|false|none||none|

<h2 id="tocS_ListChatSessionRequest">ListChatSessionRequest</h2>

<a id="schemalistchatsessionrequest"></a>
<a id="schema_ListChatSessionRequest"></a>
<a id="tocSlistchatsessionrequest"></a>
<a id="tocslistchatsessionrequest"></a>

```json
{
  "chat_id": "string",
  "page_size": "30",
  "user_id": "string",
  "page": "1",
  "orderby": "create_time",
  "desc": "true",
  "name": "string",
  "id": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|chat_id|string¦null|false|none||none|
|page_size|integer¦null|false|none||none|
|user_id|string¦null|false|none||none|
|page|integer¦null|false|none||none|
|orderby|string¦null|false|none||none|
|desc|boolean¦null|false|none||none|
|name|string¦null|false|none||none|
|id|string¦null|false|none||none|

<h2 id="tocS_DeleteChatSessionRequest">DeleteChatSessionRequest</h2>

<a id="schemadeletechatsessionrequest"></a>
<a id="schema_DeleteChatSessionRequest"></a>
<a id="tocSdeletechatsessionrequest"></a>
<a id="tocsdeletechatsessionrequest"></a>

```json
{
  "ids": [
    "string"
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|ids|[string]¦null|false|none||none|

<h2 id="tocS_DeleteAssistantRequest">DeleteAssistantRequest</h2>

<a id="schemadeleteassistantrequest"></a>
<a id="schema_DeleteAssistantRequest"></a>
<a id="tocSdeleteassistantrequest"></a>
<a id="tocsdeleteassistantrequest"></a>

```json
{
  "ids": [
    "string"
  ]
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|ids|[string]¦null|false|none||none|

<h2 id="tocS_ListAssistantsRequest">ListAssistantsRequest</h2>

<a id="schemalistassistantsrequest"></a>
<a id="schema_ListAssistantsRequest"></a>
<a id="tocSlistassistantsrequest"></a>
<a id="tocslistassistantsrequest"></a>

```json
{
  "page": "1",
  "page_size": "30",
  "orderby": "update_time",
  "desc": "true",
  "id": "string",
  "name": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|page|integer¦null|false|none||none|
|page_size|integer¦null|false|none||none|
|orderby|string¦null|false|none||none|
|desc|boolean¦null|false|none||none|
|id|string¦null|false|none||none|
|name|string¦null|false|none||none|

<h2 id="tocS_RelatedQuestionRequest">RelatedQuestionRequest</h2>

<a id="schemarelatedquestionrequest"></a>
<a id="schema_RelatedQuestionRequest"></a>
<a id="tocSrelatedquestionrequest"></a>
<a id="tocsrelatedquestionrequest"></a>

```json
{
  "question": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|question|string¦null|false|none||none|

