/**
 * ui.js - Renderizado e interacciones de ImportaYa.
 * Mejoras: cotizacion inline, localStorage, botones qty, animacion total,
 *          estado vacio, boton limpiar.
 */

const UI = (() => {

  // ---- Labels dolar ----
  const DOLAR_LABELS = {
    tarjeta: { label: 'Tarjeta',   emoji: '\uD83D\uDCB3' },
    blue:    { label: 'Blue',      emoji: '\uD83D\uDD35' },
    oficial: { label: 'Oficial',   emoji: '\uD83C\uDFE6' },
    mep:     { label: 'MEP',       emoji: '\uD83D\uDCC8' },
    ccl:     { label: 'CCL',       emoji: '\uD83C\uDF10' },
    cripto:  { label: 'Cripto',    emoji: '\u26A1'       },
    custom:  { label: 'Manual',    emoji: '\u270F\uFE0F' },
  };

  // ---- Persistencia localStorage ----

  const LS_KEY = 'importaya_state';

  function saveToStorage() {
    try {
      var monedaInput = State.get('monedaInput');
      var precioEl    = document.getElementById('precio-' + monedaInput);
      var envioEl     = document.getElementById('envio');
      var cantEl      = document.getElementById('cantidad');
      var linkEl      = document.getElementById('linkProducto');
      var customEl    = document.getElementById('customDolarInline');
      var data = {
        pais:             State.get('pais'),
        tienda:           State.get('tienda'),
        banco:            State.get('banco'),
        dolarSeleccionado:State.get('dolarSeleccionado'),
        monedaInput:      monedaInput,
        precio:           precioEl   ? precioEl.value   : '',
        envio:            envioEl    ? envioEl.value     : '0',
        cantidad:         cantEl     ? cantEl.value      : '1',
        link:             linkEl     ? linkEl.value      : '',
        customDolar:      customEl   ? customEl.value    : '',
      };
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch(e) { /* sin soporte */ }
  }

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  }

  function applyStoredState(saved) {
    if (!saved) return;
    if (saved.pais)    State.set('pais', saved.pais);
    if (saved.tienda)  State.set('tienda', saved.tienda);
    if (saved.banco)   State.set('banco', saved.banco);
    if (saved.dolarSeleccionado) State.set('dolarSeleccionado', saved.dolarSeleccionado);
    if (saved.monedaInput)       State.set('monedaInput', saved.monedaInput);
    if (saved.cantidad) State.set('cantidad', parseInt(saved.cantidad, 10) || 1);
  }

  function applyStoredDOM(saved) {
    if (!saved) return;
    var paisEl = document.getElementById('pais');
    if (paisEl && saved.pais) {
      paisEl.value = saved.pais;
      var arSect = document.getElementById('arSection');
      if (arSect) arSect.hidden = saved.pais !== 'AR';
      var arCalc = document.getElementById('arSection-calc');
      if (arCalc) arCalc.hidden = saved.pais !== 'AR';
      var moEl = document.getElementById('monedaLocal');
      var cfg  = CONFIG.paises[saved.pais];
      if (moEl && cfg) moEl.value = cfg.moneda + ' \u2014 ' + cfg.monedaNombre;
    }
    var envioEl = document.getElementById('envio');
    if (envioEl && saved.envio !== undefined) envioEl.value = saved.envio;

    var cantEl = document.getElementById('cantidad');
    var cantVal = document.getElementById('cantVal');
    var qty = parseInt(saved.cantidad, 10) || 1;
    if (cantEl)  cantEl.value       = qty;
    if (cantVal) cantVal.textContent = qty;

    var linkEl = document.getElementById('linkProducto');
    if (linkEl && saved.link) linkEl.value = saved.link;

    // restaurar precio en la tab correcta
    if (saved.monedaInput && saved.precio) {
      var precioEl = document.getElementById('precio-' + saved.monedaInput);
      if (precioEl) precioEl.value = saved.precio;
    }

    // restaurar custom dolar inline
    if (saved.customDolar) {
      var ciEl = document.getElementById('customDolarInline');
      if (ciEl) ciEl.value = saved.customDolar;
      // sincronizar con el campo de cotizaciones
      var cEl = document.getElementById('customDolar');
      if (cEl) cEl.value = saved.customDolar;
    }
  }

  // ---- Animacion del total ----

  var _lastTotal = null;

  function animateTotal(newText) {
    var el = document.getElementById('totalPesos');
    if (!el) return;
    if (newText === _lastTotal) { el.textContent = newText; return; }
    _lastTotal = newText;
    el.classList.remove('total-animate');
    void el.offsetWidth; // reflow para reiniciar animacion
    el.textContent = newText;
    el.classList.add('total-animate');
  }

  // ---- Estado vacio ----

  function setResultVisible(visible) {
    var empty   = document.getElementById('emptyState');
    var content = document.getElementById('resultContent');
    if (empty)   empty.style.display   = visible ? 'none'  : 'flex';
    if (content) content.style.display = visible ? 'block' : 'none';
  }

  // ---- Dolar strip principal (vista Cotizaciones) ----

  function renderDolarStrip() {
    var strip = document.getElementById('dolarStrip');
    if (!strip) return;

    var pais      = State.get('pais');
    var titleEl   = document.getElementById('dolar-title');
    var customRow = document.getElementById('customDolarRow');
    var noteEl    = document.getElementById('ratesNote');

    if (pais === 'AR') {
      if (titleEl) titleEl.textContent = '\uD83D\uDCB1 Cotizaciones del dolar (hoy)';
      if (noteEl)  noteEl.textContent  = '* "Tarjeta" = tipo oficial + recargos de AFIP.';

      var cotizaciones = State.get('cotizaciones');
      var activo  = State.get('dolarSeleccionado');
      var orden   = ['tarjeta', 'blue', 'oficial', 'mep', 'ccl', 'cripto', 'custom'];

      strip.innerHTML = orden.map(function(key) {
        var info   = DOLAR_LABELS[key];
        var valor  = cotizaciones[key];
        var variacion = cotizaciones[key + '_var'] || null;

        var valorStr;
        if (key === 'custom') {
          valorStr = '\u270F\uFE0F Personalizado';
        } else if (valor) {
          valorStr = '$' + Math.round(valor).toLocaleString('es-AR');
          if (variacion !== null) {
            var sign  = variacion >= 0 ? '+' : '';
            var color = variacion >= 0 ? 'var(--color-success)' : 'var(--red)';
            valorStr += '<span style="font-size:.65rem;color:' + color + ';margin-left:4px">' + sign + variacion + '%</span>';
          }
        } else {
          valorStr = '<span class="pill-loading">...</span>';
        }

        return '<div'
          + ' class="dolar-pill' + (activo === key ? ' active' : '') + '"'
          + ' role="radio" aria-checked="' + (activo === key) + '" tabindex="0"'
          + ' data-key="' + key + '"'
          + ' onclick="UI.selectDolar(\'' + key + '\', this)"'
          + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')UI.selectDolar(\'' + key + '\',this)"'
          + '>'
          + '<span class="dolar-pill__name">' + info.emoji + ' ' + info.label + '</span>'
          + '<span class="dolar-pill__value" id="val-' + key + '">' + valorStr + '</span>'
          + '</div>';
      }).join('');

      if (customRow) customRow.hidden = activo !== 'custom';
    } else {
      var cfg = CONFIG.paises[pais];
      if (!cfg) return;
      if (titleEl) titleEl.textContent = '\uD83D\uDCB1 Cotizacion del dolar en ' + cfg.nombre;
      if (customRow) customRow.hidden = true;
      if (noteEl) noteEl.textContent = '* Cotizacion de referencia obtenida de ExchangeRate-API.';

      var tasasGlobales = State.get('tasasGlobales') || {};
      var cotLocal = tasasGlobales[cfg.moneda] !== undefined
        ? tasasGlobales[cfg.moneda]
        : (CONFIG.fallbackLocal[pais] !== undefined ? CONFIG.fallbackLocal[pais] : 1);
      var cotStr = cotLocal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });

      strip.innerHTML = '<div class="dolar-pill active" style="max-width:320px;cursor:default;margin:0 auto" role="img">'
        + '<span class="dolar-pill__name">1 USD Oficial (' + cfg.moneda + ')</span>'
        + '<span class="dolar-pill__value">' + cfg.simbolo + cotStr + '</span>'
        + '</div>';
    }

    // sincronizar strip mini de la calculadora
    renderDolarStripMini();
  }

  // ---- Dolar strip mini (inline en Calculadora) ----

  function renderDolarStripMini() {
    var strip = document.getElementById('dolarStripMini');
    if (!strip) return;

    var pais = State.get('pais');
    var arCalc = document.getElementById('arSection-calc');
    if (arCalc) arCalc.hidden = pais !== 'AR';
    if (pais !== 'AR') return;

    var cotizaciones = State.get('cotizaciones');
    var activo  = State.get('dolarSeleccionado');
    var orden   = ['tarjeta', 'blue', 'oficial', 'mep', 'ccl', 'cripto', 'custom'];

    strip.innerHTML = orden.map(function(key) {
      var info  = DOLAR_LABELS[key];
      var valor = cotizaciones[key];
      var valStr = key === 'custom'
        ? '\u270F'
        : (valor ? '$' + Math.round(valor).toLocaleString('es-AR') : '...');

      return '<div'
        + ' class="dolar-pill dolar-pill--mini' + (activo === key ? ' active' : '') + '"'
        + ' role="radio" aria-checked="' + (activo === key) + '" tabindex="0"'
        + ' data-key="' + key + '"'
        + ' onclick="UI.selectDolar(\'' + key + '\', this)"'
        + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')UI.selectDolar(\'' + key + '\',this)"'
        + ' title="' + info.label + (valor ? ' $' + Math.round(valor).toLocaleString('es-AR') : '') + '"'
        + '>'
        + '<span class="dolar-pill__name">' + info.emoji + '</span>'
        + '<span class="dolar-pill__value">' + valStr + '</span>'
        + '</div>';
    }).join('');

    var inlineRow = document.getElementById('customDolarRowInline');
    if (inlineRow) inlineRow.hidden = activo !== 'custom';
  }

  function selectDolar(key, el) {
    State.set('dolarSeleccionado', key);

    // actualizar AMBOS strips
    document.querySelectorAll('.dolar-pill').forEach(function(p) {
      p.classList.remove('active');
      p.setAttribute('aria-checked', 'false');
    });
    // activar todos los pills con ese key (puede ser en ambas vistas)
    document.querySelectorAll('.dolar-pill[data-key="' + key + '"]').forEach(function(p) {
      p.classList.add('active');
      p.setAttribute('aria-checked', 'true');
    });

    var customRow       = document.getElementById('customDolarRow');
    var customRowInline = document.getElementById('customDolarRowInline');
    if (customRow)       customRow.hidden       = key !== 'custom';
    if (customRowInline) customRowInline.hidden = key !== 'custom';

    _actualizarDolarTag(key);
    saveToStorage();
    Calculator.calcular();
  }

  function _actualizarDolarTag(key) {
    var tag = document.getElementById('br-dolarTag');
    if (tag) tag.textContent = (DOLAR_LABELS[key] && DOLAR_LABELS[key].label) || key;
  }

  // ---- Tiendas ----

  function renderStores() {
    var grid = document.getElementById('storesGrid');
    if (!grid) return;
    var activo = State.get('tienda');
    grid.innerHTML = CONFIG.tiendas.map(function(t) {
      return '<div'
        + ' class="store-btn' + (activo === t.id ? ' active' : '') + '"'
        + ' role="radio" aria-checked="' + (activo === t.id) + '" tabindex="0"'
        + ' data-id="' + t.id + '"'
        + ' onclick="UI.selectStore(\'' + t.id + '\', this)"'
        + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')UI.selectStore(\'' + t.id + '\',this)"'
        + ' title="' + t.nombre + ' - Origen: ' + t.origen + '"'
        + '>'
        + '<span class="store-btn__emoji" aria-hidden="true">' + t.emoji + '</span>'
        + t.nombre
        + '</div>';
    }).join('');
  }

  function selectStore(id, el) {
    State.set('tienda', id);
    document.querySelectorAll('.store-btn').forEach(function(b) {
      b.classList.remove('active'); b.setAttribute('aria-checked', 'false');
    });
    el.classList.add('active'); el.setAttribute('aria-checked', 'true');

    var tienda = CONFIG.tiendas.find(function(t) { return t.id === id; });
    if (tienda) {
      var envioEl = document.getElementById('envio');
      if (envioEl) envioEl.value = tienda.envioDefault;
      var origenEl = document.getElementById('tiendaOrigen');
      if (origenEl) origenEl.textContent = 'Origen: ' + tienda.origen;
    }
    saveToStorage();
    Calculator.calcular();
  }

  // ---- Monedas ----

  function renderCurrencyTabs() {
    var tabsEl   = document.getElementById('currencyTabs');
    var panelsEl = document.getElementById('currencyPanels');
    if (!tabsEl || !panelsEl) return;
    var activo = State.get('monedaInput');

    tabsEl.innerHTML = CONFIG.monedas.map(function(m) {
      return '<div'
        + ' class="tab' + (activo === m.id ? ' active' : '') + '"'
        + ' role="tab" aria-selected="' + (activo === m.id) + '"'
        + ' tabindex="' + (activo === m.id ? '0' : '-1') + '"'
        + ' data-id="' + m.id + '"'
        + ' onclick="UI.switchMoneda(\'' + m.id + '\', this)"'
        + ' onkeydown="UI.handleTabKey(event, \'' + m.id + '\')"'
        + ' title="' + m.nombre + '"'
        + '>' + m.label + '</div>';
    }).join('');

    panelsEl.innerHTML = CONFIG.monedas.map(function(m) {
      return '<div'
        + ' class="tab-panel' + (activo === m.id ? ' active' : '') + '"'
        + ' id="panel-' + m.id + '" role="tabpanel"'
        + (activo !== m.id ? ' hidden' : '')
        + '>'
        + '<p style="margin-bottom:.75rem;font-size:.95rem;color:var(--color-muted)">Ingresa el precio:</p>'
        + '<div class="input-group">'
        + '<span class="input-prefix" aria-hidden="true">' + m.simbolo + '</span>'
        + '<input type="number" id="precio-' + m.id + '"'
        + ' placeholder="' + (m.id === 'btc' ? 'ej: 0.0003' : 'ej: 29.99') + '"'
        + ' min="0" step="' + (m.id === 'btc' ? '0.00001' : '0.01') + '"'
        + ' autocomplete="off" onfocus="this.select()"'
        + ' oninput="Calculator.calcular(); UI.saveToStorage()"'
        + ' aria-label="Precio en ' + m.nombre + '"'
        + '>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function switchMoneda(id, el) {
    State.set('monedaInput', id);
    document.querySelectorAll('.tab').forEach(function(t) {
      t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); t.tabIndex = -1;
    });
    el.classList.add('active'); el.setAttribute('aria-selected', 'true'); el.tabIndex = 0;
    document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); p.hidden = true; });
    var panel = document.getElementById('panel-' + id);
    if (panel) { panel.classList.add('active'); panel.hidden = false; }
    Calculator.calcular();
    saveToStorage();
    setTimeout(function() { var inp = document.getElementById('precio-' + id); if (inp) inp.focus(); }, 50);
  }

  function handleTabKey(event, currentId) {
    var ids = CONFIG.monedas.map(function(m) { return m.id; });
    var idx = ids.indexOf(currentId);
    var next = -1;
    if (event.key === 'ArrowRight') next = (idx + 1) % ids.length;
    if (event.key === 'ArrowLeft')  next = (idx - 1 + ids.length) % ids.length;
    if (next >= 0) {
      var nextEl = document.querySelector('[data-id="' + ids[next] + '"].tab');
      if (nextEl) { nextEl.focus(); switchMoneda(ids[next], nextEl); }
    }
  }

  // ---- Bancos ----

  function renderBancos() {
    var grid = document.getElementById('bancosGrid');
    if (!grid) return;
    var activo = State.get('banco');
    grid.innerHTML = CONFIG.bancos.map(function(b) {
      return '<div'
        + ' class="bank-btn' + (activo === b.id ? ' active' : '') + '"'
        + ' role="radio" aria-checked="' + (activo === b.id) + '" tabindex="0"'
        + ' data-id="' + b.id + '"'
        + ' onclick="UI.selectBanco(\'' + b.id + '\', this)"'
        + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')UI.selectBanco(\'' + b.id + '\',this)"'
        + '>'
        + '<div class="bank-dot" style="background:' + b.color + '" aria-hidden="true"></div>'
        + b.nombre
        + '</div>';
    }).join('');
  }

  function selectBanco(id, el) {
    State.set('banco', id);
    document.querySelectorAll('.bank-btn').forEach(function(b) {
      b.classList.remove('active'); b.setAttribute('aria-checked', 'false');
    });
    el.classList.add('active'); el.setAttribute('aria-checked', 'true');
    saveToStorage();
    Calculator.calcular();
  }

  // ---- Pais ----

  function onPaisChange() {
    var pais = document.getElementById('pais') && document.getElementById('pais').value;
    if (!pais) return;
    State.set('pais', pais);
    var cfg = CONFIG.paises[pais];
    if (cfg) {
      var el = document.getElementById('monedaLocal');
      if (el) el.value = cfg.moneda + ' \u2014 ' + cfg.monedaNombre;
    }
    var arSect = document.getElementById('arSection');
    if (arSect) arSect.hidden = pais !== 'AR';
    var arCalc = document.getElementById('arSection-calc');
    if (arCalc) arCalc.hidden = pais !== 'AR';

    renderDolarStrip();
    saveToStorage();
    Calculator.calcular();
  }

  // ---- Cantidad con botones +/- ----

  function initQtyButtons() {
    var cantEl  = document.getElementById('cantidad');
    var cantVal = document.getElementById('cantVal');
    var minus   = document.getElementById('qtyMinus');
    var plus    = document.getElementById('qtyPlus');

    function update(delta) {
      var current = parseInt((cantEl && cantEl.value) || '1', 10);
      var next    = Math.max(1, Math.min(50, current + delta));
      if (cantEl)  cantEl.value       = next;
      if (cantVal) cantVal.textContent = next;
      State.set('cantidad', next);
      saveToStorage();
      Calculator.calcular();
    }

    if (minus) minus.addEventListener('click', function() { update(-1); });
    if (plus)  plus.addEventListener('click',  function() { update(+1); });
  }

  // ---- Boton Limpiar ----

  function limpiar() {
    // Limpiar campos de precio
    CONFIG.monedas.forEach(function(m) {
      var el = document.getElementById('precio-' + m.id);
      if (el) el.value = '';
    });
    // Envio a 0
    var envioEl = document.getElementById('envio');
    if (envioEl) envioEl.value = '0';
    // Cantidad a 1
    var cantEl  = document.getElementById('cantidad');
    var cantVal = document.getElementById('cantVal');
    if (cantEl)  cantEl.value       = 1;
    if (cantVal) cantVal.textContent = 1;
    State.set('cantidad', 1);
    // Link vacio
    var linkEl = document.getElementById('linkProducto');
    if (linkEl) linkEl.value = '';
    var linkInfo = document.getElementById('linkInfo');
    if (linkInfo) { linkInfo.textContent = ''; linkInfo.style.color = ''; }
    // Custom dolar vacio
    var ci = document.getElementById('customDolarInline');
    if (ci) ci.value = '';
    var cd = document.getElementById('customDolar');
    if (cd) cd.value = '';
    // Mostrar estado vacio
    setResultVisible(false);
    clearAlert();
    _lastTotal = null;
    localStorage.removeItem(LS_KEY);
    Calculator.calcular();
  }

  // ---- Link input ----

  function onLinkInput() {
    var raw  = (document.getElementById('linkProducto') && document.getElementById('linkProducto').value) || '';
    var link = raw.trim();
    var info = document.getElementById('linkInfo');
    if (!link) {
      if (info) { info.textContent = ''; info.style.color = ''; }
      return;
    }
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      if (info) { info.textContent = 'Pega una URL completa (https://...)'; info.style.color = 'var(--gold)'; }
      return;
    }
    for (var id in CONFIG.tiendaRegex) {
      if (CONFIG.tiendaRegex[id].test(link)) {
        var el = document.querySelector('[data-id="' + id + '"].store-btn');
        if (el) selectStore(id, el);
        var t = CONFIG.tiendas.find(function(t) { return t.id === id; });
        if (info) {
          info.innerHTML = 'Tienda detectada: <strong>' + ((t && t.nombre) || id) + '</strong>. Ingresa el precio abajo.';
          info.style.color = 'var(--color-success)';
        }
        return;
      }
    }
    if (info) { info.textContent = 'Tienda no reconocida. Selecciona "Otra" e ingresa el precio.'; info.style.color = 'var(--gold)'; }
  }

  // ---- Alertas ----

  function showAlert(msg, type) {
    var el = document.getElementById('alertBox');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.className = 'alert-box alert-' + (type || 'warn');
  }

  function clearAlert() {
    var el = document.getElementById('alertBox');
    if (el) el.hidden = true;
  }

  // ---- Theme ----

  function initTheme() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var saved      = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      btn.textContent = '\uD83C\uDF19';
    } else {
      document.documentElement.removeAttribute('data-theme');
      btn.textContent = '\u2600\uFE0F';
    }
    btn.addEventListener('click', function() {
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
        btn.textContent = '\u2600\uFE0F';
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        btn.textContent = '\uD83C\uDF19';
      }
    });
  }

  // ---- Share ----

  function onShare() {
    var btnText = document.getElementById('shareBtnText');
    var pais    = State.get('pais');
    var total   = (document.getElementById('totalPesos')   && document.getElementById('totalPesos').textContent)   || '$0';
    var precio  = (document.getElementById('br-precioUSD') && document.getElementById('br-precioUSD').textContent) || 'USD 0';
    var tidId   = State.get('tienda');
    var tObj    = CONFIG.tiendas.find(function(t) { return t.id === tidId; });
    var tienda  = (tObj && tObj.nombre) || 'Tienda';

    var text = 'Calculo de ImportaYa\nTienda: ' + tienda + '\nPrecio + Envio: ' + precio + '\nTotal Estimado: ' + total;
    if (pais === 'AR') {
      var tag = (document.getElementById('br-dolarTag') && document.getElementById('br-dolarTag').textContent) || 'Tarjeta';
      text += '\nCotizacion: ' + tag;
    }
    text += '\n\nCalcular: https://rodria45.github.io/ImportaYa/';

    if (navigator.share) {
      navigator.share({ title: 'Calculo ImportaYa', text: text }).catch(function() {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        if (btnText) { var o = btnText.textContent; btnText.textContent = 'Copiado!'; setTimeout(function() { btnText.textContent = o; }, 2000); }
      });
    }
  }

  // ---- Export Imagen ----

  function exportarComoImagen() {
    var card    = document.querySelector('.result-card');
    var btn     = document.getElementById('downloadImgBtn');
    var btnText = document.getElementById('downloadImgBtnText');
    if (!card || !btn || !btnText) return;
    if (typeof html2canvas === 'undefined') {
      showAlert('Exportar imagen requiere conexion a internet.', 'warn'); return;
    }
    var orig = btnText.textContent;
    btn.disabled = true; btnText.textContent = 'Generando...';
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    html2canvas(card, { scale: 2, useCORS: true, backgroundColor: isLight ? '#ffffff' : '#0d1420', logging: false })
      .then(function(canvas) {
        canvas.toBlob(function(blob) {
          if (!blob) return;
          var file = new File([blob], 'importaya-' + Date.now() + '.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'Calculo ImportaYa' }).catch(function(e) {
              if (e.name !== 'AbortError') { _dl(canvas); }
            });
          } else { _dl(canvas); }
        }, 'image/png');
      })
      .catch(function(e) { console.error('html2canvas:', e); })
      .finally(function() {
        setTimeout(function() { btn.disabled = false; btnText.textContent = orig; }, 500);
      });
  }

  function _dl(canvas) {
    var a = document.createElement('a');
    a.download = 'importaya-' + Date.now() + '.png';
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  // ---- Navegacion SPA ----

  function initNavigation() {
    var navBtns = document.querySelectorAll('.nav-btn');
    var views   = document.querySelectorAll('.view-section');
    navBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.getAttribute('data-view');
        navBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        views.forEach(function(v) { v.classList.remove('active'); v.hidden = true; void v.offsetWidth; });
        var target = document.getElementById('view-' + id);
        if (target) { target.classList.add('active'); target.hidden = false; }
      });
    });
  }

  // ---- Custom Dolar Inline (sincroniza con el campo de Cotizaciones) ----

  function syncCustomDolar(source) {
    // source: 'inline' o 'rates'
    var inlineEl = document.getElementById('customDolarInline');
    var ratesEl  = document.getElementById('customDolar');
    if (source === 'inline' && inlineEl && ratesEl) ratesEl.value = inlineEl.value;
    if (source === 'rates'  && inlineEl && ratesEl) inlineEl.value = ratesEl.value;
    saveToStorage();
    Calculator.calcular();
  }

  // ---- Init ----

  function init() {
    initTheme();
    initNavigation();

    // Cargar estado guardado ANTES de renderizar
    var saved = loadFromStorage();
    if (saved) applyStoredState(saved);

    renderDolarStrip();
    renderDolarStripMini();
    renderStores();
    renderCurrencyTabs();
    renderBancos();
    initQtyButtons();

    // Aplicar valores guardados al DOM DESPUES de renderizar
    if (saved) applyStoredDOM(saved);

    // Listeners basicos
    var paisEl = document.getElementById('pais');
    if (paisEl) paisEl.addEventListener('change', onPaisChange);

    // Custom dolar en cotizaciones (sincroniza al inline)
    var ratesEl = document.getElementById('customDolar');
    if (ratesEl) ratesEl.addEventListener('input', function() { syncCustomDolar('rates'); });

    // Custom dolar inline (sincroniza al de cotizaciones)
    var inlineEl = document.getElementById('customDolarInline');
    if (inlineEl) inlineEl.addEventListener('input', function() { syncCustomDolar('inline'); });

    var envioEl = document.getElementById('envio');
    if (envioEl) envioEl.addEventListener('input', function() { saveToStorage(); Calculator.calcular(); });

    var linkEl = document.getElementById('linkProducto');
    if (linkEl) linkEl.addEventListener('input', onLinkInput);
    var parseBtnEl = document.getElementById('parseBtn');
    if (parseBtnEl) parseBtnEl.addEventListener('click', onLinkInput);

    var shareEl = document.getElementById('shareBtn');
    if (shareEl) shareEl.addEventListener('click', onShare);
    var dlEl = document.getElementById('downloadImgBtn');
    if (dlEl) dlEl.addEventListener('click', exportarComoImagen);

    var clearBtnEl = document.getElementById('clearBtn');
    if (clearBtnEl) clearBtnEl.addEventListener('click', limpiar);

    // Mostrar estado inicial
    var pais = State.get('pais');
    var arSect = document.getElementById('arSection');
    if (arSect) arSect.hidden = pais !== 'AR';
    var arCalc = document.getElementById('arSection-calc');
    if (arCalc) arCalc.hidden = pais !== 'AR';

    Calculator.calcular();
  }

  return {
    init, saveToStorage, setResultVisible, animateTotal,
    renderDolarStrip, renderDolarStripMini, renderStores,
    renderCurrencyTabs, renderBancos,
    selectDolar, selectStore, selectBanco,
    switchMoneda, handleTabKey,
    showAlert, clearAlert,
  };
})();
