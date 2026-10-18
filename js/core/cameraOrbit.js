// auto orbit used after flying to a marker
// manual drag calls stopOrbit to hand control back to the user (on main.jsx)
let orbitFrame = null;

export function stopOrbit() {
  if (orbitFrame) {
    cancelAnimationFrame(orbitFrame);
    orbitFrame = null;
  }
}

export function flyToOrbit(map, coords, { zoom = 12.75, pitch = 65, orbitSpeed = 0.75 } = {}) {
  stopOrbit();
  map.flyTo({
    center: coords,
    zoom,
    pitch,
    duration: 3000,
    essential: true
  });

  map.once('moveend', () => {
    const spin = () => {
      map.setBearing((map.getBearing() + orbitSpeed) % 360);
      orbitFrame = requestAnimationFrame(spin);
    };
    orbitFrame = requestAnimationFrame(spin);
  });
}
