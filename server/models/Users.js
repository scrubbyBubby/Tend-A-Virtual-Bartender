const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

const ThirdPartyProviderSchema = new mongoose.Schema({
    provider_name: {
        type: String,
        default: null
    },
    provider_id: {
        type: String,
        default: null
    },
    provider_data: {
        type: {},
        default: null
    }
})

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        email_is_verified: {
            type: Boolean,
            default: false
        },
        password: {
            type: String
        },
        scores: {
            type: Array,
            default: []
        },
        drinkLists: {
            type: Array,
            default: []
        },
        liquorShelf: {
            type: Array,
            default: []
        },
        third_party_auth: [ThirdPartyProviderSchema],
        date: {
            type: Date,
            default: Date.now
        }
    },
    { strict: false }
);

UserSchema.plugin(passportLocalMongoose);

module.exports = User = mongoose.model("users", UserSchema);