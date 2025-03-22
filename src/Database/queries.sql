TRUNCATE "error_logs";

TRUNCATE "transactions";

TRUNCATE "events" CASCADE;

SELECT *
FROM "events"
ORDER BY "updatedAt" DESC;

SELECT *
FROM "transactions"
ORDER BY "updatedAt" DESC;