import { Temporal } from 'temporal-polyfill';
// Prisma v8 requires globalThis.Temporal for temporal.updatedAt()
globalThis.Temporal = Temporal;

import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is up and running on http://localhost:${PORT}`);
});
