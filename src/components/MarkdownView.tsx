import React from "react";

interface MarkdownViewProps {
  content: string;
}

export function MarkdownView({ content }: MarkdownViewProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  
  let inList = false;
  let listItems: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    // Matches **bold text** or `inline code`
    const regex = /(\*\*|`)(.*?)\1/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const delimiter = match[1];
      const matchContent = match[2];

      // Add preceding plain text
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      if (delimiter === "**") {
        parts.push(
          <strong key={key++} className="font-semibold text-slate-900 dark:text-slate-100">
            {matchContent}
          </strong>
        );
      } else if (delimiter === "`") {
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700/60">
            {matchContent}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  lines.forEach((line, index) => {
    // Code block toggling
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        renderedElements.push(
          <pre key={`code-${index}`} className="p-4 bg-slate-950 text-emerald-400 rounded-xl overflow-x-auto font-mono text-xs md:text-sm my-4 shadow-inner border border-slate-800">
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    // Heading levels
    if (line.startsWith("# ")) {
      renderedElements.push(
        <h1 key={index} className="text-2xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2">
          {parseInlineStyles(line.substring(2))}
        </h1>
      );
      return;
    }
    if (line.startsWith("## ")) {
      renderedElements.push(
        <h2 key={index} className="text-xl font-bold text-slate-900 dark:text-white mt-5 mb-2.5 tracking-tight">
          {parseInlineStyles(line.substring(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith("### ")) {
      renderedElements.push(
        <h3 key={index} className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2">
          {parseInlineStyles(line.substring(4))}
        </h3>
      );
      return;
    }

    // Standard list items (regex matching '-' or '*' list items)
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const itemText = listMatch[3];
      if (!inList) {
        inList = true;
        listItems = [itemText];
      } else {
        listItems.push(itemText);
      }
      
      // Check if next line continues the list
      const nextLine = lines[index + 1];
      const nextLineIsList = nextLine && nextLine.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
      if (!nextLineIsList) {
        renderedElements.push(
          <ul key={`list-${index}`} className="list-disc pl-5 my-3 space-y-1.5 text-slate-700 dark:text-slate-300">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm md:text-base leading-relaxed">
                {parseInlineStyles(item)}
              </li>
            ))}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      return;
    }

    // Empty lines
    if (!line.trim()) {
      return;
    }

    // Blockquotes (e.g. > Note)
    if (line.startsWith("> ")) {
      renderedElements.push(
        <blockquote key={index} className="pl-4 border-l-4 border-indigo-500 italic text-slate-600 dark:text-slate-400 my-4 bg-slate-50 dark:bg-slate-900/40 py-2 pr-2 rounded-r-md">
          {parseInlineStyles(line.substring(2))}
        </blockquote>
      );
      return;
    }

    // Generic Paragraph
    renderedElements.push(
      <p key={index} className="my-2.5 text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
        {parseInlineStyles(line)}
      </p>
    );
  });

  if (inCodeBlock && codeLines.length > 0) {
    renderedElements.push(
      <pre key="code-final" className="p-4 bg-slate-950 text-emerald-400 rounded-xl overflow-x-auto font-mono text-xs md:text-sm my-4 border border-slate-800">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return <div className="space-y-1 text-slate-800 dark:text-slate-100">{renderedElements}</div>;
}
