# 📱 XMLPhone — Web OS Simulator  
**Uma Engine de Jogo Web baseada na interpretação dinâmica de arquivos XML**

![Status](https://img.shields.io/badge/Status-Ativo-brightgreen)
![License](https://img.shields.io/badge/Licen%C3%A7a-Educacional-blue)
![Made With](https://img.shields.io/badge/Feito%20com-HTML%20%7C%20CSS%20%7C%20JS-orange)
![Deploy](https://img.shields.io/badge/Deploy-Netlify-green)
![XML](https://img.shields.io/badge/Parser-XML-blueviolet)

---

## 🔗 Acesso Online (Live Demo)

Você pode acessar e testar o projeto diretamente no navegador:

👉 **https://smartphoni.netlify.app/**

---

## 📄 Sobre o Projeto

Este projeto foi desenvolvido como requisito avaliativo da disciplina  
**Programação para Web I — IFBA (Instituto Federal da Bahia)**.

O objetivo foi criar uma aplicação **client-side (“Motor”)** capaz de:

- Ler e interpretar dinamicamente um arquivo **XML externo**
- Renderizar uma interface simulando um **Smartphone**
- Executar **jogos**, **músicas**, **galeria** e apps completos
- Manipular a estrutura XML **em tempo real (CRUD na memória)**
- Controlar janelas, tela inicial, status, e navegação

---

## ✨ Funcionalidades Principais

### 🚀 **Launcher & Sistema Operacional**
- **Interface dinâmica baseada no XML**
- **Barra de Status:** relógio em tempo real, bateria, rede
- **Sistema de janelas:** abrir, fechar, modal, botão Home
- **Papel de parede configurável**

---

### 🎮 **Arcade – Hub de Jogos**
Jogos feitos em JavaScript puro + Canvas:

- **🐍 Snake (Cobrinha)**  
  Pontuação, colisões, efeitos sonoros e velocidade progressiva

- **🦖 Dino Runner**  
  Jogo endless runner com gravidade, sprites e obstáculos aleatórios

- **🃏 Jogo da Memória**  
  Com ícones do Bootstrap e lógica completa de pares

---

### 🎵 **Multimídia Completa**
- **Music Player funcional**  
- Suporte a **MP3** via URLs  
- Controles: *Play*, *Pause*, *Next*, *Previous*  
- **Barra de progresso sincronizada**  
- Metadados (capa, artista, música) carregados do XML  
- **Galeria**: carrossel navegável de imagens

---

### 🛠️ **Produtividade & Ferramentas**
- **To-Do List**  
  - CRUD completo diretamente no XML em memória  
  - Persistência lógica e atualização instantânea

- **Calculadora**  
- **Relógio** com:
  - Hora mundial  
  - Cronômetro  
  - Alarme  

- **Configurações**  
  - Alterar papel de parede  
  - Visualizar armazenamento simulado  

- **Sobre**  
  - Exibe especificações fictícias do dispositivo

---

## 🔧 Como Rodar o Projeto Localmente

⚠️ **IMPORTANTE:**  
Como o projeto usa **XMLHttpRequest**, ele **NÃO funciona** ao abrir o `index.html` clicando duas vezes.  
Os navegadores bloqueiam por política de **CORS**.

Use um dos servidores abaixo:

---

### ✅ **Opção 1: VS Code (Recomendada)**

1. Instale a extensão **Live Server**  
2. Abra o projeto no VS Code  
3. Clique com o botão direito no `index.html`  
4. Clique em **Open with Live Server**

---

### 🐍 Opção 2: Python

Se tiver Python instalado, abra o terminal na pasta do projeto e rode:

```bash
# Python 3.x
python -m http.server
```
Acesse http://localhost:8000 no navegador.

### 🟦 Opção 3: Node.js

Se tiver o pacote **http-server** instalado globalmente, execute:

```bash
http-server .
```

## 📂 Estrutura de Arquivos

- **index.html:** Estrutura base; importa Bootstrap, jQuery e define a “carcaça” do smartphone.  
- **style.css:** Estilização personalizada, animações, responsividade e design dos aplicativos.  
- **motor.js:** O cérebro da aplicação. Contém toda a lógica de interpretação do XML, mecânica dos jogos, controle de áudio e manipulação do DOM.  
- **dados.xml:** O “Banco de Dados” do sistema. Define os aplicativos exibidos, músicas da playlist, tarefas iniciais e configurações gerais.  

---

## 📝 Licença

Este projeto foi desenvolvido para **fins educacionais**.  
Sinta-se livre para **usar, estudar, modificar e expandir**.
