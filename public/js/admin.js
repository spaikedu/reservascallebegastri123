document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for authentication
    if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
        window.location.href = '/login.html';
        return; // Stop script execution if not authenticated
    }

    // 2. Handle logout
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('isAdminAuthenticated');
        window.location.href = '/login.html';
    });

    const addSlotForm = document.getElementById('add-slot-form');
    const viewDateInput = document.getElementById('view-date');
    const viewDateBtn = document.getElementById('view-date-btn');
    const reservationsList = document.getElementById('reservations-list');

    // Set default date to today for both inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('slot-date').value = today;
    viewDateInput.value = today;

    // 3. Fetch and display reservations
    const fetchAndDisplayReservations = async (date) => {
        if (!date) return;
        const response = await fetch(`/api/admin/reservations/${date}`);
        const reservations = await response.json();
        
        reservationsList.innerHTML = ''; // Clear previous list
        if (reservations.length === 0) {
            reservationsList.innerHTML = '<p>No hay horas definidas para este día.</p>';
            return;
        }

        const list = document.createElement('ul');
        list.className = 'list-group';
        reservations.forEach(slot => {
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            let statusBadge;
            if (slot.status === 'booked') {
                statusBadge = `<span class="badge bg-warning text-dark">Reservado por: ${slot.name}</span>`;
            } else if (slot.status === 'confirmed') {
                statusBadge = `<span class="badge bg-success">Confirmado: ${slot.name}</span>`;
            } else {
                statusBadge = `<span class="badge bg-secondary">Disponible</span>`;
            }

            item.innerHTML = `
                <div>
                    <strong>${slot.time}</strong>
                    <div class="text-muted">${slot.notes || ''}</div>
                </div>
                <div>
                    ${statusBadge}
                    // Add buttons for actions here later
                </div>
            `;
            list.appendChild(item);
        });
        reservationsList.appendChild(list);
    };

    // 4. Add new time slots
    addSlotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('slot-date').value;
        const time = document.getElementById('slot-time').value;

        const response = await fetch('/api/admin/slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, time })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Hora añadida correctamente');
            document.getElementById('slot-time').value = '';
            // Refresh the view if the date is the same
            if (date === viewDateInput.value) {
                fetchAndDisplayReservations(date);
            }
        } else {
            alert(`Error: ${result.message}`);
        }
    });

    // Event listeners for viewing reservations
    viewDateBtn.addEventListener('click', () => fetchAndDisplayReservations(viewDateInput.value));

    // Initial load
    fetchAndDisplayReservations(today);
});
