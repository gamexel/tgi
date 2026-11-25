(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const config = window.TGI_OFFLINE;
  const standalone = matchMedia('(display-mode: standalone)');
  const isInstalled = () => standalone.matches || navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const supported = location.protocol !== 'file:' && window.isSecureContext && 'serviceWorker' in navigator && 'caches' in window;
  let prompt = null, registration = null, ready = false, downloading = false, controller = null, cachedCount = 0;
  let appReturnFocus = null;
  const base = new URL('./', location.href);
  const assets = config.assets.map(path => new URL(path, base).href);
  const assetSet = new Set(assets);
  const mediaCache = 'tgi-media-' + config.mediaVersion;
  const format = n => n.toLocaleString('es-AR');

  function renderInstall() {
    const installed = isInstalled();
    $('.app-button').textContent = installed ? 'Mi app' : 'Instalar app';
    $('#install-app').hidden = !prompt || installed;
    $('#install-description').textContent = installed ? 'TGI ya está abierta como app en este dispositivo.' : 'Agregá TGI a tu pantalla de inicio para abrirla como una app.';
    $('#install-instructions').hidden = installed || !!prompt;
    $('#install-instructions').innerHTML = location.protocol === 'file:'
      ? '<p>Esta es la versión de carpeta. Para instalar TGI, abrí su dirección web desde el navegador del celular.</p>'
      : isIOS
        ? '<ol><li>Abrí esta página en <b>Safari</b>.</li><li>Tocá <b>Compartir</b> y luego <b>Agregar a pantalla de inicio</b> (puede estar dentro de «Más»).</li><li>Si aparece, activá <b>Abrir como app web</b> y tocá <b>Agregar</b>.</li></ol>'
        : '<p>En el menú de tu navegador, elegí <b>Instalar aplicación</b> o <b>Agregar a pantalla principal</b>. En una computadora, buscá el icono de instalación en la barra de direcciones. Si no aparece, probá abrir TGI en Chrome, Edge o Safari.</p>';
  }

  function status() {
    const local = location.protocol === 'file:';
    $('#connection-status').textContent = local ? 'Versión de carpeta' : navigator.onLine ? ready ? 'Apuntes disponibles offline' : 'Con conexión' : 'Sin conexión';
    $('#connection-status').dataset.state = navigator.onLine ? 'online' : 'offline';
    $('#offline-summary').textContent = local
      ? 'La carpeta completa ya incluye los apuntes y las imágenes para usar sin conexión.'
      : ready ? 'Resúmenes, preguntas y buscador listos para usar sin conexión.' : supported ? 'Preparando resúmenes, preguntas y buscador para usar sin conexión…' : 'Este navegador no permite descargas sin conexión. Podés seguir consultando TGI online.';
    $('#download-library').disabled = !ready || downloading || cachedCount === assets.length || !navigator.onLine;
    $('#download-library').textContent = cachedCount === assets.length ? 'Biblioteca completa descargada' : cachedCount ? 'Continuar descarga' : 'Descargar biblioteca completa';
    $('#download-description').hidden = local || !supported;
    $('.download-actions').hidden = local || !supported;
  }

  async function countDownloaded() {
    const cache = await caches.open(mediaCache);
    const keys = await cache.keys();
    const urls = new Set(keys.map(key => key.url).filter(url => assetSet.has(url)));
    cachedCount = urls.size;
    $('#download-progress').hidden = !cachedCount && !downloading;
    $('#download-progress').max = assets.length;
    $('#download-progress').value = cachedCount;
    $('#download-status').textContent = cachedCount === assets.length
      ? 'Listo: todas las imágenes y los textos están guardados en este dispositivo.'
      : format(cachedCount) + ' de ' + format(assets.length) + ' archivos guardados · ' + Math.round(config.bytes / 1e6) + ' MB en total.';
    status();
    return urls;
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('[data-app-settings]')) return;
    appReturnFocus = document.activeElement;
    renderInstall();
    status();
    $('#app-dialog').showModal();
    if (ready && !downloading) countDownloaded().catch(() => { $('#download-status').textContent = 'No se pudo consultar el almacenamiento del navegador.'; });
  });
  $('#close-app').addEventListener('click', () => $('#app-dialog').close());
  $('#app-dialog').addEventListener('close', () => { if (appReturnFocus?.isConnected) appReturnFocus.focus(); });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); prompt = event; renderInstall(); });
  window.addEventListener('appinstalled', () => { prompt = null; renderInstall(); $('#install-description').textContent = 'TGI instalada. Abrila desde tu pantalla de inicio.'; $('#install-instructions').hidden = true; });
  standalone.addEventListener('change', renderInstall);
  $('#install-app').addEventListener('click', async () => {
    if (!prompt) return;
    const pending = prompt;
    prompt = null;
    try { await pending.prompt(); await pending.userChoice; } catch {}
    renderInstall();
  });

  $('#download-library').addEventListener('click', async () => {
    if (!ready || downloading || !navigator.onLine) return;
    downloading = true;
    controller = new AbortController();
    const signal = controller.signal;
    $('#cancel-download').hidden = false;
    $('#download-progress').hidden = false;
    status();
    let failure = null;
    try {
      if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
      const saved = await countDownloaded();
      const queue = assets.filter(url => !saved.has(url));
      const cache = await caches.open(mediaCache);
      let index = 0, lastUpdate = 0;
      async function worker() {
        while (index < queue.length && !signal.aborted) {
          const url = queue[index++];
          try {
            // Bypass the service worker to avoid saving a fallback response.
            const response = await fetch(url, { cache: 'reload', headers: { 'X-TGI-Download': '1' }, signal });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            await cache.put(url, response);
            cachedCount++;
            $('#download-progress').value = cachedCount;
            if (Date.now() - lastUpdate > 500) {
              lastUpdate = Date.now();
              $('#download-status').textContent = 'Descargando: ' + format(cachedCount) + ' de ' + format(assets.length) + ' archivos (' + Math.round(cachedCount / assets.length * 100) + '%).';
            }
          } catch (error) {
            if (!signal.aborted) { failure = error; controller.abort(); }
          }
        }
      }
      await Promise.all(Array.from({ length: 4 }, worker));
    } catch (error) { failure = error; }
    finally {
      downloading = false;
      $('#cancel-download').hidden = true;
      try { await countDownloaded(); } catch { failure ||= new Error('storage'); }
      if (failure) $('#download-status').textContent = failure.name === 'QuotaExceededError'
        ? 'Falta espacio en el dispositivo. Liberá espacio y continuá; los archivos descargados se conservan.'
        : 'La descarga se interrumpió. Revisá la conexión y continuá; los archivos ya descargados se conservan.';
      else if (signal.aborted) $('#download-status').textContent = 'Descarga pausada · ' + format(cachedCount) + ' de ' + format(assets.length) + ' archivos. Podés continuar cuando quieras.';
      status();
    }
  });
  $('#cancel-download').addEventListener('click', () => controller?.abort());
  window.addEventListener('online', status);
  window.addEventListener('offline', status);
  document.addEventListener('error', event => {
    if (event.target.tagName !== 'IMG' || !event.target.closest('.source-image')) return;
    const container = event.target.closest('.source-image');
    if (container.querySelector('.image-unavailable')) return;
    const note = document.createElement('p');
    note.className = 'image-unavailable';
    note.textContent = 'No se pudo cargar esta imagen. Si estás sin conexión, conectate y descargá la biblioteca desde «Mi app» o «Instalar app».';
    container.append(note);
  }, true);

  $('#update-app').addEventListener('click', () => {
    if (downloading) { $('#app-dialog').showModal(); $('#download-status').textContent = 'Pausá o terminá la descarga antes de actualizar TGI.'; return; }
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  });
  renderInstall();
  status();
  if (!supported) return;
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) location.reload();
    hadController = true;
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(async reg => {
    registration = reg;
    const showUpdate = () => { $('#update-banner').hidden = !navigator.serviceWorker.controller || !reg.waiting; };
    showUpdate();
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', showUpdate);
    });
    await navigator.serviceWorker.ready;
    ready = true;
    status();
    await countDownloaded();
    document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.onLine && !downloading) reg.update().catch(() => {}); });
  }).catch(() => {
    ready = false;
    status();
    $('#offline-summary').textContent = 'No se pudo preparar el modo sin conexión. Volvé a abrir TGI con internet para reintentar.';
  });
})();
