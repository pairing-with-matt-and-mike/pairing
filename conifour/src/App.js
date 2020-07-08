import React, { useEffect, useRef, useState } from "react";
import "./App.css";

function createPalette(start, end) {
  if (start && end) {
    return [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) =>
      interpolateColours(start, end, t)
    );
  } else {
    return [];
  }
}

function interpolateColours(start, end, t) {
  return {
    h: start.h * (1 - t) + end.h * t,
    s: start.s * (1 - t) + end.s * t,
    l: start.l * (1 - t) + end.l * t,
  };
}

function hslToString({ h, s, l }) {
  return `hsl(${h},${s}%,${l}%)`;
}

function App() {
  const width = 200;
  const height = 200;

  const [state, setState] = useState({});

  function draw(element) {
    const c = element.getContext("2d");
    for (let x = 0; x < element.width; x++) {
      for (let y = 0; y < element.height; y++) {
        c.fillStyle = hslToString(coordinatesToColour({ x, y }));
        c.fillRect(x, y, 1, 1);
      }
    }
  }

  function coordinatesToColour({ x, y }) {
    const h = (x / width) * 360;
    const l = (y / (height - 1)) * 100;
    return { h, l, s: 100 };
  }

  function handleMouseDown({ x, y }) {
    setState((state) => ({ ...state, start: coordinatesToColour({ x, y }) }));
  }

  function handleMouseUp({ x, y }) {
    setState((state) => ({ ...state, end: coordinatesToColour({ x, y }) }));
  }

  const colours = createPalette(state.start, state.end);

  return (
    <div className="App">
      <Canvas
        height={height}
        width={width}
        draw={draw}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      <Palette colours={colours} />
    </div>
  );
}

function Canvas(props) {
  const { height, width, draw, onMouseDown, onMouseUp } = props;

  const canvasRef = useRef();

  const [isMoving, setIsMoving] = useState(false);

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
    setIsMoving(true);
  }

  function handleMouseMove(event) {
    if (isMoving) {
      onMouseUp(calculateOffset(event));
    }
  }

  function handleMouseUp(event) {
    setIsMoving(false);
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
