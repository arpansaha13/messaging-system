import { Router, Request, Response } from 'express'
import type { ContactService } from '../services/contact.service'
import { validateDto } from '../utils/validate-dto'
import { CreateContactDto, UpdateContactDto } from '../dto/contact.dto'

export function createContactRouter(contactService: ContactService) {
  const router = Router()

  router.get('/', async (req: Request, res: Response) => {
    const q = req.query.search as string | undefined
    if (q) {
      const results = await contactService.getContactsByQuery(req.user.id, q)
      return res.json(results)
    }

    const results = await contactService.getContacts(req.user.id)
    res.json(results)
  })

  router.post('/', validateDto(CreateContactDto), async (req: Request, res: Response) => {
    const { userIdToAdd, alias } = req.body
    try {
      const created = await contactService.addContact(req.user.id, Number(userIdToAdd), alias)
      res.status(201).json(created)
    } catch (err: any) {
      res.status(400).json({ message: err.message })
    }
  })

  router.patch('/:contactId', validateDto(UpdateContactDto), async (req: Request, res: Response) => {
    const contactId = Number(req.params.contactId)
    const { new_alias } = req.body
    await contactService.editAlias(contactId, new_alias)
    res.status(204).send()
  })

  router.delete('/:contactId', async (req: Request, res: Response) => {
    const contactId = Number(req.params.contactId)
    await contactService.deleteContact(contactId)
    res.status(204).send()
  })

  return router
}
