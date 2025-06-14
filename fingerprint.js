// WebGL Fingerprint
document.getElementById('webglBtn').addEventListener('click', async function() {
    const btn = this;
    const loading = document.getElementById('webglLoading');
    const errorDiv = document.getElementById('webglError');
    const resultDiv = document.getElementById('webglResult');
    const hashDiv = document.getElementById('webglHash');
    const detailsPre = document.getElementById('webglDetails');
    
    btn.disabled = true;
    loading.style.display = 'block';
    errorDiv.textContent = '';
    resultDiv.style.display = 'none';
    
    try {
        const webglData = getWebGLFingerprint();
        const dataString = JSON.stringify(webglData);
        const hash = await generateSHA256Hash(dataString);
        
        hashDiv.textContent = hash;
        detailsPre.textContent = JSON.stringify(webglData, null, 2);
        resultDiv.style.display = 'block';
    } catch (error) {
        errorDiv.textContent = 'Error: ' + error.message;
        console.error('WebGL fingerprint error:', error);
    } finally {
        btn.disabled = false;
        loading.style.display = 'none';
    }
});

// Audio Fingerprint
document.getElementById('audioBtn').addEventListener('click', async function() {
    const btn = this;
    const loading = document.getElementById('audioLoading');
    const errorDiv = document.getElementById('audioError');
    const resultDiv = document.getElementById('audioResult');
    const hashDiv = document.getElementById('audioHash');
    const detailsPre = document.getElementById('audioDetails');
    
    btn.disabled = true;
    loading.style.display = 'block';
    errorDiv.textContent = '';
    resultDiv.style.display = 'none';
    
    try {
        const audioData = await getAudioFingerprint();
        const dataString = JSON.stringify(audioData);
        const hash = await generateSHA256Hash(dataString);
        
        hashDiv.textContent = hash;
        detailsPre.textContent = JSON.stringify(audioData, null, 2);
        resultDiv.style.display = 'block';
    } catch (error) {
        errorDiv.textContent = 'Error: ' + error.message;
        console.error('Audio fingerprint error:', error);
    } finally {
        btn.disabled = false;
        loading.style.display = 'none';
    }
});

function getWebGLFingerprint() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
        throw new Error('WebGL not supported');
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    
    const parameters = {};
    const paramNames = [
        'VERSION', 'SHADING_LANGUAGE_VERSION',
        'MAX_TEXTURE_SIZE', 'MAX_VIEWPORT_DIMS',
        'MAX_TEXTURE_IMAGE_UNITS', 'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
        'MAX_VERTEX_TEXTURE_IMAGE_UNITS', 'MAX_RENDERBUFFER_SIZE'
    ];
    
    paramNames.forEach(name => {
        try {
            parameters[name] = gl.getParameter(gl[name]);
        } catch (e) {
            parameters[name] = 'error';
        }
    });

    const extensions = gl.getSupportedExtensions();
    const extensionData = {};
    
    const importantExtensions = [
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_depth_texture',
        'OES_texture_float',
        'OES_texture_half_float',
        'EXT_texture_filter_anisotropic'
    ];
    
    importantExtensions.forEach(ext => {
        extensionData[ext] = extensions.includes(ext);
    });

    return {
        vendor,
        renderer,
        parameters,
        extensions: extensionData
    };
}

async function getAudioFingerprint() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
        throw new Error('AudioContext not supported');
    }
    
    const context = new AudioContext();
    const audioData = {
        sampleRate: context.sampleRate,
        maxChannelCount: context.destination.maxChannelCount,
        channelCount: context.destination.channelCount
    };
    
    context.close();
    
    audioData.codecs = {
        mp3: canPlayType('audio/mpeg'),
        ogg: canPlayType('audio/ogg'),
        wav: canPlayType('audio/wav')
    };
    
    return audioData;
}

function canPlayType(type) {
    const audio = document.createElement('audio');
    return !!audio.canPlayType(type).replace(/no/, '');
}

async function generateSHA256Hash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}