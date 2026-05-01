import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1772213867810 implements MigrationInterface {
  name = 'Migration1772213867810';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_groups_role_enum" AS ENUM('ADMIN', 'PATRON', 'PROCUREE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" ADD "role" "public"."user_groups_role_enum"`,
    );
    await queryRunner.query(
      `UPDATE "user_groups" "user_groups"
       SET "role" = "users"."role"::text::"public"."user_groups_role_enum"
       FROM "users" "users"
       WHERE "users"."id" = "user_groups"."userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" ALTER COLUMN "role" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'PATRON', 'PROCUREE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'ADMIN'`,
    );
    await queryRunner.query(
      `UPDATE "users" "users"
       SET "role" = "user_groups"."role"::text::"public"."users_role_enum"
       FROM "user_groups" "user_groups"
       WHERE "user_groups"."userId" = "users"."id"`,
    );
    await queryRunner.query(`ALTER TABLE "user_groups" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."user_groups_role_enum"`);
  }
}
