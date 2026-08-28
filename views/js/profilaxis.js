(() => {
    function inicializarProfilaxis() {
        const indicacion = document.getElementById('indicacionAntibiotico');

        const section = document.getElementById('profilaxisSection');

        const cirugia = document.getElementById('cirugiaOrtopedia');

        const gustilloContainer = document.getElementById( 'gustilloContainer');

        const gustillo = document.getElementById('gustilloAnderson');

        const rule = document.getElementById('profilaxisRule');

        const ruleText = document.getElementById('profilaxisRuleText');

        if (!indicacion || !section) {
            return;
        }
        function actualizar() {
            const esProfilaxis = indicacion.value === 'PROFILAXIS';
            section.hidden = !esProfilaxis;
            cirugia.required = esProfilaxis;

            if (!esProfilaxis) {
                cirugia.value = '';
                gustillo.value = '';

                gustillo.required = false;

                gustilloContainer.hidden = true;

                rule.hidden = true;

                ruleText.textContent = '';

                window.PROA_DURACIONES_PERMITIDAS = null;

                notificarCambio();
                return;
            }

            actualizarCondicion();
        }


        function actualizarCondicion() {
            if (cirugia.value === 'SI') {
                gustilloContainer.hidden = false;

                gustillo.required = true;

                if (gustillo.value === 'SI') {
                    ruleText.textContent = '1, 2 o 3 días.';
                    window.PROA_DURACIONES_PERMITIDAS = [1, 2, 3];

                    rule.hidden = false;

                }

                else if (gustillo.value === 'NO') {

                    ruleText.textContent = '1 día.';
                    window.PROA_DURACIONES_PERMITIDAS = [1];

                    rule.hidden = false;
                }

                else {
                    rule.hidden = true;
                    ruleText.textContent = '';
                    window.PROA_DURACIONES_PERMITIDAS = null;
                }
                notificarCambio();

                return;
            }

            if (cirugia.value === 'NO') {

                gustillo.value = '';

                gustillo.required = false;

                gustilloContainer.hidden = true;
                ruleText.textContent ='1 día.';

                window.PROA_DURACIONES_PERMITIDAS = [1];
                rule.hidden = false;

                notificarCambio();

                return;
            }
            gustillo.value = '';

            gustillo.required = false;

            gustilloContainer.hidden = true;

            rule.hidden = true;

            ruleText.textContent = '';

            window.PROA_DURACIONES_PERMITIDAS =null;

            notificarCambio();
        }

        function notificarCambio() {
            document.dispatchEvent(new CustomEvent('proa:profilaxis-cambio'));
        }

        indicacion.addEventListener('change',actualizar);

        cirugia.addEventListener('change',actualizarCondicion);

        gustillo.addEventListener('change',actualizarCondicion);

        actualizar();
    }
    document.addEventListener('DOMContentLoaded',inicializarProfilaxis);

})();