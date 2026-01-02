import { connect as amqpConnect, type Channel, type ChannelModel } from 'amqplib'
import { MemcachedService } from './memcached.service'

const INCOMING_EXCHANGE = 'incoming_messages'
const OUTGOING_EXCHANGE = 'outgoing_messages'

export class RabbitMQService {
  private connection: ChannelModel | null = null
  private channel: Channel | null = null
  private readonly serverId: string
  private readonly serverQueue: string
  private readonly memcachedService: MemcachedService

  constructor(memcachedService: MemcachedService) {
    this.serverId = process.env.SERVER_ID || 'server-1'
    this.serverQueue = `server-${this.serverId}`
    this.memcachedService = memcachedService
  }

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

      // Declare server queue
      await this.channel.assertQueue(this.serverQueue, { exclusive: true })

      // Bind server queue to outgoing exchange with server ID as routing key
      await this.channel.bindQueue(this.serverQueue, OUTGOING_EXCHANGE, this.serverId)

      console.log(`RabbitMQ connected. Server ID: ${this.serverId}, Queue: ${this.serverQueue}`)
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

  async bindUserToQueue(userId: number): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized')
    }

    try {
      const routingKey = userId.toString()
      await this.channel.bindQueue(this.serverQueue, OUTGOING_EXCHANGE, routingKey)

      console.log(`Bound user ${userId} to queue ${this.serverQueue}`)
    } catch (error) {
      console.error(`Error binding user ${userId} to queue:`, error)
      throw error
    }
  }

  async unbindUserFromQueue(userId: number): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized')
    }

    try {
      const routingKey = userId.toString()
      await this.channel.unbindQueue(this.serverQueue, OUTGOING_EXCHANGE, routingKey)

      console.log(`Unbound user ${userId} from queue ${this.serverQueue}`)
    } catch (error) {
      console.error(`Error unbinding user ${userId} from queue:`, error)
      throw error
    }
  }

  async publishToIncoming(routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized')
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message))
      return this.channel.publish(INCOMING_EXCHANGE, routingKey, messageBuffer, { persistent: true })
    } catch (error) {
      console.error('Error publishing to incoming exchange:', error)
      throw error
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

  async consumeFromServerQueue(onMessage: (message: any, ack: () => void) => void): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized')
    }

    try {
      await this.channel.consume(
        this.serverQueue,
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
            console.error('Error processing message from server queue:', error)
            this.channel?.nack(msg, false, false) // Reject and don't requeue
          }
        },
        { noAck: false },
      )

      console.log(`Started consuming from queue: ${this.serverQueue}`)
    } catch (error) {
      console.error('Error setting up consumer:', error)
      throw error
    }
  }

  getServerId(): string {
    return this.serverId
  }

  getServerQueue(): string {
    return this.serverQueue
  }
}
