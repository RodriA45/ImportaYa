/**
 * ui.js - Renderizado dinamico e interacciones del usuario.
 */

const UI = (() => {

  const DOLAR_LABELS = {
    tarjeta: { label: 'Tarjeta',   emoji: '\uD83D\uDCB3' },
    blue:    { label: 'Blue',      emoji: '\uD83D\uDD35' },
    oficial: { label: 'Oficial',   emoji: '\uD83C\uDFE6' },
    mep:     { label: 'MEP/Bolsa', emoji: '\uD83D\uDCC8' },
    ccl:     { label: 'CCL',       emoji: '\uD83C\uDF10' },
    cripto:  { label: 'Cripto',    emoji: '\u26A1'       },
    custom:  { label: 'Manual',    emoji: '\u270F\uFE0F' },
  };

  // --- Dolar strip ---

  function renderDolarStrip() {
    const strip = document.getElementById('dolarStrip');
    if (!strip) return;

    const pais      = State.get('pais');
    const titleEl   = document.getElementById('dolar-title');
    const customRow = document.getElementById('customDolarRow');
    const noteEl    = document.querySelector('#view-rates .note');

    if (pais === 'AR') {
      if (titleEl) titleEl.innerHTML = '\uD83D\uDCB1 Cotizaciones del dolar (hoy)';
      if (noteEl)  noteEl.textContent = '* "Tarjeta" = tipo oficial + recargos vigentes de AFIP.';

      const cotizaciones = State.get('cotizaciones');
      const activo = State.get('dolarSeleccionado');
      const orden  = ['tarjeta', 'blue', 'oficial', 'mep', 'ccl', 'cripto', 'custom'];

      strip.innerHTML = orden.map(key => {
        const info  = DOLAR_LABELS[key];
        const valor = cotizaciones[key];
        const valorStr = key === 'custom'
          ? '\u270F\uFE0F'
          : valor
            ? '$' + Math.round(valor).toLocaleString('es-AR')
            : '<span class="pill-loading">...</span>';

        return '<div'
          + ' class="dolar-pill' + (activo === key ? ' active' : '') + '"'
          + ' role="radio"'
          + ' aria-checked="' + (activo === key) + '"'
          + ' tabindex="0"'
          + ' data-key="' + key + '"'
          + ' onclick="UI.selectDolar(\'' + key + '\', this)"'
          + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \') UI.selectDolar(\'' + key + '\', this)"'
          + '>'
          + '<span class="dolar-pill__name">' + info.emoji + ' ' + info.label + '</span>'
          + '<span class="dolar-pill__value" id="val-' + key + '">' + valorStr + '</span>'
          + '</div>';
      }).join('');

      if (customRow) customRow.hidden = activo !== 'custom';
      _actualizarDolarTag(activo);

    } else {
      const cfg = CONFIG.paises[pais];
      if (!cfg) return;

      if (titleEl) titleEl.innerHTML = '\uD83D\uDCB1 Cotizacion del dolar en ' + cfg.nombre;
      if (customRow) customRow.hidden = true;
      if (noteEl) noteEl.textContent = '* Cotizacion de referencia obtenida de ExchangeRate-API.';

      const tasasGlobales = State.get('tasasGlobales') || {};
      const cotLocal = tasasGlobales[cfg.moneda] !== undefined
        ? tasasGlobales[cfg.moneda]
        : (CONFIG.fallbackLocal[pais] !== undefined ? CONFIG.fallbackLocal[pais] : 1);

      const cotStr = cotLocal.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      });

      strip.innerHTML = '<div class="dolar-pill active" style="max-width:320px;cursor:default;margin:0 auto" role="img">'
        + '<span class="dolar-pill__name">1 USD Oficial (' + cfg.moneda + ')</span>'
        + '<span class="dolar-pill__value">' + cfg.simbolo + cotStr + '</span>'
        + '</div>';
    }
  }

  function selectDolar(key, el) {
    State.set('dolarSeleccionado', key);

    document.querySelectorAll('.dolar-pill').forEach(p => {
      p.classList.remove('active');
      p.setAttribute('aria-checked', 'false');
    });
    el.classList.add('active');
    el.setAttribute('aria-checked', 'true');

    const customRow = document.getElementById('customDolarRow');
    if (customRow) customRow.hidden = key !== 'custom';

    _actualizarDolarTag(key);
    Calculator.calcular();
  }

  function _actualizarDolarTag(key) {
    const tag = document.getElementById('br-dolarTag');
    if (tag) tag.textContent = (DOLAR_LABELS[key] && DOLAR_LABELS[key].label) || key;
  }

  // --- Tiendas ---

  function renderStores() {
    const grid = document.getElementById('storesGrid');
    if (!grid) return;

    const activo = State.get('tienda');
    grid.innerHTML = CONFIG.tiendas.map(t =>
      '<div'
      + ' class="store-btn' + (activo === t.id ? ' active' : '') + '"'
      + ' role="radio"'
      + ' aria-checked="' + (activo === t.id) + '"'
      + ' tabindex="0"'
      + ' data-id="' + t.id + '"'
      + ' onclick="UI.selectStore(\'' + t.id + '\', this)"'
      + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \') UI.selectStore(\'' + t.id + '\', this)"'
      + ' title="' + t.nombre + ' - Origen: ' + t.origen + '"'
      + '>'
      + '<span class="store-btn__emoji" aria-hidden="true">' + t.emoji + '</span>'
      + t.nombre
      + '</div>'
    ).join('');
  }

  function selectStore(id, el) {
    State.set('tienda', id);

    document.querySelectorAll('.store-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-checked', 'false');
    });
    el.classList.add('active');
    el.setAttribute('aria-checked', 'true');

    const tienda = CONFIG.tiendas.find(t => t.id === id);
    if (tienda) {
      const envioEl = document.getElementById('envio');
      if (envioEl) envioEl.value = tienda.envioDefault;

      const origenEl = document.getElementById('tiendaOrigen');
      if (origenEl) origenEl.textContent = 'Origen: ' + tienda.origen;
    }

    Calculator.calcular();
  }

  // --- Monedas ---

  function renderCurrencyTabs() {
    const tabsEl   = document.getElementById('currencyTabs');
    const panelsEl = document.getElementById('currencyPanels');
    if (!tabsEl || !panelsEl) return;

    const activo = State.get('monedaInput');

    tabsEl.innerHTML = CONFIG.monedas.map(m =>
      '<div'
      + ' class="tab' + (activo === m.id ? ' active' : '') + '"'
      + ' role="tab"'
      + ' aria-selected="' + (activo === m.id) + '"'
      + ' tabindex="' + (activo === m.id ? '0' : '-1') + '"'
      + ' data-id="' + m.id + '"'
      + ' onclick="UI.switchMoneda(\'' + m.id + '\', this)"'
      + ' onkeydown="UI.handleTabKey(event, \'' + m.id + '\')"'
      + ' title="' + m.nombre + '"'
      + '>' + m.label + '</div>'
    ).join('');

    panelsEl.innerHTML = CONFIG.monedas.map(m =>
      '<div'
      + ' class="tab-panel' + (activo === m.id ? ' active' : '') + '"'
      + ' id="panel-' + m.id + '"'
      + ' role="tabpanel"'
      + (activo !== m.id ? ' hidden' : '')
      + '>'
      + '<p style="margin-bottom:0.75rem;font-size:0.95rem;color:var(--color-muted)">Ingresa el precio del producto:</p>'
      + '<div class="input-group">'
      + '<span class="input-prefix" aria-hidden="true">' + m.simbolo + '</span>'
      + '<input'
      + ' type="number"'
      + ' id="precio-' + m.id + '"'
      + ' placeholder="' + (m.id === 'btc' ? 'ej: 0.0003' : 'ej: 29.99') + '"'
      + ' min="0"'
      + ' step="' + (m.id === 'btc' ? '0.00001' : '0.01') + '"'
      + ' autocomplete="off"'
      + ' onfocus="this.select()"'
      + ' oninput="Calculator.calcular()"'
      + ' aria-label="Precio en ' + m.nombre + '"'
      + '>'
      + '</div>'
      + '</div>'
    ).join('');
  }

  function switchMoneda(id, el) {
    State.set('monedaInput', id);

    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.tabIndex = -1;
    });
    el.classList.add('active');
    el.setAttribute('aria-selected', 'true');
    el.tabIndex = 0;

    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.remove('active');
      p.hidden = true;
    });
    const panel = document.getElementById('panel-' + id);
    if (panel) { panel.classList.add('active'); panel.hidden = false; }

    Calculator.calcular();
    setTimeout(() => {
      const inp = document.getElementById('precio-' + id);
      if (inp) inp.focus();
    }, 50);
  }

  function handleTabKey(event, currentId) {
    const ids = CONFIG.monedas.map(m => m.id);
    const idx = ids.indexOf(currentId);
    let next = -1;
    if (event.key === 'ArrowRight') next = (idx + 1) % ids.length;
    if (event.key === 'ArrowLeft')  next = (idx - 1 + ids.length) % ids.length;
    if (next >= 0) {
      const nextEl = document.querySelector('[data-id="' + ids[next] + '"].tab');
      if (nextEl) { nextEl.focus(); switchMoneda(ids[next], nextEl); }
    }
  }

  // --- Bancos ---

  function renderBancos() {
    const grid = document.getElementById('bancosGrid');
    if (!grid) return;

    const activo = State.get('banco');
    grid.innerHTML = CONFIG.bancos.map(b =>
      '<div'
      + ' class="bank-btn' + (activo === b.id ? ' active' : '') + '"'
      + ' role="radio"'
      + ' aria-checked="' + (activo === b.id) + '"'
      + ' tabindex="0"'
      + ' data-id="' + b.id + '"'
      + ' onclick="UI.selectBanco(\'' + b.id + '\', this)"'
      + ' onkeydown="if(event.key===\'Enter\'||event.key===\' \') UI.selectBanco(\'' + b.id + '\', this)"'
      + '>'
      + '<div class="bank-dot" style="background:' + b.color + '" aria-hidden="true"></div>'
      + b.nombre
      + '</div>'
    ).join('');
  }

  function selectBanco(id, el) {
    State.set('banco', id);
    document.querySelectorAll('.bank-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-checked', 'false');
    });
    el.classList.add('active');
    el.setAttribute('aria-checked', 'true');
    Calculator.calcular();
  }

  // --- Pais ---

  function onPaisChange() {
    const pais = document.getElementById('pais') && document.getElementById('pais').value;
    if (!pais) return;
    State.set('pais', pais);

    const cfg = CONFIG.paises[pais];
    if (cfg) {
      const el = document.getElementById('monedaLocal');
      if (el) el.value = cfg.moneda + ' \u2014 ' + cfg.monedaNombre;
    }

    const arSection = document.getElementById('arSection');
    if (arSection) arSection.hidden = pais !== 'AR';

    renderDolarStrip();
    Calculator.calcular();
  }

  // --- Link / URL parsing ---

  function onLinkInput() {
    const raw  = (document.getElementById('linkProducto') && document.getElementById('linkProducto').value) || '';
    const link = raw.trim();
    const info = document.getElementById('linkInfo');

    if (!link) {
      if (info) { info.textContent = ''; info.style.color = ''; }
      return;
    }

    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      if (info) {
        info.textContent = 'Pega una URL completa que empiece con https://';
        info.style.color = 'var(--gold)';
      }
      return;
    }

    for (const id in CONFIG.tiendaRegex) {
      if (CONFIG.tiendaRegex[id].test(link)) {
        const el = document.querySelector('[data-id="' + id + '"].store-btn');
        if (el) selectStore(id, el);

        const t = CONFIG.tiendas.find(function(t) { return t.id === id; });
        const nombre = (t && t.nombre) || id;
        if (info) {
          info.innerHTML = 'Tienda detectada: <strong>' + nombre + '</strong>.<br>Por seguridad no podemos extraer el precio automaticamente. Por favor, ingresa el monto abajo.';
          info.style.color = 'var(--green)';
        }
        return;
      }
    }

    if (info) {
      info.textContent = 'Tienda no reconocida. Selecciona "Otra" e ingresa el precio.';
      info.style.color = 'var(--gold)';
    }
  }

  // --- Cantidad ---

  function onCantidadChange(val) {
    const el = document.getElementById('cantVal');
    if (el) el.textContent = val + ' ud.';
    State.set('cantidad', parseInt(val, 10));
    Calculator.calcular();
  }

  // --- Alertas ---

  function showAlert(msg, type) {
    type = type || 'warn';
    const el = document.getElementById('alertBox');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.className = 'alert-box alert-' + type;
  }

  function clearAlert() {
    const el = document.getElementById('alertBox');
    if (el) el.hidden = true;
  }

  // --- Theme (Dark/Light) ---

  function initTheme() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    const savedTheme  = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    if (initialTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      toggleBtn.textContent = '\uD83C\uDF19';
    } else {
      document.documentElement.removeAttribute('data-theme');
      toggleBtn.textContent = '\u2600\uFE0F';
    }

    toggleBtn.addEventListener('click', function() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
        toggleBtn.textContent = '\u2600\uFE0F';
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        toggleBtn.textContent = '\uD83C\uDF19';
      }
    });
  }

  // --- Share ---

  function onShare() {
    const btn     = document.getElementById('shareBtn');
    const btnText = document.getElementById('shareBtnText');
    if (!btn || !btnText) return;

    const pais       = State.get('pais');
    const totalPesos = (document.getElementById('totalPesos') && document.getElementById('totalPesos').textContent) || '$0';
    const precioUSD  = (document.getElementById('br-precioUSD') && document.getElementById('br-precioUSD').textContent) || 'USD 0';
    const tiendaId   = State.get('tienda');
    const tiendaObj  = CONFIG.tiendas.find(function(t) { return t.id === tiendaId; });
    const tienda     = (tiendaObj && tiendaObj.nombre) || 'Tienda';

    var text = 'Calculo de ImportaYa\n';
    text += 'Tienda: ' + tienda + '\n';
    text += 'Precio + Envio: ' + precioUSD + '\n';
    text += 'Total Estimado: ' + totalPesos + '\n';

    if (pais === 'AR') {
      const dolarTag  = (document.getElementById('br-dolarTag') && document.getElementById('br-dolarTag').textContent) || 'Tarjeta';
      const cotizacion = (document.getElementById('br-cotizacion') && document.getElementById('br-cotizacion').textContent) || '';
      text += 'Cotizacion: ' + dolarTag + ' (' + cotizacion.split(' ')[0] + ')\n';
    }

    text += '\nCalcular otro producto: https://rodria45.github.io/ImportaYa/';

    if (navigator.share) {
      navigator.share({ title: 'Calculo ImportaYa', text: text }).catch(function(err) {
        console.warn('Error al compartir', err);
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        var orig = btnText.textContent;
        btnText.textContent = 'Copiado!';
        setTimeout(function() { btnText.textContent = orig; }, 2000);
      });
    }
  }

  // --- Navigation (SPA) ---

  function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const views   = document.querySelectorAll('.view-section');

    navBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var targetViewId = btn.getAttribute('data-view');

        navBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        views.forEach(function(v) {
          v.classList.remove('active');
          v.hidden = true;
          void v.offsetWidth;
        });

        var targetView = document.getElementById('view-' + targetViewId);
        if (targetView) {
          targetView.classList.add('active');
          targetView.hidden = false;
        }
      });
    });
  }

  // --- Export Image ---

  function exportarComoImagen() {
    var resultCard = document.querySelector('.result-card');
    var btn        = document.getElementById('downloadImgBtn');
    var btnText    = document.getElementById('downloadImgBtnText');
    if (!resultCard || !btn || !btnText) return;

    var originalText = btnText.textContent;

    if (typeof html2canvas === 'undefined') {
      showAlert('La exportacion de imagen requiere conexion a internet.', 'warn');
      return;
    }

    btn.disabled = true;
    btnText.textContent = 'Generando...';

    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    var bgColor = isLight ? '#ffffff' : '#0d1420';

    html2canvas(resultCard, {
      scale: 2,
      useCORS: true,
      backgroundColor: bgColor,
      logging: false,
    }).then(function(canvas) {
      canvas.toBlob(function(blob) {
        if (!blob) { console.error('No se pudo generar la imagen'); return; }
        var file = new File([blob], 'importaya-' + Date.now() + '.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: 'Calculo de ImportaYa' }).catch(function(err) {
            if (err.name !== 'AbortError') { _downloadCanvas(canvas); }
          });
        } else {
          _downloadCanvas(canvas);
        }
      }, 'image/png');
    }).catch(function(err) {
      console.error('Error exportando imagen:', err);
    }).finally(function() {
      setTimeout(function() {
        btn.disabled = false;
        btnText.textContent = originalText;
      }, 500);
    });
  }

  function _downloadCanvas(canvas) {
    var dataUrl = canvas.toDataURL('image/png');
    var a = document.createElement('a');
    a.download = 'importaya-' + Date.now() + '.png';
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // --- Init ---

  function init() {
    initTheme();
    initNavigation();
    renderDolarStrip();
    renderStores();
    renderCurrencyTabs();
    renderBancos();

    var paisEl = document.getElementById('pais');
    if (paisEl) paisEl.addEventListener('change', onPaisChange);

    var customDolarEl = document.getElementById('customDolar');
    if (customDolarEl) customDolarEl.addEventListener('input', Calculator.calcular);

    var envioEl = document.getElementById('envio');
    if (envioEl) envioEl.addEventListener('input', Calculator.calcular);

    var cantidadEl = document.getElementById('cantidad');
    if (cantidadEl) cantidadEl.addEventListener('input', function(e) { onCantidadChange(e.target.value); });

    var linkEl = document.getElementById('linkProducto');
    if (linkEl) linkEl.addEventListener('input', onLinkInput);

    var parseBtnEl = document.getElementById('parseBtn');
    if (parseBtnEl) parseBtnEl.addEventListener('click', onLinkInput);

    var shareBtnEl = document.getElementById('shareBtn');
    if (shareBtnEl) shareBtnEl.addEventListener('click', onShare);

    var downloadBtnEl = document.getElementById('downloadImgBtn');
    if (downloadBtnEl) downloadBtnEl.addEventListener('click', exportarComoImagen);

    Calculator.calcular();
  }

  return {
    init,
    renderDolarStrip,
    renderStores,
    renderCurrencyTabs,
    renderBancos,
    selectDolar,
    selectStore,
    selectBanco,
    switchMoneda,
    handleTabKey,
    onCantidadChange,
    showAlert,
    clearAlert,
  };
})();
