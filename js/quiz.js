document.addEventListener('DOMContentLoaded', () => {
  const PREGUNTAS = [
    { titulo: '¿Para qué vas a usar principalmente el auto?', clave: 'uso', opciones: [
      ['ciudad', 'Ciudad y trayectos diarios', 'Estacionar fácil y moverte con comodidad.'],
      ['ruta', 'Ruta y viajes largos', 'Estabilidad, potencia y confort en trayectos extensos.'],
      ['familia', 'Familia', 'Espacio interior y baúl amplio.'],
      ['mixto', 'Un poco de todo', 'Un auto versátil para distintos usos.']
    ] },
    { titulo: '¿Cuál es tu presupuesto aproximado?', clave: 'presupuesto', opciones: [
      ['bajo', 'Hasta $ 21.000.000', 'Opciones accesibles y de menor costo.'],
      ['medio', 'Entre $ 21.000.000 y $ 32.000.000', 'Rango intermedio con buena variedad.'],
      ['alto', 'Más de $ 32.000.000', 'Unidades más nuevas y equipadas.'],
      ['libre', 'Todavía no lo definí', 'Mostrame las mejores opciones sin tope.']
    ] },
    { titulo: '¿Qué transmisión preferís?', clave: 'transmision', opciones: [
      ['Automática', 'Automática', 'Mayor comodidad, sobre todo en tránsito.'],
      ['Manual', 'Manual', 'Control directo y menor costo de mantenimiento.'],
      ['indistinto', 'Me es indistinto', 'No es un factor decisivo.']
    ] },
    { titulo: '¿Qué es lo más importante para vos?', clave: 'prioridad', opciones: [
      ['economia', 'Precio y economía', 'Menor inversión y motores de baja cilindrada.'],
      ['rendimiento', 'Potencia y rendimiento', 'Mayor respuesta del motor.'],
      ['confort', 'Equipamiento y confort', 'Más tecnología y asistencias a bordo.'],
      ['reciente', 'Modelo reciente y pocos kilómetros', 'Una unidad más nueva y con menos uso.']
    ] }
  ];
  const RANGOS = { bajo: [0, 21000000], medio: [21000000, 32000000], alto: [32000000, Infinity], libre: [0, Infinity] };
  const ETIQUETA_USO = { ciudad: 'uso urbano', ruta: 'viajes en ruta', familia: 'uso familiar', mixto: 'uso variado' };

  const respuestas = {};
  let paso = 0;
  const caja = document.getElementById('quiz');
  const precios = AUTOS.map((a) => a.precio);
  const minP = Math.min(...precios);
  const maxP = Math.max(...precios);

  function puntuar(a, r) {
    let p = 0;
    let max = 0;
    const razones = [];

    const pesoCarroceria = { ciudad: { Hatchback: 4, Sedán: 1, SUV: 2, Monovolumen: 1 }, ruta: { Sedán: 4, SUV: 3, Hatchback: 1, Monovolumen: 1 }, familia: { SUV: 4, Monovolumen: 4, Sedán: 3, Hatchback: 1 }, mixto: { SUV: 3, Hatchback: 2, Sedán: 2, Monovolumen: 2 } }[r.uso];
    max += 4;
    p += pesoCarroceria[a.carroceria] || 0;
    if ((pesoCarroceria[a.carroceria] || 0) >= 3) razones.push(`Su carrocería (${a.carroceria}) es adecuada para ${ETIQUETA_USO[r.uso]}.`);
    if (r.uso === 'ruta' && a.potencia >= 115) { p += 2; razones.push(`Tiene ${a.potencia} CV, buena respuesta para ruta.`); }
    max += r.uso === 'ruta' ? 2 : 0;

    max += 5;
    const [desde, hasta] = RANGOS[r.presupuesto];
    if (a.precio >= desde && a.precio <= hasta) { p += 5; if (r.presupuesto !== 'libre') razones.push('Su precio está dentro de tu presupuesto.'); }
    else if (a.precio > hasta * 0.9 && a.precio <= hasta * 1.1 || (a.precio < desde && a.precio >= desde * 0.9)) p += 2;

    if (r.transmision !== 'indistinto') {
      max += 3;
      if (a.transmision === r.transmision) { p += 3; razones.push(`Tiene transmisión ${a.transmision.toLowerCase()}.`); }
      else p -= 4;
    }

    max += 4;
    if (r.prioridad === 'economia') {
      p += (1 - (a.precio - minP) / (maxP - minP)) * 3 + (a.cilindrada <= 1.3 ? 1 : 0);
      if (a.precio < 21000000) razones.push('Es de las opciones más económicas del catálogo.');
    }
    if (r.prioridad === 'rendimiento') {
      p += ((a.potencia - 82) / (170 - 82)) * 4;
      if (a.potencia >= 120) razones.push(`Ofrece ${a.potencia} CV de potencia.`);
    }
    if (r.prioridad === 'confort') {
      p += Math.min(a.destacados.length, 3) + (a.anio >= 2021 ? 1 : 0);
      razones.push(`Incluye ${a.destacados[0].toLowerCase()}.`);
    }
    if (r.prioridad === 'reciente') {
      p += ((a.anio - 2010) / 15) * 2 + (1 - a.km / 131000) * 2;
      if (a.anio >= 2023) razones.push(`Es un modelo reciente (${a.anio}).`);
      if (a.km < 25000) razones.push(`Tiene solo ${App.fmtKm(a.km)}.`);
    }
    return { auto: a, puntos: p, afinidad: Math.max(0, Math.min(98, Math.round((p / max) * 100))), razones };
  }

  function pintarPregunta() {
    const q = PREGUNTAS[paso];
    const actual = respuestas[q.clave];
    caja.innerHTML = `
      <div class="quiz-progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${PREGUNTAS.length}" aria-valuenow="${paso + 1}"><span style="width:${((paso + 1) / PREGUNTAS.length) * 100}%"></span></div>
      <p class="quiz-paso">Pregunta ${paso + 1} de ${PREGUNTAS.length}</p>
      <h2 class="quiz-pregunta">${q.titulo}</h2>
      <div class="quiz-opciones" role="radiogroup" aria-label="${q.titulo}">
        ${q.opciones.map(([v, t, d]) => `<button type="button" class="quiz-opcion${actual === v ? ' elegida' : ''}" role="radio" aria-checked="${actual === v}" data-valor="${v}"><span class="quiz-radio"></span><span><strong>${t}</strong><small>${d}</small></span></button>`).join('')}
      </div>
      <div class="quiz-nav">
        <button type="button" class="boton boton-secundario" id="quiz-atras"${paso === 0 ? ' disabled' : ''}><i class="material-icons">arrow_back</i>Anterior</button>
        <button type="button" class="boton" id="quiz-siguiente"${actual ? '' : ' disabled'}>${paso === PREGUNTAS.length - 1 ? 'Ver resultado' : 'Siguiente'}<i class="material-icons">arrow_forward</i></button>
      </div>`;
    caja.querySelectorAll('.quiz-opcion').forEach((b) => b.addEventListener('click', () => { respuestas[q.clave] = b.dataset.valor; pintarPregunta(); caja.querySelector('#quiz-siguiente').focus(); }));
    document.getElementById('quiz-atras').addEventListener('click', () => { paso--; pintarPregunta(); });
    document.getElementById('quiz-siguiente').addEventListener('click', () => {
      if (paso === PREGUNTAS.length - 1) pintarResultado();
      else { paso++; pintarPregunta(); }
    });
  }

  function pintarResultado() {
    const ranking = AUTOS.map((a) => puntuar(a, respuestas)).sort((x, y) => y.puntos - x.puntos || x.auto.id - y.auto.id).slice(0, 3);
    const [mejor, ...otros] = ranking;
    const a = mejor.auto;
    caja.innerHTML = `
      <div class="quiz-progreso"><span style="width:100%"></span></div>
      <p class="quiz-paso">Resultado</p>
      <h2 class="quiz-pregunta">Tu mejor opción es el ${App.nombreCompleto(a)}</h2>
      <div class="resultado-principal">
        <img src="${App.foto(a)}" alt="${App.nombreCompleto(a)}" data-auto="${a.id}">
        <div class="resultado-cuerpo">
          <span class="afinidad">Afinidad ${mejor.afinidad}%</span>
          <h3>${App.nombre(a)} ${a.version}</h3>
          <p class="auto-meta"><span>${a.anio}</span><span>${App.fmtKm(a.km)}</span><span>${a.transmision}</span></p>
          <p class="precio-valor">${App.fmtPrecio(a.precio)}</p>
          <ul class="razones">${mejor.razones.slice(0, 4).map((r) => `<li><i class="material-icons">check</i>${r}</li>`).join('')}</ul>
          <div class="comp-acciones">
            <a class="boton boton-chico" href="catalogo.html?auto=${a.id}"><i class="material-icons">visibility</i>Ver ficha</a>
            <a class="boton boton-chico boton-secundario" href="contacto.html?auto=${a.id}"><i class="material-icons">send</i>Consultar</a>
          </div>
        </div>
      </div>
      <h3 class="subtitulo-quiz">Otras opciones para comparar</h3>
      <div class="alternativas">
        ${otros.map((o) => `<div class="alternativa"><img src="${App.foto(o.auto)}" alt="${App.nombreCompleto(o.auto)}" data-auto="${o.auto.id}"><div><span class="afinidad">Afinidad ${o.afinidad}%</span><h4>${App.nombreCompleto(o.auto)}</h4><p>${App.fmtPrecio(o.auto.precio)}</p></div><a class="boton boton-chico boton-secundario" href="comparador.html?a=${a.id}&b=${o.auto.id}"><i class="material-icons">compare_arrows</i>Comparar</a></div>`).join('')}
      </div>
      <div class="quiz-nav"><button type="button" class="boton boton-secundario" id="quiz-reiniciar"><i class="material-icons">refresh</i>Repetir el quiz</button><a class="boton" href="catalogo.html">Ver todo el catálogo<i class="material-icons">arrow_forward</i></a></div>`;
    document.getElementById('quiz-reiniciar').addEventListener('click', () => {
      Object.keys(respuestas).forEach((k) => delete respuestas[k]);
      paso = 0;
      pintarPregunta();
    });
  }

  pintarPregunta();
});
