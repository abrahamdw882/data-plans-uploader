const express = require('express');
const sqlite3 = require('sqlite3').verbose(); 
const path = require('path');
const session = require('express-session');
const cors = require('cors'); // Import CORS

const app = express();
const PORT = 3000;


const corsOptions = {
  origin: 'https://data-plans-uploader.onrender.com', 
  methods: ['GET', 'POST'], 
  allowedHeaders: ['Content-Type'], 
};


app.use(cors(corsOptions));

const db = new sqlite3.Database('dataPlans.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        db.run(`
            CREATE TABLE IF NOT EXISTS plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataPlan TEXT NOT NULL,
                recipientNumber TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            } else {
                console.log('Table created or already exists.');
            }
        });
    }
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'ab', 
    resave: false,
    saveUninitialized: true,
}));


app.use(express.static(path.join(__dirname, 'public')));


app.post('/select-data-plan', (req, res) => {
    const { dataPlan, recipientNumber } = req.body;

    if (!dataPlan || !recipientNumber) {
        return res.status(400).json({ message: 'Data plan and recipient number are required.' });
    }

    const stmt = db.prepare("INSERT INTO plans (dataPlan, recipientNumber) VALUES (?, ?)");
    stmt.run(dataPlan, recipientNumber, function(err) {
        if (err) {
            console.error('Error inserting plan into database:', err);
            return res.status(500).json({ message: 'Failed to save data plan.' });
        }

        res.status(200).json({ message: 'Data plan selected successfully!' });
    });
    stmt.finalize();
});


app.get('/get-selected-plans', (req, res) => {
    db.all("SELECT * FROM plans", [], (err, rows) => {
        if (err) {
            console.error('Error fetching plans from database:', err);
            return res.status(500).json({ message: 'Failed to fetch data plans.' });
        }

        res.status(200).json(rows); 
    });
});


app.get('/review-details', (req, res) => {
    db.get("SELECT * FROM plans ORDER BY id DESC LIMIT 1", [], (err, row) => {
        if (err) {
            console.error('Error fetching the most recent plan:', err);
            return res.status(500).json({ message: 'Failed to fetch the selected plan.' });
        }

        if (!row) {
            return res.status(400).json({ message: 'No data plan selected.' });
        }

        res.status(200).json({
            dataPlan: row.dataPlan,
            recipientNumber: row.recipientNumber
        });
    });
});


app.get('/log-all-plans', (req, res) => {
    console.log('Fetching all data plans...'); 

    db.all("SELECT * FROM plans", [], (err, rows) => {
        if (err) {
            console.error('Error fetching plans from database:', err);
            return res.status(500).json({ message: 'Failed to fetch data plans.' });
        }

        console.log('All Data Plans:', rows); 

        if (rows.length === 0) {
            console.log('No data plans found in the database.');
        }

        res.status(200).json(rows); 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
