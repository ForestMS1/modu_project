const router = require('express').Router()

const { request, response } = require('express');
let conDB = require('./../database.js')

let db;
const url = process.env.DB_URL
conDB.then((client)=>{
    db = client.db('Challenge');
}).catch((err)=>{
    console.log(err)
})

router.get('/login', (request,response) =>{
    response.render('login.ejs')
})

router.get('/mypage', (request,response)=>{
    response.render('mypage.ejs',{유저정보 : request.user})
    console.log(request.user.username)
})

router.get('/signup',(request,response)=>{
    response.render('signup.ejs')
})

router.get('/pay', (request, response)=>{
    response.render('pay.ejs',{유저 : request.user})
})

//캐시충전
router.post('/pay', async(request,response)=>{
    let payment = parseInt(request.body.payment);
    await db.collection('user').updateOne(
        {username : request.user.username},
        {$inc : {cash : payment}});

    response.redirect('/main')
})


module.exports = router