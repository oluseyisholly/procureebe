import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1772213867812 implements MigrationInterface {
  name = 'Migration1772213867812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "procuree_invites" ADD "phone" character varying(20)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_procuree_invites_phone" ON "procuree_invites" ("phone") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_procuree_invites_phone"`);
    await queryRunner.query(`ALTER TABLE "procuree_invites" DROP COLUMN "phone"`);
  }
}
