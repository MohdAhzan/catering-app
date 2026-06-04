package handlers

import (
	"fmt"
	"net/http"
	"time"

	"catering-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

type DashboardHandler struct{ DB *gorm.DB }

func NewDashboardHandler(db *gorm.DB) *DashboardHandler { return &DashboardHandler{DB: db} }

type PeriodStats struct {
	Revenue    float64 `json:"revenue"`
	Expenses   float64 `json:"expenses"`
	ProfitLoss float64 `json:"profit_loss"`
	EventCount int64   `json:"event_count"`
}

type MonthlyData struct {
	Month    string  `json:"month"`
	Revenue  float64 `json:"revenue"`
	Expenses float64 `json:"expenses"`
}

func (h *DashboardHandler) Stats(c *gin.Context) {
	var totalEvents int64
	h.DB.Model(&models.Event{}).Count(&totalEvents)

	var totalRevenue, totalExpenses, totalMisc float64
	h.DB.Model(&models.BillingItem{}).Select("COALESCE(SUM(amount),0)").Scan(&totalRevenue)
	h.DB.Model(&models.Expense{}).Select("COALESCE(SUM(amount),0)").Scan(&totalExpenses)
	h.DB.Model(&models.MiscExpense{}).Select("COALESCE(SUM(amount),0)").Scan(&totalMisc)

	var recentEvents []models.Event
	h.DB.Preload("Creator").Order("date DESC").Limit(5).Find(&recentEvents)
	for i := range recentEvents {
		enrichEvent(h.DB, &recentEvents[i])
	}

	eventsByStatus := map[string]int64{}
	for _, s := range []string{"draft", "confirmed", "completed", "cancelled"} {
		var cnt int64
		h.DB.Model(&models.Event{}).Where("status = ?", s).Count(&cnt)
		eventsByStatus[s] = cnt
	}

	now := time.Now()
	thisMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	lastMonthStart := thisMonthStart.AddDate(0, -1, 0)

	var monthlyRevenue []MonthlyData
	for i := 5; i >= 0; i-- {
		start := time.Date(now.Year(), now.Month()-time.Month(i), 1, 0, 0, 0, 0, time.UTC)
		end := start.AddDate(0, 1, 0)
		var rev float64
		h.DB.Raw(`SELECT COALESCE(SUM(bi.amount),0) FROM billing_items bi
			JOIN events e ON bi.event_id = e.id
			WHERE e.date >= ? AND e.date < ? AND bi.deleted_at IS NULL AND e.deleted_at IS NULL`, start, end).Scan(&rev)
		var exp, misc float64
		h.DB.Raw(`SELECT COALESCE(SUM(ex.amount),0) FROM expenses ex
			JOIN events e ON ex.event_id = e.id
			WHERE e.date >= ? AND e.date < ? AND ex.deleted_at IS NULL AND e.deleted_at IS NULL`, start, end).Scan(&exp)
		h.DB.Raw(`SELECT COALESCE(SUM(me.amount),0) FROM misc_expenses me
			JOIN events e ON me.event_id = e.id
			WHERE e.date >= ? AND e.date < ? AND me.deleted_at IS NULL AND e.deleted_at IS NULL`, start, end).Scan(&misc)
		monthlyRevenue = append(monthlyRevenue, MonthlyData{
			Month: start.Format("Jan 06"), Revenue: rev, Expenses: exp + misc,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"total_events":     totalEvents,
		"total_revenue":    totalRevenue,
		"total_expenses":   totalExpenses + totalMisc,
		"total_misc":       totalMisc,
		"net_profit_loss":  totalRevenue - totalExpenses - totalMisc,
		"recent_events":    recentEvents,
		"events_by_status": eventsByStatus,
		"monthly_revenue":  monthlyRevenue,
		"this_month":       h.getPeriodStats(thisMonthStart, now),
		"last_month":       h.getPeriodStats(lastMonthStart, thisMonthStart),
	})
}

func (h *DashboardHandler) getPeriodStats(from, to time.Time) PeriodStats {
	var ps PeriodStats
	h.DB.Model(&models.Event{}).Where("date >= ? AND date < ?", from, to).Count(&ps.EventCount)
	h.DB.Raw(`SELECT COALESCE(SUM(bi.amount),0) FROM billing_items bi
		JOIN events e ON bi.event_id = e.id
		WHERE e.date >= ? AND e.date < ? AND bi.deleted_at IS NULL AND e.deleted_at IS NULL`, from, to).Scan(&ps.Revenue)
	var exp, misc float64
	h.DB.Raw(`SELECT COALESCE(SUM(ex.amount),0) FROM expenses ex
		JOIN events e ON ex.event_id = e.id
		WHERE e.date >= ? AND e.date < ? AND ex.deleted_at IS NULL AND e.deleted_at IS NULL`, from, to).Scan(&exp)
	h.DB.Raw(`SELECT COALESCE(SUM(me.amount),0) FROM misc_expenses me
		JOIN events e ON me.event_id = e.id
		WHERE e.date >= ? AND e.date < ? AND me.deleted_at IS NULL AND e.deleted_at IS NULL`, from, to).Scan(&misc)
	ps.Expenses = exp + misc
	ps.ProfitLoss = ps.Revenue - ps.Expenses
	return ps
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────

type ReportHandler struct{ DB *gorm.DB }

func NewReportHandler(db *gorm.DB) *ReportHandler { return &ReportHandler{DB: db} }

func (h *ReportHandler) Generate(c *gin.Context) {
	from := c.Query("from")
	to := c.Query("to")

	var fromTime, toTime time.Time
	var parseErr error

	if from != "" {
		fromTime, parseErr = time.Parse("2006-01-02", from)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from date. Use YYYY-MM-DD"})
			return
		}
	} else {
		fromTime = time.Now().AddDate(0, -1, 0)
	}

	if to != "" {
		toTime, parseErr = time.Parse("2006-01-02", to)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to date. Use YYYY-MM-DD"})
			return
		}
		toTime = toTime.Add(24*time.Hour - time.Second)
	} else {
		toTime = time.Now()
	}

	var events []models.Event
	h.DB.Where("date >= ? AND date <= ?", fromTime, toTime).Order("date ASC").Find(&events)

	type EventSummary struct {
		ID         string  `json:"id"`
		Name       string  `json:"name"`
		BillNumber string  `json:"bill_number"`
		Date       string  `json:"date"`
		Location   string  `json:"location"`
		Status     string  `json:"status"`
		Revenue    float64 `json:"revenue"`
		Expenses   float64 `json:"expenses"`
		Misc       float64 `json:"misc"`
		ProfitLoss float64 `json:"profit_loss"`
	}

	var summaries []EventSummary
	var totalRev, totalExp float64

	for _, ev := range events {
		var rev, exp, misc float64
		h.DB.Model(&models.BillingItem{}).Where("event_id = ?", ev.ID).Select("COALESCE(SUM(amount),0)").Scan(&rev)
		h.DB.Model(&models.Expense{}).Where("event_id = ?", ev.ID).Select("COALESCE(SUM(amount),0)").Scan(&exp)
		h.DB.Model(&models.MiscExpense{}).Where("event_id = ?", ev.ID).Select("COALESCE(SUM(amount),0)").Scan(&misc)
		summaries = append(summaries, EventSummary{
			ID: ev.ID.String(), Name: ev.Name, BillNumber: ev.BillNumber,
			Date: ev.Date.Format("2006-01-02"), Location: ev.Location, Status: string(ev.Status),
			Revenue: rev, Expenses: exp + misc, Misc: misc, ProfitLoss: rev - exp - misc,
		})
		totalRev += rev
		totalExp += exp + misc
	}

	if summaries == nil {
		summaries = []EventSummary{}
	}

	c.JSON(http.StatusOK, gin.H{
		"events":          summaries,
		"total_revenue":   totalRev,
		"total_expenses":  totalExp,
		"net_profit_loss": totalRev - totalExp,
		"period":          fmt.Sprintf("%s to %s", fromTime.Format("Jan 2, 2006"), toTime.Format("Jan 2, 2006")),
		"event_count":     len(summaries),
	})
}
