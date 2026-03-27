'use strict';

class PointerSmoother { 
  constructor(alpha = Config.SMOOTH_ALPHA) {
    this._alpha = alpha;
    this._x = null;
    this._y = null;
  }
  
  update(nx, ny) {
    // First call — seed the filter with the raw position.
    if (this._x === null) {
      this._x = nx;
      this._y = ny;
      return { x: nx, y: ny };
    }

    const dx  = nx - this._x;
    const dy  = ny - this._y;
    const vel = Math.hypot(dx, dy);
    
    const screenDiag = Math.hypot(window.innerWidth, window.innerHeight);
    const t     = Math.min(1, vel / (screenDiag / Config.VEL_NORM));
    const alpha = this._alpha + t * (Config.SMOOTH_ALPHA_FAST - this._alpha);

    this._x += alpha * dx;
    this._y += alpha * dy;

    return { x: this._x, y: this._y };
  }
  
  reset() {
    this._x = null;
    this._y = null;
  }
 
  get pos() {
    return this._x === null ? null : { x: this._x, y: this._y };
  }
}
