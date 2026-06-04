package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin    UserRole = "admin"
	RoleSubAdmin UserRole = "sub_admin"
	RoleStaff    UserRole = "staff"
)

type User struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Name      string         `gorm:"not null" json:"name"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"not null" json:"-"`
	Role      UserRole       `gorm:"not null;default:'staff'" json:"role"`
	ParentID  *uuid.UUID     `gorm:"type:uuid" json:"parent_id,omitempty"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	Parent    *User          `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
}

type EventStatus string

const (
	StatusDraft     EventStatus = "draft"
	StatusConfirmed EventStatus = "confirmed"
	StatusCompleted EventStatus = "completed"
	StatusCancelled EventStatus = "cancelled"
)

type Event struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	Name         string         `gorm:"not null" json:"name"`
	Location     string         `json:"location"`
	Date         time.Time      `gorm:"not null" json:"date"`
	BillNumber   string         `gorm:"uniqueIndex;not null" json:"bill_number"`
	Status       EventStatus    `gorm:"default:'draft'" json:"status"`
	Notes        string         `json:"notes"`
	CreatedBy    uuid.UUID      `gorm:"type:uuid;not null" json:"created_by"`
	Creator      User           `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	BillingItems []BillingItem  `gorm:"foreignKey:EventID" json:"billing_items,omitempty"`
	Expenses     []Expense      `gorm:"foreignKey:EventID" json:"expenses,omitempty"`
	MiscExpenses []MiscExpense  `gorm:"foreignKey:EventID" json:"misc_expenses,omitempty"`
	// Computed fields (not stored)
	TotalBilling  float64 `gorm:"-" json:"total_billing"`
	TotalExpenses float64 `gorm:"-" json:"total_expenses"`
	TotalMisc     float64 `gorm:"-" json:"total_misc"`
	ProfitLoss    float64 `gorm:"-" json:"profit_loss"`
}

type BillingItem struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	EventID     uuid.UUID      `gorm:"type:uuid;not null;index" json:"event_id"`
	ItemName    string         `gorm:"not null" json:"item_name"`
	Description string         `json:"description"`
	Quantity    float64        `gorm:"not null;default:1" json:"quantity"`
	Rate        float64        `gorm:"not null" json:"rate"`
	Amount      float64        `gorm:"not null" json:"amount"`
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	CreatedBy   uuid.UUID      `gorm:"type:uuid;not null" json:"created_by"`
}

func (b *BillingItem) BeforeSave(tx *gorm.DB) error {
	b.Amount = b.Quantity * b.Rate
	return nil
}

type Expense struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	EventID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"event_id"`
	Description  string         `gorm:"not null" json:"description"`
	Amount       float64        `gorm:"not null" json:"amount"`
	BillImageURL string         `json:"bill_image_url,omitempty"`
	Category     string         `json:"category"`
	CreatedBy    uuid.UUID      `gorm:"type:uuid;not null" json:"created_by"`
	Creator      User           `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}

type MiscExpense struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	EventID     uuid.UUID      `gorm:"type:uuid;not null;index" json:"event_id"`
	Description string         `gorm:"not null" json:"description"`
	Amount      float64        `gorm:"not null" json:"amount"`
	Note        string         `json:"note"`
	CreatedBy   uuid.UUID      `gorm:"type:uuid;not null" json:"created_by"`
	Creator     User           `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}

type ActionType string

const (
	ActionCreate ActionType = "CREATE"
	ActionUpdate ActionType = "UPDATE"
	ActionDelete ActionType = "DELETE"
)

type ActivityLog struct {
	ID          uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt   time.Time  `json:"created_at"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	User        User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Action      ActionType `gorm:"not null" json:"action"`
	EntityType  string     `gorm:"not null" json:"entity_type"`
	EntityID    string     `gorm:"not null" json:"entity_id"`
	EventID     *uuid.UUID `gorm:"type:uuid;index" json:"event_id,omitempty"`
	Description string     `json:"description"`
	OldValues   string     `gorm:"type:text" json:"old_values,omitempty"`
	NewValues   string     `gorm:"type:text" json:"new_values,omitempty"`
}
