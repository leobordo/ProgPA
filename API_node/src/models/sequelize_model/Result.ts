import { Model, DataTypes, Sequelize } from 'sequelize';
import { JobStatus } from '../job';
import { ModelId } from '../aiModels';
import { Dataset } from './Dataset';

export class Result extends Model {
    public job_id!: string;
    public result?: string; // Il campo result è opzionale
    public state!: JobStatus;
    public model_id!: ModelId;
    public dataset_id!: number;
    public model_version!: string;
}

export function initializeResult(sequelize: Sequelize): void {
    Result.init({
        job_id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        result: {
            type: DataTypes.TEXT,
            allowNull: true // Il campo result può essere null
        },
        state: {
            type: DataTypes.STRING,
            allowNull: false
        },
        model_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        dataset_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'datasets',
                key: 'dataset_id'
            }
        },
        model_version: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        tableName: 'results',
        timestamps: false
    });

    Result.belongsTo(Dataset, { foreignKey: 'dataset_id' });
}


