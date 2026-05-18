const mongoose = require("mongoose");

const AccountSchema =
new mongoose.Schema({

    plataforma: {
        type: String
    },

    plan: {
        type: String
    },

    correo: {
        type: String
    },

    password: {
        type: String
    },

    cliente: {
        type: String,
        default: "Libre"
    },

    estado: {
        type: String,
        default: "Libre"
    },

    vencimiento: {
        type: Date
    },

    fecha: {
        type: Date,
        default: Date.now
    }

});

module.exports =
mongoose.model(
    "Account",
    AccountSchema
);