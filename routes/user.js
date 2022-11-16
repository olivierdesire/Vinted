const express = require("express");
const router = express.Router();

const SHA256 = require("crypto-js/sha256");
const base64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

// Import modèles
const User = require("../models/User");

// Routes user
router.post("/user/signup", async (req, res) => {
  console.log("Route /user/signup");
  try {
    if (req.body.username) {
      //   console.log(req.body.username);
      const userFound = await User.findOne({ email: req.body.email });
      //   console.log(userFound);
      if (!userFound) {
        const generatedSalt = uid2(16);
        const generatedHash = SHA256(
          req.body.password + generatedSalt
        ).toString(base64);
        const generatedToken = uid2(16);

        const newUser = new User({
          email: req.body.email,
          account: {
            username: req.body.username,
          },
          newsletter: req.body.newsletter,
          token: generatedToken,
          hash: generatedHash,
          salt: generatedSalt,
        });

        await newUser.save();

        return res.status(201).json({
          _id: newUser._id,
          token: newUser.token,
          account: { username: newUser.account.username },
        });
      } else {
        return res.status(409).json({ message: "Email already exists" });
      }
    } else {
      return res.status(400).json({ error: { message: "Username missing" } });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  console.log("Route /user/login");
  //
  // const {email, password} = req.body
  try {
    if (req.body.email && req.body.password) {
      const userFound = await User.findOne({ email: req.body.email });
      if (userFound) {
        const generatedHash = SHA256(
          req.body.password + userFound.salt
        ).toString(base64);

        if (generatedHash === userFound.hash) {
          return res.status(200).json({
            _id: userFound._id,
            token: userFound.token,
            account: { username: userFound.account.username },
          });
        } else {
          return res
            .status(401)
            .json({ error: { message: "Incorrect email or password" } });
        }
      } else {
        return res
          .status(401)
          .json({ error: { message: "Incorrect email or password" } });
      }
    } else {
      return res
        .status(400)
        .json({ error: { message: "email or password is required" } });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
