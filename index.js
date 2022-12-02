const express = require('express');
const cors = require('cors');
const port=process.env.PORT || 5000;
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const app=express();

//middleware
app.use(cors());
app.use(express.json());

//mongodb starting

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ksontsm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req,res,next){
 const authHeader=req.headers.authorization;
 
 if(!authHeader){
    return res.status(401).send('unauthorised access');
 }
 const token=authHeader.split(' ')[1];
 jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){
    if(err){
        return res.status(403).send({message: 'forbidden access'})
    }
    req.decoded=decoded;
    next();
 })
};


//***Function started */
async function run(){
try{
const categoriesOptionsCollections=client.db('xwatch-factor').collection('categoriesCollections');
const allProductsCollections=client.db('xwatch-factor').collection('productsCollections');
const usersCollection=client.db('xwatch-factor').collection('users');
const bookingsCollection=client.db('xwatch-factor').collection('bookings');
const wishListsCollection=client.db('xwatch-factor').collection('wishLists');
const paymentsCollection=client.db('xwatch-factor').collection('payments');
app.get('/jwt',async(req,res)=>{
    const email=req.query.email;
    const query={email:email}
    const user=await usersCollection.findOne(query);
    if(user){
        const token=jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn: '1h'})
        return res.send({accessToken:token})
    }
    res.status(403).send({accessToken:''})
})
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
app.post('/create-payment-intent',async(req,res)=>{
    const booking=req.body;
    const price=booking.resale_price;
    const amount=price*100;
  
    const paymentIntent=await stripe.paymentIntents.create({
      currency: 'usd',
      amount:amount,
      "payment_method_types":[
          "card"
      ]
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  });
  app.post('/payments',async(req,res)=>{
    const payment=req.body;
    const result=await paymentsCollection.insertOne(payment);
    const id=payment.booking_id
    const filter={_id: ObjectId(id)}
    const updatedDoc={
        $set:{
            paid: true,
            transactionId: payment.transactionId
        }
    }
    const updatedResult=await bookingsCollection.updateOne(filter,updatedDoc)
    res.send(result);
  })
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
app.get('/products/:email',verifyJWT,async(req,res)=>{
    const email=req.params.email;
    const decodedEmail=req.decoded.email;
    if(email!==decodedEmail){
        return res.status(403).send({message:'forbidden access'})
    }
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

app.get('/users/admin/:email',async(req,res)=>{
    const email=req.params.email;
    const filter={email:email}
    const user=await usersCollection.findOne(filter);
    res.send({isAdmin : user?.role==='admin'});
});
app.get('/users/:email',async(req,res)=>{
    const email=req.params.email;
    const filter={email:email,seller_verified:true}
    const user=await usersCollection.findOne(filter);
    res.send({isSeller:user?.status==='Seller'})

})
app.get('/allusers/:email',async(req,res)=>{
    const email=req.params.email;
    const filter={email:email}
    const user=await usersCollection.findOne(filter);
    res.send({isBuyer:user?.status==='Buyer'})

})
app.put('/users/admin/:id',verifyJWT,async(req,res)=>{
    const decodedEmail=req.decoded.email;
    const query={email:decodedEmail};
    const user=await usersCollection.findOne(query)
    if(user.role!=='admin'){
        return res.status(403).send({message:'forbidden access'})
    }
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
app.put('/verifiedSeller/:id',async(req,res)=>{
    const id=req.params.id;
    const filter={_id:ObjectId(id),status:'Seller'}
    const options={upsert:true};
    const updateDoc={
        $set:{
            seller_verified:true
        }
    }
    const result=await usersCollection.updateOne(filter,updateDoc,options);
    res.send(result);
});
app.get('/allSellers',async(req,res)=>{
    const query={status:'Seller'}
    const result=await usersCollection.find(query).toArray();
    res.send(result);
})
app.get('/allBuyers',async(req,res)=>{
    const query={status:'Buyer'}
    const result=await usersCollection.find(query).toArray();
    res.send(result);
})
app.post('/users',async(req,res)=>{
    const user=req.body;
    const result=await usersCollection.insertOne(user);
    res.send(result);
});

app.post('/products',verifyJWT,async(req,res)=>{
    const product=req.body;
    const result=await allProductsCollections.insertOne(product);
    res.send(result);
});
app.post('/products/wishlists',verifyJWT,async(req,res)=>{
    const wishlist=req.body;
    const result=await wishListsCollection.insertOne(wishlist);
    res.send(result);
});
app.get('/products/wishlists/:email',verifyJWT,async(req,res)=>{
    const email=req.params.email;
    const filter={email:email}
    const result=await wishListsCollection.find(filter).toArray();
    res.send(result)
});
app.post('/bookings',verifyJWT,async(req,res)=>{

    const booking=req.body;
    const result=await bookingsCollection.insertOne(booking);
    res.send(result);
});
app.get('/bookings/:email',verifyJWT,async(req,res)=>{
    const email=req.params.email;
    const query={buyers_email:email};
    const bookingProducts=await bookingsCollection.find(query).toArray();
    res.send(bookingProducts);

});
app.get('/paybookings/:id',verifyJWT,async(req,res)=>{
    const id=req.params.id;
    const query={_id:ObjectId(id)};
    const booking=await bookingsCollection.findOne(query);
   
    res.send(booking);
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