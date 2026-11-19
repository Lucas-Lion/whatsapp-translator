export const translateButtonId = "whatsapp-translator-button";

const primaryActionSelector = [
  'button[aria-label="Enviar"]',
  'button[aria-label="Send"]',
  '[data-icon="send"]',
  '[data-icon="wds-ic-send-filled"]',
  '[data-icon="ptt"]',
  '[data-icon="ic-mic"]'
].join(", ");

type ButtonPlacement = { row: HTMLElement; before: Element | null };

export const findTranslateButtonPlacement = (composer: HTMLElement): ButtonPlacement | null => {
  const footer = composer.closest("footer");
  if (!footer) {
    return null;
  }

  const actions = footer.querySelectorAll(primaryActionSelector);
  const action = Array.from(actions).find((element) => element.getClientRects().length > 0);
  let fallback: ButtonPlacement | null = null;
  let editorGroup = composer;
  let row = editorGroup.parentElement;

  while (row && footer.contains(row)) {
    const { display, flexDirection, flexWrap } = getComputedStyle(row);
    if ((display === "flex" || display === "inline-flex") && flexDirection === "row" && flexWrap === "nowrap") {
      fallback = { row, before: null };

      if (action && !editorGroup.contains(action)) {
        const actionGroup = Array.from(row.children).find((element) => element.contains(action));
        if (actionGroup) {
          return { row, before: actionGroup };
        }
      }
    }

    editorGroup = row;
    row = row.parentElement;
  }

  return fallback;
};

export const createTranslateButton = (onClick: () => void): HTMLButtonElement => {
  const button = document.createElement("button");
  button.id = translateButtonId;
  button.type = "button";

  Object.assign(button.style, {
    display: "inline-flex",
    alignSelf: "center",
    flex: "0 0 auto",
    marginInline: "4px",
    padding: "4px 10px",
    whiteSpace: "nowrap",
    fontSize: "13px",
    lineHeight: "1.2",
    border: "1px solid var(--WDS-content-deemphasized, ButtonText)",
    borderRadius: "6px",
    backgroundColor: "var(--WDS-surface-default, ButtonFace)",
    color: "var(--WDS-content-default, ButtonText)",
    cursor: "pointer"
  });

  button.addEventListener("click", onClick);
  return button;
};
