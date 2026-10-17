import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export class PasswordProvider {
  hash(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  compare(plain, encryptedPassword) {
    return bcrypt.compare(plain, encryptedPassword);
  }
}
