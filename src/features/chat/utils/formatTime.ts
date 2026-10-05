export const formatTime = (unixSeconds: number): string =>
  new Date(unixSeconds * 1000).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
