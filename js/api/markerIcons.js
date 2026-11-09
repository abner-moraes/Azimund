// PLACEHOLDER mudar pra ter os marcadores que tu escolhe e tudo mais la pela UI e tudo mais sla
export function markerIconUrl([width, height], miniatura = '') {
  if (!miniatura) return 'none';
  const path = `${import.meta.env?.BASE_URL || '/'}${miniatura.replace(/^\//, '')}`;
  return `url(${JSON.stringify(path)})`;
}
