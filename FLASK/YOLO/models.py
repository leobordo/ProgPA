"""
This module defines the SQLAlchemy models for the database, representing the core entities 
of the system: User, Dataset, and Result. Each class corresponds to a database table and includes 
attributes that map to the table's columns, along with relationships to other tables.

Classes:
    User: Represents a user in the system, storing email and token information, and linking 
          to datasets owned by the user.
    Dataset: Represents a dataset, including metadata such as the file path, token cost, and 
             associated user. Datasets can also have multiple results linked to them.
    Result: Represents the result of a job processed in the system, storing details about the 
            job's state, model used, and associated dataset.

Usage:
    Import the db object from this module to initialize the database and use the defined models 
    to interact with the data in a structured way.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    
    """
    Represents a user in the system.

    Attributes:
        email (str): The primary key for the user, stored as a string.
        tokens (int): The number of tokens associated with the user, default is 1000.
        datasets (relationship): A relationship to the Dataset model, representing the datasets owned by the user.
    """
    __tablename__ = 'users'

    email = db.Column(db.String(255), primary_key=True)
    tokens = db.Column(db.Integer, default=1000)

    datasets = db.relationship('Dataset', backref='user', lazy=True)

    def __repr__(self):
        """
        Provides a string representation of the User instance.
        """
        return f'<User {self.email}>'



class Dataset(db.Model):
    """
    Represents a dataset in the system.

    Attributes:
        dataset_id (int): The primary key for the dataset.
        email (str): Foreign key referencing the user's email who owns the dataset.
        file_path (str): The path to the dataset file.
        token_cost (Numeric): The cost of tokens for using the dataset.
        dataset_name (str): The name of the dataset.
        results (relationship): A relationship to the Result model, representing the results associated with the dataset.
    """
    __tablename__ = 'datasets'

    dataset_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), db.ForeignKey('users.email'), nullable=False)
    file_path = db.Column(db.Text, nullable=False)
    token_cost = db.Column(db.Numeric)
    dataset_name = db.Column(db.String, nullable=False)

    results = db.relationship('Result', backref='dataset', lazy=True)

    __table_args__ = (
        db.UniqueConstraint('email', 'dataset_name', name='uq_email_dataset_name'),
        db.UniqueConstraint('file_path', 'email', name='uq_file_path_email'),
        db.UniqueConstraint('dataset_id', 'dataset_name', name='uq_dataset_id_dataset_name'),
    )

    def __repr__(self):
        """
        Provides a string representation of the Dataset instance.
        """
        return f'<Dataset {self.dataset_name} owned by {self.email}>'

class Result(db.Model):
    """
    Represents a result for a specific job in the system.

    Attributes:
        job_id (str): The primary key for the result, representing the job ID.
        result (str): The result of the job, stored as text.
        state (str): The state of the job, not nullable.
        model_id (str): The ID of the model used for the job, not nullable.
        dataset_id (int): The dataset associated with the result.
        model_version (str): The version of the model used for the job, not nullable.
    """
    __tablename__ = 'results'

    job_id = db.Column(db.String, primary_key=True)
    result = db.Column(db.Text)
    state = db.Column(db.String, nullable=False)
    model_id = db.Column(db.String, nullable=False)
    dataset_id = db.Column(db.Integer, db.ForeignKey('datasets.dataset_id'), nullable=False)
    model_version = db.Column(db.String, nullable=False)

    def __repr__(self):
        """
        Provides a string representation of the Result instance.
        """
        return f'<Result {self.job_id} for Dataset {self.dataset_id}>'