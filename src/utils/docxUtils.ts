import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';

export const generateDocxBlob = async (resultData: any, outputMode: string, pageMode: 'ECO' | 'WORKBENCH' = 'WORKBENCH') => {
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: resultData.report_title || 'Assessment Report',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  children.push(
    new Paragraph({
      text: `Generated Date: ${new Date().toLocaleDateString()}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    })
  );

  // Transcript Section
  if (pageMode === 'WORKBENCH') {
    children.push(
      new Paragraph({
        text: 'Communication Transcript / 陆空通话记录',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 400, before: 400 },
      })
    );

    if (resultData.segments && resultData.segments.length > 0) {
      resultData.segments.forEach((seg: any, index: number) => {
        const role = index % 2 === 0 ? 'ATC' : 'PILOT';
        const timePrefix = `00:${(index * 5).toString().padStart(2, '0')}`;
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${timePrefix} • ${role}`,
                bold: true,
                color: role === 'ATC' ? '1F2937' : '0A66C2',
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        // Raw text (with basic inferred tag stripping or rendering)
        const cleanRaw = seg.raw_text.replace(/<Inferred:([^>]+)>/g, '[$1]');
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cleanRaw, size: 24 })], // 24 = 12pt
            spacing: { after: outputMode === 'bilingual' ? 0 : 200 },
          })
        );

        if (outputMode === 'bilingual' && seg.translated_text) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: seg.translated_text,
                  color: '64748B',
                  size: 22, // 11pt
                }),
              ],
              spacing: { after: 200 },
            })
          );
        }
      });
    }
  }

  // CBTA Report
  if (pageMode === 'WORKBENCH' && resultData.cbta_report && resultData.cbta_report.scores) {
    children.push(
      new Paragraph({
        text: 'ICAO 语言胜任力评分 (Language Proficiency)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 800, after: 400 },
      })
    );

    const r = resultData.cbta_report.scores;
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('Pronunciation / 发音')] }),
            new TableCell({ children: [new Paragraph('Structure / 结构')] }),
            new TableCell({ children: [new Paragraph('Vocabulary / 词汇')] }),
            new TableCell({ children: [new Paragraph('Fluency / 流利度')] }),
            new TableCell({ children: [new Paragraph('Comprehension / 理解')] }),
            new TableCell({ children: [new Paragraph('Interaction / 互动')] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(`${r.pronunciation} / 6`)] }),
            new TableCell({ children: [new Paragraph(`${r.structure} / 6`)] }),
            new TableCell({ children: [new Paragraph(`${r.vocabulary} / 6`)] }),
            new TableCell({ children: [new Paragraph(`${r.fluency} / 6`)] }),
            new TableCell({ children: [new Paragraph(`${r.comprehension} / 6`)] }),
            new TableCell({ children: [new Paragraph(`${r.interaction} / 6`)] }),
          ],
        }),
      ],
    });
    children.push(table);
  }

  // Markdown Report Section
  if (resultData.report_markdown) {
    children.push(
      new Paragraph({
        text: pageMode === 'ECO' ? 'Analysis Report' : 'Detailed Analysis',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 800, after: 400 },
      })
    );

    // Context for parsing table
    let inTable = false;
    let tableRows: TableRow[] = [];

    const lines = resultData.report_markdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) {
            if (inTable && tableRows.length > 0) {
                children.push(new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: tableRows,
                }));
                inTable = false;
                tableRows = [];
            }
            continue;
        }

        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            inTable = true;
            if (trimmed.match(/^\|(?:\s*:?---+:?\s*\|)+$/)) {
                continue; // Skip alignment row
            }
            const cells = trimmed.split('|').slice(1, -1).map(c => c.trim().replace(/\*\*/g, ''));
            const isHeader = tableRows.length === 0;
            
            tableRows.push(
                new TableRow({
                    children: cells.map(cell => new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: cell, size: 20, bold: isHeader })],
                          alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT
                        })],
                        shading: isHeader ? { fill: "F3F4F6" } : undefined,
                        margins: { top: 150, bottom: 150, left: 150, right: 150 },
                    }))
                })
            );
            continue;
        } else {
            if (inTable && tableRows.length > 0) {
                children.push(new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: tableRows,
                }));
                inTable = false;
                tableRows = [];
            }
        }
        
        let isHeading = trimmed.startsWith('#');
        let isBlockquote = trimmed.startsWith('>');
        let isList = trimmed.match(/^[\-\*]\s/) || trimmed.match(/^\d+\.\s/);
        
        let cleanLine = trimmed.replace(/^#+\s*/, '').replace(/^>\s*/, '').replace(/\*\*/g, '');
        
        children.push(
          new Paragraph({
            children: [new TextRun({ 
              text: cleanLine, 
              bold: isHeading, 
              size: isHeading ? 28 : (isBlockquote ? 20 : 24),
              color: isBlockquote ? '555555' : '000000',
              italics: isBlockquote
            })],
            indent: isList ? { left: 360 } : (isBlockquote ? { left: 720 } : undefined),
            spacing: { after: isHeading ? 200 : 150, before: isHeading ? 200 : 0 },
            border: isBlockquote ? {
                left: {
                    color: "3b82f6", // blue-500
                    space: 10,
                    style: BorderStyle.THICK,
                    size: 18,
                }
            } : undefined
          })
        );
    }
    
    if (inTable && tableRows.length > 0) {
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
        }));
    }
  }

  const doc = new Document({
    creator: 'AtcMaster',
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  return await Packer.toBlob(doc);
};
