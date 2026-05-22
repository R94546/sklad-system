import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorMiddleware } from './middleware/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import categoriesRoutes from './modules/products/categories.routes.js';
import stockinRoutes from './modules/products/stockin.routes.js';
import uploadRoutes from './modules/products/upload.routes.js';
import clientsRoutes from './modules/clients/clients.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import debtsRoutes from './modules/debts/debts.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import auditRoutes from './modules/analytics/audit.routes.js';
import settingsRoutes from './modules/analytics/settings.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sklad API ishlayapti' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/stockin', stockinRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/debts', debtsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorMiddleware);

export default app;
