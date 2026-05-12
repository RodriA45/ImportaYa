/**
 * api.js — Fetch de cotizaciones en tiempo real.
 *
 * FIXES aplicados:
 *  - CASAS_MAP: agregados todos los posibles valores que devuelve dolarapi.com
 *    (la API a veces devuelve "Tarjeta" con mayúscula, otras "tarjeta")
 *  - fetchDolares: normaliza casa.toLowerCase() antes de mapear
 *  - Fallback más robusto: si la API falla, igual llama a UI.renderDolarStrip()
 *    para que se muestren los valores de fallback y no queden los "…" infinitos
 */

const API = (() => {

  async function fetchJSON(url, timeout = 7000) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function actualizarHora() {
    const el = document.getElementById('lastUpdate');
    if (!el) return;
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, '0');
    const mm  = String(now.getMinutes()).padStart(2, '0');
    const ss  = String(now.getSeconds()).padStart(2, '0');
    el.textContent = `· ${hh}:${mm}:${ss}`;
  }

  // FIX: mapeo con toLowerCase() para cubrir cualquier capitalización
  const CASAS_MAP = {
    'tarjeta':         'tarjeta',
    'blue':            'blue',
    'oficial':         'oficial',
    'bolsa':           'mep',
    'contadoconliqui': 'ccl',
    'cripto':          'cripto',
    'mayorista':       'oficial',   // a veces aparece este
  };

  async function fetchDolares() {
    try {
      const data = await fetchJSON('https://dolarapi.com/v1/dolares');

      if (!Array.isArray(data)) throw new Error('Respuesta inesperada de dolarapi');

      const cotizaciones = State.get('cotizaciones');
      let changed = false;

      data.forEach(item => {
        // FIX: toLowerCase() para normalizar
        const casaNorm = (item.casa || '').toLowerCase().replace(/\s/g, '');
        const key = CASAS_MAP[casaNorm];
        if (key && item.venta) {
          cotizaciones[key] = parseFloat(item.venta);
          changed = true;
        }
      });

      if (changed) {
        State.set('cotizaciones', cotizaciones);
        State.set('lastFetch', new Date());
        actualizarHora();
      }

      // FIX: siempre re-renderizar aunque no haya cambios, para sacar los "…"
      UI.renderDolarStrip();
      Calculator.calcular();

    } catch (err) {
      console.warn('[API] dolarapi.com no disponible:', err.message);
      // El State ya tiene los fallback de state.js — solo re-renderizar
      UI.renderDolarStrip();
      Calculator.calcular();
    }
  }

  async function fetchTasas() {
    try {
      const data = await fetchJSON(
        'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,CNY,GBP,BRL,MXN'
      );
      const tasas = State.get('tasasAUSD');
      if (data.rates) {
        // frankfurter devuelve "cuántos XXX por 1 USD" → invertir
        if (data.rates.EUR) tasas.eur = 1 / data.rates.EUR;
        if (data.rates.CNY) tasas.cny = 1 / data.rates.CNY;
        if (data.rates.GBP) tasas.gbp = 1 / data.rates.GBP;
        if (data.rates.BRL) tasas.brl = 1 / data.rates.BRL;
        if (data.rates.MXN) tasas.mxn = 1 / data.rates.MXN;
        State.set('tasasAUSD', tasas);
        Calculator.calcular();
      }
    } catch (err) {
      console.warn('[API] frankfurter.app no disponible:', err.message);
    }
  }

  async function fetchBTC() {
    try {
      const data = await fetchJSON(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      if (data?.bitcoin?.usd) {
        const tasas = State.get('tasasAUSD');
        tasas.btc = data.bitcoin.usd;
        State.set('tasasAUSD', tasas);
        Calculator.calcular();
      }
    } catch (err) {
      console.warn('[API] coingecko no disponible:', err.message);
    }
  }

  async function refrescar() {
    await Promise.allSettled([fetchDolares(), fetchTasas(), fetchBTC()]);
  }

  function init() {
    refrescar();
    setInterval(refrescar, 3 * 60 * 1000);
  }

  return { init, refrescar };
})();
