# Global ATC Master 应用逻辑与架构总结

本文档介绍了当前应用（Global ATC Master）的核心业务逻辑、大模型调用链路、数据处理流程及UI排版设计，用以指导后续的迭代和维护。

## 1. 核心业务流程 (录音分析流程)

应用的核心业务是对陆空通话（ATC）录音进行自动化转录、情景还原以及专业评估（分为管制员评估和飞行员评估）。

### 1.1 输入与参数
用户在前端 (`src/pages/Home.tsx`) 进行操作：
- **音频输入**：支持本地拖拽/点击上传录音文件（`m4a`, `wav`, `mp3`等）。
- **参数配置**：
  - **评估对象 (Assessment Target)**：`ATC` (管制员评估) 或 `PILOT` (飞行员评估)。两者会触发不同的 Prompt 模板和输出规范。
  - **情景与国家 (Country/Location)**：支持手动选择或自动识别。
  - **机型与人设 (Aircraft & Persona)**：影响分析深度的附加参数。
  - **输出语言模式**：全英文或双语。

### 1.2 状态管理
由自定义 Hook `useTranscription` (`src/hooks/useTranscription.ts`) 统一管理应用的异步请求状态：
- 管理 `isLoading`, `error`, `progressStatus` 等 UI 状态。
- 封装并处理音频文件到 Base64 的转换。
- 调用 `geminiService.ts` 发起网络请求，并在拿到结果后更新前端状态（更新历史记录等）。

## 2. 大模型调用逻辑 (前端集成 Gemini)

应用采用纯前端方式请求大语言模型，并利用 Google GenAI SDK 和 JSON Schema 约束结果返回。

### 2.1 Gemini Manager (`src/services/geminiManager.ts`)
- 封装了 `@google/genai` 客户端的初始化和调用。
- 提供了重试机制及不同模型的配置切换逻辑（如使用 `gemini-3.1-pro-preview` 等）。

### 2.2 评估服务 (`src/services/geminiService.ts`)
- **动态 Prompt 构建**：根据 `assessmentTarget` 选择不同的系统指令 (System Prompt)。
  - **管制员模式 (ATC)**：依据录音评估 ATC 管制员的话术是否规范、语速如何，分析其对情景意识及飞行安全的潜在影响，关联 TEM 模型给出点评。
  - **飞行员模式 (PILOT)**：依据 ICAO Doc 9432 与 Doc 9835，评估飞行员是否准确捕捉 ATC 意图，分析其在非常规指令下的证实策略（Clarification Strategy），以及发音吞音等问题。
- **Schema 严格约束 (Structured output)**：强制模型输出指定结构的 JSON。
  - `segments`：对话还原数组，包含 `sequence_order`、`raw_text`（包含推演内容标记 `<Inferred:...>`）、`translated_text` 和 `inferred_flags`。
  - `report_markdown`：详细的分析报告内容，采用 Markdown 格式组织。
  - `report_title`：总结性的评估报告标题。
  - `cbta_report` (可选)：核心维度的具体打分对象（包含发音、结构、词汇、流利度、理解能力、互动能力等6项的得分为1-6）。

## 3. 报告展示与排版设计

前端接收模型返回的结构化数据后，在 `Home.tsx` 及各类组件中进行模块化展示。

### 3.1 核心 UI 组件
- **对话还原面板**：通过映射 `segments` 数组，利用奇偶数（Index）自动区分当前发言者属于 ATC 还是 PILOT。
  - 聊天气泡样式设计：ATC 和 PILOT 呈现左右两侧交替分布，气泡底色和文字深浅予以区分，展现真实的陆空通话感受。
- **CBTA 雷达与条形图 (`src/components/CBTAReport.tsx`)**：
  - 如果返回了 `cbta_report.scores` 字段，则利用 Recharts 进行可视化展示，以直观的形式呈现六大核心维度的 ICAO 1-6 级评分。
- **动态 Markdown 渲染**：
  - 将 `report_markdown` 传入 `react-markdown` 进行渲染，并在外层应用 `.markdown-body` 自定义类以规范间距格式和标题字体设计。

### 3.2 交互与动效设计 
- **基础样式库**：深度结合 Tailwind CSS，运用了玻璃拟物（Glassmorphism）效果、磨砂背景和柔和的卡片阴影。
- **动画设计**：前端状态切换（如开始转录加载、报告模块逐个浮现）大范围应用了 `framer-motion`。通过设置不同的延迟和缓动曲线（Stagger and Spring），使得复杂的报告如同拼图般流畅且有序地呈现，提升质感。

## 4. 文件导出系统

对于生成的评估报告，应用提供了 PDF 和 Word 两种维度的专业排版导出功能。

### 4.1 Word 导出 (`src/utils/docxUtils.ts`)
- 利用由 TypeScript 构建的 `docx` 库生成排版严谨的文档。
- **排版对齐逻辑**：无论何种评估模式，都会遍历 `segments` 渲染对话文字，如果有 `cbta_report` 就增加分数表格段落，最后将 `report_markdown` 的内容转化为段落（目前通过识别特定标题“Detailed Analysis”等），保持前端显示与后端导出的结构一致性。

### 4.2 PDF 导出 (`src/utils/exportUtils.ts`)
- 构建隐藏的 HTML 模板，利用 `html2pdf.js` 将对话、图表或分数和 Markdown 精细渲染后再打印为 PDF 文件。
- PDF 同样适配了 ATC 和 PILOT 分角色的颜色和方向区分。

## 5. 项目遵循规范的开发原则总结
- **KISS 原则与实用主义**：逻辑划分极为清晰，所有对后端的复杂解析全部交由大模型 Schema 强制返回 JSON 去做，减少了繁琐的正则解析或前端后处理步骤。
- **高鲁棒性**：异常（如调用失败、JSON格式有误或未返回某个对象）均在 `useTranscription` 的 catch 块或组件内部（如返回 null）被安全过滤与提示。
- **高度模块化**：工具包、Hooks 和网络层分开独立，不同报告的评测逻辑仅需在指令模板微调，互不干扰验证逻辑和导出逻辑。
