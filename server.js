const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const path = require('path');
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static("public"));



const FILE_PATH = "messages.json";

const FIL_PATH = './appointments.json';

// Middleware
app.use(express.static(__dirname));

// Enable CORS for all routes
app.use(cors({ origin: 'http://127.0.0.1:5500' }));

// Handle OPTIONS requests
app.options('*', (req, res) => {
    res.sendStatus(200);
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'symp.html'));
});

app.post('/check-symptoms', async (req, res) => {
    try {
        // Validate request body
        if (!req.body || !req.body.symptoms) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Request body must contain symptoms array'
            });
        }

        const userSymptoms = req.body.symptoms;
        
        if (!Array.isArray(userSymptoms)) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Symptoms must be an array'
            });
        }

        if (userSymptoms.length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Symptoms array cannot be empty'
            });
        }

        // Read symptoms data
        let symptomsData;
        try {
            const data = fs.readFileSync('symptoms.json', 'utf8');
            symptomsData = JSON.parse(data);
        } catch (error) {
            console.error('Error reading symptoms.json:', error);
            return res.status(500).json({
                error: 'Server error',
                message: 'Failed to read symptoms data'
            });
        }

        // Process symptoms and find matching conditions
        const results = processSymptoms(userSymptoms, symptomsData);
        
        // Ensure we always send a valid JSON response
        if (!Array.isArray(results)) {
            return res.status(500).json({
                error: 'Server error',
                message: 'Invalid results format'
            });
        }

        return res.json(results);
    } catch (error) {
        console.error('Error processing symptoms:', error);
        return res.status(500).json({
            error: 'Server error',
            message: error.message || 'An unexpected error occurred'
        });
    }
});

function processSymptoms(userSymptoms, symptomsData) {
    try {
        const conditions = new Map();
        
        // Process each user symptom
        userSymptoms.forEach(symptom => {
            const symptomData = symptomsData.symptoms.find(s => s.name.toLowerCase() === symptom.toLowerCase());
            
            if (symptomData) {
                symptomData.conditions.forEach(condition => {
                    if (!conditions.has(condition.name)) {
                        conditions.set(condition.name, {
                            name: condition.name,
                            probability: condition.probability,
                            matchingSymptoms: [symptom],
                            additionalSymptoms: condition.additional_symptoms
                        });
                    } else {
                        const existing = conditions.get(condition.name);
                        existing.probability += condition.probability;
                        existing.matchingSymptoms.push(symptom);
                    }
                });
            }
        });
        
        // Convert to array and sort by probability
        return Array.from(conditions.values())
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 3); // Return top 3 most likely conditions
    } catch (error) {
        console.error('Error in processSymptoms:', error);
        return []; // Return empty array instead of throwing
    }
}
app.use(express.static(__dirname)); 

app.post('/api/appointments', (req, res) => {
    const newAppointment = req.body;

    fs.readFile(FIL_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading file');

        let appointments = [];
        if (data) appointments = JSON.parse(data);

        appointments.push(newAppointment);

        fs.writeFile(FIL_PATH, JSON.stringify(appointments, null, 2), err => {
            if (err) return res.status(500).send('Error writing file');
            res.status(200).send({ message: 'Appointment saved successfully' });
        });
    });
});

// Retrieve appointments
app.get('/api/appointments', (req, res) => {
    fs.readFile(FIL_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading file');
        const appointments = data ? JSON.parse(data) : [];
        res.json(appointments);
    });
});


app.get("/searchMedicine", (req, res) => {
    const name = req.query.name?.toLowerCase();
    if (!name) return res.status(400).json({ message: "No name provided." });

    fs.readFile("medic.json", "utf8", (err, data) => {
        if (err) return res.status(500).json({ message: "Error reading file." });

        const medicines = JSON.parse(data);
        const found = medicines.find(m => m.name.toLowerCase() === name);

        if (found) {
            res.json({ found: true, ...found });
        } else {
            res.json({ found: false });
        }
    });
});

// Ensure messages.json exists
if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([]));
}

// Read messages.json safely
let messages = [];
try {
    const rawData = fs.readFileSync(FILE_PATH, "utf8");
    messages = rawData ? JSON.parse(rawData) : [];
} catch (error) {
    console.error("Error reading messages.json:", error);
    messages = []; // Default to an empty array if file is corrupted
}

//  API to save messages
app.post("/saveMessage", (req, res) => {
    const { message, response } = req.body;
    
    if (!message || !response) {
        return res.status(400).json({ message: "Invalid data!" });
    }

    const newEntry = { message, response, timestamp: Date.now() };

    fs.readFile(FILE_PATH, "utf8", (err, data) => {
        let messages = [];
        if (!err) {
            try {
                messages = JSON.parse(data || "[]"); // Load existing messages
            } catch (parseError) {
                console.error("Error parsing messages.json:", parseError);
                messages = []; // Default to empty if JSON is corrupted
            }
        }

        messages.push(newEntry); // Add new entry

        fs.writeFile(FILE_PATH, JSON.stringify(messages, null, 2), (err) => {
            if (err) {
                console.error("Error saving message:", err);
                return res.status(500).json({ message: "Failed to save message" });
            }
            res.json({ message: "Message saved successfully!" });
        });
    });
});

//  API to retrieve saved messages
app.get("/getMessages", (req, res) => {
    fs.readFile(FILE_PATH, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading messages.json:", err);
            return res.status(500).json({ message: "Failed to retrieve messages" });
        }
        try {
            const messages = JSON.parse(data || "[]");
            res.json(messages);
        } catch (parseError) {
            console.error("Error parsing messages.json:", parseError);
            res.status(500).json({ message: "Data corruption detected!" });
        }
    });
});

//  API to check symptoms
app.get("/checkSymptoms", (req, res) => {
    const userSymptoms = req.query.symptoms?.toLowerCase().split(",").map(s => s.trim());

    fs.readFile("symptoms.json", "utf8", (err, data) => {
        if (err) {
            console.error("Error reading symptoms.json:", err);
            return res.status(500).json({ message: "Error reading symptoms data" });
        }

        try {
            const conditions = JSON.parse(data); // Make sure this is an array of conditions
            const matches = [];

            for (const condition of conditions) {
                if (!condition.name || !Array.isArray(condition.symptoms)) continue;

                const matched = condition.symptoms.filter(symptom =>
                    userSymptoms.includes(symptom.toLowerCase())
                );

                if (matched.length > 0) {
                    matches.push({
                        condition: condition.name,
                        matchedSymptoms: matched.length,
                        totalSymptoms: condition.symptoms.length
                    });
                }
            }

            res.json({ conditions: matches });
        } catch (parseError) {
            console.error("Error parsing symptoms.json:", parseError);
            res.status(500).json({ message: "Error parsing symptoms data" });
        }
    });
});


app.get("/", (req, res) => {
    res.send("Server is running! Use POST /saveMessage to store data and GET /getMessages to retrieve.");
});

app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});
