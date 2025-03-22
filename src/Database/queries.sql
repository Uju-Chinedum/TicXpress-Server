TRUNCATE "events" CASCADE;

TRUNCATE "error_logs";

TRUNCATE "transactions";

TRUNCATE "registrations" CASCADE;

SELECT *
FROM "events"
ORDER BY "updatedAt" DESC;

SELECT *
FROM "error_logs"
ORDER BY "createdAt" DESC;

SELECT *
FROM "transactions"
ORDER BY "updatedAt" DESC;

SELECT *
FROM "registrations"
ORDER BY "updatedAt" DESC;