const express = require('express');
const cookieParser = require("cookie-parser");
const router = express.Router();
const {PrismaClient} = require('@prisma/client');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient()

//이미지 업로드 할때 insert or update, id?, 이미지 url -ub쪽도

//저장 - id? update : insert - ub 쪽도
const insertBook = async (req,res) => {
    const {title, subject, cover, content} = req.body;
    console.log(title);
    console.log(subject);
    console.log(cover);
    console.log(content);
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

        const isComplete = !!(title && subject && cover && content)

        //데이터 저장
        let bookInsert = await prisma.book.create({
            data: {
                title: title,
                subject: subject,
                coverUrl: cover,
                content: content,
                isComplete: isComplete,
            }
        });

        const userId = userData.id;
        const bookId = bookInsert.id;

        // Search for user and book objects
        const user = await prisma.user.findUnique({where: {id: userId}});
        const book = await prisma.book.findUnique({where: {id: bookId}});

        if (!user) {
            console.error('User not found');
            // Handle error
            return res.status(500).json({
                'code': 500,
                'msg': 'not exist user'
            });
        }

        if (!book) {
            console.error('Book not found');
            // Handle error
            return res.status(500).json({
                'code': 500,
                'msg': 'not exist book'
            });
        }

        // Create a new entry in UsersBook table
        const usersBook = await prisma.usersBook.create({
            data: {
                user: {connect: {id: user.id}},
                book: {connect: {id: book.id}},
            },
        });

        return res.status(200).json({
            'code': 200,
            'msg': '책이 저장 되었습니다.'
        });

    } catch (error) {
            res.status(500).json({
                'code': 500,
                'msg': 'error test'
            });
            console.error(error);
    }
}

const getMyBooks = async (req,res) => {
    const {page,limit} = req.body;
    try{
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
            },
        });

        const myBooks = await prisma.usersBook.findMany({
            skip: Number(page),
            take: Number(limit),
            where: {
                userId: userData.id
            },
            // include:{ //조인된 양쪽 테이블 둘다 들고옴
            //     user: true,
            //     book: true,
            // },
            select: {
                id:true,
                user:{
                    select:{
                        id: true,
                        name: true,
                    }
                },
                book:{
                    select:{
                        id: true,
                        coverUrl: true,
                        title: true
                    }
                }
            }
        });
        // myBooks 배열에서 중복된 데이터를 제거합니다.
        const uniqueUserBooks = [...new Set(myBooks.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));
        console.log(uniqueUserBooks);

        return res.status(200).json({
            list : uniqueUserBooks
        });

    }catch (error) {
        res.status(500).json({
            'code': 500,
            'msg': 'error test'
        });
        console.error(error);
    }

}

const getBestBooks = async (req,res) => {
    const {page,limit} = req.body;
    try{
        const bestBooks = await prisma.usersBook.findMany({
            skip: Number(page),
            take: Number(limit),
            select: {
                id:true,
                user:{
                    select:{
                        id: true,
                        name: true,
                    }
                },
                book:{
                    select:{
                        id: true,
                        coverUrl: true,
                        title: true
                    }
                }
            }
        });
        // myBooks 배열에서 중복된 데이터를 제거합니다.
        const uniqueUserBooks = [...new Set(bestBooks.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));
        console.log(uniqueUserBooks);

        return res.status(200).json({
            list : uniqueUserBooks
        });

    }catch (error) {
        res.status(500).json({
            'code': 500,
            'msg': 'error test'
        });
        console.error(error);
    }
}

const getLatestBooks = async (req,res) => {
    const {page,limit} = req.body;
    try{
        const latestBooks = await prisma.usersBook.findMany({
            skip: Number(page),
            take: Number(limit),
            select: {
                id:true,
                user:{
                    select:{
                        id: true,
                        name: true,
                    }
                },
                book:{
                    select:{
                        id: true,
                        coverUrl: true,
                        title: true
                    }
                }
            },
            orderBy:{
                createdAt: 'desc',
            }
        });
        // myBooks 배열에서 중복된 데이터를 제거합니다.
        const uniqueUserBooks = [...new Set(latestBooks.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));
        console.log(uniqueUserBooks);

        return res.status(200).json({
            list : uniqueUserBooks
        });

    }catch (error) {
        res.status(500).json({
            'code': 500,
            'msg': 'error test'
        });
        console.error(error);
    }
}

module.exports = {
    insertBook, getMyBooks, getBestBooks, getLatestBooks
};