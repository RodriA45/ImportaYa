/**
 * calculator.js — Motor de cálculo de precios.
 *
 * FIXES aplicados:
 *  - cotOficial: usa fallback real de 1130 si la API aún no respondió,
 *    no el hack (cot * 0.61) que daba valores incorrectos.
 *  - Impuesto PAIS y percepción AFIP: cuando el usuario selecciona "Tarjeta",
 *    la cotización YA incluye esos impuestos, así que NO se agregan dos veces.
 *    Solo se agregan separados cuando se usa Blue/MEP/CCL/Oficial.
 *  - br-dolarTag: se actualiza correctamente vía UI._actualizarDolarTag (ya en ui.js).
 *  - renderBreakdownAR: muestra "—" en impPais/percepcion cuando se usa tarjeta.
 */

const Calculator = (() => {

  function fmt(n) {
    return Math.round(n).toLocaleString('es-AR');
  }

  function fmtRate(n) {
    return n.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function fmtDec(n, dec = 2) {
    return n.toLocaleString('es-AR', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  }

  /** Precio ingresado → USD */
  function getPrecioUSD() {
    const moneda  = State.get('monedaInput');
    const inputEl = document.getElementById(`precio-${moneda}`);
    const raw     = parseFloat(inputEl?.value) || 0;
    const tasas   = State.get('tasasAUSD');
    return raw * (tasas[moneda] ?? 1);
  }

  // ── Cálculo Argentina ────────────────────────────────────────────────────────

  function calcularAR(precioUSD, envioUSD, cantidad, cuotas) {
    const cot          = State.getCotizacionActiva();
    const cotizaciones = State.get('cotizaciones');
    const tipoDolar    = State.get('dolarSeleccionado');

    // FIX: usar fallback real de 1130, no cot*0.61
    const cotOficial = cotizaciones.oficial || 1130;

    const totalUSD = precioUSD * cantidad + envioUSD;
    const baseARS  = totalUSD * cot;

    // FIX: Impuesto PAIS + Percepción AFIP solo se suman EXPLÍCITAMENTE
    // cuando el usuario usa Blue, MEP, CCL, Cripto o Manual.
    // Con "Tarjeta", la cotización ya los incluye — agregarlos de nuevo sería
    // cobrarlos doble.
    let impPais    = 0;
    let percepcion = 0;
    let nota       = '';

    if (tipoDolar === 'tarjeta') {
      // La cotización tarjeta ya embebió PAIS + AFIP — no se agregan separado.
      nota = 'incluidos en cotización tarjeta';
    } else {
      // Con otras cotizaciones el usuario paga los impuestos por fuera (en la
      // declaración anual). Los mostramos informativamente sobre base oficial.
      const baseOficialARS = totalUSD * cotOficial;
      impPais    = baseOficialARS * 0.30;
      percepcion = baseOficialARS * 0.45;
      nota       = `base oficial $${fmt(cotOficial)}/USD`;
    }

    // Recargo bancario
    const bancoActivo = CONFIG.bancos.find(b => b.id === State.get('banco')) || {};
    const recargoPct  = bancoActivo.recargo ?? 0;
    const recargoBanco = baseARS * recargoPct;

    // Aduana
    let aduana    = 0;
    let aduanaTag = '';
    if (totalUSD > 200) {
      aduana    = (totalUSD - 200) * 0.50 * cot;
      aduanaTag = `50% sobre USD ${fmtDec(totalUSD - 200)}`;
    } else {
      aduanaTag = `< USD 200 ✓`;
    }

    // Intereses de cuotas
    let intereses = 0;
    if (State.get('cardType') === 'credito' && cuotas > 1) {
      const pct = CONFIG.interesCuotas[cuotas] ?? 0;
      intereses = baseARS * pct;
    }

    const total = baseARS + impPais + percepcion + recargoBanco + aduana + intereses;

    return {
      totalUSD, baseARS, impPais, percepcion, nota,
      recargoBanco, recargoPct,
      aduana, aduanaTag,
      intereses, cuotas,
      total, cotUsada: cot, cotOficial,
      tipoDolar,
    };
  }

  // ── Cálculo otros países ─────────────────────────────────────────────────────

  function calcularOtroPais(pais, precioUSD, envioUSD, cantidad) {
    const cfg      = CONFIG.paises[pais];
    if (!cfg) return null;

    const totalUSD  = precioUSD * cantidad + envioUSD;
    const cotLocal  = CONFIG.fallbackLocal[pais] ?? 1;
    const totalLocal = totalUSD * cotLocal;
    const ivaLocal   = totalLocal * (cfg.iva / 100);
    const arancelLocal = totalUSD > cfg.franquicia
      ? (totalUSD - cfg.franquicia) * cfg.arancel * cotLocal
      : 0;

    return {
      totalUSD, total: totalLocal + ivaLocal + arancelLocal,
      ivaLocal, arancelLocal, cotLocal,
    };
  }

  // ── Render helpers ───────────────────────────────────────────────────────────

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function renderBreakdownAR(res, paisCfg, cuotas) {
    const {
      totalUSD, baseARS, impPais, percepcion, nota,
      recargoBanco, recargoPct, aduana, aduanaTag,
      intereses, total, cotUsada, tipoDolar,
    } = res;

    document.getElementById('br-row-iva').hidden = true;
    document.getElementById('br-row-impPais').hidden = false;
    document.getElementById('br-row-percepcion').hidden = false;
    document.getElementById('br-row-banco').hidden = false;
    document.getElementById('br-row-intereses').hidden = false;

    document.getElementById('aduanaInfo').innerHTML = '📬 Franquicia Puerta a Puerta (correo): <strong>USD 200 libres de impuesto</strong>. Superar ese monto genera un arancel del 50% sobre el excedente.';
    document.getElementById('warningBox').textContent = '⚠️ Estimación basada en la normativa vigente en Argentina (2025). Los valores pueden variar según banco, fecha y regulaciones de AFIP. Válido para compras personales vía Correo Argentino / Puerta a Puerta (hasta USD 200 de franquicia).';

    setText('br-precioUSD',  `USD ${fmtDec(totalUSD)}`);
    setText('br-cotizacion', `$${fmtRate(cotUsada)} / USD`);
    setText('br-baseARS',    `$${fmt(baseARS)}`);

    // FIX: mostrar nota cuando impPais está incluido en la cotización tarjeta
    if (tipoDolar === 'tarjeta') {
      setText('br-impPais',    `(${nota})`);
      setText('br-percepcion', `(${nota})`);
    } else {
      setText('br-impPais',    impPais    > 0 ? `+ $${fmt(impPais)}`    : '—');
      setText('br-percepcion', percepcion > 0 ? `+ $${fmt(percepcion)}` : '—');
    }

    setText('br-banco',     recargoBanco > 0 ? `+ $${fmt(recargoBanco)}` : 'Sin recargo');
    const bancoTag = document.getElementById('br-bancoTag');
    if (bancoTag) bancoTag.textContent = `${(recargoPct * 100).toFixed(0)}%`;

    setText('br-aduana', aduana > 0 ? `+ $${fmt(aduana)}` : 'Franquicia OK');
    const aduanaTagEl = document.getElementById('br-aduanaTag');
    if (aduanaTagEl) aduanaTagEl.textContent = aduanaTag;

    setText('br-intereses', intereses > 0 ? `+ $${fmt(intereses)}` : '—');
    setText('br-total',     `$${fmt(total)}`);
    setText('totalPesos',   `$${fmt(total)}`);

    if (State.get('cardType') === 'credito' && cuotas > 1) {
      setText('totalCurrency', `${paisCfg.moneda} · $${fmt(total / cuotas)} × ${cuotas} cuotas`);
    } else {
      setText('totalCurrency', `${paisCfg.moneda} — ${paisCfg.monedaNombre}`);
    }

    if (totalUSD > 200) {
      UI.showAlert('⚠️ Superás los USD 200 de franquicia. Se aplicará arancel del 50% sobre el excedente (Puerta a Puerta / Correo Argentino).', 'warn');
    } else {
      UI.clearAlert();
    }
  }

  function renderBreakdownOtro(res, pais, paisCfg) {
    const { totalUSD, total, ivaLocal, arancelLocal, cotLocal } = res;

    document.getElementById('br-row-iva').hidden = false;
    document.getElementById('br-row-impPais').hidden = true;
    document.getElementById('br-row-percepcion').hidden = true;
    document.getElementById('br-row-banco').hidden = true;
    document.getElementById('br-row-intereses').hidden = true;

    document.getElementById('aduanaInfo').innerHTML = `📬 Franquicia aduanera: <strong>USD ${paisCfg.franquicia} libres de impuesto</strong>. Superar ese monto genera un arancel del ${paisCfg.arancel * 100}% sobre el excedente.`;
    document.getElementById('warningBox').textContent = `⚠️ Estimación basada en las tasas generales de ${paisCfg.nombre}. Verifica con tu entidad aduanera para detalles específicos.`;

    setText('br-precioUSD',  `USD ${fmtDec(totalUSD)}`);
    setText('br-cotizacion', `${fmtRate(cotLocal)} / USD (referencia)`);
    setText('br-baseARS',    `${paisCfg.simbolo}${fmt(totalUSD * cotLocal)}`);
    
    setText('br-iva',        `+ ${paisCfg.simbolo}${fmt(ivaLocal)}`);
    setText('br-ivaTag',     `${paisCfg.iva}%`);

    setText('br-aduana',     arancelLocal > 0 ? `+ ${paisCfg.simbolo}${fmt(arancelLocal)}` : 'Franquicia OK');

    const aduanaTagEl = document.getElementById('br-aduanaTag');
    if (aduanaTagEl) aduanaTagEl.textContent = arancelLocal > 0
      ? `>${paisCfg.franquicia} USD`
      : `< ${paisCfg.franquicia} USD`;

    setText('br-intereses',  '—');
    setText('br-total',      `${paisCfg.simbolo}${fmt(total)}`);
    setText('totalPesos',    `${paisCfg.simbolo}${fmt(total)}`);
    setText('totalCurrency', `${paisCfg.moneda} — ${paisCfg.monedaNombre}`);
    UI.clearAlert();
  }

  // ── Público ──────────────────────────────────────────────────────────────────

  function calcular() {
    const pais    = State.get('pais');
    const paisCfg = CONFIG.paises[pais];
    if (!paisCfg) return;

    const precioUSD = getPrecioUSD();
    const envioUSD  = parseFloat(document.getElementById('envio')?.value)   || 0;
    const cantidad  = parseInt(document.getElementById('cantidad')?.value)   || 1;
    const cuotas    = parseInt(document.getElementById('cuotas')?.value)     || 1;

    if (pais === 'AR') {
      renderBreakdownAR(calcularAR(precioUSD, envioUSD, cantidad, cuotas), paisCfg, cuotas);
    } else {
      const res = calcularOtroPais(pais, precioUSD, envioUSD, cantidad);
      if (res) renderBreakdownOtro(res, pais, paisCfg);
    }
  }

  return { calcular };
})();
