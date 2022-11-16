const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");

const cloudinary = require("cloudinary").v2;

// Import du modèle Offer
const Offer = require("../models/Offer");

// Import du middleWare isAuthenticated
const isAutenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = require("../utils/converterB64");

router.post(
  "/offer/publish",
  isAutenticated,
  fileUpload(),
  async (req, res) => {
    try {
      if (req.files) {
        console.log("route /offer/publish");
        // console.log(req.user);

        // const { title, description, price } = req.body;
        // console.log(result);

        const {
          title,
          description,
          condition,
          price,
          city,
          brand,
          size,
          color,
        } = req.body;

        const newOffer = new Offer({
          product_name: title,
          product_description: description,
          product_price: price,
          product_details: [
            {
              MARQUE: brand,
            },
            {
              TAILLE: size,
            },
            {
              ETAT: condition,
            },
            {
              COULEUR: color,
            },
            {
              EMPLACEMENT: city,
            },
          ],
          owner: req.user,
        });
        // console.log(req.files);
        console.log(newOffer);

        const pictureUpload = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture),
          { folder: `/vinted/offers/${newOffer._id}` }
        );

        newOffer.product_image = pictureUpload;

        await newOffer.save();

        return res.status(201).json({
          _id: newOffer._id,
          product_name: newOffer.product_name,
          product_description: newOffer.product_description,
          product_price: newOffer.product_price,
          product_details: newOffer.product_details,
          owner: { account: req.user.account.username },
          product_image: { secure_url: newOffer.product_image.secure_url },
        });
      } else {
        res.status(400).json({ message: "A picture is required" });
      }
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    console.log("Route /offer");

    const filters = {};

    // pages
    const limit = 20;
    let page = 1;

    if (req.query.page && req.query.page !== "0") {
      page = req.query.page;
    }

    // const skip = page * limit - limit;
    const skip = (page - 1) * limit;
    // console.log(skip);

    // filtre titre
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filters.product_price = { $gte: req.query.priceMin };
    }

    if (req.query.priceMax) {
      if (req.query.priceMin) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = {};
        filters.product_price.$lte = req.query.priceMax;
      }
    }

    // filtre sort
    const sort = {};

    if (req.query.sort === "price-desc") {
      sort.product_price = "desc";
    } else if (req.query.sort === "price-asc") {
      sort.product_price = "asc";
    }

    // console.log(filter);
    // console.log(sort);

    const offers = await Offer.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({ path: "owner", select: "account" });
    // .select(
    //   "product_details product_image.secure_url _id product_name production_description product_price owner"
    // );

    // console.log(listOffers);
    // console.log(listOffers.length);

    const count = await Offer.find(filters).countDocuments();
    return res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    console.log("Route /offer:id");
    // console.log(req.params.id);

    // if (req.params.id) {
    const offerFound = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    // .select(
    //   "product_details product_image.secure_url _id product_name production_description product_price owner"
    // );

    if (offerFound) {
      res.status(200).json(offerFound);
    } else {
      res.status(400).json({ message: "Offer not found" });
    }
    // } else {
    //   res.status(400).json({ message: "Invalid param" });
    // }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
