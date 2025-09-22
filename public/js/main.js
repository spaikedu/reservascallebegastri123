document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANTE !!!
    // Pega aquí la misma URL de la Web App de Google Apps Script.
    const googleAppScriptUrl = 'https://script.google.com/macros/s/AKfycbzciNn8bcGhLGXGOrlGMPxsiJBcmDBKyJkTuiejpo7CkE9jTnbyrGmQn8OC1jIesXj6Xw/exec';

    const horariosContainer = document.getElementById('horarios-container');
    const fechaHoyEl = document.getElementById('fecha-hoy');
    const notaHoyEl = document.getElementById('nota-hoy');
    const reservaModalEl = document.getElementById('reservaModal');
    const reservaForm = document.getElementById('reserva-form');
    const modalMensajeDiv = document.getElementById('modal-mensaje');
    const reservaModal = new bootstrap.Modal(reservaModalEl);

    // --- MOSTRAR FECHA DE HOY ---
    const today = new Date();
    fechaHoyEl.textContent = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // --- CARGAR HORARIOS DISPONIBLES ---
    function loadHorarios() {
        horariosContainer.innerHTML = '<p>Buscando horarios disponibles...</p>';
        fetch(`${googleAppScriptUrl}?action=getHorarios`)
            .then(response => response.json())
            .then(res => {
                if (res.status === 'success') {
                    renderHorarios(res.data);
                } else { throw new Error(res.message); }
            })
            .catch(error => {
                console.error('Error al cargar horarios:', error);
                horariosContainer.innerHTML = `<p class="text-danger">No se pudieron cargar los horarios. Inténtalo de nuevo más tarde.</p>`;
            });
    }

    // --- RENDERIZAR LOS BLOQUES DE HORARIOS ---
    function renderHorarios(horarios) {
        const notaDelDia = horarios.find(h => h.Nota)?.Nota;
        if (notaDelDia) {
            notaHoyEl.textContent = notaDelDia;
        }

        if (horarios.length === 0) {
            horariosContainer.innerHTML = '<p>No hay visitas programadas para hoy. ¡Vuelve a consultar más tarde!</p>';
            return;
        }

        horariosContainer.innerHTML = ''; // Limpiar contenedor
        horarios.sort((a, b) => a.Hora.localeCompare(b.Hora)).forEach(horario => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = horario.Hora;
            
            if (horario.Estado === 'Libre') {
                btn.className = 'btn btn-horario btn-success horario-libre'; // Añadida clase horario-libre
                btn.dataset.id = horario.ID;
                btn.dataset.hora = horario.Hora;
            } else {
                btn.className = 'btn btn-horario btn-secondary';
                btn.disabled = true;
            }
            horariosContainer.appendChild(btn);
        });
    }

    // --- LÓGICA DE ALERTA Y APERTURA DE MODAL ---
    horariosContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (!target.classList.contains('horario-libre')) return;

        alert('Recuerda que vas a visitar a una recién nacida que no tiene defensas, ven con la mascarilla puesta. Gracias!');

        const id = target.dataset.id;
        const hora = target.dataset.hora;

        document.getElementById('hora-seleccionada').textContent = hora;
        document.getElementById('reserva-id').value = id;
        
        reservaForm.reset();
        modalMensajeDiv.textContent = '';
        modalMensajeDiv.className = '';

        reservaModal.show();
    });

    // --- ENVÍO DEL FORMULARIO DE RESERVA ---
    reservaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        modalMensajeDiv.textContent = 'Enviando solicitud...';

        const formData = new FormData(reservaForm);
        formData.append('action', 'solicitarReserva');

        fetch(googleAppScriptUrl, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(res => {
                if (res.status === 'success') {
                    modalMensajeDiv.textContent = '¡Solicitud enviada! Recibirás una confirmación.';
                    modalMensajeDiv.className = 'text-success';
                    setTimeout(() => {
                        reservaModal.hide();
                        loadHorarios();
                    }, 2000);
                } else { throw new Error(res.message); }
            })
            .catch(error => {
                console.error('Error al solicitar reserva:', error);
                modalMensajeDiv.textContent = `Error: ${error.message}`;
                modalMensajeDiv.className = 'text-danger';
            });
    });

    // Carga inicial
    loadHorarios();
});