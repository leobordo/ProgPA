CREATE TABLE Utenti (
    email VARCHAR(255) PRIMARY KEY,
    tokens INTEGER DEFAULT 1000
);

CREATE TABLE Datasets (
    email VARCHAR(255),
    tags TEXT,
    file_path TEXT,
    token_cost NUMERIC,
    dataset_id SERIAL PRIMARY KEY,
    dataset_name TEXT NOT NULL,
    FOREIGN KEY (email) REFERENCES Utenti(email),
    UNIQUE (email, dataset_name),
    UNIQUE (file_path, email),
    UNIQUE (dataset_id, dataset_name) 
);


CREATE TABLE Results (
    result TEXT,
    state TEXT NOT NULL,
    job_id TEXT NOT NULL PRIMARY KEY,
    model_id TEXT NOT NULL,
    dataset_id INTEGER NOT NULL, 
    model_version TEXT NOT NULL,
    FOREIGN KEY (dataset_id) REFERENCES Datasets(dataset_id)
);




