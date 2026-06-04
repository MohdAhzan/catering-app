package routes

import (
	"catering-backend/handlers"
	"catering-backend/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(r *gin.Engine, db *gorm.DB, jwtSecret string) {
	authH := handlers.NewAuthHandler(db, jwtSecret)
	eventH := handlers.NewEventHandler(db)
	billingH := handlers.NewBillingHandler(db)
	expenseH := handlers.NewExpenseHandler(db)
	miscH := handlers.NewMiscExpenseHandler(db)
	dashH := handlers.NewDashboardHandler(db)
	reportH := handlers.NewReportHandler(db)
	pdfH := handlers.NewPDFHandler(db)

	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok", "service": "catering-api"}) })

	authGroup := r.Group("/api/auth")
	authGroup.POST("/login", authH.Login)

	api := r.Group("/api")
	api.Use(middleware.Auth(db, jwtSecret))

	// Auth / Users
	api.GET("/auth/me", authH.Me)
	api.PUT("/auth/change-password", authH.ChangePassword)
	api.GET("/auth/users", authH.ListUsers)
	api.POST("/auth/users", middleware.RequireAdmin(), authH.CreateUser)
	api.PUT("/auth/users/:id/toggle", middleware.RequireAdmin(), authH.ToggleUser)

	// Dashboard
	api.GET("/dashboard", dashH.Stats)

	// Events
	api.GET("/events", eventH.List)
	api.POST("/events", eventH.Create)
	api.GET("/events/suggestions", eventH.Suggestions)
	api.GET("/events/calendar", eventH.Calendar)
	api.GET("/events/:id", eventH.Get)
	api.PUT("/events/:id", eventH.Update)
	api.DELETE("/events/:id", eventH.Delete)
	api.GET("/events/:id/activity", eventH.ActivityLog)

	// Billing Items
	api.GET("/events/:id/items", billingH.List)
	api.POST("/events/:id/items", billingH.Create)
	api.POST("/events/:id/items/bulk", billingH.BulkReplace)
	api.PUT("/events/:id/items/:itemId", billingH.Update)
	api.DELETE("/events/:id/items/:itemId", billingH.Delete)

	// Expenses
	api.GET("/events/:id/expenses", expenseH.List)
	api.POST("/events/:id/expenses", expenseH.Create)
	api.DELETE("/events/:id/expenses/:expId", expenseH.Delete)

	// Misc Expenses
	api.GET("/events/:id/misc-expenses", miscH.List)
	api.POST("/events/:id/misc-expenses", miscH.Create)
	api.DELETE("/events/:id/misc-expenses/:mId", miscH.Delete)

	// PDF Invoices
	api.GET("/events/:id/invoice.pdf", pdfH.SingleEventInvoice)
	api.POST("/reports/invoice.pdf", pdfH.MultiEventInvoice)

	// Reports
	api.GET("/reports", reportH.Generate)
	api.GET("/activity-logs", middleware.RequireAdmin(), eventH.GlobalActivityLog)
}
