let processando = false;

function falar(texto){

    speechSynthesis.cancel();

    let voz = new SpeechSynthesisUtterance(texto);

    voz.lang = "pt-BR";

    voz.rate = 1;

    voz.pitch = 1;

    speechSynthesis.speak(voz);
}

function iniciarMicrofone(){

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if(!SpeechRecognition){

        alert("Seu navegador não suporta reconhecimento de voz.");

        return;
    }

    const recognition =
        new SpeechRecognition();

    recognition.lang = "pt-BR";

    recognition.interimResults = false;

    recognition.start();

    recognition.onstart = function(){

        console.log("Microfone ativo");
    };

    recognition.onresult = function(event){

        let texto =
            event.results[0][0].transcript;

        document
            .getElementById("pergunta")
            .value = texto;

        enviar();
    };

    recognition.onerror = function(event){

        console.log(event.error);

        alert("Erro ao usar microfone.");
    };
}

async function enviar() {

    if (processando) return;

    let pergunta =
        document.getElementById("pergunta");

    let texto =
        pergunta.value.trim();

    if (texto === "")
        return;

    processando = true;

    let mensagens =
        document.getElementById("mensagens");

    let botoes =
        document.querySelectorAll("button");

    botoes.forEach(btn => btn.disabled = true);

    mensagens.innerHTML += `
        <div class="user">
            👤 <b>Você</b><br>
            ${texto}
        </div>
    `;

    pergunta.value = "";

    let idResposta =
        "resp_" + Date.now();

    mensagens.innerHTML += `
        <div class="bot" id="${idResposta}">
            🤖 <b>Assistente</b><br>
            🤔 Pensando...
        </div>
    `;

    mensagens.scrollTop =
        mensagens.scrollHeight;

    try {

        let resposta =
            await fetch("/chat", {

                method: "POST",

                headers: {
                    "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                    mensagem: texto
                })

            });

        let dados =
            await resposta.json();

        document
            .getElementById(idResposta)
            .innerHTML = `
                🤖 <b>Assistente</b><br>
                ${dados.resposta}
            `;

        falar(dados.resposta);

    }

    catch (erro) {

        document
            .getElementById(idResposta)
            .innerHTML = `
                ❌ <b>Erro</b><br>
                ${erro}
            `;

        console.error(erro);
    }

    processando = false;

    botoes.forEach(btn => btn.disabled = false);

    mensagens.scrollTop =
        mensagens.scrollHeight;
}

document
.getElementById("pergunta")
.addEventListener("keypress",

function(event){

    if(event.key === "Enter"){

        enviar();

    }

});