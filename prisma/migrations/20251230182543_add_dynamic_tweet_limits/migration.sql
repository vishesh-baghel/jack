-- AlterTable
ALTER TABLE "creators" ADD COLUMN     "tweetCount" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dailyTweetLimit" INTEGER NOT NULL DEFAULT 50;
