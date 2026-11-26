-- CreateTable
CREATE TABLE "role_info" (
    "id" UUID NOT NULL,
    "role_name" TEXT NOT NULL,
    "role_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_info" (
    "id" UUID NOT NULL,
    "permission_code" TEXT NOT NULL,
    "permission_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_info" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_info_role_name_key" ON "role_info"("role_name");

-- CreateIndex
CREATE INDEX "role_info_role_name_idx" ON "role_info"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_info_permission_code_key" ON "permission_info"("permission_code");

-- CreateIndex
CREATE INDEX "permission_info_permission_code_idx" ON "permission_info"("permission_code");

-- CreateIndex
CREATE INDEX "user_role_info_user_id_idx" ON "user_role_info"("user_id");

-- CreateIndex
CREATE INDEX "user_role_info_role_id_idx" ON "user_role_info"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_info_user_id_role_id_key" ON "user_role_info"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "role_permission_role_id_idx" ON "role_permission"("role_id");

-- CreateIndex
CREATE INDEX "role_permission_permission_id_idx" ON "role_permission"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permission_role_id_permission_id_key" ON "role_permission"("role_id", "permission_id");

-- AddForeignKey
ALTER TABLE "user_role_info" ADD CONSTRAINT "user_role_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_info" ADD CONSTRAINT "user_role_info_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
