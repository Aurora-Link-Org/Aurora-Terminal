// Placeholder for formatting utilities
export const formatTimestamp = (date: Date): string => {
  return `[${date.toLocaleTimeString()}]`;
};

export const stringToHex = (str: string): string => {
  return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
};
