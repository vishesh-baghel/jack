-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creators" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xHandle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tone_config" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lowercase" BOOLEAN NOT NULL DEFAULT true,
    "noEmojis" BOOLEAN NOT NULL DEFAULT true,
    "noHashtags" BOOLEAN NOT NULL DEFAULT true,
    "showFailures" BOOLEAN NOT NULL DEFAULT true,
    "includeNumbers" BOOLEAN NOT NULL DEFAULT true,
    "learnedPatterns" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tone_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trending_topics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mentions" INTEGER NOT NULL DEFAULT 0,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trending_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_ideas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "contentPillar" TEXT NOT NULL,
    "suggestedFormat" TEXT NOT NULL,
    "estimatedEngagement" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outlines" (
    "id" TEXT NOT NULL,
    "contentIdeaId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "estimatedLength" TEXT NOT NULL,
    "toneReminders" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drafts" (
    "id" TEXT NOT NULL,
    "outlineId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentPillar" TEXT NOT NULL,
    "isMarkedGood" BOOLEAN NOT NULL DEFAULT false,
    "markedGoodAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "projects_userId_status_idx" ON "projects"("userId", "status");

-- CreateIndex
CREATE INDEX "creators_userId_isActive_idx" ON "creators"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "creators_userId_xHandle_key" ON "creators"("userId", "xHandle");

-- CreateIndex
CREATE UNIQUE INDEX "tone_config_userId_key" ON "tone_config"("userId");

-- CreateIndex
CREATE INDEX "trending_topics_userId_expiresAt_idx" ON "trending_topics"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "content_ideas_userId_status_createdAt_idx" ON "content_ideas"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "outlines_contentIdeaId_idx" ON "outlines"("contentIdeaId");

-- CreateIndex
CREATE INDEX "drafts_outlineId_isPosted_idx" ON "drafts"("outlineId", "isPosted");

-- CreateIndex
CREATE UNIQUE INDEX "posts_draftId_key" ON "posts"("draftId");

-- CreateIndex
CREATE INDEX "posts_userId_isMarkedGood_createdAt_idx" ON "posts"("userId", "isMarkedGood", "createdAt");

-- CreateIndex
CREATE INDEX "posts_userId_contentPillar_idx" ON "posts"("userId", "contentPillar");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creators" ADD CONSTRAINT "creators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tone_config" ADD CONSTRAINT "tone_config_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trending_topics" ADD CONSTRAINT "trending_topics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlines" ADD CONSTRAINT "outlines_contentIdeaId_fkey" FOREIGN KEY ("contentIdeaId") REFERENCES "content_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_outlineId_fkey" FOREIGN KEY ("outlineId") REFERENCES "outlines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
