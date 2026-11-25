CREATE TABLE preferences (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    document TEXT NOT NULL
);
PRAGMA user_version = 1;
