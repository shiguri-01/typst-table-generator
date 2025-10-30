const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const createColumnTitle = (index: number) => {
  let title = "";
  let n = index;
  while (n >= 0) {
    title = ALPHABET[n % ALPHABET.length] + title;
    n = Math.floor(n / ALPHABET.length) - 1;
  }
  return title;
};
