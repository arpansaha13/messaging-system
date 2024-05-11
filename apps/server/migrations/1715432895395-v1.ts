import { MigrationInterface, QueryRunner } from "typeorm";

export class V11715432895395 implements MigrationInterface {
    name = 'V11715432895395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "display_name" TO "global_name"`);
        await queryRunner.query(`ALTER TABLE "unverified_users" RENAME COLUMN "display_name" TO "global_name"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "unverified_users" RENAME COLUMN "global_name" TO "display_name"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "global_name" TO "display_name"`);
    }

}
