'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to format inline elements (bold, italic, inline code)
  const formatInline = (text: string) => {
    const parts: (string | React.ReactNode)[] = [];
    let key = 0;

    // Pattern for inline code, bold, and italic
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }

      const val = match[0];
      if (val.startsWith('`') && val.endsWith('`')) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#0B0F17] text-[#34D399] border border-white/10 font-mono text-[11px] font-semibold"
          >
            {val.slice(1, -1)}
          </code>
        );
      } else if (val.startsWith('**') && val.endsWith('**')) {
        parts.push(
          <strong key={key++} className="font-bold text-[#F9FAFB]">
            {val.slice(2, -2)}
          </strong>
        );
      } else if (val.startsWith('*') && val.endsWith('*')) {
        parts.push(
          <em key={key++} className="italic text-[#E5E7EB]">
            {val.slice(1, -1)}
          </em>
        );
      }

      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts;
  };

  // Split into blocks: code blocks vs text lines
  const parseBlocks = (text: string) => {
    const blocks: { type: 'code' | 'text'; content: string; language?: string }[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIdx = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        blocks.push({ type: 'text', content: text.substring(lastIdx, match.index) });
      }
      blocks.push({
        type: 'code',
        language: match[1] || 'code',
        content: match[2].trim(),
      });
      lastIdx = codeBlockRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      blocks.push({ type: 'text', content: text.substring(lastIdx) });
    }

    return blocks;
  };

  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-3 leading-relaxed text-xs text-[#F9FAFB] ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <div
              key={bIdx}
              className="my-3 rounded-2xl bg-[#0B0F17] border border-white/10 overflow-hidden font-mono text-[11px] shadow-lg"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-[10px] text-[#9CA3AF]">
                <span className="font-semibold text-[#10B981] uppercase tracking-wider">
                  {block.language}
                </span>
                <button
                  onClick={() => handleCopy(block.content, bIdx)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedIndex === bIdx ? (
                    <>
                      <Check className="h-3 w-3 text-[#34D399]" />
                      <span className="text-[#34D399]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[#E5E7EB] leading-normal">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        // Render text lines with markdown elements and responsive table detection
        const lines = block.content.split('\n');
        const renderedElements: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();

          // Markdown Table detection: contiguous lines starting with '|'
          if (trimmed.startsWith('|') && (trimmed.endsWith('|') || trimmed.includes('|'))) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().includes('|') && (lines[i].trim().startsWith('|') || lines[i].trim().endsWith('|'))) {
              tableLines.push(lines[i].trim());
              i++;
            }

            if (tableLines.length >= 2) {
              const parseRow = (r: string) => r.split('|').map((c) => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
              const headerRow = parseRow(tableLines[0]);
              
              // Skip delimiter row if present (| :--- | :--- |)
              let startDataIdx = 1;
              if (tableLines.length > 1 && tableLines[1].includes('---')) {
                startDataIdx = 2;
              }

              const dataRows = tableLines.slice(startDataIdx).map(parseRow);

              renderedElements.push(
                <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-2xl border border-[#10B981]/30 bg-[#0B0F17]/90 shadow-xl">
                  <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                    <thead>
                      <tr className="bg-white/10 border-b border-white/15">
                        {headerRow.map((headerText, hIdx) => (
                          <th key={hIdx} className="px-4 py-3 font-bold text-[#34D399] uppercase tracking-wider text-[11px]">
                            {formatInline(headerText)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dataRows.map((rowCells, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                          {rowCells.map((cellText, cIdx) => (
                            <td key={cIdx} className="px-4 py-3 text-[#E5E7EB] leading-relaxed align-top">
                              {formatInline(cellText)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
              continue;
            }
          }

          if (!trimmed) {
            renderedElements.push(<div key={`empty-${i}`} className="h-1" />);
            i++;
            continue;
          }

          // Headings
          if (trimmed.startsWith('# ')) {
            renderedElements.push(
              <h1 key={`h1-${i}`} className="text-lg font-bold text-[#F9FAFB] pt-2 pb-1 border-b border-white/10">
                {formatInline(trimmed.substring(2))}
              </h1>
            );
            i++;
            continue;
          }
          if (trimmed.startsWith('## ')) {
            renderedElements.push(
              <h2 key={`h2-${i}`} className="text-sm font-bold text-[#34D399] pt-3 pb-1 border-b border-[#10B981]/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                {formatInline(trimmed.substring(3))}
              </h2>
            );
            i++;
            continue;
          }
          if (trimmed.startsWith('### ')) {
            renderedElements.push(
              <h3 key={`h3-${i}`} className="text-xs font-bold text-[#F9FAFB] pt-2">
                {formatInline(trimmed.substring(4))}
              </h3>
            );
            i++;
            continue;
          }

          // Horizontal Rule
          if (trimmed === '---' || trimmed === '***') {
            renderedElements.push(<hr key={`hr-${i}`} className="my-3 border-white/10" />);
            i++;
            continue;
          }

          // Blockquotes
          if (trimmed.startsWith('> ')) {
            renderedElements.push(
              <blockquote
                key={`quote-${i}`}
                className="p-3 my-2 rounded-xl bg-[#10B981]/10 border-l-4 border-[#10B981] text-[#E5E7EB] text-xs font-medium"
              >
                {formatInline(trimmed.substring(2))}
              </blockquote>
            );
            i++;
            continue;
          }

          // Bullet lists
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            renderedElements.push(
              <div key={`list-${i}`} className="flex items-start gap-2 pl-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
                <div className="flex-1">{formatInline(trimmed.substring(2))}</div>
              </div>
            );
            i++;
            continue;
          }

          // Numbered lists
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            renderedElements.push(
              <div key={`num-${i}`} className="flex items-start gap-2 pl-2 py-0.5">
                <span className="px-1.5 py-0.5 rounded-md bg-[#10B981]/20 border border-[#10B981]/30 text-[10px] font-bold text-[#34D399] shrink-0">
                  {numMatch[1]}
                </span>
                <div className="flex-1">{formatInline(numMatch[2])}</div>
              </div>
            );
            i++;
            continue;
          }

          // Normal text line
          renderedElements.push(
            <p key={`p-${i}`} className="leading-relaxed">
              {formatInline(line)}
            </p>
          );
          i++;
        }

        return <div key={bIdx} className="space-y-1.5">{renderedElements}</div>;
      })}
    </div>
  );
};
