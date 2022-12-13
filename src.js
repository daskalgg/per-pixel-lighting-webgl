/*
  SPECULARITY:

  Specular highlight is the reflection of a light source on an object.
  To calculate the specular highlight on a point
  we use max(dot(R, V), 0.0), where R is the mirror reflection of the light direction
  off of the surface and V is the normalized vector from the point towards the camera.

	PER-FRAGMENT LIGHTING:

  Until now we have been doing our lighting in the vertex shader. So, for every vertex we calculate
  the light and the specular highlights and we pass it as a color to the fragment shader.
  The fragment shader then get the interpolated colors and fills the pixels of the final image.


  This generally is not a good approach because we can only have as
  much variation in our lighting, as the number of vertices that are in our mesh.
	This proplem is very apparent when the shininess value is high ( 60 or more ) or we have a mesh with
	a small number of vertices, (a cube for example).

  per-fragment lighting is when, instead of interpolating the color from the lights we interpolate
  the normals of every vertex and calculate the light for every normal.

  Below you can see how we do that.


*/
function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image); // ** loads the image data to our texture.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // ** Filter used for dispaying the image at more than 100% it's size. (gl.LINEAR, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);// ** Filter used for dispaying the image at less than 100% it's size. (gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR, gl.LINEAR_MIPMAP_LINEAR.)

    gl.generateMipmap(gl.TEXTURE_2D); // ** We create mipmaps.

    gl.bindTexture(gl.TEXTURE_2D, null); // ** unbind texture.
}


var boxTexture; // ** Global texture variable.

function initTexture() {
    boxTexture = gl.createTexture(); // ** We create our texture.
    boxTexture.image = new Image(); // ** We create an image
    boxTexture.image.src = "uv_checker large.png"; // ** We load the image we will use as our texture.
    boxTexture.image.onload = function () {
        handleLoadedTexture(boxTexture);
    };
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    // Here we set and pass the uniform matrix that will rotate the normals in the vertex shader.
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function setupAttributes()
{
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord"); // ** We get the attribute index for the texture coords attribute.
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute); // ** We enable the attribute.

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler"); // ** We get the uniform index.

    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");


    shaderProgram.specularColor = gl.getUniformLocation(shaderProgram, "uSpecularColor");
    shaderProgram.hardness = gl.getUniformLocation(shaderProgram, "uHardness");
}

let currentlyPressedKeys = {};

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}


function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

let zMove = 0, xMove = 0;

function handleKeys() {

    if (currentlyPressedKeys[37]) {
        xMove -= 0.1;
    }
    if (currentlyPressedKeys[39]) {
        xMove += 0.1;
    }

    if (currentlyPressedKeys[38]) {
        zMove -= 0.1;
    }
    if (currentlyPressedKeys[40]) {
        zMove += 0.1;
    }
}

let sphereBuffers = {};
function initBuffers() {
    let sphere = createSphere(30, 30, 1);

    sphereBuffers.pos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.pos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.positions), gl.STATIC_DRAW);
    sphereBuffers.pos.itemSize = 3;
    sphereBuffers.pos.numItems = sphere.positions.length / 3;

    sphereBuffers.normals = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.normals);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.normals), gl.STATIC_DRAW);
    sphereBuffers.normals.itemSize = 3;
    sphereBuffers.normals.numItems = sphere.normals.length / 3;

    sphereBuffers.texCoords = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.texCoords);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.texCoords), gl.STATIC_DRAW);
    sphereBuffers.texCoords.itemSize = 2;
    sphereBuffers.texCoords.numItems = sphere.texCoords.length / 2;

    sphereBuffers.indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereBuffers.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.indices), gl.STATIC_DRAW);
    sphereBuffers.indices.itemSize = 1;
    sphereBuffers.indices.numItems = sphere.indices.length;
}


function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);
    mat4.translate(mvMatrix, [-xMove, 0, -zMove]);
    mat4.rotate(mvMatrix, degToRad(yRot), [1, 1, 0]);
    setMatrixUniforms();

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.pos);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereBuffers.pos.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.normals);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereBuffers.normals.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.texCoords);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, sphereBuffers.texCoords.itemSize, gl.FLOAT, false, 0, 0);

    gl.uniform3fv(shaderProgram.lightingDirectionUniform, negateVec(normalize([1, 0, -1])));
    gl.uniform3fv(shaderProgram.directionalColorUniform, [1.0, 1.0, 1.0]);

    gl.uniform3fv(shaderProgram.specularColor, [1.0, 1.0, 1.0]);
    gl.uniform1f(shaderProgram.hardness, 9.0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereBuffers.indices);
    gl.drawElements(gl.TRIANGLES, sphereBuffers.indices.numItems, gl.UNSIGNED_SHORT, 0);

}

//  animation
var lastTime = 0;
var yRot = 0;
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        yRot += (20 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick);
    handleKeys();
    animate();
    drawScene();
}

function webGLStart() {
    var canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders();
    setupAttributes();
    initBuffers();
    initTexture();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}
