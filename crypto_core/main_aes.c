#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#include <windows.h>   // For high-resolution time (QueryPerformanceCounter)
#include <x86intrin.h> // For high-resolution CPU cycle counting (__rdtsc)
// Include the tiny-AES-c header
#include "aes.h"

int main(int argc, char *argv[])
{
    // 1. Ensure Node.js passed the file path
    if (argc != 2)
    {
        printf("{\"error\": \"Missing file path argument\"}\n");
        return 1;
    }

    // 2. Read exactly 16 bytes from the text file
    uint8_t buffer[16] = {0};
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

    // 3. Keep a pristine copy for the JSON output later!
    uint8_t original_plaintext[16];
    memcpy(original_plaintext, buffer, 16);

    // AES-128 Key (16 bytes)
    uint8_t key[16] = {0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
                       0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c};

    struct AES_ctx ctx;
    AES_init_ctx(&ctx, key);

    // ==========================================
    // BENCHMARK SETUP
    // ==========================================
    int iterations = 50000; // Kept at 50k to match PRESENT and keep the API fast
    LARGE_INTEGER frequency, start_time, end_time;
    QueryPerformanceFrequency(&frequency);

    // ==========================================
    // START TIMERS
    // ==========================================
    QueryPerformanceCounter(&start_time);
    uint64_t start_cycles = __rdtsc();

    for (int i = 0; i < iterations; i++)
    {
        // tiny-AES-c does encryption IN-PLACE.
        // It modifies the 'buffer' variable directly. Because the buffer changes
        // every loop, the compiler is forced to run it without skipping!
        AES_ECB_encrypt(&ctx, buffer);
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
    // Setup a fresh buffer using our pristine copy
    uint8_t final_buffer[16];
    memcpy(final_buffer, original_plaintext, 16);

    // Encrypt
    AES_ECB_encrypt(&ctx, final_buffer);

    // Save a copy of the ciphertext before we decrypt it
    uint8_t final_ciphertext[16];
    memcpy(final_ciphertext, final_buffer, 16);

    // Decrypt
    AES_ECB_decrypt(&ctx, final_buffer);

    // Convert to a printable C-string
    char decrypted_string[17];
    memcpy(decrypted_string, final_buffer, 16);
    decrypted_string[16] = '\0'; // Add null terminator

    // ==========================================
    // JSON OUTPUT (For Node.js)
    // ==========================================
    printf("{\n");
    printf("  \"algorithm\": \"AES-128\",\n");
    printf("  \"iterations\": %d,\n", iterations);
    printf("  \"total_cycles\": %I64u,\n", total_cycles);
    printf("  \"cycles_per_byte\": %.2f,\n", cycles_per_byte);
    printf("  \"time_ms\": %.3f,\n", time_taken_ms);

    // Because AES is an array of bytes, we have to loop to print the hex
    printf("  \"ciphertext_hex\": \"");
    for (int i = 0; i < 16; i++)
    {
        printf("%02x", final_ciphertext[i]);
    }
    printf("\",\n");

    printf("  \"decrypted_text\": \"%s\"\n", decrypted_string);
    printf("}\n");

    return 0;
}