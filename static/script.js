let processando = false;
let modoContinuo = false;

let chats = [];
let chatAtualId = null;

window.onload = function(){
    carregarChats();

    if(chats.length === 0){
        criarChatInicial();
    }else{
        chatAtualId = chats[0].id;
        renderizarListaChats();
        carregarChat(chatAtualId);
    }
};

function salvarChats(){
    localStorage.setItem("chatsIA", JSON.stringify(chats));
}

function carregarChats(){
    let dados = localStorage.getItem("chatsIA");

    if(dados){
        chats = JSON.parse(dados);
    }
}

function criarChatInicial(){
    let novo = {
        id: Date.now(),
        titulo: "Chat 1",
        mensagensHTML: ""
    };

    chats.push(novo);
    chatAtualId = novo.id;

    salvarChats();
    renderizarListaChats();
    carregarChat(chatAtualId);
}

function novoChat(){
    salvarChatAtual();

    let novo = {
        id: Date.now(),
        titulo: "Chat " + (chats.length + 1),
        mensagensHTML: ""
    };

    chats.unshift(novo);
    chatAtualId = novo.id;

    salvarChats();
    renderizarListaChats();
    carregarChat(chatAtualId);
}

function carregarChat(id){
    chatAtualId = id;

    let chat = chats.find(c => c.id === id);

    if(!chat) return;

    document.getElementById("mensagens").innerHTML =
        chat.mensagensHTML;

    document.getElementById("titulo-chat").innerText =
        chat.titulo;

    renderizarListaChats();
}

function salvarChatAtual(){
    let chat = chats.find(c => c.id === chatAtualId);

    if(!chat) return;

    chat.mensagensHTML =
        document.getElementById("mensagens").innerHTML;

    salvarChats();
}

function renderizarListaChats(){
    let lista = document.getElementById("lista-chats");

    lista.innerHTML = "";

    chats.forEach(chat => {
        let item = document.createElement("div");

        item.className = "chat-item";

        if(chat.id === chatAtualId){
            item.classList.add("ativo");
        }

        item.innerText = "💬 " + chat.titulo;

        item.onclick = function(){
            salvarChatAtual();
            carregarChat(chat.id);
        };

        lista.appendChild(item);
    });
}

function excluirChatAtual(){
    if(!confirm("Deseja excluir este chat?")) return;

    chats = chats.filter(c => c.id !== chatAtualId);

    if(chats.length === 0){
        criarChatInicial();
        return;
    }

    chatAtualId = chats[0].id;

    salvarChats();
    renderizarListaChats();
    carregarChat(chatAtualId);
}

function pararVoz(){
    speechSynthesis.cancel();
}

function falar(texto){

    speechSynthesis.cancel();

    let voz = new SpeechSynthesisUtterance(texto);

    voz.lang = "pt-BR";
    voz.rate = 1;
    voz.pitch = 1;

    voz.onend = function(){
        if(modoContinuo && !processando){
            setTimeout(() => {
                iniciarMicrofone();
            }, 700);
        }
    };

    speechSynthesis.speak(voz);
}

function alternarModoContinuo(){

    modoContinuo = !modoContinuo;

    let botao = document.getElementById("btn-continuo");

    if(modoContinuo){
        botao.innerText = "🟢 Voz ativa";
        iniciarMicrofone();
    }else{
        botao.innerText = "🔁 Voz contínua";
        speechSynthesis.cancel();
    }
}

function iniciarMicrofone(){

    if(processando) return;

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if(!SpeechRecognition){
        alert("Seu navegador não suporta reconhecimento de voz.");
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.start();

    recognition.onresult = function(event){

        let texto =
            event.results[0][0].transcript;

        document.getElementById("pergunta").value = texto;

        enviar();
    };

    recognition.onerror = function(event){

        console.log("Erro no microfone:", event.error);

        if(modoContinuo && !processando){
            setTimeout(() => {
                iniciarMicrofone();
            }, 1200);
        }
    };
}

async function enviar(){

    if(processando) return;

    let pergunta = document.getElementById("pergunta");
    let texto = pergunta.value.trim();

    if(texto === "") return;

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
    salvarChatAtual();

    try{

        let resposta = await fetch("/chat", {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                mensagem:texto
            })
        });

        let dados = await resposta.json();

        document.getElementById(idResposta).innerHTML = `
            🤖 <b>Assistente</b><br>
            ${dados.resposta}
        `;

        salvarChatAtual();

        falar(dados.resposta);

    }catch(erro){

        document.getElementById(idResposta).innerHTML = `
            ❌ <b>Erro</b><br>
            ${erro}
        `;

        console.error(erro);
        salvarChatAtual();
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