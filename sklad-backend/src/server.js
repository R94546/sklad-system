import app from './app.js';
import env from './config/env.js';
import { startDebtReminderJob } from './jobs/debtReminder.job.js';

app.listen(env.PORT, () => {
  console.log('Server ' + env.PORT + ' portda ishlamoqda');
  startDebtReminderJob();
});
