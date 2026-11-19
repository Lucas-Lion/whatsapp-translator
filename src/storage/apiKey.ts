const apiKeyStorageKey = "geminiApiKey";

export const restrictApiKeyStorage = (): Promise<void> => (
  chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })
);

export const readApiKey = async (): Promise<string> => {
  await restrictApiKeyStorage();
  const stored = await chrome.storage.local.get(apiKeyStorageKey);
  const apiKey: unknown = stored[apiKeyStorageKey];
  return typeof apiKey === "string" ? apiKey.trim() : "";
};

export const saveApiKey = async (apiKey: string): Promise<void> => {
  await restrictApiKeyStorage();
  await chrome.storage.local.set({ [apiKeyStorageKey]: apiKey });
};
