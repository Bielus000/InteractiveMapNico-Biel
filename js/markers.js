// GUÍA PARA COLOCAR MARCADORES EN EL MAPA
// =========================================

// El mapa usa un sistema de coordenadas SVG con viewBox="0 0 1920 1080"
// - Ancho total: 1920 (0 = izquierda, 1920 = derecha)
// - Alto total: 1080 (0 = arriba, 1080 = abajo)
// - Centro del mapa: (960, 540)

// ICONOS DISPONIBLES:
// -------------------
// - icon-batalla.png: Para lugares de batallas históricas
// - icon-capital.png: Para la capital o ciudades principales
// - icon-ciudad.png: Para ciudades normales
// - icon-info.png: Para puntos de información general
// - icon-interes.png: Para lugares de interés turístico/cultural
// - icon-leyenda.png: Para lugares mitológicos o legendarios
// - icon-pueblo.png: Para pueblos pequeños

// CÓMO AÑADIR UN NUEVO MARCADOR:
// ------------------------------
// 1. Abre map.html
// 2. Busca la sección <g id="markersGroup">
// 3. Copia este template y pégalo dentro de markersGroup:

/*
IMPORTANTE: El atributo x e y de la imagen deben ser:
- x = coordenada_x - 16 (para centrar el icono de 32px)
- y = coordenada_y - 16 (para centrar el icono de 32px)

TEMPLATE:
<g class="marker" data-x="TU_X" data-y="TU_Y" data-name="NOMBRE" data-icon="TIPO_ICONO">
  <image href="img/icon-TIPO_ICONO.png" x="TU_X_MENOS_16" y="TU_Y_MENOS_16" width="32" height="32" preserveAspectRatio="xMidYMid meet"/>
</g>

EJEMPLO con coordenadas (960, 540):
<g class="marker" data-x="960" data-y="540" data-name="Mi Ciudad" data-icon="ciudad">
  <image href="img/icon-ciudad.png" x="944" y="524" width="32" height="32" preserveAspectRatio="xMidYMid meet"/>
</g>
*/

// 4. Reemplaza:
//    - TU_X: coordenada horizontal (0-1920)
//    - TU_Y: coordenada vertical (0-1080)
//    - TU_X_MENOS_16: TU_X - 16
//    - TU_Y_MENOS_16: TU_Y - 16
//    - TIPO_ICONO: batalla | capital | ciudad | info | interes | leyenda | pueblo
//    - NOMBRE: nombre que aparece en el tooltip

// EJEMPLOS DE COORDENADAS:
// -------------------------
const coordenadasReferencia = {
  // Esquinas
  'Superior Izquierda': { x: 0, y: 0 },
  'Superior Derecha': { x: 1920, y: 0 },
  'Inferior Izquierda': { x: 0, y: 1080 },
  'Inferior Derecha': { x: 1920, y: 1080 },
  
  // Bordes centrales
  'Centro Superior': { x: 960, y: 0 },
  'Centro Inferior': { x: 960, y: 1080 },
  'Centro Izquierdo': { x: 0, y: 540 },
  'Centro Derecho': { x: 1920, y: 540 },
  
  // Centro absoluto
  'Centro': { x: 960, y: 540 },
  
  // Cuadrantes (ejemplos)
  'Cuadrante NW': { x: 480, y: 270 },
  'Cuadrante NE': { x: 1440, y: 270 },
  'Cuadrante SW': { x: 480, y: 810 },
  'Cuadrante SE': { x: 1440, y: 810 }
};

// CÓMO ENCONTRAR LAS COORDENADAS EXACTAS:
// ----------------------------------------
// Método 1: Usa las herramientas de desarrollador del navegador
// 1. Abre map.html en el navegador
// 2. Presiona F12 para abrir DevTools
// 3. Ve a la consola y ejecuta este código:

function enableCoordinatePicker() {
  const svg = document.getElementById('mapSvg');
  svg.addEventListener('click', (e) => {
    const rect = svg.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (1920 / rect.width));
    const y = Math.round((e.clientY - rect.top) * (1080 / rect.height));
    const imageX = x - 16; // Centrar el icono de 32px
    const imageY = y - 16; // Centrar el icono de 32px
    console.log(`\n📍 Coordenadas: (${x}, ${y})`);
    console.log(`\n📋 TEMPLATE COMPLETO - Elige un icono:\n`);
    
    const iconos = ['batalla', 'capital', 'ciudad', 'info', 'interes', 'leyenda', 'pueblo'];
    iconos.forEach(icono => {
      console.log(`<!-- ${icono.toUpperCase()} -->`);
      console.log(`<g class="marker" data-x="${x}" data-y="${y}" data-name="Nombre Ubicación" data-icon="${icono}">`);
      console.log(`  <image href="img/icon-${icono}.png" x="${imageX}" y="${imageY}" width="32" height="32" preserveAspectRatio="xMidYMid meet"/>`);
      console.log(`</g>\n`);
    });
  });
  console.log('✅ Coordinate picker activado. Haz clic en el mapa para obtener coordenadas y templates.');
}

// 4. Ejecuta: enableCoordinatePicker()
// 5. Haz clic en cualquier parte del mapa
// 6. La consola te mostrará las coordenadas y templates completos para todos los iconos

// CAMBIAR TAMAÑO DE ICONOS:
// --------------------------
// Si quieres iconos más grandes o pequeños:
// 1. Cambia width y height (mantén ambos iguales para evitar distorsión)
// 2. Ajusta x e y restando la mitad del nuevo tamaño
// Ejemplo para iconos de 48px:
//   width="48" height="48" x="TU_X_MENOS_24" y="TU_Y_MENOS_24"

// AÑADIR INTERACCIÓN AL HACER CLIC:
// ----------------------------------
// Los marcadores ya tienen eventos de clic configurados en map.js
// Para añadir funcionalidad personalizada, modifica la sección en map.js:
//
// marker.addEventListener('click', (e) => {
//   e.stopPropagation();
//   const name = marker.getAttribute('data-name');
//   const icon = marker.getAttribute('data-icon');
//   // Aquí añade tu código personalizado
// });


