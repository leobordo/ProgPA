import dataRouter from './routers/dataRouter';
import tokenManagementRouter from './routers/tokenManagementRouter';
import inferenceRouter from './routers/inferenceRouter';
require('dotenv').config();         // Loading environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

app.use('/datasets', dataRouter);
app.use('/token', tokenManagementRouter);
app.use('/inference', inferenceRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})