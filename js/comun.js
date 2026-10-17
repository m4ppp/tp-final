const App = (() => {
  const numero = new Intl.NumberFormat('es-AR');
  const CLAVE_FAV = 'vector_favoritos';
  const SIN_FOTO = '../img/autos/sin-foto.svg';

  const fmtPrecio = (v) => '$ ' + numero.format(v);
  const fmtKm = (v) => numero.format(v) + ' km';
  const porId = (id) => AUTOS.find((a) => a.id === Number(id));
  const nombre = (a) => a.marca + ' ' + a.modelo;
  const nombreCompleto = (a) => a.marca + ' ' + a.modelo + ' ' + a.anio;
  const foto = (a) => (a.foto ? '../img/autos/' + a.foto : SIN_FOTO);
  const cuota = (a) => Math.round(a.precio / 36);

  const favoritos = {
    lista() {
      try {
        return JSON.parse(localStorage.getItem(CLAVE_FAV) || '[]');
      } catch (e) {
        return [];
      }
    },
    tiene(id) {
      return this.lista().includes(id);
    },
    alternar(id) {
      let lista = this.lista();
      lista = lista.includes(id) ? lista.filter((x) => x !== id) : lista.concat(id);
      try {
        localStorage.setItem(CLAVE_FAV, JSON.stringify(lista));
      } catch (e) {
        return false;
      }
      return lista.includes(id);
    }
  };

  function aviso(texto) {
    if (window.M && M.toast) M.toast({ html: texto, displayLength: 3000, classes: 'aviso-vector' });
  }

  function llenarSelectAutos(select, textoInicial) {
    const grupos = {};
    AUTOS.forEach((a) => {
      (grupos[a.marca] = grupos[a.marca] || []).push(a);
    });
    let html = '<option value="">' + textoInicial + '</option>';
    Object.keys(grupos).sort().forEach((marca) => {
      html += '<optgroup label="' + marca + '">';
      grupos[marca].forEach((a) => {
        html += '<option value="' + a.id + '">' + a.modelo + ' ' + a.anio + ' · ' + a.version + '</option>';
      });
      html += '</optgroup>';
    });
    select.innerHTML = html;
  }

  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.dataset.auto && !img.dataset.fallback) {
      img.dataset.fallback = '1';
      img.src = SIN_FOTO;
    }
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    if (window.M) {
      M.Sidenav.init(document.querySelectorAll('.sidenav'), { edge: 'left' });
      M.Collapsible.init(document.querySelectorAll('.collapsible.auto'), { accordion: false });
    }
    document.querySelectorAll('[data-anio-actual]').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  });

  return { fmtPrecio, fmtKm, porId, nombre, nombreCompleto, foto, cuota, favoritos, aviso, llenarSelectAutos };
})();
