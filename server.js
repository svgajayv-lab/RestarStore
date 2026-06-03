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

const MongoStore = require("connect-mongo");

const path = require("path");

const { google } = require("googleapis");

const Account =
require("./models/Account");

const History =
require("./models/History");

const User =
require("./models/User");

const app = express();

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(session({

    name: "restarstore_session",

    secret: process.env.SESSION_SECRET || "restarstore",

    resave: false,

    saveUninitialized: false,

    rolling: true,

    store: MongoStore.default.create({
    mongoUrl: process.env.MONGO_URI
}),

    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }

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

    whatsapp,
    perfiles,
    perfil,
    pin,

    estado,
    inicio,
    vencimiento
} = req.body;

        const nuevaCuenta =
new Account({

    plataforma: req.body.plataforma,
    plan: req.body.plan,
    correo: req.body.correo,
    password: req.body.password,

    cliente: req.body.cliente || "Libre",
    whatsapp: req.body.whatsapp,
    perfiles: req.body.perfiles,
    perfil: req.body.perfil,
    pin: req.body.pin,

    inicio: req.body.inicio || new Date(),
    vencimiento: req.body.vencimiento,

    estado: req.body.estado || "Libre"

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

    ownerId: req.session.userId,

    plataforma: req.body.plataforma,
    plan: req.body.plan,
    correo: req.body.correo,
    password: req.body.password,

    whatsapp: req.body.whatsapp,
cuentaCompleta: req.body.cuentaCompleta,

    inicio: req.body.inicio,
    vencimiento: req.body.vencimiento,

    cliente: req.body.cliente || "Libre",
estado: req.body.cliente ? "Usada" : "Libre"

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

        if(!req.session.userId){
            return res.redirect("/login-revendedor");
        }

        const cuenta =
        await Account.findOne({
            _id: req.params.id,
            ownerId: req.session.userId
        });

        if(!cuenta){
            return res.send("Acceso denegado");
        }

        await cuenta.deleteOne();

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

        if(!req.session.userId){
    return res.redirect("/login-revendedor");
}

const cuenta =
await Account.findOne({
    _id: req.params.id,
    ownerId: req.session.userId
});

        if(!cuenta){

            return res.send(
                "Cuenta no encontrada"
            );

        }

        res.send(`

<html>

<head>

<meta charset="UTF-8">

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
name="whatsapp"
placeholder="WhatsApp cliente"
value="${cuenta.whatsapp || ''}"
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

        if(!req.session.userId){
    return res.redirect("/login-revendedor");
}

const cuenta =
await Account.findOne({
    _id: req.params.id,
    ownerId: req.session.userId
});

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

        if(!req.session.userId){
    return res.redirect("/login-revendedor");
}

await Account.findOneAndUpdate(
    {
        _id: req.params.id,
        ownerId: req.session.userId
    },
    {
        plataforma: req.body.plataforma,
        plan: req.body.plan,
        correo: req.body.correo,
        password: req.body.password,
        cliente: req.body.cliente,
        whatsapp: req.body.whatsapp,
        cuentaCompleta: req.body.cuentaCompleta,
        inicio: req.body.inicio,
        vencimiento: req.body.vencimiento
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

        if(!req.session.userId){
    return res.redirect("/login-revendedor");
}

const cuentas =
await Account.find({
    ownerId: req.session.userId
})
.sort({ fecha: -1 });

        res.json(cuentas);

    } catch (error) {

        console.log(error);

        res.json([]);

    }

});

/* ========================= */
/* CREAR REVENDEDOR */
/* ========================= */

app.post("/crear-revendedor", async (req, res) => {

    try {

        await User.create({

            nombre: req.body.nombre,
            usuario: req.body.usuario,
            password: req.body.password,
            estado: "Activo",
            inicio: req.body.inicio || new Date(),
            vencimiento: req.body.vencimiento,
            whatsapp: req.body.whatsapp

        });

        res.redirect("/admin");

    } catch(error){

        console.log(error);
        res.send("Error creando revendedor");

    }

});

/* ========================= */
/* CAMBIAR ESTADO REVENDEDOR */
/* ========================= */

app.post("/cambiar-estado-revendedor/:id", async (req, res) => {

    try {

        const user =
        await User.findById(req.params.id);

        if(!user){
            return res.send("Revendedor no encontrado");
        }

        user.estado =
        user.estado === "Activo"
        ? "Suspendido"
        : "Activo";

        await user.save();

        res.redirect("/admin");

    } catch(error){

        console.log(error);
        res.send("Error cambiando estado");

    }

});

/* ========================= */
/* ELIMINAR REVENDEDOR */
/* ========================= */

app.post("/eliminar-revendedor/:id", async (req, res) => {

    try {

        await User.findByIdAndDelete(req.params.id);

        res.redirect("/admin");

    } catch(error){

        console.log(error);
        res.send("Error eliminando revendedor");

    }

});

app.get("/editar-revendedor/:id", async (req, res) => {

    try {

        const user =
        await User.findById(req.params.id);

        if(!user){
            return res.send("Revendedor no encontrado");
        }

        res.send(`

<html>
<head>
<meta charset="UTF-8">
<title>Editar Revendedor</title>
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

<h1>✏️ Editar Revendedor</h1>

<form method="POST" action="/editar-revendedor/${user._id}">

<input name="nombre" value="${user.nombre}" required>

<input name="usuario" value="${user.usuario}" required>

<input name="password" value="${user.password}" required>

<input name="whatsapp" value="${user.whatsapp || ""}" required>

<input
type="date"
name="inicio"
value="${user.inicio ? new Date(user.inicio).toISOString().split("T")[0] : ""}"
required
>

<input
type="date"
name="vencimiento"
value="${user.vencimiento ? new Date(user.vencimiento).toISOString().split("T")[0] : ""}"
required
>

<button>Guardar Cambios</button>

</form>

</body>
</html>

        `);

    } catch(error){

        console.log(error);
        res.send("Error editando revendedor");

    }

});

app.post("/editar-revendedor/:id", async (req, res) => {

    try {

        await User.findByIdAndUpdate(
            req.params.id,
            {
                nombre: req.body.nombre,
                usuario: req.body.usuario,
                password: req.body.password,
                whatsapp: req.body.whatsapp,
                inicio: req.body.inicio,
                vencimiento: req.body.vencimiento
            }
        );

        res.redirect("/admin");

    } catch(error){

        console.log(error);
        res.send("Error actualizando revendedor");

    }

});

/* ========================= */
/* LOGIN REVENDEDOR */
/* ========================= */

app.get("/login-revendedor", (req, res) => {

    res.send(`

<html>
<head>
<meta charset="UTF-8">
<title>Login Revendedor</title>
<style>
body{
    background:#050816;
    color:white;
    font-family:Arial;
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
}
form{
    background:#111;
    padding:40px;
    border-radius:20px;
    width:350px;
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
h1{ color:cyan; }
</style>
</head>

<body>

<form method="POST" action="/login-revendedor">

<h1>👤 Revendedor</h1>

<input
name="usuario"
placeholder="Usuario"
required
>

<input
type="password"
name="password"
placeholder="Password"
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

app.post("/login-revendedor", async (req, res) => {


    try {

        const user =
await User.findOne({
    usuario: req.body.usuario,
    password: req.body.password,
    estado: "Activo"
});

        if(!user){
            return res.send("❌ Usuario no autorizado o vencido");
        }

        req.session.userId = user._id;
        req.session.userNombre = user.nombre;

        res.redirect("/admin/cuentas");

    } catch(error){

        console.log(error);
        res.send("Error login revendedor");

    }

});

app.get("/logout-revendedor", (req, res) => {

    req.session.destroy();

    res.redirect("/login-revendedor");

});

/* ========================= */
/* CAMBIAR PASSWORD REVENDEDOR */
/* ========================= */

app.get("/cambiar-password", async (req, res) => {

    if(!req.session.userId){
        return res.redirect("/login-revendedor");
    }

    res.send(`

<html>
<head>
<meta charset="UTF-8">
<title>Cambiar contraseña</title>

<style>
body{
    background:#050816;
    color:white;
    font-family:Arial;
    min-height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
}

.card{
    background:#111;
    width:420px;
    padding:35px;
    border-radius:22px;
    box-shadow:0 0 25px rgba(0,255,255,.15);
}

h1{
    color:cyan;
    margin-top:0;
}

input{
    width:100%;
    padding:15px;
    margin-bottom:18px;
    border:none;
    border-radius:10px;
    font-size:15px;
}

button{
    width:100%;
    padding:15px;
    background:cyan;
    border:none;
    border-radius:10px;
    font-weight:bold;
    cursor:pointer;
    font-size:16px;
}

a{
    display:block;
    margin-top:18px;
    color:#00e5ff;
    text-align:center;
    text-decoration:none;
}

small{
    color:#aaa;
}
</style>
</head>

<body>

<div class="card">

<h1>🔐 Cambiar contraseña</h1>

<small>
Actualiza tu contraseña de acceso al panel.
</small>

<br><br>

<form method="POST" action="/cambiar-password">

<input
type="password"
name="passwordActual"
placeholder="Contraseña actual"
required
>

<input
type="password"
name="passwordNueva"
placeholder="Nueva contraseña"
required
>

<input
type="password"
name="confirmarPassword"
placeholder="Confirmar nueva contraseña"
required
>

<button>
Guardar nueva contraseña
</button>

</form>

<a href="/admin/cuentas">
← Volver al panel
</a>

</div>

</body>
</html>

    `);

});

app.post("/cambiar-password", async (req, res) => {

    try {

        if(!req.session.userId){
            return res.redirect("/login-revendedor");
        }

        const user =
        await User.findById(req.session.userId);

        if(!user){
            return res.send("Usuario no encontrado");
        }

        if(user.password !== req.body.passwordActual){

            return res.send(`
            <script>
            alert("❌ La contraseña actual no es correcta");
            window.location.href="/cambiar-password";
            </script>
            `);

        }

        if(req.body.passwordNueva !== req.body.confirmarPassword){

            return res.send(`
            <script>
            alert("❌ Las nuevas contraseñas no coinciden");
            window.location.href="/cambiar-password";
            </script>
            `);

        }

        user.password = req.body.passwordNueva;

        await user.save();

        res.send(`
        <script>
        alert("✅ Contraseña actualizada correctamente");
        window.location.href="/admin/cuentas";
        </script>
        `);

    } catch(error){

        console.log(error);
        res.send("Error cambiando contraseña");

    }

});

/* ========================= */
/* ADMIN CUENTAS */
/* ========================= */

app.get("/admin/cuentas", async (req, res) => {

    try {

        if(!req.session.userId){
    return res.redirect("/login-revendedor");
}

const user =
await User.findById(
    req.session.userId
);

if(!user || user.estado !== "Activo"){

    req.session.destroy();

    return res.redirect(
        "/login-revendedor"
    );

}

const cuentas =
await Account.find({
    ownerId: req.session.userId
})
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

                <td>
    ${cuenta.correo}

    <button
    onclick="copiarTexto('${cuenta.correo}')"
    style="
    background:#00e5ff;
    color:black;
    border:none;
    border-radius:6px;
    padding:6px 8px;
    margin-left:8px;
    cursor:pointer;
    font-weight:bold;
    "
    >
    📋
    </button>
</td>

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
).toLocaleDateString("es-PE")

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
).toLocaleDateString("es-PE")

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

<td style="white-space:nowrap;">

📱 ${cuenta.whatsapp || "-"}

${
cuenta.whatsapp
?

`<a
href="https://wa.me/${cuenta.whatsapp.replace(/\D/g,'')}"
target="_blank"
style="
background:#25d366;
color:white;
padding:6px 8px;
border-radius:6px;
text-decoration:none;
margin-left:8px;
font-weight:bold;
"
>
💬
</a>`

:

""
}

</td>

<td style="white-space:nowrap;">

${
cuenta.whatsapp
?
`

<button
onclick="enviarEntrega(this)"
data-whatsapp="${cuenta.whatsapp || ""}"
data-plataforma="${cuenta.plataforma || ""}"
data-cliente="${cuenta.cliente || ""}"
data-correo="${cuenta.correo || ""}"
data-password="${cuenta.password || ""}"
data-cuenta="${cuenta.cuentaCompleta || ""}"
data-inicio="${cuenta.inicio ? new Date(cuenta.inicio).toLocaleDateString("es-PE") : ""}"
data-vencimiento="${cuenta.vencimiento ? new Date(cuenta.vencimiento).toLocaleDateString("es-PE") : ""}"
style="
background:#25d366;
color:white;
border:none;
padding:10px;
cursor:pointer;
border-radius:8px;
font-weight:bold;
margin-right:10px;
"
>
📋 Entrega
</button>

<button
onclick="enviarRenovacion(this)"
data-cliente="${cuenta.cliente || ''}"
data-whatsapp="${cuenta.whatsapp || ""}"
data-plataforma="${cuenta.plataforma || ""}"
data-vencimiento="${cuenta.vencimiento ? new Date(cuenta.vencimiento).toLocaleDateString("es-PE") : ""}"
style="
background:#00bcd4;
color:white;
border:none;
padding:10px;
cursor:pointer;
border-radius:8px;
font-weight:bold;
margin-right:10px;
"
>
🔄 Renovar
</button>

`
:
""
}

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
margin:0;
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
font-weight:bold;
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

<meta charset="UTF-8">

<title>RestarStore Cuentas</title>

<style>

.plataforma-btn{
    border:none;
    border-radius:14px;
    padding:14px 22px;
    cursor:pointer;
    font-weight:bold;
    color:white;
    transition:.25s;
    min-width:150px;
    font-size:15px;
}

.plataforma-btn:hover{
    transform:translateY(-2px);
}

.plataforma-btn.netflix{ background:#e50914; }
.plataforma-btn.prime{ background:#2196f3; }
.plataforma-btn.disney{ background:#111; border:2px solid white; }
.plataforma-btn.spotify{ background:#1db954; }
.plataforma-btn.max{ background:#6c2cff; }
.plataforma-btn.crunchy{ background:#ff8c00; }

.plataforma-btn.activa{
    box-shadow:0 0 15px cyan, 0 0 35px cyan;
    transform:scale(1.06);
    outline:3px solid cyan;
}

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
    min-width:1500px;
    border-collapse:collapse;
    margin-top:20px;
    background:#111;
}

th,td{
    padding:15px;
    border-bottom:1px solid #333;
    text-align:left;
    vertical-align:middle;
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

<div
style="
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:30px;
"
>

<div>

<h1
style="
margin:0;
color:cyan;
"
>
👋 Bienvenido, ${req.session.userNombre}
</h1>

<div
style="
color:#00e5ff;
margin-top:5px;
font-size:14px;
"
>
Panel de gestión de cuentas
</div>

</div>

<div
style="
display:flex;
flex-direction:column;
gap:10px;
align-items:flex-end;
"
>

<a
href="/logout-revendedor"
style="
background:#ff2d2d;
color:white;
padding:12px 18px;
border-radius:10px;
text-decoration:none;
font-weight:bold;
"
>
🚪 Cerrar sesión
</a>

<a
href="/cambiar-password"
style="
background:#6c2cff;
color:white;
padding:12px 18px;
border-radius:10px;
text-decoration:none;
font-weight:bold;
"
>
🔐 Cambiar contraseña
</a>

</div>

</div>

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

<div
style="
background:#111;
padding:20px;
border-radius:15px;
width:220px;
"
>

<h2 style="color:#ff9100;">
⚠️ Vencidas
</h2>

<h1>

${
cuentas.filter(
c =>
c.vencimiento &&
new Date(c.vencimiento) < new Date()
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
type="hidden"
name="plataforma"
id="plataformaInput"
required
>

<div style="
display:flex;
gap:10px;
flex-wrap:wrap;
margin-bottom:15px;
">

<button class="plataforma-btn netflix"
type="button"
onclick="seleccionarPlataforma('netflix', this)">
🎬 Netflix
</button>

<button class="plataforma-btn prime"
type="button"
onclick="seleccionarPlataforma('amazon', this)">
📦 Prime Video
</button>

<button class="plataforma-btn disney"
type="button"
onclick="seleccionarPlataforma('disney', this)">
🪄 Disney+
</button>

<button class="plataforma-btn spotify"
type="button"
onclick="seleccionarPlataforma('spotify', this)">
🎵 Spotify
</button>

<button class="plataforma-btn max"
type="button"
onclick="seleccionarPlataforma('max', this)">
🎥 Max
</button>

<button class="plataforma-btn crunchy"
type="button"
onclick="seleccionarPlataforma('crunchyroll', this)">
🍥 Crunchyroll
</button>

</div>

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
name="cliente"
placeholder="Cliente"
style="
padding:12px;
margin:5px;
width:180px;
"
>    

  <input
name="whatsapp"
placeholder="WhatsApp cliente"
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

<option value="vencida">
Vencidas
</option>

</select>

<select
id="filtroPlataforma"
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
Todas las plataformas
</option>

<option value="netflix">
Netflix
</option>

<option value="amazon">
Prime Video
</option>

<option value="disney">
Disney+
</option>

<option value="spotify">
Spotify
</option>

<option value="max">
Max
</option>

<option value="crunchyroll">
Crunchyroll
</option>

</select>

<div style="overflow-x:auto; width:100%;">

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

<th>WhatsApp</th>

<th>Acciones</th>

</tr>

${filas}

</table>

</div>

<script>

function enviarEntrega(btn){

    const plataforma = btn.dataset.plataforma;
    const correo = btn.dataset.correo;
    const password = btn.dataset.password;
    const cuentaCompleta = btn.dataset.cuenta;
    const inicio = btn.dataset.inicio;
    const vencimiento = btn.dataset.vencimiento;

    let nombrePlataforma = plataforma.toUpperCase();

    if(plataforma === "amazon"){
        nombrePlataforma = "AMAZON PRIME VIDEO";
    }

    if(plataforma === "netflix"){
        nombrePlataforma = "NETFLIX";
    }

    if(plataforma === "disney"){
        nombrePlataforma = "DISNEY+";
    }

    if(plataforma === "spotify"){
        nombrePlataforma = "SPOTIFY PREMIUM";
    }

    if(plataforma === "max"){
        nombrePlataforma = "MAX";
    }

    if(plataforma === "crunchyroll"){
        nombrePlataforma = "CRUNCHYROLL";
    }

    const mensaje = [
"*🎬 ENTREGA DE CUENTA " + nombrePlataforma + "*",
"",
"━━━━━━━━━━━━━━━━━━━",
"",
"📧 Correo:",
correo,
"",
"🔑 Contraseña:",
password,
"",
"📦 Cuenta:",
"Cuenta completa",
"",
"━━━━━━━━━━━━━━━━━━━",
"",
"📅 Inicio:",
inicio,
"",
"⏳ Vencimiento:",
vencimiento,
"",
"━━━━━━━━━━━━━━━━━━━",
"",
"⚠️ RECOMENDACIONES",
"",
"✅ No cambiar correo",
"✅ No cambiar contraseña",
"✅ No compartir la cuenta",
"",
"━━━━━━━━━━━━━━━━━━━",
"",
"🍿 ¡Disfruta tu suscripción!",
"",
"*✨ Gracias por confiar en EE Streaming Peru ✨*"
].join("\\n");

    navigator.clipboard.writeText(mensaje);

    alert("✅ Mensaje copiado. Ahora pégalo en WhatsApp.");

}

function enviarRenovacion(btn){

    const plataforma = btn.dataset.plataforma;
    const vencimiento = btn.dataset.vencimiento;
const cliente = btn.dataset.cliente || "cliente";


    let nombrePlataforma = plataforma.toUpperCase();

    if(plataforma === "amazon"){
        nombrePlataforma = "AMAZON PRIME VIDEO";
    }

    if(plataforma === "netflix"){
        nombrePlataforma = "NETFLIX";
    }

    if(plataforma === "disney"){
        nombrePlataforma = "DISNEY+";
    }

    if(plataforma === "spotify"){
        nombrePlataforma = "SPOTIFY PREMIUM";
    }

    if(plataforma === "max"){
        nombrePlataforma = "MAX";
    }

    if(plataforma === "crunchyroll"){
        nombrePlataforma = "CRUNCHYROLL";
    }

    const mensaje = [
"*🔄 RENOVACIÓN " + nombrePlataforma + "*",
"",
"Hola " + cliente + ", 👋",
"",
"⏳ Tu servicio vence:",
vencimiento,
"",
"⚠️ Para evitar interrupciones",
"puedes renovar hoy mismo.",
"",
"💳 Escríbenos para continuar.",
"",
"*✨ Gracias por confiar en EE Streaming Peru ✨*"
].join("\\n");

    navigator.clipboard.writeText(mensaje);

    alert("✅ Mensaje de renovación copiado.");

}

function copiarTexto(texto){

    navigator.clipboard.writeText(texto);

    alert("✅ Correo copiado");

}

function filtrarTabla(){

    const buscador =
    document.getElementById("buscador").value.toLowerCase();

    const estado =
    document.getElementById("filtroEstado").value.toLowerCase();

    const plataforma =
    document.getElementById("filtroPlataforma").value.toLowerCase();

    const filas =
    document.querySelectorAll("table tr");

    filas.forEach((fila, index) => {

        if(index === 0) return;

        const texto =
        fila.innerText.toLowerCase();

        const coincideBuscador =
        texto.includes(buscador);

        let coincideEstado = true;

if(estado === "libre"){
    coincideEstado = texto.includes("libre");
}

if(estado === "usada"){
    coincideEstado = texto.includes("usada");
}

if(estado === "vencida"){
    coincideEstado = texto.includes("venció hace");
}

        const coincidePlataforma =
        plataforma === "" || texto.includes(plataforma);

        fila.style.display =
        coincideBuscador &&
        coincideEstado &&
        coincidePlataforma
        ? ""
        : "none";

    });

}

function seleccionarPlataforma(valor, boton){

    document.getElementById("plataformaInput").value = valor;

    document.querySelectorAll(".plataforma-btn").forEach(btn => {
        btn.classList.remove("activa");
    });

    boton.classList.add("activa");
}

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

        const tipo =
req.query.tipo || "login";

const correoCliente =
(req.query.correo || "").trim();

const nombreCliente =
(req.query.cliente || "").trim();

if(!correoCliente || !nombreCliente){

    return res.json({
        otp: "🚫 Acceso no autorizado"
    });

}

const cuentaAutorizada =
await Account.findOne({

    correo: correoCliente,

    plataforma:

    plataforma === "amazon"
    ?

    "amazon"

    :

    plataforma,

    cliente: {
        $regex: new RegExp("^" + nombreCliente + "$", "i")
    },

    vencimiento: {
        $gte: new Date()
    }

});


if(!cuentaAutorizada){

    return res.json({
        otp: "🚫 Acceso no autorizado"
    });

}

let remitente = "";

        switch(plataforma){

   
case "amazon":
    remitente = "(from:account-update@amazon.com OR from:account-update@primevideo.com)";
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

    remitente =
    "alerts.hbomax.com";

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

console.log("🔍 QUERY GMAIL:", 
    plataforma === "amazon"
    ? `${remitente} newer_than:15m`
    : `from:${remitente} newer_than:15m`
);

        const response =
        await gmail.users.messages.list({

            userId: "me",

            maxResults: 5,

            q:
plataforma === "amazon"

? `${remitente} newer_than:15m`

:

plataforma === "netflix" && tipo === "login"

? `("Tu código de inicio de sesión" OR "Netflix") newer_than:30m`

:

plataforma === "netflix" && tipo === "password"

? `("restablecimiento de contraseña" OR "Restablece tu contraseña" OR "Netflix") newer_than:30m`

:

plataforma === "netflix" && tipo === "temporal"

? `("código de acceso temporal" OR "Netflix") newer_than:30m`

:

plataforma === "netflix" && tipo === "hogar"

? `("actualizar tu Hogar con Netflix" OR "Hogar con Netflix") newer_than:30m`

:

plataforma === "netflix" && tipo === "aprobar"

? `("Nueva solicitud de inicio de sesión" OR "Netflix") newer_than:30m`

:

plataforma === "disney" && tipo === "hogar"

? `(from:${remitente} OR "actualizar tu Hogar de Disney+" OR "Disney+") newer_than:30m`

:

plataforma === "disney" && tipo === "login"

? `(from:${remitente} OR "código de acceso único" OR "Disney+") newer_than:30m`

:

plataforma === "spotify"

? `(from:spotify OR "Tu código de inicio de sesión de Spotify" OR "Spotify") newer_than:30m`

:

plataforma === "max"

? `(from:${remitente} OR "Max" OR "HBO Max" OR "restablecer contraseña") newer_than:30m`

:

plataforma === "crunchyroll"

? `(from:crunchyroll OR "Crunchyroll") newer_than:30m`

:


`from:${remitente} newer_than:15m`

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

if(
    plataforma === "netflix"
    &&
    tipo === "login"
){

    const netflixOTP =
    textoPlano.match(
        /Ingresa este código para iniciar sesión\s+(\d{4})/i
    );

    if(netflixOTP){

        console.log(
            "🔥 OTP NETFLIX:",
            netflixOTP[1]
        );

        return res.json({
            otp: netflixOTP[1]
        });

    }

}

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

let tipoSpotify = "login";

let tipoMax = "login";

let tipoCrunchy = "login";

if(
textoPlano.toLowerCase().includes(
"actualizar el hogar"
)
){

    tipoDisney = "hogar";

}

if(
textoPlano.toLowerCase().includes(
"restablece tu contraseña de spotify"
)
){

    tipoSpotify = "reset";

}

if(
textoPlano.toLowerCase().includes(
"restablecer contraseña"
)

||

textoPlano.toLowerCase().includes(
"reset your password"
)

){

    tipoMax = "reset";

}

if(
plataforma === "crunchyroll"
&&
textoPlano.toLowerCase().includes(
"restablecer contraseña"
)
){

    tipoCrunchy = "reset";

}

if(
plataforma === "crunchyroll"
&&
textoPlano.toLowerCase().includes(
"nuevo inicio de sesión"
)
){

    tipoCrunchy = "login";

}

console.log(
    "🔥 TIPO DISNEY:",
    tipoDisney
);

console.log(
    "🔥 TIPO SPOTIFY:",
    tipoSpotify
);

console.log(
    "🔥 TIPO MAX:",
    tipoMax
);

console.log(
    "🔥 TIPO CRUNCHY:",
    tipoCrunchy
);

        let otp = "No encontrado";

        let linkSpotify = null;

if(

    numerosVisibles &&

    numerosVisibles.length > 0

){

    otp =
numerosVisibles[
numerosVisibles.length - 1
];

}

        if(
    otpSnippet &&
    plataforma === "amazon"
){

    otp = otpSnippet[1];

}

const spotifyLink = body.match(
/https:\/\/accounts\.spotify\.com[^"' <>\]]+/i
);

const maxLink = body.match(
/https:\/\/ablink\.alerts\.hbomax\.com[^"' <>\]]+/i
);

const crunchyLink = body.match(
/https?:\/\/[^"' <>\]]+crunchyroll[^"' <>\]]+/i
);

const netflixLink = body.match(
/https?:\/\/(?:www\.)?netflix\.com[^"' <>\]]+/i
);

if(spotifyLink){

    linkSpotify = spotifyLink[0];

    console.log(
        "🔥 LINK NETFLIX:",
        linkSpotify
    );

}

if(maxLink){

    linkSpotify = maxLink[0];

    console.log(
        "🔥 LINK MAX:",
        linkSpotify
    );

}

if(crunchyLink){

    linkSpotify = crunchyLink[0];

    console.log(
        "🔥 LINK CRUNCHY:",
        linkSpotify
    );

}

if(netflixLink){

    linkSpotify = netflixLink[0];

    console.log(
        "🔥 LINK NETFLIX:",
        linkSpotify
    );

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

    "amazon"

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

if(

plataforma === "spotify"

&&

tipoSpotify === "reset"

){

    return res.json({

        link:

        linkSpotify ||

        "Link no encontrado"

    });

}

if(
plataforma === "max"
&&
tipoMax === "reset"
){

    return res.json({
        link: linkSpotify || "Link no encontrado"
    });

}

if(
plataforma === "crunchyroll"
){

    return res.json({
        link: linkSpotify || "Link no encontrado"
    });

}

if(
plataforma === "netflix"
&&
tipo !== "login"
){

    return res.json({
        link: linkSpotify || "Link no encontrado"
    });

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

app.get("/crear-propietario", async (req, res) => {

    try {

        let propietario = await User.findOne({
            usuario: "propietario"
        });

        if(!propietario){

            propietario = await User.create({
                nombre: "Propietario",
                usuario: "propietario",
                password: "123456",
                whatsapp: "",
                estado: "Activo",
                rol: "owner",
                inicio: new Date(),
                vencimiento: new Date("2030-12-31")
            });

        }

        await Account.updateMany(
            {
                ownerId: {
                    $exists: false
                }
            },
            {
                ownerId: propietario._id
            }
        );

        res.send("✅ Propietario creado y cuentas antiguas asignadas");

    } catch(error){

        console.log(error);
        res.send("Error creando propietario");

    }

});

app.get("/entrar-propietario", async (req, res) => {

    try {

        const propietario =
        await User.findOne({
            usuario: "propietario",
            rol: "owner"
        });

        if(!propietario){
            return res.send("Propietario no encontrado");
        }

        req.session.userId = propietario._id;
        req.session.userNombre = propietario.nombre;

        res.redirect("/admin/cuentas");

    } catch(error){

        console.log(error);
        res.send("Error entrando como propietario");

    }

});

/* ========================= */
/* ADMIN */
/* ========================= */

app.get("/admin", async (req, res) => {

    if(req.session.admin){

        const usuarios =
await User.find()
.sort({ fecha:-1 });

const totalRevendedores =
usuarios.length;

const activos =
usuarios.filter(
u => u.estado === "Activo"
).length;

const suspendidos =
usuarios.filter(
u => u.estado === "Suspendido"
).length;

let filasUsuarios = "";

usuarios.forEach(user => {

    filasUsuarios += `

    <tr>

    <td>${user.nombre}</td>

    <td>${user.usuario}</td>

    <td>${user.whatsapp || "-"}</td>

<td>${user.estado}</td>

<td>${user.inicio ? new Date(user.inicio).toLocaleDateString("es-PE") : "Sin fecha"}</td>

    <td>
        ${
            user.vencimiento
            ?
            new Date(user.vencimiento).toLocaleDateString("es-PE")
            :
            "Sin fecha"
        }
    </td>

    <td style="white-space:nowrap;">

        <form
        method="POST"
        action="/cambiar-estado-revendedor/${user._id}"
        style="display:inline-block;"
        >

            <button
            style="
            background:orange;
            border:none;
            padding:8px 12px;
            border-radius:8px;
            font-weight:bold;
            cursor:pointer;
            "
            >
                ${
                    user.estado === "Activo"
                    ?
                    "⛔ Suspender"
                    :
                    "✅ Activar"
                }
            </button>

        </form>

<a
href="/editar-revendedor/${user._id}"
style="
background:#ff9800;
color:black;
padding:8px 12px;
border-radius:8px;
text-decoration:none;
font-weight:bold;
margin-left:10px;
display:inline-block;
"
>
✏️ Editar
</a>

        <form
        method="POST"
        action="/eliminar-revendedor/${user._id}"
        style="display:inline-block;margin-left:10px;"
        onsubmit="return confirm('¿Eliminar revendedor?')"
        >

            <button
            style="
            background:red;
            color:white;
            border:none;
            padding:8px 12px;
            border-radius:8px;
            font-weight:bold;
            cursor:pointer;
            "
            >
                🗑️ Eliminar
            </button>

        </form>

    </td>

</tr>

    `;

});

        const historial =
        await History.find()
        .sort({ fecha:-1 })
        .limit(50);

        let filas = "";

        historial.forEach(item => {

            filas += `

            <tr>

                <td>${item.correo}</td>

                <td>
${
item.plataforma === "amazon"
? "Prime Video"
:
item.plataforma === "disney"
? "Disney+"
:
item.plataforma === "crunchyroll"
? "Crunchyroll"
:
item.plataforma === "max"
? "Max"
:
item.plataforma === "spotify"
? "Spotify"
:
item.plataforma === "netflix"
? "Netflix"
:
item.plataforma
}
</td>

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

    text-align:center;

    vertical-align:middle;

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

<a
href="/logout"
style="
background:#ff2d2d;
color:white;
padding:12px 18px;
border-radius:10px;
text-decoration:none;
font-weight:bold;
display:inline-block;
margin-bottom:20px;
"
>
🚪 Cerrar sesión admin
</a>

<a
href="/entrar-propietario"
style="
background:#ffd700;
color:black;
padding:12px 18px;
border-radius:10px;
text-decoration:none;
font-weight:bold;
display:inline-block;
margin-bottom:20px;
"
>
👑 Entrar como propietario
</a>

<h2 style="color:cyan;">
👤 Crear Revendedor
</h2>

<form
method="POST"
action="/crear-revendedor"
style="
background:#111;
padding:20px;
border-radius:15px;
margin-bottom:30px;
display:flex;
gap:10px;
flex-wrap:wrap;
"
>

<input
name="nombre"
placeholder="Nombre"
required
style="padding:12px;"
>

<input
name="usuario"
placeholder="Usuario"
required
style="padding:12px;"
>

<input
name="password"
placeholder="Password"
required
style="padding:12px;"
>

<input
name="whatsapp"
placeholder="WhatsApp"
required
style="padding:12px;"
>

<input
type="date"
name="inicio"
required
style="padding:12px;"
>

<input
type="date"
name="vencimiento"
required
style="padding:12px;"
>

<button
style="
background:cyan;
border:none;
padding:12px 20px;
font-weight:bold;
cursor:pointer;
"
>
Crear Revendedor
</button>

</form>

<div
style="
display:flex;
gap:20px;
margin-bottom:25px;
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
👥 Revendedores
</h2>
<h1>${totalRevendedores}</h1>
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
🟢 Activos
</h2>
<h1>${activos}</h1>
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
🔴 Suspendidos
</h2>
<h1>${suspendidos}</h1>
</div>

</div>

<h2 style="color:cyan;">
📋 Revendedores
</h2>

<table>

<tr>
<th>Nombre</th>
<th>Usuario</th>
<th>WhatsApp</th>
<th>Estado</th>
<th>Inicio</th>
<th>Vencimiento</th>
<th>Acciones</th>
</tr>

${filasUsuarios}

</table>

<h2 style="color:cyan;">
📜 Historial OTP
</h2>

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

<meta charset="UTF-8">

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

        req.session.save(() => {
    res.redirect("/admin");
});
        return;

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