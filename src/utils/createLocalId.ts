let localIdCounter = 0;

export const createLocalId = (): string => {
  const uuid = globalThis.crypto?.randomUUID?.();
  localIdCounter += 1;
  return uuid ?? `local-${localIdCounter}`;
};
