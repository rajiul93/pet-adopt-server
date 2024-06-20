const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");
const app = express();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.hefn8jo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://pet-adoption-go.netlify.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("welcome to our server");
});

app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.DB_SECRET, {
    expiresIn: "1h",
  });

  // console.log(user)
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: "true" });
});

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
  },
});

async function run() {
  try {
    const userCollection = client
      .db("petAdoption")
      .collection("usersCollection");
    const petAdoptCollection = client
      .db("petAdoption")
      .collection("petAdoptCollection");
    const adoptRequestCollection = client
      .db("petAdoption")
      .collection("adoptRequestCollection");
    const campaignCollection = client
      .db("petAdoption")
      .collection("campaignCollection");

    app.put("/user", async (req, res) => {
      const userData = req.body;
      // console.log(userData)
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

    app.get("/adopt", async (req, res) => {
      const result = await petAdoptCollection.find().toArray();
      res.send(result);
    });
    app.get("/adopts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await petAdoptCollection.findOne(filter);
      res.send(result);
    });
    // amar post kora pet
    app.get("/my-adopt-pet/:email", async (req, res) => {
      const email = req.params;
      const query = { email: email.email };
      const result = await petAdoptCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/adopt-post", async (req, res) => {
      const petInfo = req.body;
      const result = await petAdoptCollection.insertOne(petInfo);
      res.send(result);
    });
    // request fod adopt
    app.post("/adopt-request", async (req, res) => {
      const adoptersInfo = req.body;
      const petID = adoptersInfo.petID;
      const filter = { _id: new ObjectId(petID) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "Request",
        },
      };
      const status = await petAdoptCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      const result = await adoptRequestCollection.insertOne(adoptersInfo);
      res.send(result);
    });

    // delete out pet
    app.delete("/adopt/:id", async (req, res) => {
      const id = req.params.id;
      const query  = { _id: new ObjectId(id) };
      const result = await petAdoptCollection.deleteOne(query );
      res.send(result);
    });

    app.get("/adopt-request/:email", async (req, res) => {
      const email = req.params;
      const query = { adoptersEmail: email.email };
      const result = await adoptRequestCollection.find(query).toArray();
      res.send(result);
    });

    // adopt request status control
    app.patch("/handle-request-status", async (req, res) => {
      const status = req.query.status;
      const id = req.query.id;
      const filter = { petID: id };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          requestStatus: status,
        },
      };
      const result = await adoptRequestCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // pet document update
    app.patch("/adopt-update/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          ...data,
        },
      };

      const options = { upsert: true };
      const result = await petAdoptCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/adopt-request/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const result = await adoptRequestCollection.deleteOne(filter);
      res.send(result);
    });

    // .............................................................
    // campaign area start
    // .............................................................
    app.get("/donation-for-post", async (req, res) => {
      const result = await campaignCollection.find().toArray();
      res.send(result);
    });
    app.get("/donation-for-post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await campaignCollection.findOne(query);
      res.send(result);
    });

    // get our campaign
    app.get("/my-campaign/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { userEmail: email };
      const result = await campaignCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/donation-for-post", async (req, res) => {
      const petInfo = req.body;
      const result = await campaignCollection.insertOne(petInfo);
      res.send(result);
    });

    // .............................................................
    // Admin all api
    // .............................................................
    app.get("/all-user", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.patch("/user-update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await userCollection.findOne(query);

      if (user) {
        if (user.role === "user") {
          const result = await userCollection.updateOne(query, {
            $set: { role: "Admin" },
          });
          return res.send(result);
        } else {
          return res.send({ status: "isExist" });
        }
      }
      res.send({ status: "success" });
    });
    app.delete("/user-update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await userCollection.findOne(query);

      if (user) {
        if (user.role === "Admin") {
          const result = await userCollection.updateOne(query, {
            $set: { role: "user" },
          });
          return res.send(result);
        } else {
          return res.send({ status: "isExist" });
        }
      }
      res.send({ status: "success" });
    });

    // get all pet

    app.get("/all-pets", async (req, res) => {
      const result = await petAdoptCollection.find().toArray();
      res.send(result);
    });

    // ifinity ascrool

    app.get("/pets-limit", async (req, res) => {
      const getCategory = req.query.category;

      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      console.log("getCategory", getCategory);

      if (getCategory) {
        const filter = { category: getCategory };
        const result = await petAdoptCollection
          .find(filter)
          .skip(page * limit)
          .limit(limit)
          .toArray();
        res.send(result);
        return;
      }
      const result = await petAdoptCollection
        .find()
        .skip(page * limit)
        .limit(limit)
        .toArray();

      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
// if (!getCategory) {
//   } else{
//   const filter = {category:getCategory}
//   const result = await petAdoptCollection
//   .find(filter)
//   .skip(page * limit)
//   .limit(limit)
//   .toArray();
// res.send(result);

//  }
