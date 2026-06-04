package handlers

import (
	"fmt"
	"net/http"

	"catering-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ─── BILLING ITEMS ────────────────────────────────────────────────────────────

type BillingHandler struct{ DB *gorm.DB }

func NewBillingHandler(db *gorm.DB) *BillingHandler { return &BillingHandler{DB: db} }

func (h *BillingHandler) List(c *gin.Context) {
	eventID := c.Param("id")
	var items []models.BillingItem
	h.DB.Where("event_id = ?", eventID).Order("sort_order, created_at").Find(&items)
	if items == nil {
		items = []models.BillingItem{}
	}
	c.JSON(http.StatusOK, items)
}

func (h *BillingHandler) Create(c *gin.Context) {
	eventID := c.Param("id")
	eID, err := uuid.Parse(eventID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}
	var input struct {
		ItemName    string  `json:"item_name" binding:"required"`
		Description string  `json:"description"`
		Quantity    float64 `json:"quantity" binding:"required"`
		Rate        float64 `json:"rate" binding:"required"`
		SortOrder   int     `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, _ := c.Get("user_id")
	item := models.BillingItem{
		EventID: eID, ItemName: input.ItemName, Description: input.Description,
		Quantity: input.Quantity, Rate: input.Rate, Amount: input.Quantity * input.Rate,
		SortOrder: input.SortOrder, CreatedBy: userID.(uuid.UUID),
	}
	h.DB.Create(&item)
	LogActivity(h.DB, userID.(uuid.UUID), models.ActionCreate, "BillingItem", item.ID.String(), &eID,
		fmt.Sprintf("Added item '%s' (%.0f × ₹%.2f = ₹%.2f)", item.ItemName, item.Quantity, item.Rate, item.Amount))
	c.JSON(http.StatusCreated, item)
}

func (h *BillingHandler) Update(c *gin.Context) {
	eventID, itemID := c.Param("id"), c.Param("itemId")
	eID, _ := uuid.Parse(eventID)
	var item models.BillingItem
	if err := h.DB.First(&item, "id = ? AND event_id = ?", itemID, eventID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}
	oldItem := item
	userID, _ := c.Get("user_id")
	var input struct {
		ItemName    string  `json:"item_name"`
		Description string  `json:"description"`
		Quantity    float64 `json:"quantity"`
		Rate        float64 `json:"rate"`
		SortOrder   int     `json:"sort_order"`
	}
	c.ShouldBindJSON(&input)
	if input.ItemName != "" {
		item.ItemName = input.ItemName
	}
	if input.Quantity > 0 {
		item.Quantity = input.Quantity
	}
	if input.Rate >= 0 {
		item.Rate = input.Rate
	}
	item.Description = input.Description
	item.SortOrder = input.SortOrder
	item.Amount = item.Quantity * item.Rate
	h.DB.Save(&item)
	LogActivityWithDiff(h.DB, userID.(uuid.UUID), models.ActionUpdate, "BillingItem", item.ID.String(), &eID,
		"Updated billing item: "+item.ItemName, oldItem, item)
	c.JSON(http.StatusOK, item)
}

func (h *BillingHandler) Delete(c *gin.Context) {
	eventID, itemID := c.Param("id"), c.Param("itemId")
	eID, _ := uuid.Parse(eventID)
	var item models.BillingItem
	if err := h.DB.First(&item, "id = ? AND event_id = ?", itemID, eventID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}
	userID, _ := c.Get("user_id")
	h.DB.Delete(&item)
	LogActivity(h.DB, userID.(uuid.UUID), models.ActionDelete, "BillingItem", item.ID.String(), &eID,
		"Deleted billing item: "+item.ItemName)
	c.JSON(http.StatusOK, gin.H{"message": "Item deleted"})
}

func (h *BillingHandler) BulkReplace(c *gin.Context) {
	eventID := c.Param("id")
	eID, _ := uuid.Parse(eventID)
	userID, _ := c.Get("user_id")
	var inputs []struct {
		ItemName    string  `json:"item_name"`
		Description string  `json:"description"`
		Quantity    float64 `json:"quantity"`
		Rate        float64 `json:"rate"`
		SortOrder   int     `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&inputs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.DB.Where("event_id = ?", eID).Delete(&models.BillingItem{})
	var items []models.BillingItem
	for _, inp := range inputs {
		items = append(items, models.BillingItem{
			EventID: eID, ItemName: inp.ItemName, Description: inp.Description,
			Quantity: inp.Quantity, Rate: inp.Rate, Amount: inp.Quantity * inp.Rate,
			SortOrder: inp.SortOrder, CreatedBy: userID.(uuid.UUID),
		})
	}
	if len(items) > 0 {
		h.DB.Create(&items)
	} else {
		items = []models.BillingItem{}
	}
	LogActivity(h.DB, userID.(uuid.UUID), models.ActionUpdate, "BillingItems", eventID, &eID,
		fmt.Sprintf("Bulk replaced %d billing items", len(items)))
	c.JSON(http.StatusOK, items)
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────

type ExpenseHandler struct{ DB *gorm.DB }

func NewExpenseHandler(db *gorm.DB) *ExpenseHandler { return &ExpenseHandler{DB: db} }

func (h *ExpenseHandler) List(c *gin.Context) {
	eventID := c.Param("id")
	var expenses []models.Expense
	h.DB.Where("event_id = ?", eventID).Preload("Creator").Order("created_at DESC").Find(&expenses)
	if expenses == nil {
		expenses = []models.Expense{}
	}
	c.JSON(http.StatusOK, expenses)
}

func (h *ExpenseHandler) Create(c *gin.Context) {
	eventID := c.Param("id")
	eID, _ := uuid.Parse(eventID)
	userID, _ := c.Get("user_id")
	var input struct {
		Description  string  `json:"description" binding:"required"`
		Amount       float64 `json:"amount" binding:"required"`
		BillImageURL string  `json:"bill_image_url"`
		Category     string  `json:"category"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	expense := models.Expense{
		EventID: eID, Description: input.Description, Amount: input.Amount,
		BillImageURL: input.BillImageURL, Category: input.Category,
		CreatedBy: userID.(uuid.UUID),
	}
	h.DB.Create(&expense)
	h.DB.Preload("Creator").First(&expense, "id = ?", expense.ID)
	LogActivity(h.DB, userID.(uuid.UUID), models.ActionCreate, "Expense", expense.ID.String(), &eID,
		fmt.Sprintf("Added expense '%s' ₹%.2f", expense.Description, expense.Amount))
	c.JSON(http.StatusCreated, expense)
}

func (h *ExpenseHandler) Delete(c *gin.Context) {
	eventID, expID := c.Param("id"), c.Param("expId")
	eID, _ := uuid.Parse(eventID)
	var expense models.Expense
	if err := h.DB.First(&expense, "id = ? AND event_id = ?", expID, eventID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Expense not found"})
		return
	}
	userID, _ := c.Get("user_id")
	h.DB.Delete(&expense)
	LogActivity(h.DB, userID.(uuid.UUID), models.ActionDelete, "Expense", expense.ID.String(), &eID,
		"Deleted expense: "+expense.Description)
	c.JSON(http.StatusOK, gin.H{"message": "Expense deleted"})
}

// ─── MISC EXPENSES ────────────────────────────────────────────────────────────

type MiscExpenseHandler struct{ DB *gorm.DB }

func NewMiscExpenseHandler(db *gorm.DB) *MiscExpenseHandler { return &MiscExpenseHandler{DB: db} }

func (h *MiscExpenseHandler) List(c *gin.Context) {
	eventID := c.Param("id")
	var expenses []models.MiscExpense
	h.DB.Where("event_id = ?", eventID).Preload("Creator").Order("created_at DESC").Find(&expenses)
	if expenses == nil {
		expenses = []models.MiscExpense{}
	}
	c.JSON(http.StatusOK, expenses)
}

func (h *MiscExpenseHandler) Create(c *gin.Context) {
	eventID := c.Param("id")
	eID, _ := uuid.Parse(eventID)
	userID, _ := c.Get("user_id")
	var input struct {
		Description string  `json:"description" binding:"required"`
		Amount      float64 `json:"amount" binding:"required"`
		Note        string  `json:"note"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	expense := models.MiscExpense{
		EventID: eID, Description: input.Description,
		Amount: input.Amount, Note: input.Note, CreatedBy: userID.(uuid.UUID),
	}
	h.DB.Create(&expense)
	h.DB.Preload("Creator").First(&expense, "id = ?", expense.ID)
	LogActivity(h.DB, userID.(uuid.UUID), models.ActionCreate, "MiscExpense", expense.ID.String(), &eID,
		fmt.Sprintf("Added misc expense '%s' ₹%.2f", expense.Description, expense.Amount))
	c.JSON(http.StatusCreated, expense)
}

func (h *MiscExpenseHandler) Delete(c *gin.Context) {
	eventID, mID := c.Param("id"), c.Param("mId")
	eID, _ := uuid.Parse(eventID)
	var expense models.MiscExpense
	if err := h.DB.First(&expense, "id = ? AND event_id = ?", mID, eventID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Misc expense not found"})
		return
	}
	userID, _ := c.Get("user_id")
	h.DB.Delete(&expense)
	LogActivity(h.DB, userID.(uuid.UUID), models.ActionDelete, "MiscExpense", expense.ID.String(), &eID,
		"Deleted misc expense: "+expense.Description)
	c.JSON(http.StatusOK, gin.H{"message": "Misc expense deleted"})
}
