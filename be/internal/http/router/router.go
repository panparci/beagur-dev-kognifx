package router

import (
	"log/slog"

	authjwt "bea-guru-api/internal/auth"
	"bea-guru-api/internal/ai"
	"bea-guru-api/internal/config"
	"bea-guru-api/internal/http/handler"
	"bea-guru-api/internal/http/middleware"
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

	st := store.New(deps.DB)
	jwtValidator := authjwt.NewValidator(
		deps.Config.BetterAuthJWKSURL,
		deps.Config.BetterAuthURL,
		deps.Config.BetterAuthURL,
	)
	requireUser := middleware.RequireCurrentUser(st, jwtValidator, !deps.Config.IsProduction())
	perm := middleware.RequirePermission

	healthHandler := handler.HealthHandler{DB: deps.DB}
	userHandler := handler.UserHandler{}
	authHandler := handler.AuthHandler{Store: st}
	institutionHandler := handler.InstitutionHandler{Store: st}
	teacherHandler := handler.TeacherHandler{Store: st}
	donationHandler := handler.DonationHandler{Store: st}
	reportHandler := handler.ReportHandler{Store: st}
	campaignHandler := handler.NewCampaignHandler(st)
	settingsHandler := handler.SettingsHandler{Store: st}
	aiSvc := &ai.Service{
		Store:       st,
		APIKey:      deps.Config.OpenRouterAPIKey,
		Models:      deps.Config.AIModels,
		SiteURL:     deps.Config.OpenRouterSiteURL,
		AppTitle:    deps.Config.AppName,
	}
	aiHandler := handler.AiHandler{Store: st, AI: aiSvc}
	ledgerHandler := handler.LedgerHandler{Store: st}
	onboardingHandler := handler.OnboardingHandler{Store: st}
	publicHandler := handler.NewPublicHandler(st)

	r.GET("/healthz", healthHandler.Health)
	r.GET("/readyz", healthHandler.Ready)

	api := r.Group("/api")
	v1 := api.Group("/v1")

	v1.GET("/public/campaign", campaignHandler.Progress)
	v1.GET("/public/teachers", publicHandler.Teachers)
	v1.GET("/public/rag", aiHandler.SearchRag)
	v1.GET("/public/rag/all", aiHandler.ListRag)
	if !deps.Config.IsProduction() {
		v1.POST("/auth/login", authHandler.Login)
		v1.POST("/auth/dev-login", authHandler.DevLogin)
	}

	v1.GET("/me", requireUser, userHandler.Me)
	v1.POST("/auth/logout", requireUser, authHandler.Logout)

	auth := v1.Group("", requireUser)
	{
		auth.POST("/onboarding/choose-role", onboardingHandler.ChooseRole)
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

		auth.GET("/reports/mine", perm("reports:write"), reportHandler.Mine)
		auth.POST("/reports", perm("reports:write"), reportHandler.Create)
		auth.GET("/reports", reportHandler.ListWithDetails)
		auth.PATCH("/reports/:id/status", perm("reports:approve"), reportHandler.UpdateStatus)

		auth.GET("/campaign/progress", perm("overview:read"), campaignHandler.Progress)

		auth.GET("/ledger", perm("ledger:read"), ledgerHandler.List)

		auth.GET("/settings/terms", settingsHandler.GetTerms)
		auth.PUT("/settings/terms", perm("settings:write"), settingsHandler.PutTerms)

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
