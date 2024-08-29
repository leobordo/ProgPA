// Tags.ts
import { Model, DataTypes, Sequelize } from 'sequelize';
import { Dataset } from './Dataset';

export class Tag extends Model {
    public dataset_id!: number;
    public tag!: string;
}

export function initializeTag(sequelize: Sequelize): void {
    Tag.init({
        dataset_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'datasets',
                key: 'dataset_id'
            }
        },
        tag: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        sequelize,
        tableName: 'tags',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['dataset_id', 'tag'] 
            }
        ]
    });
    Tag.removeAttribute('id');
}
