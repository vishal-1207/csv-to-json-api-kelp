/**
 * Converts a flat object with dot-notation keys into a deeply nested object.
 * This function is the core of the custom JSON conversion logic.
 *
 * @param {object} flatObject - A simple key-value object.
 * @returns {object} - A nested object created from the dot-separated keys.
 */
export const createNestedObject = (flatObject) => {
  const nestedObject = {};

  for (const key in flatObject) {
    if (Object.prototype.hasOwnProperty.call(flatObject, key)) {
      const keys = key.split(".");
      let currentLevel = nestedObject;

      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          currentLevel[k] = flatObject[key];
        } else {
          if (!currentLevel[k] || typeof currentLevel[k] !== "object") {
            currentLevel[k] = {};
          }

          currentLevel = currentLevel[k];
        }
      });
    }
  }

  return nestedObject;
};
