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
