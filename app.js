/*
  Image Annotator
  Copyright (c) 2026 mymhabib - https://github.com/mymhabib
  Released under the MIT License (see LICENSE).
*/

(() => {
  const $ = s => document.querySelector(s);
  const cv = $('#c'), ctx = cv.getContext('2d');
  const base = document.createElement('canvas');           // untouched original pixels
  let W = 0, H = 0, hasImg = false, tool = 'arrow', lastNumR = 13;
  let items = [], sel = null, draft = null, mode = null, hist = [], k = 1, crop = null;

  // ---------- UI ----------
  // per-shape colors, picked from a small popover opened by the ▾ next to each tool
  const colors = { arrow: '#ef4444', rect: '#ef4444', num: '#ef4444' };
  const pop = document.createElement('div'); pop.id = 'pop'; document.body.appendChild(pop);
  let popShape = null, popSnapped = false;
  const paintDots = () => document.querySelectorAll('.cbtn').forEach(b => { b.querySelector('i').style.background = colors[b.dataset.color]; });
  function chooseColor(c) {
    colors[popShape] = c; picker.value = c; paintDots();
    if (sel && sel.type === popShape) { if (!popSnapped) { snap(); popSnapped = true; } sel.color = c; render(); }
  }
  const closePop = () => { pop.style.display = 'none'; popShape = null; };
  ['#ef4444', '#f59e0b', '#22c55e', '#2563eb', '#a855f7', '#000000', '#ffffff'].forEach(c => {
    const b = document.createElement('button'); b.className = 'sw'; b.style.background = c; b.style.border = '1px solid var(--line)';
    b.onclick = () => { popSnapped = false; chooseColor(c); closePop(); };
    pop.appendChild(b);
  });
  const picker = document.createElement('input'); picker.type = 'color'; pop.appendChild(picker);
  picker.oninput = () => chooseColor(picker.value);
  picker.onchange = () => { popSnapped = false; };
  document.querySelectorAll('.cbtn').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const shape = b.dataset.color; if (popShape === shape) return closePop();
    popShape = shape; popSnapped = false; setTool(shape); picker.value = colors[shape];
    const r = b.getBoundingClientRect(); pop.style.display = 'flex'; pop.style.top = r.bottom + 6 + 'px';
    pop.style.left = Math.min(r.left, innerWidth - pop.offsetWidth - 8) + 'px';
  });
  document.addEventListener('pointerdown', e => { if (popShape && !pop.contains(e.target) && !e.target.closest('.cbtn')) closePop(); });
  paintDots();
  document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
  // Line / arrow head / number size: slider + typed % + reset. 100% = default. Edits the selected shape live,
  // otherwise sets the size for the next shapes.
  const thick = $('#thick'), head = $('#head'), numsz = $('#numsz');
  const ub = () => Math.max(1, W / 1000), NUM0 = () => 13 * ub();
  const R = { thick, head, numsz }, N = { thick: $('#thickn'), head: $('#headn'), numsz: $('#numn') };
  const lineDef = { arrow: 100, rect: 100 };   // line thickness (%) remembered separately for arrows and boxes
  function syncLine() {
    const k = sel ? sel.type : tool;
    if (sel && sel.lw != null) thick.value = sel.lw / ub() / 3 * 100; else if (k in lineDef) thick.value = lineDef[k];
    showPct();
  }
  const showPct = () => { for (const id in R) N[id].value = Math.round(R[id].value); };
  showPct();
  const redraw = () => { if (hasImg) render(); };
  const rel = {   // does this control affect the selected shape?
    thick: () => sel && sel.lw != null, head: () => sel && sel.type === 'arrow', numsz: () => sel && sel.type === 'num' };
  const apply = {
    thick: () => { const k = sel ? sel.type : tool; if (k in lineDef) lineDef[k] = +thick.value; if (rel.thick()) sel.lw = thick.value / 100 * 3 * ub(); },
    head: () => { if (rel.head()) sel.hd = head.value / 100 * 15 * ub(); },
    numsz: () => { lastNumR = numsz.value / 100 * NUM0(); if (rel.numsz()) sel.r = lastNumR; } };   // next numbers match too
  for (const id in R) {
    const r = R[id], n = N[id];
    r.addEventListener('pointerdown', () => { if (rel[id]()) snap(); });
    r.addEventListener('input', () => { showPct(); apply[id](); redraw(); });
    n.addEventListener('focus', () => { n._snapped = false; });
    n.addEventListener('input', () => {
      const v = parseFloat(n.value); if (isNaN(v)) return;
      if (!n._snapped && rel[id]()) { snap(); n._snapped = true; }
      r.value = v; apply[id](); redraw();
    });
    n.addEventListener('change', showPct);
    $('#' + id + 'b').addEventListener('click', () => { if (rel[id]()) snap(); r.value = 100; showPct(); apply[id](); redraw(); });
  }
  $('#newtab').onclick = () => window.open(location.href, '_blank');
  function select(a) {
    sel = a;
    if (a && a.hd != null) head.value = a.hd / ub() / 15 * 100;
    if (a && a.type === 'num') numsz.value = a.r / NUM0() * 100;
    syncLine();
  }
  let ctlKey = null;
  function updateCtls() {
    const key = sel ? sel.type : (tool === 'select' ? '' : tool), tok = key + (sel ? '*' : '');
    if (tok === ctlKey) return; ctlKey = tok; syncLine();
    let any = false;
    document.querySelectorAll('#sizes .ctl').forEach(c => { const on = key && c.dataset.for.split(' ').includes(key); c.style.display = on ? 'flex' : 'none'; any = any || on; });
    $('#sizes').style.display = any ? 'flex' : 'none';
  }
  function setTool(t) {
    if (t !== 'crop' && crop) { crop = null; updateCropBar(); }
    if (t === 'crop' && sel) select(null);
    updateCtls(); tool = t; updateCtls(); document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t)); cv.style.cursor = t === 'select' ? 'default' : 'crosshair'; if (hasImg) render(); }
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1600); }

  // ---------- Loading images ----------
  function loadBlob(blob) {
    const url = URL.createObjectURL(blob), img = new Image();
    img.onload = () => {
      W = base.width = img.naturalWidth; H = base.height = img.naturalHeight;
      base.getContext('2d').drawImage(img, 0, 0);
      items = []; sel = draft = mode = crop = null; hist = []; hasImg = true; updateCropBar(); lastNumR = NUM0(); numsz.value = 100; showPct();
      cv.style.display = 'block'; $('#empty').style.display = 'none';
      layout(); URL.revokeObjectURL(url);
    };
    img.src = url;
  }
  document.addEventListener('paste', e => {
    for (const it of e.clipboardData.items) if (it.type.startsWith('image/')) { loadBlob(it.getAsFile()); e.preventDefault(); return; }
  });
  const stage = $('#stage');
  stage.addEventListener('dragover', e => { e.preventDefault(); stage.classList.add('drag'); });
  stage.addEventListener('dragleave', () => stage.classList.remove('drag'));
  stage.addEventListener('drop', e => {
    e.preventDefault(); stage.classList.remove('drag');
    const f = [...e.dataTransfer.files].find(f => f.type.startsWith('image/')); if (f) loadBlob(f);
  });
  $('#open').onclick = () => $('#file').click();
  $('#file').onchange = e => { if (e.target.files[0]) loadBlob(e.target.files[0]); e.target.value = ''; };

  // ---------- HD layout: backing store = CSS size x devicePixelRatio ----------
  function layout() {
    if (!hasImg) return;
    const dpr = window.devicePixelRatio || 1;
    const cs = Math.min((stage.clientWidth - 32) / W, (stage.clientHeight - 32) / H, 1);
    cv.style.width = W * cs + 'px'; cv.style.height = H * cs + 'px';
    cv.width = Math.round(W * cs * dpr); cv.height = Math.round(H * cs * dpr);
    k = cv.width / W; render();
  }
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(layout).observe(stage);   // toolbar height can change

  // ---------- Drawing ----------
    const isB = a => a.type === 'blur' || a.type === 'gblur';
  const gbCache = new WeakMap();
  const canFilter = (() => { const t = document.createElement('canvas').getContext('2d'); t.filter = 'blur(2px)'; return t.filter === 'blur(2px)'; })();
  function smoothBlur(a, x, y, w, h) {
    const sigma = Math.max(8 * Math.max(1, W / 1000), Math.min(w, h) / 6), key = [x, y, w, h, W].join();
    const c = gbCache.get(a); if (c && c.key === key) return c;
    const pad = Math.ceil(sigma * 3), sx = Math.max(0, Math.floor(x - pad)), sy = Math.max(0, Math.floor(y - pad));
    const sw = Math.min(W, Math.ceil(x + w + pad)) - sx, sh = Math.min(H, Math.ceil(y + h + pad)) - sy;
    const off = document.createElement('canvas'); off.width = sw; off.height = sh;
    const og = off.getContext('2d'); og.imageSmoothingQuality = 'high';
    if (canFilter) { og.filter = `blur(${sigma}px)`; og.drawImage(base, sx, sy, sw, sh, 0, 0, sw, sh); }
    else {   // Safari fallback: repeated halving then smooth upscale
      let cur = document.createElement('canvas'); cur.width = sw; cur.height = sh; cur.getContext('2d').drawImage(base, sx, sy, sw, sh, 0, 0, sw, sh);
      const f = Math.max(2, Math.round(sigma / 1.5)); let cw = sw, ch = sh;
      while (cw > sw / f + 1 && cw > 4 && ch > 4) { const n = document.createElement('canvas'); n.width = Math.max(2, Math.ceil(cw / 2)); n.height = Math.max(2, Math.ceil(ch / 2)); const ng = n.getContext('2d'); ng.imageSmoothingQuality = 'high'; ng.drawImage(cur, 0, 0, n.width, n.height); cur = n; cw = n.width; ch = n.height; }
      og.drawImage(cur, 0, 0, cw, ch, 0, 0, sw, sh);
    }
    const r = { key, off, sx, sy }; gbCache.set(a, r); return r;
  }
  function drawItem(g, a) {
    g.save(); g.strokeStyle = g.fillStyle = a.color; g.lineCap = g.lineJoin = 'round';
    if (a.type === 'rect') {
      g.lineWidth = a.lw; g.strokeRect(a.x1, a.y1, a.x2 - a.x1, a.y2 - a.y1);
    } else if (a.type === 'arrow') {
      const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1), head = a.hd;
      g.lineWidth = a.lw;
      g.beginPath(); g.moveTo(a.x1, a.y1);
      g.lineTo(a.x2 - Math.cos(ang) * head * .6, a.y2 - Math.sin(ang) * head * .6); g.stroke();
      g.beginPath(); g.moveTo(a.x2, a.y2);
      g.lineTo(a.x2 - head * Math.cos(ang - .45), a.y2 - head * Math.sin(ang - .45));
      g.lineTo(a.x2 - head * Math.cos(ang + .45), a.y2 - head * Math.sin(ang + .45));
      g.closePath(); g.fill();
    } else if (a.type === 'num') {
      g.beginPath(); g.arc(a.x1, a.y1, a.r, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = `700 ${a.r * 1.15}px -apple-system, Helvetica, Arial, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a.n, a.x1, a.y1 + a.r * .06);
    } else if (a.type === 'blur') {
      const x = Math.min(a.x1, a.x2), y = Math.min(a.y1, a.y2), w = Math.abs(a.x2 - a.x1), h = Math.abs(a.y2 - a.y1);
      if (w < 2 || h < 2) { g.restore(); return; }
      const b = Math.max(8, Math.round(Math.min(w, h) / 6), Math.round(W / 120));
      const t = document.createElement('canvas'); t.width = Math.ceil(w / b); t.height = Math.ceil(h / b);
      t.getContext('2d').drawImage(base, x, y, w, h, 0, 0, t.width, t.height);
      g.imageSmoothingEnabled = false; g.drawImage(t, 0, 0, t.width, t.height, x, y, t.width * b, t.height * b);
    }
    else if (a.type === 'gblur') {
      const x = Math.min(a.x1, a.x2), y = Math.min(a.y1, a.y2), w = Math.abs(a.x2 - a.x1), h = Math.abs(a.y2 - a.y1);
      if (w < 2 || h < 2) { g.restore(); return; }
      const r = smoothBlur(a, x, y, w, h);
      g.drawImage(r.off, x - r.sx, y - r.sy, w, h, x, y, w, h);
    }
    g.restore();
  }
  function handlesOf(a) {
    if (a.type === 'arrow') return [{ key: 'start', x: a.x1, y: a.y1 }, { key: 'end', x: a.x2, y: a.y2 }];
    if (a.type === 'num') return [{ key: 'r', x: a.x1 + a.r * .7071, y: a.y1 + a.r * .7071 }];
    const mx = (a.x1 + a.x2) / 2, my = (a.y1 + a.y2) / 2;
    return [['nw', a.x1, a.y1], ['n', mx, a.y1], ['ne', a.x2, a.y1], ['e', a.x2, my], ['se', a.x2, a.y2], ['s', mx, a.y2], ['sw', a.x1, a.y2], ['w', a.x1, my]].map(([key, x, y]) => ({ key, x, y }));
  }
  // scale = backing px per image px; ui = draw selection handles
  function render(g = ctx, scale = k, ui = true) {
    if (ui) updateCtls();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.drawImage(base, 0, 0);
    items.filter(isB).forEach(a => drawItem(g, a));   // blurs sit under everything else
    items.filter(a => !isB(a)).forEach(a => drawItem(g, a));
    if (draft) drawItem(g, draft);
    if (ui && crop) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = window.devicePixelRatio || 1, cw = g.canvas.width, ch = g.canvas.height;
      const x = Math.min(crop.x1, crop.x2) * scale, y = Math.min(crop.y1, crop.y2) * scale, w = Math.abs(crop.x2 - crop.x1) * scale, h = Math.abs(crop.y2 - crop.y1) * scale;
      g.fillStyle = 'rgba(0,0,0,.55)';
      g.fillRect(0, 0, cw, y); g.fillRect(0, y + h, cw, ch - y - h); g.fillRect(0, y, x, h); g.fillRect(x + w, y, cw - x - w, h);
      g.strokeStyle = '#fff'; g.lineWidth = 1.5 * dpr; g.strokeRect(x, y, w, h); g.fillStyle = '#fff';
      handlesOf(crop).forEach(hd => { const q = 5 * dpr; g.fillRect(hd.x * scale - q, hd.y * scale - q, 2 * q, 2 * q); g.strokeStyle = '#2563eb'; g.strokeRect(hd.x * scale - q, hd.y * scale - q, 2 * q, 2 * q); });
      const t = Math.round(w / scale) + ' × ' + Math.round(h / scale);
      g.font = `600 ${12 * dpr}px ui-monospace, Menlo, monospace`;
      const pw = g.measureText(t).width + 12 * dpr, ph = 18 * dpr, bx = x, by = y > ph + 6 * dpr ? y - ph - 4 * dpr : y + 4 * dpr;
      g.fillStyle = '#2563eb'; g.fillRect(bx, by, pw, ph);
      g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(t, bx + 6 * dpr, by + ph / 2 + dpr * .5);
    }
    if (ui && sel && !draft) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = window.devicePixelRatio || 1, acc = '#2563eb';
      g.lineWidth = 1.5 * dpr; g.strokeStyle = acc; g.setLineDash([5 * dpr, 4 * dpr]);
      if (sel.type === 'num') { g.beginPath(); g.arc(sel.x1 * scale, sel.y1 * scale, sel.r * scale + 3 * dpr, 0, 7); g.stroke(); }
      else if (sel.type !== 'arrow') g.strokeRect(sel.x1 * scale, sel.y1 * scale, (sel.x2 - sel.x1) * scale, (sel.y2 - sel.y1) * scale);
      g.setLineDash([]); g.fillStyle = '#fff';
      handlesOf(sel).forEach(h => { const s = 5 * dpr; g.fillRect(h.x * scale - s, h.y * scale - s, 2 * s, 2 * s); g.strokeRect(h.x * scale - s, h.y * scale - s, 2 * s, 2 * s); });
      if (sel.type === 'num') {   // size badge next to the number
        const t = Math.round(sel.r / NUM0() * 100) + '%';
        g.font = `600 ${12 * dpr}px ui-monospace, Menlo, monospace`;
        const ph = 18 * dpr, pw = g.measureText(t).width + 12 * dpr, bx = (sel.x1 + sel.r) * scale + 12 * dpr, by = sel.y1 * scale - ph / 2;
        g.fillStyle = acc; g.fillRect(bx, by, pw, ph);
        g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(t, bx + 6 * dpr, by + ph / 2 + dpr * .5);
      }
    }
  }

  // ---------- Hit testing ----------
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * W / r.width }; };
  const px = () => W / cv.getBoundingClientRect().width;   // image px per CSS px
  function segDist(p, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / l));
    return Math.hypot(p.x - ax - t * dx, p.y - ay - t * dy);
  }
  function hits(a, p, full) {
    const tol = 10 * px();
    if (a.type === 'num') return Math.hypot(p.x - a.x1, p.y - a.y1) <= a.r + tol / 2;
    if (a.type === 'arrow') return segDist(p, a.x1, a.y1, a.x2, a.y2) <= Math.max(tol, a.lw);
    const x1 = Math.min(a.x1, a.x2), x2 = Math.max(a.x1, a.x2), y1 = Math.min(a.y1, a.y2), y2 = Math.max(a.y1, a.y2);
    const outer = p.x >= x1 - tol && p.x <= x2 + tol && p.y >= y1 - tol && p.y <= y2 + tol;
    if (isB(a) && full) return outer;
    return outer && !(p.x > x1 + tol && p.x < x2 - tol && p.y > y1 + tol && p.y < y2 - tol);   // box: edges only
  }
  const hitItem = (p, full) => { for (let i = items.length - 1; i >= 0; i--) if (hits(items[i], p, full)) return items[i]; return null; };
  const hitHandle = p => { const o = tool === 'crop' ? crop : sel; if (!o) return null; const t = 9 * px(); return handlesOf(o).find(h => Math.abs(h.x - p.x) <= t && Math.abs(h.y - p.y) <= t) || null; };
  const CUR = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', start: 'pointer', end: 'pointer', r: 'nwse-resize' };

  // ---------- History ----------
  function snap() { hist.push(JSON.stringify(items)); if (hist.length > 100) hist.shift(); }
  function undo() {
    if (!hist.length) return;
    const e = hist.pop(); crop = null; updateCropBar(); sel = null;
    if (typeof e === 'string') { items = JSON.parse(e); render(); return; }
    base.width = e.W; base.height = e.H; base.getContext('2d').drawImage(e.bc, 0, 0);   // undo a crop
    W = e.W; H = e.H; items = JSON.parse(e.items); layout();
  }
  // ---------- Crop ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const inCrop = p => crop && p.x >= Math.min(crop.x1, crop.x2) && p.x <= Math.max(crop.x1, crop.x2) && p.y >= Math.min(crop.y1, crop.y2) && p.y <= Math.max(crop.y1, crop.y2);
  function updateCropBar() { $('#cropbar').style.display = crop && !mode ? 'flex' : 'none'; }
  function cropDown(p, h) {
    if (h) mode = { kind: 'crop-resize', key: h.key };
    else if (inCrop(p)) mode = { kind: 'crop-move', p, o: { ...crop } };
    else { crop = { type: 'crop', x1: clamp(p.x, 0, W), y1: clamp(p.y, 0, H), x2: clamp(p.x, 0, W), y2: clamp(p.y, 0, H) }; mode = { kind: 'crop-new' }; }
    updateCropBar(); render();
  }
  function cropDrag(p) {
    const cx = clamp(p.x, 0, W), cy = clamp(p.y, 0, H);
    if (mode.kind === 'crop-new') { crop.x2 = cx; crop.y2 = cy; }
    else if (mode.kind === 'crop-resize') {
      const key = mode.key;
      if (key.includes('w')) crop.x1 = cx; if (key.includes('e')) crop.x2 = cx;
      if (key.includes('n')) crop.y1 = cy; if (key.includes('s')) crop.y2 = cy;
    } else {
      const o = mode.o, dx = clamp(p.x - mode.p.x, -Math.min(o.x1, o.x2), W - Math.max(o.x1, o.x2)), dy = clamp(p.y - mode.p.y, -Math.min(o.y1, o.y2), H - Math.max(o.y1, o.y2));
      crop.x1 = o.x1 + dx; crop.x2 = o.x2 + dx; crop.y1 = o.y1 + dy; crop.y2 = o.y2 + dy;
    }
  }
  function applyCrop() {
    if (!crop) return;
    const x = Math.round(Math.min(crop.x1, crop.x2)), y = Math.round(Math.min(crop.y1, crop.y2));
    const w = Math.round(Math.abs(crop.x2 - crop.x1)), h = Math.round(Math.abs(crop.y2 - crop.y1));
    if (w < 2 || h < 2) return;
    const bc = document.createElement('canvas'); bc.width = W; bc.height = H; bc.getContext('2d').drawImage(base, 0, 0);
    hist.push({ items: JSON.stringify(items), bc, W, H });
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; tmp.getContext('2d').drawImage(base, x, y, w, h, 0, 0, w, h);
    base.width = w; base.height = h; base.getContext('2d').drawImage(tmp, 0, 0);
    items.forEach(a => { a.x1 -= x; a.y1 -= y; if (a.x2 != null) { a.x2 -= x; a.y2 -= y; } });
    W = w; H = h; crop = null; sel = null; mode = null; updateCropBar(); setTool('select'); layout();
    toast('Cropped to ' + w + ' × ' + h);
  }
  $('#cropok').onclick = applyCrop;
  $('#cropno').onclick = () => { crop = null; updateCropBar(); render(); };
  function renumber() { let n = 0; items.forEach(a => { if (a.type === 'num') a.n = ++n; }); }
  function removeSel() { if (!sel) return; snap(); items = items.filter(a => a !== sel); sel = null; renumber(); render(); }

  // ---------- Pointer ----------
  cv.addEventListener('pointerdown', e => {
    if (!hasImg) return; cv.setPointerCapture(e.pointerId);
    const p = pos(e), h = hitHandle(p);
    if (tool === 'crop') { cropDown(p, h); return; }
    if (h) { snap(); mode = { kind: 'handle', key: h.key, o: { ...sel } }; return; }
    // clicking an existing shape always selects it (hold Alt to draw on top of one instead)
    const hit = e.altKey ? null : hitItem(p, tool === 'select');
    if (hit) { select(hit); snap(); mode = { kind: 'move', p, o: { ...hit } }; render(); return; }
    select(null);
    if (tool === 'select') { render(); return; }
    if (tool === 'num') {
      snap(); const it = { type: 'num', x1: p.x, y1: p.y, n: items.filter(a => a.type === 'num').length + 1, r: lastNumR, color: colors.num };
      items.push(it); select(it); render(); return;
    }
    draft = { type: tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color: colors[tool] || '#000000', lw: (lineDef[tool] || 100) / 100 * 3 * ub(), hd: head.value / 100 * 15 * ub() };
  });
  cv.addEventListener('pointermove', e => {
    const p = pos(e);
    if (mode && mode.kind.startsWith('crop')) { cropDrag(p); render(); return; }
    if (draft) {
      draft.x2 = p.x; draft.y2 = p.y;
      if (e.shiftKey && draft.type === 'arrow') {
        const dx = p.x - draft.x1, dy = p.y - draft.y1, len = Math.hypot(dx, dy), a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4;
        draft.x2 = draft.x1 + Math.cos(a) * len; draft.y2 = draft.y1 + Math.sin(a) * len;
      }
      render();
    } else if (mode) {
      const o = mode.o;
      if (mode.kind === 'move') {
        const dx = p.x - mode.p.x, dy = p.y - mode.p.y;
        sel.x1 = o.x1 + dx; sel.y1 = o.y1 + dy;
        if (o.type !== 'num') { sel.x2 = o.x2 + dx; sel.y2 = o.y2 + dy; }
      } else {
        const key = mode.key;
        if (key === 'start') { sel.x1 = p.x; sel.y1 = p.y; }
        else if (key === 'end') { sel.x2 = p.x; sel.y2 = p.y; }
        else if (key === 'r') { sel.r = Math.max(6 * ub(), Math.hypot(p.x - sel.x1, p.y - sel.y1)); lastNumR = sel.r; numsz.value = sel.r / NUM0() * 100; showPct(); }  // next number reuses this size
        else {
          if (key.includes('w')) sel.x1 = p.x; if (key.includes('e')) sel.x2 = p.x;
          if (key.includes('n')) sel.y1 = p.y; if (key.includes('s')) sel.y2 = p.y;
        }
      }
      render();
    } else {
      const h = hitHandle(p);
      cv.style.cursor = h ? CUR[h.key] : tool === 'crop' ? (inCrop(p) ? 'move' : 'crosshair') : !e.altKey && hitItem(p, tool === 'select') ? 'move' : tool === 'select' ? 'default' : 'crosshair';
    }
  });
  cv.addEventListener('pointerup', () => {
    if (mode && mode.kind.startsWith('crop')) {
      if (mode.kind === 'crop-new' && Math.max(Math.abs(crop.x2 - crop.x1), Math.abs(crop.y2 - crop.y1)) < 6 * px()) crop = null;
      mode = null; updateCropBar(); render(); return;
    }
    if (draft) {
      if (Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) > 4) { snap(); items.push(draft); select(draft); }
      draft = null; render();
    }
    if (mode) { if (hist.length && hist[hist.length - 1] === JSON.stringify(items)) hist.pop(); mode = null; }
  });

  // ---------- Output (exported at native resolution, 2x for small images) ----------
  const toBlob = () => new Promise(r => {
    const s = W < 1600 ? 2 : 1, ex = document.createElement('canvas');
    ex.width = W * s; ex.height = H * s;
    const d = draft; draft = null; render(ex.getContext('2d'), s, false); draft = d;
    ex.toBlob(r, 'image/png');
  });
  async function copy() {
    if (!hasImg) return toast('Paste an image first');
    const blob = await toBlob();
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); toast('Copied to clipboard ✓'); }
    catch (err) { toast('Copy blocked by browser — use Save PNG'); }
  }
  async function save() {
    if (!hasImg) return;
    const blob = await toBlob(), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'annotated-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.png'; a.click();
  }
  $('#undo').onclick = undo; $('#del').onclick = removeSel;
  $('#clear').onclick = () => { if (!items.length) return; snap(); items = []; sel = null; render(); };
  $('#copy').onclick = copy; $('#save').onclick = save;

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const mod = e.metaKey || e.ctrlKey, key = e.key.toLowerCase(), T = { v: 'select', a: 'arrow', r: 'rect', b: 'blur', g: 'gblur', n: 'num', c: 'crop' };
    if (key === 'enter' && crop) { e.preventDefault(); applyCrop(); }
    else if (mod && key === 'z') { e.preventDefault(); undo(); }
    else if (mod && key === 'c') { e.preventDefault(); copy(); }
    else if (mod && key === 's') { e.preventDefault(); save(); }
    else if (key === 'delete' || key === 'backspace') { e.preventDefault(); removeSel(); }
    else if (key === 'escape') { closePop(); if (crop) { crop = null; updateCropBar(); } sel = null; render(); }
    else if (!mod && T[key]) setTool(T[key]);
  });
  setTool('arrow');
})();
