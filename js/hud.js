'use strict';

//Here we controll the top left Hud
class HudMgr {
  constructor() {    
    this._badge  = document.getElementById('modeBadge');
    this._gest   = document.getElementById('hGest');
    this._poly   = document.getElementById('hPoly');
    this._zoom   = document.getElementById('hZoom');
    this._fps    = document.getElementById('hFps');
    this._hands  = document.getElementById('hHands');
    this._conf   = document.getElementById('hConf');
    this._flash  = document.getElementById('gFlash');
    this._sdot   = document.getElementById('sDot');
    this._stext  = document.getElementById('sText');

    this._flashTimer = null;
    this._lastFlash  = '';
  }
  
  update({ mode, gesture, polyCount, zoom, fps, hands, confidence }) {    
    this._badge.textContent = mode;
    this._badge.className   = '';
    if      (mode === 'DRAWING') this._badge.className = 'mode-draw';
    else if (mode === 'ERASING') this._badge.className = 'mode-erase';
    else if (mode === 'PAN' || mode === 'ZOOM') this._badge.className = 'mode-pan';

    this._gest.textContent  = gesture;
    this._poly.textContent  = polyCount;
    this._zoom.textContent  = Math.round(zoom * 100) + '%';
    this._fps.textContent   = fps;
    this._hands.textContent = hands;
    this._conf.textContent  = Math.round(confidence * 100) + '%';
  }
 
  flashGesture(label) {
    if (this._lastFlash === label) return;
    this._lastFlash = label;
    clearTimeout(this._flashTimer);

    this._flash.textContent = label;
    this._flash.classList.add('show');

    this._flashTimer = setTimeout(() => {
      this._flash.classList.remove('show');
      this._lastFlash = '';
    }, 900);
  }

  setStatus(text, ready = false) {
    this._stext.textContent = text;
    this._sdot.className    = 's-dot' + (ready ? ' on' : '');
  }
}
