/**
 * main.js — Punto de entrada de ImportaYa.
 *
 * Orden de inicialización:
 *  1. DOM listo
 *  2. UI.init()   → renderiza componentes dinámicos, adjunta listeners
 *  3. API.init()  → primera carga de cotizaciones + auto-refresh
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Renderizar UI (con valores de fallback del State)
  UI.init();

  // 2. Cargar cotizaciones reales (dispara Calculator.calcular() al terminar)
  API.init();

  // 3. Mensaje de consola amigable para devs 😄
  console.log(
    '%c ImportaYa 🛒 ',
    'background:#00e5ff;color:#060a0f;font-weight:bold;padding:4px 10px;border-radius:4px;',
    '\nCalculadora de compras internacionales · github.com/tuusuario/importaya'
  );

  // 4. Registrar Service Worker para PWA (Offline Support)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(
        (registration) => {
          console.log('SW registrado con éxito:', registration.scope);
        },
        (err) => {
          console.log('Falló el registro del SW:', err);
        }
      );
    });
  }
});
