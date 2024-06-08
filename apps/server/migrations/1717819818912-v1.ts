import { MigrationInterface, QueryRunner } from "typeorm";

export class V11717819818912 implements MigrationInterface {
    name = 'V11717819818912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "PK_294abca5a52489a05379cbf6452" PRIMARY KEY ("sender_id", "receiver_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "PK_294abca5a52489a05379cbf6452"`);
        await queryRunner.query(`ALTER TABLE "chats" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id")`);
    }

}
