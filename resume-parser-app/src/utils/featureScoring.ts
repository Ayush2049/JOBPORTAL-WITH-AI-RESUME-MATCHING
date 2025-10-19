export const scoreName = (text: string): number => {
  let score = 0;

  if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(text)) score += 5;
  if (/^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+$/.test(text)) score += 4;
  if (text === text.toUpperCase() && text.split(" ").length === 2) score += 3;

  if (text.includes("@")) score -= 10;
  if (/\d/.test(text)) score -= 8;
  if (text.includes("|")) score -= 6;
  if (text.length > 30) score -= 5;

  return score;
};

export const scoreEmail = (text: string): number => {
  if (/\S+@\S+\.\S+/.test(text)) return 10;
  if (text.includes("@")) return 5;
  return -10;
};

export const scorePhone = (text: string): number => {
  if (/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text))
    return 10;
  if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) return 8;
  if (/\d{10}/.test(text)) return 6;
  return -10;
};

export const scoreLocation = (text: string): number => {
  if (/[A-Z][a-zA-Z\s]+, [A-Z]{2},? \d{5,6}/.test(text)) return 8;
  if (/[A-Z][a-zA-Z\s]+, [A-Z]{2}/.test(text)) return 6;
  if (/[A-Z][a-zA-Z\s]+(?:,|-) \d{5,6}/.test(text)) return 5;
  if (/[A-Z][a-zA-Z\s]+, [A-Z][a-zA-Z\s]+/.test(text)) return 4;
  return -5;
};

export const scoreUrl = (text: string): number => {
  if (/https?:\/\/[^\s]+/.test(text)) return 8;
  if (/[a-zA-Z0-9]+\.[a-zA-Z]{2,}(\/[^\s]*)?/.test(text)) return 6;
  return -5;
};
