'use strict';

class TransformMgr {
  constructor() {
    this.scale = 1;
    this.tx    = 0;
    this.ty    = 0;

    this._pinch0 = null; 
    this._pan0   = null; 
  }
 
  apply(ctx) {
    ctx.setTransform(this.scale, 0, 0, this.scale, this.tx, this.ty);
  }
  
  toWorld(sx, sy) {
    return {
      x: (sx - this.tx) / this.scale,
      y: (sy - this.ty) / this.scale,
    };
  }
  
  toScreen(wx, wy) {
    return {
      x: wx * this.scale + this.tx,
      y: wy * this.scale + this.ty,
    };
  }
  
  startPinch(p1, p2) {
    this._pinch0 = {
      cx: (p1.x + p2.x) / 2,
      cy: (p1.y + p2.y) / 2,
      d:  Math.hypot(p2.x - p1.x, p2.y - p1.y),
      scale: this.scale,
      tx: this.tx,
      ty: this.ty,
    };
  }
 
  updatePinch(p1, p2) {
    if (!this._pinch0) return;
    const s0 = this._pinch0;

    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const d  = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    const newScale = Math.max(
      Config.ZOOM_MIN,
      Math.min(Config.ZOOM_MAX, s0.scale * (d / s0.d))
    );
    const ratio = newScale / s0.scale;

    this.tx    = cx - (s0.cx - s0.tx) * ratio;
    this.ty    = cy - (s0.cy - s0.ty) * ratio;
    this.scale = newScale;
  }
  
  endPinch() {
    this._pinch0 = null;
  }
 
  startPan(cx, cy) {
    this._pan0 = { cx, cy, tx: this.tx, ty: this.ty };
  }
 
  updatePan(cx, cy) {
    if (!this._pan0) return;
    this.tx = this._pan0.tx + (cx - this._pan0.cx);
    this.ty = this._pan0.ty + (cy - this._pan0.cy);
  }
  
  endPan() {
    this._pan0 = null;
  }
 
  reset() {
    this.scale   = 1;
    this.tx      = 0;
    this.ty      = 0;
    this._pinch0 = null;
    this._pan0   = null;
  }
}
