let plataformaSeleccionada = "amazon";
let ultimoOTP = "";
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

    if(plataformaSeleccionada !== "amazon"){

        resultado.innerHTML =
        "⚠️ Esta plataforma aún no tiene OTP automático";

        return;
    }

    resultado.innerHTML =
'<span class="loader">🔎 Buscando código</span>';
monitoreandoOTP = true;
yaConsulto = true;
    try {

        const response =
        await fetch(
            `/otp?plataforma=${plataformaSeleccionada}&correo=${correo}`
        );

        const data =
        await response.json();

        if (
            data.otp &&
            data.otp !== "No encontrado" &&
            data.otp !== "Error"
        ) {
if(data.otp === ultimoOTP){

    return;

}

ultimoOTP = data.otp;
            resultado.innerHTML = `

🔐 Código OTP: ${data.otp}

<br><br>

<small>

Cuenta:<br>

${correo}

</small>

`;

resultado.classList.add("otp-animation");

const sonido =
document.getElementById("otpSound");

sonido.currentTime = 0;

sonido.play()
.then(() => {

    console.log("Sonido OTP OK");

})
.catch((error) => {

    console.log(
        "Error sonido:",
        error
    );

});

setTimeout(() => {
    resultado.classList.remove("otp-animation");
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