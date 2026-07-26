import { h, useEffect } from "/dist/nexa.js";
import { CommandPalette } from "/dist/nexa-components-overlay.js";
import { SEARCH_COMMANDS } from "../../content/catalog.js";

// CommandPalette only handles what happens while it is open, so the global
// Ctrl/Cmd+K shortcut is bound here.
export function SearchPalette({ open, onOpen, onClose, onNavigate }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open ? onClose() : onOpen();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return h(CommandPalette, {
    open,
    onClose,
    commands: SEARCH_COMMANDS.map((command) => ({
      ...command,
      onSelect: () => onNavigate(command.path),
    })),
  });
}
