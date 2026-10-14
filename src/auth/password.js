import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain, encryptedPassword) {
  return bcrypt.compare(plain, encryptedPassword);
}
