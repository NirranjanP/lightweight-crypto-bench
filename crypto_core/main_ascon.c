#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#include <windows.h>
#include <x86intrin.h>
#include "api.h" // This usually contains the CRYPTO_ABYTES constant (which is 16)

// Declare the functions (usually done by including ascon.h or api.h)
int crypto_aead_encrypt(unsigned char *c, unsigned long long *clen,
                        const unsigned char *m, unsigned long long mlen,
                        const unsigned char *ad, unsigned long long adlen,
                        const unsigned char *nsec, const unsigned char *npub,
                        const unsigned char *k);
int crypto_aead_decrypt(unsigned char *m, unsigned long long *mlen,
                        unsigned char *nsec, const unsigned char *c,
                        unsigned long long clen, const unsigned char *ad,
                        unsigned long long adlen, const unsigned char *npub,
                        const unsigned char *k);

int main(int argc, char *argv[])
{
    // 1. Ensure Node.js passed the file path
    if (argc != 2)
    {
        printf("{\"error\": \"Missing file path argument\"}\n");
        return 1;
    }

    // 2. Read exactly 16 bytes from the text file
    unsigned char buffer[16] = {0};
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
    unsigned char original_plaintext[16];
    memcpy(original_plaintext, buffer, 16);

    // We use a working plaintext array for the 1 million loops
    unsigned char plaintext[16];
    memcpy(plaintext, buffer, 16);

    // Ascon Requires a 16-byte Key and a 16-byte Nonce
    unsigned char key[16] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
    unsigned char nonce[16] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};

    // Ciphertext must be 32 bytes (16 bytes data + 16 bytes auth tag)
    unsigned char ciphertext[32];
    unsigned long long clen = 0;

    // ==========================================
    // BENCHMARK SETUP
    // ==========================================
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
        crypto_aead_encrypt(ciphertext, &clen, plaintext, 16, NULL, 0, NULL, nonce, key);

        // Force the compiler to run the loop by modifying the next input
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
    unsigned char final_ciphertext[32];
    unsigned long long final_clen = 0;

    // Encrypt the pristine text
    crypto_aead_encrypt(final_ciphertext, &final_clen, original_plaintext, 16, NULL, 0, NULL, nonce, key);

    unsigned char final_decrypted[32];
    unsigned long long dlen = 0;

    // Decrypt it back
    crypto_aead_decrypt(final_decrypted, &dlen, NULL, final_ciphertext, final_clen, NULL, 0, nonce, key);

    // Convert to a printable C-string (we know dlen should be 16)
    char decrypted_string[17];
    memcpy(decrypted_string, final_decrypted, 16);
    decrypted_string[16] = '\0'; // Add null terminator

    // ==========================================
    // JSON OUTPUT (For Node.js)
    // ==========================================
    printf("{\n");
    printf("  \"algorithm\": \"Ascon-128\",\n");
    printf("  \"iterations\": %d,\n", iterations);
    printf("  \"total_cycles\": %I64u,\n", total_cycles);
    printf("  \"cycles_per_byte\": %.2f,\n", cycles_per_byte);
    printf("  \"time_ms\": %.3f,\n", time_taken_ms);

    // Loop to print the 32-byte hex tag
    printf("  \"ciphertext_hex\": \"");
    for (int i = 0; i < final_clen; i++)
    {
        printf("%02x", final_ciphertext[i]);
    }
    printf("\",\n");

    printf("  \"decrypted_text\": \"%s\"\n", decrypted_string);
    printf("}\n");

    return 0;
}