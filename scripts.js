const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let blockSize = 60; // Adjusted to accommodate larger shapes
let rows = Math.floor(canvas.height / blockSize);
let cols = Math.floor(canvas.width / blockSize);
let selectedColor = '#0000FF';
let snapToGrid = true;
let rotation = 0;
const shapes = {
    circle: drawCircle,
    triangle: drawTriangle,
    pentagon: drawPentagon,
    hexagon: drawHexagon
};

let blocks = [];
let history = [];
let redoStack = [];
let draggedShape = null;

document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);
document.getElementById('saveBtn').addEventListener('click', saveGame);
document.getElementById('loadBtn').addEventListener('click', loadGame);
document.getElementById('shareBtn').addEventListener('click', shareGame);
document.getElementById('presetBtn').addEventListener('click', loadPreset);
canvas.addEventListener('dragover', allowDrop);
canvas.addEventListener('drop', onDrop);
document.getElementById('colorSelector').addEventListener('input', (e) => {
    selectedColor = e.target.value;
});
document.getElementById('gridSize').addEventListener('input', adjustGridSize);
document.getElementById('snapToggle').addEventListener('change', (e) => {
    snapToGrid = e.target.checked;
});
document.getElementById('rotation').addEventListener('input', (e) => {
    rotation = parseInt(e.target.value);
});

const sidebarBlocks = document.querySelectorAll('#sidebar .block');
sidebarBlocks.forEach(block => {
    block.addEventListener('dragstart', onDragStart);
});

initGrid();
drawGrid();

function initGrid() {
    blocks = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            blocks.push({ type: null, x: col * blockSize, y: row * blockSize, rotation: 0 });
        }
    }
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            ctx.strokeStyle = '#FFA500';
            ctx.strokeRect(col * blockSize, row * blockSize, blockSize, blockSize);
        }
    }
    drawBlocks();
}

function drawBlocks() {
    blocks.forEach(block => {
        if (block.type) {
            ctx.save();
            ctx.translate(block.x + blockSize / 2, block.y + blockSize / 2);
            ctx.rotate((block.rotation * Math.PI) / 180);
            ctx.fillStyle = block.color;
            shapes[block.type](0, 0, blockSize / 2);
            ctx.restore();
        }
    });
}

function onDragStart(event) {
    draggedShape = event.target.dataset.type;
}

function allowDrop(event) {
    event.preventDefault();
}

function onDrop(event) {
    event.preventDefault();
    const { offsetX, offsetY } = event;
    let col = Math.floor(offsetX / blockSize);
    let row = Math.floor(offsetY / blockSize);
    if (!snapToGrid) {
        col = Math.round(offsetX / blockSize);
        row = Math.round(offsetY / blockSize);
    }
    const blockIndex = row * cols + col;
    saveState(); // Save the state before making changes
    blocks[blockIndex] = { type: draggedShape, x: col * blockSize, y: row * blockSize, color: selectedColor, rotation: rotation };
    redoStack = []; // Clear the redo stack on new action
    drawGrid();
}

function resetGame() {
    saveState();
    blocks.forEach(block => block.type = null);
    drawGrid();
}

function undo() {
    if (history.length > 0) {
        redoStack.push(JSON.stringify(blocks));
        blocks = JSON.parse(history.pop());
        drawGrid();
    }
}

function redo() {
    if (redoStack.length > 0) {
        history.push(JSON.stringify(blocks));
        blocks = JSON.parse(redoStack.pop());
        drawGrid();
    }
}

function saveState() {
    history.push(JSON.stringify(blocks));
    if (history.length > 50) history.shift(); // Limit history to last 50 actions
}

function saveGame() {
    localStorage.setItem('blockBuilderSave', JSON.stringify(blocks));
    alert('Game saved!');
}

function loadGame() {
    const savedGame = localStorage.getItem('blockBuilderSave');
    if (savedGame) {
        blocks = JSON.parse(savedGame);
        drawGrid();
        alert('Game loaded!');
    } else {
        alert('No saved game found.');
    }
}

function shareGame() {
    const shareData = { blocks };
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(JSON.stringify(shareData))}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Shareable link copied to clipboard!');
    });
}

function loadPreset() {
    // Example preset: a simple smiley face
    blocks = [
        { type: 'circle', x: 3 * blockSize, y: 3 * blockSize, color: '#FFFF00', rotation: 0 },
        { type: 'circle', x: 5 * blockSize, y: 3 * blockSize, color: '#FFFF00', rotation: 0 },
        { type: 'circle', x: 4 * blockSize, y: 5 * blockSize, color: '#FFFF00', rotation: 0 },
        { type: 'circle', x: 3 * blockSize, y: 4 * blockSize, color: '#FFFF00', rotation: 0 },
        { type: 'circle', x: 5 * blockSize, y: 4 * blockSize, color: '#FFFF00', rotation: 0 },
    ];
    drawGrid();
}

function adjustGridSize(event) {
    blockSize = 600 / parseInt(event.target.value);
    rows = Math.floor(canvas.height / blockSize);
    cols = Math.floor(canvas.width / blockSize);
    initGrid();
    drawGrid();
}

// Shape drawing functions
function drawCircle(x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function drawTriangle(x, y, size) {
    const height = size * Math.sqrt(3) / 2;
    ctx.beginPath();
    ctx.moveTo(x, y - height / 2);
    ctx.lineTo(x - size / 2, y + height / 2);
    ctx.lineTo(x + size / 2, y + height / 2);
    ctx.closePath();
    ctx.fill();
}

function drawPentagon(x, y, size) {
    const angle = Math.PI * 2 / 5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const xPos = x + size * Math.cos(angle * i - Math.PI / 2);
        const yPos = y + size * Math.sin(angle * i - Math.PI / 2);
        if (i === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
    }
    ctx.closePath();
    ctx.fill();
}

function drawHexagon(x, y, size) {
    const angle = Math.PI * 2 / 6;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const xPos = x + size * Math.cos(angle * i);
        const yPos = y + size * Math.sin(angle * i);
        if (i === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
    }
    ctx.closePath();
    ctx.fill();
}

// Load shared data if present in URL
const urlParams = new URLSearchParams(window.location.search);
const sharedData = urlParams.get('data');
if (sharedData) {
    blocks = JSON.parse(decodeURIComponent(sharedData)).blocks;
    drawGrid();
}
