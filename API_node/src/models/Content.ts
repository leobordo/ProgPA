import { Model, DataTypes, Sequelize } from 'sequelize';
import { Dataset } from './Dataset'; 

export class Content extends Model {
    public fileId!: number; 
    public filePath!: string;
    public datasetId!: number;
    public datasetName!: string;
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

export function initializeContent(sequelize: Sequelize): void {
    Content.init({
        fileId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        filePath: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        datasetId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Datasets', // Nome della tabella come definito nel modello Sequelize per Datasets
                key: 'id' // Chiave in Datasets che datasetId fa riferimento
            },
            primaryKey: true
        },
        datasetName: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true
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
        tableName: 'Contents',
        timestamps: false, 
    });
}
