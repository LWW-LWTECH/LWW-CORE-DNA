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
