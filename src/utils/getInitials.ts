export const getInitials = (name: string): string => {
  const trimmed = name.replace(/^\+/, '').trim();
  if (!trimmed) return '?';

  const words = trimmed.split(/\s+/);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
};
