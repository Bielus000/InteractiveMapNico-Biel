// Map interaction: smooth zoom for map image
(function(){
  const canvas = document.getElementById('mapCanvas');
  const img = document.getElementById('mapImage');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');

  if (!canvas || !img) return;

  // State (scale initialized to fit the image inside the canvas)
  let targetScale = 1;
  let scale = 1;
  let minScale = 1; // will be updated after image loads to fit scale
  let maxScale = 3; // will be updated relative to fit scale
  const zoomFactor = 1.18; // multiplicative step
  const ease = 0.08; // smoothing factor

  // Panning state
  let targetOffsetX = 0, targetOffsetY = 0;
  let offsetX = 0, offsetY = 0;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let dragStartOffsetX = 0, dragStartOffsetY = 0;

  // Initialize fit-to-screen scale once image loads
  function initFit(){
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if(!iw || !ih) return;

    // Compute scales: allow cover (fill) as initial scale
    const fit = Math.min(cw / iw, ch / ih, 1);     // contain
    const cover = Math.max(cw / iw, ch / ih);      // cover (fill)

    // Use cover as initial scale so the image fills the viewport; allow zooming out to fit
    minScale = fit;
    maxScale = Math.max(cover * 3, cover + 0.5);

    targetScale = scale = cover;
    img.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(5)})`;

    // Debug: report calculated scales and expose current scale on the container for verification
    console.info('[map] initFit', { fit, cover, minScale, maxScale });
    try{ canvas.dataset.currentScale = scale.toFixed(5); }catch(e){}
  }

  // Run on load and on resize
  img.addEventListener('load', initFit);
  if(img.complete) initFit();
  window.addEventListener('resize', initFit);

  // Helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Events
  zoomInBtn?.addEventListener('click', () => {
    targetScale = clamp(targetScale * zoomFactor, minScale, maxScale);
  });

  zoomOutBtn?.addEventListener('click', () => {
    targetScale = clamp(targetScale / zoomFactor, minScale, maxScale);
  });

  // mousewheel zoom (ctrl+wheel or wheel alone) - smooth
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY || e.wheelDelta;
    if (delta > 0) {
      targetScale = clamp(targetScale / 1.07, minScale, maxScale);
    } else {
      targetScale = clamp(targetScale * 1.07, minScale, maxScale);
    }
  }, { passive: false });

  // Pointer-based panning (click+drag / touch)
  function getClampOffsets(s){
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const displayW = iw * s;
    const displayH = ih * s;
    const maxX = Math.max(0, (displayW - canvas.clientWidth) / 2);
    const maxY = Math.max(0, (displayH - canvas.clientHeight) / 2);
    return { maxX, maxY };
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try{ canvas.setPointerCapture(e.pointerId); }catch(e){}
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartOffsetX = targetOffsetX;
    dragStartOffsetY = targetOffsetY;
    canvas.classList.add('dragging');
  });

  canvas.addEventListener('pointermove', (e) => {
    if(!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const { maxX, maxY } = getClampOffsets(targetScale);
    targetOffsetX = clamp(dragStartOffsetX + dx, -maxX, maxX);
    targetOffsetY = clamp(dragStartOffsetY + dy, -maxY, maxY);
  });

  canvas.addEventListener('pointerup', (e) => {
    isDragging = false;
    try{ canvas.releasePointerCapture(e.pointerId); }catch(e){}
    canvas.classList.remove('dragging');
  });
  canvas.addEventListener('pointercancel', () => { isDragging = false; canvas.classList.remove('dragging'); });

  // Animation loop: interpolate and apply transform
  function render(){
    // smooth scale
    scale += (targetScale - scale) * (ease + 0.02);

    // ensure offsets are within bounds for current scale
    const { maxX, maxY } = getClampOffsets(scale);
    targetOffsetX = clamp(targetOffsetX, -maxX, maxX);
    targetOffsetY = clamp(targetOffsetY, -maxY, maxY);

    // smooth offsets
    offsetX += (targetOffsetX - offsetX) * (ease + 0.02);
    offsetY += (targetOffsetY - offsetY) * (ease + 0.02);

    // apply transform: keep centered translate(-50%,-50%), then translate by offsets and scale
    img.style.transform = `translate(-50%, -50%) translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`;

    // Update markers scale to keep them readable during zoom
    const markers = document.querySelectorAll('.map-marker');
    markers.forEach(marker => {
      // Inverse scale: as map zooms in, markers shrink proportionally to stay visible
      const markerScale = Math.max(0.4, Math.min(1.2, 0.8 / scale));
      marker.style.transform = `scale(${markerScale})`;
    });
    try{ canvas.dataset.currentScale = scale.toFixed(5); }catch(e){}

    requestAnimationFrame(render);
  }

  // Kick off
  requestAnimationFrame(render);

  // -----------------------------
  // Legend toggle (left panel button controls floating legend)
  // Floating legend is OPEN by default; clicking the left-panel button toggles it closed/open
  // -----------------------------
  (function(){
    const btnLegend = document.getElementById('btnLegend');
    const floating = document.getElementById('floatingLegend');
    if(!btnLegend || !floating) { console.warn('[map] legend elements missing'); return; } // nothing to do

    console.info('[map] legend init: btnLegend, floatingLegend found');

    // Initialize ARIA and state: open by default
    floating.classList.remove('legend-closed');
    floating.setAttribute('aria-hidden', 'false');
    btnLegend.setAttribute('aria-pressed', 'false');
    btnLegend.setAttribute('aria-expanded', 'true');

    // Toggle handler
    function toggleLegend(){
      const closed = floating.classList.toggle('legend-closed');
      console.info('[map] toggleLegend -> closed=', closed);
      floating.setAttribute('aria-hidden', closed ? 'true' : 'false');
      btnLegend.setAttribute('aria-expanded', closed ? 'false' : 'true');
      btnLegend.setAttribute('aria-pressed', closed ? 'true' : 'false');

      // If we just closed and focus was inside the legend, move it back to the button
      if(closed){
        if(floating.contains(document.activeElement)){
          btnLegend.focus();
        }
      }
    }

    // Click and keyboard activation (Enter / Space / Spacebar)
    btnLegend.addEventListener('click', (e)=>{ toggleLegend(); });
    btnLegend.addEventListener('keydown', (e)=>{
      if(e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter'){
        e.preventDefault();
        toggleLegend();
      }
    });

    // Optional: close on ESC
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' || e.key === 'Esc'){
        if(!floating.classList.contains('legend-closed')){
          toggleLegend();
        }
      }
    });

    // Optional: close when clicking outside (on the map)
    document.addEventListener('click', (e)=>{
      // if click target is inside floating or is the button, ignore
      if(floating.contains(e.target) || btnLegend.contains(e.target)) return;
      if(!floating.classList.contains('legend-closed')){
        // close it
        toggleLegend();
      }
    });

  })();
})();