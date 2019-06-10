const apiUri = 'https://api.wordnik.com/v4';
const apiKey = '38neaaotr4l4p0b3vujuiu1jg1s7xgg1ydagjylqkrdyz2ieh';
const uriParams = `hasDictionaryDef=true&includePartOfSpeech=noun&maxCorpusCount=-1&minDictionaryCount=3&maxDictionaryCount=-1&minLength=4&maxLength=10&api_key=${apiKey}`;

// This object contains word information and functions to fetch
// random words and definitions through external api calls.
let wordGenerator = {
    'word': [],
    'definition': '',
    'generate': async function () {
        //TODO
        // get random word
        let randomWord = await this.getRandomWord();

        // look up definition
        let wordDefn = await this.getDefinition(randomWord);

        // update this word, definition vars
        // this.word = randomWord.split('');
        // this.definition = wordDef;
    },
    'getRandomWord': async function () {

        let resource = 'words.json/randomWord';
        let requestUri = `${apiUri}/${resource}?${uriParams}`;

        let response = await fetch(requestUri);
        if (response.status !== 200) {
            // Unknown error encountered
            // todo - maybe return default value to use?
            console.log(`Error fetching random word: ${response}`);
            return 'game';
        }

        let word = await (response.json()
            .then(data => {
                console.log(`Random word generated: ${data.word}`);
                return data.word;
            })
            .catch(err => {
                console.log(`Error parsing random word data to Json: ${err}`);
                throw err;
            }));

        return word;
    },
    'getDefinition': async function (word) {

        //TODO
        let resource = `word.json/${word}/definitions`;
        let requestUri = `${apiUri}/${resource}?${uriParams}`;

        let response = await fetch(requestUri);
        if (response.status !== 200) {
            // Unknown error encountered
            // todo - maybe return default value to use?
            console.log(`Error fetching word definition: ${response.message}`);
            return undefined;
        }

        let definitions = await response.json();

        // Find a definition that exists for our word
        let wordDefinition = definitions.find(d => d.text);
        let formatted = this.formatText(wordDefinition.text);

        console.log(`Word definition: ${formatted}`);
        return formatted;
    },
    'formatText': function (text) {

        let specialCharsRegex = /[<]{1}[/]?[a-z"= ]{1,}[>]{1}|\s+[.]{1}$/gi;
        let excessSpaceRegex = /\s{2,}/g;

        if (specialCharsRegex.test(text)) {
            text = text.replace(specialCharsRegex, '');
        }
        if (excessSpaceRegex.test(text)) {
            text = text.replace(excessSpaceRegex, ' ');
        }

        return text;
    }
};

wordGenerator.generate();

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