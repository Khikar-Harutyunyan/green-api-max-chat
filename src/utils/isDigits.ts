/** True when the text, ignoring surrounding spaces, is digits only. */
export const isDigits = (value: string): boolean => /^\d+$/.test(value.trim());
