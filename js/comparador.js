document.addEventListener('DOMContentLoaded', () => {
  const selA = document.getElementById('comp-a');
  const selB = document.getElementById('comp-b');
  const zona = document.getElementById('comp-resultado');

  const CRITERIOS = [
    { clave: 'precio', etiqueta: 'Precio publicado', icono: 'payments', mejor: 'menor', valor: (a) => a.precio, formato: App.fmtPrecio },
    { clave: 'anio', etiqueta: 'Año', icono: 'event', mejor: 'mayor', valor: (a) => a.anio, formato: String },
    { clave: 'km', etiqueta: 'Kilometraje', icono: 'speed', mejor: 'menor', valor: (a) => a.km, formato: App.fmtKm },
    { clave: 'potencia', etiqueta: 'Potencia', icono: 'bolt', mejor: 'mayor', valor: (a) => a.potencia, formato: (v) => v + ' CV' },
    { clave: 'ppcv', etiqueta: 'Precio por CV', icono: 'balance', mejor: 'menor', valor: (a) => Math.round(a.precio / a.potencia), formato: App.fmtPrecio }
  ];
  const INFORMATIVOS = [
    ['Carrocería', (a) => a.carroceria, 'directions_car'],
    ['Motor', (a) => a.motor, 'settings'],
    ['Transmisión', (a) => a.caja, 'tune'],
    ['Forma de pago', (a) => (a.financiado ? 'Con financiación' : 'Contado'), 'account_balance_wallet'],
    ['Cuota de referencia', (a) => (a.financiado ? App.fmtPrecio(App.cuota(a)) + ' x 36' : 'No aplica'), 'event_repeat']
  ];
  const DUELOS = [[5, 17, 'Sedanes medianos'], [2, 15, 'SUV compactos'], [10, 7, 'Opciones accesibles']];

  App.llenarSelectAutos(selA, 'Elegí el primer auto');
  App.llenarSelectAutos(selB, 'Elegí el segundo auto');

  document.getElementById('duelos').innerHTML = DUELOS.map(([a, b, t], i) => `<button type="button" class="chip" data-duelo="${i}"><i class="material-icons">compare_arrows</i>${t}: ${App.nombre(App.porId(a))} vs ${App.nombre(App.porId(b))}</button>`).join('');

  function bloquearIguales() {
    [[selA, selB], [selB, selA]].forEach(([origen, destino]) => {
      Array.from(destino.options).forEach((o) => { o.disabled = !!o.value && o.value === origen.value; });
    });
  }

  function ganador(c, a, b) {
    const va = c.valor(a);
    const vb = c.valor(b);
    if (va === vb) return 0;
    return (c.mejor === 'menor' ? va < vb : va > vb) ? 1 : 2;
  }

  function tarjetaAuto(a) {
    return `<div class="comp-auto"><img src="${App.foto(a)}" alt="${App.nombreCompleto(a)}" width="316" height="154" data-auto="${a.id}"><div class="comp-auto-cuerpo"><span class="auto-marca">${a.marca}</span><h3>${a.modelo} ${a.anio}</h3><p>${a.version}</p></div></div>`;
  }

  function frases(a, b, g) {
    const lista = [];
    const nA = App.nombre(a) + ' ' + a.anio;
    const nB = App.nombre(b) + ' ' + b.anio;
    const quien = (n) => (n === 1 ? nA : nB);
    const dif = (clave) => Math.abs(CRITERIOS.find((c) => c.clave === clave).valor(a) - CRITERIOS.find((c) => c.clave === clave).valor(b));
    if (g.precio) lista.push(`${quien(g.precio)} es ${App.fmtPrecio(dif('precio'))} más económico.`);
    if (g.potencia) lista.push(`${quien(g.potencia)} tiene ${dif('potencia')} CV más de potencia.`);
    if (g.anio) lista.push(`${quien(g.anio)} es ${dif('anio')} ${dif('anio') === 1 ? 'año' : 'años'} más nuevo.`);
    if (g.km) lista.push(`${quien(g.km)} tiene ${App.fmtKm(dif('km'))} menos recorridos.`);
    if (a.transmision !== b.transmision) lista.push(`${a.transmision === 'Automática' ? nA : nB} tiene transmisión automática y ${a.transmision === 'Automática' ? nB : nA}, manual.`);
    return lista;
  }

  function mostrar() {
    const a = App.porId(selA.value);
    const b = App.porId(selB.value);
    bloquearIguales();
    const url = new URL(location.href);
    ['a', 'b'].forEach((k, i) => {
      const v = [selA, selB][i].value;
      v ? url.searchParams.set(k, v) : url.searchParams.delete(k);
    });
    history.replaceState(null, '', url);

    if (!a || !b) {
      zona.innerHTML = `<div class="vacio"><i class="material-icons">compare_arrows</i><h3>Elegí dos autos para empezar</h3><p>Seleccioná un vehículo en cada lista o probá con uno de los duelos sugeridos.</p></div>`;
      if (a || b) zona.insertAdjacentHTML('afterbegin', `<div class="comp-cabecera">${a ? tarjetaAuto(a) : '<div></div>'}<div class="comp-vs">VS</div>${b ? tarjetaAuto(b) : '<div></div>'}</div>`);
      return;
    }

    const g = {};
    let puntosA = 0;
    let puntosB = 0;
    CRITERIOS.forEach((c) => {
      g[c.clave] = ganador(c, a, b);
      if (g[c.clave] === 1) puntosA++;
      if (g[c.clave] === 2) puntosB++;
    });

    const filasCriterios = CRITERIOS.map((c) => `<div class="comp-fila">
      <div class="comp-celda izq${g[c.clave] === 1 ? ' mejor' : ''}">${g[c.clave] === 1 ? '<i class="material-icons">check_circle</i>' : ''}${c.formato(c.valor(a))}</div>
      <div class="comp-etiqueta"><i class="material-icons">${c.icono}</i>${c.etiqueta}</div>
      <div class="comp-celda der${g[c.clave] === 2 ? ' mejor' : ''}">${c.formato(c.valor(b))}${g[c.clave] === 2 ? '<i class="material-icons">check_circle</i>' : ''}</div>
    </div>`).join('');
    const filasInfo = INFORMATIVOS.map(([e, f, ic]) => `<div class="comp-fila">
      <div class="comp-celda izq">${f(a)}</div><div class="comp-etiqueta"><i class="material-icons">${ic}</i>${e}</div><div class="comp-celda der">${f(b)}</div>
    </div>`).join('');

    let titulo;
    if (puntosA === puntosB) titulo = `Resultado parejo: ${puntosA} criterios para cada uno`;
    else titulo = `Mayor ventaja: ${puntosA > puntosB ? App.nombreCompleto(a) : App.nombreCompleto(b)} (${Math.max(puntosA, puntosB)} de ${CRITERIOS.length} criterios)`;
    const notaPago = a.financiado !== b.financiado ? '<p class="comp-nota"><i class="material-icons">info</i>Uno de los precios es de contado y el otro con financiación, por lo que no son estrictamente comparables.</p>' : '';

    zona.innerHTML = `
      <div class="comp-cabecera">${tarjetaAuto(a)}<div class="comp-vs">VS</div>${tarjetaAuto(b)}</div>
      <div class="comp-tabla" role="table" aria-label="Comparación de ${App.nombreCompleto(a)} y ${App.nombreCompleto(b)}">${filasCriterios}${filasInfo}</div>
      <div class="comp-veredicto">
        <h3>${titulo}</h3>
        <ul>${frases(a, b, g).map((f) => `<li><i class="material-icons">arrow_right</i>${f}</li>`).join('')}</ul>
        ${notaPago}
        <div class="comp-acciones">
          <a class="boton boton-claro boton-chico" href="catalogo.html?auto=${a.id}"><i class="material-icons">visibility</i>Ver ficha de ${App.nombre(a)}</a>
          <a class="boton boton-claro boton-chico" href="catalogo.html?auto=${b.id}"><i class="material-icons">visibility</i>Ver ficha de ${App.nombre(b)}</a>
          <a class="boton boton-chico" href="contacto.html?auto=${puntosB > puntosA ? b.id : a.id}"><i class="material-icons">send</i>Consultar por uno</a>
        </div>
      </div>`;
  }

  selA.addEventListener('change', mostrar);
  selB.addEventListener('change', mostrar);
  document.getElementById('comp-invertir').addEventListener('click', () => {
    const v = selA.value;
    selA.value = selB.value;
    selB.value = v;
    mostrar();
  });
  document.getElementById('comp-limpiar').addEventListener('click', () => {
    selA.value = '';
    selB.value = '';
    mostrar();
  });
  document.getElementById('duelos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-duelo]');
    if (!b) return;
    const d = DUELOS[Number(b.dataset.duelo)];
    selA.value = d[0];
    selB.value = d[1];
    mostrar();
  });

  const p = new URLSearchParams(location.search);
  if (App.porId(p.get('a'))) selA.value = p.get('a');
  if (App.porId(p.get('b')) && p.get('b') !== p.get('a')) selB.value = p.get('b');
  mostrar();
});
