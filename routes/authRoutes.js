const {Router} = require('express');
const authController = require('../controllers/authControllers');

const router = Router();



router.get('/user/verify/:userID/:uniqueString', authController.verify_get);
router.get('/api/user/verified', authController.verified_get);
router.get('/api/user/pwdAuth', authController.auth_get);
router.get('/api/user/pwdredirect', authController.redirect_get)
router.get('/api/load', authController.load_get)
router.post('/api/signup', authController.signup_post)
router.post('/api/login', authController.login_post);
router.get('/api/orders', authController.orders_get);
router.get('/api/logout', authController.logout_get);
router.post('/api/forgetPwd', authController.forgetpwd_post);
router.post('/api/pwdreset/:email?', authController.pwdReset_post);
router.get('/api/pwdauthenticate', authController.pwdAuthenticate_get);


module.exports = router;