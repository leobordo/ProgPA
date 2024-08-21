import { Model, DataTypes, Sequelize } from 'sequelize';

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
                key: 'datasetId'
            }
        },
        datasetName: {
            type: DataTypes.TEXT,
            allowNull: false
            
        }
    }, {
        sequelize,
        tableName: 'Contents',
        timestamps: false,
    });
}
