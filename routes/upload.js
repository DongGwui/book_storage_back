const express = require('express');
const router = express.Router();
const {imgUpload} = require('../controller/upload');
const multer = require('multer');
const path = require("path");
router.use(express.urlencoded({ extended: false }));
router.use(express.static(path.join(__dirname, 'public')));

// multer 설정
const upload = multer({
    storage: multer.diskStorage({
        // 저장할 장소
        destination(req, file, cb) {
            cb(null, `public/uploads/img/`);
        },
        // 저장할 이미지의 파일명
        filename(req, file, cb) {
            const ext = path.extname(file.originalname); // 파일의 확장자
            console.log('file.originalname', file.originalname);
            // 파일명이 절대 겹치지 않도록 해줘야한다.
            // 파일이름 + 현재시간밀리초 + 파일확장자명
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    // limits: { fileSize: 5 * 1024 * 1024 } // 파일 크기 제한
});
router.post('/img', upload.single('image'), imgUpload);

module.exports = router;