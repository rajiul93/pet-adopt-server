const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const cookieParser = require("cookie-parser"); 
const app = express();
 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.hefn8jo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174", 
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions)); 
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('welcome to our server')
})



app.post("/jwt", async (req, res) => {
    const user = req.body; 
    const token = jwt.sign(user, process.env.DB_SECRET, {
      expiresIn: "1h",
    });

console.log(user)
    res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: "true" });
})

app.get("/logout", async (req, res) => {
    try {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
      console.log("Logout successful");
    } catch (err) {
      res.status(500).send(err);
    }
  }); 
 







  

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {


    const userCollection = client.db("petAdoption").collection("usersCollection");
    const petAdoptCollection = client.db("petAdoption").collection("petAdoptCollection");
    const adoptRequestCollection = client.db("petAdoption").collection("adoptRequestCollection");







    app.put("/user", async (req, res) => {
        const userData = req.body;
        console.log(userData)
        const query = { email: userData?.email };
    
        // if user already exists
        const isExist = await userCollection.findOne(query);
        if (isExist) {
          if (userData.status === "Request") {
            const result = await userCollection.updateOne(query, {
              $set: { status: userData.status },
            });
            return res.send(result);
          } else {
            return res.send(isExist);
          }
        }
    
        const option = { upsert: true };
        const updateDoc = {
          $set: {
            ...userData,
            Timestamp: Date.now(),
          },
        };
        const result = await userCollection.updateOne(query, updateDoc, option);
        res.send(result);
      });
    

      // ..................................................
      // pet adopt section start
      // ..................................................


app.get("/adopt" , async(req, res)=>{
  
  const result = await petAdoptCollection.find().toArray()
  res.send(result)
})
app.get("/adopts/:id" , async(req, res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)}
  const result = await petAdoptCollection.findOne(filter)
  res.send(result)
})
app.post("/adopt-post" , async(req, res)=>{
  const petInfo = req.body;
  const result = await petAdoptCollection.insertOne(petInfo)
  res.send(result)
})
// request fod adopt
app.post("/adopt-request" , async(req, res)=>{
  const adoptersInfo = req.body;
  const result = await adoptRequestCollection.insertOne(adoptersInfo)
  res.send(result)
})


















    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
















app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})