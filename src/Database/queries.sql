TRUNCATE "error_logs";

SELECT *
FROM "events"
ORDER BY "createdAt" DESC;

SELECT *
FROM "transactions"
ORDER BY "updatedAt" DESC;