import { Model, DataTypes, Sequelize } from 'sequelize';
import { Utente } from './Utente';
import { Result } from './Result';

export class Dataset extends Model {
    public dataset_id!: number; 
    public email!: string;
    public file_path!: string;
    public token_cost!: number;
    public dataset_name!: string;
    public is_deleted!: boolean; // Campo per l'eliminazione logica
}

export function initializeDataset(sequelize: Sequelize): void {
    Dataset.init({
        dataset_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            references: {
                model: 'utenti', // Nome della tabella a cui si fa riferimento
                key: 'email'
            }
        },
        tags: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        file_path: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        token_cost: {
            type: DataTypes.FLOAT, // Usa FLOAT o DECIMAL in Sequelize per numeri con virgola mobile
            allowNull: true
        },
        dataset_name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false // Imposta il valore predefinito su false
        }
    }, {
        sequelize,
        tableName: 'datasets',
        timestamps: false,
        indexes: [
            
            {
                unique: true,
                fields: ['file_path', 'email']
            },
            {
                unique: true,
                fields: ['dataset_id', 'dataset_name']
            }
        ]
    });

    
}


