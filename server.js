const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());               // Allow requests from frontend (e.g., HTML page)
app.use(express.json());       // Parse incoming JSON requests

// MongoDB connection
const uri = "mongodb://localhost:27017"; // MongoDB URL (can be local or Atlas)
const client = new MongoClient(uri);
let usersCollection;

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        const db = client.db("bankDB");                  // Database name (create if not exists)
        usersCollection = db.collection("users");        // Collection name (create if not exists)
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection failed:", err);
    }
}

connectDB();

// POST route for login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists in the database
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.json({ success: false, message: "Invalid credentials!" });
        }

        // Compare hashed passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            res.json({ success: true, message: "Login successful!" });
        } else {
            res.json({ success: false, message: "Invalid credentials!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// POST route to create new user (signup)
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if username already exists
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username already exists" });
        }

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into MongoDB collection
        const result = await usersCollection.insertOne({ username, password: hashedPassword });
        res.status(201).json({ success: true, message: "User created successfully", userId: result.insertedId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
