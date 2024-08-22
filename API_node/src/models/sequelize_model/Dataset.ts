import { Model, DataTypes, Sequelize } from 'sequelize';

export class Dataset extends Model {
    public datasetId!: number; 
    public email!: string;
    public filePath!: string;
    public tokenCost!: number;
    public datasetName!: string;
    public isDeleted!: boolean; // Campo per l'eliminazione logica
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
        filePath: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        tokenCost: {
            type: DataTypes.FLOAT, // Usa FLOAT o DECIMAL in Sequelize per numeri con virgola mobile
            allowNull: true
        },
        datasetName: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false // Imposta il valore predefinito su false
        }
    }, {
        sequelize,
        tableName: 'Datasets',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['email', 'datasetName']
            },
            {
                unique: true,
                fields: ['filePath', 'email']
            },
            {
                unique: true,
                fields: ['datasetId', 'datasetName']
            }
        ]
    });
}
