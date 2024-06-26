const express = require('express')
const app = express()
const { MongoClient, ObjectId} = require('mongodb');
const methodOverride = require('method-override')
//비밀번호 해싱을 위한 bcrypt알고리즘 셋팅
const bcrypt = require('bcrypt')
require('dotenv').config()

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

//passport 라이브러리 셋팅
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const MongoStore = require('connect-mongo');
const connectDB = require('./database.js');

//app.use 순서 지키기
app.use(passport.initialize())
app.use(session({
  secret: process.env.SECRET,
  resave : false,
  saveUninitialized : false,
  cookie : { maxAge : 60 * 60 * 1000}, //1시간 유지
  store : MongoStore.create({
    mongoUrl : process.env.DB_URL,
    dbName : 'Challenge',
  })
}))
app.use(passport.session()) 

let conDB = require('./database.js')

let db;
const url = process.env.DB_URL;
conDB.then((client)=>{
    console.log('DB연결성공')
    db = client.db('Challenge');
    //서버 띄우는 코드 //port = 연결하는구멍 //port 여는 코드
    app.listen(process.env.PORT, () => {
    console.log('http://localhost:8081 에서 서버 실행중')
})
}).catch((err)=>{
    console.log(err)
})

//제출한 아이디/비밀번호 검사
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    let result = await db.collection('user').findOne({ username : 입력한아이디})
    console.log(result)
    if (!result) {
        return cb(null, false, { message: '아이디 DB에 없음' })
    }
    if (await bcrypt.compare(입력한비번.toString(), result.password)) {
      return cb(null, result)
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
  }))

//로그인시 세션 만들기, 쿠키를 유저에게 보내주기
passport.serializeUser((user, done) => {
    process.nextTick(() => { //<-내부코드를 비동기적으로 처리해줌
        done(null, { id : user._id , username : user.username })
    })
})

//유저가 보낸 쿠키분석
passport.deserializeUser(async(user, done) => {
    let result = await db.collection('user').findOne({_id : new ObjectId(user.id)})
    delete result.password
    process.nextTick(() => {
        done(null, result)
    })
}) //이제 request.user 하면 현재 로그인한 유저 정보 불러오기 가능


//맨 처음 페이지
app.get('/', (request,response) =>{
    response.sendFile(__dirname + '/welcome.html')
})

function LogInCheck(request, response,next){
    if(!request.isAuthenticated()){
        response.redirect('/login');
    } else {
        next()
    }
}
//메인페이지 접속
app.get('/main',LogInCheck, async(request, response) => {
    let result = await db.collection('card').find().skip(10*(request.params.num-1)).limit(10*request.params.num).toArray()
    let user = await db.collection('user').findOne({username : request.user.username})
    response.render('main.ejs',{챌린지 : result , 유저 : user})
})

//로그인 기능
app.post('/login', async(request, response, next) =>{
    passport.authenticate('local', (error, user, info)=>{
        if(error) return response.status(500).json(error)
        if(!user) return response.status(401).json(info.message)
        request.logIn(user, (err)=>{
            if(err) return next(err)
        response.redirect('/main')
    })
        
    })(request, response, next)
})

//로그아웃 기능
app.get('/logout', (request, response, next) => {
    request.logOut(err => {
      if (err) {
        return next(err);
      } else {
        console.log('로그아웃됨.');
        response.redirect('/');
      }
    });
  });


//회원가입 예외처리 추가할것!
app.post('/signup', async(request,response)=>{

    let hash = await bcrypt.hash(request.body.password,10)
    let compare = await db.collection('user').findOne({username : request.body.username})
    if(compare) return response.send("<script>alert('이미 존재하는 아이디입니다.');window.location.replace('/signup')</script>");
    if(request.body.password != request.body.password_check) return response.send("<script>alert('비밀번호가 다릅니다.');window.location.replace('/signup')</script>")
    await db.collection('user').insertOne(
        {
            username : request.body.username,
            password : hash,
            cash : 0,
            participating_in_challenge : []
        }
    )
    response.redirect('/main')
})

//페이지네이션
app.get('/main/:num', async(request, response) => {
    let result = await db.collection('card').find().skip(12*(request.params.num-1)).limit(12*request.params.num).toArray()
    let user = await db.collection('user').findOne({username : request.user.username})
    response.render('main.ejs',{챌린지 : result, 유저 : user})
})



app.use('/', require('./routes/navbar.js'))
app.use('/', require('./routes/challenge.js'))