CREATE TABLE "clerk" (
  "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
  "type" TEXT NOT NULL,
  "collect" TEXT NOT NULL,
  "remarks" TEXT NOT NULL,
  "create_time" integer NOT NULL,
  "update_time" integer NOT NULL,
  "is_delete" TEXT NOT NULL,
  "hash" TEXT NOT NULL
);


CREATE INDEX "clerk_collect"
ON "clerk" (
  "collect" ASC
);
CREATE INDEX "clerk_create_time"
ON "clerk" (
  "create_time" DESC
);
CREATE INDEX "clerk_is_delete"
ON "clerk" (
  "is_delete" ASC
);
CREATE INDEX "clerk_remarks"
ON "clerk" (
  "remarks" ASC
);
CREATE INDEX "clerk_type"
ON "clerk" (
  "type" ASC
);
CREATE INDEX "clerk_update_time"
ON "clerk" (
  "update_time" DESC
);

CREATE UNIQUE INDEX "clerk_hash"
ON "clerk" (
  "hash" ASC
);

CREATE TABLE "clerk_text" (
  "clerk_id" INTEGER NOT NULL,
  "text_content" TEXT NOT NULL,
  PRIMARY KEY ("clerk_id"),
  CONSTRAINT "clerk_text" FOREIGN KEY ("clerk_id") REFERENCES "clerk" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "clerk_text_text_context"
ON "clerk_text" (
  "text_content" ASC
);

CREATE TABLE "clerk_image" (
  "clerk_id" INTEGER NOT NULL,
  "image_content" blob NOT NULL,
  PRIMARY KEY ("clerk_id"),
  CONSTRAINT "clerk_image" FOREIGN KEY ("clerk_id") REFERENCES "clerk" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
