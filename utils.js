
let gl;

function icosahedron(smooth)
{
    smooth = smooth || false;
    let ico = {};
    let t = (1 + Math.sqrt(5)) / 2;

   let p = [
        -1,  t,  0,
        1,  t,  0,
        -1, -t,  0,
        1, -t,  0,

        0, -1,  t,
        0,  1,  t,
        0, -1, -t,
        0,  1, -t,

        t,  0, -1,
        t,  0,  1,
        -t,  0, -1,
        -t,  0,  1
    ];
    let i = [
        0, 11, 5,
        0, 5, 1,
        0, 1, 7,
        0, 7, 10,
        0, 10, 11,

        1, 5, 9,
        5, 11, 4,
        11, 10, 2,
        10, 7, 6,
        7, 1, 8,

        3, 9, 4,
        3, 4, 2,
        3, 2, 6,
        3, 6, 8,
        3, 8, 9,

        4, 9, 5,
        2, 4, 11,
        6, 2, 10,
        8, 6, 7,
        9, 8, 1
    ];

    if(smooth)
    {
        ico.positions = p.slice();
        ico.indices = i;
        ico.normals = p.slice();
    }
    else
    {
        ico.positions = posFromIndices(p, i);
        ico.normals = [];
        for(let i = 0; i < ico.positions.length; i += 9)
        {
            let vec1 = sub(ico.positions.slice(i+3, i+6), ico.positions.slice(i, i+3));
            let vec2 = sub(ico.positions.slice(i+6, i+9), ico.positions.slice(i, i+3));
            let c = cross(vec1, vec2);
            ico.normals = ico.normals.concat(normalize(c));
            ico.normals = ico.normals.concat(normalize(c));
            ico.normals = ico.normals.concat(normalize(c));
        }
    }

    return ico;

    function posFromIndices(pos, indices)
    {
        let positions = [];
        for(let i = 0; i < indices.length; i++)
        {
            positions.push(pos[indices[i] * 3 + 0]);
            positions.push(pos[indices[i] * 3 + 1]);
            positions.push(pos[indices[i] * 3 + 2]);
        }
        return positions;
    }

    function cross(v1,v2)
    {
        let v3 = [];
        v3.push(v1[1] * v2[2] - v1[2] * v2[1]);
        v3.push(v1[2] * v2[0] - v1[0] * v2[2]);
        v3.push(v1[0] * v2[1] - v1[1] * v2[0]);

        return v3;
    }

    function sub(v1, v2)
    {
        v3 = [];
        v3.push(v1[0] - v2[0]);
        v3.push(v1[1] - v2[1]);
        v3.push(v1[2] - v2[2]);

        return v3;
    }
}

function negateVec(vec)
{
    if(!vec.hasOwnProperty("length"))
        return null;

    let nVec = vec.slice();
    for(let i = 0; i < nVec.length; i++)
    {
        nVec[i] *= -1;
    }

    return nVec;
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function normalize(vec)
{
    if(!vec.hasOwnProperty("length"))
        return null;

    let normVec = vec.slice();
    let mag = magnitute(normVec);

    for(let i = 0; i < normVec.length; i++)
    {
        normVec[i] /= mag;
    }
    return normVec;
}

function magnitute(vec)
{
    if(!vec.hasOwnProperty("length"))
        return null;

    pSum = 0;
    for(let n of vec)
    {
        pSum += Math.pow(n, 2);
    }

    return Math.sqrt(pSum);
}
function createSphere(latBands, longBands, r)
{
    // The code below defines the positions, colors, indices and normals of a sphere.

    var latitudeBands = latBands;
    var longitudeBands = longBands;
    var radius = r;

    let sphere = {
        positions : [],
        normals : [],
        texCoords : [],
        indices : []
    };

    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var cosTheta = Math.cos(theta);
        var sinTheta = Math.sin(theta);

        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);

            sphere.normals.push(x);
            sphere.normals.push(y);
            sphere.normals.push(z);
            sphere.positions.push(radius * x);
            sphere.positions.push(radius * y);
            sphere.positions.push(radius * z);
            sphere.texCoords.push(u);
            sphere.texCoords.push(v);
        }
    }

    for (latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (longNumber=0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            sphere.indices.push(first);
            sphere.indices.push(second);
            sphere.indices.push(first + 1);

            sphere.indices.push(second);
            sphere.indices.push(second + 1);
            sphere.indices.push(first + 1);
        }
    }
    return sphere;
}

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

}

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
            window.setTimeout(callback, 1000/60);
        };
})();
