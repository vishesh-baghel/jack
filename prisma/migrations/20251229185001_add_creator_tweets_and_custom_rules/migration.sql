-- AlterTable
ALTER TABLE "creators" ADD COLUMN     "lastScrapedAt" TIMESTAMP(3),
ADD COLUMN     "twitterUserId" TEXT;

-- AlterTable
ALTER TABLE "tone_config" ADD COLUMN     "customRules" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "creator_tweets" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_tweets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_tweets_tweetId_key" ON "creator_tweets"("tweetId");

-- CreateIndex
CREATE INDEX "creator_tweets_creatorId_publishedAt_idx" ON "creator_tweets"("creatorId", "publishedAt");

-- CreateIndex
CREATE INDEX "creator_tweets_scrapedAt_idx" ON "creator_tweets"("scrapedAt");

-- CreateIndex
CREATE INDEX "creators_lastScrapedAt_idx" ON "creators"("lastScrapedAt");

-- AddForeignKey
ALTER TABLE "creator_tweets" ADD CONSTRAINT "creator_tweets_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
