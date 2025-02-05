-- Create 'user' table
CREATE TABLE IF NOT EXISTS "user" (
    ID SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create 'tracks' table
CREATE TABLE IF NOT EXISTS "tracks" (
    title VARCHAR(255) NOT NULL,
    album_name VARCHAR(255),
    band_name VARCHAR(255),
    PRIMARY KEY (title, album_name, band_name)
);
