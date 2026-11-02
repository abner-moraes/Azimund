
// retorna a string da cor do vars.css sem ter q fazer os krl
// dai tu so faz um import { readThemeColor } from '../config/theme.js';

export function readThemeColor(name) {

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();

}
