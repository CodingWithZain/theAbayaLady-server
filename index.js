const express = require("express");
const app = express();
const cors = require("cors");
const { default: mongoose } = require("mongoose");
const PORT = process.env.PORT || 8080;
const ObjectId = require("mongodb").ObjectId;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

//middlewares
app.use(express.json());
app.use(cors());

//mongodb connection
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@theabayalady-cluster.bjoooge.mongodb.net/theabayalady-client?retryWrites=true&w=majority`
  )
  .then(console.log(`Connected to mongodb successfully`))
  .catch((error) => console.log(`Error connecting to mongodb`, error));

//jwt authentication
app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1hr",
  });
  res.send({ token });
});

//jwt verify token
//middleware
const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res
      .status(401)
      .send({ message: "Unauthorized Access! Please Try Again" });
  }
  const token = req.headers.authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Token is invalid" });
    }
    req.decoded = decoded;
    next();
  });
};

//import routes here
const menuRoutes = require("./api/routes/menuRoutes");
const cartRoutes = require("./api/routes/cartRoutes");
const userRoutes = require("./api/routes/userRoutes");
const paymentRoutes = require("./api/routes/paymentRoutes");
app.use("/menu", menuRoutes);
app.use("/carts", cartRoutes);
app.use("/users", userRoutes);
app.use("/payments", paymentRoutes);
//stripe payment route
app.post("/create-payment-intent", async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price * 100);

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",

    payment_method_types: ["card"],
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

app.get("/", (req, res) => {
  res.send("Hello The Abaya Lady Server");
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
