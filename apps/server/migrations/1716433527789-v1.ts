import { MigrationInterface, QueryRunner } from "typeorm";

export class V11716433527789 implements MigrationInterface {
    name = 'V11716433527789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_to_room" ALTER COLUMN "first_msg_tstamp" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_to_room" ALTER COLUMN "first_msg_tstamp" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_to_room" ALTER COLUMN "first_msg_tstamp" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_to_room" ALTER COLUMN "first_msg_tstamp" DROP NOT NULL`);
    }

}
