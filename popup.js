let isHighlighted = false;
const button = document.getElementById('highlight');

button.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    isHighlighted = !isHighlighted;
    button.textContent = isHighlighted ? 'Remove Highlight' : 'Highlight Layouts';
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: (highlight) => {
        // Remove existing overlays and labels
        const existingElements = document.querySelectorAll('.layout-debugger-overlay, .layout-tooltip, .layout-label');
        existingElements.forEach(el => el.remove());

        if (!highlight) return; // Exit if we're removing highlights

        // Define elements here
        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display === 'flex' || style.display === 'grid';
        });

        // Debounce function for smooth tooltip handling
        const debounce = (fn, delay) => {
          let timeoutId;
          return (...args) => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
          };
        };

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
            cursor: 'pointer'  // Changed from pointer-events: none
          });

          // Add hover event listeners
          overlay.addEventListener('mouseover', (e) => {
            let properties = [];
            if (style.display === 'flex') {
              const flexProps = {
                'Direction': style.flexDirection,
                'Justify Content': style.justifyContent,
                'Align Items': style.alignItems,
                'Flex Wrap': style.flexWrap,
                'Gap': style.gap !== 'normal' ? style.gap : null,
                'Row Gap': style.rowGap !== 'normal' ? style.rowGap : null,
                'Column Gap': style.columnGap !== 'normal' ? style.columnGap : null
              };

              properties.push('Flex Properties:');
              for (const [key, value] of Object.entries(flexProps)) {
                if (value && value !== 'normal' && value !== 'none') {
                  properties.push(`• ${key}: ${value}`);
                }
              }
            } else if (style.display === 'grid') {
              const gridProps = {
                'Template Columns': style.gridTemplateColumns,
                'Template Rows': style.gridTemplateRows,
                'Gap': style.gap !== 'normal' ? style.gap : null,
                'Justify Items': style.justifyItems,
                'Align Items': style.alignItems
              };

              properties.push('Grid Properties:');
              for (const [key, value] of Object.entries(gridProps)) {
                if (value && value !== 'normal' && value !== 'none') {
                  properties.push(`• ${key}: ${value}`);
                }
              }
            }

            if (properties.length > 1) { // Only show if there are actual properties
              const tooltip = document.createElement('div');
              tooltip.className = 'layout-tooltip';
              tooltip.style.cssText = `
                position: fixed;
                left: ${e.clientX + 15}px;
                top: ${e.clientY + 15}px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 10px;
                border-radius: 4px;
                font-size: 12px;
                font-family: monospace;
                white-space: pre;
                z-index: 100001;
                pointer-events: none;
              `;
              tooltip.textContent = properties.join('\n');
              document.body.appendChild(tooltip);
            }
          });

          overlay.addEventListener('mouseout', () => {
            const tooltip = document.querySelector('.layout-tooltip');
            if (tooltip) tooltip.remove();
          });

          // Add debounced mousemove handler for smooth tooltip positioning
          const updateTooltipPosition = debounce((e) => {
            const tooltip = document.querySelector('.layout-tooltip');
            if (tooltip) {
              tooltip.style.left = `${e.clientX + 15}px`;
              tooltip.style.top = `${e.clientY + 15}px`;
            }
          }, 16); // ~60fps

          overlay.addEventListener('mousemove', updateTooltipPosition);

          const label = document.createElement('div');
          label.textContent = `display: ${style.display}`;
          label.className = 'layout-label'; // Add class for easy removal
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
      },
      args: [isHighlighted]
    });
  });
});
  