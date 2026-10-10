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
      this.iconurl = '/' + this.icon.join('/') + '.svg';
      this.width = this._root.host.getAttribute('width') || '24px'; 
      this.height = this._root.host.getAttribute('height') || '24px'; 
      this._root.innerHTML = await this.getIconSVG();
      this.style.display = 'inline-block';
      this.style.width = this.width;
      this.style.height = this.height;
    }

    async getIconSVG() {
      let geticon = '';
      geticon = this.iconurl ? await fetch(this.iconhost + this.iconurl).then(response => response.text()) : Promise.resolve('');
      if(geticon=='404: Not Found'){
        geticon = this.iconurl ? await fetch('/icons' + this.iconurl).then(response => response.text()) : Promise.resolve('');
        return geticon;
      }else{
        return geticon;
      }
    }

  }

  window.LWT.define('lwtg-icon', LWTIcon);
})();
