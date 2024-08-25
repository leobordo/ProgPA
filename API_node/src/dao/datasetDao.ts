import { Dataset } from '../models/sequelize_model/Dataset';

const DatasetDAO = {
    async getMaxDatasetId() {
        const maxDatasetId = await Dataset.max('dataset_id');
        return maxDatasetId;
    },
    
    async getDsByName(dataset_name: string, userEmail: string) {
        console.log("ggg")
        return await Dataset.findOne({
            where: {
                dataset_name: dataset_name,
                email: userEmail,
                is_deleted: false
            }
        });
    },

    async create(dataset_name: string, userEmail: string, file_path: string, tags: string) {
        return await Dataset.create({
            dataset_name: dataset_name,
            email: userEmail,
            file_path: file_path,
            tags: tags,
            is_deleted: false,
            token_cost: 0
        });
    },

    async getAllByUserEmail(userEmail: string) {
        return await Dataset.findAll({
            where: { email: userEmail, is_deleted: false }
        });
    },

    async updateByName(dataset_name: string, userEmail: string, newName?: string, tags?: string ) {
        if(tags == undefined || tags == null)
        {const [affectedRows, updatedDatasets] = await Dataset.update(
            { dataset_name: newName }, 
            {
                where: { dataset_name: dataset_name, email: userEmail, is_deleted: false },
                returning: true
            }
        );
        return updatedDatasets[0];}
        if(newName==undefined || newName == null)
            {const [affectedRows, updatedDatasets] = await Dataset.update(
            { tags: tags }, 
            {
                where: { dataset_name: dataset_name, email: userEmail, is_deleted: false },
                returning: true
            }
        );

        return updatedDatasets[0];}
        const [affectedRows, updatedDatasets] = await Dataset.update(
            {   dataset_name: newName,
                tags: tags }, 
            {
                where: { dataset_name: dataset_name, email: userEmail, is_deleted: false },
                returning: true
            }
        );
        
        return updatedDatasets[0];
    },

    async softDeleteByName(dataset_name: string, userEmail: string) {
        await Dataset.update(
            { is_deleted: true },
            { where: { dataset_name: dataset_name, email: userEmail } }
        );
    },

    async getDatasetByName(dataset_name: string, userEmail: string) {
        const dataset = await Dataset.findOne(
            { where: { dataset_name: dataset_name, email: userEmail, is_deleted: false } }
        );
        if (dataset) {
            return dataset;
        } else {
            throw Error("Dataset not found");
        }
    },

    async updateTokenCostByName(dataset_name: string, userEmail: string, additionalCost: number) {
        const dataset = await Dataset.findOne({
            attributes: ['token_cost'], 
            where: {
                dataset_name: dataset_name,
                email: userEmail,
                is_deleted: false
            }
        });
        if (dataset) {
            const newTokenCost = dataset.token_cost + additionalCost;
            await Dataset.update(
                { token_cost: newTokenCost },
                { where: { dataset_name: dataset_name, email: userEmail } }
            );
        } else {
            throw Error("Dataset not found");
        }
        
    },

    /*async insertContent(dataset_name: string, dataset_id: number, file_path: string) {
        await Content.create({
            dataset_name: dataset_name,
            dataset_id: dataset_id,
            file_path: file_path
        });
    }*/
};

export default DatasetDAO;