import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="md-body">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  )
}
