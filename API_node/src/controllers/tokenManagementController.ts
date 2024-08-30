/**
 * @fileOverview This file contains the controllers associated to the routes of the tokenManagementRouter
 */
import { Request, Response } from 'express';
import * as tokenManagementService from '../services/tokenManagementService';

/** 
 * Gets the token balance of the user that sends the request.
 * @param {Request} req - The Express request object containing the user's email address.
 * @param {Response} res - The Express response object used for sending back the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 *                          The response contains balance of the user that sends the request.                   
 */
const getBalance = async (req: Request, res: Response): Promise<void> => {
    const userEmail = req.body.userEmail;

    try {
      //Retrieves the user's balance by his email
      const tokenBalance:number = await tokenManagementService.getTokenBalance(userEmail);
      res.send({ tokenBalance: tokenBalance});
    } catch (error) {
      res.status(500).send({ error: 'Error' });
    }
  };

/** 
 * Gets the token balance of the user that sends the request.
 * @param {Request} req - The Express request object containing the user's email address.
 * @param {Response} res - The Express response object used for sending back the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 *                          The response contains balance of the user that sends the request.                   
 */
const updateBalance = async (req: Request, res: Response): Promise<void> => {
    const topUpUserEmail = req.body.topUpUserEmail; 
    const topUpAmount = req.body.topUpAmount;

    try {
      const updatedTokenBalance:number = await tokenManagementService.updateTokenBalance(topUpUserEmail, topUpAmount);
      res.send({ updatedTokenBalance: updatedTokenBalance});
    } catch (error) {
      res.status(500).send({ error: 'Error' });
    }

  };


export {getBalance, updateBalance};