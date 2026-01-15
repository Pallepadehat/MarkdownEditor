/**
 * Command palette CSS styles.
 */

export const paletteStyles = `
  .command-palette {
    position: absolute;
    width: 320px;
    max-height: 400px;
    overflow-y: auto;
    background: rgba(35, 35, 40, 0.72);
    backdrop-filter: blur(50px) saturate(190%);
    -webkit-backdrop-filter: blur(50px) saturate(190%);
    border: 0.5px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25), 0 0 0 0.5px rgba(255,255,255,0.1);
    padding: 6px;
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
    -webkit-font-smoothing: antialiased;
    animation: palette-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    display: none;
    flex-direction: column;
    gap: 2px;
  }
  
  .command-palette::-webkit-scrollbar { display: none; }
  .command-palette { -ms-overflow-style: none; scrollbar-width: none; }
  
  @keyframes palette-fade {
    from { opacity: 0; transform: translateY(4px) scale(0.98); }
    to { opacity: 1; transform: translateY(6px) scale(1); }
  }

  .palette-section {
    padding: 8px 12px 4px 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: rgba(235, 235, 245, 0.5);
    margin-top: 6px;
    margin-bottom: 2px;
    border-top: 1px solid rgba(84, 84, 88, 0.4);
  }
  
  .palette-section:first-child {
    margin-top: 0;
    border-top: none;
  }

  .palette-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
    min-height: 36px;
    border-radius: 8px;
    cursor: default;
    transition: background-color 0.1s;
    color: white;
  }

  .palette-item.selected {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .palette-label {
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .palette-detail {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
    font-weight: 400;
  }
  
  .palette-no-results {
    padding: 12px;
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 13px;
  }

  /* Light theme */
  .command-palette.light-theme {
    background: rgba(255, 255, 255, 0.72);
    border-color: rgba(0,0,0,0.08);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0,0,0,0.05);
  }
  
  .command-palette.light-theme .palette-item { color: black; }
  .command-palette.light-theme .palette-item.selected { background-color: rgba(0, 0, 0, 0.05); }
  .command-palette.light-theme .palette-section { color: rgba(60, 60, 67, 0.5); border-top-color: rgba(60, 60, 67, 0.1); }
  .command-palette.light-theme .palette-detail { color: rgba(60, 60, 67, 0.55); }
  .command-palette.light-theme .palette-no-results { color: rgba(60, 60, 67, 0.4); }
`;
