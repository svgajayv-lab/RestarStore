const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

    nombre: String,

    usuario: {
        type: String,
        unique: true
    },

    password: String,

    whatsapp: String,

    estado: {
        type: String,
        default: "Activo"
    },

    inicio: Date,

    vencimiento: Date,

    rol: {
        type: String,
        default: "revendedor"
    }

});

module.exports = mongoose.model("User", UserSchema);