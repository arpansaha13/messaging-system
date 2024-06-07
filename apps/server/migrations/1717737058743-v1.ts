import { MigrationInterface, QueryRunner } from "typeorm";

export class V11717737058743 implements MigrationInterface {
    name = 'V11717737058743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_af0a71ac1879b584f255c49c99a"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_c184f2b4ad4192b2df43013b55c"`);
        await queryRunner.query(`ALTER TABLE "contacts" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contacts" ALTER COLUMN "user_id_in_contact" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TABLE "message_recipients" DROP CONSTRAINT "FK_ba7ae7820d8342815027197b515"`);
        await queryRunner.query(`ALTER TABLE "message_recipients" DROP CONSTRAINT "FK_a7e3f5be432bdfcc8654a311f2e"`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ALTER COLUMN "message_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ALTER COLUMN "receiver_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "sender_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_ed49245ae87902459011243d69a"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_543183a92a0aa5ae2851b69913c"`);
        await queryRunner.query(`ALTER TABLE "chats" ALTER COLUMN "sender_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chats" ALTER COLUMN "receiver_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_af0a71ac1879b584f255c49c99a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_c184f2b4ad4192b2df43013b55c" FOREIGN KEY ("user_id_in_contact") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
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
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_c184f2b4ad4192b2df43013b55c"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_af0a71ac1879b584f255c49c99a"`);
        await queryRunner.query(`ALTER TABLE "chats" ALTER COLUMN "receiver_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chats" ALTER COLUMN "sender_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_543183a92a0aa5ae2851b69913c" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_ed49245ae87902459011243d69a" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "sender_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ALTER COLUMN "receiver_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ALTER COLUMN "message_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ADD CONSTRAINT "FK_a7e3f5be432bdfcc8654a311f2e" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ADD CONSTRAINT "FK_ba7ae7820d8342815027197b515" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710"`);
        await queryRunner.query(`ALTER TABLE "contacts" ALTER COLUMN "user_id_in_contact" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contacts" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_c184f2b4ad4192b2df43013b55c" FOREIGN KEY ("user_id_in_contact") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_af0a71ac1879b584f255c49c99a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
