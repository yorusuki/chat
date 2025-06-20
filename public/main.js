const socket = io();
let player, cursors, others = {};

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  physics: { default: 'arcade' },
  scene: {
    preload, create, update
  }
};

const game = new Phaser.Game(config);

function preload() {
  this.load.spritesheet('player', 'assets/player.png', {
    frameWidth: 21, frameHeight: 21
  });
}

function create() {
  player = this.physics.add.sprite(100, 100, 'player', 0);
  player.setScale(5); // 放大2倍
  cursors = this.input.keyboard.createCursorKeys();

  // Receive existing players
  socket.on('currentPlayers', (players) => {
    Object.keys(players).forEach(id => {
      if (id !== socket.id) {
        const newPlayer = this.physics.add.sprite(players[id].x, players[id].y, 'player');
        newPlayer.setScale(5);
        others[id] = newPlayer;
      }
    });
  });

  socket.on('newPlayer', (data) => {
    const newPlayer = this.physics.add.sprite(data.x, data.y, 'player');
    newPlayer.setScale(5);
    others[data.id] = newPlayer;
  });

  socket.on('playerMoved', (data) => {
    if (others[data.id]) {
      others[data.id].setPosition(data.x, data.y);
    }
  });

  socket.on('playerDisconnected', (id) => {
    if (others[id]) {
      others[id].destroy();
      delete others[id];
    }
  });

  socket.on('chatMessage', ({ id, msg }) => {
    const chat = document.getElementById('chat');
    chat.innerHTML += `<div><b>${id.slice(0, 5)}</b>: ${msg}</div>`;
    chat.scrollTop = chat.scrollHeight;
  });

  // Chat input
  const input = document.getElementById('msgInput');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
      socket.emit('chatMessage', input.value);
      input.value = '';
    }
  });
}

function update() {
  let moved = false;

  if (cursors.left.isDown) {
    player.x -= 2;
    moved = true;
  } else if (cursors.right.isDown) {
    player.x += 2;
    moved = true;
  }

  if (cursors.up.isDown) {
    player.y -= 2;
    moved = true;
  } else if (cursors.down.isDown) {
    player.y += 2;
    moved = true;
  }

  if (moved) {
    socket.emit('move', { x: player.x, y: player.y });
  }
}
