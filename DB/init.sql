CREATE TABLE Utenti (
    email VARCHAR(255) PRIMARY KEY,
    tokens INTEGER DEFAULT 1000
);

CREATE TABLE Datasets (
    email VARCHAR(255),
    file_path TEXT NOT NULL,
    dataset_id SERIAL PRIMARY KEY,
    dataset_name TEXT NOT NULL,
    FOREIGN KEY (email) REFERENCES Utenti(email),
    UNIQUE (email, dataset_name),
    UNIQUE (file_path, email),
    UNIQUE (dataset_id, dataset_name) 
);
CREATE TABLE Contents (
    file_id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL,
    dataset_name TEXT NOT NULL,
    FOREIGN KEY (dataset_id) REFERENCES Datasets(dataset_id)
);


CREATE TABLE Results (
    file_id INTEGER NOT NULL,
    dataset_id INTEGER NOT NULL,
    model VARCHAR(10) NOT NULL,
    person_count INTEGER,
    motorcyclist_count INTEGER,
    bicycle_count INTEGER,
    motorcycle_count INTEGER,
    car_count INTEGER,
    vehicle_count INTEGER,
    road_sign_count INTEGER,
    traffic_light_count INTEGER,
    street_camera_count INTEGER,
    traffic_cone_count INTEGER,
    bounding_box_count INTEGER,
    PRIMARY KEY (file_id, dataset_id),
    FOREIGN KEY (dataset_id) REFERENCES Datasets(dataset_id),
    FOREIGN KEY (file_id) REFERENCES Contents(file_id)
);




