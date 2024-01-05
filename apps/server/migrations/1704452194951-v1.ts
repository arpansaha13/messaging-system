import { MigrationInterface, QueryRunner } from "typeorm";

export class V11704452194951 implements MigrationInterface {
    name = 'V11704452194951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "auth" ("user_id" integer NOT NULL, "password" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_3634241a55dbf1e8b0d7d4b7b8c" UNIQUE ("password"), CONSTRAINT "PK_9922406dc7d70e20423aeffadf3" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "contacts" ("id" SERIAL NOT NULL, "alias" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" integer, "user_id_in_contact" integer, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "display_name" character varying NOT NULL, "email" character varying NOT NULL, "dp" character varying, "bio" character varying NOT NULL DEFAULT 'Hey there! I am using WhatsApp.', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" SERIAL NOT NULL, "content" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'SENT', "sender_id" integer NOT NULL, "deleted_by" jsonb NOT NULL, "deleted_for_everyone" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "room_id" integer, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rooms" ("id" SERIAL NOT NULL, "is_group" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_to_room" ("user_to_room_id" SERIAL NOT NULL, "first_msg_tstamp" TIMESTAMP WITH TIME ZONE, "is_muted" boolean NOT NULL DEFAULT false, "archived" boolean NOT NULL DEFAULT false, "pinned" boolean NOT NULL DEFAULT false, "deleted" boolean NOT NULL DEFAULT false, "user_id" integer, "room_id" integer, CONSTRAINT "PK_afb7103161882b956e1993b8fae" PRIMARY KEY ("user_to_room_id"))`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_af0a71ac1879b584f255c49c99a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_c184f2b4ad4192b2df43013b55c" FOREIGN KEY ("user_id_in_contact") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_1dda4fc8dbeeff2ee71f0088ba0" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_to_room" ADD CONSTRAINT "FK_890d328af144e99c817c9dbe982" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_to_room" ADD CONSTRAINT "FK_ec0c6d8f6f2de947463a3d9f56a" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_to_room" DROP CONSTRAINT "FK_ec0c6d8f6f2de947463a3d9f56a"`);
        await queryRunner.query(`ALTER TABLE "user_to_room" DROP CONSTRAINT "FK_890d328af144e99c817c9dbe982"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_1dda4fc8dbeeff2ee71f0088ba0"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_c184f2b4ad4192b2df43013b55c"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_af0a71ac1879b584f255c49c99a"`);
        await queryRunner.query(`DROP TABLE "user_to_room"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "contacts"`);
        await queryRunner.query(`DROP TABLE "auth"`);
    }

}
