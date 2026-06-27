package notify

import (
	"context"
	"fmt"
	"strings"

	"bea-guru-api/internal/domain/user"
	"bea-guru-api/internal/store"
)

func (s *Service) OnAccountActivated(email, name, roleLabel string) {
	s.runAsync(func(ctx context.Context) {
		displayName := strings.TrimSpace(name)
		if displayName == "" {
			displayName = strings.TrimSpace(email)
		}
		s.sendLogged(ctx, Message{
			To: email, ToName: displayName,
			Subject: "Verifikasi Akun Bea Guru Kamu Berhasil!",
			HTML:    accountActivatedHTML(displayName, roleLabel, s.portalURL("/portal")),
		})
	})
}

func (s *Service) OnAccountCreated(email, name string) {
	s.runAsync(func(ctx context.Context) {
		displayName := strings.TrimSpace(name)
		if displayName == "" {
			displayName = strings.TrimSpace(email)
		}
		s.sendLogged(ctx, Message{
			To: email, ToName: displayName,
			Subject: "Pembuatan Akun Bea Guru Kamu Berhasil!",
			HTML:    accountCreatedHTML(displayName, s.portalURL("/portal")),
		})
	})
}

func (s *Service) OnRoleChosen(userID, roleCode string) {
	s.runAsync(func(ctx context.Context) {
		if s.Store == nil {
			return
		}

		contact, err := s.Store.GetUserContact(ctx, userID)
		if err != nil {
			s.Logger.Warn("notify role chosen: user contact", "error", err)
			return
		}

		switch user.Role(roleCode) {
		case user.RoleDonor:
			s.sendLogged(ctx, Message{
				To: contact.Email, ToName: contact.Name,
				Subject: "Akun Donatur Bea Guru Kamu Aktif!",
				HTML:    donorWelcomeHTML(contact.Name, s.portalURL("/portal")),
			})
		case user.RoleTeacher:
			s.sendLogged(ctx, Message{
				To: contact.Email, ToName: contact.Name,
				Subject: "Pendaftaran Guru Bea Guru Kamu Diterima!",
				HTML:    pendingVerificationHTML(contact.Name, "Guru honorer", s.portalURL("/pending-verification")),
			})
		case user.RoleValidator:
			s.sendLogged(ctx, Message{
				To: contact.Email, ToName: contact.Name,
				Subject: "Pendaftaran Validator Bea Guru Kamu Diterima!",
				HTML:    pendingVerificationHTML(contact.Name, "Kepala sekolah / validator", s.portalURL("/pending-verification")),
			})
		}
	})
}

func (s *Service) OnTeacherProfileSubmitted(profile store.TeacherProfile) {
	s.runAsync(func(ctx context.Context) {
		if s.Store == nil {
			return
		}

		validator, err := s.Store.GetValidatorContactForInstitution(ctx, profile.InstitutionID)
		if err != nil {
			s.Logger.Warn("notify teacher submitted: validator contact", "error", err)
			return
		}

		s.sendLogged(ctx, Message{
			To: validator.Email, ToName: validator.Name,
			Subject: fmt.Sprintf("Validasi Profil Guru: %s", profile.FullName),
			HTML:    teacherSubmittedHTML(profile.FullName, profile.InstitutionName, s.portalURL("/portal")),
		})
	})
}

func (s *Service) OnValidatorDecision(profile store.TeacherProfile, approved bool) {
	s.runAsync(func(ctx context.Context) {
		if s.Store == nil {
			return
		}

		teacher, err := s.Store.GetUserContact(ctx, profile.UserID)
		if err != nil {
			s.Logger.Warn("notify validator decision: teacher contact", "error", err)
			return
		}

		portal := s.portalURL("/portal")

		if approved {
			s.sendLogged(ctx, Message{
				To: teacher.Email, ToName: teacher.Name,
				Subject: "Profil Guru Kamu Disetujui Kepala Sekolah!",
				HTML:    teacherPendingAdminHTML(teacher.Name, portal),
			})

			admins, err := s.Store.ListAdminContacts(ctx)
			if err != nil {
				s.Logger.Warn("notify validator decision: admin contacts", "error", err)
				return
			}
			html := validatorApprovedHTML(profile.FullName, profile.InstitutionName, portal)
			for _, admin := range admins {
				s.sendLogged(ctx, Message{
					To: admin.Email, ToName: admin.Name,
					Subject: fmt.Sprintf("Setujui Profil Guru: %s", profile.FullName),
					HTML:    html,
				})
			}
			return
		}

		s.sendLogged(ctx, Message{
			To: teacher.Email, ToName: teacher.Name,
			Subject: "Profil Guru Bea Guru Perlu Diperbaiki",
			HTML:    teacherRejectedHTML(teacher.Name, "Kepala sekolah / validator", portal),
		})
	})
}

func (s *Service) OnAdminApprovalDecision(profile store.TeacherProfile, approved bool) {
	s.runAsync(func(ctx context.Context) {
		if s.Store == nil {
			return
		}

		teacher, err := s.Store.GetUserContact(ctx, profile.UserID)
		if err != nil {
			s.Logger.Warn("notify admin decision: teacher contact", "error", err)
			return
		}

		portal := s.portalURL("/portal")

		if approved {
			s.sendLogged(ctx, Message{
				To: teacher.Email, ToName: teacher.Name,
				Subject: "Profil Guru Bea Guru Kamu Disetujui!",
				HTML:    teacherApprovedHTML(teacher.Name, portal),
			})
			s.sendLogged(ctx, Message{
				To: teacher.Email, ToName: teacher.Name,
				Subject: "Verifikasi Akun Bea Guru Kamu Berhasil!",
				HTML:    accountActivatedHTML(teacher.Name, "Guru honorer", portal),
			})
			return
		}

		s.sendLogged(ctx, Message{
			To: teacher.Email, ToName: teacher.Name,
			Subject: "Profil Guru Bea Guru Belum Disetujui Yayasan",
			HTML:    teacherRejectedHTML(teacher.Name, "Tim yayasan Bea Guru", portal),
		})
	})
}

func (s *Service) OnDonationCreated(donation store.Donation, donor store.UserContact) {
	s.runAsync(func(ctx context.Context) {
		if s.Store == nil {
			return
		}

		typeLabel := "Sekali"
		if donation.Type == "RECURRING" {
			typeLabel = "Berkala"
		}
		amount := formatIDR(donation.Amount)
		portal := s.portalURL("/portal")

		var teacherName string
		if donation.TeacherProfileID != nil && *donation.TeacherProfileID != "" {
			teacherContact, profile, err := s.Store.GetTeacherContactByProfileID(ctx, *donation.TeacherProfileID)
			if err == nil {
				teacherName = profile.FullName
				s.sendLogged(ctx, Message{
					To: teacherContact.Email, ToName: teacherContact.Name,
					Subject: "Donasi Baru Masuk ke Akun Guru Kamu!",
					HTML:    donationReceivedHTML(profile.FullName, "", amount, portal),
				})
			}
		}

		s.sendLogged(ctx, Message{
			To: donor.Email, ToName: donor.Name,
			Subject: "Donasi Bea Guru Kamu Berhasil!",
			HTML:    donationReceiptHTML(donor.Name, amount, typeLabel, teacherName, portal),
		})
	})
}

func (s *Service) OnReportSubmitted(report store.MonthlyReport) {
	s.runAsync(func(ctx context.Context) {
		if s.Store == nil {
			return
		}

		teacher, err := s.Store.GetTeacherContactByUserID(ctx, report.TeacherUserID)
		if err != nil {
			s.Logger.Warn("notify report submitted: teacher contact", "error", err)
			return
		}

		admins, err := s.Store.ListAdminContacts(ctx)
		if err != nil {
			s.Logger.Warn("notify report submitted: admin contacts", "error", err)
			return
		}

		portal := s.portalURL("/portal")
		html := reportSubmittedHTML(teacher.Name, portal)

		for _, admin := range admins {
			s.sendLogged(ctx, Message{
				To: admin.Email, ToName: admin.Name,
				Subject: fmt.Sprintf("Laporan Bulanan dari %s Menunggu Review", teacher.Name),
				HTML:    html,
			})
		}
	})
}

func (s *Service) OnReportStatusUpdated(report store.MonthlyReport) {
	s.runAsync(func(ctx context.Context) {
		if s.Store == nil {
			return
		}

		teacher, err := s.Store.GetTeacherContactByUserID(ctx, report.TeacherUserID)
		if err != nil {
			s.Logger.Warn("notify report status: teacher contact", "error", err)
			return
		}

		statusLabel := report.Status
		subject := "Update Laporan Bulanan Bea Guru"
		switch report.Status {
		case "APPROVED":
			statusLabel = "Disetujui"
			subject = "Laporan Bulanan Bea Guru Kamu Disetujui!"
		case "REJECTED":
			statusLabel = "Perlu diperbaiki"
			subject = "Laporan Bulanan Bea Guru Perlu Diperbaiki"
		case "PENDING":
			statusLabel = "Menunggu review"
		}

		s.sendLogged(ctx, Message{
			To: teacher.Email, ToName: teacher.Name,
			Subject: subject,
			HTML:    reportStatusHTML(teacher.Name, statusLabel, s.portalURL("/portal")),
		})
	})
}

func (s *Service) OnDisbursementPaid(profile store.TeacherProfile, amount int64, description string) {
	s.runAsync(func(ctx context.Context) {
		if s.Store == nil {
			return
		}

		teacher, err := s.Store.GetUserContact(ctx, profile.UserID)
		if err != nil {
			s.Logger.Warn("notify disbursement: teacher contact", "error", err)
			return
		}

		desc := strings.TrimSpace(description)
		if desc == "" {
			desc = "Penyaluran dana Bea Guru"
		}

		portal := s.portalURL("/portal")
		s.sendLogged(ctx, Message{
			To: teacher.Email, ToName: teacher.Name,
			Subject: "Penyaluran Dana Bea Guru Kamu Berhasil!",
			HTML:    disbursementPaidHTML(profile.FullName, formatIDR(amount), desc, portal),
		})
	})
}
