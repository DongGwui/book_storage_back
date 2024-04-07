const express = require('express');
const router = express.Router();

const {
  signup,
  login,
  accessToken,
  refreshToken,
  loginSuccess,
  logout,
  isValidToken} = require('../controller/auth');

//todo: controller 코드 옮긴이후에 없애기
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient()

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', signup);
router.post('/login',login);
router.post('/accesstoken',accessToken);

router.get('/login/success',isValidToken,loginSuccess);

router.post('/refreshtoken',refreshToken);
// router.get('/login/success',loginSuccess);
router.post('/logout',logout);


module.exports = router;
