
import express from 'express'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import cors from 'cors'

const app = express()

// Require variables from .env file if available
require('dotenv').config()

// Logger
app.use(morgan('dev'))

// CORS
app.use(cors())

// Body parser
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}))
app.use(bodyParser.json({
  limit : '50mb'
}))

export default app
