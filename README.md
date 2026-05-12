# ImportaYa 🛒

**Calculadora de compras internacionales con cotización del dólar en tiempo real**

Sabé exactamente cuánto vas a pagar en pesos —o en la moneda de tu país— antes de confirmar una compra en AliExpress, Temu, Shein, Amazon y más.

![ImportaYa preview](https://img.shields.io/badge/status-activo-brightgreen?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/stack-Vanilla%20JS-f7df1e?style=flat-square&logo=javascript)
![Sin dependencias](https://img.shields.io/badge/dependencias-ninguna-blue?style=flat-square)
![License MIT](https://img.shields.io/badge/licencia-MIT-green?style=flat-square)

---

## ¿Qué calcula?

Para **Argentina**, el precio final incluye:

| Concepto | Valor |
|---|---|
| Impuesto PAIS | 30% sobre base oficial |
| Percepción AFIP (RG 4815) | 45% sobre base oficial |
| Recargo bancario | Según entidad (configurable) |
| Arancel de aduana | 50% sobre excedente de USD 200 franquicia |
| Intereses de cuotas | Promedio de mercado por cuota |

Para otros países latinoamericanos: conversión local + IVA + arancel básico.

---

## Funcionalidades

- 💱 **Cotización en tiempo real** — Dólar Tarjeta, Blue, Oficial, MEP, CCL y Cripto desde [DolarAPI](https://dolarapi.com). Se refresca automáticamente cada 3 minutos.
- 🛒 **8 tiendas incluidas** — AliExpress, Temu, Shein, Amazon, eBay, Etsy, Wish, Zara y "Otra".
- 🔗 **Detección por link** — Pegá la URL del producto y detecta la tienda automáticamente.
- 💰 **8 monedas de entrada** — USD, EUR, CNY (Yuan), GBP, BRL, MXN, USDT y BTC.
- 💳 **Tarjetas débito, crédito y prepaga** — Con selección de cuotas y banco.
- 🏦 **14 bancos argentinos** — Galicia, Santander, BBVA, Macro, Nación, Brubank, Naranja X, Mercado Pago, Lemon, Ualá y más.
- 🌍 **10 países** — Argentina, México, Colombia, Chile, Perú, Uruguay, Brasil, Paraguay, Bolivia y Ecuador.
- 📦 **Cálculo de aduana** — Alerta automática si superás los USD 200 de franquicia.

---

## Demo

> 🚀 **[Ver demo en vivo]( https://rodria45.github.io/ImportaYa/ )**

---

## Estructura del proyecto

```
importaya/
├── index.html              # HTML principal
├── css/
│   ├── reset.css           # Reset de estilos
│   ├── tokens.css          # Variables de diseño (colores, fuentes, espaciado)
│   ├── layout.css          # Layout, grid, contenedores
│   ├── components.css      # Componentes (cards, botones, inputs, pills)
│   ├── result.css          # Panel de resultado y breakdown
│   └── animations.css      # Animaciones y transiciones
└── js/
    ├── config.js           # Datos estáticos (países, tiendas, bancos, impuestos)
    ├── state.js            # Estado global reactivo
    ├── calculator.js       # Motor de cálculo de precios e impuestos
    ├── ui.js               # Renderizado dinámico e interacciones
    ├── api.js              # Fetch de cotizaciones en tiempo real
    └── main.js             # Bootstrap de la aplicación
```

### Flujo de datos

```
DolarAPI / Frankfurter / CoinGecko
           ↓
         api.js          ← fetch en tiempo real
           ↓
        state.js         ← estado global reactivo
       ↙        ↘
   ui.js      calculator.js
  (render)     (cálculo)
       ↘        ↙
       index.html
```

---

## Instalación local

No requiere ningún servidor ni dependencias. Solo cloná y abrí:

```bash
git clone https://github.com/tuusuario/importaya.git
cd importaya
# Abrí index.html en tu navegador, o usá un servidor local:
npx serve .
# o
python3 -m http.server 8080
```

> ⚠️ Las APIs de cotización requieren conexión a internet. En local el CORS puede bloquear algunas peticiones; usá un servidor local (como `npx serve`) en lugar de abrir el archivo directamente.

---

## Publicar en GitHub Pages

1. Subí el repositorio a GitHub.
2. Entrá a **Settings → Pages**.
3. En *Source*, seleccioná `main` branch / `/ (root)`.
4. ¡Listo! En unos minutos vas a tener tu URL `https://tuusuario.github.io/importaya`.

---

## APIs utilizadas

| API | Uso | Límite free |
|---|---|---|
| [DolarAPI](https://dolarapi.com) | Cotizaciones USD en Argentina | Sin límite |
| [Frankfurter](https://frankfurter.app) | Tasas EUR, CNY, GBP, BRL, MXN | Sin límite |
| [CoinGecko](https://coingecko.com/api) | Precio BTC/USD | 30 req/min |

Si alguna API no responde, la app usa los valores de fallback definidos en `config.js`.

---

## Contribuir

¡Las contribuciones son bienvenidas!

```bash
# Fork → cloná → hacé tus cambios → Pull Request
git checkout -b feature/mi-mejora
git commit -m "feat: descripción del cambio"
git push origin feature/mi-mejora
```

### Ideas para contribuir

- [ ] Agregar más países y sus regímenes de importación
- [ ] Historial de cotizaciones (gráfico)
- [ ] Modo oscuro / claro
- [ ] PWA (funcione offline)
- [ ] Exportar cálculo como PDF o imagen
- [ ] Comparador de tiendas lado a lado
- [ ] Chrome Extension para calcular directamente en la página de la tienda

---

## Aviso legal

Esta herramienta es orientativa. Los valores de impuestos pueden cambiar según resoluciones de AFIP, BCRA u otros organismos. Siempre verificá con tu banco o contador antes de tomar decisiones financieras.

Los porcentajes utilizados corresponden a la normativa vigente en Argentina a 2026:
- Impuesto PAIS: 30% (Ley 27.541)
- Percepción AFIP: 45% (RG 4815/2020 y modificatorias)

---

## Licencia

MIT — Libre para usar, modificar y distribuir. Ver [LICENSE](LICENSE).

---

<p align="center">Hecho con ❤️ en Argentina 🇦🇷</p>
