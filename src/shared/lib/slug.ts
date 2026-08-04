const DIACRITICS_REGEX = /[̀-ͯ]/g

export function slugify(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || 'sem-titulo'
}

export function uniqueSlug(text: string, existing: Iterable<string>): string {
  const base = slugify(text)
  const taken = new Set(existing)
  if (!taken.has(base)) return base

  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1
  }
  return `${base}-${suffix}`
}
