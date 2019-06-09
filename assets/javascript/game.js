const apiUri = 'http://api.wordnik.com/v4';
const apiKey = '38neaaotr4l4p0b3vujuiu1jg1s7xgg1ydagjylqkrdyz2ieh';

// This object contains word information and functions to fetch
// random words and definitions through external api calls.
let wordGenerator = {
    'word': [],
    'definition': '',
    'generate': function () {
        //TODO
        // get random word
        // look up definition
        // update this word, definition vars
    },
    'getRandomWord': function () {

        //TODO
        let resource = 'words.json/randomWord';
        let requestUri = `${apiUri}/${resource}?api_key=${apiKey}`;

        fetch(requestUri).then(res => console.log(res.json()));
    },
    'getDefinition': function (word) {

        //TODO
        let resource = `word.json/${word}/definitions`;
        let requestUri = `${apiUri}/${resource}?api_key=${apiKey}`;

        fetch(requestUri).then(res => console.log(res.json()));
    }
};

// This object holds information about the game
let game = {
    'started': false,
    'maxGuesses': 12,
    'guessCount': 0,
    'wordGenerator': wordGenerator,
    'word': [],
    'mask': [],
    'definition': '',
    'guesses': new Map(),
    'setMask': function () {
        this.mask = this.word.slice().fill('_');
    },
    'startGame': function () {
        // TODO
        this.initGame();
    },
    'initGame': function () {

        // TODO
        this.wordGenerator.generate();
        this.word = this.wordGenerator.word;
        this.definition = this.wordGenerator.definition;

        this.setMask();
        this.guessCount = 0;
        this.started = true;
    },
    'charAlreadyGuessed': function (char) {
        return this.guesses.has(char);
    },
    'wordContainsChar': function (char) {

        let matchedIndicies = [];

        this.word.forEach((c, i) => {
            if (c === char) {
                matchedIndicies.push(i);
            }
        });

        this.guesses.set(char, matchedIndicies);

        return matchedIndicies.length > 0;
    }
};

this.document.onkeyup = function (evt) {
    // TODO
}