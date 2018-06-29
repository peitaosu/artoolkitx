// Many thanks to https://github.com/Planeshifter for his project: https://github.com/Planeshifter/emscripten-examples/tree/master/01_PassingArrays

function _arrayToHeap(typedArray){
    var numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
    var ptr = Module._malloc(numBytes);
    var heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, numBytes);
    heapBytes.set(new Uint8Array(typedArray.buffer));
    return heapBytes;
  }

Module["getProjectionMatrix"] = function(nearPlane, farPlane){
    var projectionMatrix = new Float64Array(16);
    var heapBytes = _arrayToHeap(projectionMatrix);

    if( ! Module.ccall('arwGetProjectionMatrix', 'boolean',['number','number','number'], [nearPlane, farPlane, heapBytes.byteOffset])) {
        return undefined;
    }
    var returnValue = new Float64Array(heapBytes);
    Module._free(heapBytes.byteOffset);

    return returnValue;
   };

Module["queryTrackableVisibilityAndTransformation"] = function (trackableId) {
    var matrix = new Float64Array(16);
    var heapBytes = _arrayToHeap(matrix);

    if( ! Module.ccall('arwQueryTrackableVisibilityAndTransformation','boolean',['number', 'number'], [trackableId, heapBytes])) {
        return false;
    }
    matrix = new Float64Array(heapBytes);
    Module._free(heapBytes.byteOffset);

    return matrix;
}

Module["getTrackablePatternConfig"] = function (trackableId, patternID) {
    var heapBytes = _arrayToHeap(new Float64Array(16));
    var widthHeapBytes = _arrayToHeap(new Float64Array(1));
    var heightHeapBytes = _arrayToHeap(new Float64Array(1));
    var sizeXHeapBytes = _arrayToHeap(new Float64Array(1));
    var sizeYHeapBytes = _arrayToHeap(new Float64Array(1));
    if( !Module.ccall('arwGetTrackablePatternConfig','boolean',['number','number','number','number','number','number','number','number'], [trackableId, patternID, heapBytes, widthHeapBytes, heightHeapBytes, sizeXHeapBytes, sizeYHeapBytes])){
        return undefined;
    }

    var returnObject = {
        matrix: new Float64Array(heapBytes),
        width: new Float64Array(widthHeapBytes)[0],
        height: new Float64Array(heightHeapBytes)[0],
        sizeX: new Float64Array(sizeXHeapBytes)[0],
        sizeY: new Float64Array(sizeXHeapBytes)[0]
    };
    Module._free(heapBytes);
    Module._free(widthHeapBytes);
    Module._free(heightHeapBytes);
    Module._free(sizeXHeapBytes);
    Module._free(sizeYHeapBytes);

    return returnObject;
}
    
Module["getTrackablePatternImage"] = function (trackableId, patternID) {

    //Read trackable pattern config to get the size of the trackable. This is needed to define the Array size.
    var trackableConfig= Module.getTrackablePatternConfig(trackableId,patternID);
    if(trackableConfig) {
        var imageBuffer = _arrayToHeap(new Uint32Array(trackableConfig.width,trackableConfig.height));

        if ( ! Module.ccall('arwGetTrackablePatternImage', 'boolean', ['number','number','number'], [trackableId, patternID, imageBuffer]) ) {
            return undefined;
        }
        imageBuffer = Uint32Array(imageBuffer);
        Module._free(imageBuffer);
        return imageBuffer;
    }
}

Module["loadOpticalParams"] = function(opticalParamName, opticalParamBuffer, projectionNearPlane, projectionFarPlane) {

    var opticalParamBufferLength = 0;
    var opticalParamBufferHeap;
    if(!opticalParamName) {
        var opticalParamBufferHeap = _arrayToHeap(opticalParamBuffer);
        var opticalParamBufferLength = opticalParamBuffer.length;
    }

    var fovHeap = _arrayToHeap(new Float64Array(1));
    var aspectHeap = _arrayToHeap(new Float64Array(1));
    var transformationMatrixHeap = _arrayToHeap(new Float64Array(16));
    var perspectiveMatrixHeap = _arrayToHeap(new Float64Array(16));

    Module.ccall('arwLoadOpticalParams', 'boolean', ['string', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'], [opticalParamName, opticalParamBufferHeap, opticalParamBufferLength, projectionNearPlane, projectionFarPlane, fovHeap, aspectHeap, transformationMatrixHeap, perspectiveMatrixHeap]);

    var returnObject = {
        fov: new Float64Array(fovHeap)[0],
        aspect: new Float64Array(aspectHeap)[0],
        opticalParamsTransMatrix: new Float64Array(transformationMatrixHeap),
        perspectiveMatrix: new Float64Array(perspectiveMatrixHeap)
    }

    Module._free(fovHeap);
    Module._free(aspectHeap);
    Module._free(transformationMatrixHeap);
    Module._free(perspectiveMatrixHeap);
    return returnObject;
}

/**
 *  
 *  This is the core ARToolKit marker detection function. It calls through to a set of
    internal functions to perform the key marker detection steps of binarization and
    labelling, contour extraction, and template matching and/or matrix code extraction.

    Typically, the resulting set of detected markers is retrieved by calling arGetMarkerNum
    to get the number of markers detected and arGetMarker to get an array of ARMarkerInfo
    structures with information on each detected marker, followed by a step in which
    detected markers are possibly examined for some measure of goodness of match (e.g. by
    examining the match confidence value) and pose extraction.
 * @param {Uint8ClampedArray} [image]
 * @param {Uint8ClampedArray} [lumaImage]
 * @return {number}     0 if the function proceeded without error, or a value less than 0 in case of error.
 * A result of 0 does not however, imply any markers were detected.
 */

Module["detectMarker"] = function(image, lumaImage) {
    var imagePtr = _arrayToHeap(image);
    var lumaPtr = _arrayToHeap(lumaImage);

    var success = Module.ccall('detectMarker', 'number', ['number, number'] , [imagePtr, lumaPtr]);

    Module._free(imagePtr);
    Module._free(imagePtr);

    return success;
};