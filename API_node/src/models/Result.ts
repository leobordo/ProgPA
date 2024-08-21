import { Model, DataTypes, Sequelize } from 'sequelize';
import { Content } from './Content'; 

export class Results extends Model {
    public fileId!: number; 
    public datasetId!: number;
    public model!: string;
    public personCount?: number;
    public motorcyclistCount?: number;
    public bicycleCount?: number;
    public motorcycleCount?: number;
    public carCount?: number;
    public vehicleCount?: number;
    public roadSignCount?: number;
    public trafficLightCount?: number;
    public streetCameraCount?: number;
    public trafficConeCount?: number;
    public boundingBoxCount?: number;
}

export function initializeResults(sequelize: Sequelize): void {
    Results.init({
        fileId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Contents',
                key: 'fileId'
            },
            primaryKey: true
        },
        datasetId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Datasets',
                key: 'datasetId'
            },
            primaryKey: true
        },
        model: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        personCount: DataTypes.INTEGER,
        motorcyclistCount: DataTypes.INTEGER,
        bicycleCount: DataTypes.INTEGER,
        motorcycleCount: DataTypes.INTEGER,
        carCount: DataTypes.INTEGER,
        vehicleCount: DataTypes.INTEGER,
        roadSignCount: DataTypes.INTEGER,
        trafficLightCount: DataTypes.INTEGER,
        streetCameraCount: DataTypes.INTEGER,
        trafficConeCount: DataTypes.INTEGER,
        boundingBoxCount: DataTypes.INTEGER
    }, {
        sequelize,
        tableName: 'Results',
        timestamps: false
    });
}
