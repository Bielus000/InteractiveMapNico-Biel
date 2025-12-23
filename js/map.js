(() => {
  const svg = document.getElementById('mapSvg');
  const mapContainer = document.querySelector('.map-container');
  const layer1 = document.getElementById('layer1');
  const layer2 = document.getElementById('layer2');
  const markersGroup = document.getElementById('markersGroup');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomResetBtn = document.getElementById('zoomReset');
  const tooltip = document.getElementById('markerTooltip');

  if (!svg || !layer1 || !layer2 || !markersGroup) return;

  // Estado del mapa
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  const ZOOM_STEP = 0.3;
  const LAYER2_THRESHOLD = 1.8; // A partir de qué zoom se muestra la capa 2
  const MARKERS_THRESHOLD = 2.2; // A partir de qué zoom se muestran los marcadores

  // Aplicar transformación
  function updateTransform(smooth = false) {
    // Toggle smooth transition class
    if (smooth) {
      svg.classList.add('smooth-zoom');
    } else {
      svg.classList.remove('smooth-zoom');
    }
    
    svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    
    // Cambiar opacidad de capas según zoom
    const layer2Opacity = Math.max(0, Math.min(1, (scale - LAYER2_THRESHOLD) / 0.5));
    layer2.style.opacity = layer2Opacity;
    
    // Mostrar/ocultar marcadores según zoom
    const markersOpacity = Math.max(0, Math.min(1, (scale - MARKERS_THRESHOLD) / 0.3));
    markersGroup.style.opacity = markersOpacity;
  }

  // Zoom
  function setZoom(newScale, centerX = null, centerY = null, smooth = true) {
    const oldScale = scale;
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

    if (centerX !== null && centerY !== null) {
      // Zoom hacia un punto específico
      const rect = svg.getBoundingClientRect();
      const offsetX = centerX - rect.left - rect.width / 2;
      const offsetY = centerY - rect.top - rect.height / 2;
      
      translateX -= offsetX * (scale / oldScale - 1);
      translateY -= offsetY * (scale / oldScale - 1);
    }

    // Limitar el desplazamiento
    constrainTranslation();
    updateTransform(smooth);
  }

  // Limitar el desplazamiento para no salir del mapa
  function constrainTranslation() {
    const rect = svg.getBoundingClientRect();
    const maxX = (rect.width * (scale - 1)) / 2;
    const maxY = (rect.height * (scale - 1)) / 2;

    translateX = Math.max(-maxX, Math.min(maxX, translateX));
    translateY = Math.max(-maxY, Math.min(maxY, translateY));
  }

  // Botones de zoom
  zoomInBtn?.addEventListener('click', () => setZoom(scale + ZOOM_STEP));
  zoomOutBtn?.addEventListener('click', () => setZoom(scale - ZOOM_STEP));
  zoomResetBtn?.addEventListener('click', () => {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateTransform();
  });

  // Zoom con rueda del ratón
  mapContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * ZOOM_STEP;
    setZoom(scale + delta, e.clientX, e.clientY);
  }, { passive: false });

  // Arrastre del mapa
  mapContainer.addEventListener('mousedown', (e) => {
    if (scale <= 1) return; // No arrastrar si no hay zoom
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    mapContainer.classList.add('dragging');
    svg.classList.add('no-transition'); // Desactivar transición durante arrastre
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    constrainTranslation();
    updateTransform(false); // Sin transición durante arrastre
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    mapContainer.classList.remove('dragging');
    svg.classList.remove('no-transition');
  });

  // Touch support para móvil
  let touchStartDistance = 0;
  let touchStartScale = 1;

  mapContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      // Arrastre con un dedo
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
    } else if (e.touches.length === 2) {
      // Zoom con dos dedos
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistance = Math.sqrt(dx * dx + dy * dy);
      touchStartScale = scale;
    }
  });

  mapContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      constrainTranslation();
      updateTransform();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const newScale = touchStartScale * (distance / touchStartDistance);
      
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setZoom(newScale, centerX, centerY);
    }
  }, { passive: false });

  mapContainer.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Tooltips de marcadores
  const markers = document.querySelectorAll('.marker');
  markers.forEach(marker => {
    marker.addEventListener('mouseenter', (e) => {
      const name = marker.getAttribute('data-name');
      if (name && tooltip) {
        tooltip.textContent = name;
        tooltip.hidden = false;
      }
    });

    marker.addEventListener('mousemove', (e) => {
      if (tooltip && !tooltip.hidden) {
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY}px`;
      }
    });

    marker.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.hidden = true;
    });

    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = marker.getAttribute('data-name');
      const x = marker.getAttribute('data-x');
      const y = marker.getAttribute('data-y');
      console.log(`Marcador clickeado: ${name} en (${x}, ${y})`);
      // Aquí puedes añadir lógica para mostrar más información
    });
  });

  // Inicializar
  updateTransform();
})();
