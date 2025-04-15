let isHighlighted = false;
const button = document.getElementById('highlight');

chrome.storage.local.get(['isHighlighted'], (result) => {
  isHighlighted = result.isHighlighted || false;
  button.textContent = isHighlighted ? 'Remove Highlight' : 'Highlight Layouts';
});

button.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    isHighlighted = !isHighlighted;
    chrome.storage.local.set({ isHighlighted });
    button.textContent = isHighlighted ? 'Remove Highlight' : 'Highlight Layouts';
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: (highlight) => {
        const existingElements = document.querySelectorAll('.layout-debugger-lens, .layout-tooltip, .layout-label');
        existingElements.forEach(el => el.remove());

        if (!highlight) return;
        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display === 'flex' || style.display === 'grid';
        });
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
          overlay.className = 'layout-debugger-lens';

          Object.assign(overlay.style, {
            position: 'absolute',
            top: `${rect.top + window.scrollY}px`,
            left: `${rect.left + window.scrollX}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundColor: 'rgba(0, 200, 255, 0.1)',
            border: '2px dashed rgba(0, 200, 255, 0.7)',
            zIndex: 99999,
            cursor: 'pointer'
          });

          overlay.addEventListener('mouseover', (e) => {
            let properties = [];
            if (style.display === 'flex') {
              properties.push('/* Flex Container Styles */');
              properties.push(`display: ${style.display};`);
              
              const flexProps = {
                'flex-direction': style.flexDirection,
                'justify-content': style.justifyContent,
                'align-items': style.alignItems,
                'align-content': style.alignContent,
                'flex-wrap': style.flexWrap,
                'gap': style.gap,
                'row-gap': style.rowGap,
                'column-gap': style.columnGap,
                'padding': style.padding,
                'margin': style.margin,
                'width': style.width,
                'height': style.height,
                'min-width': style.minWidth,
                'min-height': style.minHeight,
                'max-width': style.maxWidth,
                'max-height': style.maxHeight
              };

              for (const [prop, value] of Object.entries(flexProps)) {
                if (value && value !== 'normal' && value !== 'none' && value !== '0px' && value !== 'auto') {
                  properties.push(`${prop}: ${value};`);
                }
              }
            } else if (style.display === 'grid') {
              properties.push('/* Grid Container Styles */');
              properties.push(`display: ${style.display};`);
              
              const gridProps = {
                'grid-template-columns': style.gridTemplateColumns,
                'grid-template-rows': style.gridTemplateRows,
                'grid-template-areas': style.gridTemplateAreas,
                'grid-auto-columns': style.gridAutoColumns,
                'grid-auto-rows': style.gridAutoRows,
                'grid-auto-flow': style.gridAutoFlow,
                'gap': style.gap,
                'row-gap': style.rowGap,
                'column-gap': style.columnGap,
                'justify-items': style.justifyItems,
                'align-items': style.alignItems,
                'justify-content': style.justifyContent,
                'align-content': style.alignContent,
                'padding': style.padding,
                'margin': style.margin,
                'width': style.width,
                'height': style.height
              };

              for (const [prop, value] of Object.entries(gridProps)) {
                if (value && value !== 'normal' && value !== 'none' && value !== '0px' && value !== 'auto') {
                  properties.push(`${prop}: ${value};`);
                }
              }
            }

            if (properties.length > 1) {
              const tooltip = document.createElement('div');
              tooltip.className = 'layout-tooltip';
              tooltip.style.cssText = `
                position: fixed;
                left: ${e.clientX + 15}px;
                top: ${e.clientY + 15}px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 15px;
                border-radius: 6px;
                font-size: 13px;
                font-family: 'Monaco', monospace;
                white-space: pre;
                z-index: 100001;
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                line-height: 1.5;
              `;
              tooltip.textContent = properties.join('\n');
              document.body.appendChild(tooltip);
            }
          });

          overlay.addEventListener('mouseout', () => {
            const tooltip = document.querySelector('.layout-tooltip');
            if (tooltip) tooltip.remove();
          });

          const updateTooltipPosition = debounce((e) => {
            const tooltip = document.querySelector('.layout-tooltip');
            if (tooltip) {
              tooltip.style.left = `${e.clientX + 15}px`;
              tooltip.style.top = `${e.clientY + 15}px`;
            }
          }, 16);

          overlay.addEventListener('mousemove', updateTooltipPosition);
          document.body.appendChild(overlay);
        });
      },
      args: [isHighlighted]
    });
  });
});
  