/* ══════════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════════ */
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let cx = 0, cy = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  cx = e.clientX; cy = e.clientY;
  cursor.style.left = cx + 'px';
  cursor.style.top  = cy + 'px';
});

(function ringLoop() {
  requestAnimationFrame(ringLoop);
  rx += (cx - rx) * 0.14;
  ry += (cy - ry) * 0.14;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top  = ry + 'px';
})();

document.querySelectorAll('a,button,.skill-block,.proj-card,.cert-card,.split-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '20px'; cursor.style.height = '20px';
    cursor.style.background = 'var(--c2)';
    cursorRing.style.width = '56px'; cursorRing.style.height = '56px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '12px'; cursor.style.height = '12px';
    cursor.style.background = 'var(--c1)';
    cursorRing.style.width = '36px'; cursorRing.style.height = '36px';
  });
});

/* ══════════════════════════════════════════
   THREE.JS — DATA-NETWORK BACKGROUND
   Nodes, floating edges, packets, binary rain
   Hexgrid, constellation stars, orbit rings
══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('bgCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 0, 16);

  /* — deep star field — */
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(5000 * 3);
  const sc = new Float32Array(5000 * 3);
  const pal = [[0,0.9,1],[0.48,0.23,0.93],[0.96,0.62,0.04],[0.06,0.73,0.51],[0.96,0.25,0.37]];
  for (let i = 0; i < 5000; i++) {
    sp[i*3]   = (Math.random()-0.5)*120;
    sp[i*3+1] = (Math.random()-0.5)*80;
    sp[i*3+2] = -30 - Math.random()*100;
    const c = pal[i % pal.length];
    sc[i*3]=c[0]; sc[i*3+1]=c[1]; sc[i*3+2]=c[2];
  }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('color',    new THREE.BufferAttribute(sc, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.5 })));

  /* — hex grid — */
  for (let hx = -6; hx <= 6; hx++) {
    for (let hy = -5; hy <= 5; hy++) {
      const cx = hx*3.46+(hy%2)*1.73, cy = hy*3.0, cz = -14;
      const pts = [];
      for (let a = 0; a < 7; a++) pts.push(new THREE.Vector3(cx+1.1*Math.cos(a*Math.PI/3), cy+1.1*Math.sin(a*Math.PI/3), cz));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x001833, opacity: 0.15, transparent: true })));
    }
  }

  /* — grid lines — */
  const gm = new THREE.LineBasicMaterial({ color: 0x001122, opacity: 0.12, transparent: true });
  for (let x = -20; x <= 20; x += 2.5) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-15,-12), new THREE.Vector3(x,15,-12)]);
    scene.add(new THREE.Line(g, gm));
  }
  for (let y = -15; y <= 15; y += 2.5) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-20,y,-12), new THREE.Vector3(20,y,-12)]);
    scene.add(new THREE.Line(g, gm));
  }

  /* — data nodes — */
  const NCOLS = [0x00e5ff,0x7c3aed,0xf59e0b,0x10b981,0xf43f5e,0x54a0ff,0xff6b9d,0x20e3b2];
  const nodes = [];
  for (let i = 0; i < 32; i++) {
    const r = 0.06 + Math.random()*0.13;
    const col = NCOLS[i % NCOLS.length];
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 8, 8),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 }));
    m.position.set((Math.random()-0.5)*28, (Math.random()-0.5)*18, (Math.random()-0.5)*4 - 7);
    scene.add(m);
    nodes.push({ m, col, ox: m.position.x, oy: m.position.y,
      phase: Math.random()*Math.PI*2, freq: 0.25+Math.random()*0.35, amp: 0.3+Math.random()*0.5 });
  }

  /* — pulse rings on nodes — */
  const rings = [];
  nodes.slice(0, 16).forEach((n, i) => {
    const rm = new THREE.Mesh(
      new THREE.RingGeometry(0.17, 0.22, 24),
      new THREE.MeshBasicMaterial({ color: NCOLS[i%NCOLS.length], transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
    rm.position.copy(n.m.position);
    scene.add(rm);
    rings.push({ m: rm, node: n, phase: Math.random()*Math.PI*2 });
  });

  /* — edges — */
  const edges = [];
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a+1; b < nodes.length; b++) {
      if (nodes[a].m.position.distanceTo(nodes[b].m.position) < 6.5) {
        const pts = [nodes[a].m.position.clone(), nodes[b].m.position.clone()];
        const l = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x002244, opacity: 0.22, transparent: true }));
        scene.add(l);
        edges.push({ l, a, b });
      }
    }
  }

  /* — data packets — */
  const pkts = [];
  edges.slice(0, 24).forEach((e, i) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 6, 6),
      new THREE.MeshBasicMaterial({ color: NCOLS[i%NCOLS.length], transparent: true, opacity: 0.95 }));
    scene.add(m);
    pkts.push({ m, e, t: Math.random(), spd: 0.003+Math.random()*0.005 });
  });

  /* — binary rain — */
  const RAIN = 800;
  const rainGeo = new THREE.BufferGeometry();
  const rp = new Float32Array(RAIN*3);
  const rv = new Float32Array(RAIN);
  for (let i = 0; i < RAIN; i++) {
    rp[i*3]   = (Math.random()-0.5)*36;
    rp[i*3+1] = (Math.random()-0.5)*24;
    rp[i*3+2] = -8 - Math.random()*5;
    rv[i] = 0.016 + Math.random()*0.032;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  scene.add(new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0x003344, size: 0.05, transparent: true, opacity: 0.5 })));

  /* — orbit rings — */
  const orbitData = [];
  [[0,0,-12,9,0.018],[4,-2,-13,6,0.022],[-5,3,-13,7,0.015]].forEach(([x,y,z,r,spd]) => {
    const pts = [];
    for (let a = 0; a <= 64; a++) pts.push(new THREE.Vector3(x+r*Math.cos(a/64*Math.PI*2), y+r*Math.sin(a/64*Math.PI*2), z));
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x001a33, opacity: 0.18, transparent: true }));
    scene.add(l);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.65 }));
    scene.add(dot);
    orbitData.push({ dot, cx: x, cy: y, cz: z, r, spd, phase: Math.random()*Math.PI*2 });
  });

  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX/window.innerWidth - 0.5) * 2;
    my = (e.clientY/window.innerHeight - 0.5) * 2;
  });

  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.007;

    camera.position.x += (mx*0.9 - camera.position.x) * 0.04;
    camera.position.y += (-my*0.6 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    nodes.forEach(n => {
      n.m.position.x = n.ox + Math.sin(t*n.freq + n.phase) * n.amp;
      n.m.position.y = n.oy + Math.cos(t*n.freq*0.8 + n.phase) * n.amp * 0.7;
      n.m.material.opacity = 0.4 + 0.6 * Math.abs(Math.sin(t*0.45 + n.phase));
    });

    rings.forEach(r => {
      r.m.position.copy(r.node.m.position);
      const s = 1 + 0.6*Math.abs(Math.sin(t*0.5 + r.phase));
      r.m.scale.setScalar(s);
      r.m.material.opacity = 0.35 * (1 - Math.abs(Math.sin(t*0.5 + r.phase))*0.8);
      r.m.rotation.z = t*0.3 + r.phase;
    });

    edges.forEach(({ l, a, b }) => {
      const pa = nodes[a].m.position, pb = nodes[b].m.position;
      const arr = l.geometry.attributes.position.array;
      arr[0]=pa.x; arr[1]=pa.y; arr[2]=pa.z;
      arr[3]=pb.x; arr[4]=pb.y; arr[5]=pb.z;
      l.geometry.attributes.position.needsUpdate = true;
      l.material.opacity = pa.distanceTo(pb) < 4 ? 0.26 : 0.09;
    });

    pkts.forEach(p => {
      p.t += p.spd;
      if (p.t > 1) p.t = 0;
      const pa = nodes[p.e.a].m.position, pb = nodes[p.e.b].m.position;
      p.m.position.lerpVectors(pa, pb, p.t);
      p.m.material.opacity = 0.5 + 0.5 * Math.sin(p.t * Math.PI);
    });

    const ra = rainGeo.attributes.position.array;
    for (let i = 0; i < RAIN; i++) {
      ra[i*3+1] -= rv[i];
      if (ra[i*3+1] < -12) { ra[i*3+1] = 12; ra[i*3] = (Math.random()-0.5)*36; }
    }
    rainGeo.attributes.position.needsUpdate = true;

    orbitData.forEach(o => {
      const a = t*o.spd*60 + o.phase;
      o.dot.position.set(o.cx + o.r*Math.cos(a), o.cy + o.r*Math.sin(a), o.cz + 0.3);
    });

    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* ══════════════════════════════════════════
   SCROLL REVEAL — IntersectionObserver
══════════════════════════════════════════ */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visible');
    // trigger skill bars
    e.target.querySelectorAll('.comp-fill').forEach(bar => {
      setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, 200);
    });
    io.unobserve(e.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal,.split-left,.split-right').forEach(el => io.observe(el));

// also trigger bars if the .comp-section is inside a .reveal
const compSec = document.querySelector('.comp-section');
if (compSec) {
  const compObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.comp-fill').forEach(bar => {
        setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, 200);
      });
      compObs.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  compObs.observe(compSec);
}

/* ══════════════════════════════════════════
   ANIMATED STAT COUNTERS
══════════════════════════════════════════ */
function animCount(el, target, suffix, duration, decimal) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = (decimal ? start.toFixed(2) : Math.floor(start)) + suffix;
  }, 16);
}

window.addEventListener('load', () => {
  setTimeout(() => {
    animCount(document.getElementById('s1'), 1, '+', 1200, false);
    animCount(document.getElementById('s2'), 4, '+', 1200, false);
    animCount(document.getElementById('s3'), 0.85, '+', 1600, true);
    animCount(document.getElementById('s4'), 3, '', 1200, false);
  }, 800);
});

/* ══════════════════════════════════════════
   NAV ACTIVE STATE ON SCROLL
══════════════════════════════════════════ */
const secs = document.querySelectorAll('section[id]');
const navAs = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let cur = '';
  secs.forEach(s => { if (window.scrollY >= s.offsetTop - 140) cur = s.id; });
  navAs.forEach(a => { a.style.color = a.getAttribute('href') === '#'+cur ? 'var(--c1)' : ''; });
}, { passive: true });

/* ══════════════════════════════════════════
   PARALLAX HERO ON SCROLL
══════════════════════════════════════════ */
const heroLeft = document.querySelector('.hero-left');
const heroRight = document.querySelector('.hero-right');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (heroLeft) heroLeft.style.transform = `translateY(${y * 0.15}px)`;
  if (heroRight) heroRight.style.transform = `translateY(${y * 0.08}px)`;
}, { passive: true });
