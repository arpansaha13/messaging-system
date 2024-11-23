import { MigrationInterface, QueryRunner } from "typeorm";

export class V31732345678699 implements MigrationInterface {
    name = 'V31732345678699'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contacts" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "alias" character varying NOT NULL, "user_id" integer NOT NULL, "user_id_in_contact" integer NOT NULL, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "global_name" character varying NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "dp" character varying, "bio" character varying NOT NULL DEFAULT 'Hey there!', "password" character varying NOT NULL, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "channels" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "group_id" integer, CONSTRAINT "PK_bc603823f3f741359c2339389f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "groups" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "founder_id" integer NOT NULL, CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_group" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "user_id" integer NOT NULL, "group_id" integer NOT NULL, CONSTRAINT "PK_3c29fba6fe013ec8724378ce7c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sessions" ("key" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "expires_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_89dfa37848e4d268927ac5e875e" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE "messages" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "content" character varying NOT NULL, "sender_id" integer NOT NULL, "channel_id" integer, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message_recipients" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "status" character varying NOT NULL DEFAULT 'SENT', "message_id" integer NOT NULL, "receiver_id" integer NOT NULL, CONSTRAINT "PK_e402cb51e37423da8d8a94cb3e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invites" ("hash" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE, "inviter_id" integer NOT NULL, "group_id" integer, CONSTRAINT "PK_440d1700645f16ca5bcff3e873b" PRIMARY KEY ("hash"))`);
        await queryRunner.query(`CREATE TABLE "chats" ("sender_id" integer NOT NULL, "receiver_id" integer NOT NULL, "cleared_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "muted" boolean NOT NULL DEFAULT false, "archived" boolean NOT NULL DEFAULT false, "pinned" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_294abca5a52489a05379cbf6452" PRIMARY KEY ("sender_id", "receiver_id"))`);
        await queryRunner.query(`CREATE TABLE "unverified_users" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "hash" character varying NOT NULL, "otp" character varying NOT NULL, "global_name" character varying NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "dp" character varying, "bio" character varying NOT NULL DEFAULT 'Hey there!.', "password" character varying NOT NULL, CONSTRAINT "UQ_09be6703dcabead496b8719ec9d" UNIQUE ("email"), CONSTRAINT "PK_bef3aabf733c0b106139a1dd894" PRIMARY KEY ("hash"))`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_af0a71ac1879b584f255c49c99a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_c184f2b4ad4192b2df43013b55c" FOREIGN KEY ("user_id_in_contact") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_35ab26042dde5cddce5c040797e" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "FK_98f7f4d7424029410c383d8f2e7" FOREIGN KEY ("founder_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_group" ADD CONSTRAINT "FK_7ded8f984bbc2ee6ff0beee491b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_group" ADD CONSTRAINT "FK_bb9982562cca83afb76c0ddc0d6" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_86b9109b155eb70c0a2ca3b4b6d" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ADD CONSTRAINT "FK_ba7ae7820d8342815027197b515" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ADD CONSTRAINT "FK_a7e3f5be432bdfcc8654a311f2e" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invites" ADD CONSTRAINT "FK_15c35422032e0b22b4ada95f48f" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invites" ADD CONSTRAINT "FK_33dcb9a9ea41dfa512fac08c368" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_ed49245ae87902459011243d69a" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_543183a92a0aa5ae2851b69913c" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_543183a92a0aa5ae2851b69913c"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_ed49245ae87902459011243d69a"`);
        await queryRunner.query(`ALTER TABLE "invites" DROP CONSTRAINT "FK_33dcb9a9ea41dfa512fac08c368"`);
        await queryRunner.query(`ALTER TABLE "invites" DROP CONSTRAINT "FK_15c35422032e0b22b4ada95f48f"`);
        await queryRunner.query(`ALTER TABLE "message_recipients" DROP CONSTRAINT "FK_a7e3f5be432bdfcc8654a311f2e"`);
        await queryRunner.query(`ALTER TABLE "message_recipients" DROP CONSTRAINT "FK_ba7ae7820d8342815027197b515"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_86b9109b155eb70c0a2ca3b4b6d"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "user_group" DROP CONSTRAINT "FK_bb9982562cca83afb76c0ddc0d6"`);
        await queryRunner.query(`ALTER TABLE "user_group" DROP CONSTRAINT "FK_7ded8f984bbc2ee6ff0beee491b"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "FK_98f7f4d7424029410c383d8f2e7"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_35ab26042dde5cddce5c040797e"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_c184f2b4ad4192b2df43013b55c"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_af0a71ac1879b584f255c49c99a"`);
        await queryRunner.query(`DROP TABLE "unverified_users"`);
        await queryRunner.query(`DROP TABLE "chats"`);
        await queryRunner.query(`DROP TABLE "invites"`);
        await queryRunner.query(`DROP TABLE "message_recipients"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TABLE "user_group"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`DROP TABLE "channels"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "contacts"`);
    }

}
