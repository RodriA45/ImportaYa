/**
 * ui.js — Renderizado dinámico e interacciones del usuario.
 *
 * FIXES aplicados:
 *  - onLinkInput: trim() antes de procesar, muestra mensaje si campo vacío
 *  - parseBtn: llama a onLinkInput con trim correcto
 *  - br-dolarTag: se actualiza en renderDolarStrip() y en selectDolar()
 *  - selectCardType: restaura aria-checked en todos los botones
 *  - switchMoneda: no roba foco si el usuario está escribiendo en otro campo
 */

const UI = (() => {

  // ── Labels dólar ────────────────────────────────────────────────────────────

  const DOLAR_LABELS = {
    tarjeta: { label: 'Tarjeta',   emoji: '💳' },
    blue:    { label: 'Blue',      emoji: '🔵' },
    oficial: { label: 'Oficial',   emoji: '🏦' },
    mep:     { label: 'MEP/Bolsa', emoji: '📈' },
    ccl:     { label: 'CCL',       emoji: '🌐' },
    cripto:  { label: 'Cripto',    emoji: '⚡' },
    custom:  { label: 'Manual',    emoji: '✏️' },
  };

  // ── Dólar strip ─────────────────────────────────────────────────────────────

  function renderDolarStrip() {
    const strip = document.getElementById('dolarStrip');
    if (!strip) return;

    const cotizaciones = State.get('cotizaciones');
    const activo = State.get('dolarSeleccionado');
    const orden  = ['tarjeta', 'blue', 'oficial', 'mep', 'ccl', 'cripto', 'custom'];

    strip.innerHTML = orden.map(key => {
      const info  = DOLAR_LABELS[key];
      const valor = cotizaciones[key];
      const valorStr = key === 'custom'
        ? '✏️'
        : valor
          ? `$${Math.round(valor).toLocaleString('es-AR')}`
          : '<span class="pill-loading">…</span>';

      return `
        <div
          class="dolar-pill${activo === key ? ' active' : ''}"
          role="radio"
          aria-checked="${activo === key}"
          tabindex="0"
          data-key="${key}"
          onclick="UI.selectDolar('${key}', this)"
          onkeydown="if(event.key==='Enter'||event.key===' ') UI.selectDolar('${key}', this)"
        >
          <span class="dolar-name">${info.emoji} ${info.label}</span>
          <span class="dolar-val" id="val-${key}">${valorStr}</span>
        </div>`;
    }).join('');

    // FIX: también actualizar el tag del breakdown cuando se re-renderizan los pills
    _actualizarDolarTag(activo);
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

    // FIX: actualizar badge de cotización en el breakdown
    _actualizarDolarTag(key);

    Calculator.calcular();
  }

  // FIX: función interna para mantener el tag sincronizado
  function _actualizarDolarTag(key) {
    const tag = document.getElementById('br-dolarTag');
    if (tag) tag.textContent = DOLAR_LABELS[key]?.label || key;
  }

  // ── Tiendas ─────────────────────────────────────────────────────────────────

  function renderStores() {
    const grid = document.getElementById('storesGrid');
    if (!grid) return;

    const activo = State.get('tienda');
    grid.innerHTML = CONFIG.tiendas.map(t => `
      <div
        class="store-btn${activo === t.id ? ' active' : ''}"
        role="radio"
        aria-checked="${activo === t.id}"
        tabindex="0"
        data-id="${t.id}"
        onclick="UI.selectStore('${t.id}', this)"
        onkeydown="if(event.key==='Enter'||event.key===' ') UI.selectStore('${t.id}', this)"
        title="${t.nombre} · Origen: ${t.origen}"
      >
        <span class="store-emoji" aria-hidden="true">${t.emoji}</span>
        ${t.nombre}
      </div>
    `).join('');
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
      if (origenEl) origenEl.textContent = `Origen: ${tienda.origen}`;
    }

    Calculator.calcular();
  }

  // ── Monedas ─────────────────────────────────────────────────────────────────

  function renderCurrencyTabs() {
    const tabsEl   = document.getElementById('currencyTabs');
    const panelsEl = document.getElementById('currencyPanels');
    if (!tabsEl || !panelsEl) return;

    const activo = State.get('monedaInput');

    tabsEl.innerHTML = CONFIG.monedas.map(m => `
      <div
        class="tab${activo === m.id ? ' active' : ''}"
        role="tab"
        aria-selected="${activo === m.id}"
        tabindex="${activo === m.id ? '0' : '-1'}"
        data-id="${m.id}"
        onclick="UI.switchMoneda('${m.id}', this)"
        onkeydown="UI.handleTabKey(event, '${m.id}')"
        title="${m.nombre}"
      >${m.label}</div>
    `).join('');

    panelsEl.innerHTML = CONFIG.monedas.map(m => `
      <div
        class="tab-panel${activo === m.id ? ' active' : ''}"
        id="panel-${m.id}"
        role="tabpanel"
        ${activo !== m.id ? 'hidden' : ''}
      >
        <p style="margin-bottom: 0.75rem; font-size: 0.95rem; color: var(--text-muted);">
          Ingresá el precio del producto:
        </p>
        <div class="input-group">
          <span class="input-prefix" aria-hidden="true">${m.simbolo}</span>
          <input
            type="number"
            id="precio-${m.id}"
            placeholder="${m.id === 'btc' ? 'ej: 0.0003' : 'ej: 29.99'}"
            min="0"
            step="${m.id === 'btc' ? '0.00001' : '0.01'}"
            autocomplete="off"
            onfocus="this.select()"
            oninput="Calculator.calcular()"
            aria-label="Precio en ${m.nombre}"
          >
        </div>
      </div>
    `).join('');
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
    const panel = document.getElementById(`panel-${id}`);
    if (panel) { panel.classList.add('active'); panel.hidden = false; }

    Calculator.calcular();
    // FIX: focus solo si el usuario hizo clic en el tab (no al inicializar)
    setTimeout(() => document.getElementById(`precio-${id}`)?.focus(), 50);
  }

  function handleTabKey(event, currentId) {
    const ids = CONFIG.monedas.map(m => m.id);
    const idx = ids.indexOf(currentId);
    let next = -1;
    if (event.key === 'ArrowRight') next = (idx + 1) % ids.length;
    if (event.key === 'ArrowLeft')  next = (idx - 1 + ids.length) % ids.length;
    if (next >= 0) {
      const nextEl = document.querySelector(`[data-id="${ids[next]}"].tab`);
      if (nextEl) { nextEl.focus(); switchMoneda(ids[next], nextEl); }
    }
  }

  // ── Bancos ───────────────────────────────────────────────────────────────────

  function renderBancos() {
    const grid = document.getElementById('bancosGrid');
    if (!grid) return;

    const activo = State.get('banco');
    grid.innerHTML = CONFIG.bancos.map(b => `
      <div
        class="bank-btn${activo === b.id ? ' active' : ''}"
        role="radio"
        aria-checked="${activo === b.id}"
        tabindex="0"
        data-id="${b.id}"
        onclick="UI.selectBanco('${b.id}', this)"
        onkeydown="if(event.key==='Enter'||event.key===' ') UI.selectBanco('${b.id}', this)"
      >
        <div class="bank-dot" style="background:${b.color}" aria-hidden="true"></div>
        ${b.nombre}
      </div>
    `).join('');
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

  // ── País ─────────────────────────────────────────────────────────────────────

  function onPaisChange() {
    const pais = document.getElementById('pais')?.value;
    if (!pais) return;
    State.set('pais', pais);

    const cfg = CONFIG.paises[pais];
    if (cfg) {
      const el = document.getElementById('monedaLocal');
      if (el) el.value = `${cfg.moneda} — ${cfg.monedaNombre}`;
    }

    const arSection = document.getElementById('arSection');
    if (arSection) arSection.hidden = pais !== 'AR';

    Calculator.calcular();
  }



  // ── Link / URL parsing ────────────────────────────────────────────────────────
  // FIX PRINCIPAL: trim(), mensaje cuando campo vacío, manejo robusto

  function onLinkInput(evento) {
    // FIX: trim() para no fallar con espacios o saltos de línea
    const raw  = document.getElementById('linkProducto')?.value || '';
    const link = raw.trim();
    const info = document.getElementById('linkInfo');

    // Si el campo está vacío, limpiar mensaje
    if (!link) {
      if (info) { info.textContent = ''; info.style.color = ''; }
      return;
    }

    // FIX: validar que sea una URL antes de intentar parsear
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      if (info) {
        info.textContent = '⚠️ Pegá una URL completa que empiece con https://';
        info.style.color = 'var(--gold)';
      }
      return;
    }

    // Buscar tienda por regex
    for (const [id, regex] of Object.entries(CONFIG.tiendaRegex)) {
      if (regex.test(link)) {
        // Activar tienda visualmente
        const el = document.querySelector(`[data-id="${id}"].store-btn`);
        if (el) selectStore(id, el);

        const nombre = CONFIG.tiendas.find(t => t.id === id)?.nombre || id;
        if (info) {
          info.innerHTML = `✅ Tienda detectada: <strong>${nombre}</strong>.<br>Por seguridad no podemos extraer el precio automáticamente. Por favor, ingresá el monto en la sección de abajo.`;
          info.style.color = 'var(--green)';
        }
        return;
      }
    }

    // No reconocida
    if (info) {
      info.textContent = '⚠️ Tienda no reconocida. Seleccioná "Otra" e ingresá el precio.';
      info.style.color = 'var(--gold)';
    }
  }

  // ── Cantidad ──────────────────────────────────────────────────────────────────

  function onCantidadChange(val) {
    const el = document.getElementById('cantVal');
    if (el) el.textContent = `${val} ud.`;
    State.set('cantidad', parseInt(val));
    Calculator.calcular();
  }

  // ── Alertas ───────────────────────────────────────────────────────────────────

  function showAlert(msg, type = 'warn') {
    const el = document.getElementById('alertBox');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.className = `alert-box alert-${type}`;
  }

  function clearAlert() {
    const el = document.getElementById('alertBox');
    if (el) el.hidden = true;
  }

  // ── Init ──────────────────────────────────────────────────────────────────────

  function init() {
    renderDolarStrip();
    renderStores();
    renderCurrencyTabs();
    renderBancos();

    // Eventos
    document.getElementById('pais')?.addEventListener('change', onPaisChange);
    document.getElementById('customDolar')?.addEventListener('input', Calculator.calcular);
    document.getElementById('envio')?.addEventListener('input', Calculator.calcular);
    document.getElementById('cantidad')?.addEventListener('input', e => onCantidadChange(e.target.value));

    // FIX: tanto el input como el botón ANALIZAR usan la misma función con trim()
    document.getElementById('linkProducto')?.addEventListener('input', onLinkInput);
    document.getElementById('parseBtn')?.addEventListener('click', onLinkInput);

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
