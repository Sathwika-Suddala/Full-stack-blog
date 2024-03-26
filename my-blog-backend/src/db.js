import {MongoClient} from 'mongodb';

let db;

async function connecttodb(cb){
    const client=new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.3dtfai0.mongodb.net/?retryWrites=true&w=majority`);
    await client.connect();
    db=client.db('react-blog-db');
    cb();

}

export {db,connecttodb};