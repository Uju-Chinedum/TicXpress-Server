TRUNCATE "error_logs";

SELECT *
FROM "events"
ORDER BY "updatedAt" DESC;

SELECT *
FROM "transactions"
ORDER BY "updatedAt" DESC;