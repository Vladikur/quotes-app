export function normalizeSearchString(str: string | null | undefined): string {
  if (!str) return ''

  return str
    .toLowerCase()
    .normalize('NFKD') // ё → е + диакритика
    .replace(/[̀-ͯ]/g, '') // убрать диакритику
    .replace(/[^a-zа-я0-9\s]/gi, ' ') // убрать пунктуацию
    .replace(/\s+/g, ' ')
    .trim()
}
