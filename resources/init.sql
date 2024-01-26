CREATE TABLE "clerk" (
  "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  "type" TEXT NOT NULL,
  "timestamp" integer NOT NULL,
  "collect" TEXT,
  "remarks" TEXT
);


CREATE INDEX "clerk_collect"
ON "clerk" (
  "collect" ASC
);
CREATE INDEX "clerk_remarks"
ON "clerk" (
  "remarks" ASC
);
CREATE INDEX "clerk_timestamp"
ON "clerk" (
  "timestamp" DESC
);
CREATE INDEX "clerk_type"
ON "clerk" (
  "type" ASC
);

CREATE TABLE "clerk_text" (
  "clerk_id" INTEGER NOT NULL,
  "text_content" TEXT NOT NULL,
  PRIMARY KEY ("clerk_id"),
  CONSTRAINT "clerk_text_content" FOREIGN KEY ("clerk_id") REFERENCES "clerk" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "clerk_text_text_context"
ON "clerk_text" (
  "text_content" ASC
);

CREATE TABLE "clerk_image" (
  "clerk_id" INTEGER NOT NULL,
  "image_content" TEXT NOT NULL,
  PRIMARY KEY ("clerk_id"),
  CONSTRAINT "clerk_image_content" FOREIGN KEY ("clerk_id") REFERENCES "clerk" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "clerk_image_image_content"
ON "clerk_image" (
  "image_content" ASC
);
