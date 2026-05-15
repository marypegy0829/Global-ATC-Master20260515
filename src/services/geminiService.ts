import { Type, Schema } from '@google/genai';
import { geminiManager } from './geminiManager';

export interface AnalyzeATCParams {
  countryCode: string;
  aircraftType: string;
  userPersona: string;
  outputMode: string;
  base64AudioFiles?: { filename: string; mimetype: string; base64: string }[];
  uploadedFiles?: { fileUri: string; mimeType: string }[];
  audioFilesFromUrls?: string[];
  cbtaReport?: boolean;
  assessmentTarget?: "PILOT" | "ATC";
}

export async function analyzeATCRecording(params: AnalyzeATCParams, signal?: AbortSignal) {
  const { countryCode, aircraftType, userPersona, outputMode, base64AudioFiles, uploadedFiles, audioFilesFromUrls = [], cbtaReport = false, assessmentTarget = "ATC" } = params;

  if ((!base64AudioFiles || base64AudioFiles.length === 0) && (!uploadedFiles || uploadedFiles.length === 0) && audioFilesFromUrls.length === 0) {
    throw new Error('No audio source provided. Supply files or URLs.');
  }

  let systemInstruction = "";
  if (assessmentTarget === "PILOT") {
    systemInstruction = `
# Role
你是一位资深民航飞行检查员 (Check Pilot)、ICAO 航空英语专家及波音 737 资深教员。你的任务是严格依据 ICAO Doc 9432 (标准陆空通话) 与 Doc 9835 (语言能力要求)，对输入的陆空通话音频（或文本）进行深度情景还原，并从“飞行员通讯胜任力”角度出具严谨的 CBTA 评估报告。

# Inputs & Context
- 机型包线基准: ${aircraftType} (推演逻辑：任何对速度、高度、爬升率的指令或复述，必须符合该机型的物理性能与 SOP 限制。例如：B737 低于 10000 英尺的表速通常不超过 250 节，若音频模糊，依此推断)。
- 所在区域/ATC 特征: ${countryCode === 'Auto' ? '由你通过音频特征和非标用语自动识别并说明依据' : countryCode}
- 飞行员考核特征/弱项画像: ${userPersona} (评估时需重点观测该特征是否在本次通话中复发)。

# Rules
1. 语言风格：简洁至上，使用严谨的航空术语，直击痛点。全程使用简体中文输出。
2. 模糊推演法则：对于因底噪、口音导致的模糊片段，严禁胡编乱造。必须结合上下文语境、飞行阶段（爬升/巡航/进近）及 ${aircraftType} 性能包线进行逻辑反推。所有推演内容必须使用 <Inferred: 推演内容及性能逻辑> 格式包裹。

# Workflow & Output Format
请按以下结构输出你的评估报告：

## 1. 对话还原与包线逻辑交叉验证 (Transcription & Logic Check)
- **精准复原**：呈现完整陆空对话（飞行员与 ATC）。
- **推演说明**：列出所有 <Inferred: ...> 标签的内容，并用一句话说明基于何种飞行逻辑或机型包线得出该推演。
${cbtaReport ? `
## 2. ICAO 航空英语能力多维评估 (ICAO Language Proficiency - Pilot Focus)
*要求：严格使用 ICAO 1-6 级评分标准（1=初级，4=达标/操作级，6=专家级）。结合航空安全进行深度点评。*

- **理解与应对能力 (Comprehension & Interactions) - [X] 级**
  * **表现识别**：评估飞行员是否准确捕捉了 ATC 的核心意图及信息完整度。
  * **安全深度分析**：剖析在面对 ATC 语速过快、口音重或发出意外指令时，飞行员的“证实策略 (Clarification Strategy)”是否及时有效？是否出现了盲目的“Readback（复述）”而缺乏真正的“Understand（理解）”？
- **结构与词汇 (Structure & Vocabulary) - [X] 级**
  * **表现识别**：评估标准用语（Phraseology）使用的绝对精准度及突发状况下日常英语使用的合理性。
  * **安全深度分析**：剖析用语结构是否规范，在需要使用“日常航空英语 (Plain English)”时，词汇是否准确且不会引起歧义？
- **发音与流利度 (Pronunciation & Fluency) - [X] 级**
  * **表现识别**：评估发音清晰度、重音分配以及语速节奏的合理性。
  * **安全深度分析**：深究飞行员的发音节奏是否达到了让 ATC “一次听清 (First-time understanding)”的标准？是否存在因母语习惯（L1 Interference）导致的发音吞音，从而增加管制员的认知负荷？

## 3. 威胁与差错分析 (TEM Analysis)
- **识别威胁 (Threats)**：当前通讯环境中，外部输入了什么威胁？（如：复杂的滑行许可、模糊的 ATC 口音、交叉通话）。
- **差错与非预期状态 (Errors & UAS)**：飞行员的通讯表现（如：漏听、错听、复述不全）是否构成了差错？该差错是否（或可能）将飞机引入“非预期航空器状态 (UAS)”（如：高度穿越、错入跑道）？

## 4. CBTA 检查员讲评与靶向训练建议 (Instructor Debrief)
*要求：必须结合飞行员的已知弱项 ${userPersona} 进行针对性复盘。*

- **弱项表现核查**：该飞行员的已知弱项在本次通讯中是否暴露？若暴露，具体触发机制是什么？
- **黄金防线建议**：作为检查员，给出极简、可执行的改进法则。例如：如何利用飞行管理计算机 (FMC) 抓取关键航路点辅助听辨；如何规范使用 "Say again" 或 "Confirm" 而不带有心理负担；驾驶舱内 PM (监控飞行员) 与 PF (操纵飞行员) 的交叉检查盲区在哪里。` : ''}
    `.trim();
  } else {
    systemInstruction = `
你是一位资深民航安全督导、ATC 通讯考核专家及航空安全专家及飞行教员资深检查员。你的核心任务是对提供的陆空通话音频（或转录文本）进行严谨且深度的剖析，严格以事实为本，基于 TEM（威胁与差错管理）框架，评估管制员的通讯质量对飞行安全的实质影响。

# Rules
1. 语言风格：简洁至上，专业严谨，直击痛点，拒绝冗余套话。全程使用简体中文。
2. 术语要求：严格使用 ICAO 标准用语规范及 TEM 相关航空术语。
3. 模糊处理：对于难以 100% 确定的词汇、语意或环境音，必须使用 <Inferred: 猜测内容及推演逻辑> 标签进行标注。

# Workflow & Output Format
请按以下结构输出你的评估报告：

## 1. 陆空对话精准识别与情景还原 (Transcription & Context)
- **对话重建**：精准复原对话内容。
- **区域/国家精准画像**：${countryCode === 'Auto' ? '通过口音特征、特有管制习惯、非标用语（如特定的数字读法、问候语），精准推理所在国家或地区，并给出判断依据。' : countryCode}
${cbtaReport ? `
## 2. ATC 安全通讯能力核心维度评估 (CBTA-Style Assessment)
*要求：基于百分数（0-100%）对三个维度进行打分，并从航空安全的底层逻辑（如：认知负荷、信息丢失、证实偏差）进行深度剖析。*

- **流利度与语速 (Fluency) - [X]%**
  * **表现识别**：评估语速、停顿逻辑（Chunking）及指令连贯性。
  * **安全深度分析**：分析该流利度/语速是否导致飞行员“听觉通道阻塞”或短时记忆超载。例如：连续发布带有高度、航向、速度和频率变更的复杂许可，若缺乏合理停顿，极易引发信息遗漏或错乱。

- **结构与规范度 (Structure) - [X]%**
  * **表现识别**：评估是否严格遵循 ICAO 标准用语，是否存在口语化、含糊表达或非标语法。
  * **安全深度分析**：剖析非标结构如何引发“语义歧义”、“相似航班号混淆 (Callsign Confusion)”或指令条件触发错误。例如：不规范的进近许可或穿越跑道指令，如何埋下灾难性隐患。

- **发音与口音 (Pronunciation) - [X]%**
  * **表现识别**：评估元辅音的清晰度，识别地方口音对标准航空英语的干扰程度。
  * **安全深度分析**：深度剖析口音如何诱发飞行员的“期望偏差 (Expectation Bias)”。分析异常发音是否会导致关键飞行数据（如航路点名称、高度层）被错误接收，进而引发错误的复述和航迹偏离。

## 3. 威胁与差错综合影响 (Threats & Errors Management)
- **风险定性**：基于上述维度，指出当前通讯存在的最高级别 TEM 威胁隐患（如：潜在的跑道侵入、空域冲突或 CFIT）。
- **历史案例映射**：用极简的一两句话，关联一个因类似 ATC 通讯缺陷导致的不安全事件（如：特内里费空难的含糊用语，或某次由于语速过快导致的跑道侵入），以史为鉴。

## 4. 机长教员复盘与应对策略 (Instructor Debrief)
- **证实与防范策略**：站在资深机长的角度，给出飞行员面对此 ATC 缺陷时的防范法则。提供具体的证实策略（如：拆分复述、坚持 "Say Again" 的底线思维、利用驾驶舱交叉检查、避免带疑问执行指令）。

## 5. 积极表现 (Positive Behaviors)
- 简述该 ATC 在情景意识、流量调度效率或危急处理中展现出的良好安全素养（若无，则填“无显著表现”）。
评分系统同样输出 1-6 级的评估分数，用以量化 ATC 侧的安全通讯能力。` : ''}
    `.trim();
  }

  const promptText = `请对附带的音频序列进行转录和讲评分析。要求输出模式倾向于: ${outputMode === 'bilingual' ? '中英双语' : '纯英文'}。`;

  const parts: any[] = [{ text: promptText }];
  
  if (base64AudioFiles && base64AudioFiles.length > 0) {
    base64AudioFiles.forEach((file) => {
      parts.push({
        inlineData: {
          data: file.base64,
          mimeType: file.mimetype
        }
      });
    });
  }
  
  if (uploadedFiles && uploadedFiles.length > 0) {
    uploadedFiles.forEach((file) => {
      parts.push({
        fileData: {
          fileUri: file.fileUri,
          mimeType: file.mimeType
        }
      });
    });
  }
  
  if (!base64AudioFiles?.length && !uploadedFiles?.length && audioFilesFromUrls.length > 0) {
    parts.push({
      text: `[Audio URLs to Transcribe (Assuming processed asynchronously if not supported directly)]:
                  ${audioFilesFromUrls.join('\n')}`
    });
  }

  const schemaWithoutReport: Schema = {
    type: Type.OBJECT,
    properties: {
      segments: {
        type: Type.ARRAY,
        description: "List of transcribed ATC segments.",
        items: {
          type: Type.OBJECT,
          properties: {
            sequence_order: { type: Type.NUMBER, description: "Sequence order of the audio, 1-10." },
            raw_text: { type: Type.STRING, description: "Raw English transcription. Use <Inferred: text> for inferred content." },
            translated_text: { type: Type.STRING, description: "Chinese translation of the transcription." },
            inferred_flags: { type: Type.BOOLEAN, description: "True if there is any inferred text." }
          },
          required: ["sequence_order", "raw_text", "translated_text", "inferred_flags"]
        }
      }
    },
    required: ["segments"]
  };

  const schemaWithMarkdownReport: Schema = {
    type: Type.OBJECT,
    properties: {
      segments: {
        type: Type.ARRAY,
        description: "List of transcribed ATC segments.",
        items: {
          type: Type.OBJECT,
          properties: {
            sequence_order: { type: Type.NUMBER, description: "Sequence order of the audio, 1-10." },
            raw_text: { type: Type.STRING, description: "Raw English transcription. Use <Inferred: text> for inferred content." },
            translated_text: { type: Type.STRING, description: "Chinese translation of the transcription." },
            inferred_flags: { type: Type.BOOLEAN, description: "True if there is any inferred text." }
          },
          required: ["sequence_order", "raw_text", "translated_text", "inferred_flags"]
        }
      },
      report_markdown: {
        type: Type.STRING,
        description: "The complete assessment report formatted precisely in Markdown according to the exact structure specified in the prompt."
      },
      report_title: {
        type: Type.STRING,
        description: "A concise and professional title for the report, covering key events (e.g. 跑道侵入) or scenarios, airport/country elements, formatted as 'Event - Location/Condition'. Keep it under 20 characters."
      },
      cbta_report: {
        type: Type.OBJECT,
        description: "CBTA pedagogical assessment report. Only return if the target assessment is PILOT.",
        properties: {
          scores: {
            type: Type.OBJECT,
            properties: {
              pronunciation: { type: Type.NUMBER, description: "Score from 1 to 6." },
              structure: { type: Type.NUMBER, description: "Score from 1 to 6." },
              vocabulary: { type: Type.NUMBER, description: "Score from 1 to 6." },
              fluency: { type: Type.NUMBER, description: "Score from 1 to 6." },
              comprehension: { type: Type.NUMBER, description: "Score from 1 to 6." },
              interaction: { type: Type.NUMBER, description: "Score from 1 to 6." }
            },
            required: ["pronunciation", "structure", "vocabulary", "fluency", "comprehension", "interaction"]
          }
        },
        required: ["scores"]
      }
    },
    required: ["segments", "report_markdown", "report_title"]
  };

  const schemaInstructions = `
    输出要求：
    你必须且只能返回合法的 JSON 格式。返回数据必须严格符合以下结构，不要多余和缺少字段，也不要使用 markdown code block:
    {
      "segments": [
        {
          "sequence_order": (数字),
          "raw_text": "推演部分用 <Inferred: ...> 包包裹",
          "translated_text": "...",
          "inferred_flags": (布尔值)
        }
      ]${cbtaReport ? `,
      "report_markdown": "这里填入严格按照指定的结构输出的完整Markdown评测报告，注意转义换行符等",
      "report_title": "这里填入报告标题（例如：中断起飞 - 菲律宾马尼拉）"${assessmentTarget === 'PILOT' ? `,
      "cbta_report": {
        "scores": {
          "pronunciation": 5,
          "structure": 4,
          "vocabulary": 5,
          "fluency": 4,
          "comprehension": 5,
          "interaction": 5
        }
      }` : ''}` : ''}
    }
  `;

  console.log("Calling Gemini API through GeminiManager..."); 
  
  let targetSchema = schemaWithoutReport;
  if (cbtaReport) {
    targetSchema = schemaWithMarkdownReport;
  }

  return await geminiManager.generateContent<any>(
    parts,
    systemInstruction + schemaInstructions,
    targetSchema,
    signal
  );
}

