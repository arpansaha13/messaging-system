import { MigrationInterface, QueryRunner } from "typeorm";

export class V11706165875194 implements MigrationInterface {
    name = 'V11706165875194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "unverified_users" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "hash" character varying NOT NULL, "otp" character varying NOT NULL, "display_name" character varying NOT NULL, "email" character varying NOT NULL, "dp" character varying, "bio" character varying NOT NULL DEFAULT 'Hey there! I am using WhatsApp.', "password" character varying NOT NULL, CONSTRAINT "UQ_09be6703dcabead496b8719ec9d" UNIQUE ("email"), CONSTRAINT "PK_bef3aabf733c0b106139a1dd894" PRIMARY KEY ("hash"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "unverified_users"`);
    }

}
