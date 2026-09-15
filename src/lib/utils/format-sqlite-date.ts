export function formatSqliteDate(date: Date = new Date()): string {
  return date
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d+Z$/, '')
}
