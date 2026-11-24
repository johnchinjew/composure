const KEYCODE_TAB = 9;
const STORAGE_KEY = "composure_text";

const $editor = document.querySelector("#editor");

window.addEventListener("DOMContentLoaded", onDOMContentLoaded);
window.addEventListener("storage", onStorage);
$editor.addEventListener("keydown", onKeydown);
$editor.addEventListener("input", onInput);

function onDOMContentLoaded(event) {
  loadText($editor, window.localStorage);
  resetCaret($editor);
}

function onStorage(event) {
  if (event.storageArea !== window.localStorage || (event.key !== STORAGE_KEY && event.key !== null)) {
    return;
  }

  const previous = $editor.value;
  const incoming = window.localStorage.getItem(STORAGE_KEY) || "";

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
  insertTab($editor, event);
  autoScroll($editor);
}

function onInput(event) {
  saveText($editor, window.localStorage);
  autoScroll($editor);
}

function loadText(elem, storage) {
  elem.value = storage.getItem(STORAGE_KEY) || "";
}

function saveText(elem, storage) {
  storage.setItem(STORAGE_KEY, elem.value);
}

function insertTab(elem, event) {
  if (event.keyCode === KEYCODE_TAB) {
    event.preventDefault();
    // Intentionally use this deprecated API to preserve native undo/redo through keyboard shortcuts and native menus.
    document.execCommand('insertText', false, '\t');
    saveText(elem, window.localStorage);
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
