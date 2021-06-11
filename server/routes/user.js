const express = require("express");
const router = express.Router();
const passport = require("passport");
const mongoose = require("mongoose");
const User = require("../models/Users");

const updateSchema = new mongoose.Schema({
    drinkLists: Array,
    liquorShelf: Array,
    scores: Array
});

router.post("/user",
    (req, res, next) => {
        if (req.user) {
            User.findById(req.user.id)
                .then(user => {
                    const { scores, drinkLists, liquorShelf } = req.body;
                    if (scores) user.scores = scores;
                    if (drinkLists) user.drinkLists = drinkLists;
                    if (liquorShelf) user.liquorShelf = liquorShelf;
                    user.save()
                        .then(_ => {
                            console.log(`Saved to database! liquorShelf="${Array.isArray(liquorShelf)}" drinkLists="${Array.isArray(drinkLists)}" scores="${Array.isArray(scores)}"`);
                            res.send('Saved to database!');
                        })
                        .catch(_ => {
                            console.log(`Could not save to database. liquorShelf="${Array.isArray(liquorShelf)}" drinkLists="${Array.isArray(drinkLists)}" scores="${Array.isArray(scores)}"`);
                            res.status(400).send("Could not save to database.");
                        })
                });
        }
    }
);

module.exports = router;