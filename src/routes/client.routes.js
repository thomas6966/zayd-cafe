// Mini App uchun API
const router = require('express').Router();
const { requireUser } = require('../middlewares/auth.middleware');
const c = require('../controllers/cartController');

router.get('/menu', c.getMenu); // ochiq
router.get('/config', c.getConfig); // qo'shimchalar + sozlamalar
router.post('/quote', c.quote); // narx hisoblash (promo-kod)
router.post('/orders', requireUser, c.createOrder);
router.get('/orders/my', requireUser, c.myOrders);
router.get('/orders/:id', requireUser, c.getOrder);

module.exports = router;
