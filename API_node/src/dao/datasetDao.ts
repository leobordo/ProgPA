import { Dataset } from '../models/sequelize_model/Dataset';

const DatasetDAO = {
    async getMaxDatasetId() {
        const maxDatasetId = await Dataset.max('datasetId');
        return maxDatasetId;
    },
    
    async getDsByName(datasetName: string, userEmail: string) {
        return await Dataset.findOne({
            where: {
                datasetName: datasetName,
                email: userEmail,
                isDeleted: false
            }
        });
    },

    async create(datasetName: string, userEmail: string, filePath: string, tags: string) {
        return await Dataset.create({
            datasetName: datasetName,
            email: userEmail,
            filePath: filePath,
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

    async updateByName(datasetName: string, userEmail: string, updates: { name?: string, tags?: string }) {
        if(updates.tags == undefined)
        {const [affectedRows, updatedDatasets] = await Dataset.update(
            { datasetName: updates.name }, 
            {
                where: { datasetName: datasetName, email: userEmail, isDeleted: false },
                returning: true
            }
        );
        return updatedDatasets[0];}
        if(updates.name==undefined)
            {const [affectedRows, updatedDatasets] = await Dataset.update(
            { tags: updates.tags }, 
            {
                where: { datasetName: datasetName, email: userEmail, isDeleted: false },
                returning: true
            }
        );

        return updatedDatasets[0];}
        const [affectedRows, updatedDatasets] = await Dataset.update(
            {   datasetName: updates.name,
                tags: updates.tags }, 
            {
                where: { datasetName: datasetName, email: userEmail, isDeleted: false },
                returning: true
            }
        );
        
        return updatedDatasets[0];
    },

    async softDeleteByName(datasetName: string, userEmail: string) {
        await Dataset.update(
            { isDeleted: true },
            { where: { datasetName: datasetName, email: userEmail } }
        );
    },

    async getDatasetByName(datasetName: string, userEmail: string) {
        const dataset = await Dataset.findOne(
            { where: { datasetName: datasetName, email: userEmail, isDeleted: false } }
        );
        if (dataset) {
            return dataset;
        } else {
            throw Error("Dataset not found");
        }
    },

    async updateTokenCostByName(datasetName: string, userEmail: string, additionalCost: number) {
        const dataset = await Dataset.findOne({
            attributes: ['tokenCost'], 
            where: {
                datasetName: datasetName,
                email: userEmail,
                isDeleted: false
            }
        });
        if (dataset) {
            const newTokenCost = dataset.tokenCost + additionalCost;
            await Dataset.update(
                { tokenCost: newTokenCost },
                { where: { datasetName: datasetName, email: userEmail } }
            );
        } else {
            throw Error("Dataset not found");
        }
        
    },

    /*async insertContent(datasetName: string, datasetId: number, filePath: string) {
        await Content.create({
            datasetName: datasetName,
            datasetId: datasetId,
            filePath: filePath
        });
    }*/
};

export default DatasetDAO;