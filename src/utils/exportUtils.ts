import { marked } from 'marked';
import { generateDocxBlob } from './docxUtils';

export const generateReportHtml = (resultData: any, outputMode: string) => {
  const renderInferredText = (text: string) => {
    return text.replace(/<Inferred:([^>]+)>/g, "<span class='inferred'>[$1]</span>");
  };

  let segmentsHtml = resultData.segments.map((seg: any, index: number) => {
    const role = index % 2 === 0 ? 'ATC' : 'PILOT';
    const timePrefix = `00:${(index * 5).toString().padStart(2, '0')}`;
    const roleColor = role === 'ATC' ? '#1f2937' : '#0a66c2';
    const bgColor = role === 'ATC' ? '#f9fafb' : '#f0f7ff';
    const borderLeft = `4px solid ${roleColor}`;

    return `
      <div class="segment" style="border-left: ${borderLeft}; background-color: ${bgColor};">
        <div class="segment-header" style="color: ${roleColor};">
          <strong>${timePrefix} • ${role}</strong>
        </div>
        <div class="segment-body">
          <p class="english-text">${renderInferredText(seg.raw_text)}</p>
          ${outputMode === 'bilingual' ? `<p class="chinese-text">${seg.translated_text}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');

  let cbtaHtml = '';
  if (resultData.cbta_report && resultData.cbta_report.scores) {
    const r = resultData.cbta_report.scores;
    const scoresHtml = `
      <table class="score-table">
        <thead>
          <tr>
            <th>Pronunciation<br/><small>发音</small></th>
            <th>Structure<br/><small>结构</small></th>
            <th>Vocabulary<br/><small>词汇</small></th>
            <th>Fluency<br/><small>流利度</small></th>
            <th>Comprehension<br/><small>理解能力</small></th>
            <th>Interaction<br/><small>互动</small></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${r.scores.pronunciation} <span class="score-max">/ 6</span></td>
            <td>${r.scores.structure} <span class="score-max">/ 6</span></td>
            <td>${r.scores.vocabulary} <span class="score-max">/ 6</span></td>
            <td>${r.scores.fluency} <span class="score-max">/ 6</span></td>
            <td>${r.scores.comprehension} <span class="score-max">/ 6</span></td>
            <td>${r.scores.interaction} <span class="score-max">/ 6</span></td>
          </tr>
        </tbody>
      </table>
    `;
    cbtaHtml += `
      <div class="score-section">
        <h3>ICAO 语言胜任力评分 (Language Proficiency)</h3>
        ${scoresHtml}
      </div>
    `;
  }

  if (resultData.report_markdown) {
    const parsedHtml = marked.parse(resultData.report_markdown) as string;
    cbtaHtml += `
      <div class="cbta-container markdown-body">
        ${parsedHtml}
      </div>
    `;
  }

  const titleText = resultData.report_title || 'Assessment Report';
  
  return `
    <div class="report-wrapper">
      <div class="report-header">
        <h1>${titleText}</h1>
        <p class="doc-meta">Generated Date: ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="section">
        <h2>Communication Transcript <span class="subtitle">/ 陆空通话记录</span></h2>
        <div class="transcript-container">
          ${segmentsHtml}
        </div>
      </div>

      ${cbtaHtml}
    </div>
  `;
};

const commonStyles = `
  :root {
    --primary: #0f172a;
    --accent: #2563eb;
    --text-main: #1f2937;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --bg-light: #f8fafc;
  }
  body, .report-wrapper {
    font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.7;
    color: var(--text-main);
    margin: 0;
    padding: 0;
  }
  .report-wrapper {
    max-width: 850px;
    margin: 0 auto;
    padding: 30px;
    background: #ffffff;
  }
  .report-header {
    text-align: center;
    border-bottom: 2px solid var(--border);
    padding-bottom: 24px;
    margin-bottom: 40px;
  }
  h1 {
    font-size: 32px;
    color: var(--primary);
    margin: 0 0 12px 0;
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  .doc-meta {
    font-size: 14px;
    color: var(--text-muted);
    font-weight: 500;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  h2 {
    font-size: 22px;
    color: var(--primary);
    margin-top: 40px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    font-weight: 700;
    border-bottom: 1px solid var(--border);
    padding-bottom: 12px;
  }
  .subtitle {
    font-weight: 400;
    color: var(--text-muted);
    font-size: 0.75em;
    margin-left: 8px;
  }
  .segment {
    margin-bottom: 20px;
    padding: 20px 24px;
    border-radius: 0 12px 12px 0;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .segment-header {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 10px;
    font-weight: 700;
  }
  .english-text {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    color: #0f172a;
    line-height: 1.6;
  }
  .chinese-text {
    font-size: 15px;
    margin: 10px 0 0 0;
    color: var(--text-muted);
    line-height: 1.6;
  }
  .inferred {
    color: #c2410c;
    background: #ffedd5;
    padding: 2px 6px;
    border-radius: 4px;
    font-style: italic;
    font-weight: 600;
  }
  .markdown-body {
    margin-top: 50px;
    color: #334155;
    font-size: 15px;
    line-height: 1.8;
  }
  .markdown-body h1 {
    font-size: 26px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 10px;
    margin-top: 40px;
    margin-bottom: 16px;
  }
  .markdown-body h2 {
    font-size: 20px;
    margin-top: 32px;
    margin-bottom: 16px;
    border: none;
    padding: 0;
  }
  .markdown-body h3 {
    font-size: 17px;
    color: #475569;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 12px;
  }
  .markdown-body p {
    margin-bottom: 16px;
  }
  .markdown-body ul, .markdown-body ol {
    margin-bottom: 16px;
    padding-left: 24px;
  }
  .markdown-body li {
    margin-bottom: 8px;
  }
  .markdown-body strong {
    color: #0f172a;
  }
  .score-section {
    margin-top: 50px;
    padding-top: 10px;
  }
  .score-section h3 {
    font-size: 18px;
    color: var(--primary);
    margin-bottom: 20px;
    font-weight: 700;
  }
  .score-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 15px 0 30px 0;
    page-break-inside: avoid;
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }
  .score-table th, .score-table td {
    padding: 16px 12px;
    text-align: center;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .score-table th:last-child, .score-table td:last-child {
    border-right: none;
  }
  .score-table tbody tr:last-child td {
    border-bottom: none;
  }
  .score-table th {
    background-color: var(--bg-light);
    font-size: 13px;
    color: #475569;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .score-table th small {
    display: block;
    font-weight: 500;
    color: #94a3b8;
    margin-top: 4px;
    text-transform: none;
    letter-spacing: normal;
  }
  .score-table td {
    font-size: 26px;
    font-weight: 800;
    color: var(--primary);
    background-color: #ffffff;
  }
  .score-max {
    font-size: 14px;
    color: #94a3b8;
    font-weight: 600;
  }
`;

export const downloadAsPDF = async (resultData: any, outputMode: string, filename: string = 'ATC_Analysis_Report.pdf') => {
  if (typeof window === 'undefined' || !resultData) return;
  const html2pdf = (await import('html2pdf.js')).default;
  
  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = `
    <style>${commonStyles}</style>
    ${generateReportHtml(resultData, outputMode)}
  `;
  document.body.appendChild(container);

  const opt = {
    margin:       [15, 15, 20, 15] as [number, number, number, number],
    filename:     filename,
    image:        { type: 'jpeg' as const, quality: 1.0 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 800 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  await html2pdf().set(opt).from(container).save();
  document.body.removeChild(container);
};

export const downloadAsWord = async (resultData: any, outputMode: string, filename: string = 'ATC_Analysis_Report.docx') => {
  if (!resultData) return;
  
  try {
    const blob = await generateDocxBlob(resultData, outputMode);
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    if ((navigator as any).msSaveOrOpenBlob) {
      (navigator as any).msSaveOrOpenBlob(blob, filename);
    } else {
      link.click();
    }
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Docx generation failed: ", error);
  }
};
