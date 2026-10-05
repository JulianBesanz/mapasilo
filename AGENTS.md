# AGENTS.md – Mapa Interactivo de Siloé

## 1. Propósito y Enfoque del Proyecto
Crear una aplicación web interactiva, visual y sencilla del sector de Siloé. Debe permitir arrastrar y colocar todo tipo de elementos urbanos y geográficos (árboles, pasto, tiendas, red eléctrica, tuberías, zonas de agua, flechas de dirección y títulos) sobre un lienzo para ajustar sus posiciones y generar infografías.

> **Objetivo Didáctico Prioritario:** El código debe ser limpio, claro y estructurado de tal manera que alguien que está empezando a programar pueda entenderlo y modificarlo fácilmente.

---

## 2. Restricciones Técnicas y Stack

* **Stack Principal:** HTML5, CSS3 y JavaScript puro (Vanilla JS).
* **Compatibilidad Directa:** Debe funcionar abriendo `index.html` mediante doble clic en el navegador (`file://`).
* **Prohibiciones Explícitas:**
  * NO usar `type="module"` en scripts de JS.
  * NO hacer peticiones `fetch` o AJAX a archivos locales (para evitar bloqueos por políticas de CORS en `file://`).
  * NO utilizar empaquetadores (Vite, Webpack) ni frameworks pesados (React, Vue, Angular).
* **Estructura de Archivos Estricta:**
  * `index.html` — Estructura del DOM y maquetación general.
  * `styles.css` — Estilos visuales, layout y diseño adaptable.
  * `app.js` — Datos del catálogo, eventos de arrastrar y soltar (Drag & Drop) y lógica del mapa.

---

## 3. Convenciones de Código y Estilo

* **Idioma:** Interfaz de usuario en **español**. Identificadores en el código (variables, funciones, clases de CSS e IDs de HTML) en **español**.
* **Legibilidad:** Nombres de variables y funciones altamente descriptivos (ej. `agregarElementoAlMapa`, `obtenerCoordenadasDrop`).
* **Comentarios:** Solo donde aporten valor pedagógico o expliquen algoritmos específicos.
* **Diseño UI:** Limpio, moderno e intuitivo.
* **Responsividad:** Adaptable a pantallas móviles mediante reglas de CSS (`@media (max-width: 480px)` o donde se garantice nitidez).

---

## 4. Componentes y Funcionalidades Requeridas

### A. Panel Lateral / Buscador de Elementos (Sidebar)
* Buscador en tiempo real por texto para filtrar elementos.
* Organización clara por categorías:
  * **Naturaleza:** Árboles, pasto, zonas de agua/fuentes.
  * **Infraestructura:** Red eléctrica, tuberías/aguas residuales, vías.
  * **Comercio y Comunidad:** Tiendas, viviendas, puntos de referencia.
  * **Anotación:** Flechas de dirección, etiquetas de texto, títulos.
* Galería de elementos arrastrables (*draggable items*).

### B. Lienzo del Mapa (Canvas / Dropzone)
* Área principal interactiva donde se sueltan (*drop*) los elementos desde el panel.
* Ajuste de posición ($X, Y$), tamaño o rotación de los elementos colocados.
* Selección de elementos para reorganizarlos o borrarlos fácilmente.

### C. Generación de Infografía / Exportación
* Vista limpia que permite ocultar los paneles de control.
* Botón de exportación o preparación para impresión (vía estilos `@media print` o `window.print()`) para generar la infografía final.

---

## 5. Esquema de Datos Básicos (Modelos en `app.js`)

Los datos deben residir directamente en estructuras simples dentro de `app.js`:

```javascript
// Catálogo estático de elementos disponibles
const CATALOGO_ELEMENTOS = [
  { id: 'arbol', nombre: 'Árbol', categoria: 'naturaleza', icono: '🌳' },
  { id: 'pasto', nombre: 'Pasto', categoria: 'naturaleza', icono: '🌱' },
  { id: 'tienda', nombre: 'Tienda', categoria: 'comercio', icono: '🏪' },
  { id: 'poste', nombre: 'Poste Eléctrico', categoria: 'infraestructura', icono: '⚡' },
  { id: 'tuberia', nombre: 'Tubería Agua', categoria: 'infraestructura', icono: '🚰' },
  { id: 'flecha', nombre: 'Flecha Dirección', categoria: 'anotacion', icono: '➡️' },
  { id: 'titulo', nombre: 'Título / Etiqueta', categoria: 'anotacion', icono: '🏷️' }
];

// Estado de la aplicación: elementos colocados en el lienzo
let elementosEnMapa = [];
```
