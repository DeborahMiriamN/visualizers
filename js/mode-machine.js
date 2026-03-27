'use strict';
// Improving the smooth drawing aspect
class ModeMachine {
  constructor() {
    this._state = 'passive';
    this._prev  = 'passive';
  }
 
  get state() { return this._state; }
  
  get prev()  { return this._prev; }
  
  get label() {
    return {
      passive:  'PASSIVE',
      drawing:  'DRAWING',
      panning:  'PAN',
      zooming:  'ZOOM',
      erasing:  'ERASING',
    }[this._state] || 'PASSIVE';
  }
  
  to(next) {
    if (this._state !== next) {
      this._prev  = this._state;
      this._state = next;
    }
  }
  
  is(...states) {
    return states.includes(this._state);
  }
}
