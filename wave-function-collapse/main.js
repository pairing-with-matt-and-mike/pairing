const width = 20
var dim = 32 * width;
let sprites;

const TILES = [
    // Down and Right
    {source: [0, 0],
     edges: {U: 'G', D: 'R', L: 'G', R: 'R'}},
    // Up and Left
    {source: [7, 0],
     edges: {U: 'R', D: 'G', L: 'R', R: 'G'}},
    // Up and Right
    {source: [6, 1],
     edges: {U: 'R', D: 'G', L: 'G', R: 'R'}},
    // Down and Left
    {source: [2, 2],
     edges: {U: 'G', D: 'R', L: 'R', R: 'G'}},
    // Up and Down
    {source: [6, 0],
     edges: {U: 'R', D: 'R', L: 'G', R: 'G'}},
    // Left and Right
    {source: [4, 3],
     edges: {U: 'G', D: 'G', L: 'R', R: 'R'}},
    // Up, Left and Right
    {source: [7, 1],
     edges: {U: 'R', D: 'G', L: 'R', R: 'R'}},
    // Up, Down, Left and Right
    {source: [5, 2],
     edges: {U: 'R', D: 'R', L: 'R', R: 'R'}},
    // Green
    {source: [6, 3],
     edges: {U: 'G', D: 'G', L: 'G', R: 'G'}}];

function setup() {
    createCanvas(dim, dim);
    sprites = loadImage("spritesheet.png");
    // frameRate(24);
}

function reverseDirection (d) {
    return d === 'U' ? 'D' :
        d === 'D' ? 'U' :
        d === 'L' ? 'R' :
        'L';
}

const world = {
    width: width,
    tiles: Array.from({length: width * width}).map(() => ({
        options: TILES,
        render: TILES[TILES.length-1],
        resolved: false
    })),
};

function i2xy(i) {
    return [i % width,
            Math.floor(i / width)];
}

function xy2i([x, y]) {
    return y * width + x;
}

function neighbours([x, y]) {
    const ret = [[x, y - 1, 'U'],
                 [x - 1, y, 'L'],
                 [x + 1, y, 'R'],
                 [x, y + 1, 'D']].filter(
                     ([i, j]) => i >= 0 && i < width && j >= 0 && j < width);
    return ret;
}

function resolve(x, y, d, colour) {
    const cell = world.tiles[xy2i([x, y])];
    if (cell.resolved) {
        return;
    }
    const edge = reverseDirection(d);
    cell.options = cell.options.filter(({edges}) => edges[edge] === colour);
    if (cell.options.length === 0) {
        cell.options = [TILES[4]];
    }
}

function step() {
    let cells = world.tiles
          .map((cell, i) => ({i, cell}))
          .sort((a, b) => a.cell.options.length - b.cell.options.length)
          .filter(({cell}) => !cell.resolved);

    cells = cells.filter(({cell: {options}}) => options.length === cells[0].cell.options.length);

    if (cells.length === 0) {
        return;
    }

    const {cell, i} = random(cells);
    cell.options = [random(cell.options)];
    cell.render = cell.options[0];
    cell.resolved = true;

    neighbours(i2xy(i)).forEach(([x, y, d]) => {
        resolve(x, y, d, cell.render.edges[d])
    });
}

function draw() {
    clear();

    let x = 0;
    let y = 0;
    for (let tile of world.tiles) {
        drawTile({x, y, source: tile.render.source});
        x++;
        if (x === world.width) {
            y++;
            x = 0;
        }
    }

    step();
}

function drawTile({x, y, source: [sourceX, sourceY]}) {
    const tileWidth = 32;
    const spriteWidth = 64;
    image(
        sprites,
        x * tileWidth,
        y * tileWidth,
        tileWidth,
        tileWidth,
        sourceX * spriteWidth,
        sourceY * spriteWidth,
        spriteWidth,
        spriteWidth,
    );
}
