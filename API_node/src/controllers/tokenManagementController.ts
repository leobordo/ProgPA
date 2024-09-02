/**
 * @fileOverview This file contains the controllers associated to the routes of the tokenManagementRouter
 */
import { NextFunction, Request, Response } from 'express';
import HTTPStatus from 'http-status-codes';
import * as tokenManagementService from '../services/tokenManagementService';

/** 
 * Gets the token balance of the user that sends the request.
 * @param {Request} req - The Express request object containing the user's email address.
 * @param {Response} res - The Express response object used for sending back the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 *                          The response contains balance of the user that sends the request.                   
 */
const getBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userEmail:string = req.user!.userEmail;
      //Retrieves the user's balance by his email
      const tokenBalance:number = await tokenManagementService.getTokenBalance(userEmail);
      res.status(HTTPStatus.OK).send({ tokenBalance: tokenBalance});
    } catch (error) {
      next(error);
    }
  };

/** 
 * Gets the token balance of the user that sends the request.
 * @param {Request} req - The Express request object containing the user's email address.
 * @param {Response} res - The Express response object used for sending back the HTTP response.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 *                          The response contains balance of the user that sends the request.                   
 */
const updateBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {topUpUserEmail, topUpAmount} = req.body; 
      const updatedTokenBalance:number = await tokenManagementService.updateTokenBalance(topUpUserEmail, topUpAmount);
      res.status(HTTPStatus.OK).send({ updatedTokenBalance: updatedTokenBalance});
    } catch (error) {
      next(error);
    }
  };

export {getBalance, updateBalance};