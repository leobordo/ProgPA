from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Utente(db.Model):
    __tablename__ = 'utenti'

    email = db.Column(db.String(255), primary_key=True)
    tokens = db.Column(db.Integer, default=1000)

    datasets = db.relationship('Dataset', backref='utente', lazy=True)

    def __repr__(self):
        return f'<Utente {self.email}>'

class Dataset(db.Model):
    __tablename__ = 'datasets'

    dataset_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), db.ForeignKey('utenti.email'), nullable=False)
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
        return f'<Dataset {self.dataset_name} owned by {self.email}>'

class Result(db.Model):
    __tablename__ = 'results'

    job_id = db.Column(db.String, primary_key=True)
    result = db.Column(db.Text)
    state = db.Column(db.String, nullable=False)
    model_id = db.Column(db.String, nullable=False)
    dataset_id = db.Column(db.Integer, db.ForeignKey('datasets.dataset_id'), nullable=False)
    model_version = db.Column(db.String, nullable=False)

    def __repr__(self):
        return f'<Result {self.job_id} for Dataset {self.dataset_id}>'