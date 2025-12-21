// Map markers interaction - show info panel on click
(function(){
  // Wait for DOM to be fully loaded
  function initMarkers(){
    const infoPanel = document.getElementById('infoPanel');
    const infoPanelContent = document.getElementById('infoPanelContent');
    const infoPanelClose = document.getElementById('infoPanelClose');
    const markers = document.querySelectorAll('.map-marker');
    const mapCanvas = document.getElementById('mapCanvas');
    const mapImage = document.getElementById('mapImage');

    if(!infoPanel || !infoPanelContent || !infoPanelClose){
      console.warn('[markers] panel elements missing');
      return;
    }
    if(!markers.length){
      console.warn('[markers] no markers found');
      return;
    }

    // Content templates for each marker type
    const markerData = {
      capital: {
        title: 'Capital',
        description: 'Centro político y administrativo del reino. Aquí reside la corte real y se toman las decisiones más importantes.'
      },
      ciudad: {
        title: 'Fortaleza',
        description: 'Estructura defensiva fortificada que protege las fronteras y rutas comerciales. Guarnición militar permanente.'
      },
      pueblo: {
        title: 'Pueblo',
        description: 'Asentamiento rural dedicado principalmente a la agricultura y el comercio local. Población estable.'
      },
      interes: {
        title: 'Punto de Interés',
        description: 'Ubicación de importancia histórica, cultural o estratégica. Puede contener ruinas, monumentos o recursos especiales.'
      },
      batalla: {
        title: 'Frente de Batalla',
        description: 'Zona de conflicto activo. Las fuerzas militares están desplegadas y se libran combates frecuentes.'
      },
      info: {
        title: 'Centro de Información',
        description: 'Punto de encuentro donde se recopila y distribuye información sobre el territorio y acontecimientos recientes.'
      }
    };

    function showInfoPanel(markerType, markerName){
      const data = markerData[markerType] || markerData.info;
      
      infoPanelContent.innerHTML = `
        <h2>${markerName || data.title}</h2>
        <p><strong>Tipo:</strong> ${data.title}</p>
        <p>${data.description}</p>
        <p style="margin-top: 20px; font-size: 13px; opacity: 0.8;">Haz clic en la X o presiona ESC para cerrar este panel.</p>
      `;
      
      infoPanel.classList.add('visible');
      infoPanel.setAttribute('aria-hidden', 'false');
      console.info('[markers] panel opened for:', markerType, markerName);
    }

    function hideInfoPanel(){
      infoPanel.classList.remove('visible');
      infoPanel.setAttribute('aria-hidden', 'true');
      console.info('[markers] panel closed');
    }

    // Attach click handlers to markers
    markers.forEach(marker => {
      marker.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent map click from closing
        const type = marker.dataset.type || 'info';
        const name = marker.dataset.name || '';
        showInfoPanel(type, name);
        console.info('[markers] marker clicked:', type, name);
      });
    });

    // Close button
    infoPanelClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideInfoPanel();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if((e.key === 'Escape' || e.key === 'Esc') && infoPanel.classList.contains('visible')){
        hideInfoPanel();
      }
    });

    // Close when clicking outside panel (on canvas area)
    mapCanvas.addEventListener('click', (e) => {
      // Don't close if click was on a marker
      if(e.target.closest('.map-marker')) return;
      if(infoPanel.classList.contains('visible')){
        hideInfoPanel();
      }
    });

    console.info('[markers] initialized', markers.length, 'markers');
  }

  // Wait for DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initMarkers);
  } else {
    initMarkers();
  }
})();
