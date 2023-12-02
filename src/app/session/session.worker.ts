/// <reference lib="webworker" />

let lastPoint
let gl: WebGL2RenderingContext
let canvas
//let context
let texture

let brushData = new ImageData(24, 24)

let fetchTextures = async () => {
  let res = await fetch("../../assets/charcoal.png", { mode: "cors" })
  let blob = await res.blob()
  texture = await createImageBitmap(blob)
  console.log("Loaded texture on worker", texture)
}

let createShader = async (source, type) => {
  let shader = gl.createShader(gl.VERTEX_SHADER)
  if(shader != null) {
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (success) {
      return shader
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }

  return null
}

let createProgram = async (vertexShader, fragmentShader) {
  let program = gl.createProgram();
  if(program != null) {
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
  
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }

  return null
}

let vertexShader: WebGLShader | null
let fragmentShader: WebGLShader | null
let shaderProgram: WebGLProgram | null

let fetchShaders = async () => {
  let res = await fetch("../../assets/shaders/vertex_test.glsl")
  let vertexShaderSource = await res.text()
  vertexShader = await createShader(vertexShaderSource, gl.VERTEX_SHADER)

  res = await fetch("../../assets/shaders/fragment_test.glsl")
  let fragmentShaderSource = await res.text()
  fragmentShader = await createShader(fragmentShaderSource, gl.FRAGMENT_SHADER)

  shaderProgram = createProgram(vertexShader, fragmentShader)
}

let configureCanvas = async (data) => {
  console.log("Worker received canvas")
  canvas = data.canvas
  gl = data.canvas.getContext("webgl2")

  await fetchTextures()
  await fetchShaders()

  if(shaderProgram != null) {
    let positionAttributeLocation = gl.getAttribLocation(shaderProgram, "a_position")
    let positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    let vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)
  }
}

addEventListener('message', async ({ data }) => {
  if(data.type === "canvas") {
    configureCanvas(data)
  } else if(data.type == "point") {
    if(!data.start) {
      /*context.beginPath()
      context.moveTo(lastPoint.x, lastPoint.y)
      context.lineTo(data.x, data.y)
      context.strokeStyle = "black"
      context.lineWidth = 12 * data.pressure
      context.stroke()*/
    } else {
      //context.drawImage(texture, 0, 0)
    }

    lastPoint = data
  } else if(data.type == "clear") {
    
  }
});
