const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient()


const signup = async (req,res) => {
    const {userId, password, name, birth, sex, email } = req.body;
    try{
        //데이터 유무 체크
        if(!userId || !password || !name || !birth || !sex || !email){
            return res.status(200).json({
                'code': 1001,
                'msg':"회원가입에 필요한 정보가 부족합니다."
            })
        }

        //중복 아이디 체크
        const userIDExist = await prisma.user.findMany({
            where: {userId: userId}
        });
        if(userIDExist.length > 0){
            console.log(userIDExist);
            return res.status(500).json({
                'code' : 1002,
                'msg' : '이미 사용중인 아이디 입니다.'
            });
        }

        /*
            todo: db 접근 id중복, email중복 한번에 하는것이 좋을지? => db접근 불필요 한거 줄이기
            인덱싱
         */
        //중복 이메일 체크
        const userEmailExist = await prisma.user.findFirst({
            where: {email: email}
        });
        if(userEmailExist){
            console.log(userEmailExist);
            return res.status(403).json({
                'code': 403,
                'msg' : '이미 사용중인 이메일 입니다.'
            });
        }

        //유저 데이터 저장
        const userSex = sex%2 ? 'M' : 'F';
        //비밀번호 암호화
        const hashPassword = bcrypt.hashSync(password, 10);
        let user = await prisma.user.create({
            data: {
                userId: userId,
                password: hashPassword,
                name: name,
                birth: birth,
                sex: userSex,
                email: email,
            }
        });

        return res.status(200).json({
            'code' : 200,
            'msg' : '회원가입이 완료되었습니다.'
        })
    }catch (error) {
        res.status(500).json({
            'code' : 500,
            'msg' : error
        });
        console.error(error);
    }
}
const login = async (req, res) => {
    const {userId, password} = req.body;
    //todo: try catch 어디서부터 어디까지 감싸는게 더 좋을지?
    try {
        console.log(userId);
        const userInfo = await prisma.user.findFirst({
            where: {
                userId: userId,
            }
        });
        const pwdMatch = await bcrypt.compare(password, userInfo.password);
        if (!userInfo || !pwdMatch) {
            return res.status(403).json({
                'code': 403,
                'msg': '아이디 또는 패스워드가 일치하지 않습니다.'
            })
        } else {
            //access Token
            const accessToken = jwt.sign({
                id: userInfo.id,
                userId: userInfo.userInfo,
                name: userInfo.name
            }, process.env.ACCESS_SECRET_KEY, {
                expiresIn: '30m', //유효기간
                issuer: 'Book Storage'
            });

            //refresh Token
            const refreshToken = jwt.sign({
                id: userInfo.id,
                userId: userInfo.userInfo,
                name: userInfo.name
            }, process.env.REFRESH_SECRET_KEY, {
                expiresIn: '24h', //유효기간
                issuer: 'Book Storage'
            });

            //token 전송
            res.cookie("accessToken", accessToken, {
                secure: false, //http's' 사용시
                httpOnly: true // 자바스크립트에서 쿠키 접근 불가능!
            });
            res.cookie("refreshToken", refreshToken, {
                secure: false, //http's' 사용시
                httpOnly: true // 자바스크립트에서 쿠키 접근 불가능!
            });

            res.status(200).json({
                'code': 200,
                'msg': '토큰이 발급되었습니다.',
            })
        }
    } catch (error) {
        res.status(500).json({
            'code': 500,
            'msg': error
        });
        console.error(error);
    }
}


const accessToken = async (req,res) => {
    try {
        const token = req.cookies.accessToken;
        const data = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
        if (data == null) {
            return res.status(401).json({
                'code': 401,
                'msg': 'tokenError'
            });
        }
        const userData = await prisma.user.findUnique({
            where: {
                id: data.id,
            }
        });
        if(userData){
            const {password, ...others} = userData;
            res.status(200).json(others);
        }else {
            return res.status(403).json({
                'code': 403,
                'msg': 'not exist user info'
            })
        }

    }catch (error){
        res.status(500).json({
            'code' : 500,
            'msg' : error
        });
    }
}

const refreshToken = async (req, res) => {
    //access token 갱신
    try {
        const token = req.cookies.refreshToken;
        const data = jwt.verify(token, process.env.REFRESH_SECRET_KEY);
        const userData = await prisma.user.findUnique({
            where: {
                id: data.id,
            }
        });

        //access token 발급
        if (userData) {
            const accessToken = jwt.sign({
                id: userData.id,
                userId: userData.userId,
                name: userData.name
            }, process.env.ACCESS_SECRET_KEY, {
                expiresIn: '30m', //유효기간
                issuer: 'Book Storage'
            });

            res.cookie("accessToken", accessToken, {
                secure: false,
                httpOnly: true
            });

            res.status(200).json({
                'code': 200,
                'msg' : 'access token 재발급'
            })
        }
    } catch (error) {
        res.status(500).json({
            'code' : 500,
            'msg' : error
        });
    }
}

const isValidToken = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        const data = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
        if (data == null) {
            return res.status(401).json({
                'code': 401,
                'msg': 'tokenError'
            });
        }else{
            next();
        }
    }catch (error){
        res.status(500).json({
            'code' : 500,
            'msg' : error
        });
    }
}

const loginSuccess = async (req, res) => {
    try {
        const token = req.cookies.accessToken;
        const data = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
        if (data == null) {
            return res.status(401).json({
                'code': 401,
                'msg': 'tokenError'
            });
        }

        const userData = await prisma.user.findUnique({
            where: {
                id: data.id
            }
        });
        console.log(userData);
        if(userData) {
            const {password, ...others} = userData;
            res.status(200).json(others);
        }else {
            return res.status(403).json({
                'code': 403,
                'msg': 'not exist user info'
            })
        }
    }catch (error){
        res.status(500).json({
            'code' : 500,
            'msg' : error
        });
    }
}

const logout = (req, res) => {
    //토큰 삭제
    console.log('logout');
    try{
        res.cookie('accessToken','');
        res.status(200).json({
            'code':200,
            'msg':'로그아웃'
        })
    }catch (error){
        res.status(500).json({
            'code' : 500,
            'msg' : error
        });
    }
}

module.exports = {
    signup,
    login,
    accessToken,
    refreshToken,
    loginSuccess,
    logout,
    isValidToken
}