require("dotenv").config();

const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);

mongoose.connect(process.env.MONGO_URI)

.then(() => {

    console.log("🔥 MongoDB conectado");

})

.catch((err) => {

    console.log(err);

});

const express = require("express");
const session = require("express-session");
const path = require("path");
const { google } = require("googleapis");

const History = require("./models/History");

const app = express();

/* ========================= */
/* SESSION */
/* ========================= */

app.use(session({

    secret: process.env.SESSION_SECRET || "restarstore",

    resave: false,

    saveUninitialized: true,

    cookie: {

        maxAge: 1000 * 60 * 60 * 24

    }

}));

/* ========================= */
/* STATIC */
/* ========================= */

app.use(express.static(__dirname));

app.use(express.urlencoded({ extended:true }));

/* ========================= */
/* GOOGLE */
/* ========================= */

const credentials = require("./credentials.json");

const { client_secret, client_id } =
credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(

    client_id,

    client_secret,

    "https://restarstore.onrender.com/oauth2callback"

);

const SCOPES = [

    "https://www.googleapis.com/auth/gmail.readonly"

];

/* ========================= */
/* TOKEN */
/* ========================= */

if(process.env.GMAIL_TOKEN){

    const token =
    JSON.parse(process.env.GMAIL_TOKEN);

    oAuth2Client.setCredentials(token);

    console.log("🔥 TOKEN Gmail cargado");

}

/* ========================= */
/* HOME */
/* ========================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});

/* ========================= */
/* AUTH */
/* ========================= */

app.get("/auth", (req, res) => {

    const authUrl =
    oAuth2Client.generateAuthUrl({

        access_type: "offline",

        prompt: "consent",

        scope: SCOPES,

    });

    res.redirect(authUrl);

});

/* ========================= */
/* CALLBACK */
/* ========================= */

app.get("/oauth2callback", async (req, res) => {

    try {

        const code = req.query.code;

        const { tokens } =
        await oAuth2Client.getToken(code);

        oAuth2Client.setCredentials(tokens);

        console.log(
            "TOKEN:",
            JSON.stringify(tokens)
        );

        console.log("🔥 TOKEN GUARDADO");

        res.send("✅ Gmail conectado correctamente");

    } catch (error) {

        console.log(error);

        res.send("❌ Error conectando Gmail");

    }

});

/* ========================= */
/* OTP */
/* ========================= */

app.get("/otp", async (req, res) => {

    try {

        const plataforma =
        req.query.plataforma;

        let remitente = "";

        switch(plataforma){

           case "amazon":

    remitente =
    "account-update@amazon.com";

break;

            case "netflix":
                remitente = "netflix";
            break;

            case "disney":
                remitente = "disney";
            break;

            case "spotify":
                remitente = "spotify";
            break;

            case "max":
                remitente = "max";
            break;

            case "crunchyroll":
                remitente = "crunchyroll";
            break;

            default:
                remitente = "";
        }

        const gmail = google.gmail({

            version: "v1",

            auth: oAuth2Client,

        });

        const response =
        await gmail.users.messages.list({

            userId: "me",

            maxResults: 5,

            q: `newer_than:15m`

        });

        const messages =
        response.data.messages;

        if(!messages || messages.length === 0){

            return res.json({

                otp: "No encontrado"

            });

        }

        
let message = null;

for (const msg of messages) {

    const tempMessage =
    await gmail.users.messages.get({

        userId: "me",

        id: msg.id,

    });

    const internalDate =
    parseInt(tempMessage.data.internalDate);

    const ahora = Date.now();

    const diferencia =
    (ahora - internalDate) / 1000;

    // SOLO últimos 10 minutos

    if (diferencia <= 600) {

        message = tempMessage;
        break;

    }

}

if (!message) {

    return res.json({

        otp: "No encontrado"

    });

}

        const payload =
        message.data.payload;

        let body = "";

        function extraerTexto(parts){

            for(const part of parts){

                if(

                    (
                        part.mimeType === "text/plain"
                        ||
                        part.mimeType === "text/html"
                    )

                    &&

                    part.body.data

                ){

                    body += Buffer.from(

                        part.body.data,

                        "base64"

                    ).toString("utf8");

                }

                if(part.parts){

                    extraerTexto(part.parts);

                }

            }

        }

        if(payload.parts){

            extraerTexto(payload.parts);

        }

        else if(

            payload.body &&
            payload.body.data

        ){

            body = Buffer.from(

                payload.body.data,

                "base64"

            ).toString("utf8");

        }

        const textoPlano = body
console.log("📩 TEXTO:", textoPlano);
        .replace(/<[^>]*>/g, " ")

        .replace(/&nbsp;/g, " ")

        .replace(/&#39;/g, "'")

        .replace(/\s+/g, " ");

        let otp = "No encontrado";

        const patrones = [

            /verification code is[:\s]+(\d{6,8})/i,

            /your verification code is[:\s]+(\d{6,8})/i,

            /use this code[:\s]+(\d{6,8})/i,

            /one time password[:\s]+(\d{6,8})/i,

            /otp[:\s]+(\d{6,8})/i,

            /enter the following code[:\s]+(\d{6,8})/i,

            /código de verificación[:\s]+(\d{6,8})/i

        ];

        for(const patron of patrones){

            const match =
            textoPlano.match(patron);

            if(match && match[1]){

    otp = match[1];

    console.log("🔥 OTP ENCONTRADO:", otp);

    break;

}

        }

        console.log("OTP:", otp);

        await History.create({

            correo:
            req.query.correo || "No definido",

            plataforma,

            otp,

            ip: req.ip,

            dispositivo:
            req.headers["user-agent"],

            fecha: new Date()

        });

        res.json({

            otp

        });

    } catch (error) {

        console.log(error);

        res.json({

            otp: "Error"

        });

    }

});

/* ========================= */
/* ADMIN */
/* ========================= */

app.get("/admin", async (req, res) => {

    if(req.session.admin){

        const historial =
        await History.find()
        .sort({ fecha:-1 })
        .limit(50);

        let filas = "";

        historial.forEach(item => {

            filas += `

            <tr>

                <td>${item.correo}</td>

                <td>${item.plataforma}</td>

                <td>${item.otp}</td>

            </tr>

            `;

        });

        return res.send(`

<html>

<head>

<title>RestarStore Admin</title>

<style>

body{

    background:#050816;

    color:white;

    font-family:Arial;

    padding:40px;

}

table{

    width:100%;

    border-collapse:collapse;

    margin-top:20px;

}

th,td{

    padding:15px;

    border-bottom:1px solid #333;

}

th{

    color:cyan;

}

</style>

</head>

<body>

<h1>
🔥 RestarStore Admin
</h1>

<table>

<tr>

<th>Correo</th>
<th>Plataforma</th>
<th>OTP</th>

</tr>

${filas}

</table>

</body>

</html>

`);

    }

    res.send(`

<html>

<head>

<title>Admin Login</title>

<style>

body{

    background:#050816;

    display:flex;

    justify-content:center;

    align-items:center;

    height:100vh;

    font-family:Arial;

}

.login{

    width:350px;

    background:#111;

    padding:40px;

    border-radius:20px;

}

input{

    width:100%;

    padding:15px;

    margin-bottom:20px;

}

button{

    width:100%;

    padding:15px;

    background:cyan;

    border:none;

    font-weight:bold;

}

</style>

</head>

<body>

<form
class="login"
method="POST"
action="/login"
>

<h1 style="color:cyan;">
🔐 Admin
</h1>

<input
type="text"
name="usuario"
placeholder="Usuario"
required
>

<input
type="password"
name="password"
placeholder="Contraseña"
required
>

<button>
Ingresar
</button>

</form>

</body>

</html>

`);

});

/* ========================= */
/* LOGIN */
/* ========================= */

app.post("/login", (req, res) => {

    const { usuario, password } =
    req.body;

    if(

        usuario === process.env.ADMIN_USER

        &&

        password === process.env.ADMIN_PASS

    ){

        req.session.admin = true;

        return res.redirect("/admin");

    }

    res.send("❌ Datos incorrectos");

});

/* ========================= */
/* LOGOUT */
/* ========================= */

app.get("/logout", (req, res) => {

    req.session.destroy();

    res.redirect("/admin");

});

/* ========================= */
/* SERVER */
/* ========================= */

app.listen(3000, () => {

    console.log(
        "🔥 Servidor activo en puerto 3000"
    );

});