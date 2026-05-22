/**
 * calculator.js - Motor de calculo. Integrado con UI.animateTotal y UI.setResultVisible.
 */

const Calculator = (() => {

  function fmt(n)         { return Math.round(n).toLocaleString('es-AR'); }
  function fmtRate(n)     { return n.toLocaleString('es-AR', { minimumFractionDigits:0, maximumFractionDigits:2 }); }
  function fmtDec(n, dec) { dec = dec !== undefined ? dec : 2; return n.toLocaleString('es-AR', { minimumFractionDigits:dec, maximumFractionDigits:dec }); }

  function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }

  function getPrecioUSD() {
    var moneda  = State.get('monedaInput');
    var inputEl = document.getElementById('precio-' + moneda);
    var raw     = inputEl ? (parseFloat(inputEl.value) || 0) : 0;
    var tasas   = State.get('tasasAUSD');
    return raw * ((tasas && tasas[moneda] !== undefined) ? tasas[moneda] : 1);
  }

  // ---- Argentina ----

  function calcularAR(precioUSD, envioUSD, cantidad) {
    var cot          = State.getCotizacionActiva();
    var cotizaciones = State.get('cotizaciones');
    var tipoDolar    = State.get('dolarSeleccionado');
    var cotOficial   = cotizaciones.oficial || 1130;
    var totalUSD     = precioUSD * cantidad + envioUSD;
    var baseARS      = totalUSD * cot;
    var impPais = 0, percepcion = 0, nota = '';

    if (tipoDolar === 'tarjeta') {
      nota = 'incluidos en cotizacion tarjeta';
    } else if (tipoDolar === 'oficial') {
      var bOARS = totalUSD * cotOficial;
      var cfgAR = CONFIG.paises.AR;
      impPais    = bOARS * (cfgAR.impPais / 100);
      percepcion = bOARS * (cfgAR.percepcion / 100);
      nota       = 'base oficial $' + fmt(cotOficial) + '/USD';
    } else if (tipoDolar === 'custom') {
      nota = cot > 0 ? 'cotizacion personalizada' : 'sin cotizacion manual';
    } else {
      nota = 'No aplican para esta cotizacion';
    }

    var banco = CONFIG.bancos.find(function(b) { return b.id === State.get('banco'); }) || {};
    var recargoPct   = banco.recargo !== undefined ? banco.recargo : 0;
    var recargoBanco = baseARS * recargoPct;

    var aduana = 0, aduanaTag = '';
    if (totalUSD > 200) {
      aduana    = (totalUSD - 200) * 0.50 * cotOficial;
      aduanaTag = '50% sobre USD ' + fmtDec(totalUSD - 200);
    } else {
      aduanaTag = '< USD 200 OK';
    }

    var total = baseARS + impPais + percepcion + recargoBanco + aduana;
    return { totalUSD:totalUSD, baseARS:baseARS, impPais:impPais, percepcion:percepcion,
             nota:nota, recargoBanco:recargoBanco, recargoPct:recargoPct,
             aduana:aduana, aduanaTag:aduanaTag, total:total,
             cotUsada:cot, cotOficial:cotOficial, tipoDolar:tipoDolar };
  }

  // ---- Otros paises ----

  function calcularOtroPais(pais, precioUSD, envioUSD, cantidad) {
    var cfg = CONFIG.paises[pais];
    if (!cfg) return null;
    var totalUSD  = precioUSD * cantidad + envioUSD;
    var tasasG    = State.get('tasasGlobales') || {};
    var cotLocal  = tasasG[cfg.moneda] !== undefined ? tasasG[cfg.moneda] : (CONFIG.fallbackLocal[pais] || 1);
    var totalLocal = totalUSD * cotLocal;
    var ivaLocal   = totalLocal * (cfg.iva / 100);
    var arancelLocal = totalUSD > cfg.franquicia ? (totalUSD - cfg.franquicia) * cfg.arancel * cotLocal : 0;
    return { totalUSD:totalUSD, total:totalLocal+ivaLocal+arancelLocal,
             ivaLocal:ivaLocal, arancelLocal:arancelLocal, cotLocal:cotLocal };
  }

  // ---- Render Argentina ----

  function renderBreakdownAR(res, paisCfg) {
    var rowIva  = document.getElementById('br-row-iva');
    var rowImp  = document.getElementById('br-row-impPais');
    var rowPerc = document.getElementById('br-row-percepcion');
    var rowBco  = document.getElementById('br-row-banco');
    if (rowIva)  rowIva.hidden  = true;
    if (rowImp)  rowImp.hidden  = paisCfg.impPais === 0;
    if (rowPerc) rowPerc.hidden = paisCfg.percepcion === 0;
    if (rowBco)  rowBco.hidden  = false;

    var iptEl = document.getElementById('br-impPaisTag');
    if (iptEl) iptEl.textContent = paisCfg.impPais + '%';
    var ptEl = document.getElementById('br-percepcionTag');
    if (ptEl) ptEl.textContent = paisCfg.percepcion + '%';

    var aduanaInfo = document.getElementById('aduanaInfo');
    if (aduanaInfo) aduanaInfo.textContent = 'Franquicia Puerta a Puerta: USD 200 libres de impuesto. Superar ese monto genera arancel del 50% sobre el excedente.';
    var warnBox = document.getElementById('warningBox');
    if (warnBox) warnBox.textContent = 'Estimacion basada en la normativa vigente en Argentina (2025). Valido para compras personales via Correo Argentino (hasta USD 200 de franquicia).';

    // Custom sin cotizacion ingresada
    if (res.tipoDolar === 'custom' && res.cotUsada <= 0) {
      UI.animateTotal('$0');
      setText('br-total',      '$0');
      setText('br-precioUSD',  'USD ' + fmtDec(res.totalUSD));
      setText('br-cotizacion', 'Ingresa una cotizacion manual arriba');
      setText('br-baseARS',    '$0');
      setText('br-impPais',    '\u2014');
      setText('br-percepcion', '\u2014');
      setText('br-banco',      'Sin recargo');
      setText('br-aduana',     'Franquicia OK');
      UI.showAlert('Seleccionaste cotizacion Manual. Ingresa el valor del dolar en el campo de arriba.', 'warn');
      return;
    }

    setText('br-precioUSD',  'USD ' + fmtDec(res.totalUSD));
    setText('br-cotizacion', '$' + fmtRate(res.cotUsada) + ' / USD');
    setText('br-baseARS',    '$' + fmt(res.baseARS));

    if (res.tipoDolar === 'tarjeta') {
      setText('br-impPais',    '(' + res.nota + ')');
      setText('br-percepcion', '(' + res.nota + ')');
    } else {
      setText('br-impPais',    res.impPais    > 0 ? '+ $' + fmt(res.impPais)    : '\u2014');
      setText('br-percepcion', res.percepcion > 0 ? '+ $' + fmt(res.percepcion) : '\u2014');
    }

    setText('br-banco', res.recargoBanco > 0 ? '+ $' + fmt(res.recargoBanco) : 'Sin recargo');
    var bTag = document.getElementById('br-bancoTag');
    if (bTag) bTag.textContent = (res.recargoPct * 100).toFixed(0) + '%';

    setText('br-aduana', res.aduana > 0 ? '+ $' + fmt(res.aduana) : 'Franquicia OK');
    var aTag = document.getElementById('br-aduanaTag');
    if (aTag) aTag.textContent = res.aduanaTag;

    UI.animateTotal('$' + fmt(res.total));
    setText('br-total',      '$' + fmt(res.total));
    setText('totalCurrency', paisCfg.moneda + ' \u2014 ' + paisCfg.monedaNombre);

    if (res.totalUSD > 200) {
      UI.showAlert('Superas los USD 200 de franquicia. Se aplicara arancel del 50% sobre el excedente.', 'warn');
    } else {
      UI.clearAlert();
    }
  }

  // ---- Render otros paises ----

  function renderBreakdownOtro(res, pais, paisCfg) {
    var rowIva  = document.getElementById('br-row-iva');
    var rowImp  = document.getElementById('br-row-impPais');
    var rowPerc = document.getElementById('br-row-percepcion');
    var rowBco  = document.getElementById('br-row-banco');
    if (rowIva)  rowIva.hidden  = false;
    if (rowImp)  rowImp.hidden  = true;
    if (rowPerc) rowPerc.hidden = true;
    if (rowBco)  rowBco.hidden  = true;

    var aduanaInfo = document.getElementById('aduanaInfo');
    if (aduanaInfo) aduanaInfo.textContent = 'Franquicia aduanera: USD ' + paisCfg.franquicia + ' libres de impuesto. Superar ese monto genera arancel del ' + (paisCfg.arancel * 100) + '% sobre el excedente.';
    var warnBox = document.getElementById('warningBox');
    if (warnBox) warnBox.textContent = 'Estimacion basada en tasas generales de ' + paisCfg.nombre + '. Verifica con tu entidad aduanera.';

    setText('br-precioUSD',  'USD ' + fmtDec(res.totalUSD));
    setText('br-cotizacion', fmtRate(res.cotLocal) + ' / USD (referencia)');
    setText('br-baseARS',    paisCfg.simbolo + fmt(res.totalUSD * res.cotLocal));
    setText('br-iva',        '+ ' + paisCfg.simbolo + fmt(res.ivaLocal));
    setText('br-ivaTag',     paisCfg.iva + '%');
    setText('br-aduana',     res.arancelLocal > 0 ? '+ ' + paisCfg.simbolo + fmt(res.arancelLocal) : 'Franquicia OK');
    var aTag = document.getElementById('br-aduanaTag');
    if (aTag) aTag.textContent = res.arancelLocal > 0 ? '>' + paisCfg.franquicia + ' USD' : '< ' + paisCfg.franquicia + ' USD';

    UI.animateTotal(paisCfg.simbolo + fmt(res.total));
    setText('br-total',      paisCfg.simbolo + fmt(res.total));
    setText('totalCurrency', paisCfg.moneda + ' \u2014 ' + paisCfg.monedaNombre);
    UI.clearAlert();
  }

  // ---- Calcular ----

  function calcular() {
    var pais    = State.get('pais');
    var paisCfg = CONFIG.paises[pais];
    if (!paisCfg) return;

    var precioUSD = Math.max(0, getPrecioUSD());
    var envioEl   = document.getElementById('envio');
    var cantEl    = document.getElementById('cantidad');
    var envioUSD  = Math.max(0, envioEl ? (parseFloat(envioEl.value) || 0) : 0);
    var cantidad  = Math.max(1, cantEl  ? (parseInt(cantEl.value, 10) || 1) : 1);

    // Mostrar estado vacio si no hay precio
    if (precioUSD === 0 && envioUSD === 0) {
      UI.setResultVisible(false);
      return;
    }

    UI.setResultVisible(true);

    if (pais === 'AR') {
      renderBreakdownAR(calcularAR(precioUSD, envioUSD, cantidad), paisCfg);
    } else {
      var res = calcularOtroPais(pais, precioUSD, envioUSD, cantidad);
      if (res) renderBreakdownOtro(res, pais, paisCfg);
    }
  }

  return { calcular: calcular };
})();
