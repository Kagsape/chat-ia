import os
from flask import Flask, render_template, request, jsonify
from groq import Groq

app = Flask(__name__)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

historico = []

with open("escola.txt", "r", encoding="utf-8") as arquivo:
    informacoes_escola = arquivo.read()

PROMPT_SISTEMA = f"""
Você é um assistente virtual da escola.

Informações da escola:

{informacoes_escola}

Regras:
- Responda sempre em português.
- Seja educado.
- Ajude alunos e visitantes.
- Utilize as informações da escola quando possível.
"""

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():

    try:

        mensagem = request.json["mensagem"]

        historico.append({
            "role": "user",
            "content": mensagem
        })

        mensagens = [
            {
                "role": "system",
                "content": PROMPT_SISTEMA
            }
        ]

        mensagens.extend(historico[-10:])

        resposta = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=mensagens
        )

        texto = resposta.choices[0].message.content

        historico.append({
            "role": "assistant",
            "content": texto
        })

        return jsonify({
            "resposta": texto
        })

    except Exception as erro:

        return jsonify({
            "resposta": f"Erro: {erro}"
        })

if __name__ == "__main__":
    app.run(debug=True)