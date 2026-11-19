const composerSelector = '#main footer [contenteditable="true"][role="textbox"]';

export const findComposer = (): HTMLElement | null => {
  const composers = document.querySelectorAll<HTMLElement>(composerSelector);

  return Array.from(composers).find((composer) => (
    !composer.closest('[aria-hidden="true"], [inert]') &&
    composer.getClientRects().length > 0 &&
    getComputedStyle(composer).visibility === "visible"
  )) ?? null;
};

export const readComposerText = (composer: HTMLElement): string => composer.innerText;

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

const editComposerText = async (composer: HTMLElement, original: string, text: string): Promise<void> => {
  composer.focus({ preventScroll: true });

  const selection = document.getSelection();
  if (!selection || document.activeElement !== composer || !composer.isContentEditable ||
      findComposer() !== composer || readComposerText(composer) !== original) {
    return;
  }

  let range = selectComposerText(composer, selection);
  const editListeners = new AbortController();
  let interrupted = false;
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
  composer.addEventListener("blur", interrupt, options);

  const hasOriginalDraft = (): boolean => (
    !interrupted && document.activeElement === composer && findComposer() === composer &&
    readComposerText(composer) === original
  );
  const hasFullSelection = (): boolean => (
    selection.rangeCount > 0 && composer.contains(selection.getRangeAt(0).commonAncestorContainer) &&
    selection.toString().trim() === original.trim()
  );

  try {
    // Lexical syncs its document selection after the DOM selection changes.
    await waitForEditorUpdate();
    if (!hasOriginalDraft()) {
      return;
    }

    if (hasFullSelection()) {
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

    if (!hasOriginalDraft() || !composer.matches('[data-lexical-editor="true"]')) {
      return;
    }

    range = selectComposerText(composer, selection);
    if (!hasFullSelection()) {
      return;
    }

    // Pass the text to Lexical's paste handler without changing the system clipboard.
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", text);
    composer.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, composed: true, clipboardData }));
    await waitForEditorUpdate();
  } finally {
    editListeners.abort();
    if (!interrupted && document.activeElement === composer &&
        selection.rangeCount > 0 && selection.getRangeAt(0) === range) {
      selection.collapseToEnd();
    }
  }
};

type ReplacementResult = "applied" | "unchanged" | "recovery";

export const replaceComposerText = async (
  composer: HTMLElement,
  original: string,
  translation: string
): Promise<ReplacementResult> => {
  await editComposerText(composer, original, translation);

  if (findComposer() !== composer) {
    return "recovery";
  }

  const currentText = readComposerText(composer);
  if (currentText === translation) {
    return "applied";
  }

  return currentText === original ? "unchanged" : "recovery";
};
