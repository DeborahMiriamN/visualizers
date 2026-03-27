'use strict';

const App = (() => {  
  const drawing = new DrawingMgr(document.getElementById('mainCanvas'));
  const hud     = new HudMgr();
  const mode    = new ModeMachine();
  
  let lastHandData = { hands: [], count: 0, confidence: 0 };
  let cursorSS     = null;   // screen-space cursor position (or null)
  let pinchActive  = false;
  let panActive    = false;
  
  let lastConfirmedErase = false;
  let lastConfirmedRock  = false;
  
  let fps = 0, fpsFrames = 0, fpsLast = performance.now();
 
  drawing.seedDemoPolygons(); 

  function loop(ts) {
    
    fpsFrames++;
    const elapsed = ts - fpsLast;
    if (elapsed >= 500) {
      fps       = Math.round(fpsFrames / elapsed * 1000);
      fpsFrames = 0;
      fpsLast   = ts;
    }

    processGestures(lastHandData);
    
    const holdProgress = lastHandData.hands[0]?.holdProgress ?? 0;
    drawing.render(cursorSS, mode.is('drawing'), holdProgress);

    hud.update({
      mode:       mode.label,
      gesture:    _gestureLabel(),
      polyCount:  drawing.polygons.length,
      zoom:       drawing.transform.scale,
      fps,
      hands:      lastHandData.count,
      confidence: lastHandData.confidence || 0,
    });

    requestAnimationFrame(loop);
  }
  
  function _gestureLabel() {
    const { hands } = lastHandData;
    if (!hands.length) return '—';
    return hands.map(h => h.gesture.toUpperCase()).join(' + ');
  }
  
  function processGestures({ hands, count }) {
    const tr = drawing.transform;
    cursorSS = count > 0 ? { ...hands[0].smoothed } : null;
   
    if (count === 2) {
      const g0 = hands[0].gesture;
      const g1 = hands[1].gesture;

      const canPinch = g => g === 'pinch' || g === 'open';
      const isOpen   = g => g === 'open';
      
      if (canPinch(g0) && canPinch(g1)) {
        const p1 = hands[0].smoothed;
        const p2 = hands[1].smoothed;
        if (!pinchActive) { tr.startPinch(p1, p2); pinchActive = true; }
        else tr.updatePinch(p1, p2);

        mode.to('zooming');
        drawing.cancelDraft();
        panActive = false;
        hud.flashGesture('⊕ ZOOM');
        return;
      } else {
        if (pinchActive) { tr.endPinch(); pinchActive = false; }
      }
      
      if (isOpen(g0) && isOpen(g1)) {
        const cx = (hands[0].smoothed.x + hands[1].smoothed.x) / 2;
        const cy = (hands[0].smoothed.y + hands[1].smoothed.y) / 2;
        if (!panActive) { tr.startPan(cx, cy); panActive = true; }
        else tr.updatePan(cx, cy);

        mode.to('panning');
        drawing.cancelDraft();
        return;
      } else {
        if (panActive) { tr.endPan(); panActive = false; }
      }

    } else {      
      if (pinchActive) { tr.endPinch(); pinchActive = false; }     
    }
    
    if (count === 0) {
      if (mode.is('drawing')) drawing.finalizeDraft();
      mode.to('passive');
      lastConfirmedErase = false;
      lastConfirmedRock  = false;
      return;
    }
    
    const h  = hands[0];
    const g  = h.gesture;
    const gc = h.confirmed;
    const sp = h.smoothed;
    
    if (gc === 'fist') {
      if (!lastConfirmedErase) {
        lastConfirmedErase = true;
        drawing.eraseAll();
        drawing.flashErase();
        mode.to('erasing');
        hud.flashGesture('✊ ERASE');
      }
      return;
    } else {
      lastConfirmedErase = false;
    }

    
    if (gc === 'rockon') {
      if (!lastConfirmedRock) {
        lastConfirmedRock = true;
        drawing.undo();
        mode.to('passive');
        hud.flashGesture('🤘 UNDO');
      }
      return;
    } else {
      lastConfirmedRock = false;
    }

    
    if (g === 'peace') {
      if (mode.is('drawing') && drawing.draft.length >= 3) {
        drawing.finalizeDraft();
        hud.flashGesture('✌️ DONE');
      }
      mode.to('passive');
      return;
    }

    
    const drawActive = mode.is('drawing')
      ? (g === 'point' || gc === 'point')
      : (gc === 'point');
    if (drawActive) {
      const w = tr.toWorld(sp.x, sp.y);
      drawing.addDraftPt(w.x, w.y);
      mode.to('drawing');
      return;
    }
    
    if (g === 'open') {
      if (mode.is('drawing')) {
        drawing.finalizeDraft();
        hud.flashGesture('🖐️ SAVED');
      }
      const wx = h.wrist.x;
      const wy = h.wrist.y;
      if (!panActive) {
        tr.startPan(wx, wy);
        panActive = true;
        hud.flashGesture('🖐️ GRAB');
      } else {
        tr.updatePan(wx, wy);
      }
      mode.to('panning');
      return;
    }
    
    if (panActive) { tr.endPan(); panActive = false; }
    
    if (mode.is('drawing')) {
      drawing.finalizeDraft();
      hud.flashGesture('✅ SAVED');
    }
    mode.to('passive');
  }  

  async function start() {
    const fill = document.getElementById('ldFill');
    const msg  = document.getElementById('ldMsg');

    const onProgress = (text, pct) => {
      fill.style.width = pct + '%';
      msg.textContent  = text;
    };

    onProgress('Loading gesture model…', 10);

    const gestureMgr = new GestureMgr(
      document.getElementById('webcam'),
      document.getElementById('camCanvas'),
      data => { lastHandData = data; }
    );

    try {
      await gestureMgr.init(onProgress);
      hud.setStatus('TRACKING ACTIVE', true);
    } catch (err) {
      console.error(err);
      hud.setStatus('CAMERA ERROR', false);
      msg.textContent = '⚠ ' + err.message;
      return;
    }
    
    const ld = document.getElementById('loading');
    ld.style.transition = 'opacity 0.65s ease';
    ld.style.opacity    = '0';
    setTimeout(() => { ld.style.display = 'none'; }, 750);

    requestAnimationFrame(loop);
  }  

  return {
    start,

    eraseAll() {
      drawing.eraseAll();
      drawing.flashErase();
      hud.flashGesture('✊ ERASE');
    },

    undo() {
      drawing.undo();
      hud.flashGesture('🤘 UNDO');
    },

    resetView() {
      drawing.transform.reset();
    },
    
    save() {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width  = drawing.canvas.width;
      exportCanvas.height = drawing.canvas.height;

      const ectx = exportCanvas.getContext('2d');
      ectx.fillStyle = '#05050a';
      ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      ectx.drawImage(drawing.canvas, 0, 0);

      const link      = document.createElement('a');
      link.download   = `gestureboard-${Date.now()}.png`;
      link.href       = exportCanvas.toDataURL('image/png');
      link.click();
    },
  };

})();

App.start().catch(console.error);
