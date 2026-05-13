require("dotenv").config();
const USERS_FILE = "users.json";
const HISTORY_FILE = "history.json";
const session = require("express-session");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const app = express();
app.use(session({

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: true,

    cookie: {

        maxAge: 1000 * 60 * 60 * 24

    }

}));

app.use(express.static(__dirname));

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

if (fs.existsSync("token.json")) {

    const token = JSON.parse(
        fs.readFileSync("token.json")
    );

    oAuth2Client.setCredentials(token);

}

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});

app.get("/auth", (req, res) => {

    const authUrl =
    oAuth2Client.generateAuthUrl({

        access_type: "offline",
        scope: SCOPES,

    });

    res.redirect(authUrl);

});

app.get("/oauth2callback", async (req, res) => {

    try {

        const code = req.query.code;

        const { tokens } =
        await oAuth2Client.getToken(code);

        oAuth2Client.setCredentials(tokens);

        fs.writeFileSync(
            "token.json",
            JSON.stringify(tokens)
        );

        console.log("🔥 TOKEN GUARDADO");

        res.send(
            "✅ Gmail conectado correctamente"
        );

    } catch (error) {

        console.log(error);

        res.send("❌ Error conectando Gmail");

    }

});

app.get("/otp", async (req, res) => {

    try {

        const plataforma =
        req.query.plataforma;

       let remitente = "";

switch(plataforma){

    case "amazon":
        remitente = "amazon.com";
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

            maxResults: 10,

            q: `from:${remitente} newer_than:2m`

        });

        const messages =
        response.data.messages;

        if (!messages || messages.length === 0) {

            return res.json({
                otp: "No encontrado",
            });

        }

        const ultimoMensaje = messages[0];

        const message =
        await gmail.users.messages.get({

            userId: "me",
            id: ultimoMensaje.id,

        });

        const payload =
        message.data.payload;

        let body = "";

        function extraerTexto(parts) {

            for (const part of parts) {

                if (
    (
        part.mimeType === "text/plain"
        ||
        part.mimeType === "text/html"
    )
    &&
    part.body.data
) {

                    body += Buffer.from(
                        part.body.data,
                        "base64"
                    ).toString("utf8");

                }

                if (part.parts) {
                    extraerTexto(part.parts);
                }

            }

        }

        if (payload.parts) {

            extraerTexto(payload.parts);

        } else if (
            payload.body &&
            payload.body.data
        ) {

            body = Buffer.from(
                payload.body.data,
                "base64"
            ).toString("utf8");

        }

        console.log(body);

let otp = "No encontrado";

const textoPlano = body
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ");

console.log(textoPlano);

const partes = textoPlano.split(
    "verification code is:"
);

const match = texto.match(/\b\d{6}\b/);

if(match){

    otp = match[0];

}

console.log("OTP:", otp);

/* ========================= */
/* GUARDAR HISTORIAL */
/* ========================= */

let historial = [];

if(fs.existsSync(HISTORY_FILE)){

    historial = JSON.parse(
        fs.readFileSync(HISTORY_FILE)
    );

}

historial.unshift({

    correo:
    req.query.correo || "No definido",

    plataforma,

    otp,

    fecha:
    new Date().toLocaleString()

});

fs.writeFileSync(

    HISTORY_FILE,

    JSON.stringify(
        historial,
        null,
        2
    )

);

res.json({
    otp,
});

} catch (error) {

    console.log(error);

    res.json({
        otp: "Error",
    });

}

});
/* ========================= */
/* LOGIN ADMIN */
/* ========================= */

app.get("/admin", (req, res) => {

    if(req.session.admin){
/* ========================= */
/* LEER HISTORIAL */
/* ========================= */

let historial = [];

if(fs.existsSync(HISTORY_FILE)){

    historial = JSON.parse(
        fs.readFileSync(HISTORY_FILE)
    );

}

let filas = "";
/* ========================= */
/* CONTADOR DE PLATAFORMAS */
/* ========================= */

let netflix = 0;
let amazon = 0;
let disney = 0;
let spotify = 0;
let max = 0;
let crunchyroll = 0;

historial.forEach(item => {

    if(item.plataforma === "netflix"){
        netflix++;
    }

    if(item.plataforma === "amazon"){
        amazon++;
    }

    if(item.plataforma === "disney"){
        disney++;
    }

    if(item.plataforma === "spotify"){
        spotify++;
    }

    if(item.plataforma === "max"){
        max++;
    }

    if(item.plataforma === "crunchyroll"){
        crunchyroll++;
    }

});
historial.forEach(item => {

    filas += `

    <tr>

        <td>
            ${item.correo}
        </td>

        <td>
            ${item.plataforma}
        </td>

        <td>
            ${item.otp}
        </td>

    </tr>

    `;

});
        return res.send(`

   
<html>

<head>

<title>Panel Admin</title>

<style>

body{

    margin:0;
    padding:0;

    background:#050816;

    font-family:Arial;

    color:white;

}

/* HEADER */

.header{

    width:100%;
    padding:25px;

    background:rgba(0,0,0,0.5);

    border-bottom:2px solid cyan;

    display:flex;
    justify-content:space-between;
    align-items:center;

    box-sizing:border-box;

}

.logo{

    font-size:35px;
    font-weight:bold;
    color:cyan;

}

.logout{

    background:red;

    color:white;

    border:none;

    padding:12px 20px;

    border-radius:10px;

    cursor:pointer;

    font-weight:bold;

}

/* DASHBOARD */

.dashboard{

    padding:40px;

}

/* CARDS */

.cards{

    display:grid;

    grid-template-columns:
    repeat(auto-fit,minmax(250px,1fr));

    gap:25px;

    margin-top:30px;

}

.card{

    background:rgba(0,0,0,0.55);

    border:2px solid rgba(0,255,255,0.3);

    border-radius:25px;

    padding:30px;

    box-shadow:0 0 20px rgba(0,255,255,0.15);

}

.card h2{

    color:cyan;
    margin-bottom:15px;

}

.big{

    font-size:45px;
    font-weight:bold;

}

/* TABLE */

.table{

    margin-top:40px;

    background:rgba(0,0,0,0.55);

    border-radius:25px;

    padding:25px;

    border:2px solid rgba(0,255,255,0.2);

}

table{

    width:100%;

    border-collapse:collapse;

    margin-top:20px;

}

th,td{

    padding:15px;

    text-align:left;

    border-bottom:1px solid rgba(255,255,255,0.1);

}

th{

    color:cyan;

}
/* TERMINAL */

.terminal{

    background:black;

    padding:20px;

    border-radius:20px;

    border:2px solid cyan;

    font-family:monospace;

    color:#00ff99;

    box-shadow:
    0 0 20px rgba(0,255,255,0.3);

}

.terminal div{

    margin-bottom:10px;

}
</style>

</head>

<body>

<div class="header">

    <div class="logo">
        🔥 RestarStore Admin
    </div>

    <form action="/logout" method="GET">

        <button class="logout">
            Cerrar sesión
        </button>

    </form>

</div>

<div class="dashboard">

    <h1>
        Bienvenido Administrador 😎
    </h1>

    <div class="cards">

        <div class="card">

            <h2>OTPs Hoy</h2>

            <div class="big">
                53
            </div>

        </div>

        <div class="card">

            <h2>Usuarios</h2>

            <div class="big">
                18
            </div>

        </div>

        <div class="card">

            <h2>Plataformas</h2>

            <div class="big">
                6
            </div>

        </div>

        <div class="card">

            <h2>Servidor</h2>

            <div class="big">
                ONLINE
            </div>

        </div>

    </div>

    <div class="table">

        <h2>
            Últimos OTP
        </h2>

        <table>

            <tr>

                <th>Correo</th>
                <th>Plataforma</th>
                <th>OTP</th>

            </tr>

            ${filas}

        </table>

    </div>

</div>
<div class="table">

    <h2>
        📊 OTP por Plataforma
    </h2>

    <canvas id="grafica"></canvas>
<div class="table">

    <h2>
        💻 Logs del Sistema
    </h2>

    <div class="terminal">

        <div>
            [ONLINE] Sistema iniciado
        </div>

        <div>
            [GMAIL] API conectada
        </div>

        <div>
            [OTP] Esperando actividad...
        </div>

    </div>

</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>

const ctx =
document.getElementById('grafica');

new Chart(ctx, {

    type: 'bar',

    data: {

        labels: [

            'Netflix',
            'Prime',
            'Disney',
            'Spotify',
            'Max',
            'Crunchyroll'

        ],

        datasets: [{

            label: 'OTPs',

            data: [

    ${netflix},
    ${amazon},
    ${disney},
    ${spotify},
    ${max},
    ${crunchyroll}

],

            backgroundColor: [

                '#ff0000',
                '#00c3ff',
                '#ffffff',
                '#1db954',
                '#7b2cff',
                '#ff8800'

            ],

            borderWidth: 2

        }]

    },

    options: {

        responsive: true,

        plugins: {

            legend: {

                labels: {

                    color: 'white'

                }

            }

        },

        scales: {

            y: {

                ticks: {

                    color: 'white'

                }

            },

            x: {

                ticks: {

                    color: 'white'

                }

            }

        }

    }

});

</script>
<script>

setInterval(() => {

    location.reload();

}, 5000);

</script>
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

        background:rgba(0,0,0,0.7);

        padding:40px;

        border-radius:20px;

        box-shadow:0 0 25px cyan;

    }

    h1{

        color:cyan;
        text-align:center;
        margin-bottom:30px;

    }

    input{

        width:100%;
        padding:15px;

        margin-bottom:20px;

        border:none;
        border-radius:10px;

        font-size:16px;

    }

    button{

        width:100%;
        padding:15px;

        border:none;

        border-radius:10px;

        background:cyan;

        font-size:18px;
        font-weight:bold;

        cursor:pointer;

    }

    </style>

    </head>

    <body>

    <form
        class="login"
        method="POST"
        action="/login"
    >

        <h1>
            🔐 Admin Login
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

/* LOGIN POST */

app.use(express.urlencoded({ extended:true }));

app.post("/login", (req, res) => {

    const { usuario, password } = req.body;

    if(

        usuario === process.env.ADMIN_USER &&
password === process.env.ADMIN_PASS

    ){

        req.session.admin = true;

        return res.redirect("/admin");

    }

    res.send("❌ Datos incorrectos");
});    
/* LOGOUT */

app.get("/logout", (req, res) => {

    req.session.destroy();

    res.redirect("/admin");

});
app.listen(3000, () => {

    console.log(
        "🔥 Servidor activo en puerto 3000"
    );

});