document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-contacto');
  if (!form) return;

  const campos = {
    nombre: document.getElementById('c-nombre'),
    telefono: document.getElementById('c-telefono'),
    email: document.getElementById('c-email'),
    comentarios: document.getElementById('c-comentarios')
  };
  const selectAuto = document.getElementById('c-auto');
  const contador = document.getElementById('c-contador');
  const exito = document.getElementById('contacto-exito');
  const botonEnviar = document.getElementById('c-enviar');
  const MAX_COMENTARIOS = 500;

  const reglas = {
    nombre: (v) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’-]{2,}(\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’-]{2,})+$/.test(v.trim()),
    telefono: (v) => /^[0-9+\s()-]+$/.test(v.trim()) && v.replace(/\D/g, '').length >= 8 && v.replace(/\D/g, '').length <= 13,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    comentarios: (v) => v.trim().length >= 10 && v.length <= MAX_COMENTARIOS
  };

  const marcar = (clave) => {
    const ok = reglas[clave](campos[clave].value);
    const grupo = campos[clave].closest('.campo');
    grupo.classList.toggle('con-error', !ok);
    campos[clave].setAttribute('aria-invalid', String(!ok));
    return ok;
  };

  Object.keys(campos).forEach((clave) => {
    campos[clave].addEventListener('blur', () => marcar(clave));
    campos[clave].addEventListener('input', () => {
      if (campos[clave].closest('.campo').classList.contains('con-error')) marcar(clave);
    });
  });

  campos.comentarios.addEventListener('input', () => {
    contador.textContent = campos.comentarios.value.length + ' / ' + MAX_COMENTARIOS;
  });

  App.llenarSelectAutos(selectAuto, 'Sin auto en particular');
  const autoParam = new URLSearchParams(location.search).get('auto');
  const autoInicial = autoParam ? App.porId(autoParam) : null;
  if (autoInicial) {
    selectAuto.value = autoInicial.id;
    campos.comentarios.value = 'Hola, me interesa el ' + App.nombreCompleto(autoInicial) + ' (' + autoInicial.version + '). Quisiera recibir más información.';
    contador.textContent = campos.comentarios.value.length + ' / ' + MAX_COMENTARIOS;
  }

  function mostrarAutoConsultado() {
    const caja = document.getElementById('auto-consultado');
    const auto = App.porId(selectAuto.value);
    if (!caja) return;
    if (!auto) {
      caja.hidden = true;
      return;
    }
    caja.hidden = false;
    caja.querySelector('img').src = App.foto(auto);
    caja.querySelector('img').dataset.auto = auto.id;
    caja.querySelector('.consultado-nombre').textContent = App.nombreCompleto(auto);
    caja.querySelector('.consultado-detalle').textContent = auto.version + ' · ' + App.fmtKm(auto.km);
    caja.querySelector('.consultado-precio').textContent = App.fmtPrecio(auto.precio);
  }
  selectAuto.addEventListener('change', mostrarAutoConsultado);
  mostrarAutoConsultado();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const resultados = Object.keys(campos).map((c) => [c, marcar(c)]);
    const primerError = resultados.find((r) => !r[1]);
    if (primerError) {
      campos[primerError[0]].focus();
      App.aviso('Revisá los campos marcados antes de enviar.');
      return;
    }
    botonEnviar.disabled = true;
    const auto = App.porId(selectAuto.value);
    document.getElementById('exito-nombre').textContent = campos.nombre.value.trim().split(/\s+/)[0];
    document.getElementById('exito-email').textContent = campos.email.value.trim();
    document.getElementById('exito-auto').textContent = auto ? ' sobre el ' + App.nombreCompleto(auto) : '';
    form.hidden = true;
    exito.hidden = false;
    exito.focus();
    App.aviso('Consulta enviada correctamente.');
  });

  form.addEventListener('reset', () => {
    form.querySelectorAll('.campo').forEach((c) => c.classList.remove('con-error'));
    contador.textContent = '0 / ' + MAX_COMENTARIOS;
    setTimeout(mostrarAutoConsultado, 0);
  });

  document.getElementById('c-otra').addEventListener('click', () => {
    form.reset();
    botonEnviar.disabled = false;
    exito.hidden = true;
    form.hidden = false;
    campos.nombre.focus();
  });
});
