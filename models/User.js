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
    enum: ["superadmin", "admin", "revendedor"],
    default: "revendedor"
},

logo: {
    type: String,
    default: ""
},

nombreComercial: {
    type: String,
    default: ""
},

ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
}

});

module.exports = mongoose.model("User", UserSchema);