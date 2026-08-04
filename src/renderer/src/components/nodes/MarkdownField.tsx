import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toggleCheckboxAt } from '../../lib/markdownCheckbox'

interface MarkdownFieldProps {
  markdown: string
  onChange: (markdown: string) => void
  placeholder?: string
}

export function MarkdownField({
  markdown,
  onChange,
  placeholder = '*(duplo clique para editar)*',
}: MarkdownFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(markdown)
  const checkboxCounter = useRef(0)
  checkboxCounter.current = 0

  function commit() {
    onChange(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        className="nodrag nowheel card-markdown-input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
      />
    )
  }

  return (
    <div
      className="card-markdown nowheel"
      onDoubleClick={() => {
        setDraft(markdown)
        setEditing(true)
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          input: (props) => {
            if (props.type !== 'checkbox') return <input {...props} />
            const index = checkboxCounter.current
            checkboxCounter.current += 1
            return (
              <input
                type="checkbox"
                className="nodrag"
                checked={!!props.checked}
                onChange={() => onChange(toggleCheckboxAt(markdown, index))}
              />
            )
          },
        }}
      >
        {markdown || placeholder}
      </ReactMarkdown>
    </div>
  )
}
