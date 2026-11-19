const composerSelector = '#main footer [contenteditable="true"][role="textbox"]';

export const sendActionSelector = [
  'button[aria-label="Enviar"]',
  'button[aria-label="Send"]',
  '[data-icon="send"]',
  '[data-icon="wds-ic-send-filled"]'
].join(", ");

export const findComposer = (): HTMLElement | null => {
  const composers = document.querySelectorAll<HTMLElement>(composerSelector);

  return Array.from(composers).find((composer) => (
    !composer.closest('[aria-hidden="true"], [inert]') &&
    composer.getClientRects().length > 0 &&
    getComputedStyle(composer).visibility === "visible"
  )) ?? null;
};

export const readComposerText = (composer: HTMLElement): string => composer.innerText;

export const watchComposerDraft = (composer: HTMLElement, original: string, onInvalidated?: () => void) => {
  const conversation = composer.closest("#main");
  const header = conversation?.querySelector("header");
  const chatTitle = header?.querySelector('span[dir="auto"]') ?? header;
  const chatList = document.getElementById("pane-side");
  const selectedChatSelector = '[aria-selected="true"], [aria-current="true"]';
  const selectedChat = chatList?.querySelector(selectedChatSelector);
  const url = location.href;
  const listeners = new AbortController();
  let draftChanged = false;
  let contextChanged = false;
  const invalidateDraft = (): void => {
    if (!draftChanged) {
      draftChanged = true;
      onInvalidated?.();
    }
  };
  const invalidateContext = (): void => {
    if (!contextChanged) {
      contextChanged = true;
      onInvalidated?.();
    }
  };

  const options = { capture: true, signal: listeners.signal };
  for (const event of ["beforeinput", "input", "paste", "compositionstart"]) {
    composer.addEventListener(event, invalidateDraft, options);
  }
  composer.addEventListener("keydown", (event) => {
    if (event.isTrusted && event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      invalidateContext();
    }
  }, options);
  composer.closest("footer")?.addEventListener("click", (event) => {
    if (event.isTrusted && event.target instanceof Element) {
      const action = event.target.closest('button, [role="button"]');
      if (action?.matches(sendActionSelector) || action?.querySelector(sendActionSelector)) {
        invalidateContext();
      }
    }
  }, options);
  chatList?.addEventListener("click", invalidateContext, options);
  window.addEventListener("popstate", invalidateContext, options);
  window.addEventListener("pagehide", invalidateContext, options);

  const inspectChanges = (records: MutationRecord[]): void => {
    if (!draftChanged && records.some((record) => composer.contains(record.target))) {
      invalidateDraft();
    }
    if (!contextChanged && records.some((record) => (
      chatTitle?.contains(record.target) ||
      (record.target === selectedChat && record.type === "attributes") ||
      Array.from(record.removedNodes).some((node) => (
        node.contains(composer) || (header && node.contains(header)) ||
        (chatTitle && node.contains(chatTitle)) || (selectedChat && node.contains(selectedChat))
      ))
    ))) {
      invalidateContext();
    }
  };

  const observer = new MutationObserver(inspectChanges);
  observer.observe(document.body, { subtree: true, childList: true });
  observer.observe(composer, { subtree: true, childList: true, characterData: true });
  if (chatTitle) {
    observer.observe(chatTitle, { subtree: true, childList: true, characterData: true, attributeFilter: ["title"] });
  }
  if (selectedChat) {
    observer.observe(selectedChat, { attributeFilter: ["aria-selected", "aria-current"] });
  }

  const isCurrentContext = (): boolean => {
    inspectChanges(observer.takeRecords());
    return !contextChanged && location.href === url && findComposer() === composer &&
      conversation?.querySelector("header") === header && chatList?.querySelector(selectedChatSelector) === selectedChat;
  };

  return {
    isCurrentContext,
    isCurrent: (): boolean => isCurrentContext() && !draftChanged && readComposerText(composer) === original,
    stop: (): void => {
      listeners.abort();
      observer.disconnect();
    }
  };
};

const waitForEditorUpdate = (): Promise<void> => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
});

const selectComposerText = (composer: HTMLElement, selection: Selection): Range => {
  const range = document.createRange();
  range.selectNodeContents(composer);
  selection.removeAllRanges();
  selection.addRange(range);
  return range;
};

const editComposerText = async (
  composer: HTMLElement,
  original: string,
  text: string,
  isCurrentContext: () => boolean
): Promise<boolean> => {
  if (!isCurrentContext()) {
    return false;
  }

  composer.focus({ preventScroll: true });

  const selection = document.getSelection();
  if (!selection || document.activeElement !== composer || !composer.isContentEditable ||
      !isCurrentContext() || readComposerText(composer) !== original) {
    return false;
  }

  let range = selectComposerText(composer, selection);
  const selectedDraft = selection.toString().trim();
  const isLexical = composer.matches('[data-lexical-editor="true"]');
  const isMultiline = text.includes("\n");
  const editListeners = new AbortController();
  let interrupted = false;
  let attemptedEdit = false;
  let runningNativeCommand = false;
  const interrupt = (event: Event): void => {
    if (event.isTrusted && !runningNativeCommand) {
      interrupted = true;
    }
  };
  const options = { capture: true, signal: editListeners.signal };
  composer.addEventListener("beforeinput", interrupt, options);
  composer.addEventListener("input", interrupt, options);
  composer.addEventListener("paste", interrupt, options);
  composer.addEventListener("compositionstart", interrupt, options);
  composer.addEventListener("blur", interrupt, options);

  const hasOriginalDraft = (): boolean => (
    !interrupted && document.activeElement === composer && isCurrentContext() &&
    readComposerText(composer) === original
  );
  const hasFullSelection = (): boolean => (
    selection.rangeCount > 0 && composer.contains(selection.getRangeAt(0).commonAncestorContainer) &&
    Boolean(selectedDraft) && selection.toString().trim() === selectedDraft
  );

  try {
    // Lexical syncs its document selection after the DOM selection changes.
    await waitForEditorUpdate();
    if (!hasOriginalDraft()) {
      return false;
    }

    // Lexical's native insertText path can drop line breaks in a single edit.
    if (hasFullSelection() && !(isLexical && isMultiline)) {
      attemptedEdit = true;
      runningNativeCommand = true;
      try {
        document.execCommand("insertText", false, text);
      } catch {
        // Check the resulting draft before choosing the fallback.
      } finally {
        runningNativeCommand = false;
      }
      await waitForEditorUpdate();
    }

    if (!hasOriginalDraft() || !isLexical) {
      return attemptedEdit;
    }

    range = selectComposerText(composer, selection);
    if (!hasFullSelection()) {
      return attemptedEdit;
    }

    // Pass the text to Lexical's paste handler without changing the system clipboard.
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", text);
    if (isMultiline) {
      const paragraph = document.createElement("p");
      text.split("\n").forEach((line, index) => {
        if (index > 0) {
          paragraph.append(document.createElement("br"));
        }
        paragraph.append(line);
      });
      clipboardData.setData("text/html", paragraph.outerHTML);
    }
    composer.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, composed: true, clipboardData }));
    await waitForEditorUpdate();
    return true;
  } finally {
    editListeners.abort();
    if (!interrupted && document.activeElement === composer &&
        selection.rangeCount > 0 && selection.getRangeAt(0) === range) {
      selection.collapseToEnd();
    }
  }
};

type ReplacementResult = "applied" | "unchanged" | "recovery" | "stale";

export const replaceComposerText = async (
  composer: HTMLElement,
  original: string,
  translation: string,
  isCurrentContext: () => boolean
): Promise<ReplacementResult> => {
  const attemptedEdit = await editComposerText(composer, original, translation, isCurrentContext);

  if (!isCurrentContext()) {
    return attemptedEdit ? "recovery" : "stale";
  }

  const currentText = readComposerText(composer);
  if (!attemptedEdit && currentText !== original) {
    return "stale";
  }
  if (currentText === translation) {
    return "applied";
  }

  return currentText === original ? "unchanged" : "recovery";
};
