document.addEventListener('DOMContentLoaded',
    () => {
        const form = document.getElementById('proaForm');

        if (!form) {
            return;
        }
        form.addEventListener('submit', validarFormulario);

        function validarFormulario(event) {
            event.preventDefault();

            const errores = [];
            validarCamposHTML(errores);

            validarCantidad(errores);

            validarAntibioticos(errores);

            validarProfilaxis(errores);

            if (errores.length > 0) {
                mostrarErrores(errores);
                return;
            }

            confirmarEnvio(form);
        }

        function validarCamposHTML(errores) {
            form.querySelectorAll('[required]:invalid')
                .forEach(campo => {
                    if (campo.hidden || campo.closest('[hidden]')) {
                        return;
                    }

                    errores.push(campo.dataset.label || campo.name || 'Campo obligatorio');
                }
                );
        }


        function validarCantidad(errores) {

            const radio = document.querySelector('input[name="cantidad_antibioticos"]:checked');


            if (!radio) {
                errores.push('Debe seleccionar la cantidad de antibióticos.');

                return;

            }
            const cantidad = Number(radio.value);

            const seleccionados = document.querySelectorAll('.antibiotico-check:checked');

            const indicacion = document.getElementById('indicacionAntibiotico').value;

            const maximo = indicacion === 'PROFILAXIS' ? 2 : 3;

            if (cantidad > maximo) {

                errores.push(`Para ${indicacion.toLowerCase()} el máximo es ${maximo} antibiótico(s).`);
            }

            if (seleccionados.length !== cantidad) {
                errores.push(`Debe seleccionar exactamente ${cantidad} antibiótico(s). Actualmente seleccionó ${seleccionados.length}.`);
            }
        }

        function validarAntibioticos(errores) {
            const seleccionados = document.querySelectorAll('.antibiotico-check:checked');

            seleccionados.forEach(
                checkbox => {
                    const id = checkbox.dataset.id;

                    const nombre = checkbox.dataset.nombre;
                    const bloque = document.getElementById(`antibiotico-${id}`);

                    if (!bloque) {
                        errores.push(`No se encontró la formulación de ${nombre}.`);
                        return;
                    }


                    const campos = [
                        ['cantidad', 'cantidad'],
                        ['dosis', 'dosis'],
                        ['unidadDosis', 'unidad de dosis'],
                        ['via', 'vía de administración'],
                        ['frecuencia', 'frecuencia'],
                        ['fechaInicio', 'fecha de inicio'],
                        ['duracion', 'duración']
                    ];


                    campos.forEach(([dataName, etiqueta]) => {
                        const campo = bloque.querySelector(`[data-name="${dataName}"]`);
                        if (!campo || !campo.value) {

                            errores.push(`${nombre}: debe indicar ${etiqueta}.`);
                        }
                    }
                    );

                    const frecuencia = bloque.querySelector('[data-name="frecuencia"]');


                    if (frecuencia?.value === 'OTRO') {

                        const otro = bloque.querySelector('[data-name="frecuenciaOtro"]');

                        if (!otro || !otro.value.trim()) {
                            errores.push(`${nombre}: debe indicar la frecuencia.`);
                        }
                    }

                    const fechaFin = bloque.querySelector('[data-name="fechaFin"]');

                    if (!fechaFin || !fechaFin.value) {
                        errores.push(`${nombre}: no se pudo calcular la fecha final.`);
                    }
                }
            );
        }

        function validarProfilaxis(errores) {
            const indicacion = document.getElementById('indicacionAntibiotico').value;

            if (indicacion !== 'PROFILAXIS') {
                return;
            }

            const cirugia = document.getElementById('cirugiaOrtopedia').value;
            const gustillo = document.getElementById('gustilloAnderson').value;


            if (!cirugia) {
                errores.push('Debe indicar si corresponde a cirugía de ortopedia.');
                return;
            }


            if (cirugia === 'SI' && !gustillo) {
                errores.push('Debe indicar si corresponde a Gustillo y Anderson III.');
                return;
            }
            const permitidas = window.PROA_DURACIONES_PERMITIDAS;

            if (!permitidas) {
                errores.push('No se pudo determinar la duración permitida para la profilaxis.');
                return;
            }

            document.querySelectorAll('.antibiotico-check:checked')
                .forEach(
                    checkbox => {
                        const bloque = document.getElementById(`antibiotico-${checkbox.dataset.id}`);

                        const duracion = bloque?.querySelector('[data-name="duracion"]');

                        if (duracion?.value && !permitidas.includes(Number(duracion.value))) {
                            errores.push(`${checkbox.dataset.nombre}: la duración no corresponde a la condición de profilaxis seleccionada.`);
                        }
                    }
                );
        }

        function mostrarErrores(errores) {
            const unicos = [...new Set(errores)];

            const lista = unicos.map(error => `<li>${escapeHtml(error)}</li>`).join('');
            Swal.fire({
                icon: 'error',
                title: 'Revise el formulario',
                html: `<div style="text-align:left">
                        <p>
                            Se encontraron
                            <strong>
                                ${unicos.length}
                            </strong>
                            inconveniente(s):
                        </p>
                        <ul>
                            ${lista}
                        </ul>
                    </div>`,
                confirmButtonText: 'Revisar formulario',
                width: '650px'
            });
        }
        function confirmarEnvio(form) {

            Swal.fire({
                icon: 'question',
                title: '¿Enviar solicitud?',
                text: 'Una vez enviada, la información será registrada para revisión.',
                showCancelButton: true,
                confirmButtonText: 'Sí, enviar',
                cancelButtonText: 'Revisar',
                reverseButtons: true
            }).then(
                result => {
                    if (result.isConfirmed) {
                        form.submit();
                    }
                });
        }

        function escapeHtml(value) {
            const div = document.createElement('div');
            div.textContent = value ?? '';
            return div.innerHTML;
        }
    }
);