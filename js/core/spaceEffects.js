// https://leoneljdias.github.io/posts/globe-atmosphere-halo-comets/
export function initSpaceEffects(map) {
  const background = document.createElement('div');
  background.className = 'space-effects';
  background.setAttribute('aria-hidden', 'true');
  document.body.prepend(background);

  function createCanvas() {
    const canvas = document.createElement('canvas');
    background.append(canvas);
    return canvas;
  }

  const stars = createCanvas();
  const comets = createCanvas();
  const halo = createCanvas();
  const sheet = document.createElement('canvas');
  const initialCenter = map.getCenter();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let frame = 0;
  let previousTime = 0;
  let comet = null;

  function resize() {
    width = map.getContainer().clientWidth;
    height = map.getContainer().clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    for (const canvas of [stars, comets, halo, sheet]) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    const context = sheet.getContext('2d');
    let seed = 57;
    function random() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (let i = 0; i < width * height / 720; i++) {
      const x = random() * width;
      const y = random() * height;
      const size = random() * 1 + 0.2;
      const alpha = random() * 0.4 + 0.1;
      const color = random() > 0.8 ? (random() > 1 ? '180,210,255' : '255,230,185') : '255,255,255';
      if (size > 0.9) {
        context.fillStyle = `rgba(${color},${alpha * 0.12})`;
        context.beginPath();
        context.arc(x, y, size * 3, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = `rgba(${color},${alpha})`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    render();
  }

  function globeBounds() {
    const center = map.getCenter();
    const lat = center.lat * Math.PI / 180;
    const lng = center.lng * Math.PI / 180;
    const points = [];
    for (let i = 0; i < 32; i++) {
      const bearing = i / 32 * Math.PI * 2;
      const edgeLat = Math.asin(Math.cos(lat) * Math.cos(bearing));
      const edgeLng = lng + Math.atan2(Math.sin(bearing) * Math.cos(lat), -Math.sin(lat) * Math.sin(edgeLat));
      const point = map.project([edgeLng * 180 / Math.PI, edgeLat * 180 / Math.PI]);
      if (Number.isFinite(point.x) && Number.isFinite(point.y)) points.push(point);
    }
    if (points.length < 3) return null;
    const minX = Math.min(...points.map(point => point.x));
    const maxX = Math.max(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y));
    const maxY = Math.max(...points.map(point => point.y));
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, radius: Math.max(maxX - minX, maxY - minY) / 2 };
  }

  function visible() {
    return map.getProjection()?.type === 'globe' && map.getZoom() < 3.5;
  }

  function render() {
    const isVisible = visible();
    background.hidden = !isVisible;
    if (!isVisible || !width || !height) return;
    background.style.opacity = Math.min(1, (3.5 - map.getZoom()) / 0.5);
    const center = map.getCenter();
    const dx = reducedMotion.matches ? 0 : (center.lng - initialCenter.lng) / 360 * width;
    const dy = reducedMotion.matches ? 0 : (center.lat - initialCenter.lat) / 180 * height;
    const context = stars.getContext('2d');
    context.clearRect(0, 0, width, height);
    const offsetX = ((-dx % width) + width) % width;
    const offsetY = ((dy % height) + height) % height;
    for (const x of [offsetX - width, offsetX]) {
      for (const y of [offsetY - height, offsetY]) context.drawImage(sheet, x, y, width, height);
    }
    const glow = halo.getContext('2d');
    glow.clearRect(0, 0, width, height);
    const bounds = globeBounds();


    if (!bounds || bounds.radius < 1) return;
    const { x, y, radius } = bounds;
    const gradient = glow.createRadialGradient(x, y, radius, x, y, radius * 2.5);
    gradient.addColorStop(0, 'rgba(150,205,255,0.65)');
    gradient.addColorStop(0.08, 'rgba(90,160,235,0.3)');
    gradient.addColorStop(0.25, 'rgba(45,100,185,0.12)');
    gradient.addColorStop(0.55, 'rgba(20,50,110,0.03)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    glow.globalCompositeOperation = 'screen';
    glow.fillStyle = gradient;
    glow.fillRect(0, 0, width, height);

    glow.globalCompositeOperation = 'destination-out';
    glow.beginPath();
    glow.arc(x, y, radius, 0, Math.PI * 2);
    glow.fill();
    glow.globalCompositeOperation = 'source-over';
  }

  function animate(time) {
    frame = 0;
    const delta = Math.min((time - previousTime) / 1000 || 0, 0.5);
    previousTime = time;
    const context = comets.getContext('2d');
    context.clearRect(0, 0, width, height);
    if (visible() && !reducedMotion.matches) {
      if (!comet && Math.random() < delta * 0.04) {
        comet = { x: Math.random() * width, y: Math.random() * height, angle: Math.PI / 5, life: 0, duration: 1.8, speed: 500, length: 220 };
      }
      if (comet) {
        comet.life += delta;
        comet.x += Math.cos(comet.angle) * comet.speed * delta;
        comet.y += Math.sin(comet.angle) * comet.speed * delta;
        const alpha = Math.sin(Math.PI * Math.min(comet.life / comet.duration, 1));
        const tailX = comet.x - Math.cos(comet.angle) * comet.length;
        const tailY = comet.y - Math.sin(comet.angle) * comet.length;
        const gradient = context.createLinearGradient(tailX, tailY, comet.x, comet.y);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(1, `rgba(220,240,255,${alpha})`);
        context.strokeStyle = gradient;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(comet.x, comet.y);
        context.stroke();
        if (comet.life >= comet.duration) comet = null;
      }
      frame = requestAnimationFrame(animate);
    }
  }

  function update() {
    render();
    if (visible() && !document.hidden && !reducedMotion.matches && !frame) {
      previousTime = performance.now();
      frame = requestAnimationFrame(animate);
    } else if (!visible() || document.hidden || reducedMotion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      comet = null;
      comets.getContext('2d').clearRect(0, 0, width, height);
    }
  }

  map.on('render', update);
  map.on('resize', resize);
  document.addEventListener('visibilitychange', update);
  reducedMotion.addEventListener('change', update);
  resize();
  map.on('remove', () => {
    cancelAnimationFrame(frame);
    map.off('render', update);
    map.off('resize', resize);
    document.removeEventListener('visibilitychange', update);
    reducedMotion.removeEventListener('change', update);
    background.remove();
  });
}
