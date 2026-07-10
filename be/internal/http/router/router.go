package router

import (
	"log/slog"
	"strings"

	"bea-guru-api/internal/ai"
	authjwt "bea-guru-api/internal/auth"
	"bea-guru-api/internal/config"
	"bea-guru-api/internal/http/handler"
	"bea-guru-api/internal/http/middleware"
	"bea-guru-api/internal/notify"
	"bea-guru-api/internal/storage"
	"bea-guru-api/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Dependencies struct {
	Config config.Config
	Logger *slog.Logger
	DB     *pgxpool.Pool
}

func New(deps Dependencies) *gin.Engine {
	if deps.Config.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.RequestID())
	r.Use(middleware.Recovery(deps.Logger))
	r.Use(middleware.SecurityHeaders(deps.Config.IsProduction()))
	r.Use(middleware.CORS(deps.Config.AllowedOrigins, !deps.Config.IsProduction()))

	st := store.New(deps.DB, deps.Config.MediaRules())
	jwtValidator := authjwt.NewValidator(
		deps.Config.BetterAuthJWKSURL,
		deps.Config.BetterAuthURL,
		deps.Config.BetterAuthURL,
	)
	requireUser := middleware.RequireCurrentUser(st, jwtValidator, !deps.Config.IsProduction())
	perm := middleware.RequirePermission

	notifySvc := notify.New(
		deps.Logger,
		deps.Config.BrevoAPIKey,
		deps.Config.EmailFrom,
		deps.Config.EmailFromName,
		deps.Config.FrontendURL,
		st,
	)
	if notifySvc.Enabled() {
		deps.Logger.Info("email notifications enabled via Brevo")
	} else {
		deps.Logger.Info("email notifications disabled (set BREVO_API_KEY and EMAIL_FROM to enable)")
	}

	healthHandler := handler.HealthHandler{DB: deps.DB, UploadDir: deps.Config.UploadDir}
	userHandler := handler.UserHandler{Store: st, Notify: notifySvc}
	authHandler := handler.AuthHandler{Store: st}
	institutionHandler := handler.InstitutionHandler{Store: st, Notify: notifySvc}
	teacherHandler := handler.TeacherHandler{Store: st, Notify: notifySvc}
	donationHandler := handler.DonationHandler{Store: st, Notify: notifySvc}
	donorHandler := handler.DonorHandler{Store: st}
	reportHandler := handler.ReportHandler{Store: st, Notify: notifySvc}
	campaignHandler := handler.NewCampaignHandler(st)
	settingsHandler := handler.SettingsHandler{Store: st}
	aiSvc := &ai.Service{
		Store:    st,
		APIKey:   deps.Config.OpenRouterAPIKey,
		Models:   deps.Config.AIModels,
		SiteURL:  deps.Config.OpenRouterSiteURL,
		AppTitle: deps.Config.AppName,
	}
	aiHandler := handler.AiHandler{Store: st, AI: aiSvc}
	ledgerHandler := handler.LedgerHandler{Store: st, Notify: notifySvc}
	onboardingHandler := handler.OnboardingHandler{Store: st, Notify: notifySvc}
	publicHandler := handler.NewPublicHandler(st)
	internalNotifyHandler := handler.InternalNotifyHandler{
		Notify: notifySvc,
		Secret: deps.Config.InternalNotifySecret,
	}
	proofStore := storage.NewProofStore(deps.Config.UploadDir)
	r2Client, err := storage.NewR2Client(deps.Config.R2Config())
	if err != nil {
		deps.Logger.Error("r2 init failed", "error", err)
		panic(err)
	}
	if r2Client != nil {
		deps.Logger.Info("media storage: cloudflare r2", "bucket", deps.Config.R2Bucket)
	} else {
		deps.Logger.Info("media storage: local disk", "dir", deps.Config.UploadDir)
	}
	mediaStore := storage.NewMediaStore(deps.Config.UploadDir, deps.Config.MediaRules(), r2Client)
	uploadHandler := handler.UploadHandler{Proofs: proofStore, Media: mediaStore}
	filesHandler := handler.FilesHandler{Proofs: proofStore, Media: mediaStore, Store: st}
	auditHandler := handler.AuditHandler{Store: st}
	analyticsHandler := handler.AnalyticsHandler{Store: st}

	r.GET("/healthz", healthHandler.Health)
	r.GET("/readyz", healthHandler.Ready)

	api := r.Group("/api")
	v1 := api.Group("/v1")

	v1.GET("/public/campaign", campaignHandler.Progress)
	v1.GET("/public/teachers", publicHandler.Teachers)
	v1.GET("/public/terms", publicHandler.Terms)
	v1.GET("/public/landing", publicHandler.Landing)
	v1.GET("/public/media/*filepath", filesHandler.PublicMedia)
	v1.GET("/public/rag", aiHandler.SearchRag)
	v1.GET("/public/rag/all", aiHandler.ListRag)
	if strings.TrimSpace(deps.Config.InternalNotifySecret) != "" {
		v1.POST("/internal/notifications/account-created", internalNotifyHandler.AccountCreated)
	}
	if !deps.Config.IsProduction() {
		v1.POST("/auth/login", authHandler.Login)
		v1.POST("/auth/dev-login", authHandler.DevLogin)
	}

	v1.GET("/me", requireUser, userHandler.Me)
	v1.POST("/auth/logout", requireUser, authHandler.Logout)

	auth := v1.Group("", requireUser)
	{
		auth.POST("/onboarding/choose-role", onboardingHandler.ChooseRole)
		auth.GET("/account-approvals/pending", perm("settings:write"), userHandler.PendingApprovals)
		auth.POST("/account-approvals/:id/decision", perm("settings:write"), userHandler.DecidePendingApproval)
		auth.GET("/institutions", perm("institutions:read"), institutionHandler.List)
		auth.POST("/institutions", perm("institutions:write"), institutionHandler.Save)
		auth.GET("/validators", perm("institutions:write"), institutionHandler.ListValidators)

		auth.GET("/teachers", perm("donations:read"), teacherHandler.List)
		auth.GET("/teachers/me", perm("teachers:write"), teacherHandler.Me)
		auth.POST("/teachers", perm("teachers:write"), teacherHandler.Save)
		auth.GET("/teachers/approved", perm("teachers:read"), teacherHandler.Approved)
		auth.GET("/teachers/pending-validation", perm("teachers:validate"), teacherHandler.PendingValidation)
		auth.GET("/teachers/validation-history", perm("teachers:validate"), teacherHandler.ValidationHistory)
		auth.POST("/teachers/:id/validate", perm("teachers:validate"), teacherHandler.Validate)
		auth.GET("/teachers/pending-approval", perm("reports:approve"), teacherHandler.PendingApproval)
		auth.POST("/teachers/:id/approve", perm("reports:approve"), teacherHandler.Approve)

		auth.GET("/donations", perm("donations:read"), donationHandler.List)
		auth.GET("/donations/mine", perm("donations:write"), donationHandler.Mine)
		auth.POST("/donations", perm("donations:write"), donationHandler.Create)
		auth.POST("/uploads/donation-proof", perm("donations:write"), uploadHandler.DonationProof)
		auth.POST("/uploads/image", perm("teachers:write"), uploadHandler.TeacherImage)
		auth.POST("/uploads/report-image", perm("reports:write"), uploadHandler.ReportImage)
		auth.GET("/files/*filepath", filesHandler.Serve)
		auth.PATCH("/donations/:id/verification", perm("donations:verify"), donationHandler.Verify)
		auth.POST("/donations/invoice", perm("donations:verify"), donationHandler.CreateInvoice)

		auth.GET("/donors", perm("donors:read"), donorHandler.List)
		auth.POST("/donors", perm("donors:write"), donorHandler.Save)
		auth.PATCH("/donors/:id/deactivate", perm("donors:write"), donorHandler.Deactivate)

		auth.GET("/admin/audit-logs", perm("audit:read"), auditHandler.List)
		auth.GET("/admin/analytics/monthly", perm("analytics:read"), analyticsHandler.Monthly)
		auth.POST("/admin/analytics/snapshots", perm("analytics:write"), analyticsHandler.ImportSnapshots)

		auth.GET("/reports/mine", perm("reports:write"), reportHandler.Mine)
		auth.POST("/reports", perm("reports:write"), reportHandler.Create)
		auth.GET("/reports", reportHandler.ListWithDetails)
		auth.PATCH("/reports/:id/status", perm("reports:approve"), reportHandler.UpdateStatus)

		auth.GET("/campaign/progress", perm("overview:read"), campaignHandler.Progress)

		auth.GET("/ledger", perm("ledger:read"), ledgerHandler.List)
		auth.POST("/ledger/disburse", perm("reports:approve"), ledgerHandler.Disburse)

		auth.GET("/settings/terms", settingsHandler.GetTerms)
		auth.PUT("/settings/terms", perm("settings:write"), settingsHandler.PutTerms)
		auth.GET("/settings/landing", settingsHandler.GetLanding)
		auth.PUT("/settings/landing", perm("settings:write"), settingsHandler.PutLanding)

		auth.GET("/ai/rag", perm("overview:read"), aiHandler.SearchRag)
		auth.GET("/ai/rag/all", perm("overview:read"), aiHandler.ListRag)
		auth.GET("/ai/memory", aiHandler.ListMemory)
		auth.POST("/ai/memory", aiHandler.AppendMemory)
		auth.DELETE("/ai/memory", aiHandler.ClearMemory)
		auth.GET("/ai/logs", aiHandler.ListLogs)
		auth.POST("/ai/logs", aiHandler.CreateLog)
		auth.POST("/ai/chat", aiHandler.Chat)
		auth.POST("/ai/assist/form", perm("teachers:write"), aiHandler.AssistForm)
		auth.POST("/ai/assist/report", perm("reports:write"), aiHandler.AssistReport)
		auth.POST("/ai/summarize", aiHandler.Summarize)
	}

	return r
}
