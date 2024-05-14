const router = require('express').Router()

let conDB = require('./../database.js')

let db;
const url = 'mongodb+srv://daesung:ReJWrIXa1WEzyPBF@cluster0.v4siqil.mongodb.net/?retryWrites=true&w=majority&routerName=Cluster0';
conDB.then((client)=>{
    db = client.db('Challenge');
}).catch((err)=>{
    console.log(err)
})


router.get('/challenge_detail/:id', async(request,response)=>{
    let result = await db.collection('card').findOne({_id : new ObjectId(request.params.id)})
    response.render('challenge_detail',{챌린지 : result})
})

router.get('/create_challenge',(request, response) =>{
    response.sendFile(__dirname + '/create_challenge.html')
})

router.get('/del/:id', async(request,response)=>{
    await db.collection('card').deleteOne({_id : new ObjectId(request.params.id)})
    response.redirect('/main')
})

router.post('/create_challenge_add', async(request, response)=>{
    await db.collection('card').insertOne(
        {   title : request.body.challengeName ,
            fee : parseInt(request.body.minParticipationFee) ,
            deadline : new Date() + parseInt(request.body.goalPeriod) ,
            participants : 1,
            total_prize : parseInt(request.body.minParticipationFee),
            in_user_ID : 'master'
        }
    )
    response.redirect('/main')
})

module.exports = router