/// <reference lib="webworker" />

let gl: WebGL2RenderingContext
let canvas
let scale
let textureSource: ImageBitmap
let vertexShader: WebGLShader
let fragmentShader: WebGLShader
let shaderProgram: WebGLProgram
let resolutionUniform: WebGLUniformLocation
let mouseUniform: WebGLUniformLocation
let offsetUniform: WebGLUniformLocation
let pressureUniform: WebGLUniformLocation
let textureUniform: WebGLUniformLocation
let brushSizeUniform: WebGLUniformLocation
let lastPoint

let texture: WebGLTexture

let drawExistingImage = async (image) => {

}

let fetchTextures = async () => {
  let res = await fetch("../../assets/charcoal.png", { mode: "cors" })
  let blob = await res.blob()
  textureSource = await createImageBitmap(blob, {
    premultiplyAlpha: "none",
    colorSpaceConversion: "none"
  })
  console.log("Loaded texture on worker", textureSource)

  texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture) 
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureSource)
}

let createShader = async (source, type) => {
  let shader = gl.createShader(type)
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

let createProgram = async (vertexShader, fragmentShader) => {
  let program = gl.createProgram();
  if(program != null) {
    console.log("Attaching vertex shader...", vertexShader)
    gl.attachShader(program, vertexShader);
    console.log("Attaching fragment shader...", fragmentShader)
    gl.attachShader(program, fragmentShader);
    console.log("Linking shader program...")
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

let fetchShaders = async () => {
  let res = await fetch("../../assets/shaders/vertex_test.glsl")
  let vertexShaderSource = await res.text()
  vertexShader = await createShader(vertexShaderSource, gl.VERTEX_SHADER)

  res = await fetch("../../assets/shaders/fragment_test.glsl")
  let fragmentShaderSource = await res.text()
  fragmentShader = await createShader(fragmentShaderSource, gl.FRAGMENT_SHADER)

  shaderProgram = await createProgram(vertexShader, fragmentShader)
  resolutionUniform = gl.getUniformLocation(shaderProgram, "u_resolution")
  mouseUniform = gl.getUniformLocation(shaderProgram, "u_mouse")
  offsetUniform = gl.getUniformLocation(shaderProgram, "u_offset")
  pressureUniform = gl.getUniformLocation(shaderProgram, "u_pressure")
  brushSizeUniform = gl.getUniformLocation(shaderProgram, "u_brushSize")
  textureUniform = gl.getUniformLocation(shaderProgram, "u_texture")
}

let vao: WebGLVertexArrayObject

let configureCanvas = async (data) => {
  console.log("Worker received canvas")
  canvas = data.canvas
  scale = data.scale

  if(data.existingImage) {
    //let ctx = canvas.getContext("2d")
    //ctx.drawImage(data.existingImage, 0, 0)
  }

  gl = canvas.getContext("webgl2", {
    preserveDrawingBuffer: true
  })

  await fetchTextures()
  await fetchShaders()

  if(shaderProgram != null) {
    let positionAttributeLocation = gl.getAttribLocation(shaderProgram, "a_position")
    
    //Fill vertex position buffer
    let positionBuffer = gl.createBuffer()
    vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    var positions = [
      0, 0,
      1, 0,
      0, 1,
      1, 1,
      1, 0,
      0, 1
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(shaderProgram)
    gl.clearColor(1, 1, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(shaderProgram)
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height)
    console.log(canvas.width, canvas.height, data.scale)
    gl.uniform1i(textureUniform, 0)
    gl.uniform1i(brushSizeUniform, 30)
    gl.bindVertexArray(vao)
    gl.enable(gl.BLEND)
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }
}

addEventListener('message', async ({ data }) => {
  if(data.type === "canvas") {
    configureCanvas(data)
  } else if(data.type == "point") {
    data.x = data.x * scale
    data.y = data.y * scale
    if(data.start) {
      gl.uniform2f(offsetUniform, Math.random() * canvas.width, Math.random() * canvas.height)
    } else {
      let distance = Math.sqrt(Math.abs(Math.pow(data.x - lastPoint.x, 2)) + Math.abs(Math.pow(data.y - lastPoint.y, 2)))
      let diffX = data.x - lastPoint.x
      let diffY = data.y - lastPoint.y
      let normalX = diffX / distance
      let normalY = diffY / distance
      let minDistance = 2
      let steps = Math.floor(distance / minDistance)
      let pressureDiff = data.pressure - lastPoint.pressure
      let pressureDistance = pressureDiff / steps
      for(let i = 1; i < steps; i++) {
        gl.uniform2f(mouseUniform, lastPoint.x + (normalX * minDistance * i), lastPoint.y + (normalY * minDistance * i))
        gl.uniform1f(pressureUniform, lastPoint.pressure + (pressureDistance * i))
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
    }

    gl.uniform2f(mouseUniform, data.x, data.y)
    gl.uniform1f(pressureUniform, data.pressure)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    lastPoint = data
  } else if(data.type == "clear") {
    gl.clear(gl.COLOR_BUFFER_BIT)
  } else if(data.type == "resize") {
    let oldBitmap = canvas.transferToImageBitmap()
    postMessage({
      type: "resized",
      width: data.width,
      height: data.height,
      bitmap: oldBitmap
    }, [oldBitmap])
  }
});
