export function normalizeToUTCDate(date) {
  const d = new Date(date)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export function differenceInDaysUTC(date1, date2) {
  const ONE_DAY = 24 * 60 * 60 * 1000
  const utc1 = normalizeToUTCDate(date1)
  const utc2 = normalizeToUTCDate(date2)
  return Math.floor((utc1 - utc2) / ONE_DAY)
}