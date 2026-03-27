'use strict';

const Config = Object.freeze({  
  SMOOTH_ALPHA:      0.16,
  SMOOTH_ALPHA_FAST: 0.38,
  
  HOLD_FRAMES:  5,
  HOLD_DECAY:   3,
  
  MIN_VERTS:  3,
  MIN_MOVE:   6,
  
  ZOOM_MIN: 0.15,
  ZOOM_MAX: 12,
  
  DETECT_CONF: 0.72,
  TRACK_CONF:  0.78,
  
  PINCH_DIST:  0.065, 
  SNAP_RADIUS: 22, 

  // ─── Reliability ─────────────────────────────────────────
  WATCHDOG_MS: 3000,   // ms before "TRACKING LOST" warning is shown

  // ─── Velocity normalization ───────────────────────────────
  // Divides screen diagonal to get a resolution-independent velocity scale.
  VEL_NORM: 1000,
});
