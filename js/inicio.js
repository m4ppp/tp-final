document.addEventListener('DOMContentLoaded', () => {
  const IDS_CARRUSEL = [2, 5, 4, 1, 10, 15, 14, 13];

  const setTexto = (id, valor) => {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  };
  setTexto('dato-unidades', AUTOS.length);
  setTexto('dato-marcas', new Set(AUTOS.map((a) => a.marca)).size);
  setTexto('dato-financiados', AUTOS.filter((a) => a.financiado).length);

  const pista = document.getElementById('carrusel-destacados');
  if (pista) {
    pista.innerHTML = IDS_CARRUSEL.map((id) => {
      const a = App.porId(id);
      return `<div class="carousel-item slide-auto">
        <a href="../html/catalogo.html?auto=${a.id}" aria-label="Ver ficha de ${App.nombreCompleto(a)}">
          <img src="${App.foto(a)}" alt="${App.nombre(a)}" data-auto="${a.id}">
          <div class="slide-info">
            <span class="auto-marca">${a.marca}</span>
            <h3>${a.modelo} ${a.anio}</h3>
            <p class="slide-datos">${App.fmtKm(a.km)} · ${a.transmision}</p>
            <p class="precio-valor">${App.fmtPrecio(a.precio)}</p>
          </div>
        </a>
      </div>`;
    }).join('');

    let instancia = null;
    instancia = M.Carousel.init(pista, { dist: -70, padding: 0, duration: 250, numVisible: 5, onCycleTo: () => instancia && marcarPunto() });
    const puntos = document.getElementById('carrusel-puntos');
    puntos.innerHTML = IDS_CARRUSEL.map((_, i) => `<button type="button" class="punto" aria-label="Ir al auto ${i + 1}" data-i="${i}"></button>`).join('');

    function marcarPunto() {
      const n = IDS_CARRUSEL.length;
      const actual = ((instancia.center % n) + n) % n;
      puntos.querySelectorAll('.punto').forEach((p, i) => p.classList.toggle('activo', i === actual));
    }
    marcarPunto();

    puntos.addEventListener('click', (e) => {
      const b = e.target.closest('.punto');
      if (b) instancia.set(Number(b.dataset.i));
    });
    document.getElementById('carrusel-prev').addEventListener('click', () => instancia.prev());
    document.getElementById('carrusel-next').addEventListener('click', () => instancia.next());

    let pausado = false;
    ['mouseenter', 'focusin', 'touchstart'].forEach((ev) => pista.parentElement.addEventListener(ev, () => (pausado = true), { passive: true }));
    ['mouseleave', 'focusout'].forEach((ev) => pista.parentElement.addEventListener(ev, () => (pausado = false)));
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInterval(() => {
        if (!pausado && !document.hidden) instancia.next();
      }, 5000);
    }
  }

  const selA = document.getElementById('rapido-a');
  const selB = document.getElementById('rapido-b');
  const botonRapido = document.getElementById('rapido-boton');
  const mensajeRapido = document.getElementById('rapido-mensaje');
  if (selA && selB && botonRapido) {
    App.llenarSelectAutos(selA, 'Elegí el primer auto');
    App.llenarSelectAutos(selB, 'Elegí el segundo auto');

    const validar = () => {
      const a = selA.value;
      const b = selB.value;
      let texto = '';
      if (a && b && a === b) texto = 'Elegí dos autos distintos para poder compararlos.';
      mensajeRapido.textContent = texto;
      botonRapido.disabled = !(a && b && a !== b);
    };
    selA.addEventListener('change', validar);
    selB.addEventListener('change', validar);
    botonRapido.addEventListener('click', () => {
      if (!botonRapido.disabled) location.href = `../html/comparador.html?a=${selA.value}&b=${selB.value}`;
    });
    validar();
  }
});
