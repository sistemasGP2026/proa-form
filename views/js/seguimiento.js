document.addEventListener('DOMContentLoaded', () => {
    inicializarSeguimiento();
});


function inicializarSeguimiento() {
    const tratamientoPrevio = document.querySelector('[name="tratamientoPrevio"]');

    const tratamientoPrevioDesc = document.querySelector('[name="tratamientoPrevioDesc"]');

    const tratamientoContainer = document.getElementById('tratamientoPrevioDescContainer');

    const ajustadoGuia = document.querySelector('[name="ajustadoGuiaProa"]');

    const guiaIndicacion = document.querySelector('[name="guiaIndicacion"]');

    const guiaContainer = document.getElementById('guiaIndicacionContainer');


    if (tratamientoPrevio) {
        tratamientoPrevio.addEventListener('change',actualizarTratamiento);
    }

    if (ajustadoGuia) {
        ajustadoGuia.addEventListener(
            'change',
            actualizarGuia
        );

    }

    actualizarTratamiento();

    actualizarGuia();

    function actualizarTratamiento() {
        if (!tratamientoPrevio ||!tratamientoPrevioDesc ||!tratamientoContainer) {
            return;
        }

        const mostrar = tratamientoPrevio.value === 'true';

        tratamientoContainer.hidden = !mostrar;

        tratamientoPrevioDesc.required = mostrar;

        if (!mostrar) {
            tratamientoPrevioDesc.value = '';
        }
    }


    function actualizarGuia() {
        if (!ajustadoGuia ||!guiaIndicacion ||!guiaContainer) {
            return;
        }
        const mostrar = ajustadoGuia.value === 'true';
        guiaContainer.hidden = !mostrar;


        guiaIndicacion.required = mostrar;
        if (!mostrar) {
            guiaIndicacion.value = '';
        }
    }
}