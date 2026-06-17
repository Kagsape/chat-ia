let processando = false;
let modoContinuo = false;

window.onload = function () {
    carregarConversa();
};

function salvarConversa() {
    let mensagens = document.getElementById("mensagens").innerHTML;
    localStorage.setItem("conversaIA", mensagens);
}

function carregarConversa() {
    let conversaSalva = localStorage.getItem("conversaIA");

    if (conversaSalva) {
        document.getElementById("mensagens").innerHTML = conversaSalva;
    }
}

function limparConversa() {
    localStorage.removeItem("conversaIA");
    document.getElementById("mensagens").innerHTML = "";
}

function falar(texto) {

    speechSynthesis.cancel();

    let voz = new SpeechSynthesisUtterance(texto);

    voz.lang = "pt-BR";
    voz.rate = 1;
    voz.pitch = 1;

    voz.onend = function () {
        if (modoContinuo && !processando) {
            setTimeout(() => {
                iniciarMicrofone();
            }, 700);
        }
    };

    speechSynthesis.speak(voz);
}

function alternarModoContinuo() {

    modoContinuo = !modoContinuo;

    let botao = document.getElementById("btn-continuo");

    if (modoContinuo) {
        botao.innerText = "🟢 Voz ativa";
        iniciarMicrofone();
    } else {
        botao.innerText = "🔁 Voz contínua";
        speechSynthesis.cancel();
    }
}

function iniciarMicrofone() {

    if (processando) return;

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Seu navegador não suporta reconhecimento de voz.");
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.start();

    recognition.onstart = function () {
        console.log("Microfone ativo...");
    };

    recognition.onresult = function (event) {

        let texto = event.results[0][0].transcript;

        document.getElementById("pergunta").value = texto;

        enviar();
    };

    recognition.onerror = function (event) {
        console.log("Erro no microfone:", event.error);

        if (modoContinuo && !processando) {
            setTimeout(() => {
                iniciarMicrofone();
            }, 1200);
        }
    };
}

async function enviar() {

    if (processando) return;

    let pergunta = document.getElementById("pergunta");
    let texto = pergunta.value.trim();

    if (texto === "") return;

    processando = true;

    let mensagens = document.getElementById("mensagens");
    let botoes = document.querySelectorAll("button");

    botoes.forEach(btn => btn.disabled = true);

    mensagens.innerHTML += `
        <div class="user">
            👤 <b>Você</b><br>
            ${texto}
        </div>
    `;

    pergunta.value = "";

    let idResposta = "resp_" + Date.now();

    mensagens.innerHTML += `
        <div class="bot" id="${idResposta}">
            🤖 <b>Assistente</b><br>
            🤔 Pensando...
        </div>
    `;

    mensagens.scrollTop = mensagens.scrollHeight;
    salvarConversa();

    try {

        let resposta = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mensagem: texto
            })
        });

        let dados = await resposta.json();

        document.getElementById(idResposta).innerHTML = `
            🤖 <b>Assistente</b><br>
            ${dados.resposta}
        `;

        salvarConversa();

        falar(dados.resposta);

    } catch (erro) {

        document.getElementById(idResposta).innerHTML = `
            ❌ <b>Erro</b><br>
            ${erro}
        `;

        console.error(erro);
        salvarConversa();
    }

    processando = false;

    botoes.forEach(btn => btn.disabled = false);

    mensagens.scrollTop = mensagens.scrollHeight;
}

document
.getElementById("pergunta")
.addEventListener("keypress", function(event){

    if(event.key === "Enter"){
        enviar();
    }

});