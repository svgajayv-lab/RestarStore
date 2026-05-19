const mongoose = require("mongoose");

const AccountSchema =
new mongoose.Schema({

    plataforma: String,

    plan: String,

    correo: String,

    password: String,

    cliente: String,

    estado: String,

    inicio: Date,

    vencimiento: Date

});

module.exports =
mongoose.model(
    "Account",
    AccountSchema
);