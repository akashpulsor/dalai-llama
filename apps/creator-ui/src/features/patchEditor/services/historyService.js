// @ts-nocheck
// Generic undo/redo stack. The patch editor keeps its EDL (edit decision list)
// as the "present" value here so undo/redo never has to touch decoded media.
export function createHistory(present) {
  return { past: [], present, future: [] };
}

export function pushHistory(history, next) {
  return { past: [...history.past, history.present], present: next, future: [] };
}

export function undo(history) {
  if (!history.past.length) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history) {
  if (!history.future.length) return history;
  const [next, ...rest] = history.future;
  return {
    past: [...history.past, history.present],
    present: next,
    future: rest,
  };
}

export function canUndo(history) {
  return history.past.length > 0;
}

export function canRedo(history) {
  return history.future.length > 0;
}
