document.addEventListener('DOMContentLoaded', () => {
  const selects = document.querySelectorAll('#sede, #servicio, #especialidad, #diagnosticoRelacionado');

  selects.forEach(select => {
    select.classList.toggle('campo-seleccionado', Boolean(select.value));

    select.addEventListener('change', () => {
      select.classList.toggle('campo-seleccionado', Boolean(select.value));
    });
  });
});