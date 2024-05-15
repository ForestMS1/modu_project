const router = require('express').Router()
const ObjectId = require('mongodb').ObjectId;
let conDB = require('./../database.js')

let db;
const url = process.env.DB_URL
conDB.then((client)=>{
    db = client.db('Challenge');
}).catch((err)=>{
    console.log(err)
})


router.get('/challenge_detail/:id', async (request, response) => {
    let result = await db.collection('card').findOne({ _id: new ObjectId(request.params.id) });
    let isParticipant = await db.collection('card').findOne({ _id: new ObjectId(request.params.id), in_user_ID: request.user.username });
    let user = await db.collection('user').findOne({username : request.user.username});
    if (isParticipant) {
        // 이미 참가한 사용자는 그냥 챌린지 상세 페이지를 렌더링합니다.
        response.render('challenge_detail', { 챌린지: result , 유저 : user});
    } else {
        if(request.user.cash < result.fee) {
            return response.send("<script>alert('cash가 부족합니다.');window.location.replace('/pay')</script>")
        }
        // 참가하지 않은 사용자의 경우, 참가 처리를 합니다.
        await db.collection('card').updateOne(
            { _id: new ObjectId(request.params.id) },
            {
                $push: { in_user_ID: request.user.username },
                $inc: { participants: 1, total_prize: result.fee }
            }
        );
        await db.collection('user').updateOne(
            {username : request.user.username},
            {
                $inc: {cash: -result.fee},
                $push: {participating_in_challenge: result._id}
            }
        )
        response.render('challenge_detail', { 챌린지: result , 유저 : user});
    }
});


router.get('/create_challenge',(request, response) =>{
    response.render('create_challenge')
})

router.get('/del/:id', async(request,response)=>{
    let card = await db.collection('card').findOne({_id : new ObjectId(request.params.id)})
    if(request.user.username != card.managerID){
        return response.send("<script>alert('challenge 주인이 아닙니다.');window.location.href = '/challenge_detail/" + request.params.id + "';</script>");
    }
    await db.collection('card').deleteOne({_id : new ObjectId(request.params.id)})
    response.redirect('/main')
})

router.post('/create_challenge_add', async(request, response)=>{
    let currentDate = new Date();
    let goalPeriod = parseInt(request.body.goalPeriod) * 24 * 60 * 60 * 1000;
    let deadline = new Date(currentDate.getTime() + goalPeriod)

    let user = await db.collection('user').findOne({username : request.user.username});
    let payment = parseInt(request.body.minParticipationFee);
    if(user.cash < payment){
        return response.send("<script>alert('cash가 부족합니다.');window.location.replace('/pay')</script>");
    }
    await db.collection('user').updateOne(
        {username : request.user.username},
        {$inc : {cash : -payment}});

    await db.collection('card').insertOne(
        {   title : request.body.challengeName ,
            fee : parseInt(request.body.minParticipationFee) ,
            deadline : deadline ,
            participants : 1,
            total_prize : parseInt(request.body.minParticipationFee),
            in_user_ID : [request.user.username],
            managerID : request.user.username
        }
    )
    response.redirect('/main')
    
})

router.get('/challenge_end/:id', async(request, response) => {
    let card = await db.collection('card').findOne({ _id: new ObjectId(request.params.id) });
    if (request.user.username != card.managerID) {
        return response.send("<script>alert('challenge 주인이 아닙니다.');window.location.href = '/challenge_detail/" + request.params.id + "';</script>");
    }

    let participants_num = card.participants;
    let total_prize = card.total_prize;
    let individual_prize = total_prize / participants_num;

    // 챌린지에 참여한 모든 유저의 캐시를 업데이트합니다.
    await db.collection('user').updateMany(
        { username: { $in: card.in_user_ID } },
        { $inc: { cash: individual_prize } }
    );

    // 챌린지 정보를 삭제합니다.
    await db.collection('card').deleteOne({ _id: new ObjectId(request.params.id) });

    response.redirect('/main');
});

router.get('/challenge_giveup/:id', async(request, response)=>{
    let cardID = new ObjectId(request.params.id);
    await db.collection('card').updateOne(
        {_id : cardID},

        {
            $inc : {participants : -1},
            $pull : {in_user_ID : request.user.username}
        });
    
    await db.collection('user').updateOne(
        { username: request.user.username },
        { $pull: { participating_in_challenge: cardID } }
    );
    return response.send("<script>alert('챌린지를 중도 포기하셨습니다.');window.location.replace('/main')</script>");
})

module.exports = router