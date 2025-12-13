-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_api_configs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key_name" TEXT NOT NULL,
    "key_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_api_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platform_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image_url" TEXT,
    "sell_price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" TEXT,
    "bsr_rank" INTEGER,
    "review_count" INTEGER,
    "rating" DECIMAL(3,2),
    "status" TEXT NOT NULL DEFAULT 'new',
    "ai_analysis" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_results" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "supplier_url" TEXT NOT NULL,
    "supplier_name" TEXT,
    "cost_price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "moq" INTEGER,
    "supplier_rating" DECIMAL(3,2),
    "shop_years" INTEGER,
    "match_score" DECIMAL(3,2),
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sourcing_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profit_calculations" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sourcing_id" TEXT,
    "sell_price" DECIMAL(10,2) NOT NULL,
    "cost_price" DECIMAL(10,2) NOT NULL,
    "shipping_cost" DECIMAL(10,2) NOT NULL,
    "platform_fee" DECIMAL(10,2) NOT NULL,
    "fba_fee" DECIMAL(10,2) NOT NULL,
    "marketing_cost" DECIMAL(10,2) NOT NULL,
    "net_profit" DECIMAL(10,2) NOT NULL,
    "profit_margin" DECIMAL(5,2) NOT NULL,
    "exchange_rate" DECIMAL(6,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profit_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checks" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "hs_code" TEXT,
    "tax_rate" DECIMAL(5,2),
    "certifications_required" TEXT[],
    "risk_level" TEXT NOT NULL,
    "ai_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input_data" JSONB,
    "output_data" JSONB,
    "error_message" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_embeddings" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT '1688',
    "supplier_url" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "contact_info" JSONB,
    "rating" DECIMAL(3,2),
    "notes" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "item_type" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "unit" TEXT,
    "route" TEXT,
    "terms" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "is_deprecated" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "country" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "source" TEXT,
    "version" TEXT,
    "is_deprecated" BOOLEAN NOT NULL DEFAULT false,
    "superseded_by" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_memories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "summary" TEXT NOT NULL,
    "key_entities" JSONB NOT NULL,
    "user_preferences" JSONB,
    "action_items" JSONB,
    "sentiment" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 5,
    "last_interaction" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_relations" (
    "id" TEXT NOT NULL,
    "from_type" TEXT NOT NULL,
    "from_id" TEXT NOT NULL,
    "from_name" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,
    "to_type" TEXT NOT NULL,
    "to_id" TEXT NOT NULL,
    "to_name" TEXT NOT NULL,
    "properties" JSONB,
    "confidence" DECIMAL(3,2),
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_capabilities" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "certification" TEXT,
    "valid_until" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "verified_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_api_configs_user_id_key_name_key" ON "user_api_configs"("user_id", "key_name");

-- CreateIndex
CREATE INDEX "products_user_id_idx" ON "products"("user_id");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE UNIQUE INDEX "products_platform_platform_id_key" ON "products"("platform", "platform_id");

-- CreateIndex
CREATE INDEX "sourcing_results_product_id_idx" ON "sourcing_results"("product_id");

-- CreateIndex
CREATE INDEX "profit_calculations_product_id_idx" ON "profit_calculations"("product_id");

-- CreateIndex
CREATE INDEX "compliance_checks_product_id_idx" ON "compliance_checks"("product_id");

-- CreateIndex
CREATE INDEX "jobs_user_id_idx" ON "jobs"("user_id");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "knowledge_embeddings_category_idx" ON "knowledge_embeddings"("category");

-- CreateIndex
CREATE INDEX "suppliers_user_id_idx" ON "suppliers"("user_id");

-- CreateIndex
CREATE INDEX "quotes_item_type_valid_until_idx" ON "quotes"("item_type", "valid_until");

-- CreateIndex
CREATE INDEX "quotes_route_valid_until_idx" ON "quotes"("route", "valid_until");

-- CreateIndex
CREATE INDEX "quotes_supplier_id_idx" ON "quotes"("supplier_id");

-- CreateIndex
CREATE INDEX "knowledge_chunks_category_country_idx" ON "knowledge_chunks"("category", "country");

-- CreateIndex
CREATE INDEX "knowledge_chunks_is_deprecated_idx" ON "knowledge_chunks"("is_deprecated");

-- CreateIndex
CREATE INDEX "conversation_memories_user_id_last_interaction_idx" ON "conversation_memories"("user_id", "last_interaction");

-- CreateIndex
CREATE INDEX "conversation_memories_importance_idx" ON "conversation_memories"("importance");

-- CreateIndex
CREATE INDEX "entity_relations_from_type_from_id_idx" ON "entity_relations"("from_type", "from_id");

-- CreateIndex
CREATE INDEX "entity_relations_to_type_to_id_idx" ON "entity_relations"("to_type", "to_id");

-- CreateIndex
CREATE INDEX "entity_relations_relation_type_idx" ON "entity_relations"("relation_type");

-- CreateIndex
CREATE INDEX "supplier_capabilities_supplier_id_idx" ON "supplier_capabilities"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_capabilities_capability_idx" ON "supplier_capabilities"("capability");

-- AddForeignKey
ALTER TABLE "user_api_configs" ADD CONSTRAINT "user_api_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_results" ADD CONSTRAINT "sourcing_results_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_calculations" ADD CONSTRAINT "profit_calculations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_calculations" ADD CONSTRAINT "profit_calculations_sourcing_id_fkey" FOREIGN KEY ("sourcing_id") REFERENCES "sourcing_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_capabilities" ADD CONSTRAINT "supplier_capabilities_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
