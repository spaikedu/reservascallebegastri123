
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = process.env.PORT || 3000;

const DB_PATH = path.join(__dirname, 'db.json');

// --- Helper Functions ---
const readDb = async () => {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { reservations: {} }; // Return a default structure if file doesn't exist
        }
        throw error;
    }
};

const writeDb = async (data) => {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---

// Admin Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // IMPORTANT: Hardcoded credentials as requested.
    if (username === 'admin' && password === 'Lapaca.c1') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
});

// Get reservations for a specific day (for admin)
app.get('/api/admin/reservations/:date', async (req, res) => {
    const { date } = req.params;
    const db = await readDb();
    const reservations = db.reservations[date] || [];
    res.json(reservations);
});

// Add a new time slot (for admin)
app.post('/api/admin/slots', async (req, res) => {
    const { date, time } = req.body;
    if (!date || !time) {
        return res.status(400).json({ message: 'Fecha y hora son requeridas' });
    }

    const db = await readDb();
    if (!db.reservations[date]) {
        db.reservations[date] = [];
    }

    // Check if the time slot already exists
    if (db.reservations[date].some(slot => slot.time === time)) {
        return res.status(409).json({ message: 'Esta franja horaria ya existe para este día' });
    }

    db.reservations[date].push({
        id: Date.now().toString(),
        time: time,
        status: 'available',
        name: null,
        notes: ''
    });

    // Sort slots by time
    db.reservations[date].sort((a, b) => a.time.localeCompare(b.time));

    await writeDb(db);
    res.json({ success: true, message: 'Franja horaria añadida' });
});

// --- Public Routes ---
// (Add public routes here later)


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
