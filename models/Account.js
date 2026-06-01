const AccountSchema =
new mongoose.Schema({

    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    plataforma: String,

    plan: String,

    correo: String,

    password: String,

    cliente: String,

    whatsapp: String,

    cuentaCompleta: String,
    
perfil: String,
pin: String,
perfiles: String,

    estado: String,

    inicio: Date,

    vencimiento: Date

});

module.exports =
mongoose.model(
    "Account",
    AccountSchema
);