import Cache from './mock/cache.js';
import mockKV from './mock/kv.js';
import worker from '/workspace/piciqiufans/src/index.js';

Cache.port = 18080;
mockKV.port = 18080;

export default worker;
