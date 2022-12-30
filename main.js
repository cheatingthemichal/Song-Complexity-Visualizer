//Sources:
//how to load audio file: https://stackoverflow.com/questions/16215771/how-to-open-select-file-dialog-via-js
//what is permutation entropy: https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.88.174102
//how to make visualizations: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
//i learned how to make the visualiztions pretty here: https://gg-gina.medium.com/how-to-music-visualizer-web-audio-api-aa007f4ea525

//possible values for fft size (must be power of 2)
fft_values = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
//default is to turn off "stupid" mode and start with oscilloscope
stupid = "off";
version = "osc";

//gives color based on entropy
function getStyle(entropy) {
  r = 2**(entropy*17)/parseInt(document.getElementById("norm").value)
  g = 4**(entropy*19)/parseInt(document.getElementById("norm").value)
  b = 3**(entropy*19)/parseInt(document.getElementById("norm").value)
  style = "rgb(" + r.toString() + ", " + g.toString() + ", " + b.toString() + ")"
  return style
}

//calculated permutation entropy of an array
function permEntropy(arr) {
  entropy = 0
  ordinals = ordinal_pattern(arr)
  numberTriplets = arr.length - 3 + 1

  for (let perm in ordinals) { //calcualte shannon entropy
    count = ordinals[perm]
    if(count != 0) {
      freq = count/numberTriplets
      entropy -= freq*Math.log2(freq)
    }
  }

  norm_entropy = entropy/Math.log2(6) //normalize

  return norm_entropy
}

//calculates count of each triplet type in array
function ordinal_pattern(arr) {
  //embedding dimension = 3 (this means we look at triplets of numbers)
  //default tau = 5 (look at "neighbours" 5 numbers apart) (this is because consecutive numbers are often repeats)

  //Example (tau = 1): arr = [1, 5, 6, 2, 3]
  //triplets = (1, 5, 6), (5, 6, 2), (6, 2, 3)
  //(1, 5, 6) has type [0, 1, 2]
  //(5, 6, 2) has type [1, 2, 0]
  //(6, 2, 3) has type [2, 0, 1]
  //Ordinals = {[0, 1, 2]: 1, [5, 6, 2]: 1, [6, 2, 3]: 1}

  var Ordinals = {}
  tau = parseInt(document.getElementById("tau").value);
  for(var i = 0; i < arr.length - 2; i += tau) {
    first = arr[i]
    second = arr[i+1]
    third = arr[i+2]

    if (first <= second) {
      if (second <= third) {
        incrementDict(Ordinals, [0, 1, 2])
      }
      else {
        if(first <= third) {
          incrementDict(Ordinals, [0, 2, 1])
        }
        else {
          incrementDict(Ordinals, [1, 2, 0])
        }
      }
    } else {
      if (second <= third) {
        if (first <= third) {
          incrementDict(Ordinals, [1, 0, 2])
        }
        else {
          incrementDict(Ordinals, [2, 0, 1])
        }
      } else {
        incrementDict(Ordinals, [2, 1, 0])
      }
    }
  }

  return Ordinals
}

//incremenets value of dictionary by 1
function incrementDict(dict, key) {
  if (key in dict) {
    dict[key] += 1
  }
  else {
    dict[key] = 1
  }
}

window.onload = function() {
  //init html consts
  const input = document.getElementById("input");
  const audio = document.getElementById("audio");
  const canvas = document.getElementById("canvas");

  input.onchange = function() {
    //create audio context
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    //get audio file
    const files = this.files;
    audio.src = URL.createObjectURL(files[0]);

    //hook up analyser and source
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaElementSource(audio);
    analyser.connect(audioCtx.destination);
    source.connect(analyser); 
    
    //start playing music
    audio.play();

    //set fft size from user
    var inputFFT = document.getElementById("fft");
    inputFFT.oninputFFT = function(){
      true_value = fft_values[this.value];
      analyser.fftSize = true_value;
    };
    inputFFT.oninputFFT();

    //create array with size half of fft
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength); 
    
    //set canvas where visualiztion will appear
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    const canvasCtx = canvas.getContext("2d");
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    //draw a frame of frequency bar graph
    function drawBar() {
      //set fft size again
      var inputFFT = document.getElementById("fft");
      inputFFT.oninputFFT();
      //create array with size half of fft
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength); 
      //request animation frame according to set version
      if (version == "bar") {
        const drawVisual = requestAnimationFrame(drawBar);
      }
      else {
        const drawVisual = requestAnimationFrame(drawOsc);
      }
      //copy frequency domain data into array
      analyser.getByteFrequencyData(dataArray);
      //calculate entropy
      entropy = permEntropy(dataArray);
      canvasCtx.fillStyle = "rgb(400, 200, 200)";
      //reset frame, unless we are in memory mode
      if (stupid == "off") {
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      const barWidth = (WIDTH / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      //draw bars
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i]*2.5;
        //set color according to entropy
        style = getStyle(entropy)
        canvasCtx.fillStyle = style;
        canvasCtx.fillRect(x, (HEIGHT - barHeight), barWidth, barHeight);
    
        x += barWidth + 5;
      }
    }    

    //draw frame of oscilloscope
    function drawOsc() {
      //set fft size again
      var inputFFT = document.getElementById("fft");
      inputFFT.oninputFFT();
      //create array with size half of fft
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength); 
      //request animation frame according to set version
      if (version == "bar") {
        const drawVisual = requestAnimationFrame(drawBar);
      }
      else {
        const drawVisual = requestAnimationFrame(drawOsc);
      }
      //copy time domain data into array
      analyser.getByteTimeDomainData(dataArray);
      entropy = permEntropy(dataArray)
      //reset frame, unless we are in memory mode
      canvasCtx.fillStyle = "rgb(400, 200, 200)";
      if (stupid == "off") {
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      //sets line width according to entropy
      canvasCtx.lineWidth = 3**(entropy*17)/parseInt(document.getElementById("norm").value);
      //sets color according to entropy
      style = getStyle(entropy)
      canvasCtx.strokeStyle = style;
      //draws oscilloscope
      canvasCtx.beginPath();
      const sliceWidth = WIDTH / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (HEIGHT / 2);
      
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
      
        x += sliceWidth;
      }
      canvasCtx.lineTo(WIDTH, HEIGHT / 2);
      canvasCtx.stroke();
    }

    //are we in stupid/memory mode?
    let stupid_values = document.getElementById("stupid").stupid;
    for (let i = 0; i < stupid_values.length; i++) {
        stupid_values[i].onclick = function() {
        stupid = this.value;
      };
    }
    //are we drawing bar or oscilloscope
    let version_values = document.getElementById("version").version;
    for (let i = 0; i < version_values.length; i++) {
        version_values[i].onclick = function() {
        version = this.value;
      };
    }
    if ("version == bar") {
      drawBar();
    }
    else {
      drawOsc();
    }
  }
}