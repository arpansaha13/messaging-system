import { connect as amqpConnect, type Channel, type ChannelModel } from 'amqplib'

const OUTGOING_EXCHANGE = 'outgoing_messages'

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

      // Declare outgoing exchange if not exists
      await this.channel.assertExchange(OUTGOING_EXCHANGE, 'direct', { durable: true })

      console.log('RabbitMQ connected from backend')
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
      console.log('RabbitMQ disconnected from backend')
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error)
    }
  }

  async publishToOutgoing(routingKey: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized')
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message))
      this.channel.publish(OUTGOING_EXCHANGE, routingKey, messageBuffer, { persistent: true })
    } catch (error) {
      console.error('Error publishing to outgoing exchange:', error)
      throw error
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null
  }
}
