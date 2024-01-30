import crypto from 'crypto'

export const getHash = (value) => {
  const s = crypto.createHash('sha256')
  s.update(value)
  return s.digest('hex')
}
