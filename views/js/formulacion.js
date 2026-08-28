(() => {
  function inicializarFormulacion() {
    const contenedor = document.getElementById('rg-container');
    const template = document.getElementById('tpl-antibiotico');
    const indicacion = document.getElementById('indicacionAntibiotico');

    if (!contenedor || !template) return;

    function obtenerCantidad() {
      const radio = document.querySelector('input[name="cantidad_antibioticos"]:checked');
      return radio ? Number(radio.value) : null;
    }

    function obtenerSeleccionados() {
      return Array.from(document.querySelectorAll('.antibiotico-check:checked'));
    }

    function obtenerMaximo() {
      return indicacion && indicacion.value === 'PROFILAXIS' ? 2 : 3;
    }

    function actualizarCantidadMaxima() {
      const cantidad3 = document.getElementById('cantidad3Card');
      if (cantidad3) cantidad3.hidden = indicacion.value === 'PROFILAXIS';

      const radio3 = document.querySelector('input[name="cantidad_antibioticos"][value="3"]');
      if (indicacion.value === 'PROFILAXIS' && radio3 && radio3.checked) radio3.checked = false;

      const maximo = obtenerMaximo();
      const seleccionados = obtenerSeleccionados();
      if (seleccionados.length > maximo) {
        seleccionados.slice(maximo).forEach(check => {
          check.checked = false;
          eliminarFormulario(check.dataset.id);
        });
      }
    }

    function configurarDuraciones(select) {
      select.innerHTML = '<option value="">Seleccione</option>';

      if (indicacion.value === 'PROFILAXIS') {
        const permitidas = window.PROA_DURACIONES_PERMITIDAS || [];
        permitidas.forEach(dias => {
          const option = document.createElement('option');
          option.value = dias;
          option.textContent = dias === 1 ? '1 día' : `${dias} días`;
          select.appendChild(option);
        });
        return;
      }

      for (let i = 1; i <= 7; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i === 1 ? '1 día' : `${i} días`;
        select.appendChild(option);
      }
      const otro = document.createElement('option');
      otro.value = 'OTRO';
      otro.textContent = 'Otro';
      select.appendChild(otro);
    }

    function actualizarDuraciones() {
      document.querySelectorAll('[data-name="duracion"]').forEach(configurarDuraciones);
    }

    function calcularFechaFinal(bloque) {
      const fechaInicio = bloque.querySelector('[data-name="fechaInicio"]');
      const duracion = bloque.querySelector('[data-name="duracion"]');
      const fechaFin = bloque.querySelector('[data-name="fechaFin"]');
      if (!fechaInicio || !duracion || !fechaFin) return;

      if (!fechaInicio.value || !duracion.value || duracion.value === 'OTRO') {
        fechaFin.value = '';
        return;
      }
      const dias = Number(duracion.value);
      if (!Number.isFinite(dias) || dias < 1) { fechaFin.value = ''; return; }

      const fecha = new Date(`${fechaInicio.value}T00:00:00`);
      fecha.setDate(fecha.getDate() + dias - 1);
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha.getDate()).padStart(2, '0');
      fechaFin.value = `${yyyy}-${mm}-${dd}`;
    }
    
    function renumerarBloques() {
      const bloques = contenedor.querySelectorAll('.antibiotico-form');

      bloques.forEach((bloque, indice) => {
        let inputId = bloque.querySelector('input[data-name="antibioticoId"]');
        if (!inputId) {
          inputId = document.createElement('input');
          inputId.type = 'hidden';
          inputId.dataset.name = 'antibioticoId';
          bloque.prepend(inputId);
        }
        inputId.value = bloque.dataset.antibioticoId;

        bloque.querySelectorAll('[data-name]').forEach(campo => {
          const dataName = campo.dataset.name;

          if (dataName === 'frecuenciaOtro') {
            const frecuencia = bloque.querySelector('[data-name="frecuencia"]');
            campo.name = frecuencia && frecuencia.value === 'OTRO'
              ? `medicamentos[${indice}][frecuenciaOtro]`
              : '';
            return;
          }

          campo.name = `medicamentos[${indice}][${dataName}]`;
        });
      });
    }

    function agregarFormulario(checkbox) {
      const id = checkbox.dataset.id;
      const nombre = checkbox.dataset.nombre;
      const tipo = checkbox.dataset.tipo;

      if (document.getElementById(`antibiotico-${id}`)) return;

      const fragment = template.content.cloneNode(true);
      const bloque = fragment.querySelector('.antibiotico-form');
      bloque.id = `antibiotico-${id}`;

      bloque.dataset.antibioticoId = id;
      bloque.dataset.antibioticoNombre = nombre;

      bloque.classList.add(tipo === 'RESTRINGIDO' ? 'antibiotico-restringido' : 'antibiotico-vigilado');

      bloque.querySelector('[data-field="nombre"]').textContent = nombre;
      bloque.querySelector('[data-field="tipo"]').textContent = tipo;

      const fechaInicio = bloque.querySelector('[data-name="fechaInicio"]');
      fechaInicio.addEventListener('change', () => calcularFechaFinal(bloque));

      const duracion = bloque.querySelector('[data-name="duracion"]');
      duracion.addEventListener('change', () => calcularFechaFinal(bloque));

      const frecuencia = bloque.querySelector('[data-name="frecuencia"]');
      const frecuenciaOtro = bloque.querySelector('.frecuencia-otro');
      const inputFrecuenciaOtro = bloque.querySelector('[data-name="frecuenciaOtro"]');

      frecuencia.addEventListener('change', () => {
        const esOtro = frecuencia.value === 'OTRO';
        frecuenciaOtro.hidden = !esOtro;
        inputFrecuenciaOtro.required = esOtro;
        if (!esOtro) inputFrecuenciaOtro.value = '';
        renumerarBloques(); 
      });

      contenedor.appendChild(fragment);
      const bloqueCreado = document.getElementById(`antibiotico-${id}`);
      configurarDuraciones(bloqueCreado.querySelector('[data-name="duracion"]'));

      marcarSeleccionado(checkbox, true);
      renumerarBloques();
    }

    function eliminarFormulario(id) {
      const elemento = document.getElementById(`antibiotico-${id}`);
      if (elemento) elemento.remove();

      const checkbox = document.querySelector(`.antibiotico-check[data-id="${CSS.escape(id)}"]`);
      marcarSeleccionado(checkbox, false);

      renumerarBloques(); // reempaca los índices que quedaron
    }

    function marcarSeleccionado(checkbox, seleccionado) {
      if (!checkbox) return;
      const option = checkbox.closest('.antibiotico-option');
      if (option) option.classList.toggle('seleccionado', seleccionado);
    }

    document.querySelectorAll('.antibiotico-check').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const cantidad = obtenerCantidad();
        const seleccionados = obtenerSeleccionados();

        if (checkbox.checked && cantidad && seleccionados.length > cantidad) {
          checkbox.checked = false;
          Swal.fire({
            icon: 'warning',
            title: 'Cantidad excedida',
            text: `Debe seleccionar exactamente ${cantidad} antibiótico(s).`,
            confirmButtonText: 'Entendido',
          });
          return;
        }

        if (checkbox.checked) agregarFormulario(checkbox);
        else eliminarFormulario(checkbox.dataset.id);
      });
    });

    document.querySelectorAll('input[name="cantidad_antibioticos"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const cantidad = Number(radio.value);
        const seleccionados = obtenerSeleccionados();
        if (seleccionados.length > cantidad) {
          seleccionados.slice(cantidad).forEach(checkbox => {
            checkbox.checked = false;
            eliminarFormulario(checkbox.dataset.id);
          });
        }
      });
    });

    indicacion?.addEventListener('change', () => {
      actualizarCantidadMaxima();
      actualizarDuraciones();
    });

    document.addEventListener('proa:profilaxis-cambio', () => actualizarDuraciones());

    actualizarCantidadMaxima();

    window.PROA_FORMULACION = {
      obtenerSeleccionados,
      obtenerCantidad,
      actualizarDuraciones,
      calcularFechaFinal,
    };
  }

  document.addEventListener('DOMContentLoaded', inicializarFormulacion);
})();