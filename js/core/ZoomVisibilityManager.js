import { ZOOM_LEVELS } from '../config/zoomLevels.js';

// zoom based visibility system
// make a min and max level range and makes onhide and onshow of the items
export class ZoomVisibilityManager {
  constructor(map) {
    this.map = map;
    this.items = new Map();
    map.on('zoom', () => this._updateAll());
  }

  register(id, levelRange, { onShow, onHide } = {}) {
    const [minLevel, maxLevel] = levelRange;
    this.items.set(id, {
      minZoom: ZOOM_LEVELS[minLevel],
      maxZoom: ZOOM_LEVELS[maxLevel],
      onShow,
      onHide,
      visible: null
    });
    this._updateOne(id); // apply initial state right 
  }

  unregister(id) {
    this.items.delete(id);
  }

  isVisible(id) {
    const item = this.items.get(id);
    return item ? !!item.visible : false;
  }

  _updateAll() {
    for (const id of this.items.keys()) this._updateOne(id);
  }

  _updateOne(id) {
    const item = this.items.get(id);
    if (!item) return;
    const z = this.map.getZoom();
    const shouldShow = z >= item.minZoom && z <= item.maxZoom;
    if (shouldShow !== item.visible) {
      item.visible = shouldShow;
      if (shouldShow && item.onShow) item.onShow();
      if (!shouldShow && item.onHide) item.onHide();
    }
  }
}
