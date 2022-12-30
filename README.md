# Song-Complexity-Visualizer
A song visualizer based on its complexity

Load an audio file by clicking "Choose File". You can pause/play, move around in the song, change playback speed, and change volume by using the slider on the bottom of the page.

There are two types of visualizations the program can create. The oscilloscope plots the waveform of the music over time. The amplitude and frequency of the waveform change according to the music. The frequency bar graph shows how the contribution of each frequency changes over time. The length of each bar represents the loudness of a given frequency. The oscilloscope is a lot more fun.

The visualization updates several times a second. When memory mode is turned off, the frame is cleared every time the visualization is updated. When memory mode is on, the frame is not cleared, and you can see the evolution of the visualization over time.

Both visualization types are created using the Web Audio Analyser node. The AnalyserNode.getByteTimeDomainData() function returns the current waveform in the form of an array of length AnalyserNode.fftSize. We use this array to construct the oscilloscope. The AnalyserNode.getByteFrequencyData() returns an array of size AnalyserNode.fftSize/2. Each element of the array is a number between 0 and 255, representing the loudness of a specific frequency. We use this array to construct the frequency bar graph. Thus "FFT Size" represents the granularity of either the waveform or frequency bar graph, depending on the visualization mode.

Before visualizing the array returned by our AnalyserNode, we run it through the permutation entropy function, which returns a value between 0 and 1. Permutation Entropy represents the "complexity" of a given array. A permutation entropy of 1 means that the array is very complex while a permutation entropy of 0 means that the array is very predictable.

Next, we look at the order type of each pair. Here {7, 9} has order type 0, 1 because 7 < 9. {10, 6} has order type 1, 0 because 10 > 6. We have 4 pairs of order type 0, 1 and 2 pairs of order type 1, 0. We have 6 pairs in total. Now we calculate p(order type), the frequency of each order type.

Permutation entropy has 2 parameters -- embedding dimension and tau. For simplicity, we set embedding dimension to 3. This means that we analyze triplets in our array. In the example above, the embedding dimension was 2. Hence we analyzed pairs. Tau represents the distance between each element in our tuples. In the example above, we used a tau of 1. Thus our tuples consisted of neighbouring elements. A tau of 2 would mean that our tuples consist of elements one neighbour apart. The user can control the tau we use in our visualization. A tau of 1, 2, or 3 can lead to extreme results because close elements in our arrays are often repeats.

We use the permutation entopy of our arrays to control the color of our visualization, as well as the thickness of the oscilloscope lines. If a fragment of music has high permutation entropy, meaning that it is complex, the visualization will become more green and the oscilloscope will become thicker. The normalization constant dictates the magnitude of the permutation entropy's effect.
