(() => {
  'use strict';
  const d = window.TARJETA || {};
  const $ = id => document.getElementById(id);
  const texto = (id, value) => { $(id).textContent = value || ''; };
  let avisoTimer;
  function avisar(mensaje) {
    const el = $('aviso'); el.textContent = mensaje; el.classList.add('visible');
    clearTimeout(avisoTimer); avisoTimer = setTimeout(() => el.classList.remove('visible'), 4600);
  }
  function urlSegura(value) {
    try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; }
    catch { return ''; }
  }
  function urlPublica(value) {
    const url = urlSegura((value || '').trim());
    if (!url) return '';
    const u = new URL(url);
    if (u.protocol !== 'https:' || /^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)) return '';
    return url;
  }
  const enlace = urlPublica(d.urlPublica);
  texto('nombre', d.nombre); texto('cargo', d.cargo);
  const marca = $('marca-texto');
  if (d.empresa && d.empresa !== 'CIR62') marca.textContent = d.empresa;
  const num = String(d.telefono || '').replace(/[^\d+]/g, '');
  $('telefono').href = `tel:${num.startsWith('+') ? num : '+34' + num}`;
  $('telefono').querySelector('strong').textContent = d.telefono || '';
  $('correo').href = `mailto:${d.correo || ''}`;
  $('correo').querySelector('strong').textContent = d.correo || '';
  const web = urlSegura(d.web);
  if (web) { $('web').href = web; $('web').querySelector('strong').textContent = new URL(web).host.replace(/^www\./,'www.'); }
  else $('web').hidden = true;
  if (!num) $('telefono').hidden = true;
  if (!d.correo) $('correo').hidden = true;

  function imagenOpcional(id, fallback) {
    const img = $(id);
    img.addEventListener('load', () => { img.hidden = false; if (fallback) $(fallback).hidden = true; });
    img.addEventListener('error', () => { img.hidden = true; if (fallback) $(fallback).hidden = false; });
    if (img.complete && img.naturalWidth) { img.hidden = false; if (fallback) $(fallback).hidden = true; }
  }
  imagenOpcional('foto', 'monograma'); imagenOpcional('logo', 'marca-texto');

  const descripcion = String(d.descripcion || '').trim();
  const links = Array.isArray(d.enlacesAdicionales) ? d.enlacesAdicionales.filter(x => x && x.nombre && urlSegura(x.url)) : [];
  if (descripcion || links.length) {
    $('extra').hidden = false; texto('descripcion', descripcion);
    for (const item of links) {
      const a = document.createElement('a'); a.href = urlSegura(item.url); a.textContent = item.nombre;
      a.target = '_blank'; a.rel = 'noopener noreferrer'; $('enlaces').append(a);
    }
  }

  function vcEscape(s) { return String(s || '').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;'); }
  $('guardar').addEventListener('click', () => {
    const partes = String(d.nombre || '').trim().split(/\s+/);
    const apellido = partes.length > 1 ? partes.slice(1).join(' ') : '';
    const nombre = partes[0] || '';
    const filas = ['BEGIN:VCARD','VERSION:3.0',`N:${vcEscape(apellido)};${vcEscape(nombre)};;;`,`FN:${vcEscape(d.nombre)}`,`ORG:${vcEscape(d.empresa)}`,`TITLE:${vcEscape(d.cargo)}`];
    if (num) filas.push(`TEL;TYPE=WORK,VOICE:${num.startsWith('+') ? num : '+34' + num}`);
    if (d.correo) filas.push(`EMAIL;TYPE=WORK:${vcEscape(d.correo)}`);
    if (web) filas.push(`URL:${vcEscape(web)}`);
    if (enlace) filas.push(`URL;TYPE=HOME:${vcEscape(enlace)}`);
    filas.push('END:VCARD');
    const blob = new Blob(['\ufeff' + filas.join('\r\n') + '\r\n'], {type:'text/vcard;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Pilar-Jimenez-Cebrian.vcf';
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    avisar('Contacto descargado. Ábrelo para añadirlo a tu agenda.');
  });
  $('compartir').addEventListener('click', async () => {
    if (!enlace) { avisar('Añade primero la URL pública en js/datos.js.'); return; }
    if (!navigator.share) { avisar('Este navegador no ofrece el menú de compartir. Puedes enviar la dirección desde la barra del navegador.'); return; }
    try { await navigator.share({title:`${d.nombre} · ${d.empresa}`, url:enlace}); }
    catch (e) { if (e.name !== 'AbortError') avisar('No se pudo abrir el menú de compartir. Comparte la dirección desde la barra del navegador.'); }
  });
  if (enlace) {
    try {
      const qr = new window.CIRQRCode(0, 1); // Corrección de errores M.
      qr.addData(enlace); qr.make();
      const n = qr.getModuleCount(), canvas = document.createElement('canvas'), escala = 6;
      canvas.width = canvas.height = n * escala; canvas.setAttribute('role','img'); canvas.setAttribute('aria-label',`Código QR que abre ${enlace}`);
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#002060';
      for (let y=0;y<n;y++) for (let x=0;x<n;x++) if (qr.isDark(y,x)) ctx.fillRect(x*escala,y*escala,escala,escala);
      $('qr').append(canvas); texto('qr-estado','Escanea el código para abrir esta tarjeta.');
    } catch { texto('qr-estado','No se pudo crear el QR. Comprueba la URL pública en js/datos.js.'); }
  }
})();
