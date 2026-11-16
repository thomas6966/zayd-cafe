// Admin Panel API (hammasi himoyalangan)
const router = require('express').Router();
const { requireAdmin } = require('../middlewares/auth.middleware');
const a = require('../controllers/adminController');

router.use(requireAdmin);
router.get('/me', a.me);
router.get('/orders', a.listOrders);
router.get('/orders/:id', a.getOrder);
router.patch('/orders/:id/status', a.setStatus);

router.get('/stats', a.stats);
router.get('/customers', a.customers);
router.get('/addons', a.listAddons);
router.post('/addons', a.createAddon);
router.put('/addons/:id', a.updateAddon);
router.delete('/addons/:id', a.deleteAddon);
router.get('/promos', a.listPromos);
router.post('/promos', a.createPromo);
router.put('/promos/:id', a.updatePromo);
router.delete('/promos/:id', a.deletePromo);
router.get('/settings', a.getSettings);
router.put('/settings', a.saveSettings);

router.get('/menu', a.getMenu);
router.post('/categories', a.createCategory);
router.put('/categories/:id', a.updateCategory);
router.delete('/categories/:id', a.deleteCategory);
router.post('/products', a.createProduct);
router.put('/products/:id', a.updateProduct);
router.delete('/products/:id', a.deleteProduct);

module.exports = router;
