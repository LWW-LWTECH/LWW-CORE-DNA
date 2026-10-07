/* ICON */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-icon requires lwt-core.js to be loaded first.');
  }

  let CSS = '.lwti{ display: inline-block; font-family: inherit; width:24px; height:24px; }';
  let TEMPLATE = '';

  class LWTIcon extends window.LWT.Element {
    constructor() {
      super();
      this.iconhost = 'https://raw.githubusercontent.com/LWW-LWTECH/LWW-CORE-DNA/refs/heads/main/icons';
    }

    connectedCallback() {
      super.connectedCallback();
    }

    async render() {
      this._renderShadow(TEMPLATE, CSS);

      this.icon = this._root.host.getAttribute('icon');
      this.icon ? this.icon = this.icon.split('_') : '';
      this.iconurl = this.iconhost + '/' + this.icon.join('/') + '.svg';
      this.width = this._root.host.getAttribute('width') || '24px'; 
      this.height = this._root.host.getAttribute('height') || '24px'; 
      this._root.innerHTML = await this.getIconSVG();
      this._root.style.width = this.width;
      this._root.style.height = this.height;
    }

    getIconSVG() {
      return this.iconurl ? fetch(this.iconurl).then(response => response.text()) : Promise.resolve('');
    }

  }

  window.LWT.define('lwtg-icon', LWTIcon);
})();

/* ---- lwt-gen-accordion-item.js ---- */
/*!
 * <lwtg-accordion-item>
 * A single collapsible section. Works standalone, or grouped inside
 * <lwtg-accordion> for coordinated (one-at-a-time) opening — see
 * lwt-gen-accordion.js for that part.
 *
 * Both the clickable header and the collapsible body accept arbitrary
 * HTML — they're named slots, not text attributes, so there's no
 * text-only restriction:
 *
 *   <lwtg-accordion-item open>
 *     <div slot="label"><strong>Shipping</strong> <span class="badge">3 options</span></div>
 *     <div slot="body">
 *       <p>Pick a shipping method at checkout.</p>
 *       <ul><li>Standard</li><li>Express</li></ul>
 *     </div>
 *   </lwtg-accordion-item>
 *
 * The chrome (clickable trigger button, chevron, expand/collapse
 * animation) is all this component owns; content is entirely yours.
 *
 * The expand/collapse animation is the classic JS-measured-height
 * technique (CSS can't transition to/from `height: auto` on its own in
 * most browsers yet): measure scrollHeight, animate to that pixel value,
 * then swap to `height: auto` once open so dynamically-changing content
 * still reflows correctly instead of getting clipped at the old height.
 *
 * Attributes:
 *   open      — read once at connect for the initial state (same
 *               reasoning as lwtg-modal's `open` attribute — not
 *               two-way reactive afterward; use the methods below)
 *   disabled  — boolean; prevents toggling. Only read at connect —
 *               toggling this attribute after the fact won't re-sync
 *               the trigger's native disabled state in this version.
 *
 * Methods: .open(), .close(), .toggle() — the "function that can be
 * called" pattern established by lwtg-modal. Property: .isOpen (boolean,
 * read-only — named to avoid colliding with the .open() method, same
 * reasoning as lwtg-modal's .isOpen).
 * Events: lwt-open, lwt-close (no detail).
 *
 * Theming: --lwt-accordion-chevron-color, --lwt-accordion-focus-color.
 * (--lwt-accordion-border / --lwt-accordion-bg live on the container,
 * lwt-gen-accordion.js.)
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-accordion-item.js requires lwt-core.js to be loaded first.');
  }

  var idCounter = 0;

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    '.trigger { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; width: 100%;' +
    '  padding: 0.9rem 0.1rem; background: none; border: none; cursor: pointer; text-align: left; font: inherit; color: inherit; }' +
    '.trigger:disabled { cursor: not-allowed; opacity: 0.5; }' +
    '.trigger:focus-visible { outline: 2px solid var(--lwt-accordion-focus-color, var(--lwt-focus-ring, #2563eb)); outline-offset: 2px; border-radius: 4px; }' +
    '.label { flex: 1; min-width: 0; }' +
    '.chevron { flex-shrink: 0; width: 18px; height: 18px; color: var(--lwt-accordion-chevron-color, var(--lwt-color-text-muted, #6b7280)); transition: transform 200ms ease; }' +
    ':host([open]) .chevron { transform: rotate(180deg); }' +
    '.panel { height: 0; overflow: hidden; transition: height 200ms ease; }' +
    '.panel-inner { padding: 0 0.1rem 1rem; }' +
    '.panel-inner ::slotted(*:first-child) { margin-top: 0; }' +
    '.panel-inner ::slotted(*:last-child) { margin-bottom: 0; }';

  var TEMPLATE =
    '<button type="button" class="trigger" part="trigger" aria-expanded="false">' +
    '  <span class="label" part="label"><slot name="label"></slot></span>' +
    '  <span class="chevron" part="chevron">' +
    '    <svg viewBox="0 0 20 20"><path d="M5 7l5 5l5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>' +
    '  </span>' +
    '</button>' +
    '<div class="panel" part="panel">' +
    '  <div class="panel-inner"><slot name="body"></slot></div>' +
    '</div>';

  class LWTAccordionItem extends window.LWT.Element {
    constructor() {
      super();
      this._isOpen = false;
      this._initialized = false;
      this._handleTriggerClick = this._handleTriggerClick.bind(this);
      this._handleTransitionEnd = this._handleTransitionEnd.bind(this);
    }

    connectedCallback() {
      super.connectedCallback(); // builds shadow via render(), caches refs, wires listeners

      if (!this._initialized) {
        this._initialized = true;
        var startOpen = this.hasAttribute('open') && !this._boolAttr('disabled');
        this._isOpen = startOpen;
        this._trigger.setAttribute('aria-expanded', startOpen ? 'true' : 'false');
        if (startOpen) {
          this._panel.style.display = 'block';
          this._panel.style.height = 'auto';
        } else {
          this._panel.style.display = 'none';
          this._panel.style.height = '0px';
          this.removeAttribute('open');
        }
      }
    }

    render() {
      this._renderShadow(TEMPLATE, CSS);
      var root = this._root;
      this._trigger = root.querySelector('.trigger');
      this._panel = root.querySelector('.panel');

      var panelId = 'lwt-accordion-panel-' + (++idCounter);
      this._panel.id = panelId;
      this._trigger.setAttribute('aria-controls', panelId);
      this._trigger.disabled = this._boolAttr('disabled');

      this._trigger.addEventListener('click', this._handleTriggerClick);
      this._panel.addEventListener('transitionend', this._handleTransitionEnd);
    }

    get isOpen() {
      return this._isOpen;
    }

    open() {
      if (this._isOpen || this._boolAttr('disabled')) return;
      this._isOpen = true;
      this.setAttribute('open', '');
      this._trigger.setAttribute('aria-expanded', 'true');
      this._animateOpen();
      this.emit('open', {});
    }

    close() {
      if (!this._isOpen) return;
      this._isOpen = false;
      this.removeAttribute('open');
      this._trigger.setAttribute('aria-expanded', 'false');
      this._animateClose();
      this.emit('close', {});
    }

    toggle() {
      if (this._isOpen) this.close();
      else this.open();
    }

    _handleTriggerClick() {
      if (this._boolAttr('disabled')) return;
      this.toggle();
    }

    _animateOpen() {
      var panel = this._panel;
      panel.style.display = 'block';
      var target = panel.scrollHeight;
      panel.style.height = '0px';
      void panel.offsetHeight; // force reflow so the 0px start registers before animating
      panel.style.height = target + 'px';
    }

    _animateClose() {
      var panel = this._panel;
      var current = panel.scrollHeight;
      panel.style.height = current + 'px';
      void panel.offsetHeight; // force reflow so the current-height start registers
      panel.style.height = '0px';
    }

    _handleTransitionEnd(event) {
      if (event.propertyName !== 'height') return;
      if (this._isOpen) {
        this._panel.style.height = 'auto';
      } else {
        this._panel.style.display = 'none';
      }
    }
  }

  window.LWT.define('lwtg-accordion-item', LWTAccordionItem);
})();

/* ---- lwt-gen-accordion.js ---- */
/*!
 * <lwtg-accordion>
 * Groups <lwtg-accordion-item> children and coordinates them: by default,
 * opening one closes any others (classic single-open accordion). Add the
 * `multiple` attribute to let several stay open independently.
 *
 *   <lwtg-accordion>
 *     <lwtg-accordion-item open>
 *       <span slot="label">Shipping</span>
 *       <div slot="body"><p>Pick a method at checkout.</p></div>
 *     </lwtg-accordion-item>
 *     <lwtg-accordion-item>
 *       <span slot="label">Returns</span>
 *       <div slot="body"><p>30-day window on unused items.</p></div>
 *     </lwtg-accordion-item>
 *   </lwtg-accordion>
 *
 * This container only adds coordination + the outer border/dividers
 * between items — every item still works perfectly well on its own
 * without a container. Dividers between items are drawn here (via
 * ::slotted(lwtg-accordion-item + lwtg-accordion-item), an adjacent-
 * sibling selector that only matches items with a preceding sibling —
 * i.e. every item except the first) rather than each item owning its
 * own border, so a standalone item has no stray border and grouped
 * items don't get a doubled-up line at the container's own edge.
 *
 * Attribute: multiple — boolean; allow more than one item open at once.
 *
 * Requires lwt-core.js and lwt-gen-accordion-item.js to both be loaded (this
 * file only needs lwt-core.js itself to define its own element, but it's
 * not useful without accordion items to coordinate).
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-accordion.js requires lwt-core.js to be loaded first.');
  }

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    '.accordion { border: 1px solid var(--lwt-accordion-border, var(--lwt-color-border, #e5e7eb)); border-radius: 10px; overflow: hidden; background: var(--lwt-accordion-bg, transparent); }' +
    '.accordion { padding: 0 0.75rem; }' +
    '::slotted(lwtg-accordion-item + lwtg-accordion-item) { display: block; border-top: 1px solid var(--lwt-accordion-border, var(--lwt-color-border, #e5e7eb)); }';

  class LWTAccordion extends window.LWT.Element {
    constructor() {
      super();
      this._handleItemOpen = this._handleItemOpen.bind(this);
    }

    connectedCallback() {
      super.connectedCallback();
      this.addEventListener('lwt-open', this._handleItemOpen);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('lwt-open', this._handleItemOpen);
    }

    render() {
      this._renderShadow('<div class="accordion" part="accordion"><slot></slot></div>', CSS);
    }

    _handleItemOpen(event) {
      if (this._boolAttr('multiple')) return;
      var opened = event.target;
      var items = this.querySelectorAll('lwtg-accordion-item');
      items.forEach(function (item) {
        if (item !== opened && typeof item.close === 'function' && item.isOpen) {
          item.close();
        }
      });
    }
  }

  window.LWT.define('lwtg-accordion', LWTAccordion);
})();

/* ---- lwt-gen-alert.js ---- */
/*!
 * <lwtg-alert>
 * A persistent inline banner — success/warning/info/error, with an
 * auto-selected icon per variant. For a transient, auto-dismissing,
 * corner-stacked notification instead, see lwt-gen-toast.js — the two are
 * genuinely different UI patterns (this one lives in normal page flow
 * wherever you place it; a toast floats above everything and disappears
 * on its own), so they're separate elements rather than one trying to do
 * both jobs.
 *
 *   <lwtg-alert variant="success" title="Saved" dismissible>
 *     Your changes have been saved.
 *   </lwtg-alert>
 *
 * Message content is the default slot — free-form, same "content is
 * yours" approach as lwtg-modal.
 *
 * Attributes:
 *   variant      — "info" (default) | "success" | "warning" | "error"
 *   title        — optional bold heading above the message
 *   dismissible  — boolean; shows a close button
 *
 * Method: .close() — removes the alert from the DOM, emitting lwt-close
 * first. Dismissal is permanent (the element is removed, not hidden); if
 * you need to show it again, re-create/re-append it.
 *
 * Theming: --lwt-alert-bg, --lwt-alert-success-color (#22c55e),
 * --lwt-alert-warning-color (#f59e0b), --lwt-alert-info-color (#3b82f6),
 * --lwt-alert-error-color (#ef4444), --lwt-alert-title-color,
 * --lwt-alert-text-color.
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-alert.js requires lwt-core.js to be loaded first.');
  }

  var ICONS = {
    success: '<svg class="icon" viewBox="0 0 20 20"><circle class="icon-bg" cx="10" cy="10" r="10"></circle><path d="M6 10.5l2.5 2.5L14 7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    warning: '<svg class="icon" viewBox="0 0 20 20"><path class="icon-bg" d="M10 1.5 L19.5 18.5 L0.5 18.5 Z"></path><line x1="10" y1="8" x2="10" y2="12.3" stroke="#fff" stroke-width="2" stroke-linecap="round"></line><circle cx="10" cy="15.3" r="1" fill="#fff"></circle></svg>',
    info: '<svg class="icon" viewBox="0 0 20 20"><circle class="icon-bg" cx="10" cy="10" r="10"></circle><circle cx="10" cy="6.5" r="1.2" fill="#fff"></circle><line x1="10" y1="9.5" x2="10" y2="15" stroke="#fff" stroke-width="2" stroke-linecap="round"></line></svg>',
    error: '<svg class="icon" viewBox="0 0 20 20"><circle class="icon-bg" cx="10" cy="10" r="10"></circle><line x1="7" y1="7" x2="13" y2="13" stroke="#fff" stroke-width="2" stroke-linecap="round"></line><line x1="13" y1="7" x2="7" y2="13" stroke="#fff" stroke-width="2" stroke-linecap="round"></line></svg>'
  };

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    ':host([variant="success"]) { color: var(--lwt-alert-success-color, var(--lwt-color-success, #22c55e)); }' +
    ':host([variant="warning"]) { color: var(--lwt-alert-warning-color, var(--lwt-color-warning, #f59e0b)); }' +
    ':host([variant="info"]), :host(:not([variant])) { color: var(--lwt-alert-info-color, var(--lwt-color-info, #3b82f6)); }' +
    ':host([variant="error"]) { color: var(--lwt-alert-error-color, var(--lwt-color-danger, #ef4444)); }' +
    '.alert { display: flex; align-items: flex-start; gap: 0.65rem; padding: 0.85rem 1rem; border-radius: var(--lwt-alert-border-radius, var(--lwt-border-radius, 8px));' +
    '  border: 1px solid currentColor; background: var(--lwt-alert-bg, color-mix(in srgb, currentColor 8%, var(--lwt-color-surface, white))); }' +
    '.icon { flex-shrink: 0; width: 20px; height: 20px; margin-top: 0.1rem; }' +
    '.icon-bg { fill: currentColor; }' +
    '.content { flex: 1; min-width: 0; }' +
    '.title { font-weight: 700; font-size: 0.92rem; color: var(--lwt-alert-title-color, var(--lwt-color-text-strong, #111827)); margin-bottom: 0.15rem; }' +
    '.message { font-size: 0.88rem; color: var(--lwt-alert-text-color, var(--lwt-color-text, #374151)); }' +
    '::slotted(*:first-child) { margin-top: 0; }' +
    '::slotted(*:last-child) { margin-bottom: 0; }' +
    '.close { flex-shrink: 0; border: none; background: none; cursor: pointer; font-size: 1.2rem; line-height: 1; color: inherit; opacity: 0.6; padding: 0; }' +
    '.close:hover { opacity: 1; }';

  var TEMPLATE =
    '<div class="alert" part="alert">' +
    '  <div class="icon-wrap" part="icon"></div>' +
    '  <div class="content">' +
    '    <div class="title" part="title"></div>' +
    '    <div class="message" part="message"><slot></slot></div>' +
    '  </div>' +
    '  <button type="button" class="close" part="close" aria-label="Dismiss" hidden>&times;</button>' +
    '</div>';

  class LWTAlert extends window.LWT.Element {
    static get observedAttributes() {
      return ['variant', 'title', 'dismissible'];
    }

    constructor() {
      super();
      this._handleClose = this._handleClose.bind(this);
    }

    render() {
      this._renderShadow(TEMPLATE, CSS);
      var root = this._root;

      var variant = this._strAttr('variant', 'info');
      root.querySelector('.icon-wrap').innerHTML = ICONS[variant] || ICONS.info;

      var titleEl = root.querySelector('.title');
      var title = this._strAttr('title', '');
      titleEl.textContent = title;
      titleEl.style.display = title ? '' : 'none';

      var closeBtn = root.querySelector('.close');
      var dismissible = this._boolAttr('dismissible');
      closeBtn.hidden = !dismissible;
      if (dismissible) closeBtn.addEventListener('click', this._handleClose);
    }

    _handleClose() {
      this.close();
    }

    close() {
      this.emit('close', { variant: this._strAttr('variant', 'info') });
      this.remove();
    }
  }

  window.LWT.define('lwtg-alert', LWTAlert);
})();

/* ---- lwt-gen-button.js ---- */
/*!
 * <lwtg-button>
 * Attributes: variant ("primary" | "secondary" | "danger"), size ("sm" | "lg"), disabled, label
 * Events: lwt-click — fires on click when not disabled, detail: { originalEvent }
 * Theming: override --lwt-primary, --lwt-secondary, --lwt-danger, --lwt-btn-radius, --lwt-focus-color
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-button.js requires lwt-core.js to be loaded first.');
  }

  var CSS =
    ':host {' +
    '  display: inline-block;' +
    '  --lwt-btn-radius: 6px;' +
    '  font-family: inherit;' +
    '}' +
    ':host([hidden]) { display: none; }' +
    'button {' +
    '  font: inherit;' +
    '  cursor: pointer;' +
    '  border: 1px solid transparent;' +
    '  border-radius: var(--lwt-btn-radius);' +
    '  corner-shape: var(--lwt-border-corder, round);' +
    '  padding: 0.5em 1.1em;' +
    '  font-size: 0.95em;' +
    '  line-height: 1.2;' +
    '  transition: background-color 120ms ease, border-color 120ms ease, opacity 120ms ease;' +
    '}' +
    'button:disabled { cursor: not-allowed; opacity: 0.55; }' +
    'button:focus-visible {' +
    '  outline: 2px solid var(--lwt-focus-color, var(--lwt-focus-ring, #2563eb));' +
    '  outline-offset: 2px;' +
    '}' +
    ':where(:host([size="sm"]) button) { padding: 0.3em 0.75em; font-size: 0.82em; }' +
    ':where(:host([size="lg"]) button) { padding: 0.7em 1.4em; font-size: 1.1em; }' +

    'button.primary {' +
    '  background: var(--lwt-primary, #2563eb);' +
    '  border-color: var(--lwt-color-primary, #2563eb));' +
    '  color: #fff;' +
    '}' +
    'button.primary:not(:disabled):hover {' +
    '  background: var(--lwt-primary-hover, #2563eb);' +
    '  border-color: var(--lwt-color-primary-hover, #2563eb));' +
    '  color: #fff;' +
    '}' +
  
    'button.secondary {' +
    '  background: transparent;' +
    '  border-color: var(--lwt-color-secondary, #6b7280);' +
    '  color: var(--lwt-color-secondary, #6b7280);' +
    '}' +
    'button.secondary:not(:disabled):hover {' +
    '  background: transparent;' +
    '  border-color: var(--lwt-color-secondary-hover, #6b7280);' +
    '  color: var(--lwt-color-secondary-hover, #6b7280);' +
    '}' +
    
   'button.danger {' +
    '  background: var(--lwt-danger, #dc2626);' +
    '  border-color: var(--lwt-color-danger, #dc2626);' +
    '  color: #fff;' +
    '}' +
   'button.danger:not(:disabled):hover {' +
    '  background: var(--lwt-danger-hover, #dc2626);' +
    '  border-color: var(--lwt-color-danger-hover, #dc2626);' +
    '  color: #fff;' +
    '}';

  class LWTButton extends window.LWT.Element {
    static get observedAttributes() {
      return ['variant', 'disabled', 'label'];
    }

    static get observedProps() {
      return ['variant', 'disabled', 'label'];
    }

    constructor() {
      super();
      this._handleClick = this._handleClick.bind(this);
    }

    connectedCallback() {
      super.connectedCallback();
      // Listen on the host: clicks on the inner <button> bubble up to it,
      // so we only ever need one listener regardless of how many times
      // render() replaces the shadow contents.
      this.addEventListener('click', this._handleClick);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('click', this._handleClick);
    }

    _handleClick(event) {
      this.emit('click', { originalEvent: event });
    }

    get variant() { return this._strAttr('variant', 'primary'); }
    set variant(value) { this.setAttribute('variant', value); }

    get disabled() { return this._boolAttr('disabled'); }
    set disabled(value) {
      if (value) this.setAttribute('disabled', '');
      else this.removeAttribute('disabled');
    }

    get label() { return this._strAttr('label', ''); }
    set label(value) { this.setAttribute('label', value); }

    render() {
      var variant = this.variant;
      var disabled = this.disabled;
      var label = this.label;

      this._renderShadow(
        '<button class="' + variant + '"' + (disabled ? ' disabled' : '') + ' part="button">' +
        '<slot>' + label + '</slot>' +
        '</button>',
        CSS
      );
    }
  }

  window.LWT.define('lwtg-button', LWTButton);
})();

/* ---- lwt-gen-card.js ---- */
/*!
 * <lwtg-card>
 * A single content card — image, label, body, and a call-to-action —
 * usable entirely on its own or as a slide inside <lwtg-carousel> (see
 * lwt-gen-carousel.js for the carousel/pagination side of things). This
 * file has no idea a carousel might contain it; it's purely a card.
 *
 *   <lwtg-card image="portrait.jpg" image-alt="Rachael Kennith" label="Rachael Kennith">
 *     I have been in the Design field for over 25 years...
 *     <lwtg-button slot="cta" variant="secondary" label="Show More"></lwtg-button>
 *   </lwtg-card>
 *
 * Attributes:
 *   image           — image URL; the image block is omitted entirely if
 *                      this isn't set (no broken-image box)
 *   image-alt        — alt text for the image
 *   image-position   — "top" (default) | "bottom"
 *   label            — fallback heading text (overridden by richer
 *                      content placed in slot="label")
 *
 * Slots:
 *   label (named)  — heading; falls back to the `label` attribute
 *   (default)      — body content; any HTML, not just text
 *   cta (named)    — call-to-action content (typically an <lwtg-button>,
 *                    but anything goes — a link, a group of buttons)
 *
 * Default appearance is a white background with a faint grey border,
 * entirely overridable via the CSS custom properties below (or by
 * targeting the `card`/`image-wrap`/`image`/`content`/`label`/`body`/
 * `cta` parts directly for anything the variables don't cover).
 *
 * Theming: --lwt-card-bg (#fff), --lwt-card-border (#e5e7eb),
 * --lwt-card-radius (12px), --lwt-card-shadow (none), --lwt-card-padding
 * (1.25rem), --lwt-card-image-height (180px), --lwt-card-label-color,
 * --lwt-card-body-color, --lwt-card-gap (0.5rem, spacing inside the
 * content block).
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-card.js requires lwt-core.js to be loaded first.');
  }

  function escapeXml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var CSS =
    ':host { display: block; font-family: inherit; height: 100%; }' +
    '.card { display: flex; flex-direction: column; height: 100%; box-sizing: border-box;' +
    '  background: var(--lwt-card-bg, var(--lwt-color-surface, #fff)); border: 1px solid var(--lwt-card-border, var(--lwt-color-border, #e5e7eb));' +
    '  border-radius: var(--lwt-card-radius, 12px); box-shadow: var(--lwt-card-shadow, none); overflow: hidden; }' +
    '.image-wrap { order: 0; flex-shrink: 0; }' +
    '.image { display: block; width: 100%; height: var(--lwt-card-image-height, 180px); object-fit: cover; }' +
    // image-position wrapped in :where() so a media query can flip
    // image top/bottom responsively without !important.
    ':where(:host([image-position="bottom"]) .image-wrap) { order: 2; }' +
    ':where(:host([image-position="bottom"]) .content) { order: 1; }' +
    '.content { order: 1; flex: 1; display: flex; flex-direction: column;' +
    '  padding: var(--lwt-card-padding, 1.25rem); gap: var(--lwt-card-gap, 0.5rem); }' +
    '.label { font-weight: 600; font-size: 1.05rem; color: var(--lwt-card-label-color, var(--lwt-color-text-strong, #111827)); }' +
    '.body { flex: 1; font-size: 0.9rem; line-height: 1.55; color: var(--lwt-card-body-color, var(--lwt-color-text, #4b5563)); }' +
    '.body ::slotted(*:first-child) { margin-top: 0; }' +
    '.body ::slotted(*:last-child) { margin-bottom: 0; }' +
    '.cta { display: flex; }';

  class LWTCard extends window.LWT.Element {
    static get observedAttributes() {
      return ['image', 'image-alt', 'label'];
    }

    render() {
      var hasImage = this.hasAttribute('image');
      var fallbackLabel = escapeXml(this._strAttr('label', ''));

      var html =
        '<div class="card" part="card">' +
        (hasImage
          ? '<div class="image-wrap" part="image-wrap">' +
            '<img class="image" part="image" src="' + escapeXml(this._strAttr('image', '')) + '"' +
            ' alt="' + escapeXml(this._strAttr('image-alt', '')) + '">' +
            '</div>'
          : '') +
        '<div class="content" part="content">' +
        '<div class="label" part="label"><slot name="label">' + fallbackLabel + '</slot></div>' +
        '<div class="body" part="body"><slot></slot></div>' +
        '<div class="cta" part="cta"><slot name="cta"></slot></div>' +
        '</div>' +
        '</div>';

      this._renderShadow(html, CSS);
    }
  }

  window.LWT.define('lwtg-card', LWTCard);
})();

/* ---- lwt-gen-carousel.js ---- */
/*!
 * <lwtg-carousel>
 * A horizontally-scrolling strip of <lwtg-card> slides with small dot
 * pagination underneath. See lwt-gen-card.js for what a single card looks
 * like — this file is purely the coordinator.
 *
 *   <lwtg-carousel>
 *     <lwtg-card image="rachael.jpg" label="Rachael Kennith">...</lwtg-card>
 *     <lwtg-card image="dillan.jpg" label="Dillan Mattie">...</lwtg-card>
 *     <lwtg-card image="ryland.jpg" label="Ryland Libby">...</lwtg-card>
 *   </lwtg-carousel>
 *
 * The "carousel" part is native CSS scroll-snap on a horizontally
 * scrollable track (touch/trackpad/mouse-wheel scrolling all just
 * work), not JS-driven paging — how many cards fit per view is however
 * wide the container is and how wide each card is
 * (--lwt-carousel-card-width), so it's naturally responsive without any
 * media-query bookkeeping in here. There's a dot per card (not per
 * "page"): clicking one scrolls that card into view, and whichever card
 * is most in view gets its dot marked active automatically via
 * IntersectionObserver. If IntersectionObserver isn't available, dots
 * still work for click-to-navigate, they just won't auto-highlight from
 * scroll position — a documented, graceful degradation, not a crash.
 *
 * Attributes:
 *   dot-as-image     — boolean; renders each dot as a small square
 *                      thumbnail of that card's own `image` (forced 1:1
 *                      ratio via object-fit: cover) instead of a plain
 *                      circular dot. Falls back to a plain dot for any
 *                      card that doesn't have an `image` set.
 *   image-position   — optional; if set, synced onto every <lwtg-card>
 *                      child ("top"/"bottom") for convenience. Omit it
 *                      to let each card decide for itself.
 *
 * Methods: .goTo(index), .next(), .prev(). Property: .activeIndex
 * (read-only, current slide index).
 * Event: lwt-change (detail: { index, card }) — fired whenever the
 * active slide changes, whether from a dot click, .goTo(), or the user
 * just scrolling the track by hand.
 *
 * Dots are built once from whatever <lwtg-card> children are present at
 * connect — this version doesn't watch for cards being added/removed
 * later (a deliberate scope limit; rebuild by re-creating the carousel
 * if your slide set changes).
 *
 * Theming: --lwt-carousel-gap (1rem, space between cards),
 * --lwt-carousel-card-width (260px), --lwt-carousel-dot-color,
 * --lwt-carousel-dot-active-color, --lwt-carousel-dot-size (dot-as-image
 * mode only, 32px).
 *
 * Requires lwt-core.js to be loaded first. Needs lwt-gen-card.js to be
 * useful, but doesn't hard-depend on it to define its own element.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-carousel.js requires lwt-core.js to be loaded first.');
  }

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    '.track { display: flex; gap: var(--lwt-carousel-gap, 1rem); overflow-x: auto;' +
    '  scroll-snap-type: x mandatory; scroll-behavior: smooth; padding-bottom: 0.25rem; scrollbar-width: thin; }' +
    '::slotted(lwtg-card) { scroll-snap-align: start; flex: 0 0 auto; width: var(--lwt-carousel-card-width, 260px); }' +
    '.dots { display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 0.9rem; }' +
    '.dot { width: 8px; height: 8px; padding: 0; margin: 0; border: none; border-radius: 50%;' +
    '  background: var(--lwt-carousel-dot-color, var(--lwt-color-border-strong, #d1d5db)); cursor: pointer; flex-shrink: 0; }' +
    '.dot[aria-current="true"] { background: var(--lwt-carousel-dot-active-color, var(--lwt-color-text, #374151)); }' +
    '.dot:focus-visible { outline: 2px solid var(--lwt-carousel-dot-active-color, var(--lwt-color-text, #374151)); outline-offset: 2px; }' +
    ':host([dot-as-image]) .dot { width: var(--lwt-carousel-dot-size, 32px); height: var(--lwt-carousel-dot-size, 32px);' +
    '  border-radius: 6px; overflow: hidden; background: var(--lwt-carousel-dot-color, var(--lwt-color-border, #e5e7eb)); }' +
    ':host([dot-as-image]) .dot img { width: 100%; height: 100%; object-fit: cover; aspect-ratio: 1 / 1; display: block; }' +
    ':host([dot-as-image]) .dot[aria-current="true"] { outline: 2px solid var(--lwt-carousel-dot-active-color, var(--lwt-color-text, #374151)); outline-offset: 2px; }';

  var TEMPLATE =
    '<div class="wrap" part="wrap">' +
    '<div class="track" part="track" role="region" aria-roledescription="carousel" tabindex="0"><slot></slot></div>' +
    '<div class="dots" part="dots"></div>' +
    '</div>';

  class LWTCarousel extends window.LWT.Element {
    static get observedAttributes() {
      return ['dot-as-image', 'image-position'];
    }

    constructor() {
      super();
      this._initialized = false;
      this._activeIndex = 0;
      this._observer = null;
    }

    connectedCallback() {
      super.connectedCallback();

      if (!this._initialized) {
        this._initialized = true;
        this._syncImagePosition();
        var self = this;
        Promise.resolve().then(function () {
          self._buildDots();
          self._setupObserver();
        });
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._observer) this._observer.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'dot-as-image') this._buildDots();
      else if (name === 'image-position') this._syncImagePosition();
    }

    render() {
      this._renderShadow(TEMPLATE, CSS);
      this._trackEl = this._root.querySelector('.track');
      this._dotsEl = this._root.querySelector('.dots');
    }

    get activeIndex() {
      return this._activeIndex;
    }

    _cards() {
      return Array.prototype.filter.call(this.children, function (c) { return c.tagName === 'LWT-CARD'; });
    }

    _syncImagePosition() {
      if (!this.hasAttribute('image-position')) return;
      var pos = this._strAttr('image-position', 'top');
      this._cards().forEach(function (card) { card.setAttribute('image-position', pos); });
    }

    _buildDots() {
      if (!this._dotsEl) return;
      var self = this;
      var dotAsImage = this._boolAttr('dot-as-image');
      this._dotsEl.innerHTML = '';

      this._cards().forEach(function (card, index) {
        var dot = self._genhtml({
          type: 'button',
          attr: {
            type: 'button',
            part: 'dot',
            'aria-label': 'Go to slide ' + (index + 1),
            'aria-current': index === self._activeIndex ? 'true' : 'false'
          }
        });
        dot.className = 'dot';

        var imageSrc = card.getAttribute('image');
        if (dotAsImage && imageSrc) {
          dot.appendChild(self._genhtml({ type: 'img', attr: { src: imageSrc, alt: '' } }));
        }

        dot.addEventListener('click', function () { self.goTo(index); });
        self._dotsEl.appendChild(dot);
      });
    }

    _syncDots() {
      if (!this._dotsEl) return;
      var self = this;
      Array.prototype.forEach.call(this._dotsEl.children, function (dot, index) {
        dot.setAttribute('aria-current', index === self._activeIndex ? 'true' : 'false');
      });
    }

    _setupObserver() {
      if (typeof IntersectionObserver !== 'function' || !this._trackEl) return;
      var self = this;
      this._observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            self._setActiveCard(entry.target, false);
          }
        });
      }, { root: this._trackEl, threshold: [0, 0.6, 1] });

      this._cards().forEach(function (card) { self._observer.observe(card); });
    }

    // shouldScroll: true when navigation was requested programmatically
    // (goTo/next/prev/dot click) and the card needs to be scrolled into
    // view; false when this is just the observer reporting that the
    // user has already scrolled a new card into view on their own.
    _setActiveCard(card, shouldScroll) {
      var cards = this._cards();
      var index = cards.indexOf(card);
      if (index === -1) return;

      if (shouldScroll && typeof card.scrollIntoView === 'function') {
        card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }

      if (index === this._activeIndex) return;
      this._activeIndex = index;
      this._syncDots();
      this.emit('change', { index: index, card: card });
    }

    goTo(index) {
      var card = this._cards()[index];
      if (!card) return;
      this._setActiveCard(card, true);
    }

    next() {
      this.goTo(this._activeIndex + 1);
    }

    prev() {
      this.goTo(this._activeIndex - 1);
    }
  }

  window.LWT.define('lwtg-carousel', LWTCarousel);
})();

/* ---- lwt-gen-grid-item.js ---- */
/*!
 * <lwtg-grid-item>
 * A single clickable media cell — meant to live inside <lwtg-image-grid>
 * (see lwt-gen-image-grid.js for the grid/layout side of things), but
 * usable standalone too since this file has no idea a grid contains it.
 *
 *   <lwtg-image-grid columns="4">
 *     <lwtg-grid-item src="photo.jpg" label="Grand Canyon"></lwtg-grid-item>
 *     <lwtg-grid-item src="data:image/png;base64,iVBOR..." label="Logo"></lwtg-grid-item>
 *     <lwtg-grid-item src="https://youtu.be/dQw4w9WgXcQ" label="Demo" play-inline></lwtg-grid-item>
 *     <lwtg-grid-item type="svg" label="Icon"><svg>...</svg></lwtg-grid-item>
 *     <lwtg-grid-item type="embed" label="Map"><iframe src="..."></iframe></lwtg-grid-item>
 *   </lwtg-image-grid>
 *
 * Media resolution (the `type` attribute, or auto-detected when omitted):
 *   "image" (default) — a plain <img src="...">. Works identically for a
 *                        straight URL or a base64 data: URI — the <img>
 *                        tag doesn't care which, so there's no special
 *                        handling needed for base64 at all.
 *   "svg"              — if `src` is set, treated exactly like "image"
 *                        (points at a .svg file or a base64/data URI of
 *                        one). If `src` is NOT set, the default slot is
 *                        rendered instead, so you can place raw inline
 *                        <svg>...</svg> markup as light-DOM content —
 *                        that's the only way to get a *stylable* SVG
 *                        (currentColor, CSS-targetable paths); a plain
 *                        <img src="icon.svg"> is an opaque image, not
 *                        reachable from your page's CSS.
 *   "youtube"          — auto-detected whenever `src` looks like a
 *                        youtube.com/watch, youtube.com/embed, or
 *                        youtu.be URL (or when `video-id` is set
 *                        directly), regardless of the `type` attribute.
 *                        Renders a lightweight thumbnail + play-button
 *                        facade (no iframe loaded up front — cheap even
 *                        with dozens of videos in a grid). See
 *                        `play-inline` below for what clicking does.
 *   "embed"             — the default slot is rendered as-is; use this
 *                        for arbitrary embedded content (Vimeo, CodePen,
 *                        maps, ...) by placing your own <iframe> or other
 *                        markup as light-DOM content. This is also the
 *                        fallback when no `src`/`type` is given at all.
 *
 * Attributes:
 *   src         — image URL, base64/data URI, or a YouTube URL
 *   href        — optional link URL. When set, the rendered <img> (for
 *                 "image" type, and "svg"/"embed" when resolved via `src`)
 *                 is wrapped in <a href="..." target="_blank"
 *                 rel="noopener noreferrer">. Not applied to youtube or
 *                 slot-based (no-src svg/embed) content. This is purely
 *                 the visual/semantic link -- the item's own lwt-click
 *                 event still fires as normal on activation.
 *   video-id    — explicit YouTube video id (skips URL parsing; takes
 *                 priority over `src` for youtube-type items)
 *   type        — "image" (default) | "svg" | "embed" — forces
 *                 resolution instead of auto-detecting; youtube
 *                 detection from `src`/`video-id` always takes priority
 *                 regardless of this attribute
 *   alt         — alt text for the rendered <img> (image/svg-by-url only)
 *   label       — caption shown as a bottom-aligned overlay on hover or
 *                 keyboard focus; the overlay is omitted from the DOM
 *                 entirely when this isn't set (no empty bar on hover)
 *   title       — plain HTML global attribute; left untouched so the
 *                 browser's native tooltip just works, no JS needed
 *   col-span    — how many grid columns this cell spans (default 1;
 *                 supported values 2–8 or "full" for edge-to-edge)
 *   row-span    — how many grid rows this cell spans (default 1;
 *                 supported values 2–6)
 *
 * The spans are applied through zero-specificity :where() rules in the
 * shadow CSS, so any external CSS on the host wins with no !important
 * needed — perfect for responsive overrides:
 *
 *   @media (max-width: 600px) {
 *     lwtg-grid-item.hero { grid-column: auto; grid-row: auto; }
 *   }
 *
 * For spans outside the supported attribute range, just set them inline
 * on the host directly: <lwtg-grid-item style="grid-column: span 12">…</lwtg-grid-item>.
 *   play-inline — boolean, youtube items only; clicking swaps the
 *                 thumbnail facade for a live, autoplaying iframe in
 *                 place instead of only firing the click event
 *
 * Slots:
 *   (default) — raw content for "svg" (no src) and "embed" types
 *
 * Host is the focusable, clickable target (role="button", tabindex="0")
 * for the same reason <lwtg-tab> puts ARIA/focus on the host rather than
 * an inner shadow button — see lwt-gen-tab.js's note on this pattern.
 *
 * Events:
 *   lwt-click — fired on click or Enter/Space activation; detail:
 *               { type, src, label, index }. `index` is this item's
 *               position among its <lwtg-grid-item> siblings, computed
 *               fresh at click time (no coordination needed with a
 *               parent grid).
 *   lwt-play  — youtube + play-inline only; fired once the facade is
 *               swapped for a live iframe. detail: { videoId }.
 *
 * Theming: --lwt-grid-item-radius (10px), --lwt-grid-item-bg (#e5e7eb,
 * shown while an image loads), --lwt-grid-item-label-bg (a bottom-fade
 * gradient by default), --lwt-grid-item-label-color (#fff),
 * --lwt-grid-item-focus-color (#3b82f6).
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-grid-item.js requires lwt-core.js to be loaded first.');
  }

  function escapeXml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/;

  function extractYouTubeId(src) {
    var match = YOUTUBE_RE.exec(src || '');
    return match ? match[1] : '';
  }

  var PLAY_ICON =
    '<svg viewBox="0 0 68 48" aria-hidden="true">' +
    '<path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="rgba(0,0,0,0.65)"></path>' +
    '<path d="M45 24 27 14v20" fill="#fff"></path>' +
    '</svg>';

  var CSS =
    ':host { display: block; position: relative; box-sizing: border-box; font-family: inherit; cursor: pointer;' +
    '  border-radius: var(--lwt-grid-item-radius, 10px); overflow: hidden;' +
    '  background: var(--lwt-grid-item-bg, var(--lwt-color-border, #e5e7eb)); outline: none; }' +

    // Cell spanning defaults — wrapped in :where() so their specificity
    // is (0,0,0). ANY external selector (`lwtg-grid-item.hero`, a media
    // query, an id, etc.) wins with no !important, so users can override
    // the span responsively:
    //
    //   @media (max-width: 600px) {
    //     lwtg-grid-item.hero { grid-column: auto; grid-row: auto; }
    //   }
    //
    // Anything outside the 2-8 col / 2-6 row range still works — just set
    // `style="grid-column: span 12"` directly on the item; inline styles
    // beat these defaults automatically.
    ':where(:host([col-span="2"])) { grid-column: span 2; }' +
    ':where(:host([col-span="3"])) { grid-column: span 3; }' +
    ':where(:host([col-span="4"])) { grid-column: span 4; }' +
    ':where(:host([col-span="5"])) { grid-column: span 5; }' +
    ':where(:host([col-span="6"])) { grid-column: span 6; }' +
    ':where(:host([col-span="7"])) { grid-column: span 7; }' +
    ':where(:host([col-span="8"])) { grid-column: span 8; }' +
    ':where(:host([col-span="full"])) { grid-column: 1 / -1; }' +
    ':where(:host([row-span="2"])) { grid-row: span 2; }' +
    ':where(:host([row-span="3"])) { grid-row: span 3; }' +
    ':where(:host([row-span="4"])) { grid-row: span 4; }' +
    ':where(:host([row-span="5"])) { grid-row: span 5; }' +
    ':where(:host([row-span="6"])) { grid-row: span 6; }' +
    ':host(:focus-visible) { outline: 2px solid var(--lwt-grid-item-focus-color, var(--lwt-focus-ring, #3b82f6)); outline-offset: 2px; }' +
    '.media { position: absolute; inset: 0; width: 100%; height: 100%; }' +
    '.media img { width: 100%; height: 100%; object-fit: cover; display: block; }' +
    '.media a { display: block; width: 100%; height: 100%; }' +
    '.media ::slotted(*) { width: 100%; height: 100%; }' +
    '.yt-facade { position: relative; width: 100%; height: 100%; }' +
    '.yt-facade img { width: 100%; height: 100%; object-fit: cover; display: block; }' +
    '.yt-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }' +
    '.yt-play svg { width: 25%; min-width: 40px; max-width: 68px; filter: drop-shadow(0 2px 6px rgba(0,0,0,.35)); }' +
    '.yt-embed { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }' +
    '.label-overlay { position: absolute; left: 0; right: 0; bottom: 0; padding: 0.55rem 0.7rem 0.5rem;' +
    '  background: var(--lwt-grid-item-label-bg, linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0)));' +
    '  color: var(--lwt-grid-item-label-color, #fff); font-size: 0.85rem; font-weight: 600; line-height: 1.3;' +
    '  opacity: 0; transform: translateY(4px); transition: opacity 160ms ease, transform 160ms ease; pointer-events: none; }' +
    ':host(:hover) .label-overlay, :host(:focus-visible) .label-overlay { opacity: 1; transform: translateY(0); }';

  class LWTGridItem extends window.LWT.Element {
    static get observedAttributes() {
      return ['src', 'href', 'type', 'label', 'video-id', 'alt', 'col-span', 'row-span'];
    }

    constructor() {
      super();
      this._handleActivate = this._handleActivate.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
    }

    connectedCallback() {
      super.connectedCallback();
      this.addEventListener('click', this._handleActivate);
      this.addEventListener('keydown', this._handleKeydown);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('click', this._handleActivate);
      this.removeEventListener('keydown', this._handleKeydown);
    }

    render() {
      var type = this._resolveType();
      var label = this._strAttr('label', '');

      var html =
        '<div class="media" part="media">' + this._buildMediaHtml(type) + '</div>' +
        (label ? '<div class="label-overlay" part="label">' + escapeXml(label) + '</div>' : '');

      this._renderShadow(html, CSS);
      this._mediaEl = this._root.querySelector('.media');

      this.setAttribute('role', 'button');
      this.tabIndex = 0;
      if (label) this.setAttribute('aria-label', label);
      else this.removeAttribute('aria-label');
    }

    _resolveType() {
      if (this.hasAttribute('video-id') || extractYouTubeId(this._strAttr('src', ''))) return 'youtube';
      var explicit = this._strAttr('type', '');
      if (explicit) return explicit;
      if (!this.hasAttribute('src')) return 'embed';
      return 'image';
    }

    _buildMediaHtml(type) {
      var src = this._strAttr('src', '');
      var alt = escapeXml(this._strAttr('alt', ''));
      var href = this._strAttr('href', '');

      if (type === 'youtube') {
        var id = this._strAttr('video-id', '') || extractYouTubeId(src);
        if (!id) return '<slot></slot>';
        var thumb = 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
        return (
          '<div class="yt-facade" part="yt-facade" data-video-id="' + id + '">' +
          '<img src="' + thumb + '" alt="' + alt + '">' +
          '<div class="yt-play" part="yt-play">' + PLAY_ICON + '</div>' +
          '</div>'
        );
      }

      if (type === 'svg' || type === 'embed') {
        return this.hasAttribute('src')
          ? this._linkWrap(href, '<img src="' + escapeXml(src) + '" alt="' + alt + '">')
          : '<slot></slot>';
      }

      // "image" (default)
      return this._linkWrap(href, '<img src="' + escapeXml(src) + '" alt="' + alt + '" loading="lazy">');
    }

    // Wraps `inner` markup in an <a> when `href` is set; otherwise returns
    // `inner` untouched. target="_blank" + rel="noopener noreferrer" since
    // these are typically media links out of the current page.
    _linkWrap(href, inner) {
      if (!href) return inner;
      return '<a class="media-link" part="media-link" href="' + escapeXml(href) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>';
    }

    _index() {
      var parent = this.parentElement;
      if (!parent) return -1;
      var siblings = Array.prototype.filter.call(parent.children, function (c) {
        return c.tagName === 'LWT-GRID-ITEM';
      });
      return siblings.indexOf(this);
    }

    _handleActivate() {
      var type = this._resolveType();

      if (type === 'youtube' && this._boolAttr('play-inline') && this._mediaEl && !this._mediaEl.querySelector('.yt-embed')) {
        this._playInline();
      }

      this.emit('click', {
        type: type,
        src: this._strAttr('src', ''),
        label: this._strAttr('label', ''),
        index: this._index()
      });
    }

    _handleKeydown(event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._handleActivate();
    }

    _playInline() {
      var id = this._strAttr('video-id', '') || extractYouTubeId(this._strAttr('src', ''));
      if (!id || !this._mediaEl) return;
      var self = this;

      this._mediaEl.innerHTML = '';
      var iframe = this._genhtml({
        type: 'iframe',
        attr: {
          class: 'yt-embed',
          part: 'yt-embed',
          src: 'https://www.youtube.com/embed/' + id + '?autoplay=1',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: '',
          frameborder: '0'
        }
      });
      this._mediaEl.appendChild(iframe);
      self.emit('play', { videoId: id });
    }
  }

  window.LWT.define('lwtg-grid-item', LWTGridItem);
})();

/* ---- lwt-gen-grid.js ---- */
/*!
 * <lwtg-grid>
 * A general-purpose CSS Grid layout container for arbitrary page content.
 * Set a target column count and a minimum column width; the grid picks the
 * largest column count that fits and wraps automatically when the container
 * gets too narrow — no media queries needed. Rows size to their content by
 * default, or you can pin a fixed row count / row height.
 *
 * This is the layout-focused counterpart to <lwtg-image-grid> (see
 * lwt-gen-image-grid.js). The image grid is tuned for uniform media cells
 * (default row-height, cell-first API); this one is tuned for mixed page
 * content (auto row heights, any child, cell-spanning helpers on children).
 *
 *   <lwtg-grid columns="4" gap="1.5rem" min-col-width="220px">
 *     <div>Item 1</div>
 *     <div>Item 2</div>
 *     <div data-col-span="2">Wider item, spans two columns</div>
 *     <div data-col-span="full">Full-width row</div>
 *     <div data-row-span="2">Tall item</div>
 *     <div>Item 6</div>
 *   </lwtg-grid>
 *
 *   <!-- pure responsive mode: no `columns`, wraps as many cells as fit -->
 *   <lwtg-grid gap="1rem" min-col-width="240px">
 *     <lwtg-card>...</lwtg-card>
 *     <lwtg-card>...</lwtg-card>
 *     <lwtg-card>...</lwtg-card>
 *   </lwtg-grid>
 *
 * How the wrapping works: when `columns` is set, each column is sized to
 * `max(min-col-width, container/columns)`. If the container is wide enough
 * to give every column its target share, that share (>= min-col-width) is
 * used and the requested count is honored. As the container shrinks, the
 * per-column share drops below min-col-width; the floor kicks in, and
 * `auto-fit` drops columns off the right until they all fit again. No JS
 * involved in the resize — the CSS handles it. When `columns` is omitted
 * the grid runs in pure auto-fit mode (as many min-col-width columns as
 * fit, no ceiling).
 *
 * Attributes:
 *   columns        — target/maximum column count. Omit for pure
 *                    responsive mode (auto-fit at min-col-width).
 *   rows           — fixed row count with equal (1fr) heights. Omit to
 *                    let rows size to their content.
 *   gap            — CSS length between cells (default 1rem)
 *   min-col-width  — minimum column width before wrapping (default 200px).
 *                    This is what governs when the layout collapses to
 *                    fewer columns as the container shrinks.
 *   row-height     — fixed height for every implicit row (default "auto"
 *                    — rows size to their content). Set this only when you
 *                    want uniform row bands.
 *   dense          — boolean; `grid-auto-flow: dense`. Lets smaller items
 *                    backfill gaps left by spanning items instead of
 *                    leaving holes (bento-style layouts).
 *
 * Child spanning (any element inside the grid can use these):
 *   data-col-span   — 2, 3, 4, 5, 6, 7, 8, or "full" (span every column)
 *   data-row-span   — 2, 3, 4, 5, or 6
 *
 * If you need a value outside these presets, just style the child
 * directly: <div style="grid-column: span 12">…</div> works the same way,
 * since children live in light DOM.
 *
 * Slots: (default) — any children you want laid out.
 * Events: none — this is layout only.
 *
 * Theming: --lwt-grid-gap (1rem), --lwt-grid-row-height (auto),
 * --lwt-grid-min-col-width (200px), --lwt-grid-columns and --lwt-grid-rows
 * (set automatically from the `columns`/`rows` attributes; settable
 * directly via CSS instead if you'd rather not use the attributes).
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-grid.js requires lwt-core.js to be loaded first.');
  }

  class LWTGrid extends window.LWT.Element {
    static get observedAttributes() {
      return ['columns', 'rows', 'gap', 'min-col-width', 'row-height', 'dense'];
    }

    render() {
      var CSS = `
        :host { 
          display: block; 
          font-family: inherit; 
          width:100%;
        }
        :host([hidden]) { display: none; }
        .grid { 
          --lwt-grid-gap: ${this._strAttr('gap') || '1rem'};
          --lwt-grid-row-height: ${this._strAttr('row-height') || '1fr'};
          --lwt-grid-min-col-width: ${this._strAttr('min-col-width') || '1fr'};
          --lwt-grid-columns: ${this._strAttr('columns') || '1'};
          --lwt-grid-rows: ${this._strAttr('rows') || '1'};

          display: grid;
          width: 100%;
          gap: var(--lwt-grid-gap);
          grid-template-rows: repeat(var(--lwt-grid-rows, 1), var(--lwt-grid-row-height));
          grid-template-columns: repeat(var(--lwt-grid-columns, 1), var(--lwt-grid-min-col-width)); 
        }

        :where(:host([columns]) .grid) { 
          grid-template-columns: repeat(var(--lwt-grid-columns, 1), var(--lwt-grid-min-col-width, 1fr));  
        }
        :where(:host([rows]) .grid) { 
          grid-template-rows: repeat(var(--lwt-grid-rows, 1), var(--lwt-grid-row-height, 1fr));
        }
        :where(:host([dense]) .grid) { 
          grid-auto-flow: dense; 
        }
      `;

      this._syncVars();
      this._renderShadow('<div class="grid" part="grid"><slot></slot></div>', CSS);
    }

    _syncVars() {
      var pairs = [
        ['columns',       '--lwt-grid-columns'],
        ['rows',          '--lwt-grid-rows'],
        ['gap',           '--lwt-grid-gap'],
        ['min-col-width', '--lwt-grid-min-col-width'],
        ['row-height',    '--lwt-grid-row-height']
      ];
      var self = this;
      pairs.forEach(function (p) {
        var attr = p[0], cssVar = p[1];
        if (self.hasAttribute(attr)) self.style.setProperty(cssVar, self._strAttr(attr, ''));
        else self.style.removeProperty(cssVar);
      });
    }
  }

  window.LWT.define('lwtg-grid', LWTGrid);
})();

/* ---- lwt-gen-image-grid.js ---- */
/*!
 * <lwtg-image-grid>
 * A CSS-Grid layout container for <lwtg-grid-item> media cells (see
 * lwt-gen-grid-item.js for what a single cell handles — image/base64,
 * inline SVG, YouTube, or arbitrary embeds). This file is purely the
 * layout: it doesn't know or care what kind of media is inside each cell.
 *
 *   <lwtg-image-grid columns="4" gap="12px" row-height="180px">
 *     <lwtg-grid-item src="a.jpg" label="Alpha"></lwtg-grid-item>
 *     <lwtg-grid-item src="b.jpg" label="Beta" col-span="2"></lwtg-grid-item>
 *     <lwtg-grid-item src="c.jpg" row-span="2"></lwtg-grid-item>
 *   </lwtg-image-grid>
 *
 * Layout model: real CSS Grid, not a fixed set of named templates —
 * `columns` sets the column count, `row-height` sets a uniform row
 * height (via grid-auto-rows), and each <lwtg-grid-item> can opt into
 * spanning multiple columns/rows via its own `col-span`/`row-span`
 * attributes. That combination alone covers everything from a plain
 * uniform grid to bento-style mixed layouts, without this element
 * needing to bake in a fixed list of preset arrangements.
 *
 * If `columns` is omitted entirely, the grid falls back to a responsive
 * `auto-fill` mode instead of a fixed column count — cells lay out as
 * many-per-row as fit at `--lwt-image-grid-min-width` each, reflowing
 * automatically on resize with no media queries needed.
 *
 * Small-screen behaviour when `columns` IS set: the requested count is a
 * ceiling, not a hard rule. Each column is sized to
 * `max(--lwt-image-grid-min-width, container/columns)` inside an
 * `auto-fit` minmax, so the grid honours the requested count when there's
 * room, but as the container narrows the per-column share drops below
 * min-width, the floor kicks in, and columns peel off the right until
 * things fit again. Same CSS-only collapse used by <lwtg-grid>. No media
 * queries or JS resize listeners.
 *
 * Attributes:
 *   columns     — column-count behaviour depends on whether `rows` is
 *                 also set. Alone, it's a target/max (see the wrapping
 *                 explanation above — capped-with-fallback). Combined
 *                 with `rows` it becomes a HARD cap: the grid is exactly
 *                 N columns wide regardless of viewport width and does
 *                 not auto-collapse.
 *   rows        — fixed row count. Each explicit row is
 *                 --lwt-image-grid-row-height tall (default 160px), same
 *                 as implicit rows via `grid-auto-rows`. Setting `rows`
 *                 also switches `columns` into hard-cap mode (see above).
 *   gap         — CSS length for spacing between cells (default 1rem)
 *   row-height  — CSS length used for every implicit row's height
 *                 (default 160px) — needed for col-span/row-span to
 *                 produce even, predictable cells
 *   dense       — boolean; adds `grid-auto-flow: dense` so smaller items
 *                 backfill gaps left by spanning items instead of
 *                 leaving holes (the classic "masonry-ish bento" look)
 *
 * Slots:
 *   (default) — any number of <lwtg-grid-item> children
 *
 * Events: none of its own — each <lwtg-grid-item> already emits a
 * bubbling, composed `lwt-click` (and `lwt-play` for inline-played
 * videos), so listening on the grid itself
 * (`grid.addEventListener('lwt-click', ...)`) picks up every cell's
 * clicks without this container needing to re-broadcast anything.
 *
 * Theming: --lwt-image-grid-gap (1rem), --lwt-image-grid-row-height
 * (160px), --lwt-image-grid-min-width (200px, auto-fill mode only),
 * --lwt-image-grid-columns (set automatically from the `columns`
 * attribute; settable directly via CSS instead if you'd rather not use
 * the attribute).
 *
 * Requires lwt-core.js to be loaded first. Needs lwt-gen-grid-item.js to
 * be useful, but doesn't hard-depend on it to define its own element.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-image-grid.js requires lwt-core.js to be loaded first.');
  }

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    '.grid { display: grid; gap: var(--lwt-image-grid-gap, 1rem);' +
    '  grid-auto-rows: var(--lwt-image-grid-row-height, 160px);' +
    '  grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--lwt-image-grid-min-width, 200px)), 1fr)); }' +
    // With `columns` set: cap the count, but let it collapse on small
    // screens once each column would fall below --lwt-image-grid-min-width.
    // The columns/dense structural rules are wrapped in :where() so
    // external CSS via ::part(grid) or a responsive override wins with
    // no !important. Same pattern applied to <lwtg-grid-item> and friends.
    ':where(:host([columns]) .grid) { grid-template-columns: repeat(auto-fit, minmax(' +
    '  max(var(--lwt-image-grid-min-width, 200px),' +
    '      calc((100% - (var(--lwt-image-grid-columns, 4) - 1) * var(--lwt-image-grid-gap, 1rem)) / var(--lwt-image-grid-columns, 4))),' +
    '  1fr)); }' +
    // `rows` alone: fixed row count, columns still responsive.
    ':where(:host([rows]) .grid) { grid-template-rows: repeat(var(--lwt-image-grid-rows, 1), var(--lwt-image-grid-row-height, 160px)); }' +
    // Both `columns` AND `rows` set: user has committed to a fixed grid,
    // so drop the responsive auto-fit magic and hard-cap the column count
    // at exactly N. Comes AFTER the `[columns]` rule so it wins the
    // cascade (same zero specificity, order matters).
    ':where(:host([columns][rows]) .grid) { grid-template-columns: repeat(var(--lwt-image-grid-columns, 4), 1fr); }' +
    ':where(:host([dense]) .grid) { grid-auto-flow: dense; }';

  class LWTImageGrid extends window.LWT.Element {
    static get observedAttributes() {
      return ['columns', 'rows', 'gap', 'row-height', 'dense'];
    }

    render() {
      this._syncVars();
      this._renderShadow('<div class="grid" part="grid"><slot></slot></div>', CSS);

      if(this._strAttr('columns')){
        this._root.lastChild.style.gridTemplateColumns = `repeat(${this._strAttr('columns')}, 1fr)`;
      }
    }

    _syncVars() {
      if (this.hasAttribute('columns')) {
        this.style.setProperty('--lwt-image-grid-columns', this._strAttr('columns', '4'));
      } else {
        this.style.removeProperty('--lwt-image-grid-columns');
      }

      if (this.hasAttribute('rows')) {
        this.style.setProperty('--lwt-image-grid-rows', this._strAttr('rows', '1'));
      } else {
        this.style.removeProperty('--lwt-image-grid-rows');
      }

      if (this.hasAttribute('gap')) {
        this.style.setProperty('--lwt-image-grid-gap', this._strAttr('gap', ''));
      } else {
        this.style.removeProperty('--lwt-image-grid-gap');
      }

      if (this.hasAttribute('row-height')) {
        this.style.setProperty('--lwt-image-grid-row-height', this._strAttr('row-height', ''));
      } else {
        this.style.removeProperty('--lwt-image-grid-row-height');
      }
    }
  }

  window.LWT.define('lwtg-image-grid', LWTImageGrid);
})();

/* ---- lwt-gen-modal.js ---- */
/*!
 * <lwtg-modal>
 * A modal built on the native <dialog> element (rendered inside shadow DOM),
 * so "takes over the page" comes for free: showModal() renders it in the
 * top layer, dims/inerts the rest of the document via ::backdrop, and traps
 * focus — no manual overlay div or focus-trap code needed.
 *
 * Content is entirely up to the caller: put any headers, paragraphs, and
 * action buttons as light-DOM children of <lwtg-modal>, e.g.
 *
 *   <lwtg-modal id="confirm" label="Confirm delete">
 *     <h2>Delete this item?</h2>
 *     <p>This can't be undone.</p>
 *     <button data-lwt-dismiss>Cancel</button>
 *     <button id="confirm-btn">Delete</button>
 *   </lwtg-modal>
 *
 * Opening/closing:
 *   - JS:  document.getElementById('confirm').show()
 *          document.getElementById('confirm').close()   <-- the "close function"
 *   - Any slotted element with a `data-lwt-dismiss` attribute closes the
 *     modal automatically when clicked — no JS wiring required.
 *   - Clicking the backdrop or pressing Escape also closes it, unless the
 *     `no-dismiss` attribute is present (for modals requiring an explicit
 *     action).
 *   - `open` attribute present at parse time auto-opens on connect, and is
 *     kept in sync with state afterwards (useful as a CSS/test hook via
 *     `lwtg-modal[open]`) — but toggling it later via setAttribute does NOT
 *     re-open/close the modal; use .show()/.close() for that.
 *
 * Events: lwt-open, lwt-close (detail: { reason: 'api'|'backdrop'|'escape'|'dismiss-button' })
 * Theming: --lwt-modal-bg, --lwt-modal-color, --lwt-modal-backdrop, exposes part="dialog"
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-modal.js requires lwt-core.js to be loaded first.');
  }

  var CSS =
    'dialog {' +
    '  border: none;' +
    '  border-radius: 10px;' +
    '  padding: 1.5rem;' +
    '  max-width: min(90vw, 32rem);' +
    '  max-height: 85vh;' +
    '  overflow: auto;' +
    '  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1);' +
    '  background: var(--lwt-modal-bg, var(--lwt-color-surface, #fff));' +
    '  color: var(--lwt-modal-color, var(--lwt-color-text, inherit));' +
    '  font-family: inherit;' +
    '}' +
    'dialog::backdrop {' +
    '  background: var(--lwt-modal-backdrop, var(--lwt-color-overlay, rgba(15, 23, 42, 0.55)));' +
    '}' +
    '::slotted(*:first-child) { margin-top: 0; }' +
    '::slotted(*:last-child) { margin-bottom: 0; }';

  class LWTModal extends window.LWT.Element {
    static get observedAttributes() {
      return ['label'];
    }

    constructor() {
      super();
      this._handleDismissClick = this._handleDismissClick.bind(this);
      this._handleCancel = this._handleCancel.bind(this);
      this._handleClose = this._handleClose.bind(this);
      this._handleBackdropClick = this._handleBackdropClick.bind(this);
      this._closeReason = null;
    }

    connectedCallback() {
      super.connectedCallback(); // builds shadow DOM + calls render()
      this.addEventListener('click', this._handleDismissClick);
      if (this.hasAttribute('open')) {
        this.show();
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('click', this._handleDismissClick);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'label' && this._dialog) {
        this._applyLabel();
      }
    }

    render() {
      this._renderShadow('<dialog part="dialog"><slot></slot></dialog>', CSS);
      this._dialog = this._root.querySelector('dialog');
      this._dialog.addEventListener('cancel', this._handleCancel);
      this._dialog.addEventListener('close', this._handleClose);
      this._dialog.addEventListener('click', this._handleBackdropClick);
      this._applyLabel();
    }

    _applyLabel() {
      var label = this._strAttr('label', '');
      if (label) this._dialog.setAttribute('aria-label', label);
      else this._dialog.removeAttribute('aria-label');
    }

    // Public API -----------------------------------------------------

    show() {
      if (!this._dialog || this._dialog.open) return;
      this._dialog.showModal();
      this.setAttribute('open', '');
      this.emit('open', {});
    }

    close(reason) {
      if (!this._dialog || !this._dialog.open) return;
      this._closeReason = reason || 'api';
      this._dialog.close();
    }

    toggle(force) {
      var willOpen = typeof force === 'boolean' ? force : !(this._dialog && this._dialog.open);
      if (willOpen) this.show();
      else this.close('api');
      return willOpen;
    }

    get isOpen() {
      return !!(this._dialog && this._dialog.open);
    }

    // Internal handlers ------------------------------------------------

    _handleDismissClick(event) {
      var trigger = event.target && event.target.closest
        ? event.target.closest('[data-lwt-dismiss]')
        : null;
      if (trigger) this.close('dismiss-button');
    }

    _handleCancel(event) {
      // Fires when the user presses Escape, before the dialog closes.
      if (this._boolAttr('no-dismiss')) {
        event.preventDefault();
        return;
      }
      this._closeReason = 'escape';
    }

    _handleBackdropClick(event) {
      // The dialog element's own box is exactly its content; a click that
      // lands on the dialog itself (not a descendant) means the backdrop
      // was clicked.
      if (event.target !== this._dialog) return;
      if (this._boolAttr('no-dismiss')) return;
      this.close('backdrop');
    }

    _handleClose() {
      // Fires after the dialog actually closes, however it happened.
      this.removeAttribute('open');
      var reason = this._closeReason || 'api';
      this._closeReason = null;
      this.emit('close', { reason: reason });
    }
  }

  window.LWT.define('lwtg-modal', LWTModal);
})();

/* ---- lwt-gen-nav-item.js ---- */
/*!
 * <lwtg-nav-item>
 * A single entry in <lwtg-nav-menu> — a plain link/button, or a parent that
 * opens a dropdown of its own nested <lwtg-nav-item> children. Nest items
 * inside each other to build multi-level dropdowns to any depth; each
 * level cascades its own flyout, the same recursive pattern used by
 * lwt-gen-tree-item.js for tree hierarchies.
 *
 *   <lwtg-nav-menu>
 *     <lwtg-nav-item href="/">Home</lwtg-nav-item>
 *     <lwtg-nav-item label="Products">
 *       <lwtg-nav-item href="/products/a">Product A</lwtg-nav-item>
 *       <lwtg-nav-item label="More">
 *         <lwtg-nav-item href="/products/b">Product B</lwtg-nav-item>
 *         <lwtg-nav-item href="/products/c">Product C</lwtg-nav-item>
 *       </lwtg-nav-item>
 *     </lwtg-nav-item>
 *     <lwtg-nav-item href="/about" active>
 *       <span slot="label">
 *         <svg>...</svg> About
 *       </span>
 *     </lwtg-nav-item>
 *   </lwtg-nav-menu>
 *
 * Label content is entirely up to the caller — plain text via the `label`
 * attribute, or arbitrary HTML (icons, badges, whatever) via slot="label".
 * Whether an item becomes a dropdown parent is auto-detected: any
 * <lwtg-nav-item> child NOT slotted into "label" makes this a parent.
 * Parent items are always rendered as a <button> (never a link), since a
 * click needs to toggle the dropdown rather than navigate.
 *
 * Interaction:
 *   - Desktop (not inside a collapsed mobile menu): hovering a parent
 *     opens its dropdown; moving away closes it after a short delay so
 *     the pointer can travel into the panel. Clicking also toggles, for
 *     keyboard/touch users. Only one branch is open per level at a time
 *     (opening a sibling closes the previous one), coordinated the same
 *     way lwt-gen-accordion.js coordinates its items.
 *   - Mobile (menu is in hamburger mode — see lwt-gen-nav-menu.js): hover
 *     is disabled; dropdowns become inline, indented accordion sections
 *     instead of flyout panels, since flyouts don't work on touch.
 *   - Keyboard: ArrowDown on a parent's trigger opens it and focuses the
 *     first child. Escape closes the nearest open ancestor dropdown and
 *     returns focus to its trigger.
 *
 * A dropdown that would overflow the viewport flips to the opposite edge
 * automatically (same approach used by lwt-frm-text-input.js's tooltip).
 *
 * Attributes:
 *   href      — if set (and this item has no children), renders an <a>;
 *               otherwise a <button>
 *   target    — anchor target, e.g. "_blank" (adds rel="noopener noreferrer")
 *   label     — fallback text (overridden by richer content in slot="label")
 *   disabled  — boolean; blocks all interaction
 *   active    — boolean; visual "current page" indicator — set by hand,
 *               this element does no location/routing detection
 *   mobile, orientation — set automatically by the parent <lwtg-nav-menu>;
 *               not meant to be set by hand (same convention as <lwtg-tab>'s
 *               `position` attribute)
 *
 * Slots: label (named, rich content), default (nested <lwtg-nav-item>s)
 *
 * Methods: .open(), .close(), .toggle(), .focusTrigger()
 * Property: .isOpen (read-only), .labelText (read-only, resolved label text)
 * Events: lwt-navopen, lwt-navclose (no detail — <lwtg-nav-menu> listens
 * for these to coordinate single-open-per-level and mobile-panel
 * auto-close); lwtf-select (leaf items only, detail: { href, label }).
 *
 * Known scope limits: no open/close transition on the dropdown panel
 * itself (instant show/hide via the `hidden` attribute) — a deliberate
 * scope trim, same reasoning lwt-gen-tree-item.js gives for skipping its
 * own expand animation.
 *
 * Theming: --lwt-nav-item-color, --lwt-nav-item-hover-color,
 * --lwt-nav-item-hover-bg, --lwt-nav-item-active-color,
 * --lwt-nav-item-active-bg, --lwt-nav-item-padding-x/-y,
 * --lwt-nav-item-radius, --lwt-nav-focus-color, --lwt-nav-menu-indent
 * (mobile accordion indent per level), --lwt-nav-dropdown-bg/-border/
 * -radius/-shadow/-min-width, --lwt-nav-menu-z (dropdown stacking order).
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-nav-item.js requires lwt-core.js to be loaded first.');
  }

  var uid = 0;

  function escapeXml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var CHEVRON_SVG =
    '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7l5 5l5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  var CSS =
    ':host { display: block; position: relative; font-family: inherit; }' +
    ':host([disabled]) { pointer-events: none; }' +

    '.trigger { display: flex; align-items: center; width: 100%; box-sizing: border-box; gap: 0.4rem;' +
    '  padding: var(--lwt-nav-item-padding-y, 0.55rem) var(--lwt-nav-item-padding-x, 0.9rem);' +
    '  border: none; background: none; cursor: pointer; font: inherit; font-size: 0.92rem; text-align: left;' +
    '  color: var(--lwt-nav-item-color, var(--lwt-color-text, #1f2937)); text-decoration: none;' +
    '  border-radius: var(--lwt-nav-item-radius, 6px); white-space: nowrap; }' +
    ':where(:host([mobile]) .trigger) { white-space: normal;' +
    '  padding-left: calc(var(--lwt-nav-menu-indent, 1rem) * var(--lwt-nav-item-depth, 0) + var(--lwt-nav-item-padding-x, 0.9rem)); }' +
    '.trigger:hover { color: var(--lwt-nav-item-hover-color, var(--lwt-color-primary, #2563eb));' +
    '  background: var(--lwt-nav-item-hover-bg, var(--lwt-color-surface-alt, rgba(0,0,0,0.05))); }' +
    '.trigger:focus-visible { outline: 2px solid var(--lwt-nav-focus-color, var(--lwt-focus-ring, #2563eb)); outline-offset: -2px; }' +
    ':host([disabled]) .trigger { opacity: 0.5; cursor: not-allowed; }' +
    ':host([active]) .trigger { color: var(--lwt-nav-item-active-color, var(--lwt-color-primary, #2563eb)); font-weight: 600;' +
    '  background: var(--lwt-nav-item-active-bg, transparent); }' +

    '.content { flex: 1; min-width: 0; display: flex; align-items: center; gap: 0.4rem; overflow: hidden; }' +
    '.content ::slotted(img), .content ::slotted(svg) { width: 1.05em; height: 1.05em; flex-shrink: 0; vertical-align: middle; }' +

    '.chevron { flex-shrink: 0; display: flex; align-items: center; margin-left: 0.15rem; }' +
    '.chevron svg { width: 11px; height: 11px; transition: transform 150ms ease; }' +
    ':host([data-top-level]:not([orientation="vertical"]):not([mobile])) .chevron svg { transform: rotate(0deg); }' +
    ':host([data-top-level]:not([orientation="vertical"]):not([mobile])[data-open]) .chevron svg { transform: rotate(180deg); }' +
    ':host([data-top-level][orientation="vertical"]:not([mobile])) .chevron svg,' +
    ' :host(:not([data-top-level]):not([mobile])) .chevron svg { transform: rotate(-90deg); }' +
    ':host([data-top-level][orientation="vertical"]:not([mobile])[data-open]) .chevron svg,' +
    ' :host(:not([data-top-level]):not([mobile])[data-open]) .chevron svg { transform: rotate(0deg); }' +
    ':host([mobile]) .chevron svg { transform: rotate(0deg); }' +
    ':host([mobile][data-open]) .chevron svg { transform: rotate(180deg); }' +

    '.submenu { list-style: none; margin: 0; padding: 0.35rem; min-width: var(--lwt-nav-dropdown-min-width, 180px);' +
    '  background: var(--lwt-nav-dropdown-bg, var(--lwt-color-surface, #fff));' +
    '  border: 1px solid var(--lwt-nav-dropdown-border, var(--lwt-color-border, #e5e7eb));' +
    '  border-radius: var(--lwt-nav-dropdown-radius, 8px);' +
    '  box-shadow: 0 10px 25px var(--lwt-nav-dropdown-shadow, var(--lwt-color-shadow, rgba(0,0,0,0.15))); }' +
    ':host([data-top-level]:not([orientation="vertical"]):not([mobile])) .submenu {' +
    '  position: absolute; top: 100%; left: 0; margin-top: 0.3rem; z-index: var(--lwt-nav-menu-z, 100); }' +
    ':host([data-top-level][orientation="vertical"]:not([mobile])) .submenu,' +
    ' :host(:not([data-top-level]):not([mobile])) .submenu {' +
    '  position: absolute; top: 0; left: 100%; margin-left: 0.3rem; z-index: var(--lwt-nav-menu-z, 100); }' +
    ':host([mobile]) .submenu { position: static; margin: 0.15rem 0; padding: 0; background: none; border: none; box-shadow: none; }';

  class LWTNavItem extends window.LWT.Element {
    static get observedAttributes() {
      return ['href', 'target', 'label', 'disabled', 'active', 'mobile', 'orientation'];
    }

    constructor() {
      super();
      this._id = 'lwt-nav-item-' + (++uid);
      this._isOpen = false;
      this._hasChildrenNow = false;
      this._initialized = false;
      this._topLevel = false;
      this._closeTimer = null;

      this._onMouseEnter = this._onMouseEnter.bind(this);
      this._onMouseLeave = this._onMouseLeave.bind(this);
      this._handleTriggerClick = this._handleTriggerClick.bind(this);
      this._handleTriggerKeydown = this._handleTriggerKeydown.bind(this);
      this._handleChildOpen = this._handleChildOpen.bind(this);
    }

    connectedCallback() {
      super.connectedCallback(); // builds shadow via render()

      if (!this._initialized) {
        this._initialized = true;
        this._topLevel = !!(this.parentElement && this.parentElement.tagName === 'LWT-NAV-MENU');
        if (this._topLevel) this.setAttribute('data-top-level', '');
        this.style.setProperty('--lwt-nav-item-depth', String(this._computeDepth()));

        // The parser fires connectedCallback right after the open tag,
        // before nested <lwtg-nav-item> children have been appended — so
        // the first render() sees an empty child list and picks the
        // leaf template. Re-check on the next microtask (same fix
        // lwt-gen-tree.js and lwt-gen-carousel.js use) and re-render if
        // children have actually shown up. Also caught by the mutation
        // observer below for later dynamic additions.
        var self = this;
        Promise.resolve().then(function () {
          if (self._hasChildrenNow !== self._computeHasChildren()) self.render();
        });

        if (typeof MutationObserver === 'function') {
          this._childObserver = new MutationObserver(function () {
            if (self._hasChildrenNow !== self._computeHasChildren()) self.render();
          });
          this._childObserver.observe(this, { childList: true });
        }
      }

      this.addEventListener('mouseenter', this._onMouseEnter);
      this.addEventListener('mouseleave', this._onMouseLeave);
      this.addEventListener('lwt-navopen', this._handleChildOpen);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('mouseenter', this._onMouseEnter);
      this.removeEventListener('mouseleave', this._onMouseLeave);
      this.removeEventListener('lwt-navopen', this._handleChildOpen);
      clearTimeout(this._closeTimer);
      if (this._childObserver) this._childObserver.disconnect();
    }

    render() {
      this._hasChildrenNow = this._computeHasChildren();
      var href = this._strAttr('href', '');
      var target = this._strAttr('target', '');
      var disabled = this._boolAttr('disabled');
      var fallbackLabel = escapeXml(this._strAttr('label', ''));
      var submenuId = this._id + '-submenu';

      // Leaves use the default (unnamed) slot so text nodes/inline HTML
      // written directly inside the tag ("<lwtg-nav-item>Home</lwtg-nav-item>")
      // are projected — text nodes can't carry a slot="" attribute, so a
      // named-only slot would silently drop them.
      //
      // Parents use the named "label" slot instead, so the default slot is
      // left free for the submenu's own <slot> to receive nested items.
      var labelSlotHtml = this._hasChildrenNow
        ? '<slot name="label">' + fallbackLabel + '</slot>'
        : '<slot>' + fallbackLabel + '</slot>';
      var contentHtml = '<span class="content" part="content">' + labelSlotHtml + '</span>';
      var triggerHtml;
      if (this._hasChildrenNow) {
        triggerHtml =
          '<button type="button" class="trigger" part="trigger" aria-haspopup="true" aria-expanded="false" aria-controls="' + submenuId + '">' +
          contentHtml + '<span class="chevron" part="chevron">' + CHEVRON_SVG + '</span></button>';
      } else if (href) {
        triggerHtml =
          '<a class="trigger" part="trigger" href="' + escapeXml(href) + '"' +
          (target ? ' target="' + escapeXml(target) + '" rel="noopener noreferrer"' : '') + '>' +
          contentHtml + '</a>';
      } else {
        triggerHtml = '<button type="button" class="trigger" part="trigger">' + contentHtml + '</button>';
      }
      var submenuHtml = this._hasChildrenNow
        ? '<ul class="submenu" part="submenu" id="' + submenuId + '" hidden><slot></slot></ul>'
        : '';

      this._renderShadow(triggerHtml + submenuHtml, CSS);

      this._triggerEl = this._root.querySelector('.trigger');
      this._submenuEl = this._hasChildrenNow ? this._root.querySelector('.submenu') : null;

      if (disabled) {
        if (this._triggerEl.tagName === 'BUTTON') this._triggerEl.disabled = true;
        this._triggerEl.tabIndex = -1;
        this._triggerEl.setAttribute('aria-disabled', 'true');
      } else {
        this._triggerEl.removeAttribute('aria-disabled');
      }

      this._triggerEl.addEventListener('click', this._handleTriggerClick);
      this._triggerEl.addEventListener('keydown', this._handleTriggerKeydown);

      this._applyOpenState();
    }

    // ---- structure helpers ----

    _computeHasChildren() {
      return Array.prototype.some.call(this.children, function (c) {
        return c.tagName === 'LWT-NAV-ITEM' && c.getAttribute('slot') !== 'label';
      });
    }

    _directChildItems() {
      return Array.prototype.filter.call(this.children, function (c) {
        return c.tagName === 'LWT-NAV-ITEM' && c.getAttribute('slot') !== 'label';
      });
    }

    _computeDepth() {
      var depth = 0;
      var p = this.parentElement;
      while (p && p.tagName === 'LWT-NAV-ITEM') {
        depth++;
        p = p.parentElement;
      }
      return depth;
    }

    get labelText() {
      if (this._root) {
        // For leaves the label lives in the default slot; for parents in
        // the named "label" slot. Try either — first one with assigned
        // content wins.
        var slot = this._root.querySelector('slot[name="label"]') ||
                   this._root.querySelector('.content slot:not([name])');
        if (slot) {
          var assigned = slot.assignedNodes({ flatten: true });
          if (assigned.length) {
            return assigned.map(function (n) { return n.textContent; }).join('').trim();
          }
        }
      }
      return this._strAttr('label', '');
    }

    // ---- open/close ----

    get isOpen() { return this._isOpen; }

    open() {
      if (!this._hasChildrenNow || this._isOpen || this._boolAttr('disabled')) return;
      this._isOpen = true;
      this._applyOpenState();
      this._positionSubmenu();
      this.emit('navopen', {});
    }

    close() {
      if (!this._isOpen) return;
      this._isOpen = false;
      // Cascade: collapse any open descendants first, so nothing lingers
      // open the next time this branch is revealed.
      this._directChildItems().forEach(function (c) {
        if (typeof c.close === 'function') c.close();
      });
      this._applyOpenState();
      this._clearSubmenuPosition();
      this.emit('navclose', {});
    }

    toggle() {
      if (this._isOpen) this.close();
      else this.open();
    }

    focusTrigger() {
      if (this._triggerEl) this._triggerEl.focus();
    }

    _applyOpenState() {
      if (!this._hasChildrenNow) {
        this.removeAttribute('data-open');
        return;
      }
      if (this._isOpen) {
        this.setAttribute('data-open', '');
        if (this._submenuEl) this._submenuEl.hidden = false;
        if (this._triggerEl) this._triggerEl.setAttribute('aria-expanded', 'true');
      } else {
        this.removeAttribute('data-open');
        if (this._submenuEl) this._submenuEl.hidden = true;
        if (this._triggerEl) this._triggerEl.setAttribute('aria-expanded', 'false');
      }
    }

    // ---- event handlers ----

    _handleChildOpen(event) {
      // Only react when a DIRECT child opened -- deeper descendants'
      // events also bubble here, but those are that child's own concern.
      if (!event.target || event.target.parentElement !== this) return;
      var opened = event.target;
      this._directChildItems().forEach(function (item) {
        if (item !== opened && typeof item.close === 'function') item.close();
      });
    }

    _handleTriggerClick(event) {
      if (this._boolAttr('disabled')) { event.preventDefault(); return; }
      if (this._hasChildrenNow) {
        event.preventDefault();
        this.toggle();
      } else {
        this.emit('select', { href: this._strAttr('href', ''), label: this.labelText });
      }
    }

    _handleTriggerKeydown(event) {
      if (this._boolAttr('disabled')) return;

      if (event.key === 'ArrowDown' && this._hasChildrenNow) {
        event.preventDefault();
        this.open();
        var first = this._directChildItems()[0];
        if (first && typeof first.focusTrigger === 'function') first.focusTrigger();
      } else if (event.key === 'Escape') {
        var target = (this._hasChildrenNow && this._isOpen) ? this : this._openAncestor();
        if (target) {
          event.preventDefault();
          target.close();
          if (typeof target.focusTrigger === 'function') target.focusTrigger();
        }
      }
    }

    _openAncestor() {
      var p = this.parentElement;
      while (p && p.tagName === 'LWT-NAV-ITEM') {
        if (p.isOpen) return p;
        p = p.parentElement;
      }
      return null;
    }

    _onMouseEnter() {
      if (this._boolAttr('mobile') || !this._hasChildrenNow || this._boolAttr('disabled')) return;
      clearTimeout(this._closeTimer);
      this.open();
    }

    _onMouseLeave() {
      if (this._boolAttr('mobile') || !this._hasChildrenNow) return;
      var self = this;
      this._closeTimer = setTimeout(function () { self.close(); }, 220);
    }

    // ---- viewport-aware flyout positioning ----

    _positionSubmenu() {
      if (this._boolAttr('mobile') || !this._submenuEl) return;
      var el = this._submenuEl;
      el.style.left = ''; el.style.right = ''; el.style.top = ''; el.style.bottom = '';
      var rect = el.getBoundingClientRect();
      var vpW = window.innerWidth, vpH = window.innerHeight;
      if (rect.right > vpW - 4) { el.style.left = 'auto'; el.style.right = '0'; }
      if (rect.bottom > vpH - 4) { el.style.top = 'auto'; el.style.bottom = '0'; }
    }

    _clearSubmenuPosition() {
      if (!this._submenuEl) return;
      this._submenuEl.style.left = ''; this._submenuEl.style.right = '';
      this._submenuEl.style.top = ''; this._submenuEl.style.bottom = '';
    }
  }

  window.LWT.define('lwtg-nav-item', LWTNavItem);
})();

/* ---- lwt-gen-nav-menu.js ---- */
/*!
 * <lwtg-nav-menu>
 * A page main-menu container/coordinator for <lwtg-nav-item> children (see
 * lwt-gen-nav-item.js for what a single entry and its dropdown behavior
 * look like). This file owns the things that apply to the menu as a
 * whole: horizontal/vertical layout, the responsive collapse into a
 * hamburger button + off-canvas panel below a breakpoint, sticky
 * positioning, and coordinating which dropdown branch is open.
 *
 *   <lwtg-nav-menu orientation="horizontal" sticky breakpoint="880">
 *     <lwtg-nav-item href="/">Home</lwtg-nav-item>
 *     <lwtg-nav-item label="Products">
 *       <lwtg-nav-item href="/products/a">Product A</lwtg-nav-item>
 *       <lwtg-nav-item href="/products/b">Product B</lwtg-nav-item>
 *     </lwtg-nav-item>
 *     <lwtg-nav-item href="/about" active>About</lwtg-nav-item>
 *   </lwtg-nav-menu>
 *
 * The menu bar itself is deliberately unstyled/transparent — it inherits
 * whatever background the page/header around it already has. Dropdown
 * panels (including the mobile off-canvas panel) DO have their own
 * background, since they float above page content and need to read as a
 * distinct surface. See lwt-gen-nav-item.js's theming section for the
 * dropdown panel variables.
 *
 * Responsive collapse: width is measured on THIS element (via
 * ResizeObserver), not the window — so the menu correctly goes mobile
 * when it's embedded in a narrow container, even on a wide screen. Below
 * `breakpoint` px, the item list hides behind a hamburger button; opening
 * it reveals every item stacked vertically, and every dropdown switches
 * from a hover flyout to a tap-to-expand inline accordion (propagated
 * down to every <lwtg-nav-item>, at any nesting depth, via a `mobile`
 * attribute — the same "container propagates an attribute to every
 * descendant" pattern lwt-gen-tree.js uses for `checkable`).
 *
 * Attributes:
 *   orientation  — "horizontal" (default) | "vertical". Only affects the
 *                  desktop (non-mobile) layout; below the breakpoint the
 *                  menu is always a stacked vertical list regardless of
 *                  this setting. Synced onto every direct-child
 *                  <lwtg-nav-item> so each one knows which edge to open
 *                  its own dropdown from (down for horizontal, right for
 *                  vertical — see lwt-gen-nav-item.js).
 *   sticky       — boolean; the bar sticks to the top of its nearest
 *                  scrolling ancestor on scroll (`position: sticky; top:
 *                  0`). Purely CSS — no JS involved.
 *   breakpoint   — px width below which the menu switches to mobile mode
 *                  (default 880).
 *
 * Methods: .closeAll() — closes every open dropdown branch.
 *
 * A `role="navigation"` is set on the host automatically (unless you've
 * already set your own `role`); pair it with a plain `aria-label`
 * attribute on the element for an accessible landmark name — that's a
 * normal global attribute, no special wiring needed:
 *
 *   <lwtg-nav-menu aria-label="Main"> ... </lwtg-nav-menu>
 *
 * Theming: --lwt-nav-menu-gap (space between top-level items),
 * --lwt-nav-menu-z (stacking order for dropdowns/mobile panel),
 * --lwt-nav-hamburger-color. See lwt-gen-nav-item.js for the item/dropdown
 * variables shared with the mobile panel's own background/border/shadow.
 *
 * Requires lwt-core.js to be loaded first. Needs lwt-gen-nav-item.js to be
 * useful, but doesn't hard-depend on it to define its own element.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-nav-menu.js requires lwt-core.js to be loaded first.');
  }

  var TEMPLATE =
    '<div class="bar" part="bar">' +
    '  <button type="button" class="hamburger" part="hamburger" aria-label="Toggle menu" aria-expanded="false">' +
    '    <span class="hb-line" part="hamburger-line"></span>' +
    '    <span class="hb-line" part="hamburger-line"></span>' +
    '    <span class="hb-line" part="hamburger-line"></span>' +
    '  </button>' +
    '  <div class="panel" part="panel">' +
    '    <ul class="list" part="list"><slot></slot></ul>' +
    '  </div>' +
    '</div>';

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    ':host([hidden]) { display: none; }' +

    '.bar { display: flex; align-items: center; justify-content: space-between; background: transparent; position: relative; }' +
    ':where(:host([sticky]) .bar) { position: sticky; top: 0; z-index: var(--lwt-nav-menu-z, 100); }' +

    '.list { display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center; list-style: none;' +
    '  margin: 0; padding: 0; gap: var(--lwt-nav-menu-gap, 0.15rem); background: transparent; width: 100%; }' +
    ':where(:host([orientation="vertical"]) .list) { flex-direction: column; align-items: stretch; }' +

    '.panel { flex: 1; min-width: 0; overflow: visible; }' +

    '.hamburger { display: none; flex-direction: column; justify-content: center; align-items: center; gap: 5px;' +
    '  width: 2.25rem; height: 2.25rem; flex-shrink: 0; border: none; background: none; cursor: pointer;' +
    '  padding: 0; border-radius: 6px; }' +
    '.hamburger:hover { background: var(--lwt-nav-item-hover-bg, var(--lwt-color-surface-alt, rgba(0,0,0,0.05))); }' +
    '.hamburger:focus-visible { outline: 2px solid var(--lwt-nav-focus-color, var(--lwt-focus-ring, #2563eb)); outline-offset: 2px; }' +
    '.hb-line { display: block; width: 20px; height: 2px; border-radius: 2px;' +
    '  background: var(--lwt-nav-hamburger-color, var(--lwt-color-text, currentColor));' +
    '  transition: transform 160ms ease, opacity 160ms ease; }' +
    ':host([mobile]) .hamburger { display: inline-flex; }' +
    ':host([data-mobile-open]) .hb-line:nth-child(1) { transform: translateY(7px) rotate(45deg); }' +
    ':host([data-mobile-open]) .hb-line:nth-child(2) { opacity: 0; }' +
    ':host([data-mobile-open]) .hb-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }' +

    ':host([mobile]) .bar { flex-wrap: wrap; }' +
    ':host([mobile]) .panel { flex-basis: 100%; order: 2; }' +
    ':host([mobile]) .list { display: none; flex-direction: column; align-items: stretch;' +
    '  background: var(--lwt-nav-dropdown-bg, var(--lwt-color-surface, #fff));' +
    '  border: 1px solid var(--lwt-nav-dropdown-border, var(--lwt-color-border, #e5e7eb));' +
    '  border-radius: var(--lwt-nav-dropdown-radius, 8px);' +
    '  box-shadow: 0 10px 25px var(--lwt-nav-dropdown-shadow, var(--lwt-color-shadow, rgba(0,0,0,0.15)));' +
    '  padding: 0.5rem; margin-top: 0.5rem; }' +
    ':host([mobile][data-mobile-open]) .list { display: flex; }';

  class LWTNavMenu extends window.LWT.Element {
    static get observedAttributes() {
      return ['orientation', 'breakpoint'];
    }

    constructor() {
      super();
      this._mobile = false;
      this._mobileOpen = false;
      this._initialized = false;
      this._resizeObserver = null;

      this._handleHamburgerClick = this._handleHamburgerClick.bind(this);
      this._handleChildOpen = this._handleChildOpen.bind(this);
      this._handleSelect = this._handleSelect.bind(this);
      this._handleDocMousedown = this._handleDocMousedown.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
      this._handleResize = this._handleResize.bind(this);
    }

    connectedCallback() {
      super.connectedCallback(); // builds shadow via render()

      if (!this.hasAttribute('role')) this.setAttribute('role', 'navigation');

      this.addEventListener('lwt-navopen', this._handleChildOpen);
      this.addEventListener('lwt-select', this._handleSelect);
      this.addEventListener('keydown', this._handleKeydown);
      document.addEventListener('mousedown', this._handleDocMousedown);

      if (!this._initialized) {
        this._initialized = true;
        // Synchronous initial check so a narrow embed doesn't flash desktop
        // layout before the (async) ResizeObserver callback fires.
        this._applyMobileState(this._measureWidth() < this._breakpointPx());
        // Deferred re-sync: the parser fires our connectedCallback as
        // soon as the <lwtg-nav-menu> open tag is seen, BEFORE any child
        // <lwtg-nav-item>s have been appended. Re-propagate on the next
        // microtask so the initial orientation/mobile state actually
        // reaches every top-level item. Later child additions are picked
        // up by the mutation observer below.
        var self = this;
        Promise.resolve().then(function () {
          self._syncOrientation();
          self._propagateMobile();
        });
        if (typeof MutationObserver === 'function') {
          this._childObserver = new MutationObserver(function () {
            self._syncOrientation();
            self._propagateMobile();
          });
          this._childObserver.observe(this, { childList: true, subtree: true });
        }
      }

      if (typeof ResizeObserver === 'function') {
        this._resizeObserver = new ResizeObserver(this._handleResize);
        this._resizeObserver.observe(this);
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('lwt-navopen', this._handleChildOpen);
      this.removeEventListener('lwtf-select', this._handleSelect);
      this.removeEventListener('keydown', this._handleKeydown);
      document.removeEventListener('mousedown', this._handleDocMousedown);
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._childObserver) this._childObserver.disconnect();
    }

    // 'orientation'/'breakpoint' changes are handled entirely by directly
    // syncing child attributes / re-measuring below -- no shadow rebuild
    // needed (the menu's own layout reacts to the attribute purely via
    // CSS attribute selectors), matching lwt-gen-tabs.js's precedent of
    // overriding this without calling super or this.render().
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'orientation') this._syncOrientation();
      else if (name === 'breakpoint' && this._initialized) {
        this._applyMobileState(this._measureWidth() < this._breakpointPx());
      }
    }

    render() {
      this._renderShadow(TEMPLATE, CSS);
      this._hamburgerBtn = this._root.querySelector('.hamburger');
      this._panelEl = this._root.querySelector('.panel');
      this._listEl = this._root.querySelector('.list');
      this._hamburgerBtn.addEventListener('click', this._handleHamburgerClick);
      this._applyMobileOpenState();
    }

    closeAll() {
      this._directItemChildren().forEach(function (item) {
        if (typeof item.close === 'function') item.close();
      });
    }

    // ---- structure helpers ----

    _directItemChildren() {
      return Array.prototype.filter.call(this.children, function (c) {
        return c.tagName === 'LWT-NAV-ITEM';
      });
    }

    _syncOrientation() {
      var orientation = this._strAttr('orientation', 'horizontal');
      this._directItemChildren().forEach(function (item) {
        item.setAttribute('orientation', orientation);
      });
    }

    // ---- responsive breakpoint ----

    _measureWidth() {
      var rect = this.getBoundingClientRect();
      return rect.width || this.offsetWidth || 0;
    }

    _breakpointPx() {
      var v = parseFloat(this._strAttr('breakpoint', '880'));
      return isNaN(v) ? 880 : v;
    }

    _handleResize(entries) {
      var width = (entries && entries[0]) ? entries[0].contentRect.width : this._measureWidth();
      this._applyMobileState(width < this._breakpointPx());
    }

    _applyMobileState(isMobile) {
      if (this._mobile === isMobile) return;
      this._mobile = isMobile;
      this.toggleAttribute('mobile', isMobile);
      if (!isMobile) {
        // Leaving mobile: collapse the off-canvas panel and any open
        // dropdowns so re-entering mobile later starts from a clean state.
        this._mobileOpen = false;
        this._applyMobileOpenState();
        this.closeAll();
      }
      this._propagateMobile();
    }

    _propagateMobile() {
      var mobile = this._mobile;
      this.querySelectorAll('lwtg-nav-item').forEach(function (item) {
        item.toggleAttribute('mobile', mobile);
      });
    }

    // ---- mobile hamburger panel ----

    _handleHamburgerClick() {
      this._mobileOpen = !this._mobileOpen;
      this._applyMobileOpenState();
      if (!this._mobileOpen) this.closeAll();
    }

    _applyMobileOpenState() {
      if (!this._hamburgerBtn) return;
      this.toggleAttribute('data-mobile-open', this._mobileOpen);
      this._hamburgerBtn.setAttribute('aria-expanded', this._mobileOpen ? 'true' : 'false');
    }

    // ---- coordination ----

    _handleChildOpen(event) {
      if (!event.target || event.target.parentElement !== this) return;
      var opened = event.target;
      this._directItemChildren().forEach(function (item) {
        if (item !== opened && typeof item.close === 'function') item.close();
      });
    }

    _handleSelect() {
      // A leaf item was picked -- if we're showing the mobile off-canvas
      // panel, collapse it (common expectation: picking a link closes
      // the mobile nav rather than leaving it open behind the new page).
      if (this._mobile && this._mobileOpen) {
        this._mobileOpen = false;
        this._applyMobileOpenState();
        this.closeAll();
      }
    }

    _handleDocMousedown(event) {
      var path = event.composedPath ? event.composedPath() : [];
      if (path.indexOf(this) !== -1) return; // click was inside the menu
      this.closeAll();
      if (this._mobile && this._mobileOpen) {
        this._mobileOpen = false;
        this._applyMobileOpenState();
      }
    }

    _handleKeydown(event) {
      if (event.key !== 'Escape') return;
      this.closeAll();
      if (this._mobile && this._mobileOpen) {
        this._mobileOpen = false;
        this._applyMobileOpenState();
        if (this._hamburgerBtn) this._hamburgerBtn.focus();
      }
    }
  }

  window.LWT.define('lwtg-nav-menu', LWTNavMenu);
})();

/* ---- lwt-gen-pricing-table.js ---- */
/*!
 * <lwtg-pricing-table>
 * Responsive grid container for <lwtg-pricing-tier> columns.
 *
 *   <lwtg-pricing-table>
 *     <lwtg-pricing-tier>...</lwtg-pricing-tier>
 *     <lwtg-pricing-tier>...</lwtg-pricing-tier>
 *   </lwtg-pricing-table>
 *
 * Theming: --lwt-pricing-col-min (minimum column width before wrapping,
 * default 240px), --lwt-pricing-gap (default 1rem).
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-pricing-table.js requires lwt-core.js to be loaded first.');
  }

  var CSS =
    ':host {' +
    '  display: grid;' +
    '  grid-template-columns: repeat(auto-fit, minmax(var(--lwt-pricing-col-min, 240px), 1fr));' +
    '  align-items: stretch;' +
    '  gap: var(--lwt-pricing-gap, 1rem);' +
    '}';

  class LWTPricingTable extends window.LWT.Element {
    render() {
      this._renderShadow('<slot></slot>', CSS);
    }
  }

  window.LWT.define('lwtg-pricing-table', LWTPricingTable);
})();

/* ---- lwt-gen-pricing-tier.js ---- */
/*!
 * <lwtg-pricing-tier>
 * One column/card of a pricing table. Every piece of content is supplied
 * by the caller through slots — this component only provides the card
 * chrome, divider, "recommended" badge, and consistent typography hooks.
 *
 *   <lwtg-pricing-tier featured badge="Recommended">
 *     <h3>Premium</h3>
 *     <p>Align multiple teams</p>
 *
 *     <span slot="price">$14.54</span>
 *     <span slot="period">per user / month</span>
 *
 *     <lwtg-button slot="cta" variant="primary" label="Start free trial"></lwtg-button>
 *
 *     <li slot="features">Cross-team planning and dependency management</li>
 *     <li slot="features">Customizable approval processes</li>
 *   </lwtg-pricing-tier>
 *
 * Slots:
 *   (default) — name/description/any free-form header content
 *   price     — the large price text
 *   period    — small cadence text under the price (e.g. "per user / month")
 *   cta       — the action button
 *   features  — one element per included feature; use <li> so the
 *               rendered list (our shadow <ul> + your slotted <li>s) stays
 *               a real, accessible list rather than div soup
 *
 * Note on why features must each be their own slotted element rather than
 * one slotted <ul>: ::slotted() in shadow CSS can only match top-level
 * assigned nodes, not their descendants — so a <ul> you supply yourself
 * would render, but its <li> children couldn't be styled with the bullet
 * markers below. Slotting each <li> directly to a shadow-owned <ul> keeps
 * them individually styleable.
 *
 * Attributes: featured (boolean), badge (text, default "Recommended")
 * Events: none — wire your own slotted <lwtg-button slot="cta"> to
 * whatever "lwt-click" behavior you need.
 * Theming: --lwt-pricing-border, --lwt-pricing-bg, --lwt-pricing-muted,
 * --lwt-pricing-price-color, --lwt-pricing-accent, --lwt-pricing-featured-bg,
 * --lwt-pricing-featured-color, --lwt-pricing-featured-border.
 * Exposes parts: badge, header, price, divider, features.
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-pricing-tier.js requires lwt-core.js to be loaded first.');
  }

  var CSS =
    ':host {' +
    '  display: flex;' +
    '  flex-direction: column;' +
    '  box-sizing: border-box;' +
    '  border: 1px solid var(--lwt-pricing-border, var(--lwt-color-border, #e5e7eb));' +
    '  border-radius: 12px;' +
    '  background: var(--lwt-pricing-bg, var(--lwt-color-surface, #fff));' +
    '  overflow: hidden;' +
    '  font-family: inherit;' +
    '}' +
    ':host([featured]) {' +
    '  border-color: var(--lwt-pricing-featured-border, var(--lwt-color-text-strong, #111827));' +
    '  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);' +
    '}' +
    '.badge {' +
    '  display: none;' +
    '  background: var(--lwt-pricing-featured-bg, var(--lwt-color-text-strong, #111827));' +
    '  color: var(--lwt-pricing-featured-color, var(--lwt-color-bg, #fff));' +
    '  font-size: 0.72rem;' +
    '  font-weight: 700;' +
    '  letter-spacing: 0.06em;' +
    '  text-transform: uppercase;' +
    '  text-align: center;' +
    '  padding: 0.4rem 0;' +
    '}' +
    ':host([featured]) .badge { display: block; }' +
    '.header { padding: 1.5rem; }' +
    '.header ::slotted(h1), .header ::slotted(h2), .header ::slotted(h3) {' +
    '  margin: 0 0 0.4rem;' +
    '  font-size: 1.15rem;' +
    '}' +
    '.header ::slotted(p) {' +
    '  margin: 0 0 1.25rem;' +
    '  font-size: 0.88rem;' +
    '  color: var(--lwt-pricing-muted, var(--lwt-color-text-muted, #6b7280));' +
    '}' +
    '.price {' +
    '  margin: 0 0 1.25rem;' +
    '  font-size: 2rem;' +
    '  font-weight: 700;' +
    '  color: var(--lwt-pricing-price-color, var(--lwt-color-text-strong, #111827));' +
    '}' +
    '.period {' +
    '  display: block;' +
    '  font-size: 0.82rem;' +
    '  font-weight: 400;' +
    '  color: var(--lwt-pricing-muted, var(--lwt-color-text-muted, #6b7280));' +
    '  margin-top: 0.15rem;' +
    '}' +
    '.divider { border-top: 1px solid var(--lwt-pricing-border, var(--lwt-color-border, #e5e7eb)); }' +
    '.features {' +
    '  list-style: none;' +
    '  margin: 0;' +
    '  padding: 1.25rem 1.5rem;' +
    '  flex: 1;' +
    '  display: flex;' +
    '  flex-direction: column;' +
    '  gap: 0.6rem;' +
    '}' +
    '::slotted([slot="features"]) {' +
    '  display: flex;' +
    '  align-items: flex-start;' +
    '  gap: 0.5rem;' +
    '  font-size: 0.92rem;' +
    '  line-height: 1.4;' +
    '}' +
    '::slotted([slot="features"])::before {' +
    '  content: "\\203A";' +
    '  color: var(--lwt-pricing-accent, var(--lwt-color-text-muted, #6b7280));' +
    '  font-weight: 700;' +
    '  flex-shrink: 0;' +
    '}';

  class LWTPricingTier extends window.LWT.Element {
    static get observedAttributes() {
      return ['featured', 'badge'];
    }

    render() {
      this._renderShadow(
        '<div class="badge" part="badge"></div>' +
        '<div class="header" part="header">' +
        '<slot></slot>' +
        '<p class="price" part="price"><slot name="price"></slot><span class="period"><slot name="period"></slot></span></p>' +
        '<slot name="cta"></slot>' +
        '</div>' +
        '<div class="divider" part="divider"></div>' +
        '<ul class="features" part="features"><slot name="features"></slot></ul>',
        CSS
      );
      this._root.querySelector('.badge').textContent = this._strAttr('badge', 'Recommended');
    }
  }

  window.LWT.define('lwtg-pricing-tier', LWTPricingTier);
})();

/* ---- lwt-gen-qr.js ---- */
/*!
 * <lwtg-qr>
 * A QR code generator, encoded entirely client-side (no image service, no
 * external library) from a from-scratch implementation of the ISO/IEC
 * 18004 QR code spec: byte-mode encoding, Reed-Solomon error correction,
 * automatic version selection, and penalty-scored mask selection. Verified
 * by round-tripping generated codes through an independent decoder across
 * hundreds of versions/error-correction-levels/lengths during development.
 *
 *   <lwtg-qr src="https://example.com" size="220"></lwtg-qr>
 *
 *   <lwtg-qr src="https://example.com" size="220" level="H"
 *     color="#111827" background-color="#f9fafb"
 *     corner-color="#2563eb" radius="0.3"></lwtg-qr>
 *
 * Attributes:
 *   src               — required; the text to encode (URL, plain string,
 *                        anything). Encoded as UTF-8 byte-mode data, so any
 *                        text works, not just ASCII/URLs.
 *   size              — rendered width/height in px, square (default 200)
 *   level             — error correction level "L"|"M"(default)|"Q"|"H" —
 *                        higher levels tolerate more damage/obstruction
 *                        (e.g. a logo overlay) at the cost of a bigger code
 *                        for the same data
 *   background-color  — quiet zone + light module color (default #ffffff)
 *   color             — dark module color (default #000000)
 *   corner-color      — color for the three large finder-pattern squares
 *                        (the "eyes" in each corner), falls back to `color`
 *                        when unset
 *   radius            — corner roundness of each module, 0 (crisp squares,
 *                        default, safest for scan reliability) to 0.5
 *                        (fully circular dots)
 *   margin            — quiet-zone width in modules around the code
 *                        (default 4, the spec-recommended minimum)
 *
 * The version (i.e. the code's size/module count) is chosen automatically
 * — smallest version at the requested `level` that fits `src`. If `src` is
 * too long even at version 40 (the largest defined by the spec) for the
 * requested level, nothing is drawn and an `lwt-error` event fires instead;
 * try a lower `level` or shorter `src`.
 *
 * Events: lwt-render (detail: { version, size, level }) on every successful
 * draw. lwt-error (detail: { message }) when `src` doesn't fit.
 *
 * Theming: --lwt-qr-radius, --lwt-qr-bg, --lwt-qr-color,
 * --lwt-qr-corner-color as CSS custom-property fallbacks for the
 * corresponding attributes (attributes take priority when both are set).
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-qr.js requires lwt-core.js to be loaded first.');
  }

  // ---- Spec tables (ISO/IEC 18004) ----
  //
  // These are the standard's own published capacity/block/format/alignment
  // tables -- factual, spec-mandated numbers (every QR implementation
  // reproduces the same values), not anyone's original expression.

  // QR_BLOCK_TABLE[version-1][levelIndex 0=L,1=M,2=Q,3=H]
  //   = [eccCodewordsPerBlock, group1BlockCount, group1BlockSize, group2BlockCount, group2BlockSize]
  var QR_BLOCK_TABLE = [[[7,1,19,0,0],[10,1,16,0,0],[13,1,13,0,0],[17,1,9,0,0]],[[10,1,34,0,0],[16,1,28,0,0],[22,1,22,0,0],[28,1,16,0,0]],[[15,1,55,0,0],[26,1,44,0,0],[18,2,17,0,0],[22,2,13,0,0]],[[20,1,80,0,0],[18,2,32,0,0],[26,2,24,0,0],[16,4,9,0,0]],[[26,1,108,0,0],[24,2,43,0,0],[18,2,15,2,16],[22,2,11,2,12]],[[18,2,68,0,0],[16,4,27,0,0],[24,4,19,0,0],[28,4,15,0,0]],[[20,2,78,0,0],[18,4,31,0,0],[18,2,14,4,15],[26,4,13,1,14]],[[24,2,97,0,0],[22,2,38,2,39],[22,4,18,2,19],[26,4,14,2,15]],[[30,2,116,0,0],[22,3,36,2,37],[20,4,16,4,17],[24,4,12,4,13]],[[18,2,68,2,69],[26,4,43,1,44],[24,6,19,2,20],[28,6,15,2,16]],[[20,4,81,0,0],[30,1,50,4,51],[28,4,22,4,23],[24,3,12,8,13]],[[24,2,92,2,93],[22,6,36,2,37],[26,4,20,6,21],[28,7,14,4,15]],[[26,4,107,0,0],[22,8,37,1,38],[24,8,20,4,21],[22,12,11,4,12]],[[30,3,115,1,116],[24,4,40,5,41],[20,11,16,5,17],[24,11,12,5,13]],[[22,5,87,1,88],[24,5,41,5,42],[30,5,24,7,25],[24,11,12,7,13]],[[24,5,98,1,99],[28,7,45,3,46],[24,15,19,2,20],[30,3,15,13,16]],[[28,1,107,5,108],[28,10,46,1,47],[28,1,22,15,23],[28,2,14,17,15]],[[30,5,120,1,121],[26,9,43,4,44],[28,17,22,1,23],[28,2,14,19,15]],[[28,3,113,4,114],[26,3,44,11,45],[26,17,21,4,22],[26,9,13,16,14]],[[28,3,107,5,108],[26,3,41,13,42],[30,15,24,5,25],[28,15,15,10,16]],[[28,4,116,4,117],[26,17,42,0,0],[28,17,22,6,23],[30,19,16,6,17]],[[28,2,111,7,112],[28,17,46,0,0],[30,7,24,16,25],[24,34,13,0,0]],[[30,4,121,5,122],[28,4,47,14,48],[30,11,24,14,25],[30,16,15,14,16]],[[30,6,117,4,118],[28,6,45,14,46],[30,11,24,16,25],[30,30,16,2,17]],[[26,8,106,4,107],[28,8,47,13,48],[30,7,24,22,25],[30,22,15,13,16]],[[28,10,114,2,115],[28,19,46,4,47],[28,28,22,6,23],[30,33,16,4,17]],[[30,8,122,4,123],[28,22,45,3,46],[30,8,23,26,24],[30,12,15,28,16]],[[30,3,117,10,118],[28,3,45,23,46],[30,4,24,31,25],[30,11,15,31,16]],[[30,7,116,7,117],[28,21,45,7,46],[30,1,23,37,24],[30,19,15,26,16]],[[30,5,115,10,116],[28,19,47,10,48],[30,15,24,25,25],[30,23,15,25,16]],[[30,13,115,3,116],[28,2,46,29,47],[30,42,24,1,25],[30,23,15,28,16]],[[30,17,115,0,0],[28,10,46,23,47],[30,10,24,35,25],[30,19,15,35,16]],[[30,17,115,1,116],[28,14,46,21,47],[30,29,24,19,25],[30,11,15,46,16]],[[30,13,115,6,116],[28,14,46,23,47],[30,44,24,7,25],[30,59,16,1,17]],[[30,12,121,7,122],[28,12,47,26,48],[30,39,24,14,25],[30,22,15,41,16]],[[30,6,121,14,122],[28,6,47,34,48],[30,46,24,10,25],[30,2,15,64,16]],[[30,17,122,4,123],[28,29,46,14,47],[30,49,24,10,25],[30,24,15,46,16]],[[30,4,122,18,123],[28,13,46,32,47],[30,48,24,14,25],[30,42,15,32,16]],[[30,20,117,4,118],[28,40,47,7,48],[30,43,24,22,25],[30,10,15,67,16]],[[30,19,118,6,119],[28,18,47,31,48],[30,34,24,34,25],[30,20,15,61,16]]];

  // ALIGN_POSITIONS[version-1] = alignment-pattern center coordinates (both row & col)
  var ALIGN_POSITIONS = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]];

  // FORMAT_INFO[levelIndex][maskPattern] = literal 15-bit format string
  var FORMAT_INFO = [[30660,29427,32170,30877,26159,25368,27713,26998],[21522,20773,24188,23371,17913,16590,20375,19104],[13663,12392,16177,14854,9396,8579,11994,11245],[5769,5054,7399,6608,1890,597,3340,2107]];

  // VERSION_INFO[version-7] = literal 18-bit version string (versions 7-40)
  var VERSION_INFO = [31892,34236,39577,42195,48118,51042,55367,58893,63784,68472,70749,76311,79154,84390,87683,92361,96236,102084,102881,110507,110734,117786,119615,126325,127568,133589,136944,141498,145311,150283,152622,158308,161089,167017];

  var LEVELS = ['L', 'M', 'Q', 'H'];

  // ---- GF(256) tables for Reed-Solomon, primitive polynomial x^8+x^4+x^3+x^2+1 (0x11D) ----
  var GF_EXP = new Array(512);
  var GF_LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  // Reed-Solomon generator polynomial of given degree (highest degree
  // first, monic). Built by multiplying (x + 2^i) in for i = 0..degree-1.
  function rsGeneratorPoly(degree) {
    var coefs = [1];
    for (var i = 0; i < degree; i++) {
      var r = GF_EXP[i];
      var n = coefs.length - 1;
      var next = new Array(n + 2).fill(0);
      next[0] = coefs[0];
      for (var j = 1; j <= n; j++) next[j] = coefs[j] ^ gfMul(coefs[j - 1], r);
      next[n + 1] = gfMul(coefs[n], r);
      coefs = next;
    }
    return coefs;
  }

  function rsEncode(dataBytes, eccLen) {
    var gen = rsGeneratorPoly(eccLen);
    var res = new Array(eccLen).fill(0);
    for (var i = 0; i < dataBytes.length; i++) {
      var factor = dataBytes[i] ^ res[0];
      res.shift();
      res.push(0);
      for (var j = 0; j < eccLen; j++) res[j] ^= gfMul(gen[j + 1], factor);
    }
    return res;
  }

  function utf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(str));
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.codePointAt(i);
      if (code > 0xFFFF) i++;
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
      } else if (code < 0x10000) {
        bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
      } else {
        bytes.push(0xF0 | (code >> 18), 0x80 | ((code >> 12) & 0x3F), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
      }
    }
    return bytes;
  }

  function blockInfo(version, levelIdx) {
    var row = QR_BLOCK_TABLE[version - 1][levelIdx];
    return { ecc: row[0], g1cnt: row[1], g1size: row[2], g2cnt: row[3], g2size: row[4] };
  }

  function totalDataCodewords(version, levelIdx) {
    var b = blockInfo(version, levelIdx);
    return b.g1cnt * b.g1size + b.g2cnt * b.g2size;
  }

  function getNumRawDataModules(version) {
    var result = (16 * version + 128) * version + 64;
    if (version >= 2) {
      var numAlign = Math.floor(version / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (version >= 7) result -= 36;
    }
    return result;
  }

  function chooseVersion(byteLen, levelIdx) {
    for (var v = 1; v <= 40; v++) {
      var countBits = v < 10 ? 8 : 16;
      var headerBits = 4 + countBits;
      var capacityBits = totalDataCodewords(v, levelIdx) * 8;
      if (headerBits + byteLen * 8 <= capacityBits) return v;
    }
    return -1;
  }

  function appendBits(bitArr, val, len) {
    for (var i = len - 1; i >= 0; i--) bitArr.push((val >>> i) & 1);
  }

  function buildDataCodewords(bytes, version, levelIdx) {
    var bits = [];
    appendBits(bits, 4, 4); // byte-mode indicator
    var countBits = version < 10 ? 8 : 16;
    appendBits(bits, bytes.length, countBits);
    for (var i = 0; i < bytes.length; i++) appendBits(bits, bytes[i], 8);

    var capacityBits = totalDataCodewords(version, levelIdx) * 8;
    var termLen = Math.min(4, capacityBits - bits.length);
    for (i = 0; i < termLen; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    var padBytes = [0xEC, 0x11];
    var p = 0;
    while (bits.length < capacityBits) {
      appendBits(bits, padBytes[p % 2], 8);
      p++;
    }

    var codewords = [];
    for (i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      codewords.push(b);
    }
    return codewords;
  }

  function buildFinalBits(dataCodewords, version, levelIdx) {
    var info = blockInfo(version, levelIdx);
    var blocks = [], eccBlocks = [], pos = 0;
    [[info.g1cnt, info.g1size], [info.g2cnt, info.g2size]].forEach(function (g) {
      var count = g[0], size = g[1];
      for (var i = 0; i < count; i++) {
        var block = dataCodewords.slice(pos, pos + size);
        pos += size;
        blocks.push(block);
        eccBlocks.push(rsEncode(block, info.ecc));
      }
    });

    var maxDataLen = Math.max.apply(null, blocks.map(function (b) { return b.length; }));
    var result = [];
    for (var i = 0; i < maxDataLen; i++) {
      blocks.forEach(function (b) { if (i < b.length) result.push(b[i]); });
    }
    for (i = 0; i < info.ecc; i++) {
      eccBlocks.forEach(function (b) { result.push(b[i]); });
    }

    var bits = [];
    result.forEach(function (byte) { appendBits(bits, byte, 8); });
    var remainder = getNumRawDataModules(version) - bits.length;
    for (i = 0; i < remainder; i++) bits.push(0);
    return bits;
  }

  function newMatrix(size, fill) {
    var m = [];
    for (var r = 0; r < size; r++) m.push(new Array(size).fill(fill));
    return m;
  }

  function maskFn(m, r, c) {
    switch (m) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return (r * c) % 2 + (r * c) % 3 === 0;
      case 6: return ((r * c) % 2 + (r * c) % 3) % 2 === 0;
      default: return ((r + c) % 2 + (r * c) % 3) % 2 === 0;
    }
  }

  function penalty(m, size) {
    var total = 0, r, c;
    for (r = 0; r < size; r++) {
      var run = 1;
      for (c = 1; c < size; c++) {
        if (m[r][c] === m[r][c - 1]) run++;
        else { if (run >= 5) total += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) total += 3 + (run - 5);
    }
    for (c = 0; c < size; c++) {
      var run2 = 1;
      for (r = 1; r < size; r++) {
        if (m[r][c] === m[r - 1][c]) run2++;
        else { if (run2 >= 5) total += 3 + (run2 - 5); run2 = 1; }
      }
      if (run2 >= 5) total += 3 + (run2 - 5);
    }
    for (r = 0; r < size - 1; r++) {
      for (c = 0; c < size - 1; c++) {
        var v = m[r][c];
        if (m[r][c + 1] === v && m[r + 1][c] === v && m[r + 1][c + 1] === v) total += 3;
      }
    }
    var patt1 = [true, false, true, true, true, false, true, false, false, false, false];
    var patt2 = [false, false, false, false, true, false, true, true, true, false, true];
    function matchAt(arr, idx, patt) {
      for (var k = 0; k < patt.length; k++) if (arr[idx + k] !== patt[k]) return false;
      return true;
    }
    for (r = 0; r < size; r++) {
      for (c = 0; c <= size - 11; c++) {
        var rowArr = m[r];
        if (matchAt(rowArr, c, patt1) || matchAt(rowArr, c, patt2)) total += 40;
      }
    }
    for (c = 0; c < size; c++) {
      var colArr = [];
      for (r = 0; r < size; r++) colArr.push(m[r][c]);
      for (r = 0; r <= size - 11; r++) {
        if (matchAt(colArr, r, patt1) || matchAt(colArr, r, patt2)) total += 40;
      }
    }
    var darkCount = 0;
    for (r = 0; r < size; r++) for (c = 0; c < size; c++) if (m[r][c]) darkCount++;
    var percent = (darkCount * 100) / (size * size);
    var prevMultiple = Math.abs(Math.floor(percent / 5) * 5 - 50) / 5;
    var nextMultiple = Math.abs(Math.ceil(percent / 5) * 5 - 50) / 5;
    total += Math.min(prevMultiple, nextMultiple) * 10;
    return total;
  }

  function buildMatrix(version, levelIdx, finalBits) {
    var size = 17 + 4 * version;
    var dark = newMatrix(size, false);
    var isFn = newMatrix(size, false);
    var isFinder = newMatrix(size, false);

    function setFn(r, c, val, finder) {
      if (r < 0 || r >= size || c < 0 || c >= size) return;
      dark[r][c] = val;
      isFn[r][c] = true;
      if (finder) isFinder[r][c] = val;
    }

    function drawFinder(r0, c0) {
      for (var dr = -1; dr <= 7; dr++) {
        for (var dc = -1; dc <= 7; dc++) {
          var r = r0 + dr, c = c0 + dc;
          if (r < 0 || r >= size || c < 0 || c >= size) continue;
          var isBorder = dr === -1 || dr === 7 || dc === -1 || dc === 7;
          var isRing = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 && (dr === 0 || dr === 6 || dc === 0 || dc === 6);
          var isCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          setFn(r, c, !isBorder && (isRing || isCenter), true);
        }
      }
    }
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    for (var i = 8; i < size - 8; i++) {
      setFn(6, i, i % 2 === 0);
      setFn(i, 6, i % 2 === 0);
    }

    var positions = ALIGN_POSITIONS[version - 1];
    positions.forEach(function (r) {
      positions.forEach(function (c) {
        if ((r < 9 && c < 9) || (r < 9 && c > size - 9) || (r > size - 9 && c < 9)) return;
        for (var dr = -2; dr <= 2; dr++) {
          for (var dc = -2; dc <= 2; dc++) {
            var isRing = Math.max(Math.abs(dr), Math.abs(dc)) === 2;
            var isCenter = dr === 0 && dc === 0;
            setFn(r + dr, c + dc, isRing || isCenter);
          }
        }
      });
    });

    for (i = 0; i < 9; i++) {
      if (i !== 6) { setFn(8, i, false); setFn(i, 8, false); }
    }
    for (i = 0; i < 8; i++) {
      setFn(8, size - 1 - i, false);
      setFn(size - 1 - i, 8, false);
    }
    setFn(size - 8, 8, true);

    if (version >= 7) {
      for (var a = 0; a < 6; a++) {
        for (var b = 0; b < 3; b++) {
          setFn(a, size - 11 + b, false);
          setFn(size - 11 + b, a, false);
        }
      }
    }

    // ---- data placement: zigzag, two columns at a time from the
    // bottom-right, alternating scan direction, skipping the timing
    // column and any function module. ----
    var bitIndex = 0, upward = true;
    for (var col = size - 1; col >= 1; col -= 2) {
      if (col === 6) col--;
      for (var rowStep = 0; rowStep < size; rowStep++) {
        var row = upward ? size - 1 - rowStep : rowStep;
        for (var cOff = 0; cOff < 2; cOff++) {
          var c2 = col - cOff;
          if (isFn[row][c2]) continue;
          var bit = bitIndex < finalBits.length ? finalBits[bitIndex] : 0;
          dark[row][c2] = bit === 1;
          bitIndex++;
        }
      }
      upward = !upward;
    }

    // ---- try all 8 masks, keep the one with the lowest penalty score ----
    var bestMask = 0, bestPenalty = Infinity, bestMatrix = null;
    for (var mask = 0; mask <= 7; mask++) {
      var copy = dark.map(function (row) { return row.slice(); });
      for (var r2 = 0; r2 < size; r2++) {
        for (var c3 = 0; c3 < size; c3++) {
          if (!isFn[r2][c3] && maskFn(mask, r2, c3)) copy[r2][c3] = !copy[r2][c3];
        }
      }
      var pen = penalty(copy, size);
      if (pen < bestPenalty) { bestPenalty = pen; bestMask = mask; bestMatrix = copy; }
    }

    // ---- format info (two copies around the top-left finder + split
    // across the other two) and version info (versions 7+) ----
    var fmtBits = FORMAT_INFO[levelIdx][bestMask];
    function fmtBit(i) { return (fmtBits >>> (14 - i)) & 1; }
    for (i = 0; i <= 5; i++) bestMatrix[8][i] = fmtBit(i) === 1;
    bestMatrix[8][7] = fmtBit(6) === 1;
    bestMatrix[8][8] = fmtBit(7) === 1;
    bestMatrix[7][8] = fmtBit(8) === 1;
    for (i = 9; i <= 14; i++) bestMatrix[14 - i][8] = fmtBit(i) === 1;
    for (i = 0; i <= 6; i++) bestMatrix[size - 1 - i][8] = fmtBit(i) === 1;
    for (i = 7; i <= 14; i++) bestMatrix[8][size - 15 + i] = fmtBit(i) === 1;
    bestMatrix[size - 8][8] = true;

    if (version >= 7) {
      var verBits = VERSION_INFO[version - 7];
      function verBit(i) { return (verBits >>> i) & 1; }
      for (i = 0; i < 18; i++) {
        var vr = Math.floor(i / 3), vc = i % 3;
        bestMatrix[vr][size - 11 + vc] = verBit(i) === 1;
        bestMatrix[size - 11 + vc][vr] = verBit(i) === 1;
      }
    }

    return { size: size, matrix: bestMatrix, isFinder: isFinder };
  }

  function generateQr(text, levelChar) {
    var levelIdx = LEVELS.indexOf((levelChar || 'M').toUpperCase());
    if (levelIdx === -1) levelIdx = 1;
    var bytes = utf8Bytes(text);
    var version = chooseVersion(bytes.length, levelIdx);
    if (version === -1) return null;
    var dataCodewords = buildDataCodewords(bytes, version, levelIdx);
    var finalBits = buildFinalBits(dataCodewords, version, levelIdx);
    var result = buildMatrix(version, levelIdx, finalBits);
    result.version = version;
    result.level = LEVELS[levelIdx];
    return result;
  }

  // ---- the custom element itself ----

  function escapeXml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var CSS = ':host { display: inline-block; line-height: 0; }' +
    'svg { display: block; }';

  class LWTQr extends window.LWT.Element {
    static get observedAttributes() {
      return ['src', 'size', 'level', 'background-color', 'color', 'corner-color', 'radius', 'margin'];
    }

    render() {
      var src = this._strAttr('src', '');
      var size = parseFloat(this._strAttr('size', '200')) || 200;
      var level = this._strAttr('level', 'M');
      var bg = this._strAttr('background-color', '') || 'var(--lwt-qr-bg, var(--lwt-color-surface, #ffffff))';
      var color = this._strAttr('color', '') || 'var(--lwt-qr-color, var(--lwt-color-text-strong, #000000))';
      var cornerColor = this._strAttr('corner-color', '') || 'var(--lwt-qr-corner-color, ' + color + ')';
      var radius = parseFloat(this._strAttr('radius', '')) ;
      if (isNaN(radius)) radius = 0;
      radius = Math.max(0, Math.min(0.5, radius));
      var margin = parseInt(this._strAttr('margin', '4'), 10);
      if (isNaN(margin) || margin < 0) margin = 4;

      if (!src) {
        this._renderShadow('', CSS);
        return;
      }

      var result = generateQr(src, level);
      if (!result) {
        this._renderShadow('', CSS);
        this.emit('error', { message: 'Content is too long to encode at error-correction level ' + level.toUpperCase() + ', even at the largest QR version (40).' });
        return;
      }

      // Fills go through style="fill:...;" rather than a bare fill="..."
      // attribute -- inline style is where CSS var() reliably resolves;
      // a plain SVG presentation attribute is not guaranteed to.
      var n = result.size + margin * 2;
      var rects = '<rect x="0" y="0" width="' + n + '" height="' + n + '" style="fill: ' + escapeXml(bg) + ';"></rect>';
      for (var r = 0; r < result.size; r++) {
        for (var c = 0; c < result.size; c++) {
          if (!result.matrix[r][c]) continue;
          var fill = result.isFinder[r][c] ? cornerColor : color;
          rects += '<rect x="' + (c + margin) + '" y="' + (r + margin) + '" width="1" height="1"' +
            (radius > 0 ? ' rx="' + radius + '" ry="' + radius + '"' : '') +
            ' style="fill: ' + escapeXml(fill) + ';"></rect>';
        }
      }

      var svg = '<svg viewBox="0 0 ' + n + ' ' + n + '" width="' + size + '" height="' + size + '"' +
        ' role="img" aria-label="QR code for: ' + escapeXml(src) + '">' + rects + '</svg>';

      this._renderShadow(svg, CSS);
      this.emit('render', { version: result.version, size: result.size, level: result.level });
    }
  }

  window.LWT.define('lwtg-qr', LWTQr);
})();

/* ---- lwt-gen-rive.js ---- */
/*!
 * <lwtg-rive>
 * Wraps a Rive (https://rive.app) animation in a custom element. Loads the
 * Rive web runtime from unpkg automatically if it isn't already on the
 * page (checks for an existing <script> tag first, so it's safe to also
 * include the runtime yourself and this won't double-load it), then
 * constructs a `rive.Rive` instance targeting an internal <canvas>.
 *
 *   <lwtg-rive src="./media/site_hero.riv" state-machine="hero" autoplay
 *     style="width:600px; height:400px;"></lwtg-rive>
 *
 *   <script>
 *     var heroEl = document.querySelector('lwtg-rive');
 *     heroEl.onLoad = function (r, inputs) {
 *       var devTrigger = inputs.find(function (i) { return i.name === 'DevTrigger'; });
 *       // ... same shape as the raw rive.Rive({ onLoad }) callback you'd
 *       // write by hand, just wired up for you.
 *     };
 *   </script>
 *
 * Attributes:
 *   src           — path/URL to the .riv file (required)
 *   state-machine — state machine name to run. Comma-separate for more
 *                   than one (passed to Rive as an array); left off
 *                   entirely to just play the default/only artboard
 *                   animation with no state machine.
 *   artboard      — optional artboard name (defaults to the file's
 *                   default artboard when omitted)
 *   autoplay      — "true" (default) | "false". Present as a string
 *                   attribute rather than boolean presence so the default
 *                   can be true without needing the attribute written out.
 *   fit           — optional Rive Layout fit keyword, e.g. "Cover",
 *                   "Contain", "Fill", "FitWidth", "FitHeight", "None",
 *                   "ScaleDown" — must match a key on the runtime's
 *                   `rive.Fit` enum exactly.
 *   alignment     — optional Rive Layout alignment keyword, e.g. "Center",
 *                   "TopLeft" — must match a key on `rive.Alignment`.
 *                   Only used when `fit` is also set.
 *   width         — optional convenience CSS length for the host's width
 *                   (same as just setting it in a style attribute/sheet).
 *   height        — optional convenience CSS length for the host's height.
 *
 * Changing `src` (or state-machine/artboard/autoplay/fit/alignment) after
 * the element has already loaded tears down the previous Rive instance
 * (calls `.cleanup()`) and creates a fresh one — same as changing any
 * other lwt-* element's attributes re-renders it.
 *
 * Attaching JS to onLoad — two ways, use whichever fits:
 *   1. `el.onLoad = function (riveInstance, inputs) { ... }` — set this
 *      property any time (before or after the element connects/loads; if
 *      it's already loaded by the time you set it, it'll just be called
 *      on the next reload). `inputs` is a flat array of every state
 *      machine input across all state machines named in `state-machine`
 *      (i.e. what you'd otherwise get by manually calling
 *      `r.stateMachineInputs(name)` yourself and concatenating).
 *   2. `<lwtg-rive on-load="myGlobalFn">` — declarative alternative; calls
 *      `window.myGlobalFn(riveInstance, inputs)` once loaded, same args.
 * Either way, an `lwt-load` event also fires (bubbles/composed) with
 * `detail: { rive, inputs }`, for anyone who'd rather addEventListener
 * than set a property — same idiom as the rest of this library.
 *
 * Other events:
 *   lwt-error — fired if the runtime script fails to load, or Rive itself
 *               reports a load error. detail: { error }.
 *
 * Methods:
 *   .getInput(name) — convenience lookup: returns the state machine input
 *                     with this name (from the same flattened set passed
 *                     to onLoad), or null if not found / not loaded yet.
 *   .resize()       — manually calls the underlying instance's
 *                     resizeDrawingSurfaceToCanvas(); also called
 *                     automatically on load and whenever the host resizes
 *                     (via ResizeObserver, when available).
 *
 * Property: .rive — the live `rive.Rive` instance once loaded, else null.
 *
 * Sizing: the internal <canvas> fills the host at 100%/100%, so size the
 * *host* via CSS (width/height attributes are a shorthand for this) --
 * Rive reads the canvas's rendered size to pick its drawing-surface
 * resolution, same as if you'd built the `new rive.Rive({...})` call by
 * hand against a canvas you sized yourself.
 *
 * Requires lwt-core.js to be loaded first. Does NOT require the Rive
 * runtime script to be pre-loaded -- this element injects
 * https://unpkg.com/@rive-app/canvas itself the first time it's needed,
 * and every subsequent <lwtg-rive> on the page shares that single load.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-rive.js requires lwt-core.js to be loaded first.');
  }

  var RIVE_SRC = 'https://unpkg.com/@rive-app/canvas';
  var loaderPromise = null;

  // Shared across every <lwtg-rive> on the page -- only ever injects the
  // <script> tag once, and reuses one that was already there (whether we
  // added it or the page author did).
  function loadRiveRuntime() {
    if (window.rive && window.rive.Rive) return Promise.resolve(window.rive);
    if (loaderPromise) return loaderPromise;

    loaderPromise = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + RIVE_SRC + '"]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.rive); });
        existing.addEventListener('error', function () {
          reject(new Error('lwtg-rive: failed to load the Rive runtime script.'));
        });
        return;
      }
      var script = document.createElement('script');
      script.src = RIVE_SRC;
      script.async = true;
      script.addEventListener('load', function () { resolve(window.rive); });
      script.addEventListener('error', function () {
        reject(new Error('lwtg-rive: failed to load the Rive runtime script.'));
      });
      document.head.appendChild(script);
    });

    return loaderPromise;
  }

  function splitNames(value) {
    if (!value) return [];
    return value.indexOf(',') !== -1
      ? value.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
      : [value];
  }

  var CSS =
    ':host { display: block; position: relative; line-height: 0; }' +
    'canvas { display: block; width: 100%; height: 100%; }';

  var TEMPLATE = '<canvas part="canvas"></canvas>';

  class LWTRive extends window.LWT.Element {
    static get observedAttributes() {
      return ['src', 'state-machine', 'artboard', 'autoplay', 'fit', 'alignment', 'width', 'height'];
    }

    constructor() {
      super();
      this.rive = null;
      this._inputs = [];
      this._loadToken = 0;
      this._onResize = this._onResize.bind(this);
    }

    connectedCallback() {
      super.connectedCallback();
      if (typeof ResizeObserver === 'function') {
        this._resizeObserver = new ResizeObserver(this._onResize);
        this._resizeObserver.observe(this);
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._resizeObserver) this._resizeObserver.disconnect();
      this._teardown();
    }

    render() {
      this._renderShadow(TEMPLATE, CSS);
      this._canvas = this._root.querySelector('canvas');

      var width = this._strAttr('width', '');
      var height = this._strAttr('height', '');
      this.style.width = width || '';
      this.style.height = height || '';

      this._init();
    }

    _teardown() {
      this._loadToken++; // invalidates any in-flight load meant for the previous config
      this._inputs = [];
      if (this.rive && typeof this.rive.cleanup === 'function') {
        try { this.rive.cleanup(); } catch (e) { /* already torn down */ }
      }
      this.rive = null;
    }

    _init() {
      this._teardown();

      var src = this._strAttr('src', '');
      if (!src || !this._canvas) return;

      var token = this._loadToken;
      var self = this;

      loadRiveRuntime().then(function (riveNs) {
        // Stale if the element was reconfigured/removed while we were
        // waiting on the (possibly shared, possibly network) load.
        if (token !== self._loadToken || !self.isConnected) return;

        var opts = {
          src: src,
          canvas: self._canvas,
          autoplay: self._strAttr('autoplay', 'true') !== 'false',
          onLoad: function () {
            if (token !== self._loadToken) return; // superseded before this fired
            var instance = self.rive;
            if (instance && typeof instance.resizeDrawingSurfaceToCanvas === 'function') {
              instance.resizeDrawingSurfaceToCanvas();
            }
            self._inputs = self._collectInputs(instance);

            if (typeof self.onLoad === 'function') {
              try { self.onLoad(instance, self._inputs); } catch (e) { console.error(e); }
            }
            var onLoadFnName = self._strAttr('on-load', '');
            if (onLoadFnName && typeof window[onLoadFnName] === 'function') {
              try { window[onLoadFnName](instance, self._inputs); } catch (e) { console.error(e); }
            }
            self.emit('load', { rive: instance, inputs: self._inputs });
          },
          onLoadError: function (err) {
            self.emit('error', { error: err });
          }
        };

        var stateMachines = splitNames(self._strAttr('state-machine', ''));
        if (stateMachines.length === 1) opts.stateMachines = stateMachines[0];
        else if (stateMachines.length > 1) opts.stateMachines = stateMachines;

        var artboard = self._strAttr('artboard', '');
        if (artboard) opts.artboard = artboard;

        var fit = self._strAttr('fit', '');
        if (fit && riveNs.Layout && riveNs.Fit && riveNs.Fit[fit] !== undefined) {
          var alignmentName = self._strAttr('alignment', '');
          var layoutOpts = { fit: riveNs.Fit[fit] };
          if (alignmentName && riveNs.Alignment && riveNs.Alignment[alignmentName] !== undefined) {
            layoutOpts.alignment = riveNs.Alignment[alignmentName];
          }
          opts.layout = new riveNs.Layout(layoutOpts);
        }

        self.rive = new riveNs.Rive(opts);
      }).catch(function (err) {
        self.emit('error', { error: err });
      });
    }

    _collectInputs(instance) {
      if (!instance || typeof instance.stateMachineInputs !== 'function') return [];
      var names = splitNames(this._strAttr('state-machine', ''));
      var all = [];
      names.forEach(function (name) {
        var inputs = instance.stateMachineInputs(name) || [];
        all = all.concat(inputs);
      });
      return all;
    }

    _onResize() {
      if (this.rive && typeof this.rive.resizeDrawingSurfaceToCanvas === 'function') {
        this.rive.resizeDrawingSurfaceToCanvas();
      }
    }

    resize() {
      this._onResize();
    }

    getInput(name) {
      var found = this._inputs.filter(function (i) { return i.name === name; });
      return found.length ? found[0] : null;
    }
  }

  window.LWT.define('lwtg-rive', LWTRive);
})();

/* ---- lwt-gen-skill-bar.js ---- */
/*!
 * <lwtg-skill-bar>
 * One row: a label, a value, and a horizontal bar that fills to match —
 * for things like a "Technical Skills" list. No container element is
 * needed; each bar is fully independent, so just stack as many as you
 * want in your own page markup:
 *
 *   <lwtg-skill-bar label="Raster Editing: Adobe / Afinity" value="90"></lwtg-skill-bar>
 *   <lwtg-skill-bar label="CGI: Blender" value="20" color="#f59e0b"></lwtg-skill-bar>
 *
 * Multiple bars line up column-to-column like a table even though each
 * is a separate custom element with its own shadow DOM — that only
 * works because the label/value columns use fixed widths
 * (--lwt-skill-bar-label-width/-value-width) rather than sizing to
 * content. If your labels are longer or shorter than the ~220px
 * default, adjust that variable (e.g. on a wrapping <div> so it cascades
 * into every bar inside it) rather than expecting them to auto-align.
 *
 * The fill bar animates in (0 -> its value) the first time the element
 * scrolls into view, via IntersectionObserver — not on page load, so
 * bars further down a long page don't burn their one animation before
 * anyone's scrolled to them. Respects prefers-reduced-motion (shows the
 * final width immediately, no animation) and falls back the same way if
 * IntersectionObserver isn't available. Set `no-animate` to always skip
 * it outright. Changing `value` after the bar has already revealed
 * itself smoothly transitions to the new width, so this doubles as a
 * live/updating progress indicator, not just a one-time reveal.
 *
 * Attributes:
 *   label       — fallback text (overridden by richer content placed in
 *                 slot="label")
 *   value       — current amount; default max is 100 so this reads as a
 *                 plain percentage
 *   max         — defaults to 100; if you set something else, the
 *                 displayed text switches from "N%" to "N / max" instead
 *                 of showing a misleading percent sign
 *   color       — overrides the fill color for just this bar (a plain
 *                 CSS color value); omit it to use the shared
 *                 --lwt-skill-bar-fill-color theme variable
 *   hide-value  — boolean; hides the "N%" text, leaving just the label
 *                 and bar
 *   no-animate  — boolean; skip the scroll-triggered fill animation and
 *                 just render at full width immediately
 *
 * Property: .value (get/set number) — convenience accessor over the
 * `value` attribute.
 *
 * role="progressbar" with aria-valuenow/-min/-max/-valuetext lives on
 * the host element itself.
 *
 * Theming: --lwt-skill-bar-label-width (220px), --lwt-skill-bar-value-width
 * (44px), --lwt-skill-bar-height (10px), --lwt-skill-bar-track-color
 * (#e5e7eb), --lwt-skill-bar-fill-color (#8bc34a), --lwt-skill-bar-label-color,
 * --lwt-skill-bar-value-color.
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-dsh-skill-bar.js requires lwt-core.js to be loaded first.');
  }

  function escapeXml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    '.row { display: grid;' +
    '  grid-template-columns: var(--lwt-skill-bar-label-width, 220px) var(--lwt-skill-bar-value-width, 44px) 1fr;' +
    '  align-items: center; column-gap: 0.9rem; padding: 0.55rem 0; }' +
    '.row.hide-value { grid-template-columns: var(--lwt-skill-bar-label-width, 220px) 1fr; }' +
    '.label { font-size: 0.92rem; color: var(--lwt-skill-bar-label-color, var(--lwt-color-text, #2f4a6b)); overflow-wrap: anywhere; }' +
    '.value { font-size: 0.85rem; color: var(--lwt-skill-bar-value-color, var(--lwt-color-text, #374151)); }' +
    '.track { height: var(--lwt-skill-bar-height, 10px); border-radius: 999px;' +
    '  background: var(--lwt-skill-bar-track-color, var(--lwt-color-border, #e5e7eb)); overflow: hidden; }' +
    '.fill { height: 100%; border-radius: 999px; background: var(--lwt-skill-bar-fill-color, var(--lwt-color-success, #8bc34a));' +
    '  width: 0%; transition: width 900ms cubic-bezier(0.22, 1, 0.36, 1); }' +
    '@media (prefers-reduced-motion: reduce) { .fill { transition: none; } }';

  class LWTSkillBar extends window.LWT.Element {
    static get observedAttributes() {
      return ['label', 'value', 'max', 'color', 'hide-value'];
    }

    constructor() {
      super();
      this._initialized = false;
      this._revealed = false;
      this._targetPercent = 0;
      this._observer = null;
    }

    connectedCallback() {
      super.connectedCallback(); // triggers the first render(), which starts the fill at 0%

      if (!this._initialized) {
        this._initialized = true;
        var reduceMotion = typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (this._boolAttr('no-animate') || reduceMotion || typeof IntersectionObserver !== 'function') {
          this._reveal();
        } else {
          this._setupObserver();
        }
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._observer) this._observer.disconnect();
    }

    render() {
      var fallbackLabel = escapeXml(this._strAttr('label', ''));
      var value = parseFloat(this._strAttr('value', '0')) || 0;
      var max = parseFloat(this._strAttr('max', '100')) || 100;
      var rawPercent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
      var percent = Math.round(rawPercent * 100) / 100; // avoid float artifacts like 55.00000000000001
      var valueText = max === 100 ? (Math.round(value) + '%') : (value + ' / ' + max);
      var color = this._strAttr('color', '');
      var hideValue = this._boolAttr('hide-value');

      var html =
        '<div class="row' + (hideValue ? ' hide-value' : '') + '" part="row">' +
        '<div class="label" part="label"><slot name="label">' + fallbackLabel + '</slot></div>' +
        (hideValue ? '' : '<div class="value" part="value">' + escapeXml(valueText) + '</div>') +
        '<div class="track" part="track">' +
        '<div class="fill" part="fill"' + (color ? ' style="background:' + escapeXml(color) + '"' : '') + '></div>' +
        '</div>' +
        '</div>';

      this._renderShadow(html, CSS);

      this._fillEl = this._root.querySelector('.fill');
      this._targetPercent = percent;
      this._fillEl.style.width = (this._revealed ? percent : 0) + '%';

      this.setAttribute('role', 'progressbar');
      this.setAttribute('aria-valuenow', String(value));
      this.setAttribute('aria-valuemin', '0');
      this.setAttribute('aria-valuemax', String(max));
      this.setAttribute('aria-valuetext', valueText);
      if (fallbackLabel) this.setAttribute('aria-label', fallbackLabel);
    }

    get value() {
      return parseFloat(this._strAttr('value', '0')) || 0;
    }
    set value(v) {
      this.setAttribute('value', String(v));
    }

    _reveal() {
      if (this._revealed) return;
      this._revealed = true;
      if (this._fillEl) this._fillEl.style.width = this._targetPercent + '%';
    }

    _setupObserver() {
      var self = this;
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            self._reveal();
            observer.disconnect();
          }
        });
      }, { threshold: 0.3 });
      observer.observe(this);
      this._observer = observer;
    }
  }

  window.LWT.define('lwtg-skill-bar', LWTSkillBar);
})();

/* ---- lwt-gen-tab-panel.js ---- */
/*!
 * <lwtg-tab-panel>
 * The content body for one tab, meant to live inside <lwtg-tabs> with
 * `slot="panel"` and a `name` attribute matching an <lwtg-tab>'s `panel`.
 *
 *   <lwtg-tab-panel slot="panel" name="overview">
 *     <p>Any HTML goes here.</p>
 *   </lwtg-tab-panel>
 *
 * <lwtg-tabs> toggles the native `hidden` attribute on whichever panels
 * aren't currently selected — that's the entire visibility mechanism,
 * deliberately as simple as possible. Content is the default slot, so
 * it accepts arbitrary HTML, not just text.
 *
 * Attribute: name — required; matched against the active <lwtg-tab>'s
 * `panel` value by the container.
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-tab-panel.js requires lwt-core.js to be loaded first.');
  }

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    ':host([hidden]) { display: none; }';

  class LWTTabPanel extends window.LWT.Element {
    render() {
      this._renderShadow('<slot></slot>', CSS);

      var name = this._strAttr('name', '');
      this.setAttribute('role', 'tabpanel');
      this.setAttribute('tabindex', '0');
      if (name) {
        this.id = 'lwt-tabpanel-' + name;
        this.setAttribute('aria-labelledby', 'lwt-tab-' + name);
      }
    }
  }

  window.LWT.define('lwtg-tab-panel', LWTTabPanel);
})();

/* ---- lwt-gen-tab.js ---- */
/*!
 * <lwtg-tab>
 * A single clickable tab button, meant to live inside <lwtg-tabs> with
 * `slot="tab"` and a `panel` attribute matching an <lwtg-tab-panel>'s
 * `name`. See lwt-gen-tabs.js for the container that does the coordination.
 *
 *   <lwtg-tab slot="tab" panel="overview">Overview</lwtg-tab>
 *
 * Content is the default slot — any HTML, not just text (an icon next
 * to a label, a badge, whatever).
 *
 * Unlike most elements in this library, there's no inner shadow-DOM
 * button here — the HOST element itself is the focusable, clickable,
 * `role="tab"` target, with the shadow root only providing a <slot> and
 * visual styling via :host. That's deliberate: aria-controls/
 * aria-selected/tabindex need to live on whatever actually receives
 * focus, and ARIA id-references (aria-controls, aria-labelledby) don't
 * reliably cross shadow-DOM boundaries yet — putting an inner <button>
 * in the shadow tree would put the real interactive element one level
 * away from the ARIA attributes describing it.
 *
 * Attributes:
 *   panel     — required; matches the controlled <lwtg-tab-panel>'s `name`
 *   active    — reflects selection state; set by the container, not
 *               usually something you toggle directly (call
 *               lwtg-tabs's .selectTab()/.addTab({active:true}) instead)
 *   disabled  — boolean; blocks click/keyboard activation
 *   position  — "top"|"bottom"|"left"|"right"; synced automatically by
 *               the parent <lwtg-tabs> to match its own `position`, so
 *               the active-state indicator (underline/sidebar) is drawn
 *               on the correct edge. Not meant to be set by hand.
 *
 * Keyboard: Enter/Space activates; Arrow Left/Right/Up/Down move focus
 * to and activate the next/previous non-disabled sibling tab
 * (automatic-activation pattern, not the "focus without activating"
 * variant some ARIA tab implementations use).
 *
 * Event: lwtf-select (detail: { panel }) — <lwtg-tabs> listens for this;
 * you generally don't need to listen for it yourself.
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-tab.js requires lwt-core.js to be loaded first.');
  }

  var CSS =
    ':host { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1rem; cursor: pointer;' +
    '  font: inherit; font-size: 0.9rem; color: var(--lwt-tabs-tab-color, var(--lwt-color-text-muted, #6b7280)); white-space: nowrap;' +
    '  flex-shrink: 0; user-select: none; box-sizing: border-box; }' +
    // Position-driven border/margin wrapped in :where() so external
    // styling on the host (e.g. a responsive vertical→horizontal flip)
    // wins without !important.
    ':where(:host([position="top"]), :host(:not([position]))) { border-bottom: 2px solid transparent; margin-bottom: -1px; }' +
    ':where(:host([position="bottom"])) { border-top: 2px solid transparent; margin-top: -1px; }' +
    ':where(:host([position="left"])) { border-right: 2px solid transparent; margin-right: -1px; }' +
    ':where(:host([position="right"])) { border-left: 2px solid transparent; margin-left: -1px; }' +
    ':host([active]) { color: var(--lwt-tabs-active-color, var(--lwt-color-primary, #2563eb)); font-weight: 600; }' +
    ':host([active][position="top"]), :host([active]:not([position])) { border-bottom-color: var(--lwt-tabs-active-color, var(--lwt-color-primary, #2563eb)); }' +
    ':host([active][position="bottom"]) { border-top-color: var(--lwt-tabs-active-color, var(--lwt-color-primary, #2563eb)); }' +
    ':host([active][position="left"]) { border-right-color: var(--lwt-tabs-active-color, var(--lwt-color-primary, #2563eb)); }' +
    ':host([active][position="right"]) { border-left-color: var(--lwt-tabs-active-color, var(--lwt-color-primary, #2563eb)); }' +
    ':host([disabled]) { opacity: 0.45; cursor: not-allowed; pointer-events: none; }' +
    ':host(:focus-visible) { outline: 2px solid var(--lwt-tabs-focus-color, var(--lwt-focus-ring, #2563eb)); outline-offset: -2px; border-radius: 2px; }';

  class LWTTab extends window.LWT.Element {
    static get observedAttributes() {
      return ['active', 'disabled', 'position', 'panel'];
    }

    constructor() {
      super();
      this._handleClick = this._handleClick.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
    }

    connectedCallback() {
      super.connectedCallback();
      this.addEventListener('click', this._handleClick);
      this.addEventListener('keydown', this._handleKeydown);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('click', this._handleClick);
      this.removeEventListener('keydown', this._handleKeydown);
    }

    render() {
      this._renderShadow('<slot></slot>', CSS);

      var panelName = this._strAttr('panel', '');
      var disabled = this._boolAttr('disabled');

      this.setAttribute('role', 'tab');
      if (panelName) {
        this.id = 'lwt-tab-' + panelName;
        this.setAttribute('aria-controls', 'lwt-tabpanel-' + panelName);
      }
      this.setAttribute('aria-selected', this._boolAttr('active') ? 'true' : 'false');
      this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      this.tabIndex = disabled ? -1 : 0;
    }

    get active() { return this._boolAttr('active'); }
    set active(value) {
      if (value) this.setAttribute('active', '');
      else this.removeAttribute('active');
    }

    _handleClick() {
      if (this._boolAttr('disabled')) return;
      this.emit('select', { panel: this._strAttr('panel', '') });
    }

    _handleKeydown(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this._handleClick();
        return;
      }
      var horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
      var vertical = event.key === 'ArrowUp' || event.key === 'ArrowDown';
      if (!horizontal && !vertical) return;
      if (!this.parentElement) return;

      var tabs = Array.prototype.filter.call(
        this.parentElement.querySelectorAll('lwtg-tab'),
        function (t) { return !t.hasAttribute('disabled'); }
      );
      var idx = tabs.indexOf(this);
      if (idx === -1) return;
      var dir = (event.key === 'ArrowRight' || event.key === 'ArrowDown') ? 1 : -1;
      event.preventDefault();
      var next = tabs[(idx + dir + tabs.length) % tabs.length];
      if (next) {
        next.focus();
        next.click();
      }
    }
  }

  window.LWT.define('lwtg-tab', LWTTab);
})();

/* ---- lwt-gen-tabs.js ---- */
/*!
 * <lwtg-tabs>
 * Tab layout: a strip of <lwtg-tab> buttons on any one of the four sides,
 * surrounding a content area of <lwtg-tab-panel> bodies that switches to
 * match whichever tab is selected.
 *
 *   <lwtg-tabs position="left" style="height: 320px;">
 *     <lwtg-tab slot="tab" panel="overview">Overview</lwtg-tab>
 *     <lwtg-tab slot="tab" panel="settings">Settings</lwtg-tab>
 *     <lwtg-tab slot="tab" panel="billing" disabled>Billing</lwtg-tab>
 *
 *     <lwtg-tab-panel slot="panel" name="overview"><p>...</p></lwtg-tab-panel>
 *     <lwtg-tab-panel slot="panel" name="settings"><p>...</p></lwtg-tab-panel>
 *     <lwtg-tab-panel slot="panel" name="billing"><p>...</p></lwtg-tab-panel>
 *   </lwtg-tabs>
 *
 * Three-file composition (this file + lwt-gen-tab.js + lwt-gen-tab-panel.js),
 * matching each other by `panel`/`name` value rather than nesting a
 * tab's label and its body inside one element. That's a deliberate
 * choice, not just following the accordion precedent: a tab button and
 * its content body need to render in two different places in the
 * layout at once (bar vs. content area), and a single DOM node can only
 * exist in one place at a time — so they have to be two separate
 * elements from the start. <lwtg-tabs> itself never builds any tab/panel
 * markup other than what you (or .addTab()) put in its light DOM; the
 * shadow root here is just two named slots ("tab" and "panel") arranged
 * according to `position`, plus the CSS that makes the tab strip
 * scroll instead of wrap when it overflows.
 *
 * Attributes:
 *   position — "top" (default) | "bottom" | "left" | "right". Also
 *              synced automatically onto every child <lwtg-tab> so its
 *              active-state indicator lands on the correct edge.
 *   active   — optional; the `panel` name to select initially. Read
 *              once at connect (same reasoning as lwtg-modal's `open`)
 *              — falls back to the first tab if omitted. Use
 *              .selectTab() to change selection afterward.
 *
 * For left/right layouts, give the element a bounded height (e.g. via
 * `style="height: 320px"` or a CSS class) so the vertical tab strip has
 * something to scroll within — same as any other scrollable flex
 * layout, not a special requirement of this component.
 *
 * Methods:
 *   .selectTab(panelName)      — programmatically activate a tab
 *   .activePanel               — getter, currently active panel name
 *   .addTab({ panel, label, content, active, disabled }) — creates and
 *       appends a matching <lwtg-tab>/<lwtg-tab-panel> pair. `panel` is
 *       optional (auto-generated if omitted); `label`/`content` accept
 *       either a plain string or a DOM Node for rich markup. Returns
 *       { tab, panel, panelName }.
 *   .removeTab(panelName)      — removes both halves of a tab; if it
 *       was active, selects the next remaining tab (or clears
 *       selection if none are left).
 *
 * Event: lwt-change (detail: { panel }) — fired on selection change,
 * not fired for the initial/default selection at connect.
 *
 * Keyboard navigation (arrow keys between tabs, Enter/Space to
 * activate) lives on <lwtg-tab> itself — see lwt-gen-tab.js.
 *
 * Theming: --lwt-tabs-border, --lwt-tabs-tab-color, --lwt-tabs-active-color,
 * --lwt-tabs-focus-color, --lwt-tabs-bar-size (left/right strip width,
 * default 180px).
 *
 * Requires lwt-core.js to be loaded first. Needs lwt-gen-tab.js and
 * lwt-gen-tab-panel.js to be useful, but doesn't hard-depend on them to
 * define its own element.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-tabs.js requires lwt-core.js to be loaded first.');
  }

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    '.wrap { display: flex; height: 100%; }' +
    '.tab-bar { display: flex; gap: 0.15rem; flex-shrink: 0; scrollbar-width: thin; }' +
    '.panel-area { flex: 1; min-width: 0; min-height: 0; padding: 1rem 0.25rem; overflow: auto; }' +

    // Position-driven layout wrapped in :where() so any external CSS
    // targeting the same parts (e.g. ::part(tab-bar) at a breakpoint)
    // wins with no !important. See lwt-gen-grid-item.js for the pattern.
    ':where(:host([position="top"]) .wrap, :host(:not([position])) .wrap) { flex-direction: column; }' +
    ':where(:host([position="top"]) .tab-bar, :host(:not([position])) .tab-bar) {' +
    '  order: 0; flex-direction: row; overflow-x: auto; overflow-y: hidden;' +
    '  border-bottom: 1px solid var(--lwt-tabs-border, var(--lwt-color-border, #e5e7eb)); max-width: 100%; }' +
    ':where(:host([position="top"]) .panel-area, :host(:not([position])) .panel-area) { order: 1; }' +

    ':where(:host([position="bottom"]) .wrap) { flex-direction: column; }' +
    ':where(:host([position="bottom"]) .tab-bar) {' +
    '  order: 1; flex-direction: row; overflow-x: auto; overflow-y: hidden;' +
    '  border-top: 1px solid var(--lwt-tabs-border, var(--lwt-color-border, #e5e7eb)); max-width: 100%; }' +
    ':where(:host([position="bottom"]) .panel-area) { order: 0; }' +

    ':where(:host([position="left"]) .wrap) { flex-direction: row; }' +
    ':where(:host([position="left"]) .tab-bar) {' +
    '  order: 0; flex-direction: column; overflow-y: auto; overflow-x: hidden;' +
    '  border-right: 1px solid var(--lwt-tabs-border, var(--lwt-color-border, #e5e7eb));' +
    '  flex-basis: var(--lwt-tabs-bar-size, 180px); max-height: 100%; }' +
    ':where(:host([position="left"]) .panel-area) { order: 1; }' +

    ':where(:host([position="right"]) .wrap) { flex-direction: row; }' +
    ':where(:host([position="right"]) .tab-bar) {' +
    '  order: 1; flex-direction: column; overflow-y: auto; overflow-x: hidden;' +
    '  border-left: 1px solid var(--lwt-tabs-border, var(--lwt-color-border, #e5e7eb));' +
    '  flex-basis: var(--lwt-tabs-bar-size, 180px); max-height: 100%; }' +
    ':where(:host([position="right"]) .panel-area) { order: 0; }';

  var TEMPLATE =
    '<div class="wrap" part="wrap">' +
    '  <div class="tab-bar" part="tab-bar" role="tablist"><slot name="tab"></slot></div>' +
    '  <div class="panel-area" part="panel-area"><slot name="panel"></slot></div>' +
    '</div>';

  class LWTTabs extends window.LWT.Element {
    static get observedAttributes() {
      return ['position'];
    }

    constructor() {
      super();
      this._activePanel = null;
      this._autoId = 0;
      this._initialized = false;
      this._handleSelect = this._handleSelect.bind(this);
    }

    connectedCallback() {
      super.connectedCallback();
      this.addEventListener('lwt-select', this._handleSelect);

      if (!this._initialized) {
        this._initialized = true;
        this._syncTabPositions();
        var initial = this._strAttr('active', '') || this._firstTabPanel();
        if (initial) this.selectTab(initial, { silent: true });
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('lwtf-select', this._handleSelect);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'position') this._syncTabPositions();
    }

    render() {
      this._renderShadow(TEMPLATE, CSS);
    }

    _syncTabPositions() {
      var position = this._strAttr('position', 'top');
      this.querySelectorAll('lwtg-tab').forEach(function (tab) {
        tab.setAttribute('position', position);
      });
    }

    _firstTabPanel() {
      var first = this.querySelector('lwtg-tab');
      return first ? first.getAttribute('panel') : null;
    }

    _handleSelect(event) {
      this.selectTab(event.detail.panel);
    }

    get activePanel() {
      return this._activePanel;
    }

    selectTab(panelName, opts) {
      opts = opts || {};
      this._activePanel = panelName;

      this.querySelectorAll('lwtg-tab').forEach(function (tab) {
        tab.active = tab.getAttribute('panel') === panelName;
      });
      this.querySelectorAll('lwtg-tab-panel').forEach(function (panel) {
        panel.hidden = panel.getAttribute('name') !== panelName;
      });

      if (!opts.silent) this.emit('change', { panel: panelName });
    }

    addTab(options) {
      options = options || {};
      var panelName = options.panel || ('tab-' + (++this._autoId));

      var tab = this._genhtml({type: 'lwtg-tab', attr:{'slot':'tab', 'panel':panelName, 'position':this._strAttr('position', 'top')}});
      if (options.disabled) tab.setAttribute('disabled', '');
      if (options.label instanceof Node) tab.appendChild(options.label);
      else if (options.label !== undefined) tab.textContent = options.label;

      var panel = this._genhtml({type: 'lwtg-tab-panel', attr:{'slot':'panel', 'name':panelName}});
      if (options.content instanceof Node) panel.appendChild(options.content);
      else if (options.content !== undefined) panel.textContent = options.content;

      this.appendChild(tab);
      this.appendChild(panel);

      if (options.active || !this._activePanel) this.selectTab(panelName);

      return { tab: tab, panel: panel, panelName: panelName };
    }

    removeTab(panelName) {
      var tab = this.querySelector('lwtg-tab[panel="' + panelName + '"]');
      var panel = this.querySelector('lwtg-tab-panel[name="' + panelName + '"]');
      var wasActive = this._activePanel === panelName;

      if (tab) tab.remove();
      if (panel) panel.remove();

      if (wasActive) {
        var next = this.querySelector('lwtg-tab');
        if (next) this.selectTab(next.getAttribute('panel'));
        else this._activePanel = null;
      }
    }
  }

  window.LWT.define('lwtg-tabs', LWTTabs);
})();

/* ---- lwt-gen-toast.js ---- */
/*!
 * <lwtg-toast>
 * A transient, corner-stacked notification manager — the counterpart to
 * lwtg-alert's persistent inline banner. Place ONE of these somewhere in
 * your page (e.g. just before </body>); it renders nothing visible until
 * you call .show() on it, at which point it spawns a floating,
 * auto-dismissing notification card, stacked with any others already
 * showing.
 *
 *   <lwtg-toast position="top-right"></lwtg-toast>
 *   <script>
 *     document.querySelector('lwtg-toast').show({
 *       variant: 'success', title: 'Saved', message: 'Your changes have been saved.'
 *     });
 *   </script>
 *
 * You don't strictly need to place the element yourself — window.LWT.toast(...)
 * finds the first <lwtg-toast> in the document, or creates a default one
 * appended to <body> if none exists, then calls .show() on it. There's
 * also a shorthand per variant:
 *
 *   LWT.toast.success('Saved!');
 *   LWT.toast.error('Something went wrong.', { title: 'Error', duration: 6000 });
 *
 * `position` is read once when the element connects (same reasoning as
 * lwtg-modal's `open` attribute) — it is NOT a reactive attribute; this
 * element also declares no observedAttributes at all, since everything
 * about it is driven through .show()/.close()/.clear(), not attributes.
 * A toast card is plain DOM appended/removed directly, not a full
 * shadow-DOM rebuild, so rapid show/close calls don't fight each other.
 *
 * .show(options) returns an id string; options:
 *   variant   — "info" (default) | "success" | "warning" | "error"
 *   title     — optional bold heading
 *   message   — body text (plain text only — set via textContent, not HTML)
 *   duration  — ms before auto-dismiss (default 4000; 0 or less = stays
 *               until closed manually or via .close(id)/.clear())
 *
 * .close(id) removes one toast early. .clear() removes all of them.
 * Events (on the <lwtg-toast> element itself): lwt-show (detail: {id, variant}),
 * lwt-close (detail: {id, reason: 'timeout'|'dismiss'|'api'}).
 *
 * Known scope limits: entrance animation only, no exit transition (cards
 * are removed immediately rather than fading out first), message is
 * plain text (no rich/slotted content per card, unlike lwtg-alert).
 *
 * Theming: --lwt-toast-bg, --lwt-toast-success-color (#22c55e),
 * --lwt-toast-warning-color (#f59e0b), --lwt-toast-info-color (#3b82f6),
 * --lwt-toast-error-color (#ef4444), --lwt-toast-title-color,
 * --lwt-toast-text-color, --lwt-toast-gap (default 0.5rem),
 * --lwt-toast-offset (distance from the viewport edge, default 1rem).
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-toast.js requires lwt-core.js to be loaded first.');
  }

  var ICONS = {
    success: '<svg class="icon" viewBox="0 0 20 20"><circle class="icon-bg" cx="10" cy="10" r="10"></circle><path d="M6 10.5l2.5 2.5L14 7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
    warning: '<svg class="icon" viewBox="0 0 20 20"><path class="icon-bg" d="M10 1.5 L19.5 18.5 L0.5 18.5 Z"></path><line x1="10" y1="8" x2="10" y2="12.3" stroke="#fff" stroke-width="2" stroke-linecap="round"></line><circle cx="10" cy="15.3" r="1" fill="#fff"></circle></svg>',
    info: '<svg class="icon" viewBox="0 0 20 20"><circle class="icon-bg" cx="10" cy="10" r="10"></circle><circle cx="10" cy="6.5" r="1.2" fill="#fff"></circle><line x1="10" y1="9.5" x2="10" y2="15" stroke="#fff" stroke-width="2" stroke-linecap="round"></line></svg>',
    error: '<svg class="icon" viewBox="0 0 20 20"><circle class="icon-bg" cx="10" cy="10" r="10"></circle><line x1="7" y1="7" x2="13" y2="13" stroke="#fff" stroke-width="2" stroke-linecap="round"></line><line x1="13" y1="7" x2="7" y2="13" stroke="#fff" stroke-width="2" stroke-linecap="round"></line></svg>'
  };

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    '.toast-stack { position: fixed; z-index: 2147483000; display: flex; flex-direction: column; gap: var(--lwt-toast-gap, 0.5rem);' +
    '  pointer-events: none; max-width: min(90vw, 360px); }' +
    '.pos-top-right { top: var(--lwt-toast-offset, 1rem); right: var(--lwt-toast-offset, 1rem); }' +
    '.pos-top-left { top: var(--lwt-toast-offset, 1rem); left: var(--lwt-toast-offset, 1rem); }' +
    '.pos-bottom-right { bottom: var(--lwt-toast-offset, 1rem); right: var(--lwt-toast-offset, 1rem); flex-direction: column-reverse; }' +
    '.pos-bottom-left { bottom: var(--lwt-toast-offset, 1rem); left: var(--lwt-toast-offset, 1rem); flex-direction: column-reverse; }' +
    '.pos-top-center { top: var(--lwt-toast-offset, 1rem); left: 50%; transform: translateX(-50%); }' +
    '.pos-bottom-center { bottom: var(--lwt-toast-offset, 1rem); left: 50%; transform: translateX(-50%); flex-direction: column-reverse; }' +
    '.toast-card { pointer-events: auto; display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.8rem 0.9rem; border-radius: 10px;' +
    '  background: var(--lwt-toast-bg, var(--lwt-color-surface, #fff)); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1);' +
    '  border-left: 4px solid currentColor; animation: lwt-toast-in 180ms ease; }' +
    '.toast-card.variant-success { color: var(--lwt-toast-success-color, var(--lwt-color-success, #22c55e)); }' +
    '.toast-card.variant-warning { color: var(--lwt-toast-warning-color, var(--lwt-color-warning, #f59e0b)); }' +
    '.toast-card.variant-info { color: var(--lwt-toast-info-color, var(--lwt-color-info, #3b82f6)); }' +
    '.toast-card.variant-error { color: var(--lwt-toast-error-color, var(--lwt-color-danger, #ef4444)); }' +
    '.toast-icon-wrap { flex-shrink: 0; width: 20px; height: 20px; margin-top: 0.1rem; }' +
    '.icon-bg { fill: currentColor; }' +
    '.toast-content { flex: 1; min-width: 0; }' +
    '.toast-title { font-weight: 700; font-size: 0.9rem; color: var(--lwt-toast-title-color, var(--lwt-color-text-strong, #111827)); margin-bottom: 0.1rem; }' +
    '.toast-message { font-size: 0.86rem; color: var(--lwt-toast-text-color, var(--lwt-color-text, #374151)); word-wrap: break-word; }' +
    '.toast-close { flex-shrink: 0; border: none; background: none; cursor: pointer; font-size: 1.15rem; line-height: 1; color: inherit; opacity: 0.55; padding: 0; }' +
    '.toast-close:hover { opacity: 1; }' +
    '@keyframes lwt-toast-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }';

  class LWTToast extends window.LWT.Element {
    constructor() {
      super();
      this._nextId = 1;
    }

    connectedCallback() {
      super.connectedCallback();
      var position = this._strAttr('position', 'top-right');
      this._stack.className = 'toast-stack pos-' + position;
    }

    render() {
      this._renderShadow('<div class="toast-stack" part="stack"></div>', CSS);
      this._stack = this._root.querySelector('.toast-stack');
    }

    show(options) {
      options = options || {};
      var id = 'toast-' + (this._nextId++);
      var variant = ICONS[options.variant] ? options.variant : 'info';
      var duration = typeof options.duration === 'number' ? options.duration : 4000;
      var self = this;

      var contentChildren = [];
      if (options.title) contentChildren.push({ type: 'div', attr: { class: 'toast-title' }, text: options.title });
      contentChildren.push({ type: 'div', attr: { class: 'toast-message' }, text: options.message || '' });

      var card = this._genhtml({
        type: 'div',
        attr: { class: 'toast-card variant-' + variant, 'data-toast-id': id },
        children: [
          { type: 'div', attr: { class: 'toast-icon-wrap' }, html: ICONS[variant] },
          { type: 'div', attr: { class: 'toast-content' }, children: contentChildren },
          {
            type: 'button',
            attr: { type: 'button', class: 'toast-close', 'aria-label': 'Dismiss' },
            html: '&times;',
            events: { click: function () { self.close(id, 'dismiss'); } }
          }
        ]
      });

      this._stack.appendChild(card);
      this.emit('show', { id: id, variant: variant });

      if (duration > 0) {
        card._lwtTimer = setTimeout(function () { self.close(id, 'timeout'); }, duration);
      }

      return id;
    }

    close(id, reason) {
      var card = this._stack.querySelector('[data-toast-id="' + id + '"]');
      if (!card) return;
      if (card._lwtTimer) clearTimeout(card._lwtTimer);
      card.remove();
      this.emit('close', { id: id, reason: reason || 'api' });
    }

    clear() {
      var self = this;
      Array.prototype.slice.call(this._stack.children).forEach(function (card) {
        self.close(card.getAttribute('data-toast-id'), 'api');
      });
    }
  }

  window.LWT.define('lwtg-toast', LWTToast);

  // Zero-setup global helper: finds (or lazily creates) a <lwtg-toast> and
  // shows on it, so callers don't have to place the element themselves.
  window.LWT.toast = function (options) {
    var el = document.querySelector('lwtg-toast');
    if (!el) {
      // Plain function, not a class method -- there's no <lwtg-toast>
      // instance yet to call ._genhtml() on (that's exactly what we're
      // creating), so this one spot has to fall back to
      // document.createElement directly rather than the _genhtml
      // pattern used everywhere else in this file.
      el = document.createElement('lwtg-toast');
      document.body.appendChild(el);
    }
    return el.show(options);
  };

  ['success', 'warning', 'info', 'error'].forEach(function (variant) {
    window.LWT.toast[variant] = function (message, options) {
      var merged = {};
      for (var k in options) if (Object.prototype.hasOwnProperty.call(options, k)) merged[k] = options[k];
      merged.variant = variant;
      merged.message = message;
      return window.LWT.toast(merged);
    };
  });
})();

/* ---- lwt-gen-tree-item.js ---- */
/*!
 * <lwtg-tree-item>
 * A single node in a <lwtg-tree> — a branch (has nested <lwtg-tree-item>
 * children) or a leaf (has none). Nest items directly inside each other
 * to build the hierarchy; nested items go in the default slot, the
 * item's own label goes in the named "label" slot (or the plain
 * `label` attribute, if you don't need rich label markup):
 *
 *   <lwtg-tree checkable>
 *     <lwtg-tree-item label="Small" expanded checked>
 *       <lwtg-tree-item label="Newsletters" data-value="newsletters" checked></lwtg-tree-item>
 *       <lwtg-tree-item label="Promotions" expanded checked>
 *         <lwtg-tree-item label="Weekly deals" data-value="weekly-deals" checked></lwtg-tree-item>
 *         <lwtg-tree-item label="Seasonal sales" data-value="seasonal-sales" checked></lwtg-tree-item>
 *       </lwtg-tree-item>
 *     </lwtg-tree-item>
 *   </lwtg-tree>
 *
 * Whether checkboxes render at all is controlled by <lwtg-tree>'s
 * `checkable` attribute, which this item mirrors automatically (see
 * lwt-gen-tree.js) — you shouldn't need to set `checkable` here by hand.
 *
 * Checkbox mode (checkable): checking a branch checks every descendant
 * leaf and branch beneath it; checking/unchecking a leaf re-derives
 * every ancestor's state (fully checked, fully unchecked, or
 * indeterminate — the native tri-state checkbox dash — if only some
 * descendants are checked). A branch's own `checked` state is always
 * *derived* from its children, never authoritative on its own; only a
 * leaf's `checked` attribute is a real, independent value.
 *
 * Non-checkable mode: clicking (or Enter on) a row selects that single
 * item, highlighting it — coordinated by <lwtg-tree> so only one item is
 * selected at a time.
 *
 * Attributes:
 *   label      — fallback text for the tab-... er, tree row (overridden
 *                by richer content placed in slot="label")
 *   data-value — a leaf's return value; surfaced by <lwtg-tree>'s
 *                .getSelectedLeaves() as `value`
 *   expanded   — read once at connect for branches (same "read once,
 *                use the methods afterward" pattern as lwtg-modal's
 *                `open`); ignored on leaves
 *   checked    — read once at connect as ground truth for LEAVES only;
 *                on branches it's always recalculated from children, so
 *                setting it in markup on a branch has no lasting effect
 *   selected   — non-checkable mode only; managed by the parent <lwtg-tree>
 *   disabled   — boolean; blocks click/keyboard interaction on this row
 *                only (does not cascade to children)
 *   checkable  — synced automatically by the parent <lwtg-tree>; don't
 *                set by hand
 *
 * There's no expand/collapse animation here (unlike lwtg-accordion-item)
 * — a deliberate scope choice, since a deeply nested tree could have
 * many simultaneously-animating levels and the added complexity wasn't
 * worth it for what's usually a dense, information-first widget.
 *
 * Properties/methods:
 *   .checked (get/set), .selected (get/set), .isExpanded (get)
 *   .isLeaf (get) — true if this item has no <lwtg-tree-item> children
 *   .labelText (get) — resolved label text (slotted content or the
 *                      `label` attribute fallback)
 *   .expand() / .collapse() / .toggleExpand()
 *   .addItem({ label, value, expanded, checked, disabled }) — appends a
 *      new child <lwtg-tree-item> to this item and returns it; label/
 *      value accept a plain string, value also accepts a DOM Node for
 *      rich label markup
 *
 * Events (bubble, caught by the parent <lwtg-tree>, you don't normally
 * need to listen for these yourself): lwt-itemselect, lwt-itemcheck.
 * (Named to avoid colliding with lwtg-tab's own lwtf-select event, in
 * case a tree ever ends up nested inside a tab panel.)
 *
 * Theming: --lwt-tree-chevron-color, --lwt-tree-check-color,
 * --lwt-tree-label-color, --lwt-tree-selected-bg, --lwt-tree-selected-border,
 * --lwt-tree-guide-color, --lwt-tree-indent (default 1.25rem),
 * --lwt-tree-focus-color.
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-tree-item.js requires lwt-core.js to be loaded first.');
  }

  function escapeXml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Small factory shared conceptually with lwt-gen-tree.js's own .addItem(),
  // but duplicated rather than imported — every element file in this
  // library only depends on lwt-core.js, never on a sibling element file.
  //
  // Takes `owner` (whichever <lwtg-tree> or <lwtg-tree-item> instance is
  // calling it) so it can build nodes via owner._genhtml(...) — this
  // function itself has no `this` of its own to call it through, since
  // it's a plain function, not a class method.
  function createTreeItem(options, owner) {
    options = options || {};
    var attr = {};
    if (options.value !== undefined) attr['data-value'] = options.value;
    if (options.expanded) attr.expanded = '';
    if (options.checked) attr.checked = '';
    if (options.disabled) attr.disabled = '';
    if (!(options.label instanceof Node) && options.label !== undefined) attr.label = options.label;

    var item = owner._genhtml({ type: 'lwtg-tree-item', attr: attr });

    if (options.label instanceof Node) {
      var span = owner._genhtml({ type: 'span', attr: { slot: 'label' } });
      span.appendChild(options.label);
      item.appendChild(span);
    }
    return item;
  }

  var CSS =
    ':host { display: block; font-family: inherit; }' +
    '.row { display: flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.5rem; border-radius: 6px; cursor: pointer; }' +
    ':host([disabled]) .row { opacity: 0.45; cursor: not-allowed; pointer-events: none; }' +
    ':host(:focus-visible) { outline: none; }' +
    ':host(:focus-visible) .row { box-shadow: 0 0 0 2px var(--lwt-tree-focus-color, var(--lwt-focus-ring, #2563eb)); }' +
    '.toggle { width: 16px; height: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;' +
    '  color: var(--lwt-tree-chevron-color, var(--lwt-color-text-muted, #6b7280)); }' +
    '.toggle svg { width: 14px; height: 14px; transition: transform 150ms ease; }' +
    ':host([expanded]) .toggle svg { transform: rotate(90deg); }' +
    '.toggle.no-children { visibility: hidden; cursor: default; }' +
    '.check { flex-shrink: 0; width: 15px; height: 15px; margin: 0; cursor: pointer; accent-color: var(--lwt-tree-check-color, var(--lwt-color-primary, #2563eb)); }' +
    '.label { flex: 1; min-width: 0; font-size: 0.9rem; color: var(--lwt-tree-label-color, var(--lwt-color-text, #1f2937)); }' +
    ':host([selected]) .row { background: var(--lwt-tree-selected-bg, var(--lwt-color-primary-soft, #eff6ff));' +
    '  border-left: 3px solid var(--lwt-tree-selected-border, var(--lwt-color-primary, #2563eb)); padding-left: calc(0.5rem - 3px); }' +
    '.children { padding-left: var(--lwt-tree-indent, 1.25rem); margin-left: 0.55rem; border-left: 1px solid var(--lwt-tree-guide-color, var(--lwt-color-border, #e5e7eb)); }' +
    '.children[hidden] { display: none; }';

  var CHEVRON_SVG =
    '<svg viewBox="0 0 20 20"><path d="M7 4l6 6l-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  class LWTTreeItem extends window.LWT.Element {
    static get observedAttributes() {
      return ['checkable'];
    }

    constructor() {
      super();
      this._expanded = false;
      this._checked = false;
      this._indeterminate = false;
      this._selected = false;
      this._initialized = false;
      this._handleRowClick = this._handleRowClick.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
      this._handleCheckboxChange = this._handleCheckboxChange.bind(this);
    }

    connectedCallback() {
      super.connectedCallback(); // builds shadow via render()

      if (!this._initialized) {
        this._initialized = true;
        var hasChildren = !this.isLeaf;
        this._expanded = hasChildren && this.hasAttribute('expanded');
        this._selected = this.hasAttribute('selected');
        this._applyChecked(this.hasAttribute('checked'), false);
        this._syncVisualState();
      }

      this.addEventListener('click', this._handleRowClick);
      this.addEventListener('keydown', this._handleKeydown);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('click', this._handleRowClick);
      this.removeEventListener('keydown', this._handleKeydown);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'checkable') this.render();
    }

    render() {
      var checkable = this._boolAttr('checkable');
      var hasChildren = !this.isLeaf;
      var fallbackLabel = escapeXml(this._strAttr('label', ''));

      var html =
        '<div class="row" part="row">' +
        (hasChildren
          ? '<span class="toggle" part="toggle">' + CHEVRON_SVG + '</span>'
          : '<span class="toggle no-children" part="toggle"></span>') +
        (checkable ? '<input type="checkbox" class="check" part="checkbox" tabindex="-1">' : '') +
        '<span class="label" part="label"><slot name="label">' + fallbackLabel + '</slot></span>' +
        '</div>' +
        '<div class="children" part="children"><slot></slot></div>';

      this._renderShadow(html, CSS);

      this._toggleEl = hasChildren ? this._root.querySelector('.toggle') : null;
      this._checkboxEl = checkable ? this._root.querySelector('.check') : null;
      this._childrenEl = this._root.querySelector('.children');

      if (this._checkboxEl) this._checkboxEl.addEventListener('change', this._handleCheckboxChange);

      this.setAttribute('role', 'treeitem');
      this.setAttribute('aria-level', String(this._depth()));
      if (hasChildren) this.setAttribute('aria-expanded', this._expanded ? 'true' : 'false');
      else this.removeAttribute('aria-expanded');

      this._syncVisualState();
    }

    // Re-applies current in-memory state (_expanded/_checked/_indeterminate/
    // _selected) onto whatever the shadow DOM currently looks like. Safe to
    // call any time — used after both initial connect and every render().
    _syncVisualState() {
      var hasChildren = !this.isLeaf;
      if (this._childrenEl) this._childrenEl.hidden = !hasChildren || !this._expanded;
      if (this._checkboxEl) {
        this._checkboxEl.checked = this._checked;
        this._checkboxEl.indeterminate = this._indeterminate;
        this.setAttribute('aria-checked', this._indeterminate ? 'mixed' : (this._checked ? 'true' : 'false'));
      } else {
        this.removeAttribute('aria-checked');
      }
      if (this._selected) this.setAttribute('aria-selected', 'true');
      else this.setAttribute('aria-selected', 'false');
      this.tabIndex = this._boolAttr('disabled') ? -1 : 0;
    }

    get isLeaf() {
      return !Array.prototype.some.call(this.children, function (c) { return c.tagName === 'LWT-TREE-ITEM'; });
    }

    get isExpanded() {
      return this._expanded;
    }

    get labelText() {
      var slot = this._root && this._root.querySelector('slot[name="label"]');
      if (slot) {
        var assigned = slot.assignedNodes({ flatten: true });
        if (assigned.length) {
          return assigned.map(function (n) { return n.textContent; }).join('').trim();
        }
      }
      return this._strAttr('label', '');
    }

    get checked() {
      return this._checked;
    }
    set checked(value) {
      value = !!value;
      this._applyChecked(value, false);
      this._cascadeDown(value);
      this._cascadeUp();
      this.emit('itemcheck', {});
    }

    get selected() {
      return this._selected;
    }
    set selected(value) {
      this._selected = !!value;
      if (this._selected) this.setAttribute('selected', '');
      else this.removeAttribute('selected');
      this.setAttribute('aria-selected', this._selected ? 'true' : 'false');
    }

    expand() {
      if (this.isLeaf || this._expanded) return;
      this._expanded = true;
      this.setAttribute('expanded', '');
      this.setAttribute('aria-expanded', 'true');
      if (this._childrenEl) this._childrenEl.hidden = false;
    }

    collapse() {
      if (!this._expanded) return;
      this._expanded = false;
      this.removeAttribute('expanded');
      this.setAttribute('aria-expanded', 'false');
      if (this._childrenEl) this._childrenEl.hidden = true;
    }

    toggleExpand() {
      if (this._expanded) this.collapse();
      else this.expand();
    }

    addItem(options) {
      var wasLeaf = this.isLeaf;
      var child = createTreeItem(options, this);
      this.appendChild(child);
      if (wasLeaf) this.render();

      var tree = this._findTree();
      if (tree) {
        if (typeof tree._syncCheckable === 'function') tree._syncCheckable();
        if (typeof tree._recomputeChecked === 'function') tree._recomputeChecked();
      }
      return child;
    }

    _findTree() {
      var p = this.parentElement;
      while (p && p.tagName !== 'LWT-TREE') p = p.parentElement;
      return p;
    }

    _parentItem() {
      var p = this.parentElement;
      return (p && p.tagName === 'LWT-TREE-ITEM') ? p : null;
    }

    _depth() {
      var depth = 1;
      var p = this._parentItem();
      while (p) {
        depth++;
        p = p._parentItem();
      }
      return depth;
    }

    // Sets this item's own checked/indeterminate state and syncs the
    // visuals — no cascading. Used both by the public .checked setter
    // (which layers cascading on top) and internally during cascades.
    _applyChecked(checked, indeterminate) {
      this._checked = !!checked;
      this._indeterminate = !!indeterminate;
      if (this._checked) this.setAttribute('checked', '');
      else this.removeAttribute('checked');
      if (this._checkboxEl) {
        this._checkboxEl.checked = this._checked;
        this._checkboxEl.indeterminate = this._indeterminate;
        this.setAttribute('aria-checked', this._indeterminate ? 'mixed' : (this._checked ? 'true' : 'false'));
      }
    }

    _cascadeDown(value) {
      this.querySelectorAll('lwtg-tree-item').forEach(function (item) {
        item._applyChecked(value, false);
      });
    }

    _cascadeUp() {
      var parent = this._parentItem();
      if (!parent) return;
      var siblings = Array.prototype.filter.call(parent.children, function (c) { return c.tagName === 'LWT-TREE-ITEM'; });
      var allChecked = siblings.every(function (c) { return c._checked && !c._indeterminate; });
      var noneChecked = siblings.every(function (c) { return !c._checked && !c._indeterminate; });
      if (allChecked) parent._applyChecked(true, false);
      else if (noneChecked) parent._applyChecked(false, false);
      else parent._applyChecked(false, true);
      parent._cascadeUp();
    }

    // Bottom-up derivation pass: leaves trust their own `checked`
    // attribute; branches always recompute from their children. Used by
    // <lwtg-tree> once at connect (and after addItem) so markup-declared
    // state comes out consistent even if a branch's attribute disagrees
    // with what its children actually say.
    _recomputeSelf() {
      var childItems = Array.prototype.filter.call(this.children, function (c) { return c.tagName === 'LWT-TREE-ITEM'; });
      if (!childItems.length) {
        this._applyChecked(this.hasAttribute('checked'), false);
        return;
      }
      childItems.forEach(function (c) { c._recomputeSelf(); });
      var allChecked = childItems.every(function (c) { return c._checked && !c._indeterminate; });
      var noneChecked = childItems.every(function (c) { return !c._checked && !c._indeterminate; });
      if (allChecked) this._applyChecked(true, false);
      else if (noneChecked) this._applyChecked(false, false);
      else this._applyChecked(false, true);
    }

    _handleRowClick(event) {
      var originalTarget = event.composedPath()[0];

      // Native clicks are composed, so a click on a nested child item's
      // own shadow row bubbles all the way up through every ancestor
      // item's click listener too. Only react if the click actually
      // originated on this item itself: either a real click somewhere
      // inside this item's own shadow tree, or a direct, synthetic
      // .click() call made on this item's host (composedPath()[0] is
      // the host itself in that case, not a shadow-internal node).
      // Otherwise it belongs to a descendant item, which has already
      // handled it and stopped it from bubbling any further (below).
      var belongsToThisItem = originalTarget === this || (this._root && originalTarget.getRootNode() === this._root);
      if (!belongsToThisItem) return;

      event.stopPropagation();
      if (this._boolAttr('disabled')) return;

      if (this._toggleEl && (originalTarget === this._toggleEl || this._toggleEl.contains(originalTarget))) {
        this.toggleExpand();
        return;
      }
      if (originalTarget === this._checkboxEl) return; // native toggle + change listener already handles it

      if (this._boolAttr('checkable')) {
        if (this._checkboxEl) this._checkboxEl.click();
      } else {
        this.emit('itemselect', {});
      }
    }

    _handleCheckboxChange(event) {
      this.checked = event.target.checked;
    }

    _handleKeydown(event) {
      // Keydown bubbles through every ancestor item's own listener too;
      // only the item that's actually focused (the real target) should
      // react to Enter/Space. Arrow/Home/End are deliberately left alone
      // here (no branch below acts on them) so they keep bubbling up to
      // <lwtg-tree>, which owns cross-item navigation.
      if (event.target !== this) return;
      if (this._boolAttr('disabled')) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (this._boolAttr('checkable')) {
          if (this._checkboxEl) this._checkboxEl.click();
        } else {
          this.emit('itemselect', {});
        }
      }
    }
  }

  window.LWT.define('lwtg-tree-item', LWTTreeItem);
})();

/* ---- lwt-gen-tree.js ---- */
/*!
 * <lwtg-tree>
 * A hierarchical, expandable/collapsible list built from nested
 * <lwtg-tree-item> elements — see lwt-gen-tree-item.js for how a single node
 * works and for the full markup example. This file is purely the
 * coordinator: it toggles checkbox-mode on/off tree-wide, listens for
 * item selection/check events bubbling up, and derives correct
 * checked/indeterminate state for the whole tree once at connect.
 *
 *   <lwtg-tree checkable>
 *     <lwtg-tree-item label="Documents" expanded>
 *       <lwtg-tree-item label="Reports" data-value="reports"></lwtg-tree-item>
 *       <lwtg-tree-item label="Invoices" data-value="invoices" checked></lwtg-tree-item>
 *     </lwtg-tree-item>
 *   </lwtg-tree>
 *
 *   <lwtg-tree> <!-- no `checkable` = plain single-select tree -->
 *     <lwtg-tree-item label="Deciduous" expanded>
 *       <lwtg-tree-item label="Birch"></lwtg-tree-item>
 *       <lwtg-tree-item label="Maple"></lwtg-tree-item>
 *     </lwtg-tree-item>
 *     <lwtg-tree-item label="Coniferous" selected></lwtg-tree-item>
 *   </lwtg-tree>
 *
 * Attribute: checkable — boolean; toggles checkbox rendering + cascading
 * selection across every item in the tree. Synced onto every descendant
 * <lwtg-tree-item> automatically, both at connect and whenever it
 * changes, so items never need it set by hand.
 *
 * Methods:
 *   .addItem({ label, value, expanded, checked, disabled }, parentItem)
 *       — creates and appends a new <lwtg-tree-item>. Pass an existing
 *         <lwtg-tree-item> as parentItem to nest it under that node
 *         (i.e. add at that level); omit it to add at the root. You can
 *         also call .addItem() directly on any <lwtg-tree-item> to add a
 *         child to it specifically — both do the same thing. Returns
 *         the new item.
 *   .removeItem(item) — removes an item (and everything nested under
 *       it); recomputes cascading state for whatever remains.
 *   .getSelectedLeaves() — returns [{ label, value, element }] for every
 *       currently checked (checkable mode) or selected (plain mode)
 *       leaf — i.e. items with no children. `value` comes from the
 *       leaf's data-value attribute (null if not set).
 *
 * Event: lwt-change — fired whenever any check/selection state changes
 * anywhere in the tree.
 *
 * Keyboard: ArrowUp/Down move focus to the previous/next *visible* row
 * (collapsed branches' descendants are skipped); ArrowRight expands a
 * collapsed branch or moves into its first child if already expanded;
 * ArrowLeft collapses an expanded branch or moves to its parent;
 * Home/End jump to the first/last visible row. Enter/Space (handled on
 * the item itself) toggle the checkbox or select, matching a click.
 *
 * Theming lives on lwt-gen-tree-item.js (--lwt-tree-*), since this
 * container has essentially no visual chrome of its own.
 *
 * Requires lwt-core.js to be loaded first. Needs lwt-gen-tree-item.js to be
 * useful, but doesn't hard-depend on it to define its own element.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-tree.js requires lwt-core.js to be loaded first.');
  }

  // Duplicated from lwt-gen-tree-item.js on purpose — see that file's header
  // for why element files never depend on each other, only on lwt-core.js.
  //
  // Takes `owner` (whichever <lwtg-tree> or <lwtg-tree-item> instance is
  // calling it) so it can build nodes via owner._genhtml(...) — this
  // function itself has no `this` of its own to call it through, since
  // it's a plain function, not a class method.
  function createTreeItem(options, owner) {
    options = options || {};
    var attr = {};
    if (options.value !== undefined) attr['data-value'] = options.value;
    if (options.expanded) attr.expanded = '';
    if (options.checked) attr.checked = '';
    if (options.disabled) attr.disabled = '';
    if (!(options.label instanceof Node) && options.label !== undefined) attr.label = options.label;

    var item = owner._genhtml({ type: 'lwtg-tree-item', attr: attr });

    if (options.label instanceof Node) {
      var span = owner._genhtml({ type: 'span', attr: { slot: 'label' } });
      span.appendChild(options.label);
      item.appendChild(span);
    }
    return item;
  }

  var CSS = ':host { display: block; font-family: inherit; }';
  var TEMPLATE = '<div class="tree" part="tree" role="tree"><slot></slot></div>';

  var NAV_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

  class LWTTree extends window.LWT.Element {
    static get observedAttributes() {
      return ['checkable'];
    }

    constructor() {
      super();
      this._initialized = false;
      this._handleSelect = this._handleSelect.bind(this);
      this._handleCheckChange = this._handleCheckChange.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
    }

    connectedCallback() {
      super.connectedCallback();
      this.addEventListener('lwt-itemselect', this._handleSelect);
      this.addEventListener('lwt-itemcheck', this._handleCheckChange);
      this.addEventListener('keydown', this._handleKeydown);

      if (!this._initialized) {
        this._initialized = true;
        var self = this;
        // Deferred a tick so any <lwtg-tree-item> descendants that
        // haven't finished upgrading yet (e.g. this element's script
        // happened to run before theirs) are ready before we walk them.
        Promise.resolve().then(function () {
          self._syncCheckable();
          self._recomputeChecked();
        });
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener('lwt-itemselect', this._handleSelect);
      this.removeEventListener('lwt-itemcheck', this._handleCheckChange);
      this.removeEventListener('keydown', this._handleKeydown);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === 'checkable') this._syncCheckable();
    }

    render() {
      this._renderShadow(TEMPLATE, CSS);
    }

    _syncCheckable() {
      var checkable = this._boolAttr('checkable');
      this.querySelectorAll('lwtg-tree-item').forEach(function (item) {
        if (checkable) item.setAttribute('checkable', '');
        else item.removeAttribute('checkable');
      });
    }

    _recomputeChecked() {
      var roots = Array.prototype.filter.call(this.children, function (c) { return c.tagName === 'LWT-TREE-ITEM'; });
      roots.forEach(function (r) { r._recomputeSelf(); });
    }

    _handleSelect(event) {
      if (this._boolAttr('checkable')) return;
      var target = event.target;
      this.querySelectorAll('lwtg-tree-item').forEach(function (item) {
        item.selected = (item === target);
      });
      this.emit('change', {});
    }

    _handleCheckChange() {
      this.emit('change', {});
    }

    getSelectedLeaves() {
      var checkable = this._boolAttr('checkable');
      var results = [];
      this.querySelectorAll('lwtg-tree-item').forEach(function (item) {
        if (!item.isLeaf) return;
        var isSelected = checkable ? item.checked : item.selected;
        if (!isSelected) return;
        results.push({
          label: item.labelText,
          value: item.hasAttribute('data-value') ? item.getAttribute('data-value') : null,
          element: item
        });
      });
      return results;
    }

    addItem(options, parentItem) {
      var item = createTreeItem(options, this);
      if (parentItem && parentItem.tagName === 'LWT-TREE-ITEM') {
        var wasLeaf = parentItem.isLeaf;
        parentItem.appendChild(item);
        if (wasLeaf) parentItem.render();
      } else {
        this.appendChild(item);
      }
      this._syncCheckable();
      this._recomputeChecked();
      return item;
    }

    removeItem(item) {
      if (!item) return;
      var parent = (typeof item._parentItem === 'function') ? item._parentItem() : null;
      item.remove();
      if (parent) {
        if (parent.isLeaf) parent.render();
        parent._cascadeUp();
      } else {
        this._recomputeChecked();
      }
    }

    _visibleItems() {
      var all = Array.prototype.slice.call(this.querySelectorAll('lwtg-tree-item'));
      return all.filter(function (item) {
        var p = item._parentItem();
        while (p) {
          if (!p.isExpanded) return false;
          p = p._parentItem();
        }
        return true;
      });
    }

    _handleKeydown(event) {
      if (NAV_KEYS.indexOf(event.key) === -1) return;
      var current = event.target;
      if (!current || current.tagName !== 'LWT-TREE-ITEM') return;

      var visible = this._visibleItems();
      var idx = visible.indexOf(current);
      if (idx === -1) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        var next = visible[idx + 1];
        if (next) next.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        var prev = visible[idx - 1];
        if (prev) prev.focus();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (!current.isLeaf) {
          if (!current.isExpanded) {
            current.expand();
          } else {
            var firstChild = visible[idx + 1];
            if (firstChild && current.contains(firstChild)) firstChild.focus();
          }
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (!current.isLeaf && current.isExpanded) {
          current.collapse();
        } else {
          var parentItem = current._parentItem();
          if (parentItem) parentItem.focus();
        }
      } else if (event.key === 'Home') {
        event.preventDefault();
        if (visible[0]) visible[0].focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        if (visible[visible.length - 1]) visible[visible.length - 1].focus();
      }
    }
  }

  window.LWT.define('lwtg-tree', LWTTree);
})();

/* ---- lwt-gen-whitespace.js ---- */
/*!
 * <lwtg-whitespace>
 * A simple blank spacer for putting deliberate vertical (or horizontal)
 * gaps between elements, without reaching for margin hacks or empty
 * spacer <div>s.
 *
 *   <lwtg-whitespace height="2rem"></lwtg-whitespace>
 *   <lwtg-whitespace height="48"></lwtg-whitespace>   <!-- bare number -> px -->
 *   <lwtg-whitespace height="4rem" width="100%" axis="inline"></lwtg-whitespace>
 *
 * Attributes:
 *   height — any valid CSS length (e.g. "2rem", "48px", "10vh"). A bare
 *            number with no unit (e.g. "48") is treated as pixels.
 *            Defaults to "1rem".
 *   width  — optional CSS length for the inline dimension. Same bare-number
 *            -> px rule as height. Defaults to "auto" (block spacers don't
 *            usually need one; set it for inline/flex-row gaps).
 *   axis   — "block" (default) | "inline". "block" sizes by height (the
 *            common vertical-gap case, works for block/flex-column
 *            layouts). "inline" sizes by width instead, for use inside a
 *            flex row where you want a horizontal gap spacer.
 *
 * The element has no visible content — it's just an empty, non-collapsing
 * box sized to the requested gap. display is set directly so it works
 * without any shadow DOM CSS depending on host layout context.
 *
 * Theming: none needed — set height/width via attributes, not CSS custom
 * properties, since the whole point is a one-off explicit gap size.
 *
 * Requires lwt-core.js to be loaded first.
 */
(function () {
  'use strict';

  if (!window.LWT || !window.LWT.Element) {
    throw new Error('lwt-gen-whitespace.js requires lwt-core.js to be loaded first.');
  }

  function toLength(value, fallback) {
    if (value === null || value === undefined || value === '') return fallback;
    return /^-?[0-9]*\.?[0-9]+$/.test(value) ? value + 'px' : value;
  }

  class LWTWhitespace extends window.LWT.Element {
    static get observedAttributes() {
      return ['height', 'width', 'axis'];
    }

    render() {
      var axis = this._strAttr('axis', 'block');
      var height = toLength(this._strAttr('height', null), '1rem');
      var width = toLength(this._strAttr('width', null), 'auto');

      this.style.display = axis === 'inline' ? 'inline-block' : 'block';
      this.style.flexShrink = '0';
      this.style.height = axis === 'inline' ? '1px' : height;
      this.style.width = axis === 'inline' ? width : (this._strAttr('width', null) ? width : 'auto');

      // Keep it truly empty and out of the accessibility tree — this is
      // layout spacing, not content.
      this.setAttribute('aria-hidden', 'true');
    }
  }

  window.LWT.define('lwtg-whitespace', LWTWhitespace);
})();

