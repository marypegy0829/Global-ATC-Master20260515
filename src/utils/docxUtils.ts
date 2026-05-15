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

export const generateDocxBlob = async (resultData: any, outputMode: string) => {
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

  // CBTA Report
  if (resultData.cbta_report && resultData.cbta_report.scores) {
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
        text: 'Detailed Analysis',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 800, after: 400 },
      })
    );

    // Simple markdown parsing to text paragraphs (stripping bold/headers for simplicity)
    const lines = resultData.report_markdown.split('\n');
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      let isBold = trimmed.startsWith('#');
      let cleanLine = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cleanLine, bold: isBold })],
          spacing: { after: 150 },
        })
      );
    });
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
