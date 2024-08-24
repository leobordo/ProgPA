import { Model, DataTypes, Sequelize } from 'sequelize';
import { JobStatus } from '../job';
import { ModelId } from '../aiModels';

export class Result extends Model {
    public jobId!: string;
    public result?: string; // Il campo result è opzionale
    public state!: JobStatus;
    public modelId!: ModelId;
    public dataset_id!: number;
    public modelVersion!: string;
}

export function initializeResult(sequelize: Sequelize): void {
    Result.init({
        jobId: {
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
        modelId: {
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
        modelVersion: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        tableName: 'results',
        timestamps: false
    });
}
