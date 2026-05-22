/**
 * state.js - Estado global de la aplicacion.
 */
const State = (() => {

  // Valores de fallback mientras la API no responde
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
    cotizaciones:      { ...FALLBACK_COT },
    dolarSeleccionado: 'tarjeta',
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
    tasasGlobales: {},
    pais:        'AR',
    tienda:      'aliexpress',
    monedaInput: 'usd',
    banco:       'galicia',
    cantidad:    1,
    lastFetch:   null,
  };

  const listeners = [];

  return {
    get:      (key) => data[key],
    set:      (key, val) => { data[key] = val; listeners.forEach(fn => fn(key, val)); },
    getAll:   () => ({ ...data }),
    onChange: (fn) => listeners.push(fn),

    getCotizacionActiva() {
      const tipo = data.dolarSeleccionado;
      if (tipo === 'custom') {
        const el = document.getElementById('customDolar');
        const v  = el ? parseFloat(el.value) : NaN;
        return (v > 0) ? v : 0; // 0 = sin cotizacion valida aun
      }
      return data.cotizaciones[tipo] || FALLBACK_COT[tipo] || FALLBACK_COT.tarjeta;
    },
  };
})();
