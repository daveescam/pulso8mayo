ALTER TABLE "salary_history"
ADD COLUMN IF NOT EXISTS "company_id" uuid;

UPDATE "salary_history" AS sh
SET "company_id" = ec."company_id"
FROM "employee_contracts" AS ec
WHERE sh."company_id" IS NULL
  AND sh."contract_id" = ec."id";

UPDATE "salary_history" AS sh
SET "company_id" = u."company_id"
FROM "users" AS u
WHERE sh."company_id" IS NULL
  AND sh."user_id" = u."id";

ALTER TABLE "salary_history"
ALTER COLUMN "company_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'salary_history_company_id_companies_id_fk'
  ) THEN
    ALTER TABLE "salary_history"
    ADD CONSTRAINT "salary_history_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "salary_history_company_id_idx"
ON "salary_history" USING btree ("company_id");
