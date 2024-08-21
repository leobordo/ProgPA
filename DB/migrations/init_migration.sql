CREATE TABLE Utenti (
    email VARCHAR(255) PRIMARY KEY,
    tokens INTEGER DEFAULT 1000
);

CREATE TABLE Datasets (
    email VARCHAR(255),
    dataset_id SERIAL PRIMARY KEY,
    FOREIGN KEY (email) REFERENCES Utenti(email)
);
CREATE TABLE Contents (
    file_id SERIAL,
    file_path TEXT NOT NULL,
    dataset_id INTEGER NOT NULL,
    dataset_name TEXT NOT NULL,
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
    PRIMARY KEY (file_id, dataset_id, dataset_name),
    FOREIGN KEY (dataset_id) REFERENCES Datasets(dataset_id)
    FOREIGN KEY (dataset_name) REFERENCES Datasets(dataset_name)
);