import 'reflect-metadata'
import AppDataSource from './data-source'
import { RabbitMQService } from './services/rabbitmq.service'
import { MessageProcessor } from './services/message-processor'
import { StatusProcessor } from './services/status-processor'
import { MemcachedService } from './services/memcached.service'

async function bootstrap() {
  try {
    // Initialize database
    await AppDataSource.initialize()
    console.log('Data source initialized')

    // Initialize services
    const memcachedService = new MemcachedService()
    const rabbitmqService = new RabbitMQService()
    const messageProcessor = new MessageProcessor(rabbitmqService, memcachedService)
    const statusProcessor = new StatusProcessor(rabbitmqService, memcachedService)

    // Connect to RabbitMQ
    await rabbitmqService.connect()

    // Setup consumer
    await rabbitmqService.consumeFromWorkerQueue(async (message, ack) => {
      try {
        const { type, payload } = message

        switch (type) {
          case 'MESSAGE_SEND':
            if (payload.groupId !== undefined) {
              // Group message
              await messageProcessor.processGroupMessage(payload)
            } else {
              // Personal message
              await messageProcessor.processPersonalMessage(payload)
            }
            break

          case 'STATUS_DELIVERED':
            await statusProcessor.processDelivered(payload)
            break

          case 'STATUS_READ':
            await statusProcessor.processRead(payload)
            break

          default:
            console.warn(`Unknown message type: ${type}`)
        }

        ack()
      } catch (error) {
        console.error('Error processing message:', error)
        // Acknowledge to prevent infinite retries, but log the error
        ack()
      }
    })

    console.log('Chat worker started and ready to process messages')

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully')
      await rabbitmqService.disconnect()
      await AppDataSource.destroy()
      process.exit(0)
    })
  } catch (err) {
    console.error('Failed to start worker', err)
    process.exit(1)
  }
}

bootstrap()
