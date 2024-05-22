import { Injectable } from '@nestjs/common'
import { Repository, DataSource } from 'typeorm'
import { User } from './user.entity'

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager())
  }

  async getConvo(userId: User['id']): Promise<any[]> {
    const query = `SELECT
      t1.*,
      msg.content AS msg_content,
      msg.created_at AS msg_created_at,
      msg.sender_id AS msg_sender_id,
      msg.status AS msg_status
    FROM (
      SELECT
        u2r.u2r_id, u2r.u2r_archived, u2r.u2r_pinned, u2r.u2r_muted,
        r.id AS r_id, r.is_group AS r_is_group,
        u.id AS u_id, u.dp AS u_dp, u.bio AS u_bio, u.global_name AS u_global_name,
        contact.id AS c_id, contact.alias AS c_alias,
        (
          SELECT msg.id AS msg_id
          FROM messages AS msg
          WHERE msg.room_id = r.id AND msg.created_at >= u2r.u2r_first_msg_tstamp
          ORDER BY msg.created_at DESC
          LIMIT 1
        ) as msg_id
      FROM (
        SELECT
          u2r.user_to_room_id AS u2r_id,
          u2r.archived AS u2r_archived,
          u2r.pinned AS u2r_pinned,
          u2r.is_muted AS u2r_muted,
          u2r.room_id AS u2r_room_id,
          u2r.first_msg_tstamp AS u2r_first_msg_tstamp
        FROM user_to_room AS u2r
        WHERE u2r.user_id = ${userId} AND u2r.deleted = FALSE
      ) AS u2r
      INNER JOIN rooms AS r ON r.id = u2r.u2r_room_id
      INNER JOIN user_to_room AS r2u ON r2u.room_id = r.id AND r2u.user_id != ${userId}
      INNER JOIN users AS u ON r2u.user_id = u.id
      LEFT JOIN contacts AS contact ON contact.user_id_in_contact = u.id AND contact.user_id = ${userId}
    ) AS t1
    LEFT JOIN messages AS msg ON t1.msg_id = msg.id
    ORDER BY
      t1.u2r_pinned DESC,
      CASE WHEN msg.created_at IS NULL THEN 1 ELSE 0 END,
      msg.created_at DESC
    `
    // Use LEFT JOIN for contacts, otherwise convo with unknown users won't load
    // Use LEFT JOIN for messages, otherwise convo's with no messages won't load
    // If latestMsg is `null`, then it ranks in the end

    return this.manager.query(query)
  }
}
