/*!
 * Pangloss Type — Static Self-Hosted Font Loader, Web Component & API SDK v2.0.0
 * 100% serverless browser SDK. Zero backend, zero worker functions. Routes strictly from your configured host.
 *
 * Declarative Auto-Load:
 *   <script src="https://your-site.com/pangloss-loader.js"
 *           data-host="https://your-site.com"
 *           data-path="/fonts"
 *           data-fonts="noto-sans-armenian,ghea-grapalat,fraunces"></script>
 *
 * Declarative Web Component:
 *   <pangloss-type font="noto-sans-armenian" weight="600" tracking="-0.01" dir="ltr">
 *     Հայկական տառարուեստ
 *   </pangloss-type>
 *
 * Runtime API:
 *   window.PanglossFonts.load(['noto-sans-armenian', 'fraunces'], { host, fontsPath })
 *   window.PanglossFonts.preload(['noto-sans-armenian'])
 *   window.PanglossFonts.forLanguage('hy', { autoLoad: true, limit: 5 })
 *   window.PanglossFonts.observeLazy('[data-pangloss-font]')
 *   window.PanglossFonts.queryCatalog({ script: 'armenian' })
 *   window.PanglossFonts.queryLanguages('armenian')
 *   window.PanglossFonts.applyParametricStyle('.hero-title', { family: 'Fraunces', weight: 650, width: 108, oblique: -6 })
 */
(function (global) {
  'use strict';

  var currentScript =
    document.currentScript ||
    Array.prototype.slice
      .call(document.getElementsByTagName('script'))
      .find(function (s) {
        return s.src && s.src.indexOf('pangloss-loader.js') !== -1;
      });

  function normalizeBase(url) {
    return (url || '').replace(/\/+$/, '');
  }

  function normalizePath(path) {
    if (!path) return '/fonts';
    var cleaned = path.replace(/\/+$/, '');
    return cleaned.charAt(0) === '/' ? cleaned : '/' + cleaned;
  }

  var inferredOrigin = '';
  if (currentScript && currentScript.src) {
    try {
      inferredOrigin = new URL(currentScript.src).origin;
    } catch (_) {
      inferredOrigin = '';
    }
  } else if (global.location && global.location.origin && global.location.origin !== 'null') {
    inferredOrigin = global.location.origin;
  }

  var config = {
    host: normalizeBase((currentScript && currentScript.getAttribute('data-host')) || inferredOrigin),
    fontsPath: normalizePath((currentScript && currentScript.getAttribute('data-path')) || '/fonts'),
  };

  function resolveCssUrl(fontId, opts) {
    var host = normalizeBase((opts && opts.host) !== undefined ? opts.host : config.host);
    var fpath = normalizePath((opts && opts.fontsPath) !== undefined ? opts.fontsPath : config.fontsPath);
    return host + fpath + '/' + fontId + '.css';
  }

  function load(fontIds, opts) {
    var list = Array.isArray(fontIds)
      ? fontIds
      : String(fontIds || '')
          .split(',')
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean);

    var loadedUrls = [];
    list.forEach(function (id) {
      var url = resolveCssUrl(id, opts);
      if (document.querySelector('link[data-pangloss-font="' + id + '"]')) {
        loadedUrls.push(url);
        return;
      }
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.setAttribute('data-pangloss-font', id);
      if (opts && opts.integrity) {
        link.integrity = opts.integrity;
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
      loadedUrls.push(url);
    });
    return loadedUrls;
  }

  function preload(fontIds, opts) {
    var urls = load(fontIds, opts);
    if ('caches' in global && urls.length > 0) {
      global.caches
        .open('pangloss-fonts-v2')
        .then(function (cache) {
          return Promise.all(
            urls.map(function (u) {
              return cache.add(u).catch(function () {});
            })
          );
        })
        .catch(function () {});
    }
    return urls;
  }

  function queryCatalog(filterOpts) {
    var host = normalizeBase((filterOpts && filterOpts.host) !== undefined ? filterOpts.host : config.host);
    return fetch(host + '/api/fonts.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (payload) {
        if (!filterOpts) return payload;
        var list = payload.fonts || [];
        if (filterOpts.script) {
          list = list.filter(function (f) {
            return f.scripts && f.scripts.indexOf(filterOpts.script) !== -1;
          });
        }
        if (filterOpts.isoScript) {
          list = list.filter(function (f) {
            return f.isoScripts && f.isoScripts.indexOf(filterOpts.isoScript) !== -1;
          });
        }
        if (filterOpts.category) {
          list = list.filter(function (f) {
            return f.category === filterOpts.category;
          });
        }
        if (filterOpts.search) {
          var q = String(filterOpts.search).toLowerCase();
          list = list.filter(function (f) {
            return f.name.toLowerCase().indexOf(q) !== -1 || f.id.indexOf(q) !== -1;
          });
        }
        return Object.assign({}, payload, { matchedCount: list.length, fonts: list });
      });
  }

  function queryLanguages(queryOrScript, opts) {
    var host = normalizeBase((opts && opts.host) !== undefined ? opts.host : config.host);
    return fetch(host + '/api/languages.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (payload) {
        if (!queryOrScript) return payload;
        var q = String(queryOrScript).toLowerCase();
        var langs = (payload.languages || []).filter(function (l) {
          return (
            l.id === q ||
            l.part1 === q ||
            (l.isoScript && l.isoScript.toLowerCase() === q) ||
            (l.appScript && l.appScript === q) ||
            (l.name && l.name.toLowerCase().indexOf(q) !== -1)
          );
        });
        return Object.assign({}, payload, { matchedCount: langs.length, languages: langs });
      });
  }

  function forLanguage(isoOrName, opts) {
    var options = opts || {};
    var limit = options.limit || 12;
    return queryLanguages(isoOrName, options).then(function (langResult) {
      var lang = (langResult.languages && langResult.languages[0]) || null;
      if (!lang) return { language: null, fonts: [] };
      return queryCatalog({ isoScript: lang.isoScript, host: options.host }).then(function (catResult) {
        var fonts = (catResult.fonts || []).slice(0, limit);
        if (options.autoLoad && fonts.length > 0) {
          load(
            fonts.map(function (f) {
              return f.id;
            }),
            options
          );
        }
        return { language: lang, matchedCount: catResult.matchedCount, fonts: fonts };
      });
    });
  }

  function observeLazy(selector, opts) {
    var targetSelector = selector || '[data-pangloss-font]';
    var elements = Array.prototype.slice.call(document.querySelectorAll(targetSelector));
    if (!('IntersectionObserver' in global)) {
      elements.forEach(function (el) {
        var f = el.getAttribute('data-pangloss-font');
        if (f) load(f, opts);
      });
      return null;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var fontId = entry.target.getAttribute('data-pangloss-font');
            if (fontId) load(fontId, opts);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' }
    );
    elements.forEach(function (el) {
      observer.observe(el);
    });
    return observer;
  }

  function applyParametricStyle(selectorOrEl, params) {
    var els =
      typeof selectorOrEl === 'string'
        ? Array.prototype.slice.call(document.querySelectorAll(selectorOrEl))
        : [selectorOrEl];
    var p = params || {};
    els.forEach(function (el) {
      if (!el || !el.style) return;
      if (p.family) el.style.fontFamily = '"' + p.family + '", sans-serif';
      if (p.weight !== undefined) el.style.fontWeight = String(p.weight);
      if (p.tracking !== undefined) el.style.letterSpacing = p.tracking + 'em';
      if (p.lineHeight !== undefined) el.style.lineHeight = String(p.lineHeight);
      var transforms = [];
      if (p.width !== undefined && p.width !== 100) {
        transforms.push('scaleX(' + (p.width / 100).toFixed(3) + ')');
      }
      if (p.oblique !== undefined && p.oblique !== 0) {
        transforms.push('skewX(' + p.oblique + 'deg)');
      }
      if (transforms.length > 0) {
        el.style.transform = transforms.join(' ');
        el.style.transformOrigin = 'left baseline';
      }
      if (p.features) {
        el.style.fontFeatureSettings = p.features;
      }
    });
  }

  // Register <pangloss-type> Custom Web Component
  if ('customElements' in global && !global.customElements.get('pangloss-type')) {
    var PanglossTypeElement = function () {
      return Reflect.construct(HTMLElement, [], PanglossTypeElement);
    };
    PanglossTypeElement.prototype = Object.create(HTMLElement.prototype);
    PanglossTypeElement.prototype.connectedCallback = function () {
      var fontId = this.getAttribute('font');
      var host = this.getAttribute('host');
      var fpath = this.getAttribute('path');
      var weight = this.getAttribute('weight');
      var tracking = this.getAttribute('tracking');
      var width = this.getAttribute('width');
      var oblique = this.getAttribute('oblique');
      var family = this.getAttribute('family');
      if (fontId) {
        load(fontId, {
          host: host !== null ? host : config.host,
          fontsPath: fpath !== null ? fpath : config.fontsPath,
        });
      }
      if (family) {
        this.style.fontFamily = '"' + family + '", sans-serif';
      }
      if (weight) this.style.fontWeight = weight;
      if (tracking) this.style.letterSpacing = tracking + 'em';
      var tf = [];
      if (width && Number(width) !== 100) tf.push('scaleX(' + (Number(width) / 100).toFixed(3) + ')');
      if (oblique && Number(oblique) !== 0) tf.push('skewX(' + oblique + 'deg)');
      if (tf.length > 0) {
        this.style.display = 'inline-block';
        this.style.transform = tf.join(' ');
      }
    };
    global.customElements.define('pangloss-type', PanglossTypeElement);
  }

  // Auto-load fonts declared in data-fonts attribute
  if (currentScript && currentScript.getAttribute('data-fonts')) {
    load(currentScript.getAttribute('data-fonts'));
  }

  global.PanglossFonts = {
    version: '2.0.0',
    config: config,
    load: load,
    preload: preload,
    observeLazy: observeLazy,
    resolveCssUrl: resolveCssUrl,
    queryCatalog: queryCatalog,
    queryLanguages: queryLanguages,
    forLanguage: forLanguage,
    applyParametricStyle: applyParametricStyle,
  };
})(window);
