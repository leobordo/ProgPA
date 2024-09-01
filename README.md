# Advanced Programming Project
*Backend Development for a Small Object Detection Model*

## Introduction

The objective of this project is to develop a backend for a Small Object Detection model written in Python. We utilized the _Express_ framework to abstract the backend calls to the model, which is built using the _Flask_ framework. This setup allows us to define various functionalities related to user management, inference processing using tokens, and the creation of customized datasets.

To achieve this, we used a _PostgreSQL_ database to ensure data persistence. Additionally, to handle potential concurrent requests, we leverage BullMQ, which uses _Redis_ for request queue management. Furthermore, we have implemented a websocket that provides real-time updates on the status of inferences that are either pending or currently being processed, once the user is connected and authenticated.

All components mentioned above, indicated in italics, have been encapsulated in custom Docker containers. The containers and their key operations are managed using Docker Compose.

---

## Installation

First of all you need to clone our GitHub repository:

```bash 
git clone https://github.com/leobordo/ProgPA
 ```
Alternatively, you can download the ZIP file directly from GitHub.

Next, you need to install the containers on your PC. For this step, you must have Docker installed (if you don’t have it, follow [these steps](https://docs.docker.com/engine/install/)).

 To start, you need to run Docker's engine:
  ```bash
sudo service docker start
   ```
Alternatively, you can use Docker Desktop, which is more user-friendly.

After Docker is running, navigate to the directory where you cloned the repository using your terminal and run:
  ```bash
docker compose up
   ```

If you followed these steps correctly, the app is now installed and ready to use.

---

### Route Description

#### User Management (`/user`)

- **POST `/user/`**: Allows users to log in to the application by providing their credentials. This route is important because *it returns the authorization token to use all the other routes*.
  - **Request Body**:

    | Key        | Value               |
    |------------|---------------------|
    | `email`    | User's email        |
    | `password` | User's password     |
  
  - **Response Example**:

    ```json
    {
      "message": "Log in completed! User token: <created_auth_token>"
    }
    ```

- **POST `/user/registration`**: Enables new users to register by creating an account with their details. Auth token is clearly not necessary.
  - **Request Body**:

    | Key              | Value                    |
    |------------------|--------------------------|
    | `email`          | User's email             |
    | `password`       | User's password          |
    | `confirmPassword`| Equal to user's password |
    
  - **Response Example**:

    ```json
    {
      "message": "User created!"
    }
    ```

#### Dataset Management (`/datasets`)

- **GET `/datasets/`**: Retrieves a list of all datasets available to the user.    
  
  - **Response Example**:

    ```json
    [
    {
        "dataset": {
            "dataset_id": <integer>,
            "file_path": <string>,
            "dataset_name": <string>,
            "token_cost": <float>,
            "dataset_tags": [
                <string>
            ]
        }
    },
    {
        "dataset": {
            "dataset_id": <integer>,
            "file_path": <string>,
            "dataset_name": <string>,
            "token_cost": <float>,
            "dataset_tags": [
                <string>
            ]
        }
    },
    ...
    ]

    ```


- **POST `/datasets/`**: Allows users to create a new dataset by giving name and tags.
  - **Request Body**:

    | Key          | Value                           |
    |--------------|---------------------------------|
    | `datasetName`| Dataset's name                  |
    | `tags`       | List of words separated by commas|
  - **Response Example**:

    ```json
    {
      "message": "Dataset created successfully",
      "dataset": {
        "dataset_id": <integer>,
        "file_path": <string>,
        "dataset_name": <string>,
        "tags": [
            <string>
        ]
    }
    }
    ```

- **DELETE `/datasets/`**: Deletes an existing dataset as specified by the user.
  - **Request Body**:

    | Key          | Value               |
    |--------------|---------------------|
    | `datasetName`| Dataset's name to delete |
  - **Response Example**:

    ```json
    {
      "message": "Dataset deleted successfully"
    }
    ```

- **PATCH `/datasets/`**: Updates the name, tags, or both of an existing dataset.
  - **Request Body**:

    | Key            | Value                       |
    |----------------|-----------------------------|
    | `datasetName`  | Dataset's name              |
    | `newDatasetName` | New name for the dataset    |
    | `newTags`      | New tags for the dataset    |
  - **Response Example**:

    ```json
    {
      "message": "Name (/Tags/Name and Tags) correctly updated"
    }
    ```

#### Token Management (`/token`)

- **GET `/token`**: Retrieves the current token balance for the authenticated user.

- **PATCH `/token`**: Updates the token balance based on usage or other criteria. This route *can be used only by an admin user*.
  - **Request Body**:

    | Key            | Value                       |
    |----------------|-----------------------------|
    | `topUpUserEmail` | User selected for balance update |
    | `topUpAmount`  | New amount token for the specified user |

#### Inference Management (`/inference`)

- **POST `/inference/`**: Initiates a new inference task using a specified model and dataset. In this version, the `modelId` can only be "YOLO8" and the `modelVersion` can only be "YOLO8s_FSR" or "YOLO8m_FSR".
  - **Request Body**:

    | Key           | Value                           |
    |---------------|---------------------------------|
    | `datasetName` | Dataset used for the inference  |
    | `modelId`     | ModelId used for the inference  |
    | `modelVersion`| ModelVersion used for the inference |
  - **Response Example**:

    ```json
    {
      "message": "Process added successfully to the queue",
      "jobId": <integer>
    }
    ```

- **GET `/inference/state`**: Checks the current state of a submitted inference task, such as pending, running, or completed.
  - **Request Body**:

    | Key           | Value                           |
    |---------------|---------------------------------|
    | `jobId` | Job's id that you want to state check|
  - **Response Example**:

    ```json
    {
      "jobState": <string>
    }
    ```


- **GET `/inference/result`**: Retrieves the result of a completed inference task.
  - **Request Body**:

    | Key           | Value                           |
    |---------------|---------------------------------|
    | `jobId` | Job'id that you want to retrive result |
  - **Response Example**:

    ```json
    {
    "contentURI": <path>,
    "result": [
        {
            "filename": <string>,
            "objects": [
                <string>
            ],
            "type": "imagae/video"
        }
    ]
    }
    ```

#### File Upload (`/upload`)

- **POST `/upload/`**: Handles the uploading of files to the server, which are used for creating datasets. A single image, a single video, or a zip file that includes multiple images and/or videos can be uploaded. *Each image upload costs 0.75 tokens and each video frame costs 0.5 tokens*.
  - **Request Body**:

    | Key           | Value            |
    |---------------|------------------|
    | `file`        | File to be uploaded |
    | `datasetName` | Dataset's name   |
  - **Response Example**:

    ```json
    {
      "message": "Content uploaded successfully"
    }
    ```
  
#### Web Socket(`ws://localhost:8080`)
- You can retrive real-time information of your jobs' processiong state
---








