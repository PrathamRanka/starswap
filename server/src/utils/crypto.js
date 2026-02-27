import crypto from 'crypto';

const getSecretKey = () => {
  const secret = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || 'fallback_secret_32_bytes_long_123';
  return crypto.createHash('sha256').update(secret).digest();
};

const ALGORITHM = 'aes-256-gcm';

export function encrypt(text) {
  if (!text) return text;
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(hash) {
  if (!hash) return hash;
  if (!hash.includes(':')) return hash; // Fallback for unencrypted legacy tokens
  
  try {
    const [ivHex, authTagHex, encryptedTextHex] = hash.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedTextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('[CRITICAL] Failed to decrypt token:', err.message);
    return null;
  }
}
