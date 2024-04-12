const express = require('express')
const app = express()
const { MongoClient, ObjectId} = require('mongodb');
const methodOverride = require('method-override')

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))




let db;
const url = 'mongodb+srv://daesung:ReJWrIXa1WEzyPBF@cluster0.v4siqil.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
new MongoClient(url).connect().then((client)=>{
    console.log('DB연결성공')
    db = client.db('Challenge');
    //서버 띄우는 코드 //port = 연결하는구멍 //port 여는 코드
    app.listen(8081, () => {
    console.log('http://localhost:8081 에서 서버 실행중')
})
}).catch((err)=>{
    console.log(err)
})

app.get('/', (request,response) =>{
    response.sendFile(__dirname + '/welcome.html')
})
//메인페이지 접속
app.get('/main', async(request, response) => {
    let result = await db.collection('card').find().toArray()
    response.render('main.ejs',{챌린지 : result})
})
//ID: daesung //pw: ReJWrIXa1WEzyPBF

app.get('/login', (request,response) =>{
    response.sendFile(__dirname + '/login.html')
})

app.get('/signup',(request,response)=>{
    response.sendFile(__dirname + '/signup.html')
})

app.get('/challenge_detail/:id', async(request,response)=>{
    let result = await db.collection('card').findOne({_id : new ObjectId(request.params.id)})
    response.render('challenge_detail',{챌린지 : result})
})