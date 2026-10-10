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
