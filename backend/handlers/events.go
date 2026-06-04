package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"catering-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EventHandler struct {
	DB *gorm.DB
}

func NewEventHandler(db *gorm.DB) *EventHandler {
	return &EventHandler{DB: db}
}

func enrichEvent(db *gorm.DB, event *models.Event) {
	var billingTotal, expenseTotal, miscTotal float64
	db.Model(&models.BillingItem{}).Where("event_id = ? AND deleted_at IS NULL", event.ID).Select("COALESCE(SUM(amount),0)").Scan(&billingTotal)
	db.Model(&models.Expense{}).Where("event_id = ? AND deleted_at IS NULL", event.ID).Select("COALESCE(SUM(amount),0)").Scan(&expenseTotal)
	db.Model(&models.MiscExpense{}).Where("event_id = ? AND deleted_at IS NULL", event.ID).Select("COALESCE(SUM(amount),0)").Scan(&miscTotal)
	event.TotalBilling = billingTotal
	event.TotalExpenses = expenseTotal
	event.TotalMisc = miscTotal
	event.ProfitLoss = billingTotal - expenseTotal - miscTotal
}

func (h *EventHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")
	status := c.Query("status")
	from := c.Query("from")
	to := c.Query("to")
	offset := (page - 1) * limit

	query := h.DB.Preload("Creator").Order("date DESC")
	if search != "" {
		query = query.Where("name ILIKE ? OR location ILIKE ? OR bill_number ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if from != "" {
		if t, err := time.Parse("2006-01-02", from); err == nil {
			query = query.Where("date >= ?", t)
		}
	}
	if to != "" {
		if t, err := time.Parse("2006-01-02", to); err == nil {
			query = query.Where("date <= ?", t.Add(24*time.Hour-time.Second))
		}
	}

	var total int64
	query.Model(&models.Event{}).Count(&total)

	var events []models.Event
	query.Limit(limit).Offset(offset).Find(&events)
	for i := range events {
		enrichEvent(h.DB, &events[i])
	}

	c.JSON(http.StatusOK, gin.H{"data": events, "total": total, "page": page, "limit": limit})
}

func (h *EventHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var event models.Event
	if err := h.DB.Preload("Creator").Preload("BillingItems").Preload("Expenses.Creator").Preload("MiscExpenses.Creator").First(&event, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}
	enrichEvent(h.DB, &event)
	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) Create(c *gin.Context) {
	var input struct {
		Name       string `json:"name" binding:"required"`
		Location   string `json:"location"`
		Date       string `json:"date" binding:"required"`
		BillNumber string `json:"bill_number" binding:"required"`
		Notes      string `json:"notes"`
		Status     string `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		// Try ISO format
		parsedDate, err = time.Parse(time.RFC3339, input.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}
	}

	userID, _ := c.Get("user_id")
	status := models.StatusDraft
	if input.Status != "" {
		status = models.EventStatus(input.Status)
	}

	event := models.Event{
		Name:       input.Name,
		Location:   input.Location,
		Date:       parsedDate,
		BillNumber: input.BillNumber,
		Notes:      input.Notes,
		Status:     status,
		CreatedBy:  userID.(uuid.UUID),
	}

	if err := h.DB.Create(&event).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Bill number already exists"})
		return
	}

	eid := event.ID
	LogActivity(h.DB, userID.(uuid.UUID), models.ActionCreate, "Event", event.ID.String(), &eid,
		fmt.Sprintf("Created event '%s' (Bill #%s)", event.Name, event.BillNumber))

	h.DB.Preload("Creator").First(&event, "id = ?", event.ID)
	c.JSON(http.StatusCreated, event)
}

func (h *EventHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var event models.Event
	if err := h.DB.First(&event, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	if event.CreatedBy != userID.(uuid.UUID) && userRole != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the event creator or admin can edit this event"})
		return
	}

	oldEvent := event
	var input struct {
		Name       string `json:"name"`
		Location   string `json:"location"`
		Date       string `json:"date"`
		BillNumber string `json:"bill_number"`
		Notes      string `json:"notes"`
		Status     string `json:"status"`
	}
	c.ShouldBindJSON(&input)

	if input.Name != "" {
		event.Name = input.Name
	}
	if input.Location != "" {
		event.Location = input.Location
	}
	if input.Date != "" {
		if t, err := time.Parse("2006-01-02", input.Date); err == nil {
			event.Date = t
		}
	}
	if input.BillNumber != "" {
		event.BillNumber = input.BillNumber
	}
	event.Notes = input.Notes
	if input.Status != "" {
		event.Status = models.EventStatus(input.Status)
	}

	h.DB.Save(&event)
	eid := event.ID
	LogActivityWithDiff(h.DB, userID.(uuid.UUID), models.ActionUpdate, "Event", event.ID.String(), &eid,
		fmt.Sprintf("Updated event '%s'", event.Name), oldEvent, event)

	h.DB.Preload("Creator").Preload("BillingItems").Preload("Expenses.Creator").Preload("MiscExpenses.Creator").First(&event, "id = ?", event.ID)
	enrichEvent(h.DB, &event)
	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	var event models.Event
	if err := h.DB.First(&event, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	if event.CreatedBy != userID.(uuid.UUID) && userRole != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the event creator or admin can delete this event"})
		return
	}

	h.DB.Delete(&event)
	LogActivity(h.DB, userID.(uuid.UUID), models.ActionDelete, "Event", event.ID.String(), nil,
		fmt.Sprintf("Deleted event '%s'", event.Name))
	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}

func (h *EventHandler) Suggestions(c *gin.Context) {
	q := c.Query("q")
	var names []string
	h.DB.Model(&models.Event{}).Where("name ILIKE ?", "%"+q+"%").
		Order("name").Limit(10).Distinct("name").Pluck("name", &names)
	if names == nil {
		names = []string{}
	}
	c.JSON(http.StatusOK, names)
}

func (h *EventHandler) Calendar(c *gin.Context) {
	year, _ := strconv.Atoi(c.DefaultQuery("year", strconv.Itoa(time.Now().Year())))
	month, _ := strconv.Atoi(c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month()))))
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)

	var events []models.Event
	h.DB.Where("date >= ? AND date < ?", start, end).Order("date ASC").Preload("Creator").Find(&events)
	for i := range events {
		enrichEvent(h.DB, &events[i])
	}
	c.JSON(http.StatusOK, events)
}

func (h *EventHandler) ActivityLog(c *gin.Context) {
	id := c.Param("id")
	uid, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}
	var logs []models.ActivityLog
	h.DB.Where("event_id = ?", uid).Preload("User").Order("created_at DESC").Limit(100).Find(&logs)
	c.JSON(http.StatusOK, logs)
}

func (h *EventHandler) GlobalActivityLog(c *gin.Context) {
	var logs []models.ActivityLog
	h.DB.Preload("User").Order("created_at DESC").Limit(100).Find(&logs)
	c.JSON(http.StatusOK, logs)
}
