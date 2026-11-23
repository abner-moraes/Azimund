// le a cor direto do vars.css, assim o JS (maplibre, terradraw, three) usa as mesmas cores do CSS
// chamar na hora de usar, e nao no topo do modulo, pq o CSS pode ainda nao ter carregado
export function readThemeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
