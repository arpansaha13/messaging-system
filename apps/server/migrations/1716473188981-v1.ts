import { MigrationInterface, QueryRunner } from "typeorm";

export class V11716473188981 implements MigrationInterface {
    name = 'V11716473188981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_1dda4fc8dbeeff2ee71f0088ba0"`);
        await queryRunner.query(`CREATE TABLE "message_recipients" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "status" character varying NOT NULL DEFAULT 'SENT', "message_id" integer, "receiver_id" integer, CONSTRAINT "PK_e402cb51e37423da8d8a94cb3e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chats" ("id" SERIAL NOT NULL, "first_msg_tstamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "muted" boolean NOT NULL DEFAULT false, "archived" boolean NOT NULL DEFAULT false, "pinned" boolean NOT NULL DEFAULT false, "sender_id" integer, "receiver_id" integer, CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "deleted_by"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "deleted_for_everyone"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "room_id"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "sender_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ADD CONSTRAINT "FK_ba7ae7820d8342815027197b515" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ADD CONSTRAINT "FK_a7e3f5be432bdfcc8654a311f2e" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_ed49245ae87902459011243d69a" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_543183a92a0aa5ae2851b69913c" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_543183a92a0aa5ae2851b69913c"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_ed49245ae87902459011243d69a"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "message_recipients" DROP CONSTRAINT "FK_a7e3f5be432bdfcc8654a311f2e"`);
        await queryRunner.query(`ALTER TABLE "message_recipients" DROP CONSTRAINT "FK_ba7ae7820d8342815027197b515"`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "sender_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "room_id" integer`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "deleted_for_everyone" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "deleted_by" jsonb NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "status" character varying NOT NULL DEFAULT 'SENT'`);
        await queryRunner.query(`DROP TABLE "chats"`);
        await queryRunner.query(`DROP TABLE "message_recipients"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_1dda4fc8dbeeff2ee71f0088ba0" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
