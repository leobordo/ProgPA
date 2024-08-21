import { Model, DataTypes, Sequelize } from 'sequelize';
import { Dataset } from './Dataset'; 

export class Content extends Model {
    public fileId!: number; 
    public datasetId!: number;
    public datasetName!: string;
}

export function initializeContent(sequelize: Sequelize): void {
    Content.init({
        fileId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        datasetId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Datasets',
                key: 'dataset_id'
            }
        },
        datasetName: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: 'Datasets',
                key: 'dataset_name'
            }
        }
    }, {
        sequelize,
        tableName: 'Contents',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['datasetId', 'datasetName'] // Indice unico su datasetId e datasetName
            }
        ]
    });
}
