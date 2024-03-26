import express from 'express';
import {db,connecttodb} from './db.js';
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import 'dotenv/config';
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);


const credentials=JSON.parse(
    fs.readFileSync('./credentials.json')
);
admin.initializeApp({
    credential:admin.credential.cert(credentials),
});

//localhost:3000/articles/learn-node
const app=express();
var uid;

//when it recieves request that has json body, that will make available to us.
app.use(express.json());
app.use(express.static(path.join(__dirname,'../build')));

app.get(/^(?!\/api).+/,(req,res)=>{
    res.sendFile(path.join(__dirname,'../build/index.html'));
})

//middleware
app.use(async(req,res,next)=>{
const {authtoken}=req.headers;

if(authtoken){
    try{
req.user=await admin.auth().verifyIdToken(authtoken);
    }
    catch(e){
        return res.sendStatus(400);
    }
}
req.user=req.user ||  {};
next();

});

app.get('/api/articles/:name',async(req,res)=>{
    const {name}=req.params;

    uid=req.user;
    console.log(uid,name);
    const article=await db.collection('articles').findOne({name});
    if(article){
    const upvoteIds=(article.upvoteIds || []);
    article.canUpvote=(uid && !upvoteIds.includes(uid));
    res.json(article);
    }
    else{
        res.sendStatus(404);
    }
});

app.use((req,res,next)=>{
    if(req.user){
        next();
    }
    else{
        res.sendStatus(401);
    }
});

app.put('/api/articles/:name/upvote',async(req,res)=>{
    const {name}=req.params;
    console.log(uid,name);
    const article=await db.collection('articles').findOne({name});
    if(article){
    
    const upvoteIds=(article.upvoteIds || []);
    const canUpvote= (!upvoteIds.includes(uid["email"]));
    console.log(upvoteIds)
    console.log(uid)
    if(canUpvote){
   
    await db.collection('articles').updateOne({name},{
        $inc:{
            upvotes:1
        },
        $push:{upvoteIds:uid["email"]},
    });
}
    const updatedArticle=await db.collection('articles').findOne({name});
    res.json(article);
    }
    else{
        res.send('The article doesn\'t exist');
    }
});
app.post('/api/articles/:name/comments',async(req,res)=>{
    const {name}=req.params;
    const {text}=req.body;
    const {email}=req.user;



   
    await db.collection('articles').updateOne({name},{
        $push:{comments:{postedby:email,text}},
    });
    const article=await db.collection('articles').findOne({name});

    if(article){
    res.json(article);
    }
    else{
        res.send('The article doesn\'t exist');
    }
});
const PORT=process.env.PORT || 8000;

connecttodb(()=>{
    console.log('connected to database');
app.listen(PORT,()=>{
    console.log('Server is listening on port '+PORT);
});
});