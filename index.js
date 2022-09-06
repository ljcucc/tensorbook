import { NotebookKernel } from '/src/Notebook.js';
import { LitElement, html, css, classMap } from '/lib/lit.min.js';

import "/src/App.js";
import "/src/Notebook.js"

// close tfvis on start...
tfvis.visor().close();

// /**
//  * Convert the input data to tensors that we can use for machine
//  * learning. We will also do the important best practices of _shuffling_
//  * the data and _normalizing_ the data
//  * MPG on the y-axis.
//  */
//  function convertToTensor(data) {
//   // Wrapping these calculations in a tidy will dispose any
//   // intermediate tensors.

//   return tf.tidy(() => {
//     // Step 1. Shuffle the data
//     tf.util.shuffle(data);

//     // Step 2. Convert data to Tensor
//     const inputs = data.map(d => d.mpg)
//     const labels = data.map(d => d.label);

//     const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
//     const labelTensor = tf.tensor2d(labels, [labels.length, 3]);
//     console.log(labelTensor.dataSync());

//     //Step 3. Normalize the data to the range 0 - 1 using min-max scaling
//     const inputMax = inputTensor.max();
//     const inputMin = inputTensor.min();
//     const labelMax = labelTensor.max();
//     const labelMin = labelTensor.min();

//     const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin));
//     var normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin));

//     return {
//       inputs: normalizedInputs,
//       labels: normalizedLabels,
//       // Return the min/max bounds so we can use them later.
//       inputMax,
//       inputMin,
//       labelMax,
//       labelMin,
//     }
//   });
// }

// async function trainModel(model, inputs, labels) {
//   // Prepare the model for training.
//   model.compile({
//     optimizer: tf.train.adam(),
//     loss: tf.losses.meanSquaredError,
//     metrics: ['mse'],
//   });

//   const batchSize = 32;
//   const epochs = 50;

//   return await model.fit(inputs, labels, {
//     batchSize,
//     epochs,
//     shuffle: true,
//     callbacks: tfvis.show.fitCallbacks(
//       { name: 'Training Performance' },
//       ['loss', 'mse'],
//       { height: 200, callbacks: ['onEpochEnd'] }
//     )
//   });
// }

// async function getData() {
//   const carsDataResponse = await fetch('https://storage.googleapis.com/tfjs-tutorials/carsData.json');
//   const carsData = await carsDataResponse.json();

//   const classing = (num)=>[Number(num==0), Number(num==1), Number(num==2)];
//   const cleaned = carsData.map(car => ({
//     mpg: car.Miles_per_Gallon,
//     horsepower: car.Horsepower,
//     label: classing(['USA', 'Japan', 'Europe'].indexOf(car.Origin)),
//     origin: ['USA', 'Japan', 'Europe'].indexOf(car.Origin)
//   }))
//     .filter(car => (car.mpg != null && car.horsepower != null));
  
//   return cleaned;
// }

// async function run() {
//   // Load and plot the original input data that we are going to train on.
//   const data = await getData();
//   const values = data.map(d => ({
//     x: d.mpg,
//     y: d.origin,
//   }));

//   tfvis.render.scatterplot(
//     { name: 'Horsepower v MPG' },
//     { values },
//     {
//       xLabel: 'Horsepower',
//       yLabel: 'MPG',
//       height: 300
//     }
//   );

//   // Create the model
//   await nextStep("create");
//   const model = createModel();
//   // tfvis.show.modelSummary({ name: 'Model Summary' }, model);

//   // Convert the data to a form we can use for training.
//   const tensorData = convertToTensor(data);
//   const { inputs, labels } = tensorData;

//   // Train the model
//   const getTime = () => new Date().getTime() / 1000;

//   await nextStep("train");
//   const startTime = getTime();
//   await trainModel(model, inputs, labels);
//   console.log('Done Training', getTime() - startTime);

//   alert(getTime() - startTime)

//   await nextStep("test");
//   // Make some predictions using the model and compare them to the
//   // original data
//   testModel(model, data, tensorData);

//   await nextStep("download");
//   await model.save('downloads://my-model');
// }

// function nextStep(id){
//   return new Promise(resolve=>{
//     const btn = document.querySelector(`#${id}`);
//     btn.addEventListener("click",()=>{
//       resolve();
//     });
//   });
// }

// function createModel() {
//   // Create a sequential model
//   const model = tf.sequential();

//   // Add a single input layer
//   model.add(tf.layers.dense({ inputShape: [1], units: 1, useBias: true }));
//   model.add(tf.layers.dense({ units: 100, useBias: true }));
//   model.add(tf.layers.dense({ units: 80, useBias: true }));
//   model.add(tf.layers.dense({ units: 20, useBias: true }));

//   // Add an output layer
//   model.add(tf.layers.dense({ units: 3, useBias: true }));

//   tfvis.show.modelSummary({name: 'Model Summary'}, model);

//   return model;
// }

// function testModel(model, inputData, normalizationData) {
//   const {inputMax, inputMin, labelMin, labelMax} = normalizationData;

//   // Generate predictions for a uniform range of numbers between 0 and 1;
//   // We un-normalize the data by doing the inverse of the min-max scaling
//   // that we did earlier.
//   const [xs, preds] = tf.tidy(() => {

//     const xs = tf.linspace(0, 1, 100);
//     const preds = model.predict(xs.reshape([100, 1]));

//     const unNormXs = xs
//       .mul(inputMax.sub(inputMin))
//       .add(inputMin);

//     const unNormPreds = preds
//       .mul(labelMax.sub(labelMin))
//       .add(labelMin);

//     console.log(preds.arraySync());

//     // Un-normalize the data
//     return [unNormXs.dataSync(), unNormPreds.arraySync()];
//   });


//   const predictedPoints = Array.from(xs).map((val, i) => {
//     console.log(preds[i]);
//     return {x: val, y: preds[i].indexOf(Math.max(...preds[i]))}
//   });

//   const originalPoints = inputData.map(d => ({
//     x: d.mpg, y: d.label.indexOf(Math.max(...d.label)),
//   }));


//   tfvis.render.scatterplot(
//     {name: 'Model Predictions vs Original Data'},
//     {values: [originalPoints, predictedPoints], series: ['original', 'predicted']},
//     {
//       xLabel: 'Horsepower',
//       yLabel: 'MPG',
//       height: 300
//     }
//   );
// }

// function onload(){
//   let sel = document.querySelector("#device");
//   tf.setBackend("cpu")
//   sel.addEventListener("change", () => {
//     tf.setBackend(sel.value);
//     console.log(tf.getBackend())
//   });

//   let kernel = new NotebookKernel();
//   kernel.start();
//   window.k = kernel;
// }

// // document.addEventListener('DOMContentLoaded', run);
// // document.addEventListener('DOMContentLoaded', onload);