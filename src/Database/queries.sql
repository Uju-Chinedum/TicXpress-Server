TRUNCATE "events" CASCADE;

-- TRUNCATE "error_logs";

TRUNCATE "transactions" CASCADE;

TRUNCATE "registrations" CASCADE;

TRUNCATE "tickets" CASCADE;

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

SELECT *
FROM "tickets"
ORDER BY "id";