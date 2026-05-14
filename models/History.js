const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({

    correo: String,

    plataforma: String,

    otp: String,

    ip: String,

    dispositivo: String,

    fecha: {

        type: Date,

        default: Date.now

    }

});

module.exports =
mongoose.model(
    "History",
    HistorySchema
);