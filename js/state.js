/**
 * state.js — Estado global reactivo de la aplicación.
 *
 * FIX: getCotizacionActiva() ya no devuelve 0 cuando las cotizaciones
 * aún no llegaron de la API. Devuelve el fallback de 1850 para "tarjeta"
 * y equivalentes para los demás tipos, así el cálculo funciona
 * inmediatamente al cargar la página.
 */
const State = (() => {

  // Valores de fallback usados ANTES de que responda la API
  const FALLBACK_COT = {
    tarjeta: 1850,
    blue:    1820,
    oficial: 1130,
    mep:     1780,
    ccl:     1800,
    cripto:  1760,
    custom:  null,
  };

  const data = {
    // Cotizaciones (ARS por 1 USD) — parten en null, se llenan con API
    cotizaciones: { ...FALLBACK_COT },   // <-- FIX: inicia con fallback, no con nulls

    dolarSeleccionado: 'tarjeta',

    // Tasas de cambio a USD (1 XXX = ? USD)
    tasasAUSD: {
      usd:  1,
      eur:  1.08,
      cny:  0.138,
      gbp:  1.26,
      brl:  0.185,
      mxn:  0.055,
      btc:  67000,
      usdt: 1,
    },

    pais:        'AR',
    tienda:      'aliexpress',
    monedaInput: 'usd',
    cardType:    'debito',
    banco:       'galicia',
    cantidad:    1,
    cuotas:      1,
    lastFetch:   null,
  };

  const listeners = [];

  return {
    get: (key) => data[key],
    set: (key, val) => {
      data[key] = val;
      listeners.forEach(fn => fn(key, val));
    },
    getAll: () => ({ ...data }),
    onChange: (fn) => listeners.push(fn),

    // FIX: nunca devuelve 0 — usa fallback si la cotización aún es null
    getCotizacionActiva() {
      const tipo = data.dolarSeleccionado;
      if (tipo === 'custom') {
        const v = parseFloat(document.getElementById('customDolar')?.value);
        return v > 0 ? v : FALLBACK_COT.tarjeta;
      }
      return data.cotizaciones[tipo] || FALLBACK_COT[tipo] || FALLBACK_COT.tarjeta;
    },
  };
})();
