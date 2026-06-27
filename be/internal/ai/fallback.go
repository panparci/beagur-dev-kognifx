package ai

import (
	"fmt"
	"strings"

	"bea-guru-api/internal/store"
)

func FallbackChat(message, ragContext string) GenerateResult {
	q := strings.ToLower(message)
	var response string

	switch {
	case ContainsAny(q, "syarat", "daftar", "penerima"):
		response = `Halo! Berdasarkan Dokumen SOP Penerima Manfaat Bea Guru, persyaratan utama untuk mendaftar adalah:
1. Berstatus **Guru Honorer** atau guru sukarelawan aktif.
2. Memiliki kompensasi bulanan di **bawah Rp 1.500.000**.
3. Diusulkan atau disetujui oleh Kepala Sekolah bertindak selaku **Validator**.
4. Melampirkan identitas diri dan foto aktivitas mengajar Anda secara langsung di kelas.

Apakah ada bagian persyaratan ini yang ingin Anda tanyakan lebih detail?`
	case ContainsAny(q, "potong", "biaya", "admin", "operasional"):
		response = `Kami berkomitmen memegang amanah penyaluran 100% tanpa potongan.

Semua donasi dari donatur publik **seluruhnya (100%) langsung masuk ke nomor rekening guru asuh**.
Biaya operasional server, administrasi bank, dan marketing Yayasan disokong sepenuhnya oleh dana hibah kemandirian Mitra Korporat CSR Indonesia terpisah.`
	case ContainsAny(q, "donasi", "cara membantu", "rutin"):
		response = `Terima kasih atas kebaikan mulia Anda! Anda dapat berdonasi sekali waktu atau menjadi donatur rutin bulanan (minimal Rp 50.000/bulan) dan dipasangkan dengan guru asuh.`
	case ContainsAny(q, "tugas validator", "kepala sekolah", "peran validator"):
		response = `Peran **Validator (Kepala Sekolah)** mencakup verifikasi profil guru, persetujuan kelayakan, dan validasi laporan bulanan sebelum penyaluran dana.`
	case ContainsAny(q, "helo", "halo", "hi", "pagi", "siang", "sore", "assalamu"):
		response = `Halo! Saya adalah Asisten Virtual Yayasan Bea Guru Indonesia. Saya siap membantu seputar pendaftaran guru, transparansi keuangan, dan panduan donasi.`
	case ragContext != "":
		clean := strings.ReplaceAll(ragContext, "[DOKUMEN JARINGAN:", "")
		response = fmt.Sprintf("Berikut penjelasan berdasarkan catatan resmi dokumen Bea Guru:\n\n%s\n\nAda hal lain yang bisa saya bantu?", strings.TrimSpace(clean))
	default:
		response = `Terima kasih atas pertanyaannya! Anda bisa bertanya seputar cara mendaftar program, persyaratan kelayakan, transparansi penyaluran dana 100%, atau cara donasi bulanan.`
	}

	return GenerateResult{
		Text:         response,
		InputTokens:  estimateTokens(message) + 40,
		OutputTokens: estimateTokens(response),
		Model:        "mock-local-model",
	}
}

func FallbackStory(jobTitle string, years int, salary int64, draft string) string {
	return fmt.Sprintf(`Saya adalah %s yang telah mengabdi selama %d tahun demi mencerdaskan generasi penerus bangsa. Upah honorer saya hanya Rp %s per bulan.

"%s"

Melalui program Bea Guru, saya menaruh harapan bantuan ini akan meringankan beban keluarga sekaligus mendukung inovasi pembelajaran bagi murid-murid saya. Terima kasih kepada para donatur mulia.`,
		jobTitle, years, formatIDR(salary), draft)
}

func FallbackReport(subject, progress, benefit string) string {
	return fmt.Sprintf(`Bulan ini, saya melaksanakan kegiatan pembelajaran berfokus pada "%s". Saya sangat bahagia melihat "%s".

Dana donatur telah kami pergunakan untuk "%s". Terima kasih setulusnya kepada donatur asuh Bea Guru.`,
		subject, progress, benefit)
}

func BuildRagContext(docs []store.RagDocument) (string, []string) {
	if len(docs) == 0 {
		return "", nil
	}
	parts := make([]string, 0, len(docs))
	titles := make([]string, 0, len(docs))
	for _, doc := range docs {
		parts = append(parts, fmt.Sprintf("[DOKUMEN JARINGAN: %s]\n%s", doc.Title, doc.Content))
		titles = append(titles, doc.Title)
	}
	return strings.Join(parts, "\n\n"), titles
}

func formatIDR(amount int64) string {
	s := fmt.Sprintf("%d", amount)
	var b strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteRune('.')
		}
		b.WriteRune(c)
	}
	return b.String()
}
