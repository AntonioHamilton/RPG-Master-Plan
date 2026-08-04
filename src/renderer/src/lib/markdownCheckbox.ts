export function toggleCheckboxAt(markdown: string, index: number): string {
  let count = -1
  return markdown
    .split('\n')
    .map((line) => {
      const match = line.match(/^(\s*[-*+]\s+)\[([ xX])\](.*)$/)
      if (!match) return line
      count += 1
      if (count !== index) return line
      const checked = match[2].toLowerCase() === 'x'
      return `${match[1]}[${checked ? ' ' : 'x'}]${match[3]}`
    })
    .join('\n')
}
