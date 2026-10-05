/* =============================================================
   MAPA INTERACTIVO DE SILOÉ
   -------------------------------------------------------------
   Toda la lógica de la aplicación, en este orden:
     1. Datos: catálogo de elementos y estado del mapa
     2. Símbolos: los dibujos (SVG) de casas, árboles, plantas…
     3. Referencias a la página (HTML)
     4. Dibujar elementos (en la página y en la imagen PNG)
     5. Panel de elementos: buscar, categorías y arrastrar
     6. En el mapa: colocar, seleccionar, mover, girar y cambiar tamaño
     7. Panel de propiedades: editar el elemento elegido
     8. Fondo del mapa y zoom
     9. Guardar, abrir y exportar
    10. Arranque de la aplicación

   La imagen del mapa base está al final del archivo, escrita
   como texto (base64). Así funciona con doble clic, sin servidor,
   y se puede exportar a PNG sin errores de seguridad del navegador.
   ============================================================= */


/* =============================================================
   1. DATOS
   ============================================================= */

// Medidas del mapa en píxeles (las mismas que la imagen base)
const ANCHO_LIENZO = 898;
const ALTO_LIENZO = 730;

// Nombre con el que se guardan los mapas en el navegador
const CLAVE_GUARDADO = 'mapas-siloe';

const FUENTE_TEXTOS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const CATEGORIAS = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'naturaleza', nombre: 'Naturaleza' },
  { id: 'comercio', nombre: 'Viviendas y comunidad' },
  { id: 'infraestructura', nombre: 'Infraestructura' },
  { id: 'caminos', nombre: 'Caminos y redes' },
  { id: 'zonas', nombre: 'Zonas y secciones' },
  { id: 'anotacion', nombre: 'Textos y flechas' }
];

// Capas del plano: agrupan los elementos para mostrarlos, ocultarlos o bloquearlos juntos.
// Cada elemento del catálogo dice a qué capa pertenece con "capa".
const CAPAS = [
  { id: 'vegetacion', nombre: 'Vegetación' },
  { id: 'edificaciones', nombre: 'Edificaciones' },
  { id: 'equipamientos', nombre: 'Equipamientos y servicios' },
  { id: 'electrica', nombre: 'Red eléctrica' },
  { id: 'agua', nombre: 'Agua y alcantarillado' },
  { id: 'vias', nombre: 'Vías y caminos' },
  { id: 'zonas', nombre: 'Zonas y secciones' },
  { id: 'anotaciones', nombre: 'Textos, cotas y flechas' }
];

// Cada elemento tiene una "forma" que dice cómo se dibuja:
//   'simbolo' → un dibujo de la lista SIMBOLOS (sección 2), visto desde arriba
//   'zona'    → un área de color: rectángulo o elipse
//   'linea'   → una franja larga: calles, cables, tuberías, quebradas…
//   'texto'   → un texto que escribes tú
//   'flecha'  → una flecha que puedes girar
const CATALOGO_ELEMENTOS = [
  // --- Naturaleza ---
  { id: 'arbol', capa: 'vegetacion', nombre: 'Árbol', categoria: 'naturaleza', forma: 'simbolo', simbolo: 'arbol', color: '#8fbf7f', tamano: 56 },
  { id: 'arbol-frondoso', capa: 'vegetacion', nombre: 'Árbol frondoso', categoria: 'naturaleza', forma: 'simbolo', simbolo: 'arbolFrondoso', color: '#6fa86a', tamano: 70 },
  { id: 'pino', capa: 'vegetacion', nombre: 'Pino', categoria: 'naturaleza', forma: 'simbolo', simbolo: 'pino', color: '#5b8f6a', tamano: 52 },
  { id: 'palmera', capa: 'vegetacion', nombre: 'Palmera', categoria: 'naturaleza', forma: 'simbolo', simbolo: 'palmera', color: '#9cc27c', tamano: 56 },
  { id: 'arbusto', capa: 'vegetacion', nombre: 'Arbusto', categoria: 'naturaleza', forma: 'simbolo', simbolo: 'arbusto', color: '#a6c98c', tamano: 40 },
  { id: 'jardinera', capa: 'vegetacion', nombre: 'Jardinera con flores', categoria: 'naturaleza', forma: 'simbolo', simbolo: 'jardinera', color: '#e07a8a', tamano: 46 },
  { id: 'roca', capa: 'vegetacion', nombre: 'Roca', categoria: 'naturaleza', forma: 'simbolo', simbolo: 'roca', color: '#b3aca1', tamano: 40 },
  { id: 'cesped', capa: 'vegetacion', nombre: 'Césped / pasto', categoria: 'naturaleza', forma: 'zona', figura: 'rectangulo', color: '#9ccc65', ancho: 160, alto: 100 },
  { id: 'lago', capa: 'agua', nombre: 'Lago o laguna', categoria: 'naturaleza', forma: 'zona', figura: 'elipse', color: '#7fb8d9', ancho: 140, alto: 90 },

  // --- Viviendas y comunidad ---
  { id: 'casa', capa: 'edificaciones', nombre: 'Casa (cuatro aguas)', categoria: 'comercio', forma: 'simbolo', simbolo: 'casa', color: '#d9a37a', tamano: 48 },
  { id: 'casa-dos-aguas', capa: 'edificaciones', nombre: 'Casa (dos aguas)', categoria: 'comercio', forma: 'simbolo', simbolo: 'casaDosAguas', color: '#c98f6b', tamano: 48 },
  { id: 'casa-patio', capa: 'edificaciones', nombre: 'Casa con patio', categoria: 'comercio', forma: 'simbolo', simbolo: 'casaPatio', color: '#dcb08a', tamano: 56 },
  { id: 'manzana', capa: 'edificaciones', nombre: 'Grupo de casas', categoria: 'comercio', forma: 'simbolo', simbolo: 'manzana', color: '#d39b74', tamano: 70 },
  { id: 'edificio', capa: 'edificaciones', nombre: 'Edificio', categoria: 'comercio', forma: 'simbolo', simbolo: 'edificio', color: '#b9c0c7', tamano: 64 },
  { id: 'construccion', capa: 'edificaciones', nombre: 'Vivienda en construcción', categoria: 'comercio', forma: 'simbolo', simbolo: 'construccion', color: '#8a8f94', tamano: 48 },
  { id: 'tienda', capa: 'equipamientos', nombre: 'Tienda', categoria: 'comercio', forma: 'simbolo', simbolo: 'tienda', color: '#e08e45', tamano: 40 },
  { id: 'centro-comercial', capa: 'equipamientos', nombre: 'Centro comercial', categoria: 'comercio', forma: 'simbolo', simbolo: 'centroComercial', color: '#b5651d', tamano: 44 },
  { id: 'iglesia', capa: 'equipamientos', nombre: 'Iglesia', categoria: 'comercio', forma: 'simbolo', simbolo: 'iglesia', color: '#7d6b9d', tamano: 40 },
  { id: 'escuela', capa: 'equipamientos', nombre: 'Escuela', categoria: 'comercio', forma: 'simbolo', simbolo: 'escuela', color: '#3d7ea6', tamano: 40 },
  { id: 'hospital', capa: 'equipamientos', nombre: 'Hospital / puesto de salud', categoria: 'comercio', forma: 'simbolo', simbolo: 'hospital', color: '#c94c4c', tamano: 40 },
  { id: 'cancha', capa: 'equipamientos', nombre: 'Cancha', categoria: 'comercio', forma: 'simbolo', simbolo: 'cancha', color: '#6fae6a', tamano: 80 },
  { id: 'parque-infantil', capa: 'equipamientos', nombre: 'Parque infantil', categoria: 'comercio', forma: 'simbolo', simbolo: 'parqueInfantil', color: '#e3a33b', tamano: 40 },
  { id: 'teleferico', capa: 'equipamientos', nombre: 'Estación de cable', categoria: 'comercio', forma: 'simbolo', simbolo: 'teleferico', color: '#2f6f8f', tamano: 40 },
  { id: 'parada-bus', capa: 'equipamientos', nombre: 'Parada de bus', categoria: 'comercio', forma: 'simbolo', simbolo: 'paradaBus', color: '#2e8b57', tamano: 36 },

  // --- Infraestructura ---
  { id: 'poste', capa: 'electrica', nombre: 'Poste eléctrico', categoria: 'infraestructura', forma: 'simbolo', simbolo: 'poste', color: '#e0a800', tamano: 22 },
  { id: 'transformador', capa: 'electrica', nombre: 'Transformador', categoria: 'infraestructura', forma: 'simbolo', simbolo: 'transformador', color: '#f2c94c', tamano: 30 },
  { id: 'planta-electrica', capa: 'electrica', nombre: 'Planta eléctrica', categoria: 'infraestructura', forma: 'simbolo', simbolo: 'plantaElectrica', color: '#e8a33d', tamano: 56 },
  { id: 'planta-agua', capa: 'agua', nombre: 'Planta de agua', categoria: 'infraestructura', forma: 'simbolo', simbolo: 'plantaAgua', color: '#3b82c4', tamano: 56 },
  { id: 'tanque-agua', capa: 'agua', nombre: 'Tanque de agua', categoria: 'infraestructura', forma: 'simbolo', simbolo: 'tanqueAgua', color: '#9cc3e6', tamano: 44 },
  { id: 'alumbrado', capa: 'electrica', nombre: 'Alumbrado público', categoria: 'infraestructura', forma: 'simbolo', simbolo: 'alumbrado', color: '#f6c344', tamano: 30 },
  { id: 'semaforo', capa: 'vias', nombre: 'Semáforo', categoria: 'infraestructura', forma: 'simbolo', simbolo: 'semaforo', color: '#3a4245', tamano: 32 },
  { id: 'antena', capa: 'equipamientos', nombre: 'Antena', categoria: 'infraestructura', forma: 'simbolo', simbolo: 'antena', color: '#6b7a86', tamano: 40 },
  { id: 'reciclaje', capa: 'equipamientos', nombre: 'Punto de reciclaje', categoria: 'infraestructura', forma: 'simbolo', simbolo: 'reciclaje', color: '#4f9d69', tamano: 40 },

  // --- Caminos y redes (colorCentro es la raya del medio) ---
  { id: 'calle', capa: 'vias', nombre: 'Calle', categoria: 'caminos', forma: 'linea', color: '#a3a8ad', colorCentro: '#ffffff', ancho: 220, alto: 22 },
  { id: 'avenida', capa: 'vias', nombre: 'Avenida', categoria: 'caminos', forma: 'linea', color: '#7b8187', colorCentro: '#f2c94c', ancho: 300, alto: 34 },
  { id: 'camino', capa: 'vias', nombre: 'Camino peatonal', categoria: 'caminos', forma: 'linea', color: '#d8c3a0', colorCentro: null, ancho: 180, alto: 12 },
  { id: 'red-electrica', capa: 'electrica', nombre: 'Red eléctrica', categoria: 'caminos', forma: 'linea', color: '#e8a33d', colorCentro: '#2f3a37', ancho: 240, alto: 8 },
  { id: 'tuberia-agua', capa: 'agua', nombre: 'Tubería de agua', categoria: 'caminos', forma: 'linea', color: '#3b82c4', colorCentro: '#bcd7ef', ancho: 240, alto: 10 },
  { id: 'quebrada', capa: 'agua', nombre: 'Quebrada / río', categoria: 'caminos', forma: 'linea', color: '#7fb8d9', colorCentro: null, ancho: 260, alto: 16 },
  { id: 'alcantarillado', capa: 'agua', nombre: 'Alcantarillado', categoria: 'caminos', forma: 'linea', color: '#7a5233', colorCentro: '#d6b48c', ancho: 240, alto: 10 },

  // --- Zonas y secciones de color ---
  { id: 'zona-residencial', capa: 'zonas', nombre: 'Zona residencial', categoria: 'zonas', forma: 'zona', figura: 'rectangulo', color: '#e3a76f', ancho: 200, alto: 140 },
  { id: 'zona-comercial', capa: 'zonas', nombre: 'Zona comercial', categoria: 'zonas', forma: 'zona', figura: 'rectangulo', color: '#9b8ec4', ancho: 200, alto: 140 },
  { id: 'zona-verde', capa: 'zonas', nombre: 'Zona verde', categoria: 'zonas', forma: 'zona', figura: 'elipse', color: '#7fb069', ancho: 180, alto: 130 },
  { id: 'zona-riesgo', capa: 'zonas', nombre: 'Zona de riesgo', categoria: 'zonas', forma: 'zona', figura: 'elipse', color: '#d9534f', ancho: 180, alto: 130 },
  { id: 'seccion-rectangular', capa: 'zonas', nombre: 'Sección rectangular', categoria: 'zonas', forma: 'zona', figura: 'rectangulo', color: '#6c9bd2', ancho: 200, alto: 140 },
  { id: 'seccion-circular', capa: 'zonas', nombre: 'Sección circular', categoria: 'zonas', forma: 'zona', figura: 'elipse', color: '#5bb5a2', ancho: 160, alto: 160 },

  // --- Textos y flechas ---
  { id: 'titulo', capa: 'anotaciones', nombre: 'Título', categoria: 'anotacion', forma: 'texto', estiloTexto: 'titulo', color: '#1f2a2e', tamano: 40, textoInicial: 'Barrio Siloé' },
  { id: 'subtitulo', capa: 'anotaciones', nombre: 'Subtítulo', categoria: 'anotacion', forma: 'texto', estiloTexto: 'subtitulo', color: '#3a4a50', tamano: 24, textoInicial: 'Comuna 20 · Cali' },
  { id: 'etiqueta', capa: 'anotaciones', nombre: 'Etiqueta', categoria: 'anotacion', forma: 'texto', estiloTexto: 'etiqueta', color: '#1f2a2e', tamano: 16, textoInicial: 'Nombre del lugar' },
  { id: 'nota', capa: 'anotaciones', nombre: 'Nota', categoria: 'anotacion', forma: 'texto', estiloTexto: 'nota', color: '#1f2a2e', tamano: 16, textoInicial: 'Escribe una nota' },
  { id: 'flecha', capa: 'anotaciones', nombre: 'Flecha', categoria: 'anotacion', forma: 'flecha', figura: 'simple', color: '#c0392b', ancho: 120, alto: 60 },
  { id: 'flecha-doble', capa: 'anotaciones', nombre: 'Flecha doble', categoria: 'anotacion', forma: 'flecha', figura: 'doble', color: '#2f6f8f', ancho: 140, alto: 60 },
  { id: 'punto-interes', capa: 'anotaciones', nombre: 'Punto de interés', categoria: 'anotacion', forma: 'simbolo', simbolo: 'puntoInteres', color: '#d9534f', tamano: 40 },
  { id: 'advertencia', capa: 'anotaciones', nombre: 'Advertencia', categoria: 'anotacion', forma: 'simbolo', simbolo: 'advertencia', color: '#f2b134', tamano: 40 },
  { id: 'norte', capa: 'anotaciones', nombre: 'Flecha del norte', categoria: 'anotacion', forma: 'simbolo', simbolo: 'norte', color: '#2f3a37', tamano: 60 },
  { id: 'escala-grafica', capa: 'anotaciones', nombre: 'Escala gráfica', categoria: 'anotacion', forma: 'escala', color: '#2f3a37', tamano: 34 },
  { id: 'cota', capa: 'anotaciones', nombre: 'Cota (medida)', categoria: 'anotacion', forma: 'cota', color: '#2f3a37', ancho: 150, alto: 26 }
];

// Cómo se ve cada tipo de texto
const ESTILOS_TEXTO = {
  titulo: { peso: 800, contorno: true, fondo: null, pastilla: false },
  subtitulo: { peso: 600, contorno: true, fondo: null, pastilla: false },
  etiqueta: { peso: 600, contorno: false, fondo: '#ffffff', pastilla: true },
  nota: { peso: 500, contorno: false, fondo: '#fdf1c4', pastilla: false }
};

// Puntos de cada flecha dentro de una caja de 100 x 50.
// Se usan igual para dibujarla en la página (SVG) y en el PNG (canvas).
const PUNTOS_FLECHA = {
  simple: [[0, 18], [65, 18], [65, 0], [100, 25], [65, 50], [65, 32], [0, 32]],
  doble: [[0, 25], [25, 0], [25, 16], [75, 16], [75, 0], [100, 25], [75, 50], [75, 34], [25, 34], [25, 50]]
};

// Límites de los deslizadores de tamaño
const LIMITES = {
  tamano: { minimo: 8, maximo: 300 },
  ancho: { minimo: 10, maximo: 900 },
  alto: { minimo: 2, maximo: 700 }
};

// --- Estado de la aplicación (lo que cambia mientras la usas) ---
let elementosEnMapa = [];        // los elementos colocados, en orden de dibujo
let fondoDelMapa = { color: '#ffffff', visibilidad: 100, tenido: false };
let nombreDelMapa = 'Mi mapa de Siloé';
let siguienteId = 1;
let idSeleccionado = null;
let nivelZoom = 1;
let categoriaActiva = 'todos';

// Escala y ayudas de dibujo del plano.
// metrosPorPixel es un valor estimado: calíbralo con una cota sobre una distancia conocida.
let planoConfig = { metrosPorPixel: 1.5, cuadriculaVisible: false, tamanoCuadricula: 20, imanActivo: false };
let estadoCapas = crearEstadoCapasInicial();  // qué capas se ven y cuáles están bloqueadas
let herramienta = 'seleccionar';   // 'seleccionar', 'medir' o 'dibujar'
let dibujoEnCurso = null;          // los puntos de un trazo o zona que se está dibujando
let medicionEnCurso = null;        // la cota que se está dibujando con la herramienta Medir

// Todas las capas empiezan visibles y sin bloquear
function crearEstadoCapasInicial() {
  const estado = {};
  CAPAS.forEach(function (capa) {
    estado[capa.id] = { visible: true, bloqueada: false };
  });
  return estado;
}

// Datos temporales mientras se arrastra algo
let arrastreDesdePanel = null;   // un elemento que viene del panel
let accionEnCurso = null;        // mover, girar o cambiar tamaño de un elemento del mapa
let paneoEnCurso = null;         // mover la vista del mapa con el ratón


/* =============================================================
   2. SÍMBOLOS
   -------------------------------------------------------------
   Cada símbolo es una función que recibe un color y devuelve
   un dibujo SVG dentro de una caja de 100 x 100. Están dibujados
   "en planta" (vistos desde arriba), como en un plano de arquitectura.
   ============================================================= */

const TRAZO = '#2f3a37';   // color de las líneas de los dibujos

// Puntos de una estrella: sirve para el pino (puntas alrededor de un centro)
function puntosDeEstrella(cantidadPuntas, radioExterior, radioInterior) {
  const puntos = [];
  for (let i = 0; i < cantidadPuntas * 2; i++) {
    const radio = i % 2 === 0 ? radioExterior : radioInterior;
    const angulo = Math.PI * i / cantidadPuntas;
    puntos.push((50 + radio * Math.sin(angulo)).toFixed(1) + ',' + (50 - radio * Math.cos(angulo)).toFixed(1));
  }
  return puntos.join(' ');
}

// Varios círculos que se ven como una sola silueta con borde.
// Truco: primero dibujamos todos con borde grueso, luego todos sin borde encima.
function siluetaDeCirculos(circulos, color) {
  const bordes = circulos.map(function (c) {
    return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + TRAZO + '" stroke="' + TRAZO + '" stroke-width="4"/>';
  }).join('');
  const rellenos = circulos.map(function (c) {
    return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + color + '"/>';
  }).join('');
  return bordes + rellenos;
}

// Techo a cuatro aguas visto desde arriba: un rectángulo con su cumbrera
function techoCuatroAguas(x, y, ancho, alto, color) {
  const margen = Math.min(ancho, alto) / 2;
  const cumbreraIzquierda = x + margen;
  const cumbreraDerecha = x + ancho - margen;
  const medio = y + alto / 2;
  return '<rect x="' + x + '" y="' + y + '" width="' + ancho + '" height="' + alto + '" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="2.5"/>' +
    '<polygon points="' + x + ',' + y + ' ' + cumbreraIzquierda + ',' + medio + ' ' + x + ',' + (y + alto) + '" fill="#000" fill-opacity="0.12"/>' +
    '<polygon points="' + x + ',' + (y + alto) + ' ' + cumbreraIzquierda + ',' + medio + ' ' + cumbreraDerecha + ',' + medio + ' ' + (x + ancho) + ',' + (y + alto) + '" fill="#000" fill-opacity="0.06"/>' +
    '<path d="M' + x + ' ' + y + ' L' + cumbreraIzquierda + ' ' + medio + ' L' + x + ' ' + (y + alto) +
    ' M' + cumbreraIzquierda + ' ' + medio + ' L' + cumbreraDerecha + ' ' + medio +
    ' M' + (x + ancho) + ' ' + y + ' L' + cumbreraDerecha + ' ' + medio + ' L' + (x + ancho) + ' ' + (y + alto) +
    '" fill="none" stroke="' + TRAZO + '" stroke-width="1.5"/>';
}

// Insignia redonda de color con un pictograma blanco encima (servicios)
function insignia(color, pictograma) {
  return '<circle cx="50" cy="50" r="46" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="2"/>' +
    '<circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-opacity="0.8"/>' +
    pictograma;
}

const RAYO = '<polygon points="56,18 30,56 47,56 42,82 70,42 53,42" fill="#ffffff"/>';
const GOTA = '<path d="M50 18 C50 18 29 45 29 59 A21 21 0 0 0 71 59 C71 45 50 18 50 18 Z" fill="#ffffff"/>';
const BLANCO = 'fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';

const SIMBOLOS = {
  arbol: function (color) {
    let ramas = '';
    for (let i = 0; i < 8; i++) {
      const angulo = Math.PI * i / 4;
      ramas += '<line x1="' + (50 + 7 * Math.cos(angulo)).toFixed(1) + '" y1="' + (50 + 7 * Math.sin(angulo)).toFixed(1) +
        '" x2="' + (50 + 34 * Math.cos(angulo)).toFixed(1) + '" y2="' + (50 + 34 * Math.sin(angulo)).toFixed(1) + '"/>';
    }
    return '<circle cx="50" cy="50" r="44" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="2.5"/>' +
      '<circle cx="50" cy="50" r="30" fill="none" stroke="' + TRAZO + '" stroke-width="1" stroke-opacity="0.35"/>' +
      '<g stroke="' + TRAZO + '" stroke-width="1.5" stroke-opacity="0.5">' + ramas + '</g>' +
      '<circle cx="50" cy="50" r="4" fill="' + TRAZO + '"/>';
  },
  arbolFrondoso: function (color) {
    const circulos = [[50, 50, 30]];
    for (let i = 0; i < 9; i++) {
      const angulo = Math.PI * 2 * i / 9;
      circulos.push([(50 + 31 * Math.cos(angulo)).toFixed(1), (50 + 31 * Math.sin(angulo)).toFixed(1), 14]);
    }
    return siluetaDeCirculos(circulos, color) +
      '<circle cx="42" cy="42" r="14" fill="#ffffff" fill-opacity="0.18"/>' +
      '<circle cx="50" cy="50" r="4" fill="' + TRAZO + '"/>';
  },
  pino: function (color) {
    return '<polygon points="' + puntosDeEstrella(14, 46, 33) + '" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<polygon points="' + puntosDeEstrella(10, 26, 15) + '" fill="#ffffff" fill-opacity="0.22" stroke="' + TRAZO + '" stroke-width="1" stroke-opacity="0.4"/>' +
      '<circle cx="50" cy="50" r="4" fill="' + TRAZO + '"/>';
  },
  palmera: function (color) {
    let hojas = '';
    for (let i = 0; i < 8; i++) {
      hojas += '<ellipse cx="50" cy="27" rx="8" ry="23" transform="rotate(' + i * 45 + ' 50 50)"/>';
    }
    return '<g fill="' + color + '" stroke="' + TRAZO + '" stroke-width="1.8">' + hojas + '</g>' +
      '<circle cx="50" cy="50" r="7" fill="#8d6e4a" stroke="' + TRAZO + '" stroke-width="1.5"/>';
  },
  arbusto: function (color) {
    return siluetaDeCirculos([[36, 42, 22], [64, 40, 20], [52, 64, 24]], color) +
      '<circle cx="40" cy="40" r="8" fill="#ffffff" fill-opacity="0.2"/>';
  },
  jardinera: function (color) {
    let flores = '';
    [[28, 38], [50, 34], [72, 38], [36, 62], [60, 64]].forEach(function (p) {
      flores += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="8" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="1"/>' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.5" fill="#fff6d5"/>';
    });
    return '<rect x="8" y="18" width="84" height="64" rx="10" fill="#9fbf7a" stroke="' + TRAZO + '" stroke-width="2.5"/>' + flores;
  },
  roca: function (color) {
    return '<polygon points="16,62 26,30 52,16 78,28 86,58 68,84 32,82" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<polyline points="34,40 54,54 72,46" fill="none" stroke="' + TRAZO + '" stroke-width="1.5" stroke-opacity="0.45"/>' +
      '<polygon points="26,30 52,16 54,54 34,40" fill="#ffffff" fill-opacity="0.18"/>';
  },

  casa: function (color) {
    return techoCuatroAguas(10, 20, 80, 60, color);
  },
  casaDosAguas: function (color) {
    return '<rect x="12" y="16" width="76" height="68" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="2.5"/>' +
      '<rect x="12" y="50" width="76" height="34" fill="#000" fill-opacity="0.13"/>' +
      '<line x1="12" y1="50" x2="88" y2="50" stroke="' + TRAZO + '" stroke-width="2"/>' +
      '<rect x="64" y="24" width="10" height="12" fill="#8a8f94" stroke="' + TRAZO + '" stroke-width="1.5"/>';
  },
  casaPatio: function (color) {
    return '<rect x="8" y="8" width="84" height="84" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="2.5"/>' +
      '<polygon points="8,8 36,36 36,64 8,92" fill="#000" fill-opacity="0.1"/>' +
      '<polygon points="8,92 36,64 64,64 92,92" fill="#000" fill-opacity="0.05"/>' +
      '<path d="M8 8 L36 36 M92 8 L64 36 M8 92 L36 64 M92 92 L64 64" stroke="' + TRAZO + '" stroke-width="1.5"/>' +
      '<rect x="36" y="36" width="28" height="28" fill="#a9cf8f" stroke="' + TRAZO + '" stroke-width="2"/>';
  },
  manzana: function (color) {
    return '<rect x="2" y="2" width="96" height="96" rx="4" fill="#ece6dc" stroke="' + TRAZO + '" stroke-width="1.5" stroke-dasharray="4 3"/>' +
      techoCuatroAguas(8, 8, 40, 36, color) + techoCuatroAguas(54, 8, 38, 40, color) +
      techoCuatroAguas(8, 52, 36, 40, color) + techoCuatroAguas(50, 56, 42, 36, color);
  },
  edificio: function (color) {
    return '<rect x="6" y="6" width="88" height="88" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="3"/>' +
      '<rect x="14" y="14" width="72" height="72" fill="none" stroke="' + TRAZO + '" stroke-width="1" stroke-opacity="0.5"/>' +
      '<rect x="24" y="24" width="22" height="16" fill="#ffffff" fill-opacity="0.55" stroke="' + TRAZO + '" stroke-width="1.5"/>' +
      '<rect x="58" y="56" width="18" height="18" fill="#ffffff" fill-opacity="0.55" stroke="' + TRAZO + '" stroke-width="1.5"/>' +
      '<circle cx="67" cy="65" r="5" fill="none" stroke="' + TRAZO + '" stroke-width="1.2"/>';
  },
  construccion: function (color) {
    return '<rect x="12" y="12" width="76" height="76" fill="#ffffff" fill-opacity="0.6" stroke="' + color + '" stroke-width="3" stroke-dasharray="8 5"/>' +
      '<path d="M12 12 L88 88 M88 12 L12 88" stroke="' + color + '" stroke-width="2" stroke-dasharray="6 5"/>';
  },

  tienda: function (color) {
    return insignia(color,
      '<path d="M26 42 L31 26 L69 26 L74 42 Z" fill="#ffffff"/>' +
      '<path d="M31 46 L31 74 L69 74 L69 46" ' + BLANCO + '/>' +
      '<rect x="44" y="56" width="12" height="18" fill="#ffffff"/>');
  },
  centroComercial: function (color) {
    return insignia(color,
      '<rect x="29" y="40" width="42" height="36" rx="4" fill="#ffffff"/>' +
      '<path d="M40 40 L40 33 A10 10 0 0 1 60 33 L60 40" ' + BLANCO + '/>');
  },
  iglesia: function (color) {
    return insignia(color, '<rect x="45" y="20" width="10" height="60" rx="2" fill="#ffffff"/><rect x="30" y="34" width="40" height="10" rx="2" fill="#ffffff"/>');
  },
  escuela: function (color) {
    return insignia(color,
      '<path d="M50 34 L50 74 M50 34 C41 28 31 28 24 31 L24 71 C31 68 41 68 50 74 C59 68 69 68 76 71 L76 31 C69 28 59 28 50 34" ' + BLANCO + '/>');
  },
  hospital: function (color) {
    return insignia(color, '<rect x="42" y="24" width="16" height="52" rx="2" fill="#ffffff"/><rect x="24" y="42" width="52" height="16" rx="2" fill="#ffffff"/>');
  },
  parqueInfantil: function (color) {
    return insignia(color,
      '<path d="M28 76 L38 26 L62 26 L72 76 M44 26 L44 58 M56 26 L56 58 M40 60 L60 60" ' + BLANCO + '/>');
  },
  teleferico: function (color) {
    return insignia(color,
      '<path d="M18 30 L82 20 M50 25 L50 38" ' + BLANCO + '/>' +
      '<rect x="32" y="38" width="36" height="34" rx="7" fill="#ffffff"/>' +
      '<rect x="37" y="44" width="26" height="11" rx="2" fill="' + color + '"/>');
  },
  paradaBus: function (color) {
    return insignia(color,
      '<rect x="30" y="22" width="40" height="48" rx="7" fill="#ffffff"/>' +
      '<rect x="35" y="29" width="30" height="16" rx="2" fill="' + color + '"/>' +
      '<circle cx="38" cy="60" r="3.5" fill="' + color + '"/><circle cx="62" cy="60" r="3.5" fill="' + color + '"/>' +
      '<path d="M36 70 L36 78 M64 70 L64 78" ' + BLANCO + '/>');
  },
  cancha: function (color) {
    return '<rect x="4" y="18" width="92" height="64" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="2.5"/>' +
      '<g fill="none" stroke="#ffffff" stroke-width="2">' +
      '<rect x="10" y="24" width="80" height="52"/><line x1="50" y1="24" x2="50" y2="76"/>' +
      '<circle cx="50" cy="50" r="10"/><rect x="10" y="38" width="12" height="24"/><rect x="78" y="38" width="12" height="24"/></g>';
  },

  poste: function (color) {
    return '<circle cx="50" cy="50" r="38" fill="#ffffff" stroke="' + color + '" stroke-width="10"/>' +
      '<circle cx="50" cy="50" r="44" fill="none" stroke="' + TRAZO + '" stroke-width="2"/>' +
      '<path d="M30 30 L70 70 M70 30 L30 70" stroke="' + TRAZO + '" stroke-width="6" stroke-linecap="round"/>';
  },
  transformador: function (color) {
    return '<rect x="10" y="10" width="80" height="80" rx="8" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="3"/>' +
      '<polygon points="56,18 30,56 47,56 42,82 70,42 53,42" fill="' + TRAZO + '"/>';
  },
  plantaElectrica: function (color) {
    return insignia(color, RAYO);
  },
  plantaAgua: function (color) {
    return insignia(color, GOTA);
  },
  tanqueAgua: function (color) {
    return '<circle cx="50" cy="50" r="44" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="3"/>' +
      '<circle cx="50" cy="50" r="31" fill="none" stroke="#ffffff" stroke-width="3"/>' +
      '<circle cx="50" cy="50" r="18" fill="none" stroke="' + TRAZO + '" stroke-width="1.2" stroke-opacity="0.5"/>' +
      '<circle cx="50" cy="50" r="6" fill="' + TRAZO + '"/>';
  },
  alumbrado: function (color) {
    let rayos = '';
    for (let i = 0; i < 8; i++) {
      const angulo = Math.PI * i / 4;
      rayos += '<line x1="' + (50 + 26 * Math.cos(angulo)).toFixed(1) + '" y1="' + (50 + 26 * Math.sin(angulo)).toFixed(1) +
        '" x2="' + (50 + 44 * Math.cos(angulo)).toFixed(1) + '" y2="' + (50 + 44 * Math.sin(angulo)).toFixed(1) + '"/>';
    }
    return '<g stroke="' + color + '" stroke-width="6" stroke-linecap="round">' + rayos + '</g>' +
      '<circle cx="50" cy="50" r="17" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="3"/>';
  },
  semaforo: function (color) {
    return '<rect x="30" y="6" width="40" height="88" rx="10" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="2"/>' +
      '<circle cx="50" cy="24" r="10" fill="#d9534f"/><circle cx="50" cy="50" r="10" fill="#f2c94c"/><circle cx="50" cy="76" r="10" fill="#4f9d69"/>';
  },
  antena: function (color) {
    return insignia(color,
      '<path d="M50 44 L50 80 M38 80 L50 44 L62 80 M42 66 L58 66" ' + BLANCO + '/>' +
      '<path d="M38 36 A16 16 0 0 1 62 36 M30 28 A28 28 0 0 1 70 28" ' + BLANCO + '/>' +
      '<circle cx="50" cy="42" r="4" fill="#ffffff"/>');
  },
  reciclaje: function (color) {
    return insignia(color,
      '<path d="M30 54 A21 21 0 0 1 66 34" ' + BLANCO + '/><polygon points="72,28 72,44 58,38" fill="#ffffff"/>' +
      '<path d="M70 46 A21 21 0 0 1 34 66" ' + BLANCO + '/><polygon points="28,72 28,56 42,62" fill="#ffffff"/>');
  },

  puntoInteres: function (color) {
    return '<path d="M50 94 C50 94 18 58 18 38 A32 32 0 0 1 82 38 C82 58 50 94 50 94 Z" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="50" cy="38" r="12" fill="#ffffff"/>';
  },
  advertencia: function (color) {
    return '<polygon points="50,10 93,86 7,86" fill="' + color + '" stroke="' + TRAZO + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<rect x="45.5" y="36" width="9" height="28" rx="3" fill="' + TRAZO + '"/><circle cx="50" cy="74" r="5" fill="' + TRAZO + '"/>';
  },
  norte: function (color) {
    return '<text x="50" y="22" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="700" fill="' + color + '">N</text>' +
      '<polygon points="50,28 50,82 32,94" fill="' + color + '"/>' +
      '<polygon points="50,28 68,94 50,82" fill="#ffffff" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<polygon points="50,28 50,82 32,94" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round"/>';
  }
};



/* =============================================================
   3. REFERENCIAS A LA PÁGINA
   ============================================================= */

const contenedorLienzo = document.getElementById('contenedor-lienzo');
const marcoLienzo = document.getElementById('marco-lienzo');
const lienzo = document.getElementById('lienzo');
const imagenMapa = document.getElementById('imagen-mapa');
const capaElementos = document.getElementById('capa-elementos');

const campoBusqueda = document.getElementById('campo-busqueda');
const listaCategorias = document.getElementById('lista-categorias');
const galeriaElementos = document.getElementById('galeria-elementos');

const seccionFondo = document.getElementById('seccion-fondo');
const campoColorFondo = document.getElementById('campo-color-fondo');
const campoVisibilidad = document.getElementById('campo-visibilidad');
const campoTenido = document.getElementById('campo-tenido');

const seccionElemento = document.getElementById('seccion-elemento');
const tituloElemento = document.getElementById('titulo-elemento');
const campoTexto = document.getElementById('campo-texto');
const campoColor = document.getElementById('campo-color');
const campoTamano = document.getElementById('campo-tamano');
const campoAncho = document.getElementById('campo-ancho');
const campoAlto = document.getElementById('campo-alto');
const campoRotacion = document.getElementById('campo-rotacion');
const campoOpacidad = document.getElementById('campo-opacidad');

const dialogoMapas = document.getElementById('dialogo-mapas');
const dialogoExportar = document.getElementById('dialogo-exportar');
const campoNombreMapa = document.getElementById('campo-nombre-mapa');
const listaMapas = document.getElementById('lista-mapas');
const campoAbrirArchivo = document.getElementById('campo-abrir-archivo');
const aviso = document.getElementById('aviso');

const capaCuadricula = document.getElementById('capa-cuadricula');
const campoMetrosPixel = document.getElementById('campo-metros-pixel');
const campoMostrarCuadricula = document.getElementById('campo-mostrar-cuadricula');
const campoTamanoCuadricula = document.getElementById('campo-tamano-cuadricula');
const campoIman = document.getElementById('campo-iman');
const campoMostrarArea = document.getElementById('campo-mostrar-area');
const campoMedidaReal = document.getElementById('campo-medida-real');
const listaCapas = document.getElementById('lista-capas');
const guiaDibujo = document.getElementById('guia-dibujo');
const barraDibujo = document.getElementById('barra-dibujo');
const campoTipoTrazo = document.getElementById('campo-tipo-trazo');
const campoSuavizarDibujo = document.getElementById('campo-suavizar-dibujo');
const campoSuavizar = document.getElementById('campo-suavizar');
const campoGrosor = document.getElementById('campo-grosor');


/* =============================================================
   4. DIBUJAR ELEMENTOS
   ============================================================= */

function buscarTipo(tipoId) {
  return CATALOGO_ELEMENTOS.find(function (tipo) { return tipo.id === tipoId; });
}

function buscarElemento(id) {
  return elementosEnMapa.find(function (elemento) { return elemento.id === id; });
}

function capaDelElemento(elemento) {
  return estadoCapas[buscarTipo(elemento.tipoId).capa];
}

// Un elemento se puede tocar si su capa se ve y no está bloqueada
function sePuedeEditar(elemento) {
  const capa = capaDelElemento(elemento);
  return capa.visible && !capa.bloqueada;
}

function buscarNodo(id) {
  return capaElementos.querySelector('[data-id="' + id + '"]');
}

// Mantiene un número entre un mínimo y un máximo
function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor));
}

// Deja un ángulo entre -180° y 180° (por ejemplo, 190° pasa a ser -170°)
function normalizarAngulo(angulo) {
  return ((angulo + 180) % 360 + 360) % 360 - 180;
}

// La forma con que se dibuja un elemento. Los dibujados a mano (con "puntos")
// son un 'trazo' (vías, redes) o un 'poligono' (zonas), aunque su tipo sea de línea o zona.
function formaDe(elemento) {
  const tipo = buscarTipo(elemento.tipoId);
  if (elemento.puntos) {
    return tipo.forma === 'zona' ? 'poligono' : 'trazo';
  }
  return tipo.forma;
}

function esDibujoLibre(elemento) {
  return Boolean(elemento.puntos);
}

// Los símbolos, los textos y la escala gráfica tienen un solo tamaño; el resto, ancho y alto
function usaTamanoUnico(elemento) {
  const forma = formaDe(elemento);
  return forma === 'simbolo' || forma === 'texto' || forma === 'escala';
}

// Las líneas y las cotas solo cambian de largo con la manija; su grosor se cambia en el panel
function soloCambiaElLargo(elemento) {
  const forma = formaDe(elemento);
  return forma === 'linea' || forma === 'cota';
}

// Con el imán activo, las posiciones saltan a la línea más cercana de la cuadrícula
function ajustarAlIman(valor) {
  if (!planoConfig.imanActivo) {
    return valor;
  }
  return Math.round(valor / planoConfig.tamanoCuadricula) * planoConfig.tamanoCuadricula;
}

// Convierte '#22c55e' en 'rgba(34, 197, 94, 0.45)'
function colorTransparente(colorHex, opacidad) {
  const rojo = parseInt(colorHex.slice(1, 3), 16);
  const verde = parseInt(colorHex.slice(3, 5), 16);
  const azul = parseInt(colorHex.slice(5, 7), 16);
  return 'rgba(' + rojo + ', ' + verde + ', ' + azul + ', ' + opacidad + ')';
}

// Grosor y largo de las rayitas del centro de una línea (calle, cable…)
function medidasRayaCentral(grosorLinea) {
  return {
    grosor: Math.max(2, grosorLinea * 0.15),
    tramo: Math.max(6, grosorLinea * 0.8)
  };
}

// Crea los datos de un elemento nuevo a partir de su tipo del catálogo
function crearDatosElemento(tipo, x, y) {
  return {
    id: 0,
    tipoId: tipo.id,
    x: x,
    y: y,
    ancho: tipo.ancho || tipo.tamano,
    alto: tipo.alto || tipo.tamano,
    rotacion: 0,
    opacidad: 100,
    color: tipo.color || '#000000',
    texto: tipo.textoInicial || '',
    mostrarArea: false
  };
}

// Los textos se dibujan con HTML; todo lo demás, con un dibujo SVG
function seDibujaConSvg(tipo) {
  return tipo.forma !== 'texto';
}

// Medidas escritas a la manera colombiana: "12,5 m", "1.250 m²"
function formatearMetros(metros) {
  if (metros >= 1000) {
    return (metros / 1000).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + ' km';
  }
  return metros.toLocaleString('es-CO', { maximumFractionDigits: metros < 10 ? 1 : 0 }) + ' m';
}

function formatearArea(metrosCuadrados) {
  const texto = Math.round(metrosCuadrados).toLocaleString('es-CO') + ' m²';
  if (metrosCuadrados >= 10000) {
    return texto + ' (' + (metrosCuadrados / 10000).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + ' ha)';
  }
  return texto;
}

// Área real de una zona: se mide en píxeles y se convierte a metros cuadrados
function calcularArea(elemento) {
  const tipo = buscarTipo(elemento.tipoId);
  const escalaAlCuadrado = planoConfig.metrosPorPixel * planoConfig.metrosPorPixel;
  if (esDibujoLibre(elemento)) {
    return areaDePoligono(elemento.puntos) * escalaAlCuadrado;
  }
  const areaEnPixeles = tipo.figura === 'elipse'
    ? Math.PI * elemento.ancho * elemento.alto / 4
    : elemento.ancho * elemento.alto;
  return areaEnPixeles * planoConfig.metrosPorPixel * planoConfig.metrosPorPixel;
}

// Área de un polígono con la "fórmula del zapatero": se suman productos cruzados de puntos vecinos
function areaDePoligono(puntos) {
  let suma = 0;
  puntos.forEach(function (punto, i) {
    const siguiente = puntos[(i + 1) % puntos.length];
    suma += punto[0] * siguiente[1] - siguiente[0] * punto[1];
  });
  return Math.abs(suma) / 2;
}

// Largo de un trazo: la suma de las distancias entre puntos seguidos
function largoDeTrazo(puntos) {
  let largo = 0;
  for (let i = 1; i < puntos.length; i++) {
    largo += Math.hypot(puntos[i][0] - puntos[i - 1][0], puntos[i][1] - puntos[i - 1][1]);
  }
  return largo;
}

// Caja que encierra todos los puntos
function cajaDePuntos(puntos) {
  const xs = puntos.map(function (p) { return p[0]; });
  const ys = puntos.map(function (p) { return p[1]; });
  return { minX: Math.min.apply(null, xs), maxX: Math.max.apply(null, xs), minY: Math.min.apply(null, ys), maxY: Math.max.apply(null, ys) };
}

// Convierte una lista de puntos en el texto "d" de un <path> de SVG.
// Con "suavizar", usa curvas de Bézier que pasan por todos los puntos (método Catmull-Rom):
// cada tramo se curva según la dirección que traen los puntos de antes y de después.
function crearCaminoSvg(puntos, cerrado, suavizar) {
  const texto = function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); };
  if (!suavizar || puntos.length < 3) {
    return 'M' + puntos.map(texto).join(' L') + (cerrado ? ' Z' : '');
  }
  let d = 'M' + texto(puntos[0]);
  tramosCurvos(puntos, cerrado).forEach(function (tramo) {
    d += ' C' + texto(tramo[0]) + ' ' + texto(tramo[1]) + ' ' + texto(tramo[2]);
  });
  return d + (cerrado ? ' Z' : '');
}

// Cada tramo curvo son tres puntos: dos de control y el punto de llegada
function tramosCurvos(puntos, cerrado) {
  const n = puntos.length;
  const punto = function (i) {
    if (cerrado) {
      return puntos[(i + n) % n];
    }
    return puntos[limitar(i, 0, n - 1)];
  };
  const cantidad = cerrado ? n : n - 1;
  const tramos = [];
  for (let i = 0; i < cantidad; i++) {
    const anterior = punto(i - 1);
    const actual = punto(i);
    const siguiente = punto(i + 1);
    const despues = punto(i + 2);
    const control1 = [actual[0] + (siguiente[0] - anterior[0]) / 6, actual[1] + (siguiente[1] - anterior[1]) / 6];
    const control2 = [siguiente[0] - (despues[0] - actual[0]) / 6, siguiente[1] - (despues[1] - actual[1]) / 6];
    tramos.push([control1, control2, siguiente]);
  }
  return tramos;
}

// Mitad del ancho y del alto que ocupa un camino alrededor del centro (0, 0).
// Una curva nunca sale de sus puntos de control, por eso los contamos también.
function mediaCajaDelCamino(puntos, cerrado, suavizar) {
  let todos = puntos;
  if (suavizar && puntos.length >= 3) {
    todos = puntos.concat.apply(puntos, tramosCurvos(puntos, cerrado));
  }
  let mitadX = 0;
  let mitadY = 0;
  todos.forEach(function (p) {
    mitadX = Math.max(mitadX, Math.abs(p[0]));
    mitadY = Math.max(mitadY, Math.abs(p[1]));
  });
  return { mitadX: mitadX, mitadY: mitadY };
}

// Elige una longitud "redonda" (50 m, 100 m…) para que la escala gráfica mida cerca de 160 px
function elegirLargoDeEscala() {
  const opciones = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  let mejor = opciones[0];
  opciones.forEach(function (metros) {
    const diferencia = Math.abs(metros / planoConfig.metrosPorPixel - 160);
    if (diferencia < Math.abs(mejor / planoConfig.metrosPorPixel - 160)) {
      mejor = metros;
    }
  });
  return mejor;
}

const FUENTE_SVG = 'system-ui, Segoe UI, Roboto, Arial, sans-serif';

// Texto con borde blanco, para que se lea encima del mapa
function textoConContorno(x, y, texto, tamano, color) {
  return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="' + FUENTE_SVG + '" font-size="' + tamano +
    '" font-weight="700" fill="' + color + '" stroke="#ffffff" stroke-width="' + (tamano * 0.3) +
    '" stroke-linejoin="round" paint-order="stroke">' + texto + '</text>';
}

// Cada forma devuelve cuánto mide en pantalla y el dibujo SVG que va adentro.
// Así el mismo dibujo sirve para la página, las miniaturas y la imagen PNG.
const DIBUJOS = {
  simbolo: function (elemento, tipo) {
    return {
      ancho: elemento.alto,
      alto: elemento.alto,
      contenido: '<g transform="scale(' + elemento.alto / 100 + ')">' + SIMBOLOS[tipo.simbolo](elemento.color) + '</g>'
    };
  },

  zona: function (elemento, tipo) {
    const ancho = elemento.ancho;
    const alto = elemento.alto;
    const pintura = ' fill="' + colorTransparente(elemento.color, 0.45) + '" stroke="' + elemento.color + '" stroke-width="3"/>';
    let contenido = tipo.figura === 'elipse'
      ? '<ellipse cx="' + ancho / 2 + '" cy="' + alto / 2 + '" rx="' + (ancho / 2 - 1.5) + '" ry="' + (alto / 2 - 1.5) + '"' + pintura
      : '<rect x="1.5" y="1.5" width="' + (ancho - 3) + '" height="' + (alto - 3) + '" rx="9"' + pintura;
    if (elemento.mostrarArea) {
      contenido += textoConContorno(ancho / 2, alto / 2 + 4, formatearArea(calcularArea(elemento)), 12, TRAZO);
    }
    return { ancho: ancho, alto: alto, contenido: contenido };
  },

  linea: function (elemento, tipo) {
    const ancho = elemento.ancho;
    const alto = elemento.alto;
    let contenido = '<rect width="' + ancho + '" height="' + alto + '" rx="' + alto / 2 + '" fill="' + elemento.color + '"/>';
    if (tipo.colorCentro) {
      const raya = medidasRayaCentral(alto);
      contenido += '<line x1="' + alto / 2 + '" y1="' + alto / 2 + '" x2="' + (ancho - alto / 2) + '" y2="' + alto / 2 +
        '" stroke="' + tipo.colorCentro + '" stroke-width="' + raya.grosor + '" stroke-dasharray="' + raya.tramo + ' ' + raya.tramo + '"/>';
    }
    return { ancho: ancho, alto: alto, contenido: contenido };
  },

  flecha: function (elemento, tipo) {
    // Pasamos los puntos de la caja de 100 x 50 al tamaño real de la flecha
    const puntos = PUNTOS_FLECHA[tipo.figura].map(function (punto) {
      return (punto[0] / 100 * elemento.ancho) + ',' + (punto[1] / 50 * elemento.alto);
    }).join(' ');
    return {
      ancho: elemento.ancho,
      alto: elemento.alto,
      contenido: '<polygon points="' + puntos + '" fill="' + elemento.color + '"/>'
    };
  },

  // Barra blanca y negra que muestra cuántos metros mide un tramo del mapa
  escala: function (elemento) {
    const metros = elegirLargoDeEscala();
    const largo = metros / planoConfig.metrosPorPixel;
    const margen = 30;
    const alto = elemento.alto;
    const altoBarra = alto * 0.28;
    const tamanoLetra = alto * 0.36;
    const arribaBarra = alto - altoBarra - 2;
    let contenido = '';
    for (let i = 0; i < 4; i++) {
      contenido += '<rect x="' + (margen + i * largo / 4) + '" y="' + arribaBarra + '" width="' + largo / 4 + '" height="' + altoBarra +
        '" fill="' + (i % 2 === 0 ? elemento.color : '#ffffff') + '" stroke="' + elemento.color + '" stroke-width="1.2"/>';
    }
    contenido += textoConContorno(margen, arribaBarra - 4, '0', tamanoLetra, elemento.color);
    contenido += textoConContorno(margen + largo / 2, arribaBarra - 4, String(metros / 2), tamanoLetra, elemento.color);
    contenido += textoConContorno(margen + largo, arribaBarra - 4, formatearMetros(metros), tamanoLetra, elemento.color);
    return { ancho: largo + margen * 2, alto: alto, contenido: contenido };
  },

  // Línea de medida de arquitectura: marcas inclinadas en los extremos y la medida encima.
  // La caja mide 8 px más que la cota para que las marcas no se corten.
  cota: function (elemento) {
    const largo = elemento.ancho;
    const alto = elemento.alto;
    const y = alto * 0.7;
    const inicio = 4;
    const fin = largo + 4;
    const contenido =
      '<g stroke="' + elemento.color + '" stroke-width="1.5" stroke-linecap="round">' +
      '<line x1="' + inicio + '" y1="' + y + '" x2="' + fin + '" y2="' + y + '"/>' +
      '<line x1="' + inicio + '" y1="' + (y - 7) + '" x2="' + inicio + '" y2="' + (y + 5) + '"/>' +
      '<line x1="' + fin + '" y1="' + (y - 7) + '" x2="' + fin + '" y2="' + (y + 5) + '"/>' +
      '<line x1="' + (inicio - 4) + '" y1="' + (y + 4) + '" x2="' + (inicio + 4) + '" y2="' + (y - 4) + '" stroke-width="2.5"/>' +
      '<line x1="' + (fin - 4) + '" y1="' + (y + 4) + '" x2="' + (fin + 4) + '" y2="' + (y - 4) + '" stroke-width="2.5"/></g>' +
      textoConContorno(largo / 2 + 4, y - 5, formatearMetros(largo * planoConfig.metrosPorPixel), alto * 0.46, elemento.color);
    return { ancho: largo + 8, alto: alto, contenido: contenido };
  }
};

// Vías y redes dibujadas a mano: el mismo estilo que las líneas rectas, pero siguiendo los puntos.
// Los puntos están guardados respecto al centro del elemento; los corremos para que quepan en la caja.
// La caja queda centrada en el elemento, así al girarlo gira sobre su centro.
function correrPuntosALaCaja(elemento, cerrado, margen) {
  const mitad = mediaCajaDelCamino(elemento.puntos, cerrado, elemento.suavizar);
  const corrimientoX = mitad.mitadX + margen;
  const corrimientoY = mitad.mitadY + margen;
  return {
    ancho: corrimientoX * 2,
    alto: corrimientoY * 2,
    puntos: elemento.puntos.map(function (p) { return [p[0] + corrimientoX, p[1] + corrimientoY]; })
  };
}

DIBUJOS.trazo = function (elemento, tipo) {
  const caja = correrPuntosALaCaja(elemento, false, elemento.grosor);
  const d = crearCaminoSvg(caja.puntos, false, elemento.suavizar);
  let contenido = '<path d="' + d + '" fill="none" stroke="' + elemento.color + '" stroke-width="' + elemento.grosor +
    '" stroke-linecap="round" stroke-linejoin="round"/>';
  if (tipo.colorCentro) {
    const raya = medidasRayaCentral(elemento.grosor);
    contenido += '<path d="' + d + '" fill="none" stroke="' + tipo.colorCentro + '" stroke-width="' + raya.grosor +
      '" stroke-dasharray="' + raya.tramo + ' ' + raya.tramo + '"/>';
  }
  return { ancho: caja.ancho, alto: caja.alto, contenido: contenido };
};

// Zonas con forma libre (polígono), con la misma pintura que las zonas rectangulares
DIBUJOS.poligono = function (elemento) {
  const caja = correrPuntosALaCaja(elemento, true, 3);
  const ancho = caja.ancho;
  const alto = caja.alto;
  let contenido = '<path d="' + crearCaminoSvg(caja.puntos, true, elemento.suavizar) + '" fill="' + colorTransparente(elemento.color, 0.45) +
    '" stroke="' + elemento.color + '" stroke-width="3" stroke-linejoin="round"/>';
  if (elemento.mostrarArea) {
    contenido += textoConContorno(ancho / 2, alto / 2 + 4, formatearArea(calcularArea(elemento)), 12, TRAZO);
  }
  return { ancho: ancho, alto: alto, contenido: contenido };
};

// Arma el SVG completo de un elemento, con su tamaño exacto
function crearSvgDeElemento(elemento) {
  const tipo = buscarTipo(elemento.tipoId);
  const dibujo = DIBUJOS[formaDe(elemento)](elemento, tipo);
  dibujo.svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + dibujo.ancho + '" height="' + dibujo.alto +
    '" viewBox="0 0 ' + dibujo.ancho + ' ' + dibujo.alto + '">' + dibujo.contenido + '</svg>';
  return dibujo;
}

// Dibuja el aspecto de un elemento dentro de "nodo" (un <div>).
// Se usa para el mapa y también para las miniaturas del panel.
function dibujarContenido(nodo, elemento, claseBase) {
  const tipo = buscarTipo(elemento.tipoId);
  nodo.className = claseBase + ' forma-' + formaDe(elemento);
  nodo.innerHTML = '';
  nodo.style.cssText = '';
  nodo.style.opacity = elemento.opacidad / 100;

  if (seDibujaConSvg(tipo)) {
    const dibujo = crearSvgDeElemento(elemento);
    nodo.style.width = dibujo.ancho + 'px';
    nodo.style.height = dibujo.alto + 'px';
    nodo.innerHTML = dibujo.svg;
    return;
  }

  // Textos
  const estilo = ESTILOS_TEXTO[tipo.estiloTexto];
  nodo.textContent = elemento.texto || ' ';
  nodo.style.fontSize = elemento.alto + 'px';
  nodo.style.fontWeight = estilo.peso;
  nodo.style.color = elemento.color;
  if (estilo.contorno) {
    nodo.classList.add('con-contorno');
  }
  if (estilo.fondo) {
    nodo.classList.add('con-fondo');
    nodo.style.backgroundColor = estilo.fondo;
    nodo.style.borderRadius = estilo.pastilla ? '999px' : '6px';
  }
}

// Pone el nodo en su posición. (x, y) es el CENTRO del elemento.
function colocarNodo(nodo, elemento) {
  nodo.style.left = elemento.x + 'px';
  nodo.style.top = elemento.y + 'px';
  nodo.style.transform = 'translate(-50%, -50%) rotate(' + elemento.rotacion + 'deg)';
}

// Marco punteado con dos manijas: la redonda (arriba) gira y la cuadrada (esquina) cambia el tamaño
function crearManijas() {
  const manijas = document.createElement('div');
  manijas.className = 'manijas';
  manijas.innerHTML =
    '<div class="linea-giro"></div>' +
    '<div class="manija manija-giro" data-accion="girar" title="Arrastra para girar"></div>' +
    '<div class="manija manija-tamano" data-accion="tamano" title="Arrastra para cambiar el tamaño"></div>';
  return manijas;
}

// Dibuja de nuevo un nodo que ya existe (sin reemplazarlo por otro)
function refrescarNodo(nodo, elemento) {
  dibujarContenido(nodo, elemento, 'elemento-mapa');
  colocarNodo(nodo, elemento);
  const capa = estadoCapas[buscarTipo(elemento.tipoId).capa];
  nodo.hidden = !capa.visible;
  nodo.classList.toggle('bloqueado', capa.bloqueada);
  if (elemento.id === idSeleccionado) {
    nodo.classList.add('seleccionado');
    nodo.appendChild(crearManijas());
  }
}

function crearNodoEnMapa(elemento) {
  const nodo = document.createElement('div');
  nodo.dataset.id = elemento.id;
  refrescarNodo(nodo, elemento);
  nodo.addEventListener('pointerdown', empezarAccionSobreElemento);
  return nodo;
}

// Vuelve a dibujar todos los elementos del mapa (en orden: el último queda encima)
function dibujarMapa() {
  capaElementos.innerHTML = '';
  elementosEnMapa.forEach(function (elemento) {
    capaElementos.appendChild(crearNodoEnMapa(elemento));
  });
}

// Vuelve a dibujar un solo elemento (más rápido que redibujar todo)
function actualizarNodo(elemento) {
  const nodo = buscarNodo(elemento.id);
  if (nodo) {
    refrescarNodo(nodo, elemento);
  }
}

// --- Dibujar en canvas (para exportar la imagen PNG) ---

function trazarRectanguloRedondeado(contexto, x, y, ancho, alto, radio) {
  contexto.beginPath();
  if (contexto.roundRect) {
    contexto.roundRect(x, y, ancho, alto, radio);
  } else {
    contexto.rect(x, y, ancho, alto);
  }
}

// Convierte el SVG de un elemento en una imagen que el canvas pueda dibujar.
// Cargar una imagen tarda un momento, por eso devuelve una "promesa".
function cargarImagenDeElemento(elemento) {
  const dibujo = crearSvgDeElemento(elemento);
  return new Promise(function (resolver) {
    const imagen = new Image();
    imagen.onload = function () { resolver(imagen); };
    imagen.onerror = function () { resolver(null); };
    imagen.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(dibujo.svg);
  });
}

function dibujarElementoEnCanvas(contexto, elemento, imagenDelElemento) {
  const tipo = buscarTipo(elemento.tipoId);
  const alto = elemento.alto;

  contexto.save();
  // Movemos el "lápiz" al centro del elemento y lo giramos.
  // Así todo se dibuja alrededor del punto (0, 0).
  contexto.translate(elemento.x, elemento.y);
  contexto.rotate(elemento.rotacion * Math.PI / 180);
  contexto.globalAlpha = elemento.opacidad / 100;

  if (seDibujaConSvg(tipo)) {
    if (imagenDelElemento) {
      const dibujo = crearSvgDeElemento(elemento);
      contexto.drawImage(imagenDelElemento, -dibujo.ancho / 2, -dibujo.alto / 2, dibujo.ancho, dibujo.alto);
    }
    contexto.restore();
    return;
  }

  // Textos
  const estilo = ESTILOS_TEXTO[tipo.estiloTexto];
  contexto.font = estilo.peso + ' ' + alto + 'px ' + FUENTE_TEXTOS;
  contexto.textAlign = 'center';
  contexto.textBaseline = 'middle';
  if (estilo.fondo) {
    const anchoCaja = contexto.measureText(elemento.texto).width + alto * 1.4;
    const altoCaja = alto * 1.8;
    trazarRectanguloRedondeado(contexto, -anchoCaja / 2, -altoCaja / 2, anchoCaja, altoCaja,
      estilo.pastilla ? altoCaja / 2 : 6);
    contexto.fillStyle = estilo.fondo;
    contexto.fill();
    contexto.lineWidth = 1;
    contexto.strokeStyle = '#d1d5db';
    contexto.stroke();
  }
  if (estilo.contorno) {
    contexto.lineWidth = alto * 0.15;
    contexto.lineJoin = 'round';
    contexto.strokeStyle = '#ffffff';
    contexto.strokeText(elemento.texto, 0, 0);
  }
  contexto.fillStyle = elemento.color;
  contexto.fillText(elemento.texto, 0, 0);
  contexto.restore();
}


/* =============================================================
   5. PANEL DE ELEMENTOS: BUSCAR, CATEGORÍAS Y ARRASTRAR
   ============================================================= */

// Quita tildes y mayúsculas para que "arbol" encuentre "Árbol"
function normalizarTexto(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Llena la lista de "¿Qué quieres dibujar?" con las líneas (vías y redes) y las zonas del catálogo
function llenarTiposDeTrazo() {
  [['linea', 'Vías y redes'], ['zona', 'Zonas']].forEach(function (grupo) {
    const opciones = document.createElement('optgroup');
    opciones.label = grupo[1];
    CATALOGO_ELEMENTOS.filter(function (tipo) { return tipo.forma === grupo[0]; }).forEach(function (tipo) {
      const opcion = document.createElement('option');
      opcion.value = tipo.id;
      opcion.textContent = tipo.nombre;
      opciones.appendChild(opcion);
    });
    campoTipoTrazo.appendChild(opciones);
  });
}

function mostrarCategorias() {
  listaCategorias.innerHTML = '';
  CATEGORIAS.forEach(function (categoria) {
    const boton = document.createElement('button');
    boton.className = 'boton-categoria';
    if (categoria.id === categoriaActiva) {
      boton.classList.add('activa');
    }
    boton.textContent = categoria.nombre;
    boton.addEventListener('click', function () {
      categoriaActiva = categoria.id;
      mostrarCategorias();
      mostrarGaleria();
    });
    listaCategorias.appendChild(boton);
  });
}

// Una miniatura del elemento para el panel (y para el "fantasma" al arrastrar)
function crearVistaPrevia(tipo) {
  const elementoDeMuestra = crearDatosElemento(tipo, 0, 0);
  if (tipo.forma === 'simbolo') {
    elementoDeMuestra.alto = 40;
  }
  if (tipo.forma === 'zona') {
    elementoDeMuestra.ancho = 46;
    elementoDeMuestra.alto = 32;
  }
  if (tipo.forma === 'linea') {
    elementoDeMuestra.ancho = 50;
    elementoDeMuestra.alto = limitar(tipo.alto / 2, 6, 14);
  }
  if (tipo.forma === 'texto') {
    elementoDeMuestra.texto = 'Aa';
    elementoDeMuestra.alto = limitar(tipo.tamano * 0.6, 12, 24);
  }
  if (tipo.forma === 'flecha') {
    elementoDeMuestra.ancho = 50;
    elementoDeMuestra.alto = 26;
  }
  if (tipo.forma === 'cota') {
    elementoDeMuestra.ancho = 44;
    elementoDeMuestra.alto = 22;
  }
  const nodo = document.createElement('div');
  dibujarContenido(nodo, elementoDeMuestra, 'vista-previa');
  // Si la miniatura es más grande que la tarjeta (como la escala gráfica), la achicamos
  const anchoMiniatura = parseFloat(nodo.style.width) || 0;
  if (anchoMiniatura > 52) {
    nodo.style.transform = 'scale(' + (52 / anchoMiniatura) + ')';
  }
  return nodo;
}

function mostrarGaleria() {
  const busqueda = normalizarTexto(campoBusqueda.value.trim());
  const tiposVisibles = CATALOGO_ELEMENTOS.filter(function (tipo) {
    // Si la persona escribe algo, buscamos en todas las categorías
    const coincideCategoria = busqueda !== '' || categoriaActiva === 'todos' || tipo.categoria === categoriaActiva;
    const coincideBusqueda = normalizarTexto(tipo.nombre).includes(busqueda);
    return coincideCategoria && coincideBusqueda;
  });

  galeriaElementos.innerHTML = '';
  if (tiposVisibles.length === 0) {
    galeriaElementos.innerHTML = '<p class="sin-resultados">No hay elementos con ese nombre.</p>';
    return;
  }

  tiposVisibles.forEach(function (tipo) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-elemento';
    tarjeta.title = 'Arrastra al mapa: ' + tipo.nombre;

    const caja = document.createElement('div');
    caja.className = 'caja-vista-previa';
    caja.appendChild(crearVistaPrevia(tipo));

    const nombre = document.createElement('span');
    nombre.textContent = tipo.nombre;

    tarjeta.appendChild(caja);
    tarjeta.appendChild(nombre);
    tarjeta.addEventListener('pointerdown', function (evento) {
      empezarArrastreDesdePanel(evento, tipo);
    });
    galeriaElementos.appendChild(tarjeta);
  });
}

function empezarArrastreDesdePanel(evento, tipo) {
  arrastreDesdePanel = {
    tipo: tipo,
    inicioX: evento.clientX,
    inicioY: evento.clientY,
    fantasma: null
  };
}

function moverArrastreDesdePanel(evento) {
  const distancia = Math.hypot(evento.clientX - arrastreDesdePanel.inicioX, evento.clientY - arrastreDesdePanel.inicioY);
  // Solo empezamos a arrastrar si el puntero se movió un poco (si no, es un clic)
  if (!arrastreDesdePanel.fantasma && distancia > 6) {
    arrastreDesdePanel.fantasma = crearVistaPrevia(arrastreDesdePanel.tipo);
    arrastreDesdePanel.fantasma.classList.add('fantasma-arrastre');
    document.body.appendChild(arrastreDesdePanel.fantasma);
  }
  if (arrastreDesdePanel.fantasma) {
    arrastreDesdePanel.fantasma.style.left = evento.clientX + 'px';
    arrastreDesdePanel.fantasma.style.top = evento.clientY + 'px';
  }
}

function terminarArrastreDesdePanel(evento) {
  const tipo = arrastreDesdePanel.tipo;
  const fantasma = arrastreDesdePanel.fantasma;
  arrastreDesdePanel = null;

  if (!fantasma) {
    // Fue un clic o un toque: lo ponemos en el centro de lo que se ve
    // y lo corremos un poco para que no quede justo encima del anterior.
    const centro = obtenerCentroVisible();
    const desfase = (elementosEnMapa.length % 5) * 40 - 80;
    agregarElementoAlMapa(tipo, limitar(centro.x + desfase, 0, ANCHO_LIENZO), limitar(centro.y + desfase, 0, ALTO_LIENZO));
    mostrarAviso(tipo.nombre + ' agregado al mapa');
    return;
  }

  fantasma.remove();
  if (estaSobreElMapa(evento.clientX, evento.clientY)) {
    const punto = obtenerCoordenadasEnLienzo(evento.clientX, evento.clientY);
    agregarElementoAlMapa(tipo, punto.x, punto.y);
  }
}

function cancelarArrastreDesdePanel() {
  if (arrastreDesdePanel && arrastreDesdePanel.fantasma) {
    arrastreDesdePanel.fantasma.remove();
  }
  arrastreDesdePanel = null;
}


/* =============================================================
   6. EN EL MAPA: COLOCAR, SELECCIONAR, MOVER, GIRAR Y CAMBIAR TAMAÑO
   ============================================================= */

// Convierte una posición de la pantalla en una posición dentro del mapa.
// Dividimos por el zoom porque el mapa puede estar ampliado o reducido.
function obtenerCoordenadasEnLienzo(xPantalla, yPantalla) {
  const rectangulo = lienzo.getBoundingClientRect();
  return {
    x: limitar((xPantalla - rectangulo.left) / nivelZoom, 0, ANCHO_LIENZO),
    y: limitar((yPantalla - rectangulo.top) / nivelZoom, 0, ALTO_LIENZO)
  };
}

function obtenerCentroVisible() {
  const rectangulo = contenedorLienzo.getBoundingClientRect();
  return obtenerCoordenadasEnLienzo(rectangulo.left + rectangulo.width / 2, rectangulo.top + rectangulo.height / 2);
}

function estaSobreElMapa(xPantalla, yPantalla) {
  const rectangulo = contenedorLienzo.getBoundingClientRect();
  return xPantalla >= rectangulo.left && xPantalla <= rectangulo.right &&
    yPantalla >= rectangulo.top && yPantalla <= rectangulo.bottom;
}

function agregarElementoAlMapa(tipo, x, y) {
  const elemento = crearDatosElemento(tipo, Math.round(ajustarAlIman(x)), Math.round(ajustarAlIman(y)));
  elemento.id = siguienteId;
  siguienteId = siguienteId + 1;
  // Si su capa estaba oculta o bloqueada, la activamos para que se vea el elemento nuevo
  if (!sePuedeEditar(elemento)) {
    estadoCapas[tipo.capa] = { visible: true, bloqueada: false };
    mostrarAviso('Se activó la capa ' + buscarCapa(tipo.capa).nombre);
    dibujarMapa();
  }
  elementosEnMapa.push(elemento);
  capaElementos.appendChild(crearNodoEnMapa(elemento));
  seleccionarElemento(elemento.id);
  mostrarCapas();
}

// Marca un elemento como elegido: le pone el marco con manijas y abre sus propiedades
function seleccionarElemento(id) {
  idSeleccionado = id;
  capaElementos.querySelectorAll('.manijas').forEach(function (manijas) { manijas.remove(); });
  capaElementos.querySelectorAll('.elemento-mapa').forEach(function (nodo) {
    nodo.classList.toggle('seleccionado', Number(nodo.dataset.id) === id);
  });
  const nodoElegido = buscarNodo(id);
  if (nodoElegido) {
    nodoElegido.appendChild(crearManijas());
  }
  mostrarPropiedades();
}

// Centro del elemento en la pantalla (sirve para girar y cambiar el tamaño)
function centroEnPantalla(nodo) {
  const rectangulo = nodo.getBoundingClientRect();
  return { x: rectangulo.left + rectangulo.width / 2, y: rectangulo.top + rectangulo.height / 2 };
}

// Al tocar un elemento decidimos qué hacer según dónde se tocó:
// en la manija redonda → girar, en la cuadrada → tamaño, en el resto → mover.
function empezarAccionSobreElemento(evento) {
  evento.stopPropagation();
  evento.preventDefault();
  const nodo = evento.currentTarget;
  const elemento = buscarElemento(Number(nodo.dataset.id));
  const accion = evento.target.dataset.accion || 'mover';

  if (elemento.id !== idSeleccionado) {
    seleccionarElemento(elemento.id);
  }
  document.body.dataset.pestana = 'propiedades'; // en el móvil, abre la pestaña Editar

  // "Capturar" el puntero: todos sus movimientos llegan a la capa
  // aunque el dedo o el ratón salgan del elemento.
  try {
    capaElementos.setPointerCapture(evento.pointerId);
  } catch (error) {
    // Si el navegador no lo permite, igual funciona con los eventos de la ventana
  }

  const centro = centroEnPantalla(nodo);
  accionEnCurso = {
    tipo: accion,
    elemento: elemento,
    nodo: nodo,
    inicioX: evento.clientX,
    inicioY: evento.clientY,
    xOriginal: elemento.x,
    yOriginal: elemento.y,
    altoOriginal: elemento.alto,
    puntosOriginales: elemento.puntos ? elemento.puntos.map(function (p) { return p.slice(); }) : null,
    centro: centro,
    distanciaInicial: Math.max(1, Math.hypot(evento.clientX - centro.x, evento.clientY - centro.y))
  };
}

function moverElemento(evento) {
  const elemento = accionEnCurso.elemento;
  const desplazamientoX = (evento.clientX - accionEnCurso.inicioX) / nivelZoom;
  const desplazamientoY = (evento.clientY - accionEnCurso.inicioY) / nivelZoom;
  elemento.x = Math.round(ajustarAlIman(limitar(accionEnCurso.xOriginal + desplazamientoX, 0, ANCHO_LIENZO)));
  elemento.y = Math.round(ajustarAlIman(limitar(accionEnCurso.yOriginal + desplazamientoY, 0, ALTO_LIENZO)));
  colocarNodo(accionEnCurso.nodo, elemento);
}

// El ángulo sale de la posición del puntero respecto al centro del elemento.
// Sumamos 90° porque la manija está arriba (y "arriba" son -90° en matemáticas).
function girarElemento(evento) {
  const elemento = accionEnCurso.elemento;
  const centro = accionEnCurso.centro;
  let angulo = Math.atan2(evento.clientY - centro.y, evento.clientX - centro.x) * 180 / Math.PI + 90;
  // Con Mayúsculas gira de 15° en 15°; sin ella, de 1° en 1° con un "imán" en 0°, 45°, 90°…
  if (evento.shiftKey) {
    angulo = Math.round(angulo / 15) * 15;
  } else {
    const multiploDe45 = Math.round(angulo / 45) * 45;
    angulo = Math.abs(angulo - multiploDe45) < 4 ? multiploDe45 : Math.round(angulo);
  }
  elemento.rotacion = normalizarAngulo(angulo);
  colocarNodo(accionEnCurso.nodo, elemento);
  campoRotacion.value = elemento.rotacion;
  mostrarValoresDeDeslizadores(elemento);
}

function cambiarTamanoConManija(evento) {
  const elemento = accionEnCurso.elemento;
  const tipo = buscarTipo(elemento.tipoId);
  const centro = accionEnCurso.centro;

  const factor = Math.hypot(evento.clientX - centro.x, evento.clientY - centro.y) / accionEnCurso.distanciaInicial;
  if (esDibujoLibre(elemento)) {
    // Los dibujos a mano crecen o se achican completos, multiplicando sus puntos
    elemento.puntos = accionEnCurso.puntosOriginales.map(function (p) {
      return [Math.round(p[0] * factor * 10) / 10, Math.round(p[1] * factor * 10) / 10];
    });
  } else if (usaTamanoUnico(elemento)) {
    // Si alejas el puntero del centro al doble de distancia, el elemento crece al doble
    elemento.alto = Math.round(limitar(accionEnCurso.altoOriginal * factor, LIMITES.tamano.minimo, LIMITES.tamano.maximo));
    elemento.ancho = elemento.alto;
  } else {
    // Pasamos la posición del puntero a las "coordenadas propias" del elemento,
    // deshaciendo su giro, para saber cuánto mide de ancho y de alto.
    const radianes = elemento.rotacion * Math.PI / 180;
    const dx = (evento.clientX - centro.x) / nivelZoom;
    const dy = (evento.clientY - centro.y) / nivelZoom;
    const xPropia = dx * Math.cos(radianes) + dy * Math.sin(radianes);
    const yPropia = -dx * Math.sin(radianes) + dy * Math.cos(radianes);
    elemento.ancho = Math.round(limitar(Math.abs(xPropia) * 2, LIMITES.ancho.minimo, LIMITES.ancho.maximo));
    if (!soloCambiaElLargo(elemento)) {
      elemento.alto = Math.round(limitar(Math.abs(yPropia) * 2, LIMITES.alto.minimo, LIMITES.alto.maximo));
    }
  }
  refrescarNodo(accionEnCurso.nodo, elemento);
  mostrarPropiedades();
}

// Con el ratón, arrastrar el fondo mueve la vista del mapa.
// (En el móvil esto ya lo hace el navegador al deslizar el dedo.)
function empezarPaneo(evento) {
  if (herramienta === 'medir') {
    empezarMedicion(evento);
    return;
  }
  if (herramienta === 'dibujar') {
    empezarODibujarPunto(evento);
    return;
  }
  if (evento.target.closest('.elemento-mapa')) {
    return;
  }
  seleccionarElemento(null);
  if (evento.pointerType === 'mouse') {
    paneoEnCurso = {
      inicioX: evento.clientX,
      inicioY: evento.clientY,
      scrollIzquierdo: contenedorLienzo.scrollLeft,
      scrollArriba: contenedorLienzo.scrollTop
    };
    contenedorLienzo.classList.add('paneando');
  }
}

function moverPaneo(evento) {
  contenedorLienzo.scrollLeft = paneoEnCurso.scrollIzquierdo - (evento.clientX - paneoEnCurso.inicioX);
  contenedorLienzo.scrollTop = paneoEnCurso.scrollArriba - (evento.clientY - paneoEnCurso.inicioY);
}

// --- Herramienta Medir: arrastrar sobre el mapa crea una cota ---

function empezarMedicion(evento) {
  evento.preventDefault();
  const punto = obtenerCoordenadasEnLienzo(evento.clientX, evento.clientY);
  const inicio = { x: ajustarAlIman(punto.x), y: ajustarAlIman(punto.y) };
  const elemento = crearDatosElemento(buscarTipo('cota'), inicio.x, inicio.y);
  elemento.id = siguienteId;
  siguienteId = siguienteId + 1;
  elemento.ancho = 1;
  elementosEnMapa.push(elemento);
  const nodo = crearNodoEnMapa(elemento);
  capaElementos.appendChild(nodo);
  medicionEnCurso = { elemento: elemento, nodo: nodo, inicio: inicio };
}

function moverMedicion(evento) {
  const punto = obtenerCoordenadasEnLienzo(evento.clientX, evento.clientY);
  const fin = { x: ajustarAlIman(punto.x), y: ajustarAlIman(punto.y) };
  const inicio = medicionEnCurso.inicio;
  const elemento = medicionEnCurso.elemento;
  // La cota va del punto inicial al final: su centro es el punto medio
  // y su giro es el ángulo de la línea que los une.
  let angulo = Math.atan2(fin.y - inicio.y, fin.x - inicio.x) * 180 / Math.PI;
  // Para que el texto nunca quede de cabeza, dejamos el ángulo entre -90° y 90°
  if (angulo > 90) {
    angulo = angulo - 180;
  }
  if (angulo <= -90) {
    angulo = angulo + 180;
  }
  elemento.x = Math.round((inicio.x + fin.x) / 2);
  elemento.y = Math.round((inicio.y + fin.y) / 2);
  elemento.ancho = Math.max(1, Math.round(Math.hypot(fin.x - inicio.x, fin.y - inicio.y)));
  elemento.rotacion = Math.round(angulo);
  refrescarNodo(medicionEnCurso.nodo, elemento);
}

function terminarMedicion() {
  const elemento = medicionEnCurso.elemento;
  medicionEnCurso = null;
  cambiarHerramienta('seleccionar');
  if (elemento.ancho < 5) {
    // Fue solo un toque: no hay nada que medir
    elementosEnMapa = elementosEnMapa.filter(function (otro) { return otro !== elemento; });
    dibujarMapa();
    return;
  }
  seleccionarElemento(elemento.id);
  mostrarAviso('Medida: ' + formatearMetros(elemento.ancho * planoConfig.metrosPorPixel));
}

// --- Herramienta Dibujar: cada toque agrega un punto a una vía, red o zona ---

function empezarODibujarPunto(evento) {
  evento.preventDefault();
  const punto = obtenerCoordenadasEnLienzo(evento.clientX, evento.clientY);
  const nuevo = [ajustarAlIman(punto.x), ajustarAlIman(punto.y)];
  const ultimo = dibujoEnCurso.puntos[dibujoEnCurso.puntos.length - 1];
  // Un doble clic toca dos veces el mismo lugar: no repetimos el punto
  if (!ultimo || Math.hypot(ultimo[0] - nuevo[0], ultimo[1] - nuevo[1]) > 2) {
    dibujoEnCurso.puntos.push(nuevo);
  }
  dibujoEnCurso.cursor = nuevo;
  dibujarGuia();
}

function moverCursorDeDibujo(evento) {
  if (!estaSobreElMapa(evento.clientX, evento.clientY)) {
    return;
  }
  const punto = obtenerCoordenadasEnLienzo(evento.clientX, evento.clientY);
  dibujoEnCurso.cursor = [ajustarAlIman(punto.x), ajustarAlIman(punto.y)];
  dibujarGuia();
}

// Línea de ayuda mientras se dibuja: los puntos puestos y un tramo hasta el puntero
function dibujarGuia() {
  const tipo = dibujoEnCurso.tipo;
  const esZona = tipo.forma === 'zona';
  const puntos = dibujoEnCurso.puntos.slice();
  if (dibujoEnCurso.cursor) {
    puntos.push(dibujoEnCurso.cursor);
  }
  let contenido = '';
  if (puntos.length >= 2) {
    const d = crearCaminoSvg(puntos, esZona && puntos.length > 2, campoSuavizarDibujo.checked);
    contenido += esZona
      ? '<path d="' + d + '" fill="' + colorTransparente(tipo.color, 0.35) + '" stroke="' + tipo.color + '" stroke-width="2" stroke-dasharray="6 4"/>'
      : '<path d="' + d + '" fill="none" stroke="' + tipo.color + '" stroke-width="' + Math.max(3, tipo.alto) + '" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>';
  }
  dibujoEnCurso.puntos.forEach(function (p) {
    contenido += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>';
  });
  guiaDibujo.innerHTML = contenido;
}

function terminarDibujo() {
  if (!dibujoEnCurso) {
    return;
  }
  const tipo = dibujoEnCurso.tipo;
  const puntos = dibujoEnCurso.puntos;
  const minimo = tipo.forma === 'zona' ? 3 : 2;
  if (puntos.length < minimo) {
    mostrarAviso(tipo.forma === 'zona' ? 'Una zona necesita al menos 3 puntos' : 'Una vía necesita al menos 2 puntos');
    return;
  }
  // El centro del elemento es el centro de la caja de puntos; guardamos los puntos respecto a él
  const caja = cajaDePuntos(puntos);
  const centroX = (caja.minX + caja.maxX) / 2;
  const centroY = (caja.minY + caja.maxY) / 2;
  const elemento = crearDatosElemento(tipo, centroX, centroY);
  elemento.id = siguienteId;
  siguienteId = siguienteId + 1;
  elemento.puntos = puntos.map(function (p) { return [p[0] - centroX, p[1] - centroY]; });
  elemento.suavizar = campoSuavizarDibujo.checked;
  elemento.grosor = tipo.forma === 'zona' ? 0 : tipo.alto;
  dibujoEnCurso = null;
  guiaDibujo.innerHTML = '';
  cambiarHerramienta('seleccionar');
  if (!sePuedeEditar(elemento)) {
    estadoCapas[tipo.capa] = { visible: true, bloqueada: false };
  }
  elementosEnMapa.push(elemento);
  dibujarMapa();
  seleccionarElemento(elemento.id);
  mostrarCapas();
}

function cancelarDibujo() {
  dibujoEnCurso = null;
  guiaDibujo.innerHTML = '';
  cambiarHerramienta('seleccionar');
}

function quitarUltimoPunto() {
  if (dibujoEnCurso && dibujoEnCurso.puntos.length > 0) {
    dibujoEnCurso.puntos.pop();
    dibujarGuia();
  }
}

function empezarHerramientaDibujar() {
  const tipo = buscarTipo(campoTipoTrazo.value);
  dibujoEnCurso = { tipo: tipo, puntos: [], cursor: null };
  cambiarHerramienta('dibujar');
  mostrarAviso('Toca el mapa para poner puntos. Doble clic o "Terminar" para acabar.');
}

function cambiarHerramienta(nombre) {
  if (herramienta === 'dibujar' && nombre !== 'dibujar' && dibujoEnCurso) {
    dibujoEnCurso = null;
    guiaDibujo.innerHTML = '';
  }
  herramienta = nombre;
  barraDibujo.hidden = nombre !== 'dibujar';
  document.getElementById('boton-dibujar').classList.toggle('activa', nombre === 'dibujar');
  document.body.dataset.herramienta = nombre;
  document.querySelectorAll('[data-herramienta]').forEach(function (boton) {
    boton.classList.toggle('activa', boton.dataset.herramienta === nombre);
  });
  if (nombre === 'medir') {
    seleccionarElemento(null);
    mostrarAviso('Arrastra sobre el mapa para medir una distancia');
  }
}

// Un solo lugar escucha el movimiento del puntero para todos los tipos de arrastre
function alMoverPuntero(evento) {
  if (medicionEnCurso) {
    moverMedicion(evento);
  }
  if (dibujoEnCurso) {
    moverCursorDeDibujo(evento);
  }
  if (arrastreDesdePanel) {
    moverArrastreDesdePanel(evento);
  }
  if (accionEnCurso && accionEnCurso.tipo === 'mover') {
    moverElemento(evento);
  }
  if (accionEnCurso && accionEnCurso.tipo === 'girar') {
    girarElemento(evento);
  }
  if (accionEnCurso && accionEnCurso.tipo === 'tamano') {
    cambiarTamanoConManija(evento);
  }
  if (paneoEnCurso) {
    moverPaneo(evento);
  }
}

function alSoltarPuntero(evento) {
  if (arrastreDesdePanel) {
    terminarArrastreDesdePanel(evento);
  }
  if (medicionEnCurso) {
    terminarMedicion();
  }
  accionEnCurso = null;
  paneoEnCurso = null;
  contenedorLienzo.classList.remove('paneando');
}

function alCancelarPuntero() {
  cancelarArrastreDesdePanel();
  if (medicionEnCurso) {
    terminarMedicion();
  }
  accionEnCurso = null;
  paneoEnCurso = null;
  contenedorLienzo.classList.remove('paneando');
}


/* =============================================================
   7. PANEL DE PROPIEDADES
   ============================================================= */

function mostrarPropiedades() {
  const elemento = buscarElemento(idSeleccionado);
  seccionFondo.hidden = Boolean(elemento);
  seccionElemento.hidden = !elemento;
  if (!elemento) {
    return;
  }

  const tipo = buscarTipo(elemento.tipoId);
  tituloElemento.textContent = tipo.nombre;
  document.getElementById('texto-capa-elemento').textContent = 'Capa: ' + buscarCapa(tipo.capa).nombre;

  // Cada forma muestra solo los controles que tienen sentido para ella
  const forma = formaDe(elemento);
  const tamanoUnico = usaTamanoUnico(elemento);
  const libre = esDibujoLibre(elemento);
  document.getElementById('grupo-texto').hidden = forma !== 'texto';
  document.getElementById('grupo-tamano').hidden = !tamanoUnico;
  document.getElementById('grupo-ancho').hidden = tamanoUnico || libre;
  document.getElementById('grupo-alto').hidden = tamanoUnico || libre || forma === 'cota';
  document.getElementById('grupo-area').hidden = forma !== 'zona' && forma !== 'poligono';
  document.getElementById('grupo-medida').hidden = forma !== 'cota';
  document.getElementById('grupo-trazo').hidden = !libre;
  document.getElementById('grupo-grosor').hidden = forma !== 'trazo';
  document.getElementById('grupo-largo').hidden = forma !== 'trazo';
  campoMostrarArea.checked = Boolean(elemento.mostrarArea);
  campoSuavizar.checked = Boolean(elemento.suavizar);
  campoGrosor.value = elemento.grosor || 1;
  document.getElementById('nombre-ancho').textContent = soloCambiaElLargo(elemento) ? 'Largo' : 'Ancho';
  document.getElementById('nombre-alto').textContent = forma === 'linea' ? 'Grosor' : 'Alto';

  if (document.activeElement !== campoTexto) {
    campoTexto.value = elemento.texto;
  }
  campoColor.value = elemento.color;
  campoTamano.value = elemento.alto;
  campoAncho.value = elemento.ancho;
  campoAlto.value = elemento.alto;
  campoRotacion.value = elemento.rotacion;
  campoOpacidad.value = elemento.opacidad;
  mostrarValoresDeDeslizadores(elemento);
}

function mostrarValoresDeDeslizadores(elemento) {
  document.getElementById('valor-tamano').textContent = elemento.alto + ' px';
  document.getElementById('valor-ancho').textContent = elemento.ancho + ' px';
  document.getElementById('valor-alto').textContent = elemento.alto + ' px';
  document.getElementById('valor-rotacion').textContent = elemento.rotacion + '°';
  document.getElementById('valor-opacidad').textContent = elemento.opacidad + '%';
  const forma = formaDe(elemento);
  if (forma === 'zona' || forma === 'poligono') {
    document.getElementById('valor-area').textContent = formatearArea(calcularArea(elemento));
  }
  if (forma === 'trazo') {
    document.getElementById('valor-largo').textContent = formatearMetros(largoDeTrazo(elemento.puntos) * planoConfig.metrosPorPixel);
    document.getElementById('valor-grosor').textContent = elemento.grosor + ' px';
  }
  if (forma === 'cota') {
    document.getElementById('valor-medida').textContent = formatearMetros(elemento.ancho * planoConfig.metrosPorPixel);
  }
}

// Calibrar: si esta cota mide X metros en la realidad, cada píxel vale X / largo
function calibrarConCota() {
  const elemento = buscarElemento(idSeleccionado);
  const medidaReal = Number(campoMedidaReal.value.replace(',', '.'));
  if (!elemento || !(medidaReal > 0)) {
    mostrarAviso('Escribe la medida real en metros, por ejemplo 25');
    return;
  }
  planoConfig.metrosPorPixel = medidaReal / elemento.ancho;
  aplicarPlano();
  dibujarMapa();
  seleccionarElemento(elemento.id);
  mostrarAviso('Escala calibrada: 1 px = ' + planoConfig.metrosPorPixel.toLocaleString('es-CO', { maximumFractionDigits: 3 }) + ' m');
}

// Aplica un cambio al elemento seleccionado y lo vuelve a dibujar
function cambiarElementoSeleccionado(aplicarCambio) {
  const elemento = buscarElemento(idSeleccionado);
  if (!elemento) {
    return;
  }
  aplicarCambio(elemento);
  actualizarNodo(elemento);
  mostrarValoresDeDeslizadores(elemento);
}

// Aumentar o disminuir el tamaño multiplicando por un factor (1.15 o 0.87)
function cambiarTamanoPorFactor(factor) {
  cambiarElementoSeleccionado(function (elemento) {
    if (esDibujoLibre(elemento)) {
      elemento.puntos = elemento.puntos.map(function (p) { return [p[0] * factor, p[1] * factor]; });
    } else if (usaTamanoUnico(elemento)) {
      elemento.alto = Math.round(limitar(elemento.alto * factor, LIMITES.tamano.minimo, LIMITES.tamano.maximo));
      elemento.ancho = elemento.alto;
    } else {
      elemento.ancho = Math.round(limitar(elemento.ancho * factor, LIMITES.ancho.minimo, LIMITES.ancho.maximo));
      elemento.alto = Math.round(limitar(elemento.alto * factor, LIMITES.alto.minimo, LIMITES.alto.maximo));
    }
  });
  mostrarPropiedades();
}

// Girar con los botones: sumamos grados o volvemos a 0°
function girarPorBotones(grados, volverACero) {
  cambiarElementoSeleccionado(function (elemento) {
    elemento.rotacion = volverACero ? 0 : normalizarAngulo(elemento.rotacion + grados);
  });
  mostrarPropiedades();
}

function moverElementoEnCapas(haciaElFrente) {
  const elemento = buscarElemento(idSeleccionado);
  if (!elemento) {
    return;
  }
  // El orden de la lista es el orden de dibujo: el último queda encima
  elementosEnMapa = elementosEnMapa.filter(function (otro) { return otro !== elemento; });
  if (haciaElFrente) {
    elementosEnMapa.push(elemento);
  } else {
    elementosEnMapa.unshift(elemento);
  }
  dibujarMapa();
}

function duplicarElemento() {
  const elemento = buscarElemento(idSeleccionado);
  if (!elemento) {
    return;
  }
  const copia = JSON.parse(JSON.stringify(elemento));
  copia.id = siguienteId;
  siguienteId = siguienteId + 1;
  copia.x = limitar(elemento.x + 20, 0, ANCHO_LIENZO);
  copia.y = limitar(elemento.y + 20, 0, ALTO_LIENZO);
  elementosEnMapa.push(copia);
  capaElementos.appendChild(crearNodoEnMapa(copia));
  seleccionarElemento(copia.id);
  mostrarCapas();
}

function eliminarElemento() {
  elementosEnMapa = elementosEnMapa.filter(function (elemento) { return elemento.id !== idSeleccionado; });
  dibujarMapa();
  seleccionarElemento(null);
  mostrarCapas();
}


/* =============================================================
   8. FONDO DEL MAPA Y ZOOM
   ============================================================= */

function aplicarFondo() {
  lienzo.style.backgroundColor = fondoDelMapa.color;
  imagenMapa.style.opacity = fondoDelMapa.visibilidad / 100;
  // "multiply" mezcla la imagen con el color de fondo, como teñirla
  imagenMapa.style.mixBlendMode = fondoDelMapa.tenido ? 'multiply' : 'normal';
  campoColorFondo.value = fondoDelMapa.color;
  campoVisibilidad.value = fondoDelMapa.visibilidad;
  campoTenido.checked = fondoDelMapa.tenido;
  document.getElementById('valor-visibilidad').textContent = fondoDelMapa.visibilidad + '%';
}

function buscarCapa(capaId) {
  return CAPAS.find(function (capa) { return capa.id === capaId; });
}

// Dibuja la lista de capas en el panel: casilla para verla y botón para bloquearla
function mostrarCapas() {
  listaCapas.innerHTML = '';
  CAPAS.forEach(function (capa) {
    const estado = estadoCapas[capa.id];
    const cantidad = elementosEnMapa.filter(function (elemento) {
      return buscarTipo(elemento.tipoId).capa === capa.id;
    }).length;

    const fila = document.createElement('li');
    fila.className = 'fila-capa';
    if (!estado.visible) {
      fila.classList.add('capa-oculta');
    }

    const etiqueta = document.createElement('label');
    etiqueta.className = 'fila-capa-nombre';
    const casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.checked = estado.visible;
    casilla.addEventListener('change', function () {
      estado.visible = casilla.checked;
      actualizarTrasCambiarCapas();
    });
    etiqueta.appendChild(casilla);
    etiqueta.appendChild(document.createTextNode(' ' + capa.nombre + ' (' + cantidad + ')'));

    const botonBloquear = document.createElement('button');
    botonBloquear.className = 'boton-bloquear';
    botonBloquear.textContent = estado.bloqueada ? 'Bloqueada' : 'Bloquear';
    botonBloquear.classList.toggle('activa', estado.bloqueada);
    botonBloquear.title = estado.bloqueada ? 'Desbloquear esta capa' : 'Bloquear: no se podrá mover ni editar';
    botonBloquear.addEventListener('click', function () {
      estado.bloqueada = !estado.bloqueada;
      actualizarTrasCambiarCapas();
    });

    fila.appendChild(etiqueta);
    fila.appendChild(botonBloquear);
    listaCapas.appendChild(fila);
  });
}

function actualizarTrasCambiarCapas() {
  const elegido = buscarElemento(idSeleccionado);
  if (elegido && !sePuedeEditar(elegido)) {
    idSeleccionado = null;
  }
  dibujarMapa();
  mostrarCapas();
  mostrarPropiedades();
}

function mostrarTodasLasCapas() {
  estadoCapas = crearEstadoCapasInicial();
  actualizarTrasCambiarCapas();
}

// Muestra la cuadrícula y pone los valores de la escala en el panel
function aplicarPlano() {
  capaCuadricula.hidden = !planoConfig.cuadriculaVisible;
  capaCuadricula.style.backgroundSize = planoConfig.tamanoCuadricula + 'px ' + planoConfig.tamanoCuadricula + 'px';
  campoMetrosPixel.value = Number(planoConfig.metrosPorPixel.toFixed(3));
  campoMostrarCuadricula.checked = planoConfig.cuadriculaVisible;
  campoTamanoCuadricula.value = String(planoConfig.tamanoCuadricula);
  campoIman.checked = planoConfig.imanActivo;
  document.getElementById('valor-cuadricula-metros').textContent =
    'cada cuadro ≈ ' + formatearMetros(planoConfig.tamanoCuadricula * planoConfig.metrosPorPixel);
  document.getElementById('boton-cuadricula').classList.toggle('activa', planoConfig.cuadriculaVisible);
  document.getElementById('boton-iman').classList.toggle('activa', planoConfig.imanActivo);
}

// El mapa se amplía con "scale". El marco que lo rodea cambia de tamaño
// para que las barras de desplazamiento sepan cuánto mide el mapa ampliado.
function cambiarZoom(nuevoZoom) {
  const centroAntes = obtenerCentroVisible();
  nivelZoom = limitar(nuevoZoom, 0.25, 4);
  marcoLienzo.style.width = ANCHO_LIENZO * nivelZoom + 'px';
  marcoLienzo.style.height = ALTO_LIENZO * nivelZoom + 'px';
  lienzo.style.transform = 'scale(' + nivelZoom + ')';
  // Las manijas usan este valor para verse siempre del mismo tamaño
  lienzo.style.setProperty('--escala-inversa', 1 / nivelZoom);
  document.getElementById('texto-zoom').textContent = Math.round(nivelZoom * 100) + '%';
  // Mantenemos en el centro de la vista el mismo punto que había antes
  contenedorLienzo.scrollLeft = centroAntes.x * nivelZoom - contenedorLienzo.clientWidth / 2;
  contenedorLienzo.scrollTop = centroAntes.y * nivelZoom - contenedorLienzo.clientHeight / 2;
}

function ajustarZoomALaPantalla() {
  const margen = 48;
  const zoomAncho = (contenedorLienzo.clientWidth - margen) / ANCHO_LIENZO;
  const zoomAlto = (contenedorLienzo.clientHeight - margen) / ALTO_LIENZO;
  cambiarZoom(Math.min(zoomAncho, zoomAlto));
}


/* =============================================================
   9. GUARDAR, ABRIR Y EXPORTAR
   ============================================================= */

function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.classList.add('visible');
  clearTimeout(mostrarAviso.temporizador);
  mostrarAviso.temporizador = setTimeout(function () {
    aviso.classList.remove('visible');
  }, 2200);
}

// Todo lo necesario para volver a abrir el mapa más tarde
function obtenerDatosDelMapa() {
  return {
    nombre: nombreDelMapa,
    fecha: new Date().toISOString(),
    fondo: Object.assign({}, fondoDelMapa),
    plano: Object.assign({}, planoConfig),
    capas: JSON.parse(JSON.stringify(estadoCapas)),
    elementos: elementosEnMapa.map(function (elemento) { return Object.assign({}, elemento); })
  };
}

function cargarDatosDelMapa(datos) {
  nombreDelMapa = datos.nombre || 'Mi mapa de Siloé';
  fondoDelMapa = Object.assign({ color: '#ffffff', visibilidad: 100, tenido: false }, datos.fondo);
  planoConfig = Object.assign({ metrosPorPixel: 1.5, cuadriculaVisible: false, tamanoCuadricula: 20, imanActivo: false }, datos.plano);
  estadoCapas = Object.assign(crearEstadoCapasInicial(), datos.capas);
  // Ignoramos elementos cuyo tipo ya no exista en el catálogo
  elementosEnMapa = (datos.elementos || []).filter(function (elemento) { return buscarTipo(elemento.tipoId); });
  siguienteId = elementosEnMapa.reduce(function (mayor, elemento) { return Math.max(mayor, elemento.id); }, 0) + 1;
  idSeleccionado = null;
  aplicarFondo();
  aplicarPlano();
  dibujarMapa();
  mostrarCapas();
  mostrarPropiedades();
}

// Los mapas se guardan en el navegador (localStorage) como texto JSON
function leerMapasGuardados() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_GUARDADO)) || {};
  } catch (error) {
    return {};
  }
}

function escribirMapasGuardados(mapas) {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(mapas));
    return true;
  } catch (error) {
    mostrarAviso('Este navegador no deja guardar aquí. Usa "Descargar archivo del mapa".');
    return false;
  }
}

function guardarMapaActual() {
  nombreDelMapa = campoNombreMapa.value.trim() || 'Mi mapa de Siloé';
  const mapas = leerMapasGuardados();
  mapas[nombreDelMapa] = obtenerDatosDelMapa();
  if (escribirMapasGuardados(mapas)) {
    mostrarAviso('Mapa guardado: ' + nombreDelMapa);
    mostrarListaDeMapas();
  }
}

function mostrarListaDeMapas() {
  const mapas = leerMapasGuardados();
  const nombres = Object.keys(mapas);
  listaMapas.innerHTML = '';
  if (nombres.length === 0) {
    listaMapas.innerHTML = '<li class="ayuda">Todavía no has guardado ningún mapa.</li>';
    return;
  }
  nombres.forEach(function (nombre) {
    const fila = document.createElement('li');
    fila.className = 'fila-mapa';

    const texto = document.createElement('span');
    texto.className = 'fila-mapa-nombre';
    texto.textContent = nombre;
    const fecha = document.createElement('small');
    fecha.textContent = new Date(mapas[nombre].fecha).toLocaleString('es');
    texto.appendChild(fecha);

    const botonAbrir = document.createElement('button');
    botonAbrir.className = 'boton';
    botonAbrir.textContent = 'Abrir';
    botonAbrir.addEventListener('click', function () {
      cargarDatosDelMapa(mapas[nombre]);
      dialogoMapas.close();
      mostrarAviso('Mapa abierto: ' + nombre);
    });

    const botonBorrar = document.createElement('button');
    botonBorrar.className = 'boton boton-peligro';
    botonBorrar.textContent = 'Borrar';
    botonBorrar.addEventListener('click', function () {
      if (confirm('¿Borrar el mapa "' + nombre + '"?')) {
        delete mapas[nombre];
        escribirMapasGuardados(mapas);
        mostrarListaDeMapas();
      }
    });

    fila.appendChild(texto);
    fila.appendChild(botonAbrir);
    fila.appendChild(botonBorrar);
    listaMapas.appendChild(fila);
  });
}

function abrirDialogoMapas() {
  campoNombreMapa.value = nombreDelMapa;
  mostrarListaDeMapas();
  dialogoMapas.showModal();
}

function empezarMapaNuevo() {
  if (elementosEnMapa.length > 0 && !confirm('¿Empezar un mapa nuevo? Lo que no hayas guardado se perderá.')) {
    return;
  }
  cargarDatosDelMapa({ nombre: 'Mi mapa de Siloé', elementos: [] });
}

// Descarga un archivo creado en el momento (imagen o JSON)
function descargarArchivo(nombreArchivo, direccion) {
  const enlace = document.createElement('a');
  enlace.download = nombreArchivo;
  enlace.href = direccion;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

// Dibuja el mapa completo en un <canvas> y lo descarga como PNG.
// Es "async" porque primero hay que esperar a que carguen las imágenes de los elementos.
async function exportarComoImagen() {
  const imagenesDeElementos = await Promise.all(elementosEnMapa.map(function (elemento) {
    return seDibujaConSvg(buscarTipo(elemento.tipoId)) ? cargarImagenDeElemento(elemento) : null;
  }));

  const escala = 2; // el doble de píxeles, para que se vea nítido
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO_LIENZO * escala;
  canvas.height = ALTO_LIENZO * escala;
  const contexto = canvas.getContext('2d');
  contexto.scale(escala, escala);

  contexto.fillStyle = fondoDelMapa.color;
  contexto.fillRect(0, 0, ANCHO_LIENZO, ALTO_LIENZO);

  contexto.save();
  contexto.globalAlpha = fondoDelMapa.visibilidad / 100;
  if (fondoDelMapa.tenido) {
    contexto.globalCompositeOperation = 'multiply';
  }
  contexto.drawImage(imagenMapa, 0, 0, ANCHO_LIENZO, ALTO_LIENZO);
  contexto.restore();

  elementosEnMapa.forEach(function (elemento, indice) {
    if (!capaDelElemento(elemento).visible) {
      return; // las capas ocultas no salen en la imagen
    }
    dibujarElementoEnCanvas(contexto, elemento, imagenesDeElementos[indice]);
  });

  descargarArchivo(nombreDelMapa + '.png', canvas.toDataURL('image/png'));
  mostrarAviso('Imagen descargada');
}

function imprimirMapa() {
  dialogoExportar.close();
  seleccionarElemento(null);
  window.print();
}

function descargarArchivoDelMapa() {
  const texto = JSON.stringify(obtenerDatosDelMapa(), null, 2);
  const direccion = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  descargarArchivo(nombreDelMapa + '.json', direccion);
  setTimeout(function () { URL.revokeObjectURL(direccion); }, 1000);
}

// Lee un archivo .json elegido por la persona (FileReader no necesita servidor)
function abrirArchivoDelMapa() {
  const archivo = campoAbrirArchivo.files[0];
  if (!archivo) {
    return;
  }
  const lector = new FileReader();
  lector.onload = function () {
    try {
      cargarDatosDelMapa(JSON.parse(lector.result));
      dialogoExportar.close();
      mostrarAviso('Mapa abierto: ' + nombreDelMapa);
    } catch (error) {
      mostrarAviso('Ese archivo no es un mapa válido');
    }
  };
  lector.readAsText(archivo);
  campoAbrirArchivo.value = '';
}

function cambiarVistaLimpia(activar) {
  seleccionarElemento(null);
  document.body.classList.toggle('vista-limpia', activar);
  ajustarZoomALaPantalla();
}


/* =============================================================
   10. ARRANQUE DE LA APLICACIÓN
   ============================================================= */

function conectarEventos() {
  // Panel de elementos
  campoBusqueda.addEventListener('input', mostrarGaleria);

  // Arrastrar: escuchamos en toda la ventana para no perder el puntero
  window.addEventListener('pointermove', alMoverPuntero);
  window.addEventListener('pointerup', alSoltarPuntero);
  window.addEventListener('pointercancel', alCancelarPuntero);
  contenedorLienzo.addEventListener('pointerdown', empezarPaneo);

  // Ctrl + rueda del ratón para ampliar o reducir
  contenedorLienzo.addEventListener('wheel', function (evento) {
    if (evento.ctrlKey) {
      evento.preventDefault();
      cambiarZoom(nivelZoom * (evento.deltaY < 0 ? 1.1 : 0.9));
    }
  }, { passive: false });

  // Zoom
  document.getElementById('boton-acercar').addEventListener('click', function () { cambiarZoom(nivelZoom * 1.25); });
  document.getElementById('boton-alejar').addEventListener('click', function () { cambiarZoom(nivelZoom / 1.25); });
  document.getElementById('boton-ajustar').addEventListener('click', ajustarZoomALaPantalla);

  // Fondo
  campoColorFondo.addEventListener('input', function () {
    fondoDelMapa.color = campoColorFondo.value;
    aplicarFondo();
  });
  campoVisibilidad.addEventListener('input', function () {
    fondoDelMapa.visibilidad = Number(campoVisibilidad.value);
    aplicarFondo();
  });
  campoTenido.addEventListener('change', function () {
    fondoDelMapa.tenido = campoTenido.checked;
    aplicarFondo();
  });

  // Dibujar vías, redes y zonas a mano
  document.getElementById('boton-dibujar').addEventListener('click', empezarHerramientaDibujar);
  document.getElementById('boton-terminar-dibujo').addEventListener('click', terminarDibujo);
  document.getElementById('boton-deshacer-punto').addEventListener('click', quitarUltimoPunto);
  document.getElementById('boton-cancelar-dibujo').addEventListener('click', cancelarDibujo);
  contenedorLienzo.addEventListener('dblclick', function () {
    if (herramienta === 'dibujar') {
      terminarDibujo();
    }
  });
  campoSuavizar.addEventListener('change', function () {
    cambiarElementoSeleccionado(function (elemento) { elemento.suavizar = campoSuavizar.checked; });
  });
  campoGrosor.addEventListener('input', function () {
    cambiarElementoSeleccionado(function (elemento) { elemento.grosor = Number(campoGrosor.value); });
  });

  // Capas
  document.getElementById('boton-mostrar-capas').addEventListener('click', mostrarTodasLasCapas);

  // Escala, cuadrícula e imán
  campoMetrosPixel.addEventListener('change', function () {
    const valor = Number(campoMetrosPixel.value);
    if (valor > 0) {
      planoConfig.metrosPorPixel = valor;
      dibujarMapa();
    }
    aplicarPlano();
  });
  campoMostrarCuadricula.addEventListener('change', function () {
    planoConfig.cuadriculaVisible = campoMostrarCuadricula.checked;
    aplicarPlano();
  });
  campoTamanoCuadricula.addEventListener('change', function () {
    planoConfig.tamanoCuadricula = Number(campoTamanoCuadricula.value);
    aplicarPlano();
  });
  campoIman.addEventListener('change', function () {
    planoConfig.imanActivo = campoIman.checked;
    aplicarPlano();
  });
  document.getElementById('boton-cuadricula').addEventListener('click', function () {
    planoConfig.cuadriculaVisible = !planoConfig.cuadriculaVisible;
    aplicarPlano();
  });
  document.getElementById('boton-iman').addEventListener('click', function () {
    planoConfig.imanActivo = !planoConfig.imanActivo;
    aplicarPlano();
    mostrarAviso(planoConfig.imanActivo ? 'Imán activado: los elementos se alinean a la cuadrícula' : 'Imán desactivado');
  });
  document.querySelectorAll('[data-herramienta]').forEach(function (boton) {
    boton.addEventListener('click', function () { cambiarHerramienta(boton.dataset.herramienta); });
  });

  // Propiedades del elemento seleccionado
  campoMostrarArea.addEventListener('change', function () {
    cambiarElementoSeleccionado(function (elemento) { elemento.mostrarArea = campoMostrarArea.checked; });
  });
  document.getElementById('boton-calibrar').addEventListener('click', calibrarConCota);
  campoTexto.addEventListener('input', function () {
    cambiarElementoSeleccionado(function (elemento) { elemento.texto = campoTexto.value; });
  });
  campoColor.addEventListener('input', function () {
    cambiarElementoSeleccionado(function (elemento) { elemento.color = campoColor.value; });
  });
  campoTamano.addEventListener('input', function () {
    cambiarElementoSeleccionado(function (elemento) {
      elemento.alto = Number(campoTamano.value);
      elemento.ancho = elemento.alto;
    });
  });
  campoAncho.addEventListener('input', function () {
    cambiarElementoSeleccionado(function (elemento) { elemento.ancho = Number(campoAncho.value); });
  });
  campoAlto.addEventListener('input', function () {
    cambiarElementoSeleccionado(function (elemento) { elemento.alto = Number(campoAlto.value); });
  });
  campoRotacion.addEventListener('input', function () {
    cambiarElementoSeleccionado(function (elemento) { elemento.rotacion = Number(campoRotacion.value); });
  });
  campoOpacidad.addEventListener('input', function () {
    cambiarElementoSeleccionado(function (elemento) { elemento.opacidad = Number(campoOpacidad.value); });
  });
  document.getElementById('boton-agrandar').addEventListener('click', function () { cambiarTamanoPorFactor(1.15); });
  document.getElementById('boton-achicar').addEventListener('click', function () { cambiarTamanoPorFactor(0.87); });
  document.getElementById('boton-girar-izquierda').addEventListener('click', function () { girarPorBotones(-15, false); });
  document.getElementById('boton-girar-derecha').addEventListener('click', function () { girarPorBotones(15, false); });
  document.getElementById('boton-girar-recto').addEventListener('click', function () { girarPorBotones(0, true); });
  document.getElementById('boton-al-frente').addEventListener('click', function () { moverElementoEnCapas(true); });
  document.getElementById('boton-al-fondo').addEventListener('click', function () { moverElementoEnCapas(false); });
  document.getElementById('boton-duplicar').addEventListener('click', duplicarElemento);
  document.getElementById('boton-eliminar').addEventListener('click', eliminarElemento);
  document.getElementById('boton-listo').addEventListener('click', function () { seleccionarElemento(null); });

  // Teclado: Suprimir quita el elemento; R gira 15° (Mayúsculas + R, al otro lado)
  document.addEventListener('keydown', function (evento) {
    const escribiendo = evento.target.tagName === 'INPUT';
    if (evento.key === 'Escape') {
      cambiarHerramienta('seleccionar');
    }
    if (herramienta === 'dibujar' && !escribiendo) {
      if (evento.key === 'Enter') {
        terminarDibujo();
      }
      if (evento.key === 'Backspace') {
        evento.preventDefault();
        quitarUltimoPunto();
      }
      return;
    }
    if (!idSeleccionado || escribiendo) {
      return;
    }
    if (evento.key === 'Delete' || evento.key === 'Backspace') {
      eliminarElemento();
    }
    if (evento.key === 'r' || evento.key === 'R') {
      girarPorBotones(evento.shiftKey ? -15 : 15, false);
    }
  });

  // Barra superior
  document.getElementById('boton-nuevo').addEventListener('click', empezarMapaNuevo);
  document.getElementById('boton-mis-mapas').addEventListener('click', abrirDialogoMapas);
  document.getElementById('boton-exportar').addEventListener('click', function () { dialogoExportar.showModal(); });
  document.getElementById('boton-vista-limpia').addEventListener('click', function () { cambiarVistaLimpia(true); });
  document.getElementById('boton-salir-vista-limpia').addEventListener('click', function () { cambiarVistaLimpia(false); });

  // Ventanas
  document.getElementById('boton-guardar').addEventListener('click', guardarMapaActual);
  document.getElementById('boton-exportar-png').addEventListener('click', exportarComoImagen);
  document.getElementById('boton-imprimir').addEventListener('click', imprimirMapa);
  document.getElementById('boton-descargar-archivo').addEventListener('click', descargarArchivoDelMapa);
  document.getElementById('boton-abrir-archivo').addEventListener('click', function () { campoAbrirArchivo.click(); });
  campoAbrirArchivo.addEventListener('change', abrirArchivoDelMapa);
  document.querySelectorAll('.boton-cerrar').forEach(function (boton) {
    boton.addEventListener('click', function () { boton.closest('dialog').close(); });
  });

  // Pestañas del móvil
  document.querySelectorAll('.pestana').forEach(function (pestana) {
    pestana.addEventListener('click', function () {
      document.body.dataset.pestana = pestana.dataset.pestana;
      ajustarZoomALaPantalla();
    });
  });
}

function iniciarAplicacion() {
  document.getElementById('aviso-falta-app').remove();
  imagenMapa.src = IMAGEN_MAPA_SILOE;
  llenarTiposDeTrazo();
  mostrarCategorias();
  mostrarGaleria();
  aplicarFondo();
  aplicarPlano();
  cambiarHerramienta('seleccionar');
  dibujarMapa();
  mostrarCapas();
  mostrarPropiedades();
  conectarEventos();
  ajustarZoomALaPantalla();
}


/* =============================================================
   IMAGEN DEL MAPA BASE (SIL.jpg convertida a texto base64)
   Para cambiar el mapa, reemplaza este texto por el de otra imagen
   y ajusta ANCHO_LIENZO y ALTO_LIENZO al tamaño de la nueva imagen.
   ============================================================= */
const IMAGEN_MAPA_SILOE = 'data:image/jpeg;base64,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';

iniciarAplicacion();
