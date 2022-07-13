var size = 600;
var bigSquareSize = size / 10;
var littleSquareSize = 20;
var tinySquareSize = littleSquareSize / 2;

var colorCount = 0;

function setup() {
    createCanvas(size, size);
}

function makeColor(v) {
    colorCount++;
    var p = v / 256;
    return color(
        v * (0.5 + 0.5 * sin(frameCount + colorCount)),
        v * (0.5 + 0.5 * sin(frameCount + colorCount + 120)),
        v * (0.5 + 0.5 * sin(frameCount + colorCount + 240)),
    );
}

function fill2(v) {
    fill(makeColor(v));
}

function drawLittleSquare(x, y, littleSquareType) {
    var angle = sin(2 * frameCount) * 45 * (littleSquareType ? 1 : -1);
    translate(x, y);
    rotate(angle);
    var offset = littleSquareSize / 2;
    fill2(255);
    rect(-offset, -offset, littleSquareSize, littleSquareSize);
    fill2(0);
    rect(-offset, -offset, tinySquareSize, tinySquareSize);
    rect(0, 0, tinySquareSize, tinySquareSize);
    resetMatrix();
}

function draw() {
    colorCount = 0;
    angleMode(DEGREES);
    background(makeColor(120));
    noStroke();
    var bigSquareType = true;

    for (var y = bigSquareSize; y < size; y += bigSquareSize * 2) {
        for (var x = 0; x < size; x += bigSquareSize) {
            bigSquareType = !bigSquareType;
            fill2(bigSquareType ? 50 : 150);
            rect(x, y, bigSquareSize, bigSquareSize);
            colorCount += 3;
        }
    }

    for (var y = 0; y < size + tinySquareSize; y += bigSquareSize) {
        var littleSquareType = false;
        for (var x = 0; x < size + tinySquareSize; x += bigSquareSize) {
            drawLittleSquare(x, y, littleSquareType);
            littleSquareType = !littleSquareType;
        }
    }
}
