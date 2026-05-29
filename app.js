let plataformaSeleccionada = "amazon";
let ultimoOTP = "";
let tipoSpotify = "login";

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
    }

    if (plataforma === "crunchyroll") {
        document
        .querySelector(".crunchy")
        .classList.add("active");
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
        const response =
await fetch(
`/otp?plataforma=${plataformaSeleccionada}&correo=${correo}&tipo=${tipoSpotify}`
);

        const data =
        await response.json();

if(
plataformaSeleccionada === "spotify"
&&
tipoSpotify === "password"
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
plataformaSeleccionada === "spotify"
&&
tipoSpotify === "password"
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