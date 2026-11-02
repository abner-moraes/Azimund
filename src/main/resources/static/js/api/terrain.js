export const TERRAIN_SOURCE = {
  type: 'raster-dem',
  tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'],
  encoding: 'terrarium',
  tileSize: 512,
  // MAX zoom level of detail from the heightmap 
  maxzoom: 13
};

// the API calls from https://maps.mapterhorn.com/