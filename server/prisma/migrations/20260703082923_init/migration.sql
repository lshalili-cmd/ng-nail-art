-- CreateTable
CREATE TABLE "Design" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL DEFAULT 'AI Studio',
    "pattern" TEXT NOT NULL DEFAULT 'glossy',
    "category" TEXT NOT NULL DEFAULT 'ai',
    "colors" TEXT NOT NULL DEFAULT '[]',
    "shapes" TEXT NOT NULL DEFAULT '[]',
    "tones" TEXT NOT NULL DEFAULT '[]',
    "undertones" TEXT NOT NULL DEFAULT '[]',
    "seasons" TEXT NOT NULL DEFAULT '["all"]',
    "img" TEXT NOT NULL DEFAULT '',
    "prompt" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'ai_studio',
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "rating" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL DEFAULT 'guest',
    "designId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScanAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL DEFAULT 'guest',
    "toneKey" TEXT,
    "undertone" TEXT,
    "fingerLength" TEXT,
    "nailShape" TEXT,
    "hex" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Design_source_idx" ON "Design"("source");

-- CreateIndex
CREATE INDEX "Design_popular_idx" ON "Design"("popular");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_designId_key" ON "Favorite"("userId", "designId");

-- CreateIndex
CREATE INDEX "ScanAnalysis_userId_idx" ON "ScanAnalysis"("userId");
