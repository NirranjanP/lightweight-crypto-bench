#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#include <windows.h>   // For high-resolution time (QueryPerformanceCounter)
#include <x86intrin.h> // For high-resolution CPU cycle counting (__rdtsc)
// ==========================================
// 1. S-Boxes (Substitution Boxes)
// ==========================================
const uint8_t SBOX[16] = {
    0xC, 0x5, 0x6, 0xB, 0x9, 0x0, 0xA, 0xD,
    0x3, 0xE, 0xF, 0x8, 0x4, 0x7, 0x1, 0x2};

const uint8_t INV_SBOX[16] = {
    0x5, 0xE, 0xF, 0x8, 0xC, 0x1, 0x2, 0xD,
    0xB, 0x4, 0x6, 0x3, 0x0, 0x7, 0x9, 0xA};

// ==========================================
// 2. Layer Operations
// ==========================================
uint64_t present_sbox_layer(uint64_t state, const uint8_t box[16])
{
    uint64_t out = 0;
    for (int i = 0; i < 16; i++)
    {
        uint8_t nibble = (state >> (i * 4)) & 0xF;
        out |= ((uint64_t)box[nibble] << (i * 4));
    }
    return out;
}

// The notorious Permutation Layer.
// Fast in hardware (just wires), extremely slow in software.
uint64_t present_player(uint64_t state)
{
    uint64_t out = 0;
    for (int i = 0; i < 64; i++)
    {
        if ((state >> i) & 1)
        {
            int pos = (i == 63) ? 63 : (16 * i) % 63;
            out |= (1ULL << pos);
        }
    }
    return out;
}

uint64_t present_inv_player(uint64_t state)
{
    uint64_t out = 0;
    for (int i = 0; i < 64; i++)
    {
        if ((state >> i) & 1)
        {
            int pos = (i == 63) ? 63 : (4 * i) % 63;
            out |= (1ULL << pos);
        }
    }
    return out;
}

// ==========================================
// 3. Key Schedule (80-bit Key)
// ==========================================
void present_expand_key(uint64_t k64, uint16_t k16, uint64_t round_keys[32])
{
    for (int r = 1; r <= 32; r++)
    {
        // Extract the 64-bit round key
        round_keys[r - 1] = k64;

        // Step 1: Rotate left by 61 bits
        uint64_t temp64 = k64;
        uint16_t temp16 = k16;
        k64 = (temp64 << 61) | ((uint64_t)temp16 << 45) | (temp64 >> 19);
        k16 = (temp64 >> 3) & 0xFFFF;

        // Step 2: Pass the top 4 bits through the S-Box
        uint8_t msb = k64 >> 60;
        k64 = (k64 & 0x0FFFFFFFFFFFFFFF) | ((uint64_t)SBOX[msb] << 60);

        // Step 3: XOR round counter (r) into bits k19...k15
        k16 ^= (r & 0x01) << 15;
        k64 ^= (r >> 1);
    }
}

// ==========================================
// 4. Core Algorithm
// ==========================================
uint64_t present_encrypt(uint64_t state, uint64_t round_keys[32])
{
    for (int i = 0; i < 31; i++)
    {
        state ^= round_keys[i];
        state = present_sbox_layer(state, SBOX);
        state = present_player(state);
    }
    state ^= round_keys[31];
    return state;
}

uint64_t present_decrypt(uint64_t state, uint64_t round_keys[32])
{
    for (int i = 31; i > 0; i--)
    {
        state ^= round_keys[i];
        state = present_inv_player(state);
        state = present_sbox_layer(state, INV_SBOX);
    }
    state ^= round_keys[0];
    return state;
}

// ==========================================
// 5. Test Execution
// ==========================================
int main(int argc, char *argv[])
{
    // 1. Ensure Node.js passed the file path
    if (argc != 2)
    {
        printf("{\"error\": \"Missing file path argument\"}\n");
        return 1;
    }

    // 2. Read exactly 8 bytes from the text file (PRESENT's block size)
    char buffer[8] = {0};
    FILE *file = fopen(argv[1], "r");
    if (file)
    {
        fread(buffer, 1, 8, file);
        fclose(file);
    }
    else
    {
        printf("{\"error\": \"Could not open input file\"}\n");
        return 1;
    }

    // 3. Convert the 8-byte string directly into a single 64-bit integer
    uint64_t plaintext = 0;
    memcpy(&plaintext, buffer, 8);

    // NEW: Save a pristine copy for the JSON output later!
    uint64_t original_plaintext = plaintext;

    // 80-bit Key
    uint64_t key_high = 0x0000000000000000;
    uint16_t key_low = 0x0000;
    uint64_t round_keys[32];

    present_expand_key(key_high, key_low, round_keys);

    // ==========================================
    // BENCHMARK SETUP
    // ==========================================
    int iterations = 100000;
    uint64_t ciphertext = 0;

    LARGE_INTEGER frequency, start_time, end_time;
    QueryPerformanceFrequency(&frequency);

    // ==========================================
    // START TIMERS
    // ==========================================
    QueryPerformanceCounter(&start_time);
    uint64_t start_cycles = __rdtsc();

    for (int i = 0; i < iterations; i++)
    {
        ciphertext = present_encrypt(plaintext, round_keys);

        // Force the compiler to execute the loop
        plaintext ^= ciphertext;
    }

    // ==========================================
    // STOP TIMERS
    // ==========================================
    uint64_t end_cycles = __rdtsc();
    QueryPerformanceCounter(&end_time);

    uint64_t total_cycles = end_cycles - start_cycles;

    // VERY IMPORTANT: PRESENT block size is 8 bytes, so we divide by 8.0!
    double cycles_per_byte = (double)total_cycles / (iterations * 8.0);
    double time_taken_ms = ((double)(end_time.QuadPart - start_time.QuadPart) * 1000.0) / frequency.QuadPart;

    // ==========================================
    // THE "CLEAN RUN" FOR THE DASHBOARD UI
    // ==========================================
    // Use the pristine copy we saved at the top
    uint64_t final_ciphertext = present_encrypt(original_plaintext, round_keys);
    uint64_t final_decrypted = present_decrypt(final_ciphertext, round_keys);

    // Convert the 64-bit decrypted data back into a readable C-string
    char decrypted_string[9];
    memcpy(decrypted_string, &final_decrypted, 8);
    decrypted_string[8] = '\0'; // Add null terminator

    // ==========================================
    // JSON OUTPUT (For Node.js)
    // ==========================================
    printf("{\n");
    printf("  \"algorithm\": \"PRESENT\",\n");
    printf("  \"iterations\": %d,\n", iterations);
    printf("  \"total_cycles\": %I64u,\n", total_cycles);
    printf("  \"cycles_per_byte\": %.2f,\n", cycles_per_byte);
    printf("  \"time_ms\": %.3f,\n", time_taken_ms);
    printf("  \"ciphertext_hex\": \"%016I64x\",\n", final_ciphertext);
    printf("  \"decrypted_text\": \"%s\"\n", decrypted_string);
    printf("}\n");

    return 0;
}