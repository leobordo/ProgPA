import { Pool } from 'pg';

// Crea un pool di connessioni utilizzando la configurazione standard
const pool = new Pool();

const DatasetDAO = {
    async getDsByName(datasetName: string, userEmail: string) {
        const query = 'SELECT * FROM Datasets WHERE name = $1 AND email = $2';
        const { rows } = await pool.query(query, [datasetName, userEmail]);
        return rows[0];
    },

    async create(datasetName: string, userEmail: string) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
    
            // Inserisci il record nel database dei dataset
            const insertDataset = 'INSERT INTO Datasets (name, email) VALUES ($1, $2) RETURNING *';
            const dataset = await client.query(insertDataset, [datasetName, userEmail]);
    
            await client.query('COMMIT');
            return dataset.rows[0]; // Restituisce l'oggetto dataset appena creato
        } catch (err) {
            await client.query('ROLLBACK');
            throw err; // Rilancia l'errore per una gestione ulteriore se necessario
        } finally {
            client.release(); // Rilascia sempre la connessione alla fine del tentativo
        }
    },
    

    async getAllByUserEmail(userEmail: string) {
        const query = 'SELECT * FROM Datasets WHERE email = $1';
        const { rows } = await pool.query(query, [userEmail]);
        return rows;
    },

    async getById(datasetId: number, userEmail : string) {
        const query = 'SELECT * FROM Datasets WHERE dataset_id = $1 AND email=$2';
        const { rows } = await pool.query(query, [datasetId]);
        return rows[0];
    },

    async updateById(datasetId: number, updates: { name?: string }) {
        const query = 'UPDATE Datasets SET name = $1 WHERE dataset_id = $2 RETURNING *';
        const { rows } = await pool.query(query, [updates.name, datasetId]);
        return rows[0];
    },

    async deleteById(datasetId: number) {
        const query = 'DELETE FROM Datasets WHERE dataset_id = $1';
        await pool.query(query, [datasetId]);
    },

    async insertContent(datasetId: number, filePath: string) {
        const query = 'INSERT INTO Contents (dataset_id, file_path) VALUES ($1, $2)';
        await pool.query(query, [datasetId, filePath]);
    }
};

export default DatasetDAO;


//