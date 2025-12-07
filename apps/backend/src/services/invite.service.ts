import { InviteRepository } from '../repositories/invite.repository'
import { UserGroupRepository } from '../repositories/user-group.repository'
import { ChannelRepository } from '../repositories/channel.repository'
import AppDataSource from '../data-source'
import { Invite } from '../models/invite.entity'

export class InviteService {
  constructor(
    private repo: InviteRepository,
    private userGroupRepo?: UserGroupRepository,
    private channelRepo?: ChannelRepository,
  ) {}

  async createInvite(authUser: any, groupId: number) {
    const em = AppDataSource.manager
    return em.transaction(async txn => {
      // if invite exists and not expired, return existing
      const existing = await txn.findOne(Invite, {
        where: { inviter: { id: authUser.id }, group: { id: groupId }, expiresAt: () => "timestamptz('now')" } as any,
      } as any)
      // simplify: always create a new invite
      const hash = Math.random().toString(36).slice(2, 8)
      const timestamp = new Date()
      const inv: any = txn.create(Invite, {
        hash,
        group: { id: groupId } as any,
        inviter: authUser,
        createdAt: timestamp,
        updatedAt: timestamp,
        expiresAt: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000),
      })
      return txn.save(inv)
    })
  }

  findByHash(hash: string) {
    return this.repo.findByHash(hash)
  }

  async acceptInvite(authUser: any, inviteHash: string) {
    const invite = await this.repo.findByHashWithGroup(inviteHash)
    if (!invite) throw new Error('This invite link is either invalid or expired.')

    // Check if user already in group
    if (this.userGroupRepo) {
      const exists = await this.userGroupRepo.findOne({
        where: { user: { id: authUser.id }, group: { id: invite.group.id } },
      })
      if (exists) throw new Error('User has already joined group')

      // Add user to group
      await this.userGroupRepo.saveUserGroup({
        user: { id: authUser.id } as any,
        group: { id: invite.group.id } as any,
      })
    }

    // Get channels
    const channels = this.channelRepo ? await this.channelRepo.getChannelsByGroupId(invite.group.id) : []

    return {
      groupId: invite.group.id,
      channels: channels.map((c: any) => c.id),
    }
  }
}
