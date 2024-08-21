import { Model, DataTypes, Sequelize } from 'sequelize';

export class Dataset extends Model {
    public datasetId!: number; // Il punto esclamativo indica che questo campo non sarà mai nullo
    public email!: string;
    public datasetName!: string;

    
}

export function initializeDataset(sequelize: Sequelize): void {
    Dataset.init({
        datasetId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            references: {
                model: 'Utenti', // Nome della tabella a cui si fa riferimento
                key: 'email'
            }
        },
        datasetName: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        sequelize,
        tableName: 'Datasets',
        timestamps: false, // Imposta a `true` se la tabella ha colonne `createdAt` e `updatedAt`
    });
}
