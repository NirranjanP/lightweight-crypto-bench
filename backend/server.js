const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');

const app = express();
const PORT = 5000;

// ==========================================
// Middleware
// ==========================================
// CORS is required so your React app (usually on port 3000 or 5173) 
// is allowed to fetch data from this Express API (on port 5000).
app.use(cors()); 

// Allows Express to read JSON data sent from React (like custom plaintext)
app.use(express.json()); 

// ==========================================
// Binary Mapping Directory
// ==========================================
// This safely maps the string React sends to the actual Windows executable.
const binaries = {
    'speck': 'speck_bin.exe',
    'present': 'present_bin.exe',
    'aes': 'aes_bin.exe',
    'ascon': 'ascon_bin.exe'
};

// ==========================================
// The Core Benchmark API Route
// ==========================================
const fs = require('fs'); // Add this to the top of your file with the other requires

app.post('/api/benchmark', (req, res) => {
    const targetAlgo = req.body.algorithm?.toLowerCase();
    // Grab the custom text, or default to our classic string if none is provided
    const customText = req.body.text || "Hello Professor!"; 

    if (!targetAlgo || !binaries[targetAlgo]) {
        return res.status(400).json({ error: "Invalid or missing algorithm specified." });
    }

    // 1. Write the text to a temporary file
    const tempFilePath = path.join(__dirname, 'temp', 'input.txt');
    fs.writeFileSync(tempFilePath, customText, 'utf8');

    const binaryPath = path.join(__dirname, '../crypto_core', binaries[targetAlgo]);
    console.log(`[API] Triggering benchmark for: ${targetAlgo.toUpperCase()}`);

    // 2. Pass the file path as an argument to the C program
    execFile(binaryPath, [tempFilePath], (error, stdout, stderr) => {
        if (error) {
            console.error(`[API] Execution Error:`, error);
            return res.status(500).json({ error: "Failed to execute benchmark." });
        }

        try {
            const benchmarkData = JSON.parse(stdout);
            res.json(benchmarkData);
        } catch (parseError) {
            console.error("Raw C Output:", stdout);
            res.status(500).json({ error: "Invalid JSON output from C program." });
        }
    });
});

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Ready to bridge the React Dashboard to C!`);
    console.log(`=========================================`);
});