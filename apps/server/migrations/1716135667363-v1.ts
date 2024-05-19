import { MigrationInterface, QueryRunner } from "typeorm";

export class V11716135667363 implements MigrationInterface {
    name = 'V11716135667363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sessions" ("key" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "expires_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_89dfa37848e4d268927ac5e875e" PRIMARY KEY ("key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sessions"`);
    }

}
