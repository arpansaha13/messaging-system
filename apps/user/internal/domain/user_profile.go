package domain

import (
	"time"
)

// UserProfile represents the application-specific user data.
type UserProfile struct {
	ID         int64      `gorm:"primaryKey;autoIncrement:false"`
	GlobalName string     `gorm:"not null"`
	DP         *string    `gorm:"column:dp"`
	Bio        string     `gorm:"default:'Hey there!'"`
	CreatedAt  time.Time  `gorm:"autoCreateTime"`
	UpdatedAt  time.Time  `gorm:"autoUpdateTime"`
	DeletedAt  *time.Time `gorm:"index"`
}
