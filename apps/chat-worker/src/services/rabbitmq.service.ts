import { connect as amqpConnect, type Channel, type ChannelModel } from 'amqplib'

const INCOMING_EXCHANGE = 'incoming_messages'
const OUTGOING_EXCHANGE = 'outgoing_messages'
const SUBSCRIPTION_EXCHANGE = 'subscription_data'
const WORKER_QUEUE = 'chat-worker-queue'
const CONNECTION_QUEUE = 'connection-events-queue'

export class RabbitMQService {
  private connection: ChannelModel | null = null
  private channel: Channel | null = null

  async connect(): Promise<void> {
    try {
      const hostname = process.env.RABBITMQ_HOST || 'localhost'
      const port = Number.parseInt(process.env.RABBITMQ_PORT || '5672')
      const username = process.env.RABBITMQ_USER || 'guest'
      const password = process.env.RABBITMQ_PASS || 'guest'

      this.connection = await amqpConnect({
        hostname,
        port,
        password,
        username,
      })
      this.channel = await this.connection.createChannel()

      // Declare exchanges
      await this.channel.assertExchange(INCOMING_EXCHANGE, 'direct', { durable: true })
      await this.channel.assertExchange(OUTGOING_EXCHANGE, 'direct', { durable: true })
      await this.channel.assertExchange(SUBSCRIPTION_EXCHANGE, 'direct', { durable: true })

      // Declare worker queues
      await this.channel.assertQueue(WORKER_QUEUE, { durable: true })
      await this.channel.assertQueue(CONNECTION_QUEUE, { durable: true })

      // Bind queues to incoming exchange with routing keys
      await this.channel.bindQueue(WORKER_QUEUE, INCOMING_EXCHANGE, 'personal.message')
      await this.channel.bindQueue(WORKER_QUEUE, INCOMING_EXCHANGE, 'personal.delivered')
      await this.channel.bindQueue(WORKER_QUEUE, INCOMING_EXCHANGE, 'personal.read')
      await this.channel.bindQueue(WORKER_QUEUE, INCOMING_EXCHANGE, 'group.message')

      // Bind connection queue to incoming exchange
      await this.channel.bindQueue(CONNECTION_QUEUE, INCOMING_EXCHANGE, 'connection.user')

      console.log('RabbitMQ connected. Worker queue ready.')
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close()
        this.channel = null
      }
      if (this.connection) {
        await this.connection.close()
        this.connection = null
      }
      console.log('RabbitMQ disconnected')
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error)
    }
  }

  async publishToOutgoing(routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized')
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message))
      return this.channel.publish(OUTGOING_EXCHANGE, routingKey, messageBuffer, { persistent: true })
    } catch (error) {
      console.error('Error publishing to outgoing exchange:', error)
      throw error
    }
  }

  async consumeFromWorkerQueue(onMessage: (message: any, ack: () => void) => void): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized')
    }

    try {
      await this.channel.consume(
        WORKER_QUEUE,
        async msg => {
          if (!msg) {
            return
          }

          try {
            const content = JSON.parse(msg.content.toString())
            onMessage(content, () => {
              this.channel?.ack(msg)
            })
          } catch (error) {
            console.error('Error processing message from worker queue:', error)
            this.channel?.nack(msg, false, false) // Reject and don't requeue
          }
        },
        { noAck: false },
      )

      console.log(`Started consuming from queue: ${WORKER_QUEUE}`)
    } catch (error) {
      console.error('Error setting up consumer:', error)
      throw error
    }
  }

  async consumeFromConnectionQueue(onMessage: (message: any, ack: () => void) => void): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized')
    }

    try {
      await this.channel.consume(
        CONNECTION_QUEUE,
        async msg => {
          if (!msg) {
            return
          }

          try {
            const content = JSON.parse(msg.content.toString())
            onMessage(content, () => {
              this.channel?.ack(msg)
            })
          } catch (error) {
            console.error('Error processing message from connection queue:', error)
            this.channel?.nack(msg, false, false) // Reject and don't requeue
          }
        },
        { noAck: false },
      )

      console.log(`Started consuming from queue: ${CONNECTION_QUEUE}`)
    } catch (error) {
      console.error('Error setting up connection queue consumer:', error)
      throw error
    }
  }

  async publishToSubscription(routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized')
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message))
      return this.channel.publish(SUBSCRIPTION_EXCHANGE, routingKey, messageBuffer, { persistent: true })
    } catch (error) {
      console.error('Error publishing to subscription exchange:', error)
      throw error
    }
  }
}
