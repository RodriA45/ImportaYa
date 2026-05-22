/**
 * config.js - Configuracion estatica: paises, tiendas, bancos, impuestos.
 */

const CONFIG = {

  // --- Paises ---
  paises: {
    AR: {
      nombre: 'Argentina',
      moneda: 'ARS',
      monedaNombre: 'Peso Argentino',
      simbolo: '$',
      iva: 21,
      impPais: 0,
      percepcion: 0,
      franquicia: 200,
      arancel: 0.50,
    },
    MX: { nombre:'Mexico',    moneda:'MXN', monedaNombre:'Peso Mexicano',     simbolo:'$',  iva:16, impPais:0, percepcion:0, franquicia:500,  arancel:0.16 },
    CO: { nombre:'Colombia',  moneda:'COP', monedaNombre:'Peso Colombiano',   simbolo:'$',  iva:19, impPais:0, percepcion:0, franquicia:200,  arancel:0.15 },
    CL: { nombre:'Chile',     moneda:'CLP', monedaNombre:'Peso Chileno',      simbolo:'$',  iva:19, impPais:0, percepcion:0, franquicia:41,   arancel:0.06 },
    PE: { nombre:'Peru',      moneda:'PEN', monedaNombre:'Sol Peruano',       simbolo:'S/', iva:18, impPais:0, percepcion:0, franquicia:200,  arancel:0.12 },
    UY: { nombre:'Uruguay',   moneda:'UYU', monedaNombre:'Peso Uruguayo',     simbolo:'$',  iva:22, impPais:0, percepcion:0, franquicia:200,  arancel:0.20 },
    BR: { nombre:'Brasil',    moneda:'BRL', monedaNombre:'Real Brasileno',    simbolo:'R$', iva:12, impPais:0, percepcion:0, franquicia:50,   arancel:0.60 },
    PY: { nombre:'Paraguay',  moneda:'PYG', monedaNombre:'Guarani Paraguayo', simbolo:'Gs', iva:10, impPais:0, percepcion:0, franquicia:200,  arancel:0.10 },
    BO: { nombre:'Bolivia',   moneda:'BOB', monedaNombre:'Boliviano',         simbolo:'Bs', iva:13, impPais:0, percepcion:0, franquicia:100,  arancel:0.10 },
    EC: { nombre:'Ecuador',   moneda:'USD', monedaNombre:'Dolar Americano',   simbolo:'$',  iva:15, impPais:0, percepcion:0, franquicia:400,  arancel:0.10 },
  },

  // Tasa de cambio de fallback: 1 USD = X moneda local
  fallbackLocal: {
    AR: 1850, MX: 17.5, CO: 4000, CL: 960,
    PE: 3.7,  UY: 38,   BR: 5.1,  PY: 7300, BO: 6.91, EC: 1.0,
  },

  // --- Tiendas ---
  tiendas: [
    { id: 'aliexpress', nombre: 'AliExpress', emoji: '\uD83D\uDCE6', envioDefault: 0,  origen: 'China'   },
    { id: 'temu',       nombre: 'Temu',       emoji: '\uD83D\uDED2', envioDefault: 0,  origen: 'China'   },
    { id: 'shein',      nombre: 'Shein',      emoji: '\uD83D\uDC57', envioDefault: 0,  origen: 'China'   },
    { id: 'amazon',     nombre: 'Amazon',     emoji: '\uD83D\uDCE6', envioDefault: 8,  origen: 'EEUU'    },
    { id: 'ebay',       nombre: 'eBay',       emoji: '\uD83D\uDD28', envioDefault: 12, origen: 'EEUU'    },
    { id: 'etsy',       nombre: 'Etsy',       emoji: '\uD83C\uDFA8', envioDefault: 15, origen: 'EEUU'    },
    { id: 'wish',       nombre: 'Wish',       emoji: '\u2B50',       envioDefault: 0,  origen: 'China'   },
    { id: 'zara',       nombre: 'Zara',       emoji: '\uD83E\uDDE5', envioDefault: 10, origen: 'Espana'  },
    { id: 'otra',       nombre: 'Otra',       emoji: '\uD83C\uDF10', envioDefault: 10, origen: 'Varios'  },
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

  // --- Bancos Argentina ---
  bancos: [
    { id: 'galicia',     nombre: 'Galicia',      color: '#e11d48', recargo: 0 },
    { id: 'santander',   nombre: 'Santander',    color: '#dc2626', recargo: 0 },
    { id: 'bbva',        nombre: 'BBVA',         color: '#1d4ed8', recargo: 0 },
    { id: 'macro',       nombre: 'Macro',        color: '#f59e0b', recargo: 0 },
    { id: 'nacion',      nombre: 'Nacion',       color: '#2563eb', recargo: 0 },
    { id: 'provincia',   nombre: 'Provincia',    color: '#0891b2', recargo: 0 },
    { id: 'hsbc',        nombre: 'HSBC',         color: '#dc2626', recargo: 0 },
    { id: 'icbc',        nombre: 'ICBC',         color: '#b91c1c', recargo: 0 },
    { id: 'brubank',     nombre: 'Brubank',      color: '#7c3aed', recargo: 0 },
    { id: 'naranja',     nombre: 'Naranja X',    color: '#ea580c', recargo: 0 },
    { id: 'mercadopago', nombre: 'Mercado Pago', color: '#00aeef', recargo: 0 },
    { id: 'lemon',       nombre: 'Lemon',        color: '#84cc16', recargo: 0 },
    { id: 'uala',        nombre: 'Uala',         color: '#a855f7', recargo: 0 },
    { id: 'personal',    nombre: 'Personal Pay', color: '#06b6d4', recargo: 0 },
  ],

  // --- Monedas de entrada ---
  monedas: [
    { id: 'usd',  simbolo: '$',   label: 'USD',  nombre: 'Dolar estadounidense' },
    { id: 'eur',  simbolo: '\u20AC',   label: 'EUR',  nombre: 'Euro'                },
    { id: 'cny',  simbolo: '\uFFE5',   label: 'CNY',  nombre: 'Yuan chino'          },
    { id: 'gbp',  simbolo: '\u00A3',   label: 'GBP',  nombre: 'Libra esterlina'     },
    { id: 'brl',  simbolo: 'R$',  label: 'BRL',  nombre: 'Real brasileno'      },
    { id: 'mxn',  simbolo: '$',   label: 'MXN',  nombre: 'Peso mexicano'       },
    { id: 'usdt', simbolo: 'T',   label: 'USDT', nombre: 'Tether (stablecoin)' },
    { id: 'btc',  simbolo: 'B',   label: 'BTC',  nombre: 'Bitcoin'             },
  ],

};
