package worker

import (
	"context"
	"fmt"
	"net/smtp"

	"go.uber.org/zap"
)

// SMTPEmailProvider implements EmailProvider using SMTP
type SMTPEmailProvider struct {
	host     string
	port     int
	user     string
	password string
	fromAddr string
}

// NewSMTPEmailProvider creates a new SMTP email provider
func NewSMTPEmailProvider(host string, port int, user, password, fromAddr string) *SMTPEmailProvider {
	return &SMTPEmailProvider{
		host:     host,
		port:     port,
		user:     user,
		password: password,
		fromAddr: fromAddr,
	}
}

// SendEmail sends an email via SMTP
func (p *SMTPEmailProvider) SendEmail(ctx context.Context, email, subject, body string) error {
	// Format the message
	message := fmt.Sprintf(
		"To: %s\r\nSubject: %s\r\n\r\n%s",
		email,
		subject,
		body,
	)

	// Set up authentication
	auth := smtp.PlainAuth("", p.user, p.password, p.host)

	// Send the email
	addr := fmt.Sprintf("%s:%d", p.host, p.port)
	err := smtp.SendMail(addr, auth, p.fromAddr, []string{email}, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// MockEmailProvider is a mock implementation for development/testing
type MockEmailProvider struct {
	sentEmails []SentEmail
}

// SentEmail represents an email that was sent
type SentEmail struct {
	To      string
	Subject string
	Body    string
}

// NewMockEmailProvider creates a new mock email provider
func NewMockEmailProvider() *MockEmailProvider {
	return &MockEmailProvider{
		sentEmails: make([]SentEmail, 0),
	}
}

// SendEmail logs the email instead of sending it
func (p *MockEmailProvider) SendEmail(ctx context.Context, email, subject, body string) error {
	sentEmail := SentEmail{
		To:      email,
		Subject: subject,
		Body:    body,
	}
	p.sentEmails = append(p.sentEmails, sentEmail)

	zap.L().Info("mock email sent", zap.String("to", email), zap.String("subject", subject))
	zap.L().Debug("mock email body", zap.String("body", body))

	return nil
}

// GetSentEmails returns all sent emails (for testing)
func (p *MockEmailProvider) GetSentEmails() []SentEmail {
	return p.sentEmails
}

// Clear clears the sent emails list
func (p *MockEmailProvider) Clear() {
	p.sentEmails = make([]SentEmail, 0)
}
