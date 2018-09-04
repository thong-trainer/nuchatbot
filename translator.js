// Imports the Google Cloud client library
const Translate = require('@google-cloud/translate');

// Your Google Cloud Platform project ID
const projectId = 'aa6486b9a97774c94284daa0839a97d0db1808a2';

// Instantiates a client
const translate = new Translate({
  projectId: projectId,
});

// The text to translate
const text = 'Hello, world!';
// The target language
const target = 'km';

// Translates some text into Russian
translate
  .translate(text, target)
  .then(results => {
    const translation = results[0];

    console.log(`Text: ${text}`);
    console.log(`Translation: ${translation}`);
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
