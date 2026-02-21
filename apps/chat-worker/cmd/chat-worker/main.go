package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	internalbr "github.com/arpansaha13/messaging-system/apps/chat-worker/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/controller"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	commonbr "github.com/arpansaha13/messaging-system/apps/common/broker"
	"github.com/arpansaha13/messaging-system/apps/common/db"
)

func main() {
	// Initialize database
	database, err := db.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize RabbitMQ broker
	messageBroker := internalbr.NewRabbitMQBroker()
	if err := messageBroker.Connect(); err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer messageBroker.Disconnect()

	// Initialize processors
	messageProcessor := processor.NewMessageProcessor(database, messageBroker)
	statusProcessor := processor.NewStatusProcessor(database, messageBroker)
	connectionProcessor := processor.NewConnectionProcessor(database, messageBroker)

	// Initialize event controller with dependency injection
	eventController := controller.NewEventController(messageProcessor, statusProcessor, connectionProcessor)

	// Setup worker queue consumer
	if err := messageBroker.ConsumeWorkerQueue(func(msg *commonbr.MessagePayload, ack func()) error {
		if err := eventController.HandleWorkerQueueEvent(msg); err != nil {
			log.Printf("Error handling worker queue event: %v", err)
		}
		ack()
		return nil
	}); err != nil {
		log.Fatalf("Failed to setup worker queue consumer: %v", err)
	}

	// Setup connection queue consumer
	if err := messageBroker.ConsumeConnectionQueue(func(msg *commonbr.UserConnectionPayload, ack func()) error {
		if err := eventController.HandleConnectionQueueEvent(msg); err != nil {
			log.Printf("Error handling connection queue event: %v", err)
		}
		ack()
		return nil
	}); err != nil {
		log.Fatalf("Failed to setup connection queue consumer: %v", err)
	}

	log.Println("Chat worker started and ready to process messages")

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)

	<-sigChan
	log.Println("SIGTERM received, shutting down gracefully...")

	// Close database
	sqlDB, err := database.DB()
	if err == nil {
		sqlDB.Close()
	}

	log.Println("Chat worker stopped")
}
