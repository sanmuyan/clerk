CREATE TABLE "clerk" (
  "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  "content" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "timestamp" integer NOT NULL,
  "collect" TEXT
);

CREATE UNIQUE INDEX "data_index"
ON "clerk" (
  "content" ASC,
  "type" ASC,
  "timestamp" DESC,
  "collect" ASC
);
