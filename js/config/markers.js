// Demo markers (ISSO SERIA AS ATIVIDADES E TD MAIS)
export const MARKERS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        message: 'teste',
        iconSize: [60, 60],
        levelRange: ['CONTINENTAL', 'CITY'] //visibility level
      },
      geometry: {
        type: 'Point',
        coordinates: [-50.200395591397736, -29.65694190676408]
      }
    },
    {
      type: 'Feature',
      properties: {
        message: '12345',
        iconSize: [50, 50],
        levelRange: ['CONTINENTAL', 'STREET']
      },
      geometry: {
        type: 'Point',
        coordinates: [-61.2158203125, -15.97189158092897]
      }
    },
    {
      type: 'Feature',
      properties: {
        message: 'lorem ipsum dolor sit amet',
        iconSize: [40, 40],
        levelRange: ['CONTINENTAL', 'STREET']
      },
      geometry: {
        type: 'Point',
        coordinates: [-25.29223632812499, 28.28151823530889]
      }
    }
  ]
};
