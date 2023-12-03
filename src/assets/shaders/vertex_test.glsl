#version 300 es
in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec2 u_offset;
uniform int u_brushSize;

out vec2 v_texcoord;
out vec2 v_mouse;
flat out vec2 v_offset;
flat out int v_brushSize;
flat out vec2 v_resolution;
 
void main() {
    float aspect = 1.0;
    vec2 ratio = vec2(1,1);
    if(u_resolution.x > u_resolution.y) {
        aspect = u_resolution.y / u_resolution.x;
        ratio = vec2(1,aspect);
    } else {
        aspect = u_resolution.x / u_resolution.y;
        ratio = vec2(aspect,1);
    }
    
    vec2 mouse1 = (u_mouse / u_resolution);
    vec2 mouse2 = mouse1 * 2.0;
    vec2 clipMouse = mouse2 - 1.0;
    vec2 extents1 = (vec2(u_brushSize,u_brushSize) / u_resolution);
    vec2 extents = extents1 * 2.0;
    v_mouse = clipMouse;

    vec2 offset1 = (u_offset / u_resolution);
    vec2 offset2 = offset1 * 2.0;
    v_offset = offset2 - 1.0;
    
    vec2 usePosition = a_position - vec2(.5,.5);
    vec2 finalPosition = clipMouse + (usePosition * extents);
    v_texcoord = (finalPosition);

    v_brushSize = u_brushSize;
    v_resolution = u_resolution;

    gl_Position = vec4(finalPosition * vec2(1,-1), 0, 1);
}