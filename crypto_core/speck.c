#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <windows.h>   // For high-resolution time (QueryPerformanceCounter)
#include <x86intrin.h> // For high-resolution CPU cycle counting (__rdtsc)

// Macros for fast bitwise rotation (ARX relies heavily on these)
#define ROR(x, r) ((x >> r) | (x << (64 - r)))
#define ROL(x, r) ((x << r) | (x >> (64 - r)))

// ==========================================
// 1. Key Schedule (Expands a 128-bit key into 32 round keys)
// ==========================================
void speck_expand_key(uint64_t K[2], uint64_t round_keys[32])
{
    uint64_t b = K[0]; // Right word of key
    uint64_t a = K[1]; // Left word of key

    round_keys[0] = b;
    for (unsigned i = 0; i < 31; i++)
    {
        a = ROR(a, 8);
        a += b;
        a ^= i;
        b = ROL(b, 3);
        b ^= a;
        round_keys[i + 1] = b;
    }
}

// ==========================================
// 2. Encryption (32 Rounds of ARX)
// ==========================================
void speck_encrypt(uint64_t pt[2], uint64_t ct[2], uint64_t round_keys[32])
{
    uint64_t x = pt[1]; // Left word
    uint64_t y = pt[0]; // Right word

    for (int i = 0; i < 32; i++)
    {
        x = ROR(x, 8);
        x += y;
        x ^= round_keys[i];
        y = ROL(y, 3);
        y ^= x;
    }

    ct[1] = x;
    ct[0] = y;
}

// ==========================================
// 3. Decryption (Reverse the ARX operations)
// ==========================================
void speck_decrypt(uint64_t ct[2], uint64_t pt[2], uint64_t round_keys[32])
{
    uint64_t x = ct[1];
    uint64_t y = ct[0];

    for (int i = 31; i >= 0; i--)
    {
        y ^= x;
        y = ROR(y, 3);
        x ^= round_keys[i];
        x -= y;
        x = ROL(x, 8);
    }

    pt[1] = x;
    pt[0] = y;
}

// ==========================================
// 4. Test execution
// ==========================================
int main(int argc, char *argv[])
{
    // 1. Ensure Node.js passed the file path
    if (argc != 2)
    {
        printf("{\"error\": \"Missing file path argument\"}\n");
        return 1;
    }

    // 2. Read up to 16 bytes from the text file
    char buffer[16] = {0}; // Fills with null terminators (0x00) automatically
    FILE *file = fopen(argv[1], "r");
    if (file)
    {
        fread(buffer, 1, 16, file);
        fclose(file);
    }
    else
    {
        printf("{\"error\": \"Could not open input file\"}\n");
        return 1;
    }

    // 3. Convert the string buffer into our two 64-bit integers
    uint64_t plaintext[2] = {0, 0};
    memcpy(&plaintext[1], buffer, 8);     // First 8 bytes go into left word
    memcpy(&plaintext[0], buffer + 8, 8); // Next 8 bytes go into right word

    // NEW: Save a pristine copy for the JSON output later!
    uint64_t original_plaintext[2];
    original_plaintext[0] = plaintext[0];
    original_plaintext[1] = plaintext[1];

    uint64_t key[2] = {0x0f0e0d0c0b0a0908, 0x0706050403020100};
    uint64_t round_keys[32];
    uint64_t ciphertext[2];

    speck_expand_key(key, round_keys);

    speck_expand_key(key, round_keys);

    // ==========================================
    // BENCHMARK SETUP
    // ==========================================
    // 1 block is too fast to measure. We will encrypt 1 million blocks.
    // 1 million blocks * 16 bytes = ~16 Megabytes of data processed.
    int iterations = 50000;

    LARGE_INTEGER frequency, start_time, end_time;
    QueryPerformanceFrequency(&frequency);

    // ==========================================
    // START TIMERS
    // ==========================================
    QueryPerformanceCounter(&start_time);
    uint64_t start_cycles = __rdtsc();

    for (int i = 0; i < iterations; i++)
    {
        speck_encrypt(plaintext, ciphertext, round_keys);

        // This trick forces the compiler to actually execute the loop
        // by making the next input depend on the current output.
        plaintext[0] ^= ciphertext[0];
    }

    // ==========================================
    // STOP TIMERS
    // ==========================================
    uint64_t end_cycles = __rdtsc();
    QueryPerformanceCounter(&end_time);

    uint64_t total_cycles = end_cycles - start_cycles;
    double cycles_per_byte = (double)total_cycles / (iterations * 16.0);
    double time_taken_ms = ((double)(end_time.QuadPart - start_time.QuadPart) * 1000.0) / frequency.QuadPart;

    // ==========================================
    // THE "CLEAN RUN" FOR THE DASHBOARD UI
    // ==========================================
    // 1. Reset back to the original plaintext
    uint64_t final_ciphertext[2];
    uint64_t final_decrypted[2];

    // 2. Do one clean encrypt and decrypt
    speck_encrypt(original_plaintext, final_ciphertext, round_keys);
    speck_decrypt(final_ciphertext, final_decrypted, round_keys);

    // 3. Convert the 64-bit decrypted data back into a readable C-string
    char decrypted_string[17];
    memcpy(&decrypted_string[0], &final_decrypted[1], 8); // Put Left Half at the start!
    memcpy(&decrypted_string[8], &final_decrypted[0], 8); // Put Right Half at the end!
    decrypted_string[16] = '\0';                          // Add null terminator for safety

    // ==========================================
    // JSON OUTPUT (For Node.js)
    // ==========================================
    // We break the printf into multiple lines to make it easier to read
    printf("{\n");
    printf("  \"algorithm\": \"Speck\",\n");
    printf("  \"iterations\": %d,\n", iterations);
    printf("  \"total_cycles\": %I64u,\n", total_cycles);
    printf("  \"cycles_per_byte\": %.2f,\n", cycles_per_byte);
    printf("  \"time_ms\": %.3f,\n", time_taken_ms);

    // Print the Hex string for the Hacker UI
    printf("  \"ciphertext_hex\": \"%016I64x%016I64x\",\n", final_ciphertext[1], final_ciphertext[0]);

    // Print the Decrypted string for the Admin UI
    printf("  \"decrypted_text\": \"%s\"\n", decrypted_string);
    printf("}\n");

    return 0;
}