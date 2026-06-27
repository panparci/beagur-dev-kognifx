package notify

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

const (
	colorHeaderBlue = "#3B54D3"
	colorFooterGreen = "#C8E600"
	colorBodyText   = "#1A1A1A"
	colorMuted      = "#666666"
)

func formatIDR(amount int64) string {
	negative := amount < 0
	if negative {
		amount = -amount
	}
	s := strconv.FormatInt(amount, 10)
	var b strings.Builder
	for i, r := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte('.')
		}
		b.WriteRune(r)
	}
	if negative {
		return "-Rp " + b.String()
	}
	return "Rp " + b.String()
}

func escapeHTML(s string) string {
	replacer := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		`"`, "&quot;",
	)
	return replacer.Replace(s)
}

func greetingHi(name string) string {
	return fmt.Sprintf("Hi %s,", strings.ToUpper(escapeHTML(strings.TrimSpace(name))))
}

func siteBase(portalURL string) string {
	parsed, err := url.Parse(portalURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return strings.TrimRight(portalURL, "/")
	}
	return parsed.Scheme + "://" + parsed.Host
}

type detailRow struct {
	Label string
	Value string
}

type emailContent struct {
	Headline     string
	Greeting     string
	SectionTitle string
	Rows         []detailRow
	MessageHTML  string
	CTALabel     string
	CTAURL       string
	SignOff      string
	PortalURL    string
}

func headerGreenAccent() string {
	// Dekorasi hijau kanan header (email-safe table, tanpa SVG)
	return `<table role="presentation" cellspacing="0" cellpadding="0" align="right" style="margin:0">
<tr>
  <td style="width:36px;height:36px;background:` + colorFooterGreen + `;border:2px solid #1a1a1a;border-radius:50%"></td>
  <td style="width:22px;height:64px;background:` + colorFooterGreen + `;border:2px solid #1a1a1a;border-radius:18px"></td>
</tr>
<tr>
  <td colspan="2" style="width:58px;height:28px;background:` + colorFooterGreen + `;border:2px solid #1a1a1a;border-radius:14px"></td>
</tr>
</table>`
}

func splitHeadline(headline string) (line1, line2 string) {
	headline = strings.TrimSpace(headline)
	if idx := strings.Index(headline, "!"); idx >= 0 && idx < len(headline)-1 {
		rest := strings.TrimSpace(headline[idx+1:])
		if rest != "" {
			return strings.TrimSpace(headline[:idx+1]), rest
		}
	}
	return headline, ""
}

func renderEmail(c emailContent) string {
	rowsHTML := ""
	for _, row := range c.Rows {
		rowsHTML += fmt.Sprintf(`
<tr>
  <td style="padding:14px 0;border-bottom:1px solid #ececec;color:%s;font-size:14px;text-align:left">%s</td>
  <td style="padding:14px 0;border-bottom:1px solid #ececec;font-size:14px;font-weight:700;text-align:right;color:%s">%s</td>
</tr>`, colorMuted, escapeHTML(row.Label), colorBodyText, escapeHTML(row.Value))
	}

	detailBlock := ""
	if c.SectionTitle != "" && len(c.Rows) > 0 {
		detailBlock = fmt.Sprintf(`
<p style="margin:0 0 16px;font-size:18px;font-weight:700;text-align:left;color:%s">%s</p>
<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="margin:0 0 28px">%s</table>`,
			colorBodyText, escapeHTML(c.SectionTitle), rowsHTML)
	}

	cta := ""
	if c.CTALabel != "" && c.CTAURL != "" {
		cta = fmt.Sprintf(`
<p style="margin:28px 0 0;text-align:left">
  <a href="%s" style="display:inline-block;background:%s;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px">%s</a>
</p>`, escapeHTML(c.CTAURL), colorHeaderBlue, escapeHTML(c.CTALabel))
	}

	message := c.MessageHTML
	if message != "" {
		message = fmt.Sprintf(`<div style="margin:0 0 8px;font-size:15px;line-height:1.7;color:%s;text-align:left">%s</div>`, colorBodyText, message)
	}

	signOff := c.SignOff
	if signOff == "" {
		signOff = "Salam hangat,<br><strong>Tim Bea Guru</strong>"
	}

	greeting := c.Greeting
	if greeting != "" {
		greeting = fmt.Sprintf(`<p style="margin:0 0 24px;font-size:16px;font-weight:700;text-align:left;color:%s">%s</p>`, colorBodyText, greeting)
	}

	headline1, headline2 := splitHeadline(c.Headline)
	headlineHTML := fmt.Sprintf(`<p style="margin:0;font-size:28px;line-height:1.15;font-weight:800;color:#fff;text-align:left">%s</p>`, escapeHTML(headline1))
	if headline2 != "" {
		headlineHTML += fmt.Sprintf(`<p style="margin:8px 0 0;font-size:22px;line-height:1.25;font-weight:800;color:#fff;text-align:left">%s</p>`, escapeHTML(headline2))
	}

	headerBlock := fmt.Sprintf(`
<tr><td style="background:%s;padding:0;overflow:hidden">
  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding:32px 20px 32px 28px;vertical-align:middle;text-align:left;width:100%%">%s</td>
      <td style="padding:16px 12px 0 0;vertical-align:bottom;width:90px;text-align:right">%s</td>
    </tr>
  </table>
</td></tr>`, colorHeaderBlue, headlineHTML, headerGreenAccent())

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>%s</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:%s">
  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f4f4;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;overflow:hidden">

        %s

        <!-- Body -->
        <tr><td style="padding:32px 28px 28px">
          %s
          %s
          %s
          %s
          <p style="margin:32px 0 0;font-size:15px;line-height:1.7;color:%s;text-align:left">%s</p>
        </td></tr>

        <!-- Disclaimer -->
        <tr><td style="padding:0 28px 24px">
          <div style="background:#f5f5f5;border-radius:8px;padding:16px 18px;font-size:12px;line-height:1.6;color:%s;text-align:left">
            Email ini dikirim otomatis oleh Bea Guru. Jangan bagikan password atau data sensitif lewat email.
            Jika Anda tidak merasa mendaftar, abaikan pesan ini.
          </div>
        </td></tr>

        <!-- Footer hijau -->
        <tr><td style="background:%s;padding:28px 24px;text-align:left">
          <p style="margin:0 0 8px;font-size:16px;font-weight:800;color:#1a1a1a">Bea Guru Indonesia</p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#2f302c;text-align:left">
            Program bantuan untuk guru honorer terverifikasi — transparan, terpercaya, berdampak.
          </p>
          <p style="margin:0;font-size:13px;color:#2f302c;text-align:left">
            <a href="%s" style="color:#1a1a1a;font-weight:700;text-decoration:underline">Kunjungi bea-guru.id</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
		escapeHTML(c.Headline),
		colorBodyText,
		headerBlock,
		greeting,
		detailBlock,
		message,
		cta,
		colorBodyText, signOff,
		colorMuted,
		colorFooterGreen,
		escapeHTML(siteBase(c.PortalURL)),
	)
}

func accountActivatedHTML(name, roleLabel, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Selamat! Verifikasi akun Bea Guru kamu berhasil!",
		Greeting:     greetingHi(name),
		SectionTitle: "Detail Akun",
		Rows: []detailRow{
			{Label: "Peran", Value: roleLabel},
			{Label: "Status", Value: "Aktif"},
		},
		MessageHTML: `Akun Anda sudah diverifikasi tim yayasan. Anda bisa masuk ke portal dan mulai menggunakan fitur sesuai peran.`,
		CTALabel:    "Masuk ke Portal",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func accountCreatedHTML(name, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Selamat! Pembuatan akun Bea Guru kamu berhasil!",
		Greeting:     greetingHi(name),
		SectionTitle: "Detail Akun",
		Rows: []detailRow{
			{Label: "Nama", Value: name},
			{Label: "Status", Value: "Akun aktif — pilih peran"},
			{Label: "Langkah berikutnya", Value: "Masuk & pilih peran"},
		},
		MessageHTML: `Terima kasih sudah bergabung di <strong>Bea Guru</strong>.<br>
Pilih peran Anda — guru honorer, kepala sekolah (validator), atau donatur — lalu lengkapi profil di portal.`,
		CTALabel:  "Masuk ke Portal",
		CTAURL:    portalURL,
		PortalURL: portalURL,
	})
}

func donorWelcomeHTML(name, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Akun Donatur Bea Guru Kamu Aktif!",
		Greeting:     greetingHi(name),
		SectionTitle: "Detail Akun",
		Rows: []detailRow{
			{Label: "Peran", Value: "Donatur"},
			{Label: "Status", Value: "Aktif"},
		},
		MessageHTML: `Selamat datang! Anda bisa mulai melihat profil guru terverifikasi dan memberikan dukungan kapan saja.`,
		CTALabel:    "Jelajahi Program",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func pendingVerificationHTML(name, roleLabel, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     fmt.Sprintf("Pendaftaran %s Kamu Diterima!", roleLabel),
		Greeting:     greetingHi(name),
		SectionTitle: "Detail Pendaftaran",
		Rows: []detailRow{
			{Label: "Peran", Value: roleLabel},
			{Label: "Status", Value: "Menunggu verifikasi"},
		},
		MessageHTML: `Tim kami sedang memverifikasi akun Anda. Kami akan kirim email lagi setelah akun aktif.`,
		CTALabel:    "Lihat Status Akun",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func teacherSubmittedHTML(teacherName, school, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Profil Guru Baru Menunggu Validasi!",
		Greeting:     "Hi Validator,",
		SectionTitle: "Detail Pengajuan",
		Rows: []detailRow{
			{Label: "Nama guru", Value: teacherName},
			{Label: "Sekolah", Value: school},
			{Label: "Status", Value: "Menunggu validasi"},
		},
		MessageHTML: `Silakan tinjau profil guru di portal validator, lalu setujui atau tolak pengajuan ini.`,
		CTALabel:    "Buka Portal Validator",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func validatorApprovedHTML(teacherName, school, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Profil Guru Siap Disetujui Yayasan!",
		Greeting:     "Hi Admin,",
		SectionTitle: "Detail Profil",
		Rows: []detailRow{
			{Label: "Nama guru", Value: teacherName},
			{Label: "Sekolah", Value: school},
			{Label: "Status", Value: "Menunggu persetujuan yayasan"},
		},
		MessageHTML: `Validator sekolah sudah menyetujui. Mohon tinjau dan berikan persetujuan akhir di portal admin.`,
		CTALabel:    "Buka Portal Admin",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func teacherRejectedHTML(name, byLabel, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Profil Guru Bea Guru Perlu Diperbaiki",
		Greeting:     greetingHi(name),
		SectionTitle: "Detail Status",
		Rows: []detailRow{
			{Label: "Status", Value: "Belum disetujui"},
			{Label: "Ditinjau oleh", Value: byLabel},
		},
		MessageHTML: `Mohon maaf, profil Anda belum dapat disetujui. Perbaiki data di portal dan ajukan ulang bila diperlukan.`,
		CTALabel:    "Buka Portal Guru",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func teacherApprovedHTML(name, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Profil Guru Bea Guru Kamu Disetujui!",
		Greeting:     greetingHi(name),
		SectionTitle: "Detail Status",
		Rows: []detailRow{
			{Label: "Status profil", Value: "Disetujui"},
			{Label: "Visibilitas", Value: "Ditampilkan ke donatur"},
		},
		MessageHTML: `Selamat! Profil Anda siap ditampilkan kepada donatur. Terima kasih mengajar di garis depan pendidikan Indonesia.`,
		CTALabel:    "Buka Portal Guru",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func teacherPendingAdminHTML(name, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Profil Guru Kamu Disetujui Kepala Sekolah!",
		Greeting:     greetingHi(name),
		SectionTitle: "Detail Status",
		Rows: []detailRow{
			{Label: "Validasi sekolah", Value: "Disetujui"},
			{Label: "Langkah berikutnya", Value: "Review tim yayasan"},
		},
		MessageHTML: `Profil Anda sudah disetujui kepala sekolah dan sedang ditinjau tim yayasan. Kami akan kirim email lagi setelah disetujui final.`,
		CTALabel:    "Lihat Status Profil",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func disbursementPaidHTML(teacherName, amount, description, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Penyaluran Dana Bea Guru Kamu Berhasil!",
		Greeting:     greetingHi(teacherName),
		SectionTitle: "Detail Penyaluran",
		Rows: []detailRow{
			{Label: "Nominal", Value: amount},
			{Label: "Keterangan", Value: description},
			{Label: "Status", Value: "Ditransfer ke rekening terdaftar"},
		},
		MessageHTML: `Dana bantuan Bea Guru telah dicatat dan disalurkan ke rekening Anda. Terima kasih tetap mengajar di garis depan pendidikan.`,
		CTALabel:    "Buka Portal Guru",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func donationReceiptHTML(donorName, amount, donationType, teacherName, portalURL string) string {
	target := "Program Bea Guru"
	if teacherName != "" {
		target = teacherName
	}
	return renderEmail(emailContent{
		Headline:     "Donasi Bea Guru Kamu Berhasil!",
		Greeting:     greetingHi(donorName),
		SectionTitle: "Detail Donasi",
		Rows: []detailRow{
			{Label: "Nominal", Value: amount},
			{Label: "Jenis", Value: donationType},
			{Label: "Penerima", Value: target},
			{Label: "Status", Value: "Tercatat"},
		},
		MessageHTML: `Terima kasih sudah mempercayakan Bea Guru. Dampak donasi dapat Anda pantau kapan saja di portal donatur.`,
		CTALabel:    "Lihat Dampak Donasi",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func donationReceivedHTML(teacherName, donorLabel, amount, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Donasi Baru Masuk ke Akun Guru Kamu!",
		Greeting:     greetingHi(teacherName),
		SectionTitle: "Detail Donasi",
		Rows: []detailRow{
			{Label: "Nominal", Value: amount},
			{Label: "Sumber", Value: "Donatur Bea Guru" + strings.TrimSpace(donorLabel)},
			{Label: "Status", Value: "Diterima"},
		},
		MessageHTML: `Ada donasi baru melalui program Bea Guru. Terima kasih atas dedikasi Anda mengajar setiap hari.`,
		CTALabel:    "Buka Portal Guru",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func reportSubmittedHTML(teacherName, portalURL string) string {
	return renderEmail(emailContent{
		Headline:     "Laporan Bulanan Baru Menunggu Review!",
		Greeting:     "Hi Admin,",
		SectionTitle: "Detail Laporan",
		Rows: []detailRow{
			{Label: "Guru", Value: teacherName},
			{Label: "Status", Value: "Menunggu review"},
		},
		MessageHTML: `Guru mengirim laporan bulanan baru. Silakan tinjau dan setujui melalui portal admin.`,
		CTALabel:    "Buka Portal Admin",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}

func reportStatusHTML(name, statusLabel, portalURL string) string {
	headline := "Update Laporan Bulanan Bea Guru"
	if statusLabel == "Disetujui" {
		headline = "Laporan Bulanan Bea Guru Kamu Disetujui!"
	}
	return renderEmail(emailContent{
		Headline:     headline,
		Greeting:     greetingHi(name),
		SectionTitle: "Detail Laporan",
		Rows: []detailRow{
			{Label: "Status", Value: statusLabel},
		},
		MessageHTML: `Status laporan bulanan Anda telah diperbarui. Cek detail lengkapnya di portal guru.`,
		CTALabel:    "Buka Portal Guru",
		CTAURL:      portalURL,
		PortalURL:   portalURL,
	})
}
