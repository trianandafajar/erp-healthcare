import matter from 'gray-matter'

export async function getListPage(filePath: string) {
  if (import.meta.server) {
    const fs = await import('fs')
    const path = await import('path')
    const fullPath = path.resolve(process.cwd(), 'app', filePath)
    const content = fs.readFileSync(fullPath, 'utf-8')
    const { data } = matter(content)
    return { frontmatter: data }
  }
  return { frontmatter: {} }
}
