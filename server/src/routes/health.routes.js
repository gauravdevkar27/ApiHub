import { Router } from "express";
import { db } from '../config/db.js'

const User = db.orm.public.User;

const router = Router();

router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: Math.round(process.uptime()),
        timeStamp: new Date().toISOString(),
    });
});

router.get('/ready', async (req, res) => {
    try {
        await User.select('id').first();
        res.status(200).json({ status: 'ready', database: 'up' });
    } catch (err) {
        req.log.error({ err }, 'Readiness check failed: database unreachable');
        res.status(503).json({ status: 'unavailable', database: 'down' });
    }
});

export default router;