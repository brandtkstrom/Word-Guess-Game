// Wordnik API settings
const apiUri = 'https://api.wordnik.com/v4';
const apiKey = '38neaaotr4l4p0b3vujuiu1jg1s7xgg1ydagjylqkrdyz2ieh';
const apiUriParms = `limit=20&partOfSpeech=noun,adjective,verb&sourceDictionaries=all&includeRelated=false&api_key=${apiKey}`;

const successSound = new Audio('assets/media/game-sound-correct.ogg');
const wrongSound = new Audio('assets/media/game-sound-wrong.ogg');

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

        // Pulls a random word from the 'WORDS' array - in words.js
        let randomNum = Math.floor(Math.random() * WORDS.length);
        let word = WORDS[randomNum];
        console.log(`Random word: ${word}`);

        return word;
    },
    'getDefinition': async function (word) {

        // Retrieves a definition for our word using the Wordnik API.
        let resource = `word.json/${word}/definitions`;
        let requestUri = `${apiUri}/${resource}?${apiUriParms}`;

        let response = await fetch(requestUri);
        if (response.status !== 200) {

            // Unknown error encountered. Just return no hint in this case.
            console.log(`Error fetching word definition: ${response.message}`);
            return 'Sorry, no hint this time!';
        }

        let definitions = await response.json();

        // Find a definition that exists for our word.
        let wordDefinition = definitions.find(d => d.text && typeof (d.text) === 'string');
        let formatted = this.formatText(wordDefinition.text);

        console.log(`Word definition: ${formatted}`);
        return formatted;
    },
    'formatText': function (text) {

        // Strips special characters, tags, and extra whitespace from the provided string.
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
    'playing': false,
    'maxGuesses': 5,
    'guessCount': 0,
    'wordsMatched': 0,
    'wordGenerator': wordGenerator,
    'word': [],
    'mask': [],
    'definition': '',
    'guesses': new Map(),
    'wordToString': function () {
        return this.word.join('');
    },
    'setMask': function () {
        this.mask = [...this.word].fill('_');
    },
    'updateMask': function (char) {
        let matches = this.guesses.get(char);
        matches.forEach(idx => {
            this.mask[idx] = char;
        });
    },
    'initGame': async function () {

        this.wordsMatched = 0;
        await this.startNewRound();

        console.log('!!! Game started !!!');
        console.log(this);
    },
    'startNewRound': async function () {

        await this.wordGenerator.generate();

        this.word = this.wordGenerator.word;
        this.definition = this.wordGenerator.definition;
        this.setMask();
        this.guessCount = 0;
        this.guesses.clear();
        this.playing = true;
    },
    'charAlreadyGuessed': function (char) {

        // Checks to see if this char has already been guessed.
        return this.guesses.has(char);
    },
    'wordContainsChar': function (char) {

        // Does our word contain the provided (guessed) char? If so,
        // note the matching indicies and return True or False.
        let matchedIndicies = [];

        this.word.forEach((c, i) => {
            if (c === char) {
                matchedIndicies.push(i);
            }
        });

        this.guesses.set(char, matchedIndicies);

        return matchedIndicies.length > 0;
    },
    'wholeWordGuessed': function () {

        return this.mask.indexOf('_') === -1;
    },
    'roundLost': function () {

        return this.guessCount >= this.maxGuesses;
    },
    'guess': function (char) {

        // TODO
        if (this.charAlreadyGuessed(char)) {

            console.log(`${char} already guessed.`);
            return;
        }
        if (this.wordContainsChar(char)) {

            console.log(`${char} is a match.`);
            this.updateMask(char);

            // Check to see if word fully guessed
            if (this.wholeWordGuessed()) {
                this.wordsMatched++;
                console.log(`Word matched! New score: ${this.wordsMatched}`);
            }
        } else {

            this.guessCount++;
            console.log(`${char} is NOT a match.`);

            // Check to see if any guesses remain 
            if (this.roundLost()) {
                // game lost
                console.log(`No guesses remain. You lose!`);
            }
        }

        this.playing = !(this.wholeWordGuessed() || this.roundLost());
    }
};

function updateScreen(game) {

    // Calculate remaining guesses
    let remainingGuesses = game.maxGuesses - game.guessCount;

    // Update word mask
    let wordMask = game.mask.join(' ');

    // Update guessed characters
    let guessedChars = [...game.guesses.keys()].join(', ');

    // Update screen
    $('#hint').text(game.definition);
    $('#word').text(wordMask);
    $('#guessCt').text(remainingGuesses);
    $('#wins').text(game.wordsMatched);
    $('#guesses').text(guessedChars);
};

this.document.onkeyup = async function (evt) {

    try {

        // check if game started -> start if not
        if (!game.playing) {
            $('#alert').removeClass('visible').addClass('invisible');
            await game.startNewRound();
            return;
        }
        // Validate input
        if (evt.keyCode < 65 || evt.keyCode > 90) {
            console.log(`Invalid key pressed: "${evt.key}"`);
            return;
        }

        // Perform guess
        game.guess(evt.key.toLowerCase());

        // Check to see if this round has ended
        if (game.wholeWordGuessed()) {
            $('#alert').removeClass('invisible alert-primary alert-danger').addClass('visible alert-success')
                .html('<strong>Good job!</strong> You matched the word!');
        } else if (game.roundLost()) {
            $('#alert').removeClass('invisible alert-primary alert-success').addClass('visible alert-danger')
                .html('<strong>You lose!</strong> No guesses remain. The game will now reset.');
            game.wordsMatched = 0;
        }

    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        updateScreen(game);
    }
}