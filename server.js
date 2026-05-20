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

const Account =
require("./models/Account");

const History =
require("./models/History");

const app = express();

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

/* ========================= */
/* CREAR CUENTA */
/* ========================= */

app.post("/crear-cuenta", async (req, res) => {

    try {

        const {

            plataforma,

            plan,

            correo,

            password,

            cliente,

            estado,

            vencimiento

        } = req.body;

        const nuevaCuenta =
new Account({

    plataforma:
    req.body.plataforma,

    plan:
    req.body.plan,

    correo:
    req.body.correo,

    password:
req.body.password,

cliente:
req.body.cliente,

    inicio:

    req.body.inicio

    ||

    new Date(),

    vencimiento:
    req.body.vencimiento,

    cliente: "Libre",

    estado: "Libre"

});

        await nuevaCuenta.save();

        res.json({

            success: true,

            message: "Cuenta creada"

        });

    } catch (error) {

        console.log(error);

        res.json({

            success: false,

            message: "Error creando cuenta"

        });

    }

});

/* ========================= */
/* CREAR CUENTA WEB */
/* ========================= */

app.post("/crear-cuenta-web"
, async (req, res) => {

    try {

        const nuevaCuenta =
new Account({

    plataforma:
    req.body.plataforma,

    plan:
    req.body.plan,

    correo:
    req.body.correo,

    password:
    req.body.password,

    inicio:
    req.body.inicio,

    vencimiento:
    req.body.vencimiento,

    cliente: "Libre",

    estado: "Libre"

});

        await nuevaCuenta.save();

        res.redirect("/admin/cuentas");

    } catch (error) {

        console.log(error);

        res.send("Error creando cuenta");

    }

});

/* ========================= */
/* ELIMINAR CUENTA */
/* ========================= */

app.post("/eliminar-cuenta/:id", async (req, res) => {

    try {

        await Account.findByIdAndDelete(
            req.params.id
        );

        res.redirect("/admin/cuentas");

    } catch (error) {

        console.log(error);

        res.send("Error eliminando cuenta");

    }

});

/* ========================= */
/* FORM EDITAR */
/* ========================= */

app.get("/editar-cuenta/:id", async (req, res) => {

    try {

        const cuenta =
        await Account.findById(
            req.params.id
        );

        if(!cuenta){

            return res.send(
                "Cuenta no encontrada"
            );

        }

        res.send(`

<html>

<head>

<title>Editar Cuenta</title>

<style>

body{

    background:#050816;

    color:white;

    font-family:Arial;

    padding:40px;

}

form{

    background:#111;

    padding:30px;

    border-radius:20px;

    width:500px;

}

input{

    width:100%;

    padding:15px;

    margin-bottom:20px;

    border:none;

    border-radius:10px;

}

button{

    padding:15px 25px;

    background:cyan;

    border:none;

    font-weight:bold;

    cursor:pointer;

}

</style>

</head>

<body>

<h1>
✏️ Editar Cuenta
</h1>

<form
method="POST"
action="/editar-cuenta/${cuenta._id}"
>

<input
name="plataforma"
value="${cuenta.plataforma}"
required
>

<input
name="plan"
value="${cuenta.plan}"
required
>

<input
name="correo"
value="${cuenta.correo}"
required
>

<input
name="password"
value="${cuenta.password}"
required
>

<input
name="cliente"
value="${cuenta.cliente}"
required
>

<input
type="date"
name="inicio"

value="${
cuenta.inicio

?

new Date(cuenta.inicio)
.toISOString()
.split('T')[0]

:

''
}"

required
>

<input
type="date"
name="vencimiento"

value="${
cuenta.vencimiento

?

new Date(cuenta.vencimiento)
.toISOString()
.split('T')[0]

:

''
}"

required
>

<button>

Guardar Cambios

</button>

</form>

</body>

</html>

`);

    }

    catch(error){

        console.log(error);

        res.send("Error");

    }

});


/* ========================= */
/* CAMBIAR ESTADO */
/* ========================= */

app.post("/cambiar-estado/:id", async (req, res) => {

    try {

        const cuenta =
        await Account.findById(
            req.params.id
        );

        if(!cuenta){

            return res.send(
                "Cuenta no encontrada"
            );

        }

        cuenta.estado =

        cuenta.estado === "Libre"

        ?

        "Usada"

        :

        "Libre";

        await cuenta.save();

        res.redirect("/admin/cuentas");

    }

    catch(error){

        console.log(error);

        res.send(
            "Error cambiando estado"
        );

    }

});

app.post("/editar-cuenta/:id", async (req, res) => {

    try {

        await Account.findByIdAndUpdate(

            req.params.id,

            {

                plataforma:
                req.body.plataforma,

                plan:
                req.body.plan,

                correo:
                req.body.correo,

                password:
                req.body.password,

                cliente:
                req.body.cliente,

                inicio:
                req.body.inicio,

                vencimiento:
                req.body.vencimiento

            }

        );

        res.redirect("/admin/cuentas");

    }

    catch(error){

        console.log(error);

        res.send("Error actualizando");

    }

});

/* ========================= */
/* LISTAR CUENTAS */
/* ========================= */

app.get("/cuentas", async (req, res) => {

    try {

        /* ========================= */
        /* ACTUALIZAR VENCIDAS */
        /* ========================= */

        const cuentasVencidas =
        await Account.find({

            vencimiento: {

                $lt: new Date()

            },

            estado: "Usada"

        });

        for(const cuenta of cuentasVencidas){

            cuenta.estado = "Libre";

            cuenta.cliente = "Libre";

            await cuenta.save();

        }

        const cuentas =
        await Account.find()
        .sort({ fecha: -1 });

        res.json(cuentas);

    } catch (error) {

        console.log(error);

        res.json([]);

    }

});

/* ========================= */
/* ADMIN CUENTAS */
/* ========================= */

app.get("/admin/cuentas", async (req, res) => {

    try {

        const cuentas =
        await Account.find()
        .sort({ fecha: -1 });

        let filas = "";

        cuentas.forEach(cuenta => {

            filas += `

            <tr>

                <td>

${

cuenta.plataforma === "Netflix"

?

"🎬 Netflix"

:

cuenta.plataforma === "Prime Video"

?

"📦 Prime Video"

:

cuenta.plataforma === "Spotify"

?

"🎵 Spotify"

:

cuenta.plataforma === "Disney+"

?

"🪄 Disney+"

:

cuenta.plataforma === "Max"

?

"🎥 Max"

:

cuenta.plataforma === "Crunchyroll"

?

"🍥 Crunchyroll"

:

cuenta.plataforma

}

</td>

                <td>${cuenta.plan}</td>

                <td>${cuenta.correo}</td>

                <td>

<span
id="pass-${cuenta._id}"
>

••••••••

</span>

<button
onclick="
togglePassword(
'${cuenta._id}',
'${cuenta.password}'
)
"

style="
background:none;
border:none;
cursor:pointer;
font-size:18px;
margin-left:10px;
color:white;
"
>

👁️

</button>

</td>

                <td>

<form
method="POST"
action="/cambiar-estado/${cuenta._id}"
>

<button
style="
padding:8px 12px;
border:none;
border-radius:8px;
cursor:pointer;
background:

${cuenta.estado === "Libre"
? "#00c853"
: "#ff5252"};

color:white;
font-weight:bold;
"
>

${cuenta.estado}

</button>

</form>

</td>

<td>

<span
style="
padding:8px 12px;
border-radius:10px;
font-weight:bold;
color:white;
background:

${

!cuenta.inicio

?

'#757575'

:

new Date(cuenta.inicio)
> new Date()

?

'#00c853'

:

new Date(cuenta.inicio)
.toDateString()

===

new Date()
.toDateString()

?

'#ff9100'

:

'#03a9f4'

};
"
>

${

cuenta.inicio

?

new Date(
cuenta.inicio
).toLocaleDateString()

:

"Sin fecha"

}

</span>

</td>

<td>

<span
style="
padding:8px 12px;
border-radius:10px;
font-weight:bold;
color:white;
background:

${

!cuenta.vencimiento

?

'#757575'

:

new Date(cuenta.vencimiento)
< new Date()

?

'#ff1744'

:

(

(new Date(cuenta.vencimiento)
- new Date())

/

(1000 * 60 * 60 * 24)

< 3

?

'#ff9100'

:

'#00c853'

)

};
"
>

${

cuenta.vencimiento

?

new Date(
cuenta.vencimiento
).toLocaleDateString()

:

"Sin fecha"

}

</span>

<br><br>

<small
style="
color:#aaa;
"
>

${

cuenta.vencimiento

?

(

new Date(cuenta.vencimiento)
< new Date()

?

"🔴 Venció hace "

+

Math.abs(

Math.ceil(

(

new Date(cuenta.vencimiento)
- new Date()

)

/

(1000 * 60 * 60 * 24)

)

)

+

" días"

:

Math.ceil(

(

new Date(cuenta.vencimiento)
- new Date()

)

/

(1000 * 60 * 60 * 24)

)

=== 0

?

"🟡 Vence hoy"

:

"🟢 Faltan "

+

Math.ceil(

(

new Date(cuenta.vencimiento)
- new Date()

)

/

(1000 * 60 * 60 * 24)

)

+

" días"

)

:

""

}

</small>

</td>

                <td>${cuenta.cliente}</td>

                <td>

<a
href="/editar-cuenta/${cuenta._id}"
style="
background:orange;
color:black;
padding:10px;
border-radius:8px;
text-decoration:none;
font-weight:bold;
margin-right:10px;
display:inline-block;
"
>

✏️ Editar

</a>

<form
method="POST"
action="/eliminar-cuenta/${cuenta._id}"
style="
display:inline-block;
"
onsubmit="
return confirm(
'¿Seguro que deseas eliminar esta cuenta?'
)
"
>

<button
style="
background:red;
color:white;
border:none;
padding:10px;
cursor:pointer;
border-radius:8px;
"
>

🗑️ Eliminar

</button>

</form>

</td>

            </tr>

            `;

        });

        res.send(`

<html>

<head>

<title>RestarStore Cuentas</title>

<style>

body{

    background:#050816;

    color:white;

    font-family:Arial;

    padding:40px;

}

h1{

    color:cyan;

}

table{

    width:100%;

    border-collapse:collapse;

    margin-top:20px;

    background:#111;

}

th,td{

    padding:15px;

    border-bottom:1px solid #333;

    text-align:left;

}

th{

    color:cyan;

}

tr:hover{

    background:#1a1a1a;

}

</style>

</head>

<body>

<h1>
📦 RestarStore Accounts
</h1>

<div
style="
display:flex;
gap:20px;
margin-bottom:30px;
"
>

<div
style="
background:#111;
padding:20px;
border-radius:15px;
width:220px;
"
>

<h2 style="color:cyan;">
📦 Total
</h2>

<h1>
${cuentas.length}
</h1>

</div>

<div
style="
background:#111;
padding:20px;
border-radius:15px;
width:220px;
"
>

<h2 style="color:#00e676;">
🟢 Libres
</h2>

<h1>

${
cuentas.filter(
c => c.estado === "Libre"
).length
}

</h1>

</div>

<div
style="
background:#111;
padding:20px;
border-radius:15px;
width:220px;
"
>

<h2 style="color:#ff5252;">
🔴 Usadas
</h2>

<h1>

${
cuentas.filter(
c => c.estado === "Usada"
).length
}

</h1>

</div>

</div>

<form
method="POST"
action="/crear-cuenta-web"
style="
margin-bottom:30px;
background:#111;
padding:20px;
border-radius:15px;
"
>

<input
name="plataforma"
placeholder="Plataforma"
required
style="
padding:12px;
margin:5px;
width:180px;
"
>

<input
name="plan"
placeholder="Plan"
required
style="
padding:12px;
margin:5px;
width:180px;
"
>

<input
name="correo"
placeholder="Correo"
required
style="
padding:12px;
margin:5px;
width:250px;
"
>

<input
name="password"
placeholder="Password"
required
style="
padding:12px;
margin:5px;
width:180px;
"
>

<input
type="date"
name="inicio"
required
style="
padding:12px;
margin:5px;
width:200px;
"
>


<input
type="date"
name="vencimiento"
required
style="
padding:12px;
margin:5px;
width:200px;
"
>

<button
style="
padding:12px 20px;
background:cyan;
border:none;
font-weight:bold;
cursor:pointer;
"
>

Guardar Cuenta

</button>

</form>

<input
type="text"
id="buscador"
placeholder="🔎 Buscar cuenta..."
onkeyup="filtrarTabla()"
style="
width:300px;
padding:15px;
margin-bottom:20px;
border:none;
border-radius:10px;
background:#111;
color:white;
font-size:16px;
"
>

<select
id="filtroEstado"
onchange="filtrarTabla()"
style="
padding:15px;
border:none;
border-radius:10px;
background:#111;
color:white;
margin-left:10px;
"
>

<option value="">
Todos
</option>

<option value="Libre">
Libres
</option>

<option value="Usada">
Usadas
</option>

</select>

<table>

<tr>

<th>Plataforma</th>

<th>Plan</th>

<th>Correo</th>

<th>Password</th>

<th>Estado</th>

<th>Inicio</th>

<th>Vencimiento</th>

<th>Cliente</th>

<th>Acciones</th>

</tr>

${filas}

</table>

<script>

function togglePassword(id,password){

    const elemento =
    document.getElementById(
        "pass-" + id
    );

    if(
        elemento.innerHTML
        === "••••••••"
    ){

        elemento.innerHTML =
        password;

    }

    else{

        elemento.innerHTML =
        "••••••••";

    }

}

</script>

</body>

</html>

`);

    } catch (error) {

        console.log(error);

        res.send("Error cargando cuentas");

    }

});

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

    remitente =
    "trx.mail2.disneyplus.com";

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

            q: `from:${remitente} newer_than:15m`

        });

        const messages =
        response.data.messages;
console.log(
    "📬 MENSAJES:",
    messages?.length || 0
);
        if(!messages || messages.length === 0){

            return res.json({

                otp: "No encontrado"

            });

        }

        
let message = null;

let otpSnippet = null;

for (const msg of messages) {

    const tempMessage =
    await gmail.users.messages.get({

        userId: "me",

        id: msg.id,

    });

    const snippet =
    tempMessage.data.snippet || "";

    otpSnippet =
snippet.match(/(\d{6})/);

if(otpSnippet){

    console.log(
        "🔥 OTP SNIPPET:",
        otpSnippet[1]
    );

}

    console.log("📨 SNIPPET:", snippet);

message = tempMessage;

console.log(
    "🔥 CORREO OTP DETECTADO"
);

break;

}

if (!message) {

    return res.json({

        otp: "No encontrado"

    });

}

        const payload =
        message.data.payload;

        let body = "";

        function obtenerTexto(partes){

    for(const parte of partes){

        if(

            parte.body &&
            parte.body.data

        ){

            try{

                const texto =
                Buffer.from(

                    parte.body.data,

                    "base64"

                ).toString("utf8");

                body += texto;

            }

            catch(err){

                console.log(err);

            }

        }

        if(parte.parts){

            obtenerTexto(parte.parts);

        }

    }

}

if(payload.parts){

    obtenerTexto(payload.parts);

}

if(

    payload.body &&
    payload.body.data

){

    try{

        body += Buffer.from(

            payload.body.data,

            "base64"

        ).toString("utf8");

    }

    catch(err){

        console.log(err);

    }

}

console.log(
    "📩 BODY LENGTH:",
    body.length
);

        const textoPlano = body


.replace(/<[^>]*>/g, " ")

.replace(/&nbsp;/g, " ")

.replace(/&#39;/g, "'")

.replace(/\s+/g, " ");

const numerosVisibles =
textoPlano.match(/\b\d{6}\b/g);

console.log(
    "🔥 NUMEROS VISIBLES:",
    numerosVisibles
);

console.log(
    "📩 TEXTO:",
    textoPlano.substring(0, 500)
);

console.log(
    "🔥 HOGAR?:",
    textoPlano.toLowerCase().includes(
        "actualizar el hogar"
    )
);

console.log(
    "🔥 CORREO?:",
    textoPlano.toLowerCase().includes(
        "dirección de correo"
    )
);

let tipoDisney = "login";

if(
textoPlano.toLowerCase().includes(
"actualizar el hogar"
)
){

    tipoDisney = "hogar";

}

else if(

textoPlano.toLowerCase().includes(
"direccion de correo"
)
||

textoPlano.toLowerCase().includes(
"dirección de correo"
)

){

    tipoDisney = "verificacion";

}

console.log(
    "🔥 TIPO DISNEY:",
    tipoDisney
);

        let otp = "No encontrado";

if(

    numerosVisibles &&

    numerosVisibles.length > 0

){

    otp =
numerosVisibles[
numerosVisibles.length - 1
];

}

        if(otpSnippet){

    otp = otpSnippet[1];

}

        const patrones = [

/verification code is[:\s]+(\d{6,8})/i,

/your verification code is[:\s]+(\d{6,8})/i,

/use this code[:\s]+(\d{6,8})/i,

/one time password[:\s]+(\d{6,8})/i,

/otp[:\s]+(\d{6,8})/i,

/enter the following code[:\s]+(\d{6,8})/i,

/codigo de verificacion[:\s]+(\d{6,8})/i,

/usa el siguiente codigo.*?(\d{6,8})/i,

/tu codigo de verificacion es.*?(\d{6,8})/i,

/codigo de acceso unico.*?(\d{6})/i,


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

        const correosEncontrados =
textoPlano.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
);

let cuentaDetectada =
req.query.correo;

if(

    correosEncontrados &&

    correosEncontrados.length > 0

){

    cuentaDetectada =
    correosEncontrados[0];

}

        const cuentaLibre =
await Account.findOne({

    plataforma:

    plataforma === "amazon"

    ?

    "Prime Video"

    :

    plataforma,

    estado: "Libre"

});

if(cuentaLibre){

    cuentaLibre.estado = "Usada";

    cuentaLibre.cliente =
    req.query.correo || "Cliente";

    await cuentaLibre.save();

}

res.json({

    otp,

    cuenta: cuentaDetectada,

    acceso:

    cuentaLibre

    ?

    {

        correo:
        cuentaLibre.correo,

        password:
        cuentaLibre.password,

        plan:
        cuentaLibre.plan

    }

    :

    null

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
/* VALIDAR CUENTA */
/* ========================= */

app.post("/validar-cuenta", async (req, res) => {

    try {

        const {
            correo,
            plataforma
        } = req.body;

        const cuenta =
        await Account.findOne({

            correo,
            plataforma

        });

        if(!cuenta){

            return res.json({

                success: false,

                message:
                "Cuenta no encontrada"

            });

        }

        res.json({

            success: true,

            cuenta

        });

    }

    catch(error){

        console.log(error);

        res.json({

            success: false,

            message:
            "Error servidor"

        });

    }

});

/* ========================= */
/* SERVER */
/* ========================= */

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        "🔥 Servidor activo en puerto " + PORT
    );

});