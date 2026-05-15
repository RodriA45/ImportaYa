/**
 * config.js — Datos de configuración estáticos:
 * países, tiendas, bancos, impuestos por país.
 */

const CONFIG = {

  // ── Países ──────────────────────────────────────────────
  paises: {
    AR: {
      nombre: 'Argentina',
      moneda: 'ARS',
      monedaNombre: 'Peso Argentino',
      simbolo: '$',
      iva: 21,
      impPais: 0,        // Impuesto PAIS eliminado
      percepcion: 0,     // Se calcula dinámicamente desde API
      franquicia: 200,   // Franquicia puerta a puerta en USD
      arancel: 0.50,     // Arancel sobre excedente franquicia
    },
    MX: { nombre:'México',    moneda:'MXN', monedaNombre:'Peso Mexicano',    simbolo:'$',  iva:16, impPais:0, percepcion:0, franquicia:500, arancel:0.16 },
    CO: { nombre:'Colombia',  moneda:'COP', monedaNombre:'Peso Colombiano',  simbolo:'$',  iva:19, impPais:0, percepcion:0, franquicia:200, arancel:0.15 },
    CL: { nombre:'Chile',     moneda:'CLP', monedaNombre:'Peso Chileno',     simbolo:'$',  iva:19, impPais:0, percepcion:0, franquicia:41,  arancel:0.06 },
    PE: { nombre:'Perú',      moneda:'PEN', monedaNombre:'Sol Peruano',      simbolo:'S/', iva:18, impPais:0, percepcion:0, franquicia:200, arancel:0.12 },
    UY: { nombre:'Uruguay',   moneda:'UYU', monedaNombre:'Peso Uruguayo',    simbolo:'$',  iva:22, impPais:0, percepcion:0, franquicia:200, arancel:0.20 },
    BR: { nombre:'Brasil',    moneda:'BRL', monedaNombre:'Real Brasileño',   simbolo:'R$', iva:12, impPais:0, percepcion:0, franquicia:50,  arancel:0.60 },
    PY: { nombre:'Paraguay',  moneda:'PYG', monedaNombre:'Guaraní Paraguayo',simbolo:'₲',  iva:10, impPais:0, percepcion:0, franquicia:200, arancel:0.10 },
  },

  // Cotización aproximada: 1 USD = X moneda local (fallback si no hay API)
  fallbackLocal: {
    AR: 1850, MX: 17.5, CO: 4000, CL: 960,
    PE: 3.7,  UY: 38,   BR: 5.1,  PY: 7300,
  },

  // ── Tiendas ──────────────────────────────────────────────
  tiendas: [
    { id: 'aliexpress', nombre: 'AliExpress', emoji: '📦', envioDefault: 0,  origen: 'China' },
    { id: 'temu',       nombre: 'Temu',       emoji: '🛍️', envioDefault: 0,  origen: 'China' },
    { id: 'shein',      nombre: 'Shein',      emoji: '👗', envioDefault: 0,  origen: 'China' },
    { id: 'amazon',     nombre: 'Amazon',     emoji: '🅰️', envioDefault: 8,  origen: 'EEUU' },
    { id: 'ebay',       nombre: 'eBay',       emoji: '🔨', envioDefault: 12, origen: 'EEUU' },
    { id: 'etsy',       nombre: 'Etsy',       emoji: '🎨', envioDefault: 15, origen: 'EEUU' },
    { id: 'wish',       nombre: 'Wish',       emoji: '⭐', envioDefault: 0,  origen: 'China' },
    { id: 'zara',       nombre: 'Zara',       emoji: '🧥', envioDefault: 10, origen: 'España' },
    { id: 'otra',       nombre: 'Otra',       emoji: '🌐', envioDefault: 10, origen: 'Varios' },
  ],

  // Regex para detectar tienda desde URL
  tiendaRegex: {
    aliexpress: /aliexpress\.com/i,
    temu:       /temu\.com/i,
    shein:      /shein\.com/i,
    amazon:     /amazon\.(com|com\.br|com\.mx|co\.uk|de|fr|it|es)/i,
    ebay:       /ebay\.(com|com\.au|co\.uk|de)/i,
    etsy:       /etsy\.com/i,
    wish:       /wish\.com/i,
    zara:       /zara\.com/i,
  },

  // ── Bancos Argentina ─────────────────────────────────────
  bancos: [
    { id: 'galicia',     nombre: 'Galicia',      color: '#e11d48', recargo: 0 },
    { id: 'santander',   nombre: 'Santander',    color: '#dc2626', recargo: 0 },
    { id: 'bbva',        nombre: 'BBVA',         color: '#1d4ed8', recargo: 0 },
    { id: 'macro',       nombre: 'Macro',        color: '#f59e0b', recargo: 0 },
    { id: 'nacion',      nombre: 'Nación',       color: '#2563eb', recargo: 0 },
    { id: 'provincia',   nombre: 'Provincia',    color: '#0891b2', recargo: 0 },
    { id: 'hsbc',        nombre: 'HSBC',         color: '#dc2626', recargo: 0 },
    { id: 'icbc',        nombre: 'ICBC',         color: '#b91c1c', recargo: 0 },
    { id: 'brubank',     nombre: 'Brubank',      color: '#7c3aed', recargo: 0 },
    { id: 'naranja',     nombre: 'Naranja X',    color: '#ea580c', recargo: 0 },
    { id: 'mercadopago', nombre: 'Mercado Pago', color: '#00aeef', recargo: 0 },
    { id: 'lemon',       nombre: 'Lemon',        color: '#84cc16', recargo: 0 },
    { id: 'uala',        nombre: 'Ualá',         color: '#a855f7', recargo: 0 },
    { id: 'personal',    nombre: 'Personal Pay', color: '#06b6d4', recargo: 0 },
  ],

  // ── Monedas de entrada ───────────────────────────────────
  monedas: [
    { id: 'usd',  simbolo: '$',  label: 'USD',  nombre: 'Dólar estadounidense' },
    { id: 'eur',  simbolo: '€',  label: 'EUR',  nombre: 'Euro' },
    { id: 'cny',  simbolo: '¥',  label: 'CNY',  nombre: 'Yuan chino' },
    { id: 'gbp',  simbolo: '£',  label: 'GBP',  nombre: 'Libra esterlina' },
    { id: 'brl',  simbolo: 'R$', label: 'BRL',  nombre: 'Real brasileño' },
    { id: 'mxn',  simbolo: '$',  label: 'MXN',  nombre: 'Peso mexicano' },
    { id: 'usdt', simbolo: '₮',  label: 'USDT', nombre: 'Tether (stablecoin)' },
    { id: 'btc',  simbolo: '₿',  label: 'BTC',  nombre: 'Bitcoin' },
  ],

};
