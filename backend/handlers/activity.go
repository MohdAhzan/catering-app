package handlers

import (
	"encoding/json"

	"catering-backend/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func LogActivity(db *gorm.DB, userID uuid.UUID, action models.ActionType, entityType, entityID string, eventID *uuid.UUID, description string) {
	log := models.ActivityLog{
		UserID:      userID,
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		EventID:     eventID,
		Description: description,
	}
	db.Create(&log)
}

func LogActivityWithDiff(db *gorm.DB, userID uuid.UUID, action models.ActionType, entityType, entityID string, eventID *uuid.UUID, description string, oldVals, newVals interface{}) {
	log := models.ActivityLog{
		UserID:      userID,
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		EventID:     eventID,
		Description: description,
	}
	if oldVals != nil {
		b, _ := json.Marshal(oldVals)
		log.OldValues = string(b)
	}
	if newVals != nil {
		b, _ := json.Marshal(newVals)
		log.NewValues = string(b)
	}
	db.Create(&log)
}
