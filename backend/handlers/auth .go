package handlers

import (
	"net/http"
	"time"

	"catering-backend/middleware"
	"catering-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	DB        *gorm.DB
	JWTSecret string
}

func NewAuthHandler(db *gorm.DB, secret string) *AuthHandler {
	return &AuthHandler{DB: db, JWTSecret: secret}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var user models.User
	if err := h.DB.Where("email = ? AND is_active = true", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	token, err := h.generateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":         user.ID,
			"name":       user.Name,
			"email":      user.Email,
			"role":       user.Role,
			"is_active":  user.IsActive,
			"created_at": user.CreatedAt,
		},
	})
}

func (h *AuthHandler) CreateUser(c *gin.Context) {
	var input struct {
		Name     string          `json:"name" binding:"required"`
		Email    string          `json:"email" binding:"required,email"`
		Password string          `json:"password" binding:"required,min=6"`
		Role     models.UserRole `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Role != models.RoleAdmin && input.Role != models.RoleSubAdmin && input.Role != models.RoleStaff {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Must be admin, sub_admin, or staff"})
		return
	}
	currentRole, _ := c.Get("user_role")
	if input.Role == models.RoleAdmin && currentRole != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can create other admins"})
		return
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	creatorID, _ := c.Get("user_id")
	creatorUUID := creatorID.(uuid.UUID)
	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashed),
		Role:     input.Role,
		ParentID: &creatorUUID,
	}
	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}
	LogActivity(h.DB, creatorUUID, models.ActionCreate, "User", user.ID.String(), nil, "Created user: "+user.Name+" ("+string(user.Role)+")")
	c.JSON(http.StatusCreated, gin.H{
		"id":        user.ID,
		"name":      user.Name,
		"email":     user.Email,
		"role":      user.Role,
		"is_active": user.IsActive,
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var user models.User
	if err := h.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"name":       user.Name,
		"email":      user.Email,
		"role":       user.Role,
		"is_active":  user.IsActive,
		"created_at": user.CreatedAt,
	})
}

func (h *AuthHandler) ListUsers(c *gin.Context) {
	var users []models.User
	h.DB.Where("deleted_at IS NULL").Find(&users)
	// Strip passwords
	type SafeUser struct {
		ID        uuid.UUID       `json:"id"`
		Name      string          `json:"name"`
		Email     string          `json:"email"`
		Role      models.UserRole `json:"role"`
		IsActive  bool            `json:"is_active"`
		ParentID  *uuid.UUID      `json:"parent_id,omitempty"`
		CreatedAt time.Time       `json:"created_at"`
	}
	var safe []SafeUser
	for _, u := range users {
		safe = append(safe, SafeUser{
			ID: u.ID, Name: u.Name, Email: u.Email,
			Role: u.Role, IsActive: u.IsActive,
			ParentID: u.ParentID, CreatedAt: u.CreatedAt,
		})
	}
	c.JSON(http.StatusOK, safe)
}

func (h *AuthHandler) ToggleUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := h.DB.First(&user, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	user.IsActive = !user.IsActive
	h.DB.Save(&user)
	action := "Activated"
	if !user.IsActive {
		action = "Deactivated"
	}
	userID, _ := c.Get("user_id")
	LogActivity(h.DB, userID.(uuid.UUID), models.ActionUpdate, "User", user.ID.String(), nil, action+" user: "+user.Name)
	c.JSON(http.StatusOK, gin.H{"is_active": user.IsActive, "message": action + " successfully"})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var input struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, _ := c.Get("user_id")
	var user models.User
	h.DB.First(&user, "id = ?", userID)
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.OldPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Current password is incorrect"})
		return
	}
	hashed, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	user.Password = string(hashed)
	h.DB.Save(&user)
	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

func (h *AuthHandler) generateToken(userID uuid.UUID, role models.UserRole) (string, error) {
	claims := middleware.Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(h.JWTSecret))
}
