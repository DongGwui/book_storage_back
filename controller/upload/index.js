const express = require('express');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// 하나의 이미지 파일만 가져온다.
 const imgUpload = (req, res) => {
     try {
         // 해당 라우터가 정상적으로 작동하면 public/uploads에 이미지가 업로드된다.
         // 업로드된 이미지의 URL 경로를 프론트엔드로 반환한다.
         console.log('전달받은 파일1', req.file.filename);
         // console.log('저장된 파일의 이름', req.file.filename);
         // 파일이 저장된 경로를 클라이언트에게 반환해준다.
         const IMG_URL = `http://localhost:4000/uploads/img/${req.file.filename}`;
         console.log(IMG_URL);
         res.json({ url: IMG_URL });
     }catch (error){
         console.error(error)
     }
 }
module.exports = {
        imgUpload
    };