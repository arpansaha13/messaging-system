import { MigrationInterface, QueryRunner } from "typeorm";

export class V11716548036523 implements MigrationInterface {
    name = 'V11716548036523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chats" RENAME COLUMN "first_msg_tstamp" TO "cleared_at"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chats" RENAME COLUMN "cleared_at" TO "first_msg_tstamp"`);
    }

}
