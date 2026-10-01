// Geliştirme aracı: uygulamayı telefon çerçevesi içinde gösterir (http://localhost:3000/live).
// Sayfa değil route handler — uygulamanın ortak düzeni (alt menü, asistan düğmesi) çerçevenin
// dışına basılmasın diye. Canlı sitede (production) 404 döner.

const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Moffi · Telefon önizleme</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #2a2622; font-family: system-ui, sans-serif; color: #e9e2d6; }
  .wrap { min-height: 100%; min-width: 380px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 16px; }
  .bar { display: flex; gap: 6px; width: 340px; max-width: 100%; }
  .bar input { flex: 1; min-width: 0; padding: 7px 10px; border-radius: 10px; border: 1px solid #4a433b; background: #1c1916; color: inherit; font-size: 13px; }
  .bar button { padding: 7px 10px; border-radius: 10px; border: 1px solid #4a433b; background: #1c1916; color: inherit; font-size: 13px; cursor: pointer; }
  .bar button:hover { border-color: #EE5B3D; }
  .phone { position: relative; width: 424px; height: 896px; background: linear-gradient(145deg,#3a3a3c,#1c1c1e 40%,#2c2c2e); border-radius: 66px; padding: 11px; box-shadow: 0 0 0 2px #48484a, 0 30px 80px rgba(0,0,0,.55); flex-shrink: 0; }
  .phone::before, .phone::after { content: ""; position: absolute; width: 4px; background: #3a3a3c; border-radius: 2px; }
  .phone::before { left: -6px; top: 190px; height: 100px; box-shadow: 0 -70px 0 -0px #3a3a3c; }
  .phone::after { right: -6px; top: 230px; height: 110px; }
  .screen { width: 100%; height: 100%; border-radius: 55px; overflow: hidden; background: #000; position: relative; }
  .island { position: absolute; top: 11px; left: 50%; transform: translateX(-50%); width: 126px; height: 37px; background: #000; border-radius: 20px; z-index: 50; pointer-events: none; }
  .homebar { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 140px; height: 5px; background: rgba(0,0,0,.55); border-radius: 3px; z-index: 50; pointer-events: none; }
  /* Görüntü %92; içerideki sayfa yine 402 × 874 ölçüsünde yerleşir. */
  .holder { width: calc(424px * 0.92); height: calc(896px * 0.92); flex-shrink: 0; }
  .holder .phone { transform: scale(0.92); transform-origin: top left; }
  .model { font-size: 12px; color: #8e8a84; }
  iframe { width: 100%; height: 100%; border: 0; display: block; }
</style>
</head>
<body>
<div class="wrap">
  <form class="bar" id="nav">
    <button type="button" id="back" title="Geri">‹</button>
    <input id="path" value="/home" aria-label="Sayfa adresi">
    <button type="submit">Git</button>
    <button type="button" id="reload" title="Yenile">↻</button>
  </form>
  <div class="holder"><div class="phone"><div class="screen"><div class="island"></div><div class="homebar"></div>
    <iframe id="app" src="/home"></iframe>
  </div></div></div>
  <div class="model">iPhone 17 · 402 × 874</div>
</div>
<script>
  const app = document.getElementById('app');
  const input = document.getElementById('path');
  const start = new URLSearchParams(location.search).get('p');
  if (start) app.src = start;
  app.addEventListener('load', () => {
    try { const l = app.contentWindow.location; input.value = l.pathname + l.search; } catch (e) {}
  });
  document.getElementById('nav').addEventListener('submit', (e) => {
    e.preventDefault();
    let p = input.value.trim() || '/home';
    if (!p.startsWith('/')) p = '/' + p;
    app.src = p;
  });
  document.getElementById('reload').onclick = () => { try { app.contentWindow.location.reload(); } catch (e) { app.src = app.src; } };
  document.getElementById('back').onclick = () => { try { app.contentWindow.history.back(); } catch (e) {} };
</script>
</body>
</html>`;

export function GET() {
    if (process.env.NODE_ENV !== 'development') {
        return new Response('Not found', { status: 404 });
    }
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
