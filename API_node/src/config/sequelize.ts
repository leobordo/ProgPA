/**
 * @fileOverview Sequelize configuration and model initialization module.
 *
 * This module is responsible for setting up the Sequelize instance with the appropriate
 * PostgreSQL database connection and initializing all the models used in the application.
 * It defines the database connection parameters based on environment variables and provides
 * functions to initialize each model and establish their associations.
 */

import { Sequelize } from 'sequelize';
import { initializeUser } from '../models/sequelize_model/User';
import { initializeDataset } from '../models/sequelize_model/Dataset';
import { createAssociation, initializeResult } from '../models/sequelize_model/Result';
import { initializeTag } from '../models/sequelize_model/Tag';

/**
 * Creates a new Sequelize instance configured to connect to the PostgreSQL database.
 * The connection details are read from environment variables.
 *
 * @constant {Sequelize} sequelize - The configured Sequelize instance.
 */

const sequelize = new Sequelize(`postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`, {
  dialect: 'postgres',
});

/**
 * Initializes all Sequelize models and their associations.
 * 
 * @param {Sequelize} seq - The Sequelize instance used to initialize models.
 */
const initializeModels = (seq : Sequelize) => {
  initializeUser(seq);
  initializeDataset(seq);
  initializeResult(seq);
  initializeTag(seq)
  createAssociation()
}

// Export the Sequelize instance and the model initialization function
export {sequelize, initializeModels};
