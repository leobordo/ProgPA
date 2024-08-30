import { Request, Response } from 'express';
import * as service from '../services/inferenceService';
import { IResult, JobStatus } from '../models/job';
import * as userServices from '../services/loginServices'
import  HTTPStatus from 'http-status-codes'; // Import HTTPStatus module

const login = async (req: Request, res: Response): Promise<void> => {
    try {const email = req.body.email
    const password = req.body.password

    const result = await userServices.login(email!, password!);
    
    // Respond with logged user
    res.status(HTTPStatus.CREATED).json(result);}
    catch (error) {
        const err = error as Error;
        
        // Respond with internal server error if an error occurs
        res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({ message: err.message });
      }

}

const registration = async (req: Request, res: Response): Promise<void> => {

    try {const email = req.body.email
    const password = req.body.password
    const confirmPassword = req.body.confirmPassword

    const result = await userServices.registration(email, password, confirmPassword)

    // Respond with registrated user
    res.status(HTTPStatus.CREATED).json(result);} catch(err){
        const error = err as Error
        // Respond with internal server error if an error occurs
        res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }



}


export { login, registration};