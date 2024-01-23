CREATE TABLE "clerk" (
  "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  "content" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "timestamp" integer NOT NULL,
  "collect" TEXT,
  "remarks" TEXT,
  CONSTRAINT "content" UNIQUE ("type" ASC, "content" ASC)
);

CREATE INDEX "collect"
ON "clerk" (
  "collect" ASC
);
CREATE INDEX "content"
ON "clerk" (
  "content" ASC
);
CREATE INDEX "timestamp"
ON "clerk" (
  "timestamp" DESC
);
CREATE INDEX "type"
ON "clerk" (
  "type" ASC
);
