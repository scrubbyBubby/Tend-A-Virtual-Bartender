const express = require("express");
const router = express.Router();
const passport = require("passport");
const { body, validationResult } = require("express-validator");

router.post("/register_login",
    body("email").isEmail().withMessage("Email must be valid"),
    body("password").isLength({ min: 8, max: 20 }).withMessage("Password must be 8 to 20 characters long"),
    body("password").custom((password) => {
        const containsSymbol = new RegExp("(?=.*[!@#$%^&*])").test(password);
        if (!containsSymbol) {
            throw new Error("");
        }

        return true;
    }).withMessage("Password must contain at least 1 symbol"),
    body("password").custom((password) => {
        const containsNumber = new RegExp("(?=.*[0-9])").test(password);
        if (!containsNumber) {
            throw new Error("");
        }

        return true;
    }).withMessage("Password must contain at least 1 number"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        passport.authenticate("local", function(err, user, info) {
            if (err) {
                return res.status(400).json({ errors: err });
            }
            if (!user) {
                return res.status(200).json({ message: info.message });
            }
            req.logIn(user, function(err) {
                if (err) {
                    return res.status(400).json({ errors: err });
                }
                return res.status(200).json({ user: req.user, newUser: info.newUser });
            });
        })(req, res, next);
    }
);

router.post("/logout", (req, res, next) => {
    if (req.session) {
        req.logout();
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            } else {
                res.clearCookie('session-id');
                res.json({
                    message: "You logged out!"
                });
            }
        });
    } else {
        const err = new Error('Not logged in!');
        err.status = 403;
        next(err);
    }
});

module.exports = router;