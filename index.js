const express = require('express');
const cors = require('cors');
const port=process.env.PORT || 5000;
require('dotenv').config();
const app=express();

//middleware
app.use(cors());
app.use(express.json());

//mongodb starting

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ksontsm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
//***Function started */
async function run(){
try{
const categoriesOptionsCollections=client.db('xwatch-factor').collection('categoriesCollections');
const allProductsCollections=client.db('xwatch-factor').collection('productsCollections');
const usersCollection=client.db('xwatch-factor').collection('users');
const bookingsCollection=client.db('xwatch-factor').collection('bookings');
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
app.put('/allproducts/:id',async(req,res)=>{
    const id=req.params.id;
    const filter={_id:ObjectId(id)}
    const options={upsert:true};
    const updateDoc={
        $set:{
            advertised: true
        }
    }
    const result=await allProductsCollections.updateOne(filter,updateDoc,options);
    res.send(result);
});
app.get('/bookings',async(req,res)=>{
    const query={};
    const options=await bookingsCollection.find(query).toArray();
    res.send(options);
});
app.get('/products/:email',async(req,res)=>{
    const email=req.params.email;
    const query={sellers_email:email};
    const sellerProducts=await allProductsCollections.find(query).toArray();
    res.send(sellerProducts);
})
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
// app.get('/addUsersStatus',async(req,res)=>{
//     const filter={}
//     const options={upsert:true}
//     const updateDoc={
//         $set:{
//            status:"Seller"
//         }
//     }
//     const result=await usersCollection.updateMany(filter,updateDoc,options);
// });

app.get('/users/admin/:email',async(req,res)=>{
    const email=req.params.email;
    const filter={email:email}
    const user=await usersCollection.findOne(filter);
    res.send({isAdmin : user?.role==='admin'});
});
app.get('/users/:email',async(req,res)=>{
    const email=req.params.email;
    const filter={email:email}
    const user=await usersCollection.findOne(filter);
    res.send({isSeller:user?.status==='Seller'})

})
app.get('/allusers/:email',async(req,res)=>{
    const email=req.params.email;
    const filter={email:email}
    const user=await usersCollection.findOne(filter);
    res.send({isBuyer:user?.status==='Buyer'})

})
app.put('/users/admin/:id',async(req,res)=>{
    const id=req.params.id;
    const filter={_id:ObjectId(id)}
    const options={upsert:true};
    const updateDoc={
        $set:{
            role:'admin'
        }
    }
    const result=await usersCollection.updateOne(filter,updateDoc,options);
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
app.post('/bookings',async(req,res)=>{

    const booking=req.body;
    const result=await bookingsCollection.insertOne(booking);
    res.send(result);
});
app.get('/bookings/:email',async(req,res)=>{
    const email=req.params.email;
    const query={buyers_email:email};
    const bookingProducts=await bookingsCollection.find(query).toArray();
    res.send(bookingProducts);

});
app.get('/allbookings/:email',async(req,res)=>{
    const email=req.params.email;
    const query={sellers_email:email};
    const bookingProducts=await bookingsCollection.find(query).toArray();
    res.send(bookingProducts);

});
app.get('/advertisedProducts/:id',async(req,res)=>{
const id=req.params.id;
const filterId={_id: ObjectId(id)}
const advertisedProduct=await allProductsCollections.findOne(filterId);

res.send(advertisedProduct);
});
app.delete('/allproducts/:id',async(req,res)=>{
    const id=req.params.id;
    const filter={_id: ObjectId(id)};
    const result=await allProductsCollections.deleteOne(filter);
    res.send(result);
});
app.delete('/users/:id',async(req,res)=>{
    const id=req.params.id;
    const filter={_id: ObjectId(id)};
    const result=await usersCollection.deleteOne(filter);
    res.send(result);
});
app.get('/allproducts/:id',async(req,res)=>{
    const id=req.params.id;
    const filter={_id: ObjectId(id)};
    console.log(filter)
    const result=await allProductsCollections.findOne(filter);
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