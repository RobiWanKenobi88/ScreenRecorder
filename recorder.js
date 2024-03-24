let shouldStop = false;
    let stopped = false;
    const downloadLink = document.getElementById('download');
    const stopButton = document.getElementById('stop');
    
/**
 * Disables the button with class 'btn-info' and enables the button with id 'stop'.
 * Hides the element with id 'download'.
 */
    function startRecord() {
        $('.btn-info').prop('disabled', true);
        $('#stop').prop('disabled', false);
        $('#download').css('display', 'none')
    }
    
    /**
     * Stops the recording and updates the button and download display.
     */
    function stopRecord() {
        $('.btn-info').prop('disabled', false);
        $('#stop').prop('disabled', true);
        $('#download').css('display', 'block')
    }
    const audioRecordConstraints = {
        echoCancellation: true
    }

    stopButton.addEventListener('click', function () {
        shouldStop = true;
    });

/**
 * Handles the recording process.
 *
 * @param {Object} options - The options for recording.
 * @param {MediaStream} options.stream - The media stream to record.
 * @param {string} options.mimeType - The MIME type of the recorded media.
 * @return {undefined} This function does not return a value.
 */
    const handleRecord = function ({stream, mimeType}) {
        startRecord()
        let recordedChunks = [];
        stopped = false;
        const mediaRecorder = new MediaRecorder(stream);

        /**
         * Handles the data available event from the media recorder.
         *
         * @param {Object} e - the event object
         * @return {void} 
         */
        mediaRecorder.ondataavailable = function (e) {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }

            if (shouldStop === true && stopped === false) {
                mediaRecorder.stop();
                stopped = true;
            }
        };

        /**
         * Handles the onstop event of the mediaRecorder.
         *
         * @param {type} paramName - description of parameter
         * @return {type} description of return value
         */
        mediaRecorder.onstop = function () {
            const blob = new Blob(recordedChunks, {
                type: mimeType
            });
            recordedChunks = []
            const filename = window.prompt('Enter file name');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `${filename || 'recording'}.webm`;
            stopRecord();
            videoElement.srcObject = null;
        };

        mediaRecorder.start(200);
    };

/**
 * Asynchronously records audio using the user's microphone and handles the recorded audio stream.
 *
 * @return {Promise<void>} A Promise that resolves when the audio recording is handled.
 */
    async function recordAudio() {
        const mimeType = 'audio/webm';
        shouldStop = false;
        const stream = await navigator.mediaDevices.getUserMedia({audio: audioRecordConstraints});
        handleRecord({stream, mimeType})
    }

/**
 * Records video using the user's camera and audio, and starts recording in the specified mimeType.
 *
 * @return {Promise<void>} Promise that resolves when recording has started.
 */
    async function recordVideo() {
        const mimeType = 'video/webm';
        shouldStop = false;
        const constraints = {
            audio: {
                "echoCancellation": true
            },
            video: {
                "width": {
                    "min": 640,
                    "max": 1024
                },
                "height": {
                    "min": 480,
                    "max": 768
                }
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        handleRecord({stream, mimeType})
    }

/**
 * Records the screen and plays it in a video element.
 *
 * @return {Promise<void>} A promise that resolves when the recording is finished.
 */
    async function recordScreen() {
        const mimeType = 'video/webm';
        shouldStop = false;
        const constraints = {
            video: {
                cursor: 'motion'
            }
        };
        if(!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
            return window.alert('Screen Record not supported!')
        }
        let stream = null;
        const displayStream = await navigator.mediaDevices.getDisplayMedia({video: {cursor: "motion"}, audio: {'echoCancellation': true}});
        if(window.confirm("Record audio with screen?")){
            const audioContext = new AudioContext();

            const voiceStream = await navigator.mediaDevices.getUserMedia({ audio: {'echoCancellation': true}, video: false });
            const userAudio = audioContext.createMediaStreamSource(voiceStream);
            
            const audioDestination = audioContext.createMediaStreamDestination();
            userAudio.connect(audioDestination);

            if(displayStream.getAudioTracks().length > 0) {
                const displayAudio = audioContext.createMediaStreamSource(displayStream);
                displayAudio.connect(audioDestination);
            }

            const tracks = [...displayStream.getVideoTracks(), ...audioDestination.stream.getTracks()]
            stream = new MediaStream(tracks);
            handleRecord({stream, mimeType})
        } else {
            stream = displayStream;
            handleRecord({stream, mimeType});
        };
        videoElement.srcObject = stream;
    }
