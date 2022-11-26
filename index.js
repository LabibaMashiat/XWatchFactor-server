const express = require('express');
const cors = require('cors');
const port=process.env.PORT || 5000;
require('dotenv').config();
const app=express();

//middleware
app.use(cors());
app.use(express.json());

//mongodb starting

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ksontsm.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//mongodb ending
app.get('/',async(req,res)=>{
    res.send('x-watch-factor server is running');
});
app.listen(port,()=>{
    console.log(`XWatchFactor portal is running on port ${port}`)
})