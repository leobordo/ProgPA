import { Sequelize } from 'sequelize';
import { initializeUser } from '../models/sequelize_model/User';
import { initializeDataset } from '../models/sequelize_model/Dataset';
import { createAssociation, initializeResult } from '../models/sequelize_model/Result';
import { initializeTag } from '../models/sequelize_model/Tag';

const sequelize = new Sequelize(`postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`, {
  dialect: 'postgres',
});

const initializeModels = (seq : Sequelize) => {
  initializeUser(seq);
  initializeDataset(seq);
  initializeResult(seq);
  initializeTag(seq)
  createAssociation()
}

export {sequelize, initializeModels};
