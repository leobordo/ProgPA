import { Request, Response } from 'express';
import * as tokenManagementService from '../services/tokenManagementService';

// Returns the token balance of the user that sends the request
const getBalance = async (req: Request, res: Response): Promise<void> => {
    const userEmail = req.body.auth.payload.email;

    try {
      //Retrieves the user's balance by his email
      const tokenBalance:number = await tokenManagementService.getTokenBalance(userEmail);
      res.send({ tokenBalance: tokenBalance});
    } catch (error) {
      res.status(500).send({ error: 'Error' });
    }
  };

// Updates the token balance of the specified user (by email) by adding the specified top-up amount
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