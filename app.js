let plataformaSeleccionada = "amazon";
let ultimoOTP = "";
let tipoSpotify = "login";
let tipoMax = "login";
let tipoCrunchy = "login";

function seleccionarSpotify(tipo){

    tipoSpotify = tipo;

    document
    .querySelectorAll(".spotify-btn")
    .forEach(btn => btn.classList.remove("active"));

    if(tipo === "login"){

        document
        .getElementById("btnLogin")
        .classList.add("active");

    }else{

        document
        .getElementById("btnPassword")
        .classList.add("active");

    }

    const botonConsultar =
    document.querySelector(".consultar");

    if(tipo === "password"){

        botonConsultar.innerText =
        "Obtener Link";

    }else{

        botonConsultar.innerText =
        "Consultar Código";

    }

}

function seleccionarMax(tipo){

    tipoMax = tipo;

    document
    .querySelectorAll(".max-btn")
    .forEach(btn => btn.classList.remove("active"));

    if(tipo === "login"){

        document
        .getElementById("btnMaxLogin")
        .classList.add("active");

    }else{

        document
        .getElementById("btnMaxPassword")
        .classList.add("active");

    }

    const botonConsultar =
    document.querySelector(".consultar");

    if(tipo === "password"){

        botonConsultar.innerText =
        "Obtener Link";

    }else{

        botonConsultar.innerText =
        "Consultar Código";

    }

}

function seleccionarCrunchy(tipo){

    tipoCrunchy = tipo;

    document
    .querySelectorAll(".crunchy-btn")
    .forEach(btn => btn.classList.remove("active"));

    if(tipo === "login"){

        document
        .getElementById("btnCrunchyLogin")
        .classList.add("active");

    }else{

        document
        .getElementById("btnCrunchyPassword")
        .classList.add("active");

    }

    const botonConsultar =
    document.querySelector(".consultar");

    if(tipo === "password"){

        botonConsultar.innerText =
        "Obtener Link";

    }else{

        botonConsultar.innerText =
        "Obtener Link";

    }

}

function seleccionar(plataforma) {

    plataformaSeleccionada = plataforma;

    document
    .querySelectorAll(".card")
    .forEach(btn => {
        btn.classList.remove("active");
    });

    if (plataforma === "netflix") {
        document
        .querySelector(".netflix")
        .classList.add("active");
    }

    if (plataforma === "amazon") {
        document
        .querySelector(".prime")
        .classList.add("active");
    }

    if (plataforma === "disney") {
        document
        .querySelector(".disney")
        .classList.add("active");
    }

    if (plataforma === "spotify") {

        document
        .querySelector(".spotify")
        .classList.add("active");

        document.getElementById(
            "spotifyOpciones"
        ).style.display = "block";

        seleccionarSpotify(
            tipoSpotify
        );

    } else {

        const spotifyBox =
        document.getElementById(
            "spotifyOpciones"
        );

        if(spotifyBox){

            spotifyBox.style.display =
            "none";

        }

    }

    if (plataforma === "max") {

    document
    .querySelector(".max")
    .classList.add("active");

    document.getElementById(
        "maxOpciones"
    ).style.display = "block";

    seleccionarMax(
        tipoMax
    );

} else {

    const maxBox =
    document.getElementById(
        "maxOpciones"
    );

    if(maxBox){

        maxBox.style.display =
        "none";

    }

}

    if (plataforma === "crunchyroll") {

    document
    .querySelector(".crunchy")
    .classList.add("active");

    document.getElementById(
        "crunchyOpciones"
    ).style.display = "block";

    seleccionarCrunchy(
        tipoCrunchy
    );

} else {

    const crunchyBox =
    document.getElementById(
        "crunchyOpciones"
    );

    if(crunchyBox){

        crunchyBox.style.display =
        "none";

    }

}

async function consultarCodigo() {

    const resultado =
    document.getElementById("resultado");

    const correo =
    document.getElementById("correo").value;

    if(correo === ""){

        resultado.innerHTML =
        "📧 Ingresa tu correo primero";

        return;
    }

    if(

plataformaSeleccionada !== "amazon"

&&

plataformaSeleccionada !== "disney"

&&

plataformaSeleccionada !== "max"

&&

plataformaSeleccionada !== "spotify"

&&

plataformaSeleccionada !== "crunchyroll"

){

    resultado.innerHTML =
    "⚠️ Esta plataforma aún no tiene OTP automático";

    return;

}

    resultado.innerHTML =
'<span class="loader">🔎 Buscando código</span>';
monitoreandoOTP = true;
yaConsulto = true;
    try {
         const validar =
await fetch("/validar-cuenta", {

    method: "POST",

    headers: {

        "Content-Type":
        "application/json"

    },

    body: JSON.stringify({

        correo,

        plataforma:
        plataformaSeleccionada

    })

});

const dataCuenta =
await validar.json();

if(!dataCuenta.success){

    resultado.innerHTML =
    "❌ Cuenta no existe";

    return;

}
const tipoActual =

plataformaSeleccionada === "spotify"
? tipoSpotify

:

plataformaSeleccionada === "max"
? tipoMax

:

plataformaSeleccionada === "crunchyroll"
? tipoCrunchy

:

"login";

const response =
await fetch(
`/otp?plataforma=${plataformaSeleccionada}&correo=${correo}&tipo=${tipoActual}`
);

        const data =
        await response.json();

if(

(plataformaSeleccionada === "spotify"
&& tipoSpotify === "password")

||

(plataformaSeleccionada === "max"
&& tipoMax === "password")

){

    resultado.innerHTML = `

🔓 Enlace de recuperación

<br><br>

<a href="${data.link}"
target="_blank"
style="
color:cyan;
font-size:20px;
font-weight:bold;
">

Abrir enlace de recuperación

</a>

`;

    return;
}

        if (
            data.otp &&
            data.otp !== "No encontrado" &&
            data.otp !== "Error"
        ) {
if(data.otp === ultimoOTP){

    return;

}

ultimoOTP = data.otp;

if(

(plataformaSeleccionada === "spotify"
&& tipoSpotify === "password")

||

(plataformaSeleccionada === "max"
&& tipoMax === "password")

){

resultado.innerHTML = `

🔓 Link de restablecimiento

<br><br>

<a href="${data.otp}"
target="_blank"
style="
color:cyan;
font-size:18px;
word-break:break-all;
">

Abrir enlace de recuperación

</a>

<br><br>

<small>

Cuenta:<br>

${correo}

</small>

`;

}else{

resultado.innerHTML = `🔐 Código OTP: ${data.otp}`;

}

resultado.classList.add(
    "otp-animation"
);

const sonido =
document.getElementById(
    "otpSound"
);

sonido.currentTime = 0;

sonido.play()

.then(() => {

    console.log(
        "Sonido OTP OK"
    );

})

.catch((error) => {

    console.log(
        "Error sonido:",
        error
    );

});

setTimeout(() => {

    resultado.classList.remove(
        "otp-animation"
    );

}, 1500);

        } else {

            resultado.innerHTML =
            "❌ Código no encontrado";

        }

    } catch (error) {

        console.log(error);

        resultado.innerHTML =
        "❌ Error obteniendo OTP";

    }

}