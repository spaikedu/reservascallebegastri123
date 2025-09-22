document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANTE !!!
    // Pega aquí la misma URL de la Web App de Google Apps Script.
    const googleAppScriptUrl = 'https://script.google.com/macros/s/AKfycbzciNn8bcGhLGXGOrlGMPxsiJBcmDBKyJkTuiejpo7CkE9jTnbyrGmQn8OC1jIesXj6Xw/exec';

    const horariosContainer = document.getElementById('horarios-container');
    const fechaHoyEl = document.getElementById('fecha-hoy');
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
                } else {
                    throw new Error(res.message);
                }
            })
            .catch(error => {
                console.error('Error al cargar horarios:', error);
                horariosContainer.innerHTML = `<p class="text-danger">No se pudieron cargar los horarios. Inténtalo de nuevo más tarde.</p>`;
            });
    }

    // --- RENDERIZAR LOS BLOQUES DE HORARIOS ---
    function renderHorarios(horarios) {
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
                btn.className = 'btn btn-horario btn-success';
                btn.dataset.bsToggle = 'modal';
                btn.dataset.bsTarget = '#reservaModal';
                btn.dataset.id = horario.ID;
                btn.dataset.hora = horario.Hora;
            } else {
                btn.className = 'btn btn-horario btn-secondary';
                btn.disabled = true;
            }
            horariosContainer.appendChild(btn);
        });
    }

    // --- LÓGICA DEL MODAL DE RESERVA ---
    reservaModalEl.addEventListener('show.bs.modal', (event) => {
        // Botón que activó el modal
        const button = event.relatedTarget;
        const id = button.dataset.id;
        const hora = button.dataset.hora;

        // Actualizar contenido del modal
        document.getElementById('hora-seleccionada').textContent = hora;
        document.getElementById('reserva-id').value = id;
        
        // Limpiar formulario y mensajes
        reservaForm.reset();
        modalMensajeDiv.textContent = '';
        modalMensajeDiv.className = '';
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
                        loadHorarios(); // Recargar para mostrar el horario como no disponible
                    }, 2000);
                } else {
                    throw new Error(res.message);
                }
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