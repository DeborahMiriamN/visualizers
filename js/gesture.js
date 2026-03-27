'use strict';

//Support for all the gestures
class GestureMgr { 
  constructor(videoEl, overlayCanvas, onResults) {
    this.videoEl   = videoEl;
    this.overlay   = overlayCanvas;
    this.octx      = overlayCanvas.getContext('2d');
    this.onResults = onResults;
    
    this._smoothers  = Array.from({ length: 2 }, () => new PointerSmoother());
    this._lastG      = ['none', 'none'];
    this._holdCnt    = [0, 0];
    this._confirmed  = ['none', 'none'];

    this.hands  = null;
    this.camera = null;
    
    this._lastResultTime = null;
    this._watchdogEl     = document.getElementById('watchdogWarn');
    this._watchdogTimer  = null;
  }
 
  async init(onProgress) {
    this.hands = new Hands({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });

    this.hands.setOptions({
      maxNumHands:             2,
      modelComplexity:         1,
      minDetectionConfidence:  Config.DETECT_CONF,
      minTrackingConfidence:   Config.TRACK_CONF,
    });

    this.hands.onResults(r => this._process(r));

    onProgress('Loading hand detection model…', 25);
    await this.hands.initialize();
    onProgress('Starting webcam…', 65);

    this.camera = new Camera(this.videoEl, {
      onFrame: async () => {
        this.overlay.width  = this.videoEl.videoWidth  || 640;
        this.overlay.height = this.videoEl.videoHeight || 480;
        await this.hands.send({ image: this.videoEl });
      },
      width: 1280, height: 720,
    });

    await this.camera.start();
    onProgress('Ready!', 100);
    
    this._lastResultTime = performance.now();
    this._startWatchdog();
  }

  _startWatchdog() {
    this._watchdogTimer = setInterval(() => {
      const stale = performance.now() - this._lastResultTime > Config.WATCHDOG_MS;
      this._watchdogEl.classList.toggle('visible', stale);
    }, 1000);
  }
 
  _classify(lm, handedness) {
    const tipIds = [4,  8, 12, 16, 20];
    const pipIds = [2,  6, 10, 14, 18];
    const mcpIds = [1,  5,  9, 13, 17];
   
    const up = tipIds.map((tip, i) => {
      if (i === 0) {        
        return handedness === 'Right'
          ? lm[tip].x < lm[pipIds[i]].x 
          : lm[tip].x > lm[pipIds[i]].x;
      }      
      return lm[tip].y < lm[pipIds[i]].y;
    });

    const [thumb, index, middle, ring, pinky] = up;
   
    if (!thumb && !index && !middle && !ring && !pinky) return 'fist';
    if (!thumb &&  index && !middle && !ring && !pinky) return 'point';
    
    if (!thumb && index && middle && !ring && !pinky) {
      const spread = Math.abs(lm[8].x - lm[12].x);
      return spread > 0.04 ? 'peace' : 'point'; 
    }
   
    if (!thumb && index && !middle && !ring && pinky) {
      const ringBelowMCP   = lm[16].y > lm[mcpIds[3]].y;
      const middleBelowMCP = lm[12].y > lm[mcpIds[2]].y;
      return (ringBelowMCP && middleBelowMCP) ? 'rockon' : 'unknown';
    }
    
    if (thumb && index && middle && ring && pinky) return 'open';
    
    const pd = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
    if (pd < Config.PINCH_DIST) return 'pinch';

    return 'unknown';
  }
 
  _process(results) {
    this._lastResultTime = performance.now();

    const ctx = this.octx;
    const W   = this.overlay.width;
    const H   = this.overlay.height;
    ctx.clearRect(0, 0, W, H);

    const landmarks    = results.multiHandLandmarks || [];
    const handednesses = results.multiHandedness    || [];
    const count        = landmarks.length;
    
    const handData = landmarks.map((lm, i) => {      
      drawConnectors(ctx, lm, HAND_CONNECTIONS, {
        color: 'rgba(0,245,212,0.3)', lineWidth: 1.2,
      });
      drawLandmarks(ctx, lm, {
        color: 'rgba(0,245,212,0.75)', lineWidth: 1, radius: 2.5,
      });
     
      const tip = lm[8];
      const raw = {
        x: (1 - tip.x) * window.innerWidth,
        y: tip.y * window.innerHeight,
      };
      const smoothed = this._smoothers[i].update(raw.x, raw.y);
      
      const handLabel = handednesses[i]?.label || 'Right';
      const gesture   = this._classify(lm, handLabel);
     
      if (gesture === this._lastG[i]) {       
        this._holdCnt[i] = Math.min(Config.HOLD_FRAMES, this._holdCnt[i] + 1);
      } else {        
        this._holdCnt[i] = Math.max(0, this._holdCnt[i] - Config.HOLD_DECAY);        
        if (this._holdCnt[i] === 0) this._lastG[i] = gesture;
      }
      
      if (this._holdCnt[i] >= Config.HOLD_FRAMES) {
        this._confirmed[i] = gesture;
      }
      
      const wrist = {
        x: (1 - lm[0].x) * window.innerWidth,
        y: lm[0].y * window.innerHeight,
      };

      return {
        smoothed,
        raw,
        gesture,
        confirmed:    this._confirmed[i],
        lm,
        wrist,
        holdProgress: this._holdCnt[i] / Config.HOLD_FRAMES,
      };
    });
    
    for (let i = count; i < 2; i++) {
      this._smoothers[i].reset();
      this._lastG[i]     = 'none';
      this._holdCnt[i]   = 0;
      this._confirmed[i] = 'none';
    }
    
    const avgConf = count === 0
      ? 0
      : this._holdCnt.slice(0, count).reduce((a, b) => a + b, 0) / count;

    this.onResults({
      hands:      handData,
      count,
      confidence: avgConf / Config.HOLD_FRAMES,
    });
  }
}
