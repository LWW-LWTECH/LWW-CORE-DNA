/*!
 * LWT Element Library — core
 * Base class + registration helper for all lwt-* custom elements.
 *
 * No build step, no Node dependency. Works identically as:
 *   <script src="lwt-core.js"></script>
 *   <script type="module" src="lwt-core.js"></script>
 * because it contains no import/export statements — it just attaches
 * itself to a global `LWT` namespace on `window`.
 */
(function () {
  'use strict';

  var namespace = (window.LWT = window.LWT || {});

  // See the comment on emit() below: these event names also get fired
  // unprefixed (plain "change" alongside "lwt-change") so every element
  // is addEventListener-compatible with regular native form controls.
  var MIRRORED_NATIVE_EVENTS = { input: 1, change: 1, focus: 1, blur: 1 };

  class LWTElement extends HTMLElement {
    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this._upgradeProperties();
      this.render();
      if (typeof this.onConnect === 'function') this.onConnect();
    }

    disconnectedCallback() {
      if (typeof this.onDisconnect === 'function') this.onDisconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      this.render();
      if (typeof this.onAttributeChange === 'function') {
        this.onAttributeChange(name, oldValue, newValue);
      }
    }

    // If a property was set before the element was upgraded
    // (e.g. `el.disabled = true` before customElements.define ran),
    // re-apply it through the accessor so it isn't shadowed.
    _upgradeProperties() {
      var props = this.constructor.observedProps || [];
      var self = this;
      props.forEach(function (prop) {
        if (Object.prototype.hasOwnProperty.call(self, prop)) {
          var value = self[prop];
          delete self[prop];
          self[prop] = value;
        }
      });
    }

    // Renders `html` (+ optional `css`) into the shadow root, caching a
    // <template> per class+content so repeated renders just clone.
    _renderShadow(html, css) {
      var ctor = this.constructor;
      if (!ctor._template || ctor._templateHTML !== html || ctor._templateCSS !== css) {
        var template = this._genhtml({
          type: 'template',
        });
        ctor._template = template;
        ctor._templateHTML = html;
        ctor._templateCSS = css;
        template.innerHTML = css ? '<style>' + css + '</style>' + html : html;
      }
      this._root.innerHTML = '';
      this._root.appendChild(ctor._template.content.cloneNode(true));
    }

    // Presence-based boolean attribute (e.g. `disabled`, `open`).
    _boolAttr(name) {
      return this.hasAttribute(name);
    }

    // String attribute with fallback.
    _strAttr(name, fallback) {
      return this.hasAttribute(name) ? this.getAttribute(name) : fallback;
    }

    // Generate html dom elements
    _genhtml(set){
      let ele = document.createElement(set.type);
      ele.lwt = {};
      if(set.attr){
        for(let key in set.attr){
          ele.setAttribute(key, set.attr[key]);
        }
      }
      if(set.data){
        for(let key in set.data){
          ele.dataset[key] = set.data[key];
        }
      }
      if(set.odata){
        for(let key in set.odata){
          ele.lwt[key] = set.odata[key];
        }
      }
      set.text ? ele.textContent = set.text : false;
      if(set.html){
        if(typeof set.html=='string'){
          ele.innerHTML = set.html;
        }else if(typeof set.html=='object'){
          ele.appendChild(set.html);
        }
      }
      if(set.children){
        for(let i=0; i<set.children.length;i++){
          let child = this._genhtml(set.children[i]);
          ele.appendChild(child);
          set.children[i].key ? ele[set.children[i].key] = child : false;
        }
      }
      // EVENTS
      if(set.events){
        for(let key in set.events){
          ele.addEventListener(key, (e)=>{set.events[key](e)});
        }
      }
      return ele;
    }

    // Dispatches a namespaced, bubbling, composed CustomEvent: `lwt-<name>`.
    //
    // For the standard form-control event names (input/change/focus/blur)
    // this ALSO dispatches a second, plain-named event (e.g. "change"
    // alongside "lwt-change") so every element behaves like a regular
    // native <input> from the outside: `el.addEventListener('change', fn)`
    // just works, no "lwt-" prefix required. This exists because native
    // input/change/focus/blur events fired on an element *inside* a shadow
    // root don't bubble/compose back out to the host (that's exactly the
    // shadow-DOM limitation the "lwt-" events were invented to work
    // around) — so without this, `el.addEventListener('change', fn)` on
    // an <lwt-*> element would silently never fire. Both events carry the
    // same `detail`, and since every element with a `.value` getter
    // exposes it on the host itself, `e.target.value` works in the plain
    // listener too, same as a native input.
    emit(name, detail, options) {
      var opts = Object.assign({ bubbles: true, composed: true, detail: detail }, options);
      var event = new CustomEvent('lwt-' + name, opts);
      this.dispatchEvent(event);

      if (MIRRORED_NATIVE_EVENTS[name]) {
        this.dispatchEvent(new CustomEvent(name, opts));
      }
      return event;
    }

    render() {
      // Subclasses implement this.
    }
  }

  namespace.Element = LWTElement;

  // Registration helper — safe to call more than once (e.g. if a page
  // loads the same script twice).
  namespace.define = function define(tag, ElementClass) {
    if (!customElements.get(tag)) {
      customElements.define(tag, ElementClass);
    }
  };


  // Each entry: WAAPI keyframe array + a sensible default duration (ms).
  // "-in"/"-out" entries use fill:'forwards' so the end state persists;
  // the plain attention-seekers omit it so they cleanly return to
  // exactly how the element looked before playing.
  var ANIMATIONS = {
    'fade-in': { duration: 500, fill: 'forwards', frames: [{ opacity: 0 }, { opacity: 1 }] },
    'fade-out': { duration: 500, fill: 'forwards', frames: [{ opacity: 1 }, { opacity: 0 }] },
    'flash': { duration: 1000, frames: [{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }, { opacity: 0 }, { opacity: 1 }] },
    'bounce': {
      duration: 1000,
      frames: [
        { transform: 'translateY(0)', offset: 0 },
        { transform: 'translateY(0)', offset: 0.2 },
        { transform: 'translateY(-30%)', offset: 0.4 },
        { transform: 'translateY(0)', offset: 0.53 },
        { transform: 'translateY(-15%)', offset: 0.7 },
        { transform: 'translateY(0)', offset: 0.8 },
        { transform: 'translateY(-4%)', offset: 0.9 },
        { transform: 'translateY(0)', offset: 1 }
      ]
    },
    'bounce-in': {
      duration: 600, fill: 'forwards',
      frames: [
        { opacity: 0, transform: 'scale(0.3)', offset: 0 },
        { opacity: 1, transform: 'scale(1.05)', offset: 0.5 },
        { opacity: 1, transform: 'scale(0.9)', offset: 0.7 },
        { opacity: 1, transform: 'scale(1)', offset: 1 }
      ]
    },
    'bounce-out': {
      duration: 600, fill: 'forwards',
      frames: [
        { opacity: 1, transform: 'scale(1)', offset: 0 },
        { opacity: 1, transform: 'scale(1.05)', offset: 0.3 },
        { opacity: 0, transform: 'scale(0.3)', offset: 1 }
      ]
    },
    'flip': {
      duration: 800,
      frames: [
        { transform: 'perspective(400px) rotateY(0)', offset: 0 },
        { transform: 'perspective(400px) rotateY(180deg)', offset: 0.5 },
        { transform: 'perspective(400px) rotateY(360deg)', offset: 1 }
      ]
    },
    'flip-in': {
      duration: 600, fill: 'forwards',
      frames: [
        { opacity: 0, transform: 'perspective(400px) rotateX(90deg)' },
        { opacity: 1, transform: 'perspective(400px) rotateX(0deg)' }
      ]
    },
    'flip-out': {
      duration: 600, fill: 'forwards',
      frames: [
        { opacity: 1, transform: 'perspective(400px) rotateX(0deg)' },
        { opacity: 0, transform: 'perspective(400px) rotateX(90deg)' }
      ]
    },
    'rotate': { duration: 800, frames: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }] },
    'rotate-in': {
      duration: 600, fill: 'forwards',
      frames: [
        { opacity: 0, transform: 'rotate(-200deg) scale(0.5)' },
        { opacity: 1, transform: 'rotate(0deg) scale(1)' }
      ]
    },
    'rotate-out': {
      duration: 600, fill: 'forwards',
      frames: [
        { opacity: 1, transform: 'rotate(0deg) scale(1)' },
        { opacity: 0, transform: 'rotate(200deg) scale(0.5)' }
      ]
    },
    'zoom-in': { duration: 500, fill: 'forwards', frames: [{ opacity: 0, transform: 'scale(0.3)' }, { opacity: 1, transform: 'scale(1)' }] },
    'zoom-out': { duration: 500, fill: 'forwards', frames: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.3)' }] }
  };

  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Reads an element's data-lwt-* attributes into a plain options object.
  // Returns null if data-lwt-animate is missing or names an unknown type.
  function readOptions(el) {
    var type = el.dataset ? el.dataset.lwtAnimate : null;
    var config = type && ANIMATIONS[type];
    if (!config) return null;

    var rate = parseFloat(el.dataset.lwtRate);
    if (!(rate > 0)) rate = 1;
    var duration = parseFloat(el.dataset.lwtDuration);
    if (!(duration >= 0)) duration = config.duration;
    var delay = parseFloat(el.dataset.lwtDelay);
    if (!(delay >= 0)) delay = 0;

    return {
      type: type,
      config: config,
      trigger: el.dataset.lwtTrigger || 'load',
      easing: el.dataset.lwtEasing || 'ease',
      rate: rate,
      duration: duration,
      delay: delay,
      once: el.hasAttribute('data-lwt-once'),
      repeat: el.hasAttribute('data-lwt-repeat')
    };
  }

  // Plays one animation on `el` given a resolved options object (either
  // from readOptions() or built directly by the LWT.animate() JS API).
  function play(el, opts) {
    var reduced = prefersReducedMotion();
    var animation = el.animate(opts.config.frames, {
      duration: reduced ? 0 : opts.duration,
      easing: opts.easing,
      delay: reduced ? 0 : opts.delay,
      fill: opts.config.fill || 'none'
    });
    animation.playbackRate = opts.rate;

    el.dispatchEvent(new CustomEvent('lwt-animate-start', {
      bubbles: true, composed: true, detail: { type: opts.type, trigger: opts.trigger }
    }));
    animation.finished.then(function () {
      el.dispatchEvent(new CustomEvent('lwt-animate-end', {
        bubbles: true, composed: true, detail: { type: opts.type, trigger: opts.trigger }
      }));
    }, function () {
      // Swallow the AbortError WAAPI throws when an animation is
      // canceled/replaced mid-flight (e.g. rapid repeat triggers) --
      // that's expected, not a real error.
    });

    return animation;
  }

  // ---- trigger wiring ----

  var wired = typeof WeakSet === 'function' ? new WeakSet() : { has: function () { return false; }, add: function () {} };
  var sharedObserver = null;

  function ensureObserver() {
    if (sharedObserver !== null || typeof IntersectionObserver !== 'function') return sharedObserver;
    sharedObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var opts = readOptions(el);
        if (!opts) return;
        play(el, opts);
        if (!opts.repeat) sharedObserver.unobserve(el);
      });
    }, { threshold: 0.1 });
    return sharedObserver;
  }

  function wire(el) {
    if (!el || wired.has(el)) return;
    var opts = readOptions(el);
    if (!opts) return;
    wired.add(el);

    switch (opts.trigger) {
      case 'click':
        el.addEventListener('click', function () {
          var fresh = readOptions(el);
          if (fresh) play(el, fresh);
        }, opts.once ? { once: true } : false);
        break;

      case 'hover':
        el.addEventListener('mouseenter', function () {
          var fresh = readOptions(el);
          if (fresh) play(el, fresh);
        }, opts.once ? { once: true } : false);
        break;

      case 'lazy':
        var observer = ensureObserver();
        if (observer) observer.observe(el);
        else play(el, opts); // no IntersectionObserver support -> just play immediately
        break;

      case 'load':
      default:
        play(el, opts);
        break;
    }
  }

  function scan(root) {
    if (root.hasAttribute && root.hasAttribute('data-lwt-animate')) wire(root);
    if (root.querySelectorAll) {
      var nodes = root.querySelectorAll('[data-lwt-animate]');
      for (var i = 0; i < nodes.length; i++) wire(nodes[i]);
    }
  }

  function init() {
    scan(document);
    if (typeof MutationObserver === 'function' && document.body) {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return; // element nodes only
            scan(node);
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- public JS API ----

  namespace.animate = function (el, options) {
    options = options || {};
    var config = ANIMATIONS[options.type];
    if (!config) {
      throw new Error('LWT.animate: unknown animation type "' + options.type + '". See LWT.animate.types for valid names.');
    }
    return play(el, {
      type: options.type,
      config: config,
      trigger: 'manual',
      easing: options.easing || 'ease',
      rate: options.rate > 0 ? options.rate : 1,
      duration: options.duration >= 0 ? options.duration : config.duration,
      delay: options.delay >= 0 ? options.delay : 0
    });
  };

  namespace.animate.wire = wire;
  namespace.animate.refresh = function () { scan(document); };
  namespace.animate.types = Object.keys(ANIMATIONS);


})();
