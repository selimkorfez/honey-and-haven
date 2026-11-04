/**
 * Hot or iced drinks first: iced in spring and summer (March–August), hot in autumn and winter
 * (September–February), going by the date in the UK.
 */
export type Temp = 'hot' | 'iced'

export function seasonTemp(now = new Date()): Temp {
  const month = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', month: 'numeric' }).format(now))
  return month >= 3 && month <= 8 ? 'iced' : 'hot'
}
