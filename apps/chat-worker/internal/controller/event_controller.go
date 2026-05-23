package controller

import (
	"context"
	"fmt"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/processor"
	"github.com/arpansaha13/messaging-system/apps/common/broker"
	"go.uber.org/zap"
)

// EventController handles incoming events and dispatches them to appropriate processors
type EventController struct {
	statusProcessor     *processor.StatusProcessor
	connectionProcessor *processor.ConnectionProcessor
}

// NewEventController creates a new event controller with injected dependencies
func NewEventController(
	statusProcessor *processor.StatusProcessor,
	connectionProcessor *processor.ConnectionProcessor,
) *EventController {
	return &EventController{
		statusProcessor:     statusProcessor,
		connectionProcessor: connectionProcessor,
	}
}

// HandleWorkerQueueEvent processes a message from the worker queue
func (ec *EventController) HandleWorkerQueueEvent(ctx context.Context, msg *broker.MessagePayload) error {
	ctx = gtk.LoggerWithFields(ctx, zap.String("event_type", msg.Type))
	log := gtk.LoggerFromContext(ctx)
	log.Debug("worker queue event received")

	switch msg.Type {
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
	ctx = gtk.LoggerWithFields(ctx, zap.String("event_type", "CONNECTION_USER"))
	log := gtk.LoggerFromContext(ctx)
	log.Debug("connection queue event received")
	return ec.connectionProcessor.ProcessUserConnection(ctx, msg)
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
