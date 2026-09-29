import {traceChart} from './chart-trace.js';import {assessTrace} from './chart-quality.js';import {waveFeatures} from './features.js';
export function analyzeDecodedChart(image){const trace=traceChart(image);const quality=assessTrace(trace);return{trace,quality,features:quality.usable?waveFeatures(trace.points):null}}
