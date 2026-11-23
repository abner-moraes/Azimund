// histórico de snapshots do editor, para desfazer/refazer
import { LIMITS } from '../config/limits.js';

export class SnapshotHistory {
  constructor(snapshot) {
    this.reset(snapshot);
  }

  reset(snapshot) {
    this.snapshots = [structuredClone(snapshot)];
    this.index = 0;
  }

  push(snapshot) {
    if (JSON.stringify(snapshot) === JSON.stringify(this.snapshots[this.index])) return;
    this.snapshots = this.snapshots.slice(0, this.index + 1);
    this.snapshots.push(structuredClone(snapshot));
    if (this.snapshots.length > LIMITS.historyEntries + 1) this.snapshots.shift();
    this.index = this.snapshots.length - 1;
  }

  undo() {
    return this.canUndo ? structuredClone(this.snapshots[--this.index]) : null;
  }
  redo() {
    return this.canRedo ? structuredClone(this.snapshots[++this.index]) : null;
  }
  get canUndo() {
    return this.index > 0;
  }
  get canRedo() {
    return this.index < this.snapshots.length - 1;
  }
}
