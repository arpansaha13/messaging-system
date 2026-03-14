package controller

import (
	"context"
	"fmt"
	"time"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"go.uber.org/zap"
)

// EventController handles incoming events and dispatches them to appropriate processors
type EventController struct {
	messageProcessor    *processor.MessageProcessor
	statusProcessor     *processor.StatusProcessor
	connectionProcessor *processor.ConnectionProcessor
}

// NewEventController creates a new event controller with injected dependencies
func NewEventController(
	messageProcessor *processor.MessageProcessor,
	statusProcessor *processor.StatusProcessor,
	connectionProcessor *processor.ConnectionProcessor,
) *EventController {
	return &EventController{
		messageProcessor:    messageProcessor,
		statusProcessor:     statusProcessor,
		connectionProcessor: connectionProcessor,
	}
}

// HandleWorkerQueueEvent processes a message from the worker queue
func (ec *EventController) HandleWorkerQueueEvent(ctx context.Context, msg *broker.MessagePayload) error {
	ctx = logger.WithFields(ctx, zap.String("event_type", msg.Type))
	log := logger.FromContext(ctx)
	log.Debug("worker queue event received")

	switch msg.Type {
	case "MESSAGE_FORWARD":
		return ec.handleMessageForward(ctx, msg)
	case "STATUS_DELIVERED":
		return ec.handleStatusDelivered(ctx, msg)
	case "STATUS_READ":
		return ec.handleStatusRead(ctx, msg)
	default:
		log.Warn("unknown message type", zap.String("event_type", msg.Type))
		return nil
	}
}

// HandleConnectionQueueEvent processes a connection event from the connection queue
func (ec *EventController) HandleConnectionQueueEvent(ctx context.Context, msg *broker.UserConnectionPayload) error {
	ctx = logger.WithFields(ctx, zap.String("event_type", "CONNECTION_USER"))
	log := logger.FromContext(ctx)
	log.Debug("connection queue event received")
	return ec.connectionProcessor.ProcessUserConnection(ctx, msg)
}

// handleMessageForward processes MESSAGE_FORWARD events (personal and group)
func (ec *EventController) handleMessageForward(ctx context.Context, msg *broker.MessagePayload) error {
	payload, ok := msg.Payload.(map[string]any)
	if !ok {
		return fmt.Errorf("invalid payload format for MESSAGE_FORWARD")
	}

	// Parse createdAt (comes as RFC3339 string from JSON)
	var createdAt time.Time
	if createdAtStr, ok := payload["createdAt"].(string); ok {
		createdAt, _ = time.Parse(time.RFC3339Nano, createdAtStr)
	}

	// Dispatch on presence of groupId
	if groupId, hasGroup := payload["groupId"]; hasGroup && groupId != nil {
		groupPayload := &broker.ForwardGroupMessagePayload{
			MessageId: int64(payload["messageId"].(float64)),
			SenderId:  int64(payload["senderId"].(float64)),
			GroupId:   int64(groupId.(float64)),
			ChannelId: int64(payload["channelId"].(float64)),
			Content:   payload["content"].(string),
			Hash:      payload["hash"].(string),
			CreatedAt: createdAt,
		}
		if err := ec.messageProcessor.ForwardGroupMessage(ctx, groupPayload); err != nil {
			return fmt.Errorf("error forwarding group message: %w", err)
		}
	} else {
		personalPayload := &broker.ForwardPersonalMessagePayload{
			MessageId:  int64(payload["messageId"].(float64)),
			SenderId:   int64(payload["senderId"].(float64)),
			ReceiverId: int64(payload["receiverId"].(float64)),
			Content:    payload["content"].(string),
			CreatedAt:  createdAt,
		}
		if err := ec.messageProcessor.ForwardPersonalMessage(ctx, personalPayload); err != nil {
			return fmt.Errorf("error forwarding personal message: %w", err)
		}
	}

	return nil
}

// handleStatusDelivered processes STATUS_DELIVERED events
func (ec *EventController) handleStatusDelivered(ctx context.Context, msg *broker.MessagePayload) error {
	payload, ok := msg.Payload.(map[string]any)
	if !ok {
		return fmt.Errorf("invalid payload format for STATUS_DELIVERED")
	}

	deliveredPayload := &broker.DeliveredPayload{
		MessageId:  int64(payload["messageId"].(float64)),
		ReceiverId: int64(payload["receiverId"].(float64)),
		SenderId:   int64(payload["senderId"].(float64)),
	}

	if err := ec.statusProcessor.ProcessDelivered(ctx, deliveredPayload); err != nil {
		return fmt.Errorf("error processing delivered status: %w", err)
	}

	return nil
}

// handleStatusRead processes STATUS_READ events
func (ec *EventController) handleStatusRead(ctx context.Context, msg *broker.MessagePayload) error {
	payloadData, ok := msg.Payload.([]any)
	if !ok {
		return fmt.Errorf("invalid payload format for STATUS_READ")
	}

	// Convert payload array to ReadPayload slice
	readPayloads := make([]broker.ReadPayload, len(payloadData))
	for i, p := range payloadData {
		p, ok := p.(map[string]any)
		if !ok {
			continue
		}
		readPayloads[i] = broker.ReadPayload{
			MessageId:  int64(p["messageId"].(float64)),
			SenderId:   int64(p["senderId"].(float64)),
			ReceiverId: int64(p["receiverId"].(float64)),
		}
	}

	if err := ec.statusProcessor.ProcessRead(ctx, readPayloads); err != nil {
		return fmt.Errorf("error processing read status: %w", err)
	}

	return nil
}
