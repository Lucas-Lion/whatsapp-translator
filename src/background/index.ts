import { translateText } from "../services/translationService";
import { readApiKey, restrictApiKeyStorage } from "../storage/apiKey";
import type { TranslationResponse } from "../types/translation";

const translatingTabs = new Set<number>();

const initializeStorage = (): void => {
  void restrictApiKeyStorage().catch(() => undefined);
};

const translateDraft = async (text: string, tabId: number): Promise<TranslationResponse> => {
  if (translatingTabs.has(tabId)) {
    return { ok: false, error: "inProgress" };
  }

  translatingTabs.add(tabId);
  try {
    const apiKey = await readApiKey();
    return apiKey ? await translateText(text, apiKey) : { ok: false, error: "missingKey" };
  } catch {
    return { ok: false, error: "unexpected" };
  } finally {
    translatingTabs.delete(tabId);
  }
};

chrome.runtime.onInstalled.addListener(initializeStorage);
chrome.runtime.onStartup.addListener(initializeStorage);

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || sender.frameId !== 0 ||
      !sender.url?.startsWith("https://web.whatsapp.com/") ||
      typeof message !== "object" || message === null || !("type" in message)) {
    return;
  }

  if (message.type === "openOptions") {
    void chrome.runtime.openOptionsPage().then(() => sendResponse(true), () => sendResponse(false));
    return true;
  }

  const tabId = sender.tab?.id;
  if (tabId !== undefined && message.type === "translateDraft" && "text" in message &&
      typeof message.text === "string" && message.text.trim()) {
    void translateDraft(message.text, tabId).then(sendResponse);
    return true;
  }
});

initializeStorage();
