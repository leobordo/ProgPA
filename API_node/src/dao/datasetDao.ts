import { Dataset } from '../models/sequelize_model/Dataset';

const DatasetDAO = {
    async getMaxDatasetId() {
        const maxDatasetId = await Dataset.max('dataset_id');
        return maxDatasetId;
    },
    
    async getDsByName(dataset_name: string, userEmail: string) {
        return await Dataset.findOne({
            where: {
                dataset_name: dataset_name,
                email: userEmail,
                isDeleted: false
            }
        });
    },

    async create(dataset_name: string, userEmail: string, file_path: string, tags: string) {
        return await Dataset.create({
            dataset_name: dataset_name,
            email: userEmail,
            file_path: file_path,
            tags: tags,
            isDeleted: false,
            tokenCost: 0
        });
    },

    async getAllByUserEmail(userEmail: string) {
        return await Dataset.findAll({
            where: { email: userEmail, isDeleted: false }
        });
    },

    async updateByName(dataset_name: string, userEmail: string, updates: { name?: string, tags?: string }) {
        if(updates.tags == undefined)
        {const [affectedRows, updatedDatasets] = await Dataset.update(
            { dataset_name: updates.name }, 
            {
                where: { dataset_name: dataset_name, email: userEmail, isDeleted: false },
                returning: true
            }
        );
        return updatedDatasets[0];}
        if(updates.name==undefined)
            {const [affectedRows, updatedDatasets] = await Dataset.update(
            { tags: updates.tags }, 
            {
                where: { dataset_name: dataset_name, email: userEmail, isDeleted: false },
                returning: true
            }
        );

        return updatedDatasets[0];}
        const [affectedRows, updatedDatasets] = await Dataset.update(
            {   dataset_name: updates.name,
                tags: updates.tags }, 
            {
                where: { dataset_name: dataset_name, email: userEmail, isDeleted: false },
                returning: true
            }
        );
        
        return updatedDatasets[0];
    },

    async softDeleteByName(dataset_name: string, userEmail: string) {
        await Dataset.update(
            { isDeleted: true },
            { where: { dataset_name: dataset_name, email: userEmail } }
        );
    },

    async getDatasetByName(dataset_name: string, userEmail: string) {
        const dataset = await Dataset.findOne(
            { where: { dataset_name: dataset_name, email: userEmail, isDeleted: false } }
        );
        if (dataset) {
            return dataset;
        } else {
            throw Error("Dataset not found");
        }
    },

    async updateTokenCostByName(dataset_name: string, userEmail: string, additionalCost: number) {
        const dataset = await Dataset.findOne({
            attributes: ['tokenCost'], 
            where: {
                dataset_name: dataset_name,
                email: userEmail,
                isDeleted: false
            }
        });
        if (dataset) {
            const newTokenCost = dataset.tokenCost + additionalCost;
            await Dataset.update(
                { tokenCost: newTokenCost },
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