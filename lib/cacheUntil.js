const sampleOn = require('flyd/module/sampleon');
const scanMerge = require('flyd/module/scanmerge');

const cacheUntil = (trigger, inputStream) => {
  return sampleOn(trigger,
    scanMerge([
      [inputStream, (cache, e) => {
        return [
          ...cache,
          e
        ];
      }],

      [trigger, () => {
        return [];
      }]
    ],
    []
    )
  );
};

module.exports = function(a, b) {
  if (b) {
    const trigger = a; // having trigger first gives a better API for currying
    const inputStream = b;
    return cacheUntil(trigger, inputStream);
  } else {
    const inputStream = a;
    return {
      until: (trigger) => {
        return cacheUntil(trigger, inputStream);
      }
    };
  }
}
