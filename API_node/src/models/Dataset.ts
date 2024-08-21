import { Model, DataTypes, Sequelize } from 'sequelize';

export class Dataset extends Model {
    public datasetId!: number;
    public email!: string;
    public datasetName!: string;
    public filePath!: string;
    public isDeleted!: boolean; //allow logic removal
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
                model: 'Utenti',
                key: 'email'
            }
        },
        datasetName: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        filePath: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
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
            }
        ]
    });
}
