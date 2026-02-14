package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	internalbr "github.com/arpansaha13/messaging-system/apps/chat-worker-go/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/chat-worker-go/internal/processor"
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

	// Setup worker queue consumer
	if err := messageBroker.ConsumeWorkerQueue(func(msg *commonbr.MessagePayload, ack func()) error {
		switch msg.Type {
		case "MESSAGE_SEND":
			payload, ok := msg.Payload.(map[string]any)
			if !ok {
				return fmt.Errorf("invalid payload format")
			}

			// Check if it's a group or personal message
			if groupId, hasGroup := payload["groupId"]; hasGroup && groupId != nil {
				// Group message
				groupPayload := &commonbr.GroupMessagePayload{
					SenderId:  int64(payload["senderId"].(float64)),
					GroupId:   int64(groupId.(float64)),
					ChannelId: int64(payload["channelId"].(float64)),
					Content:   payload["content"].(string),
					Hash:      payload["hash"].(string),
				}
				if err := messageProcessor.ProcessGroupMessage(groupPayload); err != nil {
					log.Printf("Error processing group message: %v", err)
				}
			} else {
				// Personal message
				personalPayload := &commonbr.PersonalMessagePayload{
					SenderId:   int64(payload["senderId"].(float64)),
					ReceiverId: int64(payload["receiverId"].(float64)),
					Content:    payload["content"].(string),
					Hash:       payload["hash"].(string),
				}
				if err := messageProcessor.ProcessPersonalMessage(personalPayload); err != nil {
					log.Printf("Error processing personal message: %v", err)
				}
			}

		case "STATUS_DELIVERED":
			payload, ok := msg.Payload.(map[string]any)
			if !ok {
				return fmt.Errorf("invalid payload format")
			}

			deliveredPayload := &commonbr.DeliveredPayload{
				MessageId:  int64(payload["messageId"].(float64)),
				ReceiverId: int64(payload["receiverId"].(float64)),
				SenderId:   int64(payload["senderId"].(float64)),
			}
			if err := statusProcessor.ProcessDelivered(deliveredPayload); err != nil {
				log.Printf("Error processing delivered status: %v", err)
			}

		case "STATUS_READ":
			payloadData, ok := msg.Payload.([]any)
			if !ok {
				return fmt.Errorf("invalid payload format for STATUS_READ")
			}

			// Convert payload array to ReadPayload slice
			readPayloads := make([]commonbr.ReadPayload, len(payloadData))
			for i, p := range payloadData {
				p, ok := p.(map[string]any)
				if !ok {
					continue
				}
				readPayloads[i] = commonbr.ReadPayload{
					MessageId:  int64(p["messageId"].(float64)),
					SenderId:   int64(p["senderId"].(float64)),
					ReceiverId: int64(p["receiverId"].(float64)),
				}
			}
			if err := statusProcessor.ProcessRead(readPayloads); err != nil {
				log.Printf("Error processing read status: %v", err)
			}

		default:
			log.Printf("Unknown message type: %s", msg.Type)
		}

		ack()
		return nil
	}); err != nil {
		log.Fatalf("Failed to setup worker queue consumer: %v", err)
	}

	// Setup connection queue consumer
	if err := messageBroker.ConsumeConnectionQueue(func(msg *commonbr.UserConnectionPayload, ack func()) error {
		if err := connectionProcessor.ProcessUserConnection(msg); err != nil {
			log.Printf("Error processing user connection: %v", err)
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
