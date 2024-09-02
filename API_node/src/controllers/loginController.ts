import { NextFunction, Request, Response } from 'express';
import * as loginService from '../services/loginServices'
import HTTPStatus from 'http-status-codes'; 

const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        const access_token:string = await loginService.login(email!, password!);

        const response: Object = {message: "Logged in", jwt_token: access_token};
        res.status(HTTPStatus.OK).send(response);
    }
    catch (error) {
        next(error);
    }
}

const registration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {
        const { email, password } = req.body;
        const createdUser = await loginService.registration(email, password);
        const response = {message: "Registration completed", email: createdUser.email, token_balance: createdUser.tokens};
        res.status(HTTPStatus.CREATED).json(response);
    } catch (error) {
        next(error);
    }
}


export { login, registration };