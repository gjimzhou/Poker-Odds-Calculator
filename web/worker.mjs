import { calculate } from './engine.mjs';
self.onmessage = ({ data }) => {
  try {
    const result = calculate(data, progress => self.postMessage({ progress }));
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error.message }); }
};
