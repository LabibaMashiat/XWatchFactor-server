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
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
//***Function started */
async function run(){
try{
const categoriesOptionsCollections=client.db('xwatch-factor').collection('categoriesCollections');
const allProductsCollections=client.db('xwatch-factor').collection('productsCollections');
const usersCollection=client.db('xwatch-factor').collection('users');
app.get('/categories',async(req,res)=>{
    const query={};
    const options=await categoriesOptionsCollections.find(query).toArray();
    res.send(options);
});
app.get('/products',async(req,res)=>{
    const query={};
    const options=await allProductsCollections.find(query).toArray();
    res.send(options);
});
app.get('/categories/:id',async(req,res)=>{
    const id=req.params.id;
    const query={};
    const categoryQuery={category:id};
    const productOptions=await allProductsCollections.find(query).toArray();
    const filterCategory=await categoriesOptionsCollections.findOne(categoryQuery);
    console.log(filterCategory);
    const filterProducts=productOptions.filter(option=>
        option.category_value===filterCategory.category
    );
    res.send(filterProducts);
});
app.get('/users',async(req,res)=>{
    const query={};
    const result=await usersCollection.find(query).toArray();
    res.send(result);
});
app.post('/users',async(req,res)=>{
    const user=req.body;
    const result=await usersCollection.insertOne(user);
    res.send(result);
});
app.post('/products',async(req,res)=>{
    const product=req.body;
    const result=await allProductsCollections.insertOne(product);
    res.send(result);
});
}
finally{

}
}
run().catch(console.log);
//***Function End */

//mongodb ending
app.get('/',async(req,res)=>{
    res.send('x-watch-factor server is running');
});
app.listen(port,()=>{
    console.log(`XWatchFactor portal is running on port ${port}`)
})