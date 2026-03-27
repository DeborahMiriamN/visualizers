'use strict';
// Defined all the color pelletes
const PALETTES = [
  { stroke: '#00f5d4', fill: 'rgba(0,245,212,0.06)'   },
  { stroke: '#ffd60a', fill: 'rgba(255,214,10,0.06)'  },
  { stroke: '#f72585', fill: 'rgba(247,37,133,0.06)'  },
  { stroke: '#7b2fff', fill: 'rgba(123,47,255,0.06)'  },
  { stroke: '#ff6b35', fill: 'rgba(255,107,53,0.06)'  },
];

let _paletteIdx = 0;

function currentPalette() {
  return PALETTES[_paletteIdx];
}

function toggleColorCycle() {
  _paletteIdx = (_paletteIdx + 1) % PALETTES.length;
  document.getElementById('colorDot').style.background = PALETTES[_paletteIdx].stroke;
}
