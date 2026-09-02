First time — bootstrap your DB:

npx prisma db init

This creates all tables in your PostgreSQL database to match your contract.prisma.

After changing the schema:
bash
# 1. Re-emit the contract (generates contract.json + contract.d.ts)
npx prisma contract emit
# 2. Update the live database to match
npx prisma db update