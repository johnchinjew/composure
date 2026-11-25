const KEYCODE_TAB = 9;
const STORAGE_KEY = "composure_text";

const $editor = document.querySelector("#editor");

let hasUnsavedChanges = false;
let lastStorageError = null;

window.addEventListener("DOMContentLoaded", onDOMContentLoaded);
window.addEventListener("storage", onStorage);
$editor.addEventListener("keydown", onKeydown);
$editor.addEventListener("input", onInput);

function onDOMContentLoaded(event) {
  loadText();
}

function onStorage(event) {
  if ($editor.readOnly || hasUnsavedChanges || (event.key !== STORAGE_KEY && event.key !== null)) {
    return;
  }

  let incoming;
  try {
    if (event.storageArea !== window.localStorage) {
      return;
    }
    incoming = window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    showStorageError("Couldn’t load changes from another tab. Copy any text you want to keep before reloading.");
    return;
  }

  lastStorageError = null;
  const previous = $editor.value;

  if (previous == incoming) {
    return;
  }

  const start = adjustOffset($editor.selectionStart, previous, incoming);
  const end = adjustOffset($editor.selectionEnd, previous, incoming);
  const direction = $editor.selectionDirection;
  const scrollTop = $editor.scrollTop;

  $editor.value = incoming;
  $editor.setSelectionRange(start, end, direction);
  $editor.scrollTop = scrollTop;
}

// Simple prefix/suffix strategy: find the shared beginning and ending, then
// treat everything between them as one replacement. Separate edits are grouped
// together, so offsets within that region are only approximate.
function adjustOffset(offset, previous, incoming) {
  let start = 0;
  while (start < previous.length && start < incoming.length && previous[start] === incoming[start]) {
    start++;
  }
  let oldEnd = previous.length;
  let newEnd = incoming.length;
  while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === incoming[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  if (offset < start) {
    return offset;
  }
  if (offset >= oldEnd) {
    return offset + newEnd - oldEnd;
  }
  return Math.min(offset, newEnd);
}

function onKeydown(event) {
  if ($editor.readOnly) {
    return;
  }
  insertTab(event);
  autoScroll($editor);
}

function onInput(event) {
  saveText();
  autoScroll($editor);
}

function loadText() {
  try {
    $editor.value = window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    showStorageError("Couldn’t load your saved note. Editing is paused to protect it. Reload to try again.");
    return;
  }

  $editor.readOnly = false;
  resetCaret($editor);
}

function saveText() {
  if ($editor.readOnly) {
    return;
  }

  hasUnsavedChanges = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, $editor.value);
  } catch {
    window.addEventListener("beforeunload", onBeforeUnload);
    showStorageError("Couldn’t save your changes. Copy your text somewhere safe before closing or reloading. Further edits will retry saving.");
    return;
  }

  hasUnsavedChanges = false;
  window.removeEventListener("beforeunload", onBeforeUnload);
  lastStorageError = null;
}

function showStorageError(message) {
  if (lastStorageError !== message) {
    lastStorageError = message;
    window.alert(message);
  }
}

function onBeforeUnload(event) {
  event.preventDefault();
  event.returnValue = "";
}

function insertTab(event) {
  if (event.keyCode === KEYCODE_TAB) {
    event.preventDefault();
    // Intentionally use this deprecated API to preserve native undo/redo through keyboard shortcuts and native menus.
    document.execCommand('insertText', false, '\t');
    saveText();
  }
}

function resetCaret(elem) {
  elem.selectionEnd = 0;
}

function autoScroll(elem) {
  if (elem.selectionEnd == elem.value.length) {
    elem.scrollTop = elem.scrollHeight;
  }
}
