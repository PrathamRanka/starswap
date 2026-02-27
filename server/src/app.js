import express from 'express';
import sessionConfig from './config/session.js';
import errorMiddleware from './middleware/error.middleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(sessionConfig);

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});


app.use(errorMiddleware);

export default app;