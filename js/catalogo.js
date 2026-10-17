document.addEventListener('DOMContentLoaded', () => {
  const estado = { q: '', modalidad: 'todas', marca: 'todas', carroceria: 'todas', transmision: 'todas', precioMax: 0, orden: 'destacados', soloFav: false };
  let seleccion = [];
  let autoAbierto = null;

  const grid = document.getElementById('autos-grid');
  const contador = document.getElementById('contador');
  const panelFiltros = document.getElementById('filtros');
  const botonFiltros = document.getElementById('filtros-toggle');
  const bandeja = document.getElementById('bandeja');
  const modalEl = document.getElementById('modal-ficha');
  const modal = M.Modal.init(modalEl, { startingTop: '3%', endingTop: '4%', onCloseEnd: () => (autoAbierto = null) });

  function contar(lista, clave) {
    const r = {};
    AUTOS.forEach((a) => {
      const k = clave(a);
      r[k] = (r[k] || 0) + 1;
    });
    return Object.keys(r).sort().map((k) => [k, r[k]]);
  }

  function armarOpciones(contenedorId, filtro, items, total) {
    const cont = document.getElementById(contenedorId);
    const todas = [['todas', total, 'Todas']].concat(items.map(([k, n]) => [k, n, k]));
    cont.innerHTML = todas.map(([k, n, etiqueta]) => `<button type="button" class="opcion${estado[filtro] === k ? ' activo' : ''}" data-filtro="${filtro}" data-valor="${k}" aria-pressed="${estado[filtro] === k}"><span>${etiqueta}</span><span class="cuenta">${n}</span></button>`).join('');
  }

  function armarFiltros() {
    document.getElementById('grupo-modalidad').innerHTML = [
      ['todas', 'Todas', AUTOS.length],
      ['contado', 'Precio de contado', AUTOS.filter((a) => !a.financiado).length],
      ['financiado', 'Con financiación', AUTOS.filter((a) => a.financiado).length]
    ].map(([k, e, n]) => `<button type="button" class="opcion${estado.modalidad === k ? ' activo' : ''}" data-filtro="modalidad" data-valor="${k}" aria-pressed="${estado.modalidad === k}"><span>${e}</span><span class="cuenta">${n}</span></button>`).join('');
    armarOpciones('grupo-marca', 'marca', contar(AUTOS, (a) => a.marca), AUTOS.length);
    armarOpciones('grupo-carroceria', 'carroceria', contar(AUTOS, (a) => a.carroceria), AUTOS.length);
  }

  function filtrar() {
    const q = estado.q.trim().toLowerCase();
    const lista = AUTOS.filter((a) => {
      if (estado.soloFav && !App.favoritos.tiene(a.id)) return false;
      if (estado.modalidad === 'contado' && a.financiado) return false;
      if (estado.modalidad === 'financiado' && !a.financiado) return false;
      if (estado.marca !== 'todas' && a.marca !== estado.marca) return false;
      if (estado.carroceria !== 'todas' && a.carroceria !== estado.carroceria) return false;
      if (estado.transmision !== 'todas' && a.transmision !== estado.transmision) return false;
      if (estado.precioMax && a.precio > estado.precioMax) return false;
      if (q && !(a.marca + ' ' + a.modelo + ' ' + a.version + ' ' + a.anio + ' ' + a.carroceria).toLowerCase().includes(q)) return false;
      return true;
    });
    const orden = {
      destacados: (a, b) => Number(b.destacado) - Number(a.destacado) || a.id - b.id,
      'precio-asc': (a, b) => a.precio - b.precio,
      'precio-desc': (a, b) => b.precio - a.precio,
      'km-asc': (a, b) => a.km - b.km,
      'anio-desc': (a, b) => b.anio - a.anio
    };
    return lista.sort(orden[estado.orden]);
  }

  function tarjeta(a) {
    const fav = App.favoritos.tiene(a.id);
    const enSel = seleccion.includes(a.id);
    const etiquetas = a.financiado ? '<span class="etiqueta">Financiación</span>' : '<span class="etiqueta etiqueta-rojo">Contado</span>';
    const extra = a.financiacion50 ? '<span class="etiqueta">Hasta 50%</span>' : '';
    const precio = a.financiado
      ? `<span class="precio-etiqueta">Precio con financiación</span><span class="precio-valor">${App.fmtPrecio(a.precio)}</span><span class="precio-anterior">${App.fmtPrecio(a.precioAnterior)}</span>`
      : `<span class="precio-etiqueta">Precio de contado</span><span class="precio-valor">${App.fmtPrecio(a.precio)}</span>`;
    return `<article class="auto-card" data-id="${a.id}">
      <div class="auto-media">
        <div class="etiquetas">${etiquetas}${extra}</div>
        <button type="button" class="guardar${fav ? ' activo' : ''}" data-accion="guardar" aria-pressed="${fav}" aria-label="${fav ? 'Quitar de guardados' : 'Guardar'} ${App.nombreCompleto(a)}"><i class="material-icons">${fav ? 'favorite' : 'favorite_border'}</i></button>
        <img src="${App.foto(a)}" alt="${App.nombreCompleto(a)}" width="316" height="154" loading="lazy" data-auto="${a.id}">
      </div>
      <div class="auto-cuerpo">
        <span class="auto-marca">${a.marca}</span>
        <h3 class="auto-titulo"><button type="button" class="titulo-boton" data-accion="detalle">${a.modelo}</button></h3>
        <p class="auto-version">${a.version}</p>
        <p class="auto-meta"><span>${a.anio}</span><span>${App.fmtKm(a.km)}</span><span>${a.transmision}</span></p>
        <div class="auto-precio">${precio}</div>
      </div>
      <div class="auto-acciones">
        <button type="button" class="boton boton-chico" data-accion="detalle"><i class="material-icons">visibility</i>Ver ficha</button>
        <button type="button" class="boton boton-chico boton-secundario" data-accion="comparar" aria-pressed="${enSel}"><i class="material-icons">${enSel ? 'check' : 'compare_arrows'}</i>${enSel ? 'Elegido' : 'Comparar'}</button>
      </div>
    </article>`;
  }

  function render() {
    const lista = filtrar();
    contador.textContent = `${lista.length} de ${AUTOS.length} autos`;
    if (!lista.length) {
      grid.innerHTML = `<div class="vacio"><i class="material-icons">search_off</i><h3>No encontramos autos con esos filtros</h3><p>${estado.soloFav ? 'Todavía no guardaste ningún auto.' : 'Probá quitando algún filtro o buscando otro modelo.'}</p><button type="button" class="boton boton-chico" data-accion="reiniciar"><i class="material-icons">refresh</i>Quitar filtros</button></div>`;
      return;
    }
    grid.innerHTML = lista.map(tarjeta).join('');
  }

  function actualizarBandeja() {
    document.body.classList.toggle('con-bandeja', seleccion.length > 0);
    bandeja.classList.toggle('visible', seleccion.length > 0);
    const slots = [0, 1].map((i) => {
      const a = App.porId(seleccion[i]);
      if (!a) return '<div class="bandeja-item vacio-slot"><span>Elegí otro auto</span></div>';
      return `<div class="bandeja-item"><img src="${App.foto(a)}" alt="" data-auto="${a.id}"><span>${App.nombreCompleto(a)}</span><button type="button" data-quitar="${a.id}" aria-label="Quitar ${App.nombreCompleto(a)}"><i class="material-icons">close</i></button></div>`;
    });
    document.getElementById('bandeja-items').innerHTML = slots.join('');
    const ir = document.getElementById('bandeja-ir');
    ir.disabled = seleccion.length < 2;
  }

  function alternarSeleccion(id) {
    if (seleccion.includes(id)) {
      seleccion = seleccion.filter((x) => x !== id);
    } else {
      if (seleccion.length === 2) {
        seleccion.shift();
        App.aviso('Se pueden comparar 2 autos a la vez. Quitamos el primero.');
      }
      seleccion.push(id);
    }
    actualizarBandeja();
    render();
    if (autoAbierto) botonModalComparar();
  }

  function alternarFavorito(id) {
    const ahora = App.favoritos.alternar(id);
    document.getElementById('conteo-fav').textContent = App.favoritos.lista().length;
    App.aviso(ahora ? 'Auto guardado en favoritos.' : 'Auto quitado de favoritos.');
    render();
    if (autoAbierto) botonModalFav();
  }

  function botonModalFav() {
    const fav = App.favoritos.tiene(autoAbierto.id);
    document.getElementById('modal-fav').innerHTML = `<i class="material-icons">${fav ? 'favorite' : 'favorite_border'}</i>${fav ? 'Guardado' : 'Guardar'}`;
  }

  function botonModalComparar() {
    const en = seleccion.includes(autoAbierto.id);
    document.getElementById('modal-comparar').innerHTML = `<i class="material-icons">${en ? 'check' : 'compare_arrows'}</i>${en ? 'En la comparación' : 'Comparar'}`;
  }

  function abrirFicha(id) {
    const a = App.porId(id);
    if (!a) return;
    autoAbierto = a;
    document.getElementById('modal-titulo').textContent = App.nombreCompleto(a);
    document.getElementById('modal-version').textContent = a.version;
    const img = document.getElementById('modal-imagen');
    img.dataset.fallback = '';
    img.dataset.auto = a.id;
    img.src = App.foto(a);
    img.alt = App.nombreCompleto(a);
    document.getElementById('modal-resumen').textContent = a.descripcion;
    document.getElementById('modal-etiqueta').textContent = a.financiado ? 'Precio con financiación' : 'Precio de contado';
    document.getElementById('modal-precio').textContent = App.fmtPrecio(a.precio);
    const anterior = document.getElementById('modal-anterior');
    anterior.textContent = a.precioAnterior ? App.fmtPrecio(a.precioAnterior) : '';
    anterior.hidden = !a.precioAnterior;
    document.getElementById('modal-consultar').href = 'contacto.html?auto=' + a.id;

    const filas = [
      ['Año', a.anio], ['Kilometraje', App.fmtKm(a.km)], ['Carrocería', a.carroceria], ['Motor', a.motor],
      ['Potencia', a.potencia + ' CV'], ['Transmisión', a.caja], ['Tracción', 'Delantera'], ['Combustible', 'Nafta']
    ];
    document.getElementById('modal-specs').innerHTML = filas.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('');
    document.getElementById('modal-destacados').innerHTML = a.destacados.map((d) => `<li><i class="material-icons">check</i>${d}</li>`).join('');
    document.getElementById('modal-financiacion').innerHTML = a.financiado
      ? `Cuota de referencia: <strong>${App.fmtPrecio(App.cuota(a))}</strong> por mes en 36 pagos iguales, sin interés. Es un valor ilustrativo: las condiciones reales dependen de la entidad financiera y del perfil del cliente.${a.financiacion50 ? ' Esta unidad admite financiar hasta el 50% del valor.' : ''}`
      : 'Esta unidad se publica a precio de contado. Consultanos por alternativas de financiación o por la entrega de tu usado como parte de pago.';
    botonModalFav();
    botonModalComparar();
    const col = M.Collapsible.getInstance(document.getElementById('modal-colapsable'));
    col.open(0);
    modal.open();
  }

  function reiniciar() {
    Object.assign(estado, { q: '', modalidad: 'todas', marca: 'todas', carroceria: 'todas', transmision: 'todas', precioMax: 0, orden: 'destacados', soloFav: false });
    document.getElementById('buscador').value = '';
    document.getElementById('f-transmision').value = 'todas';
    document.getElementById('f-precio').value = '0';
    document.getElementById('orden').value = 'destacados';
    document.getElementById('solo-fav').setAttribute('aria-pressed', 'false');
    document.getElementById('solo-fav').classList.remove('activo');
    armarFiltros();
    render();
  }

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const id = Number(b.closest('.auto-card') && b.closest('.auto-card').dataset.id);
    const accion = b.dataset.accion;
    if (accion === 'detalle') abrirFicha(id);
    if (accion === 'comparar') alternarSeleccion(id);
    if (accion === 'guardar') alternarFavorito(id);
    if (accion === 'reiniciar') reiniciar();
  });

  panelFiltros.addEventListener('click', (e) => {
    const b = e.target.closest('.opcion');
    if (b) {
      estado[b.dataset.filtro] = b.dataset.valor;
      armarFiltros();
      render();
    }
    if (e.target.closest('#reiniciar-filtros')) reiniciar();
  });

  document.getElementById('buscador').addEventListener('input', (e) => { estado.q = e.target.value; render(); });
  document.getElementById('orden').addEventListener('change', (e) => { estado.orden = e.target.value; render(); });
  document.getElementById('f-transmision').addEventListener('change', (e) => { estado.transmision = e.target.value; render(); });
  document.getElementById('f-precio').addEventListener('change', (e) => { estado.precioMax = Number(e.target.value); render(); });

  const soloFav = document.getElementById('solo-fav');
  soloFav.addEventListener('click', () => {
    estado.soloFav = !estado.soloFav;
    soloFav.setAttribute('aria-pressed', String(estado.soloFav));
    soloFav.classList.toggle('activo', estado.soloFav);
    render();
  });

  botonFiltros.addEventListener('click', () => {
    const abierto = panelFiltros.classList.toggle('abierto');
    botonFiltros.setAttribute('aria-expanded', String(abierto));
  });

  bandeja.addEventListener('click', (e) => {
    const q = e.target.closest('[data-quitar]');
    if (q) alternarSeleccion(Number(q.dataset.quitar));
    if (e.target.closest('#bandeja-limpiar')) { seleccion = []; actualizarBandeja(); render(); }
  });
  document.getElementById('bandeja-ir').addEventListener('click', () => {
    if (seleccion.length === 2) location.href = `comparador.html?a=${seleccion[0]}&b=${seleccion[1]}`;
  });

  document.getElementById('modal-fav').addEventListener('click', () => autoAbierto && alternarFavorito(autoAbierto.id));
  document.getElementById('modal-comparar').addEventListener('click', () => autoAbierto && alternarSeleccion(autoAbierto.id));

  document.getElementById('conteo-fav').textContent = App.favoritos.lista().length;
  armarFiltros();
  actualizarBandeja();
  render();

  const param = new URLSearchParams(location.search).get('auto');
  if (param && App.porId(param)) setTimeout(() => abrirFicha(Number(param)), 150);
});
