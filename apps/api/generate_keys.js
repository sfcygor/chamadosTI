const crypto = require('crypto');
const fs = require('fs');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.appendFileSync('.env', `\nJWT_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"\n`);
fs.appendFileSync('.env', `JWT_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"\n`);

console.log('Chaves geradas e salvas no .env');
