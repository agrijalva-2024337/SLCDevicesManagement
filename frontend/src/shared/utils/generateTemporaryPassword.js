const LOWERS = 'abcdefghijkmnpqrstuvwxyz';
const UPPERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?';
const ALL = LOWERS + UPPERS + DIGITS + SYMBOLS;

function pick(alphabet) {
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

/** Clave temporal de 12 caracteres: mayúscula, minúscula, dígito y símbolo. */
export function generateTemporaryPassword(length = 12) {
  const chars = [pick(UPPERS), pick(LOWERS), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < length) {
    chars.push(pick(ALL));
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
