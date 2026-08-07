// Run once against CognoDB before seeding.
// Graph DBs are schema-optional — constraints/indexes are the closest
// equivalent to CREATE TABLE, and they're what makes MERGE fast and safe.

CREATE CONSTRAINT user_id     IF NOT EXISTS FOR (u:User)     REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT product_id  IF NOT EXISTS FOR (p:Product)  REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT category_id IF NOT EXISTS FOR (c:Category) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT brand_id    IF NOT EXISTS FOR (b:Brand)    REQUIRE b.id IS UNIQUE;
CREATE CONSTRAINT order_id    IF NOT EXISTS FOR (o:Order)    REQUIRE o.id IS UNIQUE;
CREATE CONSTRAINT review_id   IF NOT EXISTS FOR (r:Review)   REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT cart_id     IF NOT EXISTS FOR (ct:Cart)    REQUIRE ct.id IS UNIQUE;
CREATE CONSTRAINT event_id    IF NOT EXISTS FOR (e:Event)    REQUIRE e.id IS UNIQUE;

CREATE INDEX event_timestamp IF NOT EXISTS FOR (e:Event)   ON (e.timestamp);
CREATE INDEX event_type      IF NOT EXISTS FOR (e:Event)   ON (e.type);
CREATE INDEX product_type    IF NOT EXISTS FOR (p:Product) ON (p.type);
CREATE INDEX order_status    IF NOT EXISTS FOR (o:Order)   ON (o.status);
CREATE INDEX cart_status     IF NOT EXISTS FOR (ct:Cart)   ON (ct.status);
