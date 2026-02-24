export const getRivoHeaders = () => ({
  Authorization: process.env.RIVO_KEY || '',
  'Content-Type': 'application/json',
})

export const getRivoHeadersWithFormData = () => ({
  Authorization: process.env.RIVO_KEY || '',
  'Content-Type': 'application/x-www-form-urlencoded',
})