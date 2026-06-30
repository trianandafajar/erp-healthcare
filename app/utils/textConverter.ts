import { marked } from 'marked'

export function markdownify(content: string): string {
  if (!content) return ''
  return marked.parseInline(content, { breaks: true })
}

export function plainify(content: string): string {
  if (!content) return ''
  const html = marked.parse(content, { breaks: true })
  return html.replace(/<[^>]*>/g, '').trim()
}

export function renderMarkdown(content: string): string {
  if (!content) return ''
  return marked.parse(content, { breaks: true })
}
