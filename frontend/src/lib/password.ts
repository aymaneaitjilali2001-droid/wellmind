// Règles de mot de passe : les mêmes que validatePassword() dans le backend

export const PASSWORD_HINT = '8 caractères minimum, avec une lettre et un chiffre.';

// Message d'erreur, ou undefined si le mot de passe est valide
export const passwordError = (password: string): string | undefined => {
  if (password.length < 8) return 'Au moins 8 caractères.';
  if (password.length > 100) return 'Le mot de passe est trop long.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Au moins une lettre et un chiffre.';
  return undefined;
};

// Mot de passe provisoire aléatoire de 12 caractères (lettres + chiffres).
// Les caractères faciles à confondre (0/O, 1/l/I) sont exclus pour faciliter la transmission.
export const generatePassword = (): string => {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = letters + digits;
  const random = crypto.getRandomValues(new Uint32Array(12));
  const chars = Array.from(random, (n) => all[n % all.length]);
  chars[0] = letters[random[0] % letters.length]; // au moins une lettre
  chars[1] = digits[random[1] % digits.length]; // au moins un chiffre
  return chars.join('');
};