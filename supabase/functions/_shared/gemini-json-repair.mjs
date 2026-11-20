export const GEMINI_JSON_REPAIR_ATTEMPTS = 1;

const REPAIR_INSTRUCTION =
  "PERBAIKAN OTOMATIS: Jawaban sebelumnya tidak dapat diproses sebagai JSON valid. " +
  "Tinjau ulang perintah dan seluruh data awal di atas, lalu susun ulang jawaban lengkap. " +
  "Jangan menyerah. Keluarkan tepat satu objek JSON valid sesuai struktur wajib, tanpa markdown. " +
  "Jawaban pertama: ";

export function buildGeminiJsonPrompt(basePrompt, previous, attempt) {
  const original = String(basePrompt ?? "");
  if (Number(attempt) === 0) return original;
  const previousOutput = String(previous ?? "").slice(0, 12000);
  return original + "\n\n" + REPAIR_INSTRUCTION + previousOutput;
}
