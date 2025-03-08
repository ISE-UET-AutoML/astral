import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { stackoverflowDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // This is fine as a direct import

const MarkdownRenderer = ({ markdownText }) => {
  useEffect(() => {
    import("katex/dist/katex.min.css");
  }, []);
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}  // Handles Markdown parsing with math and GFM
        rehypePlugins={[rehypeKatex]}  // Handles rendering of LaTeX math expressions
        components={{
          code({ className, children, ...rest }) {
            const match = /language-(\w+)/.exec(className || "") || [null, null];
            const language = match[1]; // If there's no language, it's null
            // If no language is provided, we can treat it as plain text and still highlight it
            const code = children.trim();

            return language ? (
              <SyntaxHighlighter
                PreTag="div"
                language={language}  // Syntax highlighting with the specified language
                style={stackoverflowDark}
                {...rest}
              >
                {code}
              </SyntaxHighlighter>
            ) : (
              // For code blocks without a specified language, treat them as plain text
              <SyntaxHighlighter
                PreTag="div"
                language="text"  // Treating it as plain text (or CSV) in this case
                style={stackoverflowDark}
                {...rest}
              >
                {code}
              </SyntaxHighlighter>
            );
          },
        }}
      >
        {markdownText}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
