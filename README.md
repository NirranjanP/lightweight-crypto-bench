Crypto Benchmark Dashboard
Lightweight Cipher Performance Analyzer

A full-stack, high-precision benchmarking tool designed to analyze and compare the performance of Lightweight Cryptography (LWC) algorithms against the industry standard (AES). This project bridges a modern React web interface with a bare-metal C cryptography engine to measure raw CPU cycles, execution time, and theoretical hardware constraints.

🚀 Features
⚡ Single Benchmark Engine: Execute real-time encryptions using bare-metal C binaries. Instantly calculates high-precision metrics including Cycles per Byte (CPB), execution time (ms), and total CPU cycles, while verifying the ciphertext (Hex) and decrypted output.

⚖️ Apples-to-Apples Comparison: Runs all four algorithms simultaneously against a normalized data payload (1.6 MB) to visually demonstrate the performance gap between software-optimized and hardware-optimized ciphers.

🎛️ Hardware Time Simulator: An interactive execution time simulator that estimates real-world performance based on physical constraints. Adjust the Data Size (KB) and Target Clock Speed (MHz) to see how these algorithms would perform on resource-constrained embedded systems and IoT devices.

🧠 The Cryptography Engine
The backend engine is written entirely in C to ensure exact memory control and cycle-accurate performance tracking using the __rdtsc() CPU intrinsic.

AES-128: The global standard (SPN architecture). Blistering fast in software, but mathematically heavy and requires a larger dynamic RAM footprint.

Speck (128/128): NSA-designed lightweight cipher utilizing an ARX (Addition/Rotation/XOR) architecture. Extremely fast in software benchmarks due to native CPU instruction compatibility.

PRESENT (80-bit): An ultra-lightweight hardware SPN cipher. Features a tiny 8-byte ROM footprint and relies on a physical wiring Permutation Layer (pLayer).

Ascon-128: The NIST Lightweight Cryptography standard winner (2023). Utilizes a Sponge construction to provide both encryption and authentication (AEAD) with an incredibly small dynamic memory state.

🛠️ Tech Stack
Frontend (Client)

React.js (Vite)

Tailwind CSS (Custom Cyberpunk/Neon UI theme)

Recharts (Data Visualization & Logarithmic Graphs)

Backend (Server & Bridge)

Node.js & Express.js (REST API)

Custom build.js compiler script (Automated GCC binary generation)

Low-Level Core

C (Standard Library, Windows API for high-resolution timing, GCC Compiler)

⚙️ Installation & Setup
Prerequisites
Node.js (v16+)

GCC (MinGW for Windows or build-essential for Linux) installed and added to your system PATH.

1. Setup the Backend
The backend utilizes a custom script to automatically compile the C files before booting the Express server.

Bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Compile the C engine and start the Express server
npm run dev
You should see four green checkmarks confirming the C compilation, followed by Server is running on http://localhost:5000.

2. Setup the Frontend
Open a new terminal window and start the Vite development server.

Bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the React UI
npm run dev
3. Usage
Navigate to http://localhost:3000 in your browser.

Select an algorithm and input a test string (max 16 chars) to verify the cryptography bridge.
Navigate to the Compare All tab to view the normalized performance bar charts.
Use the Time Simulator to visualize the asymptotic performance curves and theoretical hardware limits.
