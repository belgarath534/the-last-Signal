// Minimal DOM helpers. Every interactive element in the game is a real
// <button> with a visible text label, so screen readers, switch control,
// keyboards and touch all work the same way without extra ARIA.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function button(label, onClick, attrs = {}) {
  return h('button', { type: 'button', class: 'btn', ...attrs, onclick: onClick }, label);
}

// A heading followed by a list of buttons. Lists let screen reader users
// hear "list, 4 items" and jump past groups quickly.
export function buttonGroup(title, buttons, { headingLevel = 2, id } = {}) {
  if (!buttons.length) return null;
  const headingId = id || `g-${Math.random().toString(36).slice(2, 8)}`;
  return h(
    'section',
    { class: 'group', 'aria-labelledby': headingId },
    h(`h${headingLevel}`, { id: headingId, tabindex: '-1' }, title),
    h('ul', { class: 'btn-list' }, buttons.map((b) => h('li', {}, b))),
  );
}

// Move focus somewhere new and make sure assistive tech notices, even if
// the element was already focused.
export function focusEl(el) {
  if (!el) return;
  if (!el.hasAttribute('tabindex') && !/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
    el.setAttribute('tabindex', '-1');
  }
  if (document.activeElement === el) el.blur();
  // A short delay lets the screen reader finish processing the DOM change.
  setTimeout(() => el.focus({ preventScroll: false }), 30);
}
