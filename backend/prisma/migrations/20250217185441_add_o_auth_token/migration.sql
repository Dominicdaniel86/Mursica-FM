-- CreateTable
CREATE TABLE "OAuthToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken_token_key" ON "OAuthToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken_refreshToken_key" ON "OAuthToken"("refreshToken");
