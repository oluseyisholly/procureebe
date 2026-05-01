import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1772213867811 implements MigrationInterface {
  name = 'Migration1772213867811';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "procuree_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "createdby" character varying, "updatedby" character varying, "groupId" uuid NOT NULL, "tokenHash" character varying(128) NOT NULL, "email" character varying(255), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, "createdByUserId" uuid NOT NULL, "acceptedByUserId" uuid, CONSTRAINT "uq_procuree_invites_token_hash" UNIQUE ("tokenHash"), CONSTRAINT "PK_728cc76a3b61c5989d82a9e7590" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_83fe2f4209440fb85f602d80d4" ON "procuree_invites" ("groupId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_procuree_invites_email" ON "procuree_invites" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "procuree_invites" ADD CONSTRAINT "FK_83fe2f4209440fb85f602d80d46" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "procuree_invites" DROP CONSTRAINT "FK_83fe2f4209440fb85f602d80d46"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_procuree_invites_email"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_83fe2f4209440fb85f602d80d4"`,
    );
    await queryRunner.query(`DROP TABLE "procuree_invites"`);
  }
}
