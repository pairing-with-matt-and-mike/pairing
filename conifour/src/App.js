import { throttle } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import "./App.css";

function interpolatePositions({ start, middle, end }) {
  if (start && end) {
    return [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) =>
      interpolatePosition(start, middle, end, t)
    );
  } else {
    return [];
  }
}

function interpolatePosition(start, middle, end, t) {
  return {
    x: start.x * (1 - t) * (1 - t) + 2 * (1 - t) * t * middle.x + end.x * t * t,
    y: start.y * (1 - t) * (1 - t) + 2 * (1 - t) * t * middle.y + end.y * t * t,
  };
}

function hslToString({ h, s, l }) {
  return `hsl(${h},${s}%,${l}%)`;
}

function App() {
  const width = 200;
  const height = 200;

  const [state, setState] = useState({
    start: { x: width / 4, y: (3 * height) / 4 },
    middle: { x: width / 2, y: height / 2 },
    end: { x: (3 * width) / 4, y: (3 * height) / 4 },
  });

  const onMoveRef = useRef(null);

  const backgroundCanvasRef = useRef(null);
  if (backgroundCanvasRef.current === null) {
    const backgroundCanvas = document.createElement("canvas");
    backgroundCanvas.width = width;
    backgroundCanvas.height = height;
    backgroundCanvasRef.current = backgroundCanvas;

    const c = backgroundCanvas.getContext("2d");
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        c.fillStyle = hslToString(coordinatesToColour({ x, y }));
        c.fillRect(x, y, 1, 1);
      }
    }
  }

  const positions = interpolatePositions(state);
  const colours = positions.map(coordinatesToColour);

  function draw(element) {
    const c = element.getContext("2d");
    c.drawImage(backgroundCanvasRef.current, 0, 0);

    c.strokeStyle = "black";
    for (const position of positions) {
      drawCross(c, position);
    }

    for (const pt of [state.start, state.middle, state.end]) {
      drawControlPoint(c, pt);
    }
  }

  function drawCross(c, centre) {
    const halfWidth = 3;
    drawLine(
      c,
      { x: centre.x - halfWidth, y: centre.y },
      { x: centre.x + halfWidth, y: centre.y }
    );
    drawLine(
      c,
      { x: centre.x, y: centre.y - halfWidth },
      { x: centre.x, y: centre.y + halfWidth }
    );
  }

  const controlPointRadius = 5;

  function drawControlPoint(c, { x, y }) {
    c.beginPath();
    c.arc(x, y, controlPointRadius, 0, 2 * Math.PI);
    c.stroke();
  }

  function drawLine(c, { x: x1, y: y1 }, { x: x2, y: y2 }) {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  }

  function coordinatesToColour({ x, y }) {
    const h = (x / width) * 360;
    const l = (y / (height - 1)) * 100;
    return { h, l, s: 100 };
  }

  function handleMouseDown({ x, y }) {
    for (const key of ["start", "middle", "end"]) {
      const dx = state[key].x - x;
      const dy = state[key].y - y;

      if (dx ** 2 + dy ** 2 <= controlPointRadius ** 2) {
        onMoveRef.current = throttle((value) => {
          setState((state) => ({ ...state, [key]: value }));
        }, 15);
      }
    }
  }

  function handleMouseMove({ x, y }) {
    if (onMoveRef.current) {
      onMoveRef.current({ x, y });
    }
  }

  function handleMouseUp({ x, y }) {
    if (onMoveRef.current) {
      onMoveRef.current({ x, y });
      onMoveRef.current = null;
    }
  }

  return (
    <div className="App">
      <Canvas
        height={height}
        width={width}
        draw={draw}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <Palette colours={colours} />
    </div>
  );
}

function Canvas(props) {
  const { height, width, draw, onMouseDown, onMouseMove, onMouseUp } = props;

  const canvasRef = useRef();

  useEffect(() => {
    if (canvasRef.current != null) {
      draw(canvasRef.current);
    }
  });

  function calculateOffset(event) {
    const r = event.target.getBoundingClientRect();
    const x = event.clientX - r.left;
    const y = event.clientY - r.top;
    return { x, y };
  }

  function handleMouseDown(event) {
    onMouseDown(calculateOffset(event));
  }

  function handleMouseMove(event) {
    onMouseMove(calculateOffset(event));
  }

  function handleMouseUp(event) {
    onMouseUp(calculateOffset(event));
  }

  return (
    <canvas
      height={height}
      width={width}
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    ></canvas>
  );
}

function Palette(props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      {props.colours.map((c, i) => (
        <div
          key={i}
          style={{
            width: 50,
            height: 50,
            backgroundColor: hslToString(c),
            flex: "0 1 auto",
          }}
        ></div>
      ))}
    </div>
  );
}

export default App;
