const { exec } = require('child_process');
const path = require('path');
const cryptoFolder = path.join(__dirname, '../crypto_core');

const commands = [
    { name: "Ascon", cmd: "gcc main_ascon.c aead.c printstate.c -o ascon_bin.exe" },
    { name: "Speck", cmd: "gcc speck.c -o speck_bin.exe" },
    { name: "PRESENT", cmd: "gcc present.c -o present_bin.exe" },
    { name: "AES", cmd: "gcc main_aes.c aes.c -o aes_bin.exe" }
];

console.log("Starting compiler...\n");

// Loop through and compile each one
commands.forEach(algo => {
    exec(algo.cmd, { cwd: cryptoFolder }, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Failed to compile ${algo.name}:`);
            console.error(stderr); // This prints the exact C error if you make a typo
        } else {
            console.log(`✅ ${algo.name} compiled successfully!`);
        }
    });
});