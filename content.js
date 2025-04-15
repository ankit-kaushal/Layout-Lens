// First, remove any existing overlays and cleanup
(() => {
  // Clean up existing overlays
  document.querySelectorAll('.layout-debugger-overlay').forEach(el => el.remove());

  const elements = Array.from(document.querySelectorAll('*')).filter(el => {
    const style = window.getComputedStyle(el);
    return style.display === 'flex' || style.display === 'grid';
  });

  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'layout-debugger-overlay';

    Object.assign(overlay.style, {
      position: 'absolute',
      top: `${rect.top + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      backgroundColor: 'rgba(0, 200, 255, 0.1)',
      border: '2px dashed rgba(0, 200, 255, 0.7)',
      zIndex: 99999,
      pointerEvents: 'none'
    });

    const label = document.createElement('div');
    label.textContent = `display: ${style.display}`;
    Object.assign(label.style, {
      position: 'absolute',
      top: `${rect.top + window.scrollY - 18}px`,
      left: `${rect.left + window.scrollX}px`,
      backgroundColor: 'black',
      color: 'white',
      fontSize: '12px',
      padding: '2px 4px',
      borderRadius: '4px',
      zIndex: 100000,
      pointerEvents: 'none'
    });

    document.body.appendChild(overlay);
    document.body.appendChild(label);
  });
})();
