/**
 * calculator.js - Motor de calculo de precios de importacion.
 */

const Calculator = (() => {

  function fmt(n) {
    return Math.round(n).toLocaleString('es-AR');
  }

  function fmtRate(n) {
    return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function fmtDec(n, dec) {
    dec = dec !== undefined ? dec : 2;
    return n.toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Precio ingresado convertido a USD
  function getPrecioUSD() {
    var moneda  = State.get('monedaInput');
    var inputEl = document.getElementById('precio-' + moneda);
    var raw     = inputEl ? (parseFloat(inputEl.value) || 0) : 0;
    var tasas   = State.get('tasasAUSD');
    var rate    = (tasas && tasas[moneda] !== undefined) ? tasas[moneda] : 1;
    return raw * rate;
  }

  // ---- Calculo Argentina ----

  function calcularAR(precioUSD, envioUSD, cantidad) {
    var cot          = State.getCotizacionActiva();
    var cotizaciones = State.get('cotizaciones');
    var tipoDolar    = State.get('dolarSeleccionado');
    var cotOficial   = cotizaciones.oficial || 1130;
    var totalUSD     = precioUSD * cantidad + envioUSD;
    var baseARS      = totalUSD * cot;
    var impPais      = 0;
    var percepcion   = 0;
    var nota         = '';

    if (tipoDolar === 'tarjeta') {
      nota = 'incluidos en cotizacion tarjeta';
    } else if (tipoDolar === 'oficial') {
      var baseOficialARS = totalUSD * cotOficial;
      var cfgAR = CONFIG.paises.AR;
      impPais    = baseOficialARS * (cfgAR.impPais / 100);
      percepcion = baseOficialARS * (cfgAR.percepcion / 100);
      nota       = 'base oficial $' + fmt(cotOficial) + '/USD';
    } else if (tipoDolar === 'custom') {
      nota = cot > 0 ? 'cotizacion manual' : 'ingresa una cotizacion arriba';
    } else {
      nota = 'No aplican para esta cotizacion';
    }

    // Recargo bancario
    var bancoActivo  = CONFIG.bancos.find(function(b) { return b.id === State.get('banco'); }) || {};
    var recargoPct   = (bancoActivo.recargo !== undefined) ? bancoActivo.recargo : 0;
    var recargoBanco = baseARS * recargoPct;

    // Aduana (siempre al tipo oficial en Argentina)
    var aduana    = 0;
    var aduanaTag = '';
    if (totalUSD > 200) {
      aduana    = (totalUSD - 200) * 0.50 * cotOficial;
      aduanaTag = '50% sobre USD ' + fmtDec(totalUSD - 200);
    } else {
      aduanaTag = '< USD 200 OK';
    }

    var total = baseARS + impPais + percepcion + recargoBanco + aduana;

    return { totalUSD: totalUSD, baseARS: baseARS, impPais: impPais, percepcion: percepcion,
             nota: nota, recargoBanco: recargoBanco, recargoPct: recargoPct,
             aduana: aduana, aduanaTag: aduanaTag, total: total,
             cotUsada: cot, cotOficial: cotOficial, tipoDolar: tipoDolar };
  }

  // ---- Calculo otros paises ----

  function calcularOtroPais(pais, precioUSD, envioUSD, cantidad) {
    var cfg = CONFIG.paises[pais];
    if (!cfg) return null;

    var totalUSD     = precioUSD * cantidad + envioUSD;
    var tasasGlobales = State.get('tasasGlobales') || {};
    var cotLocal     = (tasasGlobales[cfg.moneda] !== undefined)
                         ? tasasGlobales[cfg.moneda]
                         : (CONFIG.fallbackLocal[pais] !== undefined ? CONFIG.fallbackLocal[pais] : 1);
    var totalLocal   = totalUSD * cotLocal;
    var ivaLocal     = totalLocal * (cfg.iva / 100);
    var arancelLocal = totalUSD > cfg.franquicia
                         ? (totalUSD - cfg.franquicia) * cfg.arancel * cotLocal
                         : 0;

    return { totalUSD: totalUSD, total: totalLocal + ivaLocal + arancelLocal,
             ivaLocal: ivaLocal, arancelLocal: arancelLocal, cotLocal: cotLocal };
  }

  // ---- Render Argentina ----

  function renderBreakdownAR(res, paisCfg) {
    var totalUSD     = res.totalUSD;
    var baseARS      = res.baseARS;
    var impPais      = res.impPais;
    var percepcion   = res.percepcion;
    var nota         = res.nota;
    var recargoBanco = res.recargoBanco;
    var recargoPct   = res.recargoPct;
    var aduana       = res.aduana;
    var aduanaTag    = res.aduanaTag;
    var total        = res.total;
    var cotUsada     = res.cotUsada;
    var tipoDolar    = res.tipoDolar;

    var rowIva  = document.getElementById('br-row-iva');
    var rowImp  = document.getElementById('br-row-impPais');
    var rowPerc = document.getElementById('br-row-percepcion');
    var rowBco  = document.getElementById('br-row-banco');
    if (rowIva)  rowIva.hidden  = true;
    if (rowImp)  rowImp.hidden  = (paisCfg.impPais === 0);
    if (rowPerc) rowPerc.hidden = (paisCfg.percepcion === 0);
    if (rowBco)  rowBco.hidden  = false;

    var impPaisTagEl = document.getElementById('br-impPaisTag');
    if (impPaisTagEl) impPaisTagEl.textContent = paisCfg.impPais + '%';

    var percTagEl = document.getElementById('br-percepcionTag');
    if (percTagEl) percTagEl.textContent = paisCfg.percepcion + '%';

    var aduanaInfo = document.getElementById('aduanaInfo');
    if (aduanaInfo) aduanaInfo.textContent = 'Franquicia Puerta a Puerta (correo): USD 200 libres de impuesto. Superar ese monto genera un arancel del 50% sobre el excedente.';

    var warnBox = document.getElementById('warningBox');
    if (warnBox) warnBox.textContent = 'Estimacion basada en la normativa vigente en Argentina (2025). Valido para compras personales via Correo Argentino / Puerta a Puerta (hasta USD 200 de franquicia).';

    // Si es custom y no hay cotizacion, mostrar aviso claro
    if (tipoDolar === 'custom' && cotUsada <= 0) {
      setText('totalPesos',    '$0');
      setText('br-total',      '$0');
      setText('br-precioUSD',  'USD ' + fmtDec(totalUSD));
      setText('br-cotizacion', 'Ingresa una cotizacion en Cotizaciones > Manual');
      setText('br-baseARS',    '$0');
      setText('br-impPais',    '—');
      setText('br-percepcion', '—');
      setText('br-banco',      'Sin recargo');
      setText('br-aduana',     'Franquicia OK');
      UI.showAlert('Seleccionaste cotizacion Manual. Ve a la seccion "Cotizaciones" e ingresa el valor del dolar.', 'warn');
      return;
    }

    setText('br-precioUSD',  'USD ' + fmtDec(totalUSD));
    setText('br-cotizacion', '$' + fmtRate(cotUsada) + ' / USD');
    setText('br-baseARS',    '$' + fmt(baseARS));

    if (tipoDolar === 'tarjeta') {
      setText('br-impPais',    '(' + nota + ')');
      setText('br-percepcion', '(' + nota + ')');
    } else {
      setText('br-impPais',    impPais    > 0 ? '+ $' + fmt(impPais)    : '\u2014');
      setText('br-percepcion', percepcion > 0 ? '+ $' + fmt(percepcion) : '\u2014');
    }

    setText('br-banco', recargoBanco > 0 ? '+ $' + fmt(recargoBanco) : 'Sin recargo');
    var bancoTag = document.getElementById('br-bancoTag');
    if (bancoTag) bancoTag.textContent = (recargoPct * 100).toFixed(0) + '%';

    setText('br-aduana', aduana > 0 ? '+ $' + fmt(aduana) : 'Franquicia OK');
    var aduanaTagEl = document.getElementById('br-aduanaTag');
    if (aduanaTagEl) aduanaTagEl.textContent = aduanaTag;

    setText('br-total',      '$' + fmt(total));
    setText('totalPesos',    '$' + fmt(total));
    setText('totalCurrency', paisCfg.moneda + ' \u2014 ' + paisCfg.monedaNombre);

    if (totalUSD > 200) {
      UI.showAlert('Superas los USD 200 de franquicia. Se aplicara arancel del 50% sobre el excedente (Puerta a Puerta / Correo Argentino).', 'warn');
    } else {
      UI.clearAlert();
    }
  }

  // ---- Render otros paises ----

  function renderBreakdownOtro(res, pais, paisCfg) {
    var totalUSD    = res.totalUSD;
    var total       = res.total;
    var ivaLocal    = res.ivaLocal;
    var arancelLocal = res.arancelLocal;
    var cotLocal    = res.cotLocal;

    var rowIva  = document.getElementById('br-row-iva');
    var rowImp  = document.getElementById('br-row-impPais');
    var rowPerc = document.getElementById('br-row-percepcion');
    var rowBco  = document.getElementById('br-row-banco');
    if (rowIva)  rowIva.hidden  = false;
    if (rowImp)  rowImp.hidden  = true;
    if (rowPerc) rowPerc.hidden = true;
    if (rowBco)  rowBco.hidden  = true;

    var aduanaInfo = document.getElementById('aduanaInfo');
    if (aduanaInfo) aduanaInfo.textContent = 'Franquicia aduanera: USD ' + paisCfg.franquicia + ' libres de impuesto. Superar ese monto genera un arancel del ' + (paisCfg.arancel * 100) + '% sobre el excedente.';

    var warnBox = document.getElementById('warningBox');
    if (warnBox) warnBox.textContent = 'Estimacion basada en las tasas generales de ' + paisCfg.nombre + '. Verifica con tu entidad aduanera para detalles especificos.';

    setText('br-precioUSD',  'USD ' + fmtDec(totalUSD));
    setText('br-cotizacion', fmtRate(cotLocal) + ' / USD (referencia)');
    setText('br-baseARS',    paisCfg.simbolo + fmt(totalUSD * cotLocal));
    setText('br-iva',        '+ ' + paisCfg.simbolo + fmt(ivaLocal));
    setText('br-ivaTag',     paisCfg.iva + '%');
    setText('br-aduana',     arancelLocal > 0 ? '+ ' + paisCfg.simbolo + fmt(arancelLocal) : 'Franquicia OK');

    var aduanaTagEl = document.getElementById('br-aduanaTag');
    if (aduanaTagEl) aduanaTagEl.textContent = arancelLocal > 0 ? '>' + paisCfg.franquicia + ' USD' : '< ' + paisCfg.franquicia + ' USD';

    setText('br-total',      paisCfg.simbolo + fmt(total));
    setText('totalPesos',    paisCfg.simbolo + fmt(total));
    setText('totalCurrency', paisCfg.moneda + ' \u2014 ' + paisCfg.monedaNombre);
    UI.clearAlert();
  }

  // ---- Funcion publica ----

  function calcular() {
    var pais    = State.get('pais');
    var paisCfg = CONFIG.paises[pais];
    if (!paisCfg) return;

    var precioUSD = Math.max(0, getPrecioUSD());
    var envioEl   = document.getElementById('envio');
    var cantEl    = document.getElementById('cantidad');
    var envioUSD  = Math.max(0, envioEl ? (parseFloat(envioEl.value) || 0) : 0);
    var cantidad  = Math.max(1, cantEl  ? (parseInt(cantEl.value,  10) || 1) : 1);

    if (pais === 'AR') {
      renderBreakdownAR(calcularAR(precioUSD, envioUSD, cantidad), paisCfg);
    } else {
      var res = calcularOtroPais(pais, precioUSD, envioUSD, cantidad);
      if (res) renderBreakdownOtro(res, pais, paisCfg);
    }
  }

  return { calcular: calcular };
})();
