-- Check total connections and max allowed
SELECT 
    current_setting('max_connections')::int as max_connections,
    count(*) as current_connections,
    current_setting('max_connections')::int - count(*) as available_slots
FROM pg_stat_activity;

-- Check connections by user
SELECT usename, count(*) 
FROM pg_stat_activity 
GROUP BY usename 
ORDER BY count(*) DESC;