document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANTE !!!
    // Pega aquí la misma URL de la Web App de Google Apps Script.
    const googleAppScriptUrl = 'https://script.google.com/macros/s/AKfycbzciNn8bcGhLGXGOrlGMPxsiJBcmDBKyJkTuiejpo7CkE9jTnbyrGmQn8OC1jIesXj6Xw/exec';

    const addHorarioForm = document.getElementById('add-horario-form');
    const mensajeDiv = document.getElementById('admin-mensaje');
    const reservasListDiv = document.getElementById('reservas-lista');

    // --- CARGAR DATOS AL INICIAR ---
    function loadAdminData() {
        reservasListDiv.innerHTML = '<p>Cargando reservas...</p>';
        fetch(`${googleAppScriptUrl}?action=getAdminData`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    renderReservas(data.data);
                } else {
                    throw new Error(data.message);
                }
            })
            .catch(error => {
                console.error('Error al cargar datos de admin:', error);
                reservasListDiv.innerHTML = `<p class="text-danger">Error al cargar los datos: ${error.message}</p>`;
            });
    }

    // --- RENDERIZAR LA LISTA DE RESERVAS ---
    function renderReservas(reservas) {
        if (reservas.length === 0) {
            reservasListDiv.innerHTML = '<p>No hay horarios ni reservas todavía.</p>';
            return;
        }

        const groupedByDate = reservas.reduce((acc, reserva) => {
            const fecha = new Date(reserva.Fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!acc[fecha]) {
                acc[fecha] = [];
            }
            acc[fecha].push(reserva);
            return acc;
        }, {});

        let html = '';
        for (const fecha in groupedByDate) {
            html += `<h4>${fecha}</h4>`;
            html += '<ul class="list-group mb-4">';
            groupedByDate[fecha].sort((a, b) => a.Hora.localeCompare(b.Hora)).forEach(reserva => {
                let content = '';
                let badge = '';

                switch (reserva.Estado) {
                    case 'Libre':
                        badge = '<span class="badge bg-success">Libre</span>';
                        content = `Añadido a las ${reserva.Hora}`;
                        if (reserva.Nota) {
                            content += `<br><small class="text-muted fst-italic">Nota: ${reserva.Nota}</small>`;
                        }
                        content += '.';
                        break;
                    case 'Pendiente':
                        badge = '<span class="badge bg-warning">Pendiente</span>';
                        content = `<b>${reserva.NombreVisitante}</b> ha solicitado a las ${reserva.Hora}.<br>Contacto: ${reserva.ContactoVisitante}<br>Mensaje: "${reserva.Mensaje}"`;
                        break;
                    case 'Confirmado':
                        badge = '<span class="badge bg-secondary">Confirmado</span>';
                        content = `Visita de <b>${reserva.NombreVisitante}</b> a las ${reserva.Hora}.`;
                        break;
                }

                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>${badge} ${content}</div>
                            <div>`;

                if (reserva.Estado === 'Pendiente') {
                    html += `<button class="btn btn-sm btn-success me-2" data-id="${reserva.ID}" data-action="confirmar">Aceptar</button>
                             <button class="btn btn-sm btn-warning" data-id="${reserva.ID}" data-action="rechazar">Rechazar</button>`;
                }
                
                html += `<button class="btn btn-sm btn-danger ms-2" data-id="${reserva.ID}" data-action="eliminar">Eliminar</button>
                         </div>
                      </li>`;
            });
            html += '</ul>';
        }
        reservasListDiv.innerHTML = html;
    }

    // --- AÑADIR NUEVO HORARIO ---
    addHorarioForm.addEventListener('submit', e => {
        e.preventDefault();
        mensajeDiv.textContent = 'Añadiendo...';
        
        const fecha = document.getElementById('admin-fecha').value;
        const hora = document.getElementById('admin-hora').value;
        const nota = document.getElementById('admin-nota').value;

        const formData = new FormData();
        formData.append('action', 'addHorario');
        formData.append('fecha', fecha);
        formData.append('hora', hora);
        formData.append('nota', nota);

        fetch(googleAppScriptUrl, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    mensajeDiv.textContent = '¡Horario añadido con éxito!';
                    mensajeDiv.className = 'text-success';
                    addHorarioForm.reset();
                    loadAdminData();
                } else { throw new Error(data.message); }
            })
            .catch(error => {
                console.error('Error al añadir horario:', error);
                mensajeDiv.textContent = `Error: ${error.message}`;
                mensajeDiv.className = 'text-danger';
            });
    });

    // --- GESTIONAR BOTONES DE ACCIÓN (ACEPTAR, RECHAZAR, ELIMINAR) ---
    reservasListDiv.addEventListener('click', e => {
        const target = e.target;
        const id = target.dataset.id;
        const action = target.dataset.action;

        if (!id || !action) return;

        let promise;
        const formData = new FormData();
        formData.append('id', id);

        if (action === 'confirmar' || action === 'rechazar') {
            const nuevoEstado = action === 'confirmar' ? 'Confirmado' : 'Libre';
            formData.append('action', 'updateEstado');
            formData.append('nuevoEstado', nuevoEstado);
            promise = fetch(googleAppScriptUrl, { method: 'POST', body: formData });
        } else if (action === 'eliminar') {
            if (!confirm('¿Estás seguro de que quieres eliminar este horario? Esta acción no se puede deshacer.')) {
                return;
            }
            formData.append('action', 'deleteHorario');
            promise = fetch(googleAppScriptUrl, { method: 'POST', body: formData });
        }

        if (promise) {
            promise.then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert(data.message);
                        loadAdminData();
                    } else { throw new Error(data.message); }
                })
                .catch(error => {
                    console.error('Error en la acción:', error);
                    alert(`Error: ${error.message}`);
                });
        }
    });

    // Carga inicial
    loadAdminData();
});