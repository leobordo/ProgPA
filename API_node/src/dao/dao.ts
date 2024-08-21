import { Dataset } from '../models/Dataset';
import { Content } from '../models/Content';

const DatasetDAO = {
    async getDsByName(datasetName: string, userEmail: string) {
        return await Dataset.findOne({
            where: {
                datasetName: datasetName,
                email: userEmail,
                isDeleted: false
            }
        });
    },

    async create(datasetName: string, userEmail: string, filePath: string) {
        return await Dataset.create({
            datasetName: datasetName,
            email: userEmail,
            filePath: filePath
        });
    },

    async getAllByUserEmail(userEmail: string) {
        return await Dataset.findAll({
            where: { email: userEmail, isDeleted: false }
        });
    },

    async updateByName(datasetName: string, email: string, updates: { name?: string }) {
        const [affectedRows, updatedDatasets] = await Dataset.update(
            { datasetName: updates.name }, 
            {
                where: { datasetName: datasetName, email: email, isDeleted: false },
                returning: true
            }
        );
        return updatedDatasets[0];
    },

    async softDeleteByName(datasetName: string, email: string) {
        await Dataset.update(
            { isDeleted: true },
            { where: { datasetName: datasetName, email: email } }
        );
    },

    async insertContent(datasetName: string, datasetId: string, filePath: string) {
        await Content.create({
            datasetName: datasetName,
            datasetId: datasetId,
            filePath: filePath
        });
    }
};

export default DatasetDAO;