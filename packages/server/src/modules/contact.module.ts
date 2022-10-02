import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// Controller
import { ContactController } from 'src/controllers/contact.controller'
// Service
import { ContactService } from 'src/services/contact.service'
// Entity
import { ContactEntity } from 'src/entities/contact.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity])],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
