// Wordnik API settings
const apiUri = 'https://api.wordnik.com/v4';
const apiKey = '38neaaotr4l4p0b3vujuiu1jg1s7xgg1ydagjylqkrdyz2ieh';
const apiUriParms = `limit=20&partOfSpeech=noun,adjective,verb&sourceDictionaries=all&includeRelated=false&api_key=${apiKey}`;

// This object contains word information and functions to fetch
// random words and definitions through external api calls.
let wordGenerator = {
    'word': [],
    'definition': '',
    'generate': async function () {

        try {

            // get random word
            let randomWord = this.getRandomWord();

            // look up definition
            let wordDefn = await this.getDefinition(randomWord);

            // Update current word and definition fields
            this.word = randomWord.split('');
            this.definition = wordDefn;

        } catch (error) {
            console.log(`Error generating word: ${error}`);
        }

        // TODO - handle error case. Set default word/def.

    },
    'getRandomWord': function () {

        let randomNum = Math.floor(Math.random() * words.length);
        let word = words[randomNum];
        console.log(`Random word: ${word}`);

        return word;
    },
    'getDefinition': async function (word) {

        let resource = `word.json/${word}/definitions`;
        let requestUri = `${apiUri}/${resource}?${apiUriParms}`;

        let response = await fetch(requestUri);
        if (response.status !== 200) {
            // Unknown error encountered
            // todo - maybe return default value to use?
            console.log(`Error fetching word definition: ${response.message}`);
            return 'Sorry, no hint this time!';
        }

        let definitions = await response.json();

        // Find a definition that exists for our word
        let wordDefinition = definitions.find(d => d.text && typeof (d.text) === 'string');
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
        this.mask = [...this.word].fill('_');
    },
    'startGame': function () {
        // TODO
        this.initGame();
    },
    'initGame': async function () {

        await this.wordGenerator.generate();
        this.word = this.wordGenerator.word;
        this.definition = this.wordGenerator.definition;

        this.setMask();
        this.guessCount = 0;
        this.started = true;
        console.log('!!! Game started !!!');
        console.log(this);
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

game.initGame();