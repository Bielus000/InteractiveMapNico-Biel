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
  const legend = document.getElementById('legend');
  const legendToggle = document.getElementById('legendToggle');
  const legendClose = document.getElementById('legendClose');
  const sidePanel = document.getElementById('sidePanel');
  const sideOverlay = document.getElementById('sideOverlay');
  const panelClose = document.getElementById('panelClose');
  const panelTitle = document.getElementById('panelTitle');
  const panelBody = document.getElementById('panelBody');

  if (!svg || !layer1 || !layer2 || !markersGroup) return;

  // Estado del mapa
  let scale = 1.2; // initial zoom level
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  const MIN_SCALE = 1.2;
  const MAX_SCALE = 4;
  const ZOOM_STEP = 0.3;
  const LAYER2_THRESHOLD = 1.7; // A partir de qué zoom se muestra la capa 2
  const MARKERS_THRESHOLD = 1.7; // A partir de qué zoom se muestran los marcadores
  const LEGEND_HIDE_THRESHOLD = 1.3; // Zoom a partir del cual amagar llegenda

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

    // Llegenda: amagar quan fem zoom i mostrar toggle
    if (legend) {
      if (scale > LEGEND_HIDE_THRESHOLD) {
        legend.hidden = true;
        if (legendToggle) legendToggle.hidden = false;
      } else {
        legend.hidden = false;
        if (legendToggle) legendToggle.hidden = true;
      }
    }
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
    // Use the container's base size (without transforms) to compute overflow
    const baseRect = mapContainer.getBoundingClientRect();
    const baseW = baseRect.width;
    const baseH = baseRect.height;

    const overflowX = Math.max(0, (baseW * scale - baseW) / 2);
    const overflowY = Math.max(0, (baseH * scale - baseH) / 2);

    // Clamp so the image never moves beyond its edges
    translateX = Math.max(-overflowX, Math.min(overflowX, translateX));
    translateY = Math.max(-overflowY, Math.min(overflowY, translateY));
  }

  // Botones de zoom
  zoomInBtn?.addEventListener('click', () => setZoom(scale + ZOOM_STEP));
  zoomOutBtn?.addEventListener('click', () => setZoom(scale - ZOOM_STEP));
  zoomResetBtn?.addEventListener('click', () => {
    scale = 1.2;
    translateX = 0;
    translateY = 0;
    updateTransform(true);
  });

  // Zoom con rueda del ratón
  mapContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * ZOOM_STEP;
    setZoom(scale + delta, e.clientX, e.clientY, true);
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

  // Llegenda toggle behavior
  legendToggle?.addEventListener('click', () => {
    if (legend) {
      legend.hidden = false;
      legendToggle.hidden = true;
    }
  });
  legendClose?.addEventListener('click', () => {
    if (legend) {
      legend.hidden = true;
      if (legendToggle) legendToggle.hidden = false;
    }
  });

  // Helpers per panell lateral
  function openPanel({ title, icon, contentHtml }) {
    if (!sidePanel || !sideOverlay) return;
    if (panelTitle) panelTitle.textContent = title || 'Detall';
    if (panelBody) panelBody.innerHTML = contentHtml || '';
    sidePanel.classList.add('open');
    sidePanel.setAttribute('aria-hidden', 'false');
    sideOverlay.hidden = false;
  }

  function closePanel() {
    if (!sidePanel || !sideOverlay) return;
    sidePanel.classList.remove('open');
    sidePanel.setAttribute('aria-hidden', 'true');
    sideOverlay.hidden = true;
  }

  panelClose?.addEventListener('click', closePanel);
  sideOverlay?.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
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
  const DEFAULT_MARKER_SIZE = 70; // més gran

  markers.forEach(marker => {
    // Normalitzar posició i mida de la imatge del marcador segons data-x/y
    const x = Number(marker.getAttribute('data-x')) || 0;
    const y = Number(marker.getAttribute('data-y')) || 0;
    const icon = marker.getAttribute('data-icon') || 'info';
    const img = marker.querySelector('image');
    const size = DEFAULT_MARKER_SIZE;
    if (img) {
      img.setAttribute('width', String(size));
      img.setAttribute('height', String(size));
      img.setAttribute('x', String(x - size / 2));
      img.setAttribute('y', String(y - size / 2));
      if (!img.getAttribute('href')) {
        img.setAttribute('href', `img/icon-${icon}.png`);
      }
    }

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
      const name = marker.getAttribute('data-name') || 'Detall';
      const icon = marker.getAttribute('data-icon') || 'info';
      const contentHtml = `
        <div class="marker-title">
          <img src="img/icon-${icon}.png" alt="${icon}">
          <strong>${name}</strong>
        </div>
        <p style="margin-top:12px; line-height:1.5">Descripció del punt seleccionat. Pots personalitzar aquest contingut amb text, imatges o enllaços.</p>
      `;
      openPanel({ title: name, icon, contentHtml });
    });
  });

  // Inicializar
  updateTransform(true);
})();
