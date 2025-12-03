var sistemaMemoria = null;

// --- SISTEMA ---
var relogioIntervalo = null;
var alarmeHora = null; 
var alarmeAtivo = false;
var cronometroIntervalo = null; 
var cronometroSegundos = 0; 
var cronometroRodando = false;

// --- CALCULADORA ---
var calcDisplay="0"; 
var calcExpressao=""; 
var calcUltimoResultado=null; 
var calcOperadorAtual=null; 
var calcAguardandoOperando=true;

// --- MÚSICA ---
var musicasLista=[]; 
var musicaIndiceAtual=0; 
var audioPlayer=new Audio();

// --- ÁUDIO E EFEITOS (NOVO) ---
var gameAudio = new Audio();
gameAudio.loop = true;
gameAudio.volume = 0.2;
var sonsJogos = {
    snake: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    memoria: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3", 
    dino: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
};
// Contexto de Áudio para efeitos sonoros (Beeps, Pulos)
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// --- CONTROLE GERAL DE JOGOS ---
var teclasPressionadas = {}; 
var jogoAtual = null; // "snake", "dino" ou null

// --- SNAKE ---
var snakeIntervalo = null;
var ctx = null;
var snake = [];
var tamBloco = 20; 
var comida = {x: 0, y: 0};
var dx = 0; dy = 0; 
var pontosSnake = 0;
var canvasWidth = 280; var canvasHeight = 340; 

// --- MEMÓRIA ---
var cartasMemoria = [];
var cartasViradas = [];
var paresEncontrados = 0;
var bloqueioMemoria = false;
var iconesMemoria = ["bi-star-fill", "bi-heart-fill", "bi-lightning-fill", "bi-music-note-beamed", "bi-flower1", "bi-trophy-fill"];

// --- DINO RUNNER ---
var dinoIntervalo = null;
var dinoCtx = null;
var dinoImg = new Image(); dinoImg.src = 'https://img.icons8.com/ios-filled/100/000000/dinosaur.png'; 
var cactoImg = new Image(); cactoImg.src = 'https://img.icons8.com/ios-filled/50/000000/cactus.png'; 
var dinoObj = {x: 30, y: 0, w: 40, h: 40, dy: 0, jumpPower: -9, gravity: 0.5, grounded: false};
var obstaculos = [];
var frameDino = 0;
var pontosDino = 0;
var velocidadeJogo = 3;
var tempoAteProximoObs = 0;

// ============================================
// ============ INICIALIZAÇÃO =================
// ============================================

$(document).ready(function() {
    iniciarMotor();
    relogioIntervalo = setInterval(atualizarRelogioSistema, 1000);
    $("#home-btn").click(fecharApp);
    
    // --- CONTROLES GLOBAIS DE TECLADO ---
    $(document).keydown(function(e) {
        teclasPressionadas[e.keyCode] = true;
        
        // Verifica qual jogo está rodando
        if (jogoAtual === "snake") {
            mudarDirecaoSnake(e);
            if([37,38,39,40].includes(e.keyCode)) e.preventDefault();
        }
        else if (jogoAtual === "dino") {
            if(e.keyCode === 32 || e.keyCode === 38) { pularDino(); e.preventDefault(); }
        }
    });
    
    $(document).keyup(function(e) {
        teclasPressionadas[e.keyCode] = false;
    });
    
    // Áudio
    audioPlayer.addEventListener('timeupdate', function() {
        if(audioPlayer.duration) $("#music-bar").css("width", (audioPlayer.currentTime/audioPlayer.duration)*100 + "%");
    });
    audioPlayer.addEventListener('ended', musicaProxima);
    audioPlayer.addEventListener('error', function(e) { console.log("Erro áudio:", e); });
});

function iniciarMotor() {
    var urlNoCache = "dados.xml?v=" + new Date().getTime();
    $.ajax({ type: "GET", url: urlNoCache, dataType: "xml",
        success: function(xml) { sistemaMemoria = xml; carregarDadosMusica(); renderizarTela(); },
        error: function() { alert("Erro ao carregar XML."); }
    });
}

function carregarDadosMusica() {
    musicasLista = [];
    $(sistemaMemoria).find('musicas faixa').each(function() {
        musicasLista.push({ titulo: $(this).attr('titulo'), artista: $(this).attr('artista'), capa: $(this).attr('capa'), arquivo: $(this).attr('arquivo') });
    });
}

function renderizarTela() {
    $("#loading").hide();
    var config = $(sistemaMemoria).find('configuracao');

    var iconesStatus = `
        <i class="bi bi-wifi ms-0" title="Wi-Fi Conectado"></i>
        <i class="bi bi-reception-4 ms-0" title="Sinal Forte"></i>
    `;

    $("#bateria-display").html(iconesStatus + config.find('bateria').text() + ' <i class="bi bi-battery-full"></i>');
    $("#screen").css("background-image", "url(" + config.find('fundo').text() + ")");
    atualizarRelogioSistema();
    var grid = $("#app-grid"); grid.empty();
    
    // Ordena os apps alfabeticamente
    var apps = $(sistemaMemoria).find('apps app').get();
    apps.sort(function(a, b) {
        var nomeA = $(a).attr('nome').toUpperCase();
        var nomeB = $(b).attr('nome').toUpperCase();
        return (nomeA < nomeB) ? -1 : (nomeA > nomeB) ? 1 : 0;
    });
    
    $.each(apps, function(idx, item) {
        var nome = $(item).attr('nome'); var icone = $(item).attr('icone'); var corBtn = $(item).attr('cor');
        grid.append(`<div class="col-4 mb-3"><div class="app-container" onclick="abrirApp('${nome}')"><div class="app-icon ${corBtn} shadow"><i class="bi ${icone}"></i></div><div class="app-label">${nome}</div></div></div>`);
    });
}

function atualizarRelogioSistema() {
    var agora = new Date();
    var horaFmt = String(agora.getHours()).padStart(2,'0')+":"+String(agora.getMinutes()).padStart(2,'0');
    $("#hora-display").text(horaFmt);
    if ($("#relogio-grande").length) $("#relogio-grande").text(horaFmt+":"+String(agora.getSeconds()).padStart(2,'0'));
    if (alarmeHora === horaFmt && !alarmeAtivo) { alarmeAtivo=true; alert("⏰ ALARME!"); }
    if (alarmeHora !== horaFmt) alarmeAtivo = false;
}

// ============================================
// ============ GERENCIADOR DE APPS ===========
// ============================================

function abrirApp(nome) {
    $("#app-title").text(nome);
    var conteudo = "";

    if (nome === "Arcade") {
        conteudo = `
            <div class="container mt-3">
                <div id="arcade-menu">
                    <h5 class="text-center mb-4">Escolha seu Jogo</h5>
                    <div class="row g-3 justify-content-center">
                        <div class="col-6"><div class="game-card bg-success p-3 text-center text-white rounded shadow-sm" onclick="iniciarSnakeUI()"><i class="bi bi-controller fs-1 mb-2"></i><div class="small fw-bold">Snake</div></div></div>
                        <div class="col-6"><div class="game-card bg-warning p-3 text-center text-dark rounded shadow-sm" onclick="iniciarMemoriaUI()"><i class="bi bi-grid-3x3 fs-1 mb-2"></i><div class="small fw-bold">Memória</div></div></div>
                        <div class="col-6 mt-2"><div class="game-card bg-dark p-3 text-center text-white rounded shadow-sm" onclick="iniciarDinoUI()"><i class="bi bi-cone-striped fs-1 mb-2"></i><div class="small fw-bold">Dino</div></div></div>
                    </div>
                </div>
                <div id="game-stage" style="display:none; height:100%; position:relative;">
                    <div class="d-flex justify-content-between px-2 mb-2 align-items-center">
                        <span class="fw-bold" id="game-info">Pontos: 0</span>
                        <button class="btn btn-sm btn-outline-dark" onclick="voltarArcade()">Sair</button>
                    </div>
                    <!-- Containers -->
                    <div id="snake-container" style="display:none; flex-direction:column; align-items:center;">
                        <div style="position:relative;">
                            <canvas id="canvas-cobrinha" width="280" height="340" style="background:#222; border-radius:5px;"></canvas>
                            <div id="snake-overlay" class="game-overlay"><h3 class="text-danger fw-bold mb-3">GAME OVER</h3><button class="btn btn-light fw-bold" onclick="iniciarSnakeUI()">Reiniciar</button></div>
                        </div>
                        <div class="mt-2 text-center small text-muted">Use as setas</div>
                    </div>
                    
                    <div id="memoria-container" style="display:none;">
                        <div class="row g-2 justify-content-center" id="grid-memoria"></div>
                        <div class="mt-4 text-center"><button class="btn btn-sm btn-outline-primary" onclick="iniciarMemoriaUI()">Reiniciar</button></div>
                    </div>
                    
                    <div id="dino-container" style="display:none; flex-direction:column; align-items:center;">
                        <div style="position:relative;">
                            <canvas id="canvas-dino" width="280" height="340" style="background:#fff; border-radius:5px; border: 2px solid #ccc;"></canvas>
                            <div id="dino-overlay" class="game-overlay"><h3 class="text-danger fw-bold mb-3">GAME OVER</h3><button class="btn btn-light fw-bold" onclick="iniciarDinoUI()">Reiniciar</button></div>
                        </div>
                        <div class="mt-2 text-center small text-muted">Espaço: Pular</div>
                    </div>
                </div>
            </div>`;
    }
    // --- CONFIGURAÇÕES ---
    else if (nome === "Configurações") {
        var listaWp = ""; 
        $(sistemaMemoria).find('wallpapers wp').each(function() { 
            var url = $(this).attr('url'); var nomeWp = $(this).attr('nome'); 
            listaWp += `<div class="col-6 mb-3"><img src="${url}" class="wp-thumb shadow-sm" onclick="mudarWallpaper('${url}')"><div class="text-center small mt-1 text-muted">${nomeWp}</div></div>`; 
        });
        
        var totalApps = $('app', sistemaMemoria).length + 3;

        conteudo = `
            <div class="container mt-3">
                <div class="text-center mb-4"><i class="bi bi-gear" style="font-size: 2rem;"></i><h4>Ajustes</h4></div>
                <div class="card mb-3">
                    <div class="card-header bg-white fw-bold">Papel de Parede</div>
                    <div class="card-body"><div class="row">${listaWp}</div></div>
                </div>
                <div class="list-group">
                    <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onclick="mostrarDetalhesApps()"><span><i class="bi bi-app-indicator me-2 text-purple"></i> Apps & Armazenamento</span><div><span class="badge bg-secondary me-2">${totalApps}</span><i class="bi bi-chevron-right small text-muted"></i></div></a>
                    <div class="list-group-item d-flex justify-content-between align-items-center"><span><i class="bi bi-bluetooth me-2 text-primary"></i> Bluetooth</span><span class="badge bg-danger">Off</span></div>
                    <div class="list-group-item d-flex justify-content-between align-items-center"><span><i class="bi bi-wifi me-2 text-success"></i> Wi-Fi</span><span class="badge bg-success">On</span></div>
                    <div class="list-group-item d-flex justify-content-between align-items-center"><span><i class="bi bi-battery-full me-2 text-info"></i> Bateria</span><span class="badge bg-info">${$('bateria', sistemaMemoria).text()}</span></div>
                </div>
            </div>`;
    }
    // ... (Outros apps mantidos iguais) ...
    else if (nome === "Relógio") {
        conteudo = `<ul class="nav nav-tabs justify-content-center mb-4"><li class="nav-item"><a class="nav-link active" onclick="mostrarAbaRelogio('hora')">Hora</a></li><li class="nav-item"><a class="nav-link" onclick="mostrarAbaRelogio('crono')">Cronômetro</a></li><li class="nav-item"><a class="nav-link" onclick="mostrarAbaRelogio('alarme')">Alarme</a></li></ul><div id="tab-hora" class="text-center mt-5"><div id="relogio-grande" class="digital-clock">--:--:--</div><p class="text-muted" id="data-hoje"></p></div><div id="tab-crono" class="text-center mt-5" style="display:none;"><div id="display-cronometro" class="digital-clock">00:00:00</div><div class="mt-4"><button class="btn btn-success" onclick="iniciarCrono()"><i class="bi bi-play-fill"></i></button> <button class="btn btn-warning" onclick="pausarCrono()"><i class="bi bi-pause-fill"></i></button> <button class="btn btn-danger" onclick="zerarCrono()"><i class="bi bi-arrow-counterclockwise"></i></button></div></div><div id="tab-alarme" class="text-center mt-5" style="display:none;"><h4>Definir Alarme</h4><input type="time" id="input-alarme" class="form-control w-50 mx-auto my-3" style="font-size: 1.5rem;"><button class="btn btn-primary" onclick="salvarAlarme()">Ativar</button><div id="msg-alarme" class="mt-3 text-success fw-bold" style="display:none;">Alarme definido: <span id="span-alarme-hora"></span></div></div>`;
    }
    else if (nome === "Calculadora") {
        conteudo = `<div class="container mt-3"><div class="text-center mb-3"><i class="bi bi-calculator" style="font-size: 2rem;"></i><h5>Calculadora</h5></div><div class="card mb-3"><div class="card-body p-2"><div id="display" class="text-end fs-3 mb-2" style="min-height:50px; overflow:hidden;">0</div><div id="expressao" class="text-end text-muted small" style="min-height:20px;"></div></div></div><div class="row g-2"><div class="col-3"><button class="btn btn-danger w-100 py-3" onclick="calcLimpar()">C</button></div><div class="col-3"><button class="btn btn-warning w-100 py-3" onclick="calcOperador('/')">÷</button></div><div class="col-3"><button class="btn btn-warning w-100 py-3" onclick="calcOperador('*')">×</button></div><div class="col-3"><button class="btn btn-warning w-100 py-3" onclick="calcApagar()">⌫</button></div><div class="col-3"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('7')">7</button></div><div class="col-3"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('8')">8</button></div><div class="col-3"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('9')">9</button></div><div class="col-3"><button class="btn btn-warning w-100 py-3" onclick="calcOperador('-')">-</button></div><div class="col-3"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('4')">4</button></div><div class="col-3"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('5')">5</button></div><div class="col-3"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('6')">6</button></div><div class="col-3"><button class="btn btn-warning w-100 py-3" onclick="calcOperador('+')">+</button></div><div class="col-3"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('1')">1</button></div><div class="col-3"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('2')">2</button></div><div class="col-3"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('3')">3</button></div><div class="col-3"><button class="btn btn-success w-100 py-3" onclick="calcCalcular()">=</button></div><div class="col-6"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('0')">0</button></div><div class="col-6"><button class="btn btn-light border w-100 py-3" onclick="calcNumero('.')">.</button></div></div></div>`;
    }
    else if (nome === "Tarefas") {
        var listaTarefas = ""; $(sistemaMemoria).find('tarefas tarefa').each(function() { var id = $(this).attr('id'); listaTarefas += `<li class="list-group-item d-flex justify-content-between">${$(this).text()}<button class="btn btn-sm btn-danger" onclick="removerTarefa('${id}')"><i class="bi bi-trash"></i></button></li>`; });
        conteudo = `<div class="container mt-3"><div class="text-center mb-3"><h5>Minhas Tarefas</h5></div><div class="input-group mb-3"><input type="text" id="nova-tarefa-input" class="form-control" placeholder="Nova..."><button class="btn btn-success" onclick="adicionarTarefa()">+</button></div><ul class="list-group" id="lista-tarefas-ui">${listaTarefas}</ul></div>`;
    }
    else if (nome === "Música") {
        if(musicasLista.length===0) conteudo="<p>Vazio</p>"; else { var m=musicasLista[musicaIndiceAtual]; var i=!audioPlayer.paused?"bi-pause-fill":"bi-play-fill"; conteudo=`<div class="container text-center mt-4"><img src="${m.capa}" class="album-art shadow"><h4 class="mt-3 text-truncate" id="music-title">${m.titulo}</h4><p class="text-muted" id="music-artist">${m.artista}</p><div class="music-progress"><div class="music-bar" id="music-bar" style="width:0%"></div></div><div class="d-flex justify-content-center gap-3 mt-4"><button class="btn btn-light music-btn" onclick="musicaAnterior()"><i class="bi bi-skip-start-fill"></i></button><button class="btn btn-danger music-btn" onclick="musicaPlayPause()"><i class="bi ${i}" id="play-icon"></i></button><button class="btn btn-light music-btn" onclick="musicaProxima()"><i class="bi bi-skip-end-fill"></i></button></div></div>`; }
    }
    else if (nome === "Clima") {
        conteudo = `<div class="text-center mt-4 p-4 rounded bg-info text-white"><i class="bi bi-cloud-sun mb-3" style="font-size: 4rem;"></i><h2 class="fw-bold">28°C</h2><p>Vitória da Conquista</p><div class="mt-3 border-top pt-2"><div class="row"><div class="col">Chuva: 10%</div><div class="col">Vento: 15km/h</div></div></div></div>`;
    }
    else if (nome === "Sobre") {
        conteudo = `
            <div class="container mt-2">
                <div class="text-center mb-4"><i class="bi bi-phone" style="font-size: 3rem; color: #6c757d;"></i><h4>Sobre o Dispositivo</h4></div>
                <div class="card mb-3"><div class="card-header bg-dark text-white"><i class="bi bi-info-circle me-2"></i>Software</div><ul class="list-group list-group-flush"><li class="list-group-item d-flex justify-content-between align-items-center"><span>Modelo:</span><span class="fw-bold">XMLPhone X1 Pro</span></li><li class="list-group-item d-flex justify-content-between align-items-center"><span>Versão do OS:</span><span>XML OS 2.0</span></li><li class="list-group-item d-flex justify-content-between align-items-center"><span>Patch de Segurança:</span><span class="text-success">Atualizado</span></li></ul></div><div class="card mb-3"><div class="card-header bg-dark text-white"><i class="bi bi-cpu me-2"></i>Hardware</div><ul class="list-group list-group-flush"><li class="list-group-item d-flex justify-content-between align-items-center"><span>Processador:</span><span class="text-end ms-2">Octa-core 3.2 GHz</span></li><li class="list-group-item d-flex justify-content-between align-items-center"><span>Memória RAM:</span><span class="ms-2">16 GB</span></li><li class="list-group-item d-flex justify-content-between align-items-center"><span>Armazenamento:</span><span class="ms-2">1 TB</span></li><li class="list-group-item d-flex justify-content-between align-items-center"><span>Tela:</span><span class="ms-2">6.5" AMOLED 120Hz</span></li><li class="list-group-item d-flex justify-content-between align-items-center"><span>Câmeras:</span><span class="text-nowrap ms-2 small">108MP + 12MP + 5MP</span></li><li class="list-group-item d-flex justify-content-between align-items-center"><span>Bateria:</span><span class="ms-2">5000 mAh</span></li></ul></div><div class="card mb-3"><div class="card-header bg-dark text-white"><i class="bi bi-hdd-network me-2"></i>Rede & Status</div><ul class="list-group list-group-flush"><li class="list-group-item d-flex justify-content-between align-items-center"><span>IMEI:</span><span class="small ms-2 text-muted">354890091234567</span></li><li class="list-group-item d-flex justify-content-between align-items-center"><span>Endereço IP:</span><span class="small ms-2 text-muted">192.168.1.105</span></li><li class="list-group-item d-flex justify-content-between align-items-center"><span>Tempo de Atividade:</span><span class="ms-2">12h:30m</span></li></ul></div></div>`;
    }
    else if (nome === "Galeria") { conteudo = `<div id="carouselGaleria" class="carousel slide" data-bs-ride="carousel"><div class="carousel-inner rounded"><div class="carousel-item active"><img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500" class="d-block w-100"></div><div class="carousel-item"><img src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=500" class="d-block w-100"></div></div><button class="carousel-control-prev" type="button" data-bs-target="#carouselGaleria" data-bs-slide="prev"><span class="carousel-control-prev-icon"></span></button><button class="carousel-control-next" type="button" data-bs-target="#carouselGaleria" data-bs-slide="next"><span class="carousel-control-next-icon"></span></button></div>`; }
    else { conteudo = `<div class="text-center mt-5"><p>Em breve</p></div>`; }

    $("#app-content").html(conteudo);
    $("#app-window").fadeIn(200);

    // Hooks
    if(nome==="Calculadora") calcLimpar();
    if(nome==="Relógio") { $("#data-hoje").text(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })); }
    if(nome==="Música" && musicasLista.length>0 && (audioPlayer.src!==musicasLista[musicaIndiceAtual].arquivo && !audioPlayer.src.includes(musicasLista[musicaIndiceAtual].arquivo))) { audioPlayer.src = musicasLista[musicaIndiceAtual].arquivo; }
    
    $(".game-overlay").css({
        "display":"none", "position":"absolute", "top":"0", "left":"0", 
        "width":"100%", "height":"100%", "background":"rgba(0,0,0,0.8)", 
        "flex-direction":"column", "justify-content":"center", "align-items":"center", 
        "border-radius":"5px", "z-index":"10"
    });
}

function fecharApp() {
    if(snakeIntervalo) clearInterval(snakeIntervalo);
    if(dinoIntervalo) cancelAnimationFrame(dinoIntervalo);
    teclasPressionadas = {}; 
    jogoAtual = null; // Reseta o jogo atual
    
    // Para qualquer som de jogo
    pararSomJogo();
    
    $("#app-window").fadeOut(200, function() { $("#app-content").empty(); });
}

// ============================================
// ============ NOVA FUNÇÃO: LISTA DE APPS ====
// ============================================

function mostrarDetalhesApps() {
    var lista = "";
    var totalArmazenamento = 0;
    
    // Pega os apps do XML
    var apps = $(sistemaMemoria).find('apps app').get();
    
    // Adiciona jogos do Arcade manualmente para listar
    apps.push({ nome: "Snake", icone: "bi-controller", cor: "btn-success" });
    apps.push({ nome: "Memória", icone: "bi-grid-3x3", cor: "btn-warning" });
    apps.push({ nome: "Dino Runner", icone: "bi-cone-striped", cor: "btn-dark" });

    // Ordena Alfabeticamente
    apps.sort(function(a, b) {
        var nomeA = (a.getAttribute ? $(a).attr('nome') : a.nome).toUpperCase();
        var nomeB = (b.getAttribute ? $(b).attr('nome') : b.nome).toUpperCase();
        return (nomeA < nomeB) ? -1 : (nomeA > nomeB) ? 1 : 0;
    });

    // Gera HTML
    $.each(apps, function(idx, item) {
        var nome, icone, cor;
        if (item.getAttribute) { 
            nome = $(item).attr('nome'); icone = $(item).attr('icone'); cor = "text-secondary"; 
        } else { 
            nome = item.nome; icone = item.icone; cor = "text-secondary"; 
        }
        var tamanho = Math.floor(Math.random() * 140) + 10;
        totalArmazenamento += tamanho;

        lista += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div><i class="bi ${icone} me-2 ${cor}"></i> ${nome}</div>
                <span class="text-muted small">${tamanho} MB</span>
            </li>`;
    });

    var porcentagemUso = (totalArmazenamento / 1048576) * 100;
    var gbUsados = (totalArmazenamento / 1024).toFixed(2);
    var larguraVisual = porcentagemUso < 1 ? 1 : porcentagemUso;

    var conteudoDetalhes = `
        <div class="container mt-3">
            <div class="d-flex align-items-center mb-4">
                <h5 class="m-0">Armazenamento</h5>
            </div>
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-body">
                    <h6 class="text-muted mb-2">Uso Total</h6>
                    <div class="progress mb-2" style="height: 10px;">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: ${larguraVisual}%"></div>
                    </div>
                    <div class="d-flex justify-content-between small">
                        <span>${gbUsados} GB usados</span>
                        <span>1 TB total</span>
                    </div>
                </div>
            </div>
            <h6 class="text-muted ms-1 mb-2">Todos os Apps</h6>
            <ul class="list-group shadow-sm">${lista}</ul>
        </div>`;

    $("#app-content").html(conteudoDetalhes);
}

// ============================================
// ============ AUXILIARES DO SISTEMA =========
// ============================================

function voltarArcade() {
    if(snakeIntervalo) clearInterval(snakeIntervalo);
    if(dinoIntervalo) cancelAnimationFrame(dinoIntervalo);
    
    // Para som do jogo
    pararSomJogo();
    
    $("#game-stage").hide();
    $("#arcade-menu").fadeIn();
    teclasPressionadas = {}; 
    jogoAtual = null; // Reseta o controle de teclado
}

function tocarSomJogo(url) {
    // Pausa o player de musica principal se estiver tocando
    if(!audioPlayer.paused) {
        audioPlayer.pause();
        $("#play-icon").removeClass().addClass("bi bi-play-fill");
    }
    
    // Para evitar erros de reprodução sem interação
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // Use os sons sintetizados se não tiver URL
    if(url === undefined) return;
    
    gameAudio.src = url;
    gameAudio.play().catch(e => console.log("Erro som jogo:", e));
}

// Função para sintetizar sons (Substitui o uso de MP3s externos para efeitos)
function tocarSFX(tipo) {
    if (!audioCtx) return;
    
    // Retoma contexto se estiver suspenso
    if (audioCtx.state === 'suspended') audioCtx.resume();

    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    var now = audioCtx.currentTime;

    if (tipo === 'comer') {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (tipo === 'pulo') {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (tipo === 'acerto') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (tipo === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}


function pararSomJogo() {
    gameAudio.pause();
    gameAudio.currentTime = 0;
}

function mudarWallpaper(u){$("#screen").css("background-image","url("+u+")")}

function mostrarAbaRelogio(a){
    $(".nav-link").removeClass("active");
    $(event.target).addClass("active");
    $("#tab-hora, #tab-crono, #tab-alarme").hide();
    $("#tab-"+a).show();
}

function formatarTempo(s){var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return String(h).padStart(2,'0')+":"+String(m).padStart(2,'0')+":"+String(sec).padStart(2,'0')}
function iniciarCrono(){if(!cronometroRodando){cronometroRodando=true;cronometroIntervalo=setInterval(function(){cronometroSegundos++;$("#display-cronometro").text(formatarTempo(cronometroSegundos))},1000)}}
function pausarCrono(){cronometroRodando=false;clearInterval(cronometroIntervalo)}
function zerarCrono(){pausarCrono();cronometroSegundos=0;$("#display-cronometro").text("00:00:00")}
function salvarAlarme(){var v=$("#input-alarme").val();if(v){alarmeHora=v;$("#span-alarme-hora").text(alarmeHora);$("#msg-alarme").show();alert("Alarme!")}}
function adicionarTarefa(){var t=$("#nova-tarefa-input").val();if(t){var id="t"+new Date().getTime();$(sistemaMemoria).find('tarefas').append(`<tarefa id="${id}">${t}</tarefa>`);abrirApp("Tarefas")}}
function removerTarefa(id){$(sistemaMemoria).find('tarefas tarefa[id="'+id+'"]').remove();abrirApp("Tarefas")}
function calcLimpar(){calcDisplay="0";calcExpressao="";calcUltimoResultado=null;calcOperadorAtual=null;calcAguardandoOperando=true;calcAtualizarDisplay()}
function calcApagar(){if(calcDisplay.length>1)calcDisplay=calcDisplay.slice(0,-1);else{calcDisplay="0";calcAguardandoOperando=true}calcAtualizarDisplay()}
function calcNumero(n){if(calcAguardandoOperando){calcDisplay=n;calcAguardandoOperando=false}else{if(n==='.'&&calcDisplay.includes('.'))return;if(n==='0'&&calcDisplay==='0')return;if(calcDisplay==='0'&&n!=='.')calcDisplay=n;else calcDisplay+=n}calcAtualizarDisplay()}
function calcOperador(o){if(calcOperadorAtual&&!calcAguardandoOperando)calcCalcular();calcExpressao=calcDisplay+" "+o;calcUltimoResultado=parseFloat(calcDisplay);calcOperadorAtual=o;calcAguardandoOperando=true;calcAtualizarDisplay()}
function calcCalcular(){if(!calcOperadorAtual||calcAguardandoOperando)return;var op=parseFloat(calcDisplay),res;switch(calcOperadorAtual){case'+':res=calcUltimoResultado+op;break;case'-':res=calcUltimoResultado-op;break;case'*':res=calcUltimoResultado*op;break;case'/':if(op===0){alert("Erro");calcLimpar();return}res=calcUltimoResultado/op;break}res=parseFloat(res.toFixed(10));calcExpressao=calcUltimoResultado+" "+calcOperadorAtual+" "+op+" =";calcDisplay=String(res);calcOperadorAtual=null;calcUltimoResultado=res;calcAguardandoOperando=true;calcAtualizarDisplay()}
function calcAtualizarDisplay(){$("#display").text(calcDisplay);$("#expressao").text(calcExpressao)}

// --- MÚSICA (CORRIGIDO) ---
function musicaPlayPause(){
    if(audioPlayer.paused){
        var playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => { console.log("Auto-play prevented or error"); });
        }
        $("#play-icon").removeClass().addClass("bi bi-pause-fill");
    } else {
        audioPlayer.pause();
        $("#play-icon").removeClass().addClass("bi bi-play-fill");
    }
}
function musicaProxima(){
    musicaIndiceAtual++;
    if(musicaIndiceAtual>=musicasLista.length)musicaIndiceAtual=0;
    tocarNovaMusica();
}
function musicaAnterior(){
    musicaIndiceAtual--;
    if(musicaIndiceAtual<0)musicaIndiceAtual=musicasLista.length-1;
    tocarNovaMusica();
}
function tocarNovaMusica(){
    $("#music-title").text(musicasLista[musicaIndiceAtual].titulo);
    $("#music-artist").text(musicasLista[musicaIndiceAtual].artista);
    $(".album-art").attr("src",musicasLista[musicaIndiceAtual].capa);
    $("#play-icon").removeClass().addClass("bi bi-pause-fill");
    audioPlayer.src=musicasLista[musicaIndiceAtual].arquivo;
    audioPlayer.play().catch(e => console.log("Erro de play:", e));
}

// --- JOGOS (SNAKE, MEMORIA, DINO) ---
function iniciarSnakeUI() {
    jogoAtual = "snake";
    tocarSomJogo(sonsJogos.snake);
    $("#arcade-menu").hide(); $("#game-stage").show();
    $("#snake-container").css("display", "flex");
    $("#memoria-container").hide(); $("#dino-container").hide();
    $("#game-info").text("Snake | 0");
    var canvas = document.getElementById("canvas-cobrinha");
    if(!canvas) return; 
    ctx = canvas.getContext("2d");
    $("#snake-overlay").hide();
    snake = [{x: 5, y: 5}, {x: 4, y: 5}, {x: 3, y: 5}]; pontosSnake = 0; dx = 1; dy = 0; criarComida();
    if(snakeIntervalo) clearInterval(snakeIntervalo);
    snakeIntervalo = setInterval(loopSnake, 150);
}
function loopSnake() {
    var cabeca = {x: snake[0].x + dx, y: snake[0].y + dy};
    var cols = canvasWidth / tamBloco; var rows = canvasHeight / tamBloco;
    if (cabeca.x < 0 || cabeca.x >= cols || cabeca.y < 0 || cabeca.y >= rows || colisaoComSiMesmo(cabeca)) { gameOverSnake(); return; }
    snake.unshift(cabeca); 
    if (cabeca.x === comida.x && cabeca.y === comida.y) { pontosSnake += 10; $("#game-info").text("Snake | " + pontosSnake); criarComida(); tocarSFX('comer'); } else { snake.pop(); }
    desenharSnake();
}
function desenharSnake() {
    ctx.fillStyle = "#222"; ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "red"; ctx.fillRect(comida.x * tamBloco, comida.y * tamBloco, tamBloco - 2, tamBloco - 2);
    ctx.fillStyle = "#0f0"; snake.forEach(function(bloco) { ctx.fillRect(bloco.x * tamBloco, bloco.y * tamBloco, tamBloco - 2, tamBloco - 2); });
}
function criarComida() { var cols = canvasWidth / tamBloco; var rows = canvasHeight / tamBloco; comida.x = Math.floor(Math.random() * cols); comida.y = Math.floor(Math.random() * rows); snake.forEach(function(bloco) { if(bloco.x == comida.x && bloco.y == comida.y) criarComida(); }); }
function colisaoComSiMesmo(cabeca) { for (var i = 0; i < snake.length; i++) { if (cabeca.x === snake[i].x && cabeca.y === snake[i].y) return true; } return false; }
function mudarDirecaoSnake(evento) {
    if(!snakeIntervalo) return; 
    var tecla = evento.keyCode;
    if (tecla === 37 && dx !== 1) { dx = -1; dy = 0; }
    if (tecla === 38 && dy !== 1) { dx = 0; dy = -1; }
    if (tecla === 39 && dx !== -1) { dx = 1; dy = 0; }
    if (tecla === 40 && dy !== -1) { dx = 0; dy = 1; }
}
function gameOverSnake() { 
    tocarSFX('gameover');
    pararSomJogo();
    clearInterval(snakeIntervalo); 
    snakeIntervalo = null; 
    $("#snake-overlay").css("display", "flex"); 
}

function iniciarMemoriaUI() {
    jogoAtual = "memoria";
    tocarSomJogo(sonsJogos.memoria);
    $("#arcade-menu").hide(); $("#game-stage").show();
    $("#snake-container").hide(); $("#memoria-container").show(); $("#dino-container").hide();
    $("#game-info").text("Memória");
    var gridHtml = "";
    var baralho = [...iconesMemoria, ...iconesMemoria];
    baralho.sort(() => 0.5 - Math.random());
    cartasMemoria = baralho; cartasViradas = []; paresEncontrados = 0; bloqueioMemoria = false;
    baralho.forEach((icone, index) => { gridHtml += `<div class="col-3"><div class="card bg-secondary text-white d-flex align-items-center justify-content-center" style="height:70px; cursor:pointer; font-size:1.5rem;" id="carta-${index}" onclick="virarCarta(${index}, '${icone}')"><i class="bi bi-question-lg"></i></div></div>`; });
    $("#grid-memoria").html(gridHtml);
}
function virarCarta(index, icone) {
    if(bloqueioMemoria) return;
    var elemento = $(`#carta-${index}`);
    if(elemento.hasClass("bg-white") || elemento.hasClass("bg-success")) return;
    elemento.removeClass("bg-secondary text-white").addClass("bg-white text-primary border border-primary");
    elemento.html(`<i class="bi ${icone}"></i>`);
    cartasViradas.push({index: index, icone: icone, el: elemento});
    if(cartasViradas.length === 2) { bloqueioMemoria = true; setTimeout(checarPar, 800); }
}
function checarPar() {
    var c1 = cartasViradas[0]; var c2 = cartasViradas[1];
    if(c1.icone === c2.icone) {
        tocarSFX('acerto');
        c1.el.removeClass("bg-white text-primary border-primary").addClass("bg-success text-white border-success");
        c2.el.removeClass("bg-white text-primary border-primary").addClass("bg-success text-white border-success");
        paresEncontrados++;
        if(paresEncontrados === iconesMemoria.length) { alert("Parabéns! Você venceu!"); pararSomJogo(); }
    } else {
        c1.el.removeClass("bg-white text-primary border-primary").addClass("bg-secondary text-white").html(`<i class="bi bi-question-lg"></i>`);
        c2.el.removeClass("bg-white text-primary border-primary").addClass("bg-secondary text-white").html(`<i class="bi bi-question-lg"></i>`);
    }
    cartasViradas = []; bloqueioMemoria = false;
}

function iniciarDinoUI() {
    jogoAtual = "dino";
    tocarSomJogo(sonsJogos.dino);
    $("#arcade-menu").hide(); $("#game-stage").show();
    $("#snake-container").hide(); $("#memoria-container").hide(); $("#dino-container").css("display", "flex");
    $("#game-info").text("Dino | 0");
    var canvas = document.getElementById("canvas-dino");
    if(!canvas) return;
    dinoCtx = canvas.getContext("2d");
    $("#dino-overlay").hide();
    dinoObj = {x: 30, y: 0, w: 40, h: 40, dy: 0, jumpPower: -9, gravity: 0.5, grounded: false};
    obstaculos = []; frameDino = 0; pontosDino = 0; velocidadeJogo = 3; tempoAteProximoObs = 0; 
    if(dinoIntervalo) cancelAnimationFrame(dinoIntervalo);
    loopDino();
}
function pularDino() { if(dinoObj.grounded) { dinoObj.dy = dinoObj.jumpPower; dinoObj.grounded = false; tocarSFX('pulo'); } }
function loopDino() {
    dinoCtx.clearRect(0,0,280,340);
    var chaoY = 300;
    dinoCtx.beginPath(); dinoCtx.moveTo(0, chaoY); dinoCtx.lineTo(280, chaoY); dinoCtx.stroke();
    dinoObj.dy += dinoObj.gravity; dinoObj.y += dinoObj.dy;
    if(dinoObj.y + dinoObj.h > chaoY) { dinoObj.y = chaoY - dinoObj.h; dinoObj.dy = 0; dinoObj.grounded = true; }
    dinoCtx.drawImage(dinoImg, dinoObj.x, dinoObj.y, dinoObj.w, dinoObj.h);
    if (tempoAteProximoObs <= 0) { obstaculos.push({x: 280, y: chaoY - 30, w: 20, h: 30}); tempoAteProximoObs = Math.floor(Math.random() * 80) + 60; }
    tempoAteProximoObs--;
    for(var i=0; i<obstaculos.length; i++) {
        var obs = obstaculos[i]; obs.x -= velocidadeJogo;
        dinoCtx.drawImage(cactoImg, obs.x, obs.y, obs.w, obs.h);
        if (dinoObj.x < obs.x + obs.w && dinoObj.x + dinoObj.w > obs.x && dinoObj.y < obs.y + obs.h && dinoObj.y + dinoObj.h > obs.y) { gameOverDino(); return; }
        if(obs.x + obs.w < 0) { obstaculos.splice(i, 1); i--; pontosDino++; $("#game-info").text("Dino | " + pontosDino); if(pontosDino % 5 === 0) velocidadeJogo += 0.5; }
    }
    frameDino++;
    dinoIntervalo = requestAnimationFrame(loopDino);
}
function gameOverDino() { 
    tocarSFX('gameover');
    pararSomJogo();
    cancelAnimationFrame(dinoIntervalo); 
    dinoIntervalo = null; 
    $("#dino-overlay").css("display", "flex"); 
}