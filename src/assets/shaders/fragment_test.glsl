#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
 
in vec2 v_texcoord;
in vec2 v_mouse;
flat in int v_brushSize;
flat in vec2 v_resolution;
flat in vec2 v_offset;

uniform sampler2D u_texture;
uniform float u_pressure;
uniform vec4 u_jitter;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    float useBrushSize = float(v_brushSize) * mix(u_jitter.x, u_jitter.y, u_pressure);
    vec2 useCoord = ((v_texcoord + v_offset) + 1.0) / 2.0;
    float dist = distance(v_texcoord * v_resolution * 2.0, v_mouse * v_resolution * 2.0);
    float strength = 1.0 - clamp(dist / float(useBrushSize), 0.0, 1.0);
    ivec2 size = textureSize(u_texture, 0);
    vec2 ratio = v_resolution / vec2(float(size.x), float(size.y));
    vec4 result = texture(u_texture, useCoord * ratio);
    outColor = vec4(0, 0, 0, strength * mix(u_jitter.z, u_jitter.w, u_pressure) * result.x);
}