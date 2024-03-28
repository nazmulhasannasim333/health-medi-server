const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
};

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.options("", cors(corsConfig));

app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment");
    const userCollection = db.collection("users");
    const suppliesCollection = db.collection("supplies");
    const donorsCollection = db.collection("donors");
    const communityCollection = db.collection("communities");
    const volunteersCollection = db.collection("volunteers");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await userCollection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await userCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, name: user.name },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // get all supplies
    app.get("/api/v1/supplies", async (req, res) => {
      const result = await suppliesCollection.find().toArray();

      res.status(201).json({
        success: true,
        message: "Supplies retrieve successfully!",
        data: result,
      });
    });

    // create supplies
    app.post("/api/v1/supply", async (req, res) => {
      const data = req.body;
      const result = await suppliesCollection.insertOne(data);

      res.status(201).json({
        success: true,
        message: "Supplies created successfully!",
        data: result,
      });
    });

    // get supply details
    app.get("/api/v1/supply/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await suppliesCollection.findOne(query);

      res.status(201).json({
        success: true,
        message: "Supply is retrieve successfully!",
        data: result,
      });
    });

    // get supply details
    app.put("/api/v1/supply/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedData = {
        $set: {
          img: data.img,
          title: data.title,
          category: data.category,
          price: data.price,
          description: data.description,
        },
      };
      const result = await suppliesCollection.updateOne(query, updatedData);

      res.status(201).json({
        success: true,
        message: "Supply is updated successfully!",
        data: result,
      });
    });

    app.delete("/api/v1/supply/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await suppliesCollection.deleteOne(query);

      res.status(201).json({
        success: true,
        message: "Supply is deleted successfully!",
        data: result,
      });
    });

    // create donors
    app.post("/api/v1/donor", async (req, res) => {
      const data = req.body;
      const result = await donorsCollection.insertOne(data);

      res.status(201).json({
        success: true,
        message: "Donor created successfully!",
        data: result,
      });
    });

    // get all donors
    app.get("/api/v1/donors", async (req, res) => {
      const result = await donorsCollection.find().toArray();

      res.status(201).json({
        success: true,
        message: "Donor retrieve successfully!",
        data: result,
      });
    });

    // create community post
    app.post("/api/v1/community", async (req, res) => {
      const data = req.body;
      const result = await communityCollection.insertOne(data);

      res.status(201).json({
        success: true,
        message: "Community post created successfully!",
        data: result,
      });
    });

    // get community post
    app.get("/api/v1/community", async (req, res) => {
      const result = await communityCollection.find().toArray();

      res.status(201).json({
        success: true,
        message: "Community post retrieve successfully!",
        data: result,
      });
    });

    // create volunteer
    app.post("/api/v1/volunteer", async (req, res) => {
      const data = req.body;
      const result = await volunteersCollection.insertOne(data);

      res.status(201).json({
        success: true,
        message: "Volunteer post created successfully!",
        data: result,
      });
    });

    // get community post
    app.get("/api/v1/volunteer", async (req, res) => {
      const result = await volunteersCollection.find().toArray();

      res.status(201).json({
        success: true,
        message: "Volunteer retrieve successfully!",
        data: result,
      });
    });

    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
