import { Filter } from 'bad-words';

const filter = new Filter();

export const isProfane = (text: string): boolean => {
  return filter.isProfane(text);
};

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  // Length check
  if (username.length < 3 || username.length > 12) {
    return { valid: false, error: 'Username must be 3-12 characters' };
  }

  // Alphanumeric and underscore only
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Only letters, numbers, and underscores allowed' };
  }

  // Profanity check
  if (isProfane(username)) {
    return { valid: false, error: 'Username contains inappropriate content' };
  }

  return { valid: true };
};
