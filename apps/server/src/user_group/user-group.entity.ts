import { Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { User } from 'src/users/user.entity'
import { Group } from 'src/groups/group.entity'

@Entity({ name: 'user_group' })
export class UserGroup extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Relation<User>

  @ManyToOne(() => Group, { nullable: false })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group: Relation<Group>
}
