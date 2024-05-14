const router = require('express').Router()

let conDB = require('./../database.js')

let db;
const url = 'mongodb+srv://daesung:ReJWrIXa1WEzyPBF@cluster0.v4siqil.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
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


module.exports = router