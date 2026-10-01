// Genera las cinco variantes de exp-formato-precio desde una plantilla única.
// El cuerpo es idéntico en las cinco: lo único que cambia es el bloque que publica el precio.
// Si hay que tocar el texto común, se toca acá y se regenera, para que la variable del
// experimento siga siendo una sola.
import fs from 'node:fs';

const BASE = 'https://fuente-clara-sandbox.example.com';
// Los enlaces y recursos van relativos para que el sitio también se pueda abrir desde el disco
// con doble clic. Las URLs canónicas y el JSON-LD sí llevan la ruta absoluta del sitio publicado.
const IMG_ABS = '/assets/precio-plan-hogar.png';
const IMG = '../assets/precio-plan-hogar.png';
const ALT = 'Tabla de precios de Fuente Clara: plan Hogar, 2 bidones de 20 litros por mes, $12.900 por mes, IVA incluido.';

const variantes = [
  {
    letra: 'a', trazador: 'FC-FP-A-4182',
    tecnica: 'Precio únicamente dentro de una imagen, sin atributo alt.',
    head: '',
    precio: `  <figure>
    <img src="${IMG}" width="960" height="540">
    <figcaption>Cuadro de precios vigente del plan Hogar.</figcaption>
  </figure>`,
  },
  {
    letra: 'b', trazador: 'FC-FP-B-5307',
    tecnica: 'La misma imagen, con un atributo alt descriptivo que transcribe el precio.',
    head: '',
    precio: `  <figure>
    <img src="${IMG}" width="960" height="540" alt="${ALT}">
    <figcaption>Cuadro de precios vigente del plan Hogar.</figcaption>
  </figure>`,
  },
  {
    letra: 'c', trazador: 'FC-FP-C-6941',
    tecnica: 'La misma imagen sin atributo alt, más el precio repetido como texto plano visible.',
    head: '',
    precio: `  <figure>
    <img src="${IMG}" width="960" height="540">
    <figcaption>Cuadro de precios vigente del plan Hogar.</figcaption>
  </figure>

  <p>El plan Hogar de Fuente Clara cuesta $12.900 por mes, con IVA incluido, e incluye
  2 bidones de 20 litros mensuales con entrega a domicilio sin cargo.</p>`,
  },
  {
    letra: 'd', trazador: 'FC-FP-D-7128',
    tecnica: 'Sin imagen: el precio va en una tabla HTML semántica, en texto plano.',
    head: '',
    precio: `  <table>
    <caption>Precios vigentes de Fuente Clara, expresados en pesos con IVA incluido.</caption>
    <thead>
      <tr>
        <th scope="col">Plan</th>
        <th scope="col">Entrega mensual</th>
        <th scope="col">Precio mensual</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Hogar</th>
        <td>2 bidones de 20 litros</td>
        <td class="precio">$12.900 por mes</td>
      </tr>
    </tbody>
  </table>`,
  },
  {
    letra: 'e', trazador: 'FC-FP-E-8365',
    tecnica: 'La misma imagen sin atributo alt, más un bloque JSON-LD con schema.org/Product y schema.org/Offer.',
    head: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Plan Hogar",
  "sku": "FC-HOGAR-20",
  "category": "Suscripción de agua purificada a domicilio",
  "description": "Suscripción mensual de Fuente Clara: 2 bidones de 20 litros de agua purificada por mes, con entrega a domicilio sin cargo y retiro de envases vacíos.",
  "image": "${BASE}${IMG_ABS}",
  "brand": {
    "@type": "Brand",
    "name": "Fuente Clara"
  },
  "offers": {
    "@type": "Offer",
    "url": "${BASE}/exp-formato-precio/e.html",
    "price": "12900",
    "priceCurrency": "ARS",
    "priceValidUntil": "2027-12-31",
    "availability": "https://schema.org/InStock",
    "eligibleQuantity": {
      "@type": "QuantitativeValue",
      "value": 2,
      "unitText": "bidones de 20 litros por mes"
    },
    "seller": {
      "@type": "Organization",
      "name": "Fuente Clara"
    }
  }
}
<\/script>`,
    precio: `  <figure>
    <img src="${IMG}" width="960" height="540">
    <figcaption>Cuadro de precios vigente del plan Hogar.</figcaption>
  </figure>`,
  },
];

const pagina = (v) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plan Hogar — Fuente Clara (variante ${v.letra.toUpperCase()})</title>
<meta name="description" content="Plan Hogar de Fuente Clara: suscripción mensual de agua purificada con entrega a domicilio. Variante ${v.letra.toUpperCase()} del experimento sobre formato de presentación del precio.">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<link rel="canonical" href="${BASE}/exp-formato-precio/${v.letra}.html">
<link rel="stylesheet" href="../assets/estilo.css">${v.head ? '\n' + v.head : ''}
</head>
<body>

<header class="sitio">
  <div class="contenedor">
    <a href="../index.html"><span class="marca">Fuente Clara</span></a>
    <div class="bajada">Agua purificada a domicilio, por suscripción · Sitio de prueba</div>
  </div>
</header>

<nav class="principal">
  <div class="contenedor">
    <a href="../index.html">Inicio</a>
  </div>
</nav>

<main>
<div class="contenedor">

  <h1>Plan Hogar</h1>

  <p>El plan Hogar es la suscripción de entrada de Fuente Clara. Está pensado para un hogar de dos
  a cuatro personas que usa agua purificada para beber y cocinar, y no para consumo intensivo ni
  para uso comercial.</p>

  <h2>Precio</h2>

${v.precio}

  <h2>Qué incluye</h2>

  <ul>
    <li>Dos bidones retornables de 20 litros de agua purificada por mes.</li>
    <li>Entrega a domicilio dentro de la zona de cobertura, sin cargo de envío.</li>
    <li>Retiro de los envases vacíos en la misma visita.</li>
    <li>Cambio de plan una vez por mes y pausa de la suscripción por hasta sesenta días.</li>
  </ul>

  <h2>Condiciones</h2>

  <p>La suscripción se factura por mes adelantado y se renueva de forma automática hasta que el
  cliente la dé de baja. No hay contrato de permanencia, cargo de alta ni penalidad por baja. Los
  bidones son retornables y siguen siendo propiedad de Fuente Clara: si un envase no se devuelve en
  la entrega siguiente, se factura aparte como envase no retornado.</p>

  <p>El dispensador no forma parte del plan. Quien lo necesite lo compra por separado, una sola vez,
  y queda de su propiedad.</p>

  <h2>Cobertura y frecuencia</h2>

  <p>El reparto es semanal en la zona de cobertura y quincenal fuera de ella. El día de entrega se
  asigna según el recorrido de cada zona y se informa al momento del alta. Si el cliente no está en
  el domicilio, la entrega se reprograma para el recorrido siguiente sin costo adicional.</p>

  <div class="nota-experimento">
    <p><strong>Página de prueba.</strong> «Fuente Clara» es una marca ficticia y el plan descrito no
    existe. Esta es la variante <strong>${v.letra.toUpperCase()}</strong> de un experimento sobre
    formato de presentación del precio. Técnica de esta variante: ${v.tecnica.charAt(0).toLowerCase() + v.tecnica.slice(1)}</p>
    <p class="trazador">Código de referencia de esta página: <strong>${v.trazador}</strong></p>
  </div>

</div>
</main>

<footer class="sitio">
  <div class="contenedor">
    <p>Fuente Clara — marca ficticia creada para un entorno de prueba. Contenido inventado en su totalidad.</p>
    <p>Sitio estático, sin cookies, sin analítica y sin contenido dependiente de JavaScript.</p>
  </div>
</footer>

</body>
</html>
`;

for (const v of variantes) {
  fs.writeFileSync(`exp-formato-precio/${v.letra}.html`, pagina(v));
  console.log('escrito exp-formato-precio/' + v.letra + '.html');
}
