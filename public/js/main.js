document.getElementById('reserva-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = 'Enviando reserva...';
    mensajeDiv.className = '';

    // !!! IMPORTANTE !!!
    // Reemplaza esta URL con la URL de tu Web App de Google Apps Script.
    const googleAppScriptUrl = 'https://script.google.com/macros/s/AKfycbzciNn8bcGhLGXGOrlGMPxsiJBcmDBKyJkTuiejpo7CkE9jTnbyrGmQn8OC1jIesXj6Xw/exec';

    const form = e.target;
    const formData = new FormData(form);

    fetch(googleAppScriptUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === 'success') {
            mensajeDiv.textContent = '¡Reserva realizada con éxito!';
            mensajeDiv.className = 'success';
            form.reset();
        } else {
            throw new Error(data.message || 'Ocurrió un error.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mensajeDiv.textContent = 'Error al realizar la reserva. Por favor, inténtalo de nuevo.';
        mensajeDiv.className = 'error';
    });
});