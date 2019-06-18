// Wordnik API settings
const apiUri = 'https://api.wordnik.com/v4';
const apiKey = '38neaaotr4l4p0b3vujuiu1jg1s7xgg1ydagjylqkrdyz2ieh';
const apiUriParms = `limit=20&partOfSpeech=noun,adjective,verb&sourceDictionaries=all&includeRelated=false&api_key=${apiKey}`;

// Game sounds
const intro = new Audio('assets/media/intro.mp3');
const win = new Audio('assets/media/got_duck.mp3');
const lose = new Audio('assets/media/you_failed.mp3');
const correct = new Audio('assets/media/duck_flap.mp3');
const wrong = new Audio('assets/media/duck_lands.mp3');
const duplicate = new Audio('assets/media/duplicate.mp3');
const invalid = new Audio('assets/media/invalid.mp3');

const sounds = [intro, win, lose, correct, wrong, duplicate, invalid];

// Function to force sound resets
function resetSounds() {
    sounds.forEach(s => {
        s.pause();
        s.currentTime = 0;
    });
}

// This object contains word information and functions to fetch
// random words and definitions through external api calls.
let wordGenerator = {
    word: [],
    definition: '',
    generate: async function() {
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
    },
    getRandomWord: function() {
        // Pulls a random word from the 'WORDS' array - in words.js
        let randomNum = Math.floor(Math.random() * WORDS.length);
        let word = WORDS[randomNum];
        console.log(`Random word: ${word}`);

        return word;
    },
    getDefinition: async function(word) {
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
        let wordDefinition = definitions.find(
            d => d.text && typeof d.text === 'string'
        );
        let formatted = this.formatText(wordDefinition.text);

        console.log(`Word definition: ${formatted}`);
        return formatted;
    },
    formatText: function(text) {
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
    playing: false,
    score: 0,
    maxGuesses: 10,
    guessCount: 0,
    wordsMatched: 0,
    wordGenerator: wordGenerator,
    word: [],
    mask: [],
    definition: '',
    guesses: new Map(),
    wordToString: function() {
        return this.word.join('');
    },
    setMask: function() {
        this.mask = [...this.word].fill('_');
    },
    updateMask: function(char) {
        let matches = this.guesses.get(char);
        matches.forEach(idx => {
            this.mask[idx] = char;
        });
    },
    initGame: async function() {
        this.wordsMatched = 0;
        this.score = 0;
        await this.startNewRound();

        console.log('!!! Game started !!!');
        console.log(this);
    },
    startNewRound: async function() {
        await this.wordGenerator.generate();

        this.word = this.wordGenerator.word;
        this.definition = this.wordGenerator.definition;
        this.setMask();
        this.guessCount = 0;
        this.guesses.clear();
        this.playing = true;
    },
    charAlreadyGuessed: function(char) {
        // Checks to see if this char has already been guessed.
        return this.guesses.has(char);
    },
    wordContainsChar: function(char) {
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
    wholeWordGuessed: function() {
        return this.mask.indexOf('_') === -1;
    },
    roundLost: function() {
        return this.guessCount >= this.maxGuesses;
    },
    guess: function(char) {
        let charMatch = false;
        if (this.wordContainsChar(char)) {
            console.log(`${char} is a match.`);
            this.updateMask(char);

            // Check to see if word fully guessed
            if (this.wholeWordGuessed()) {
                this.wordsMatched++;
                this.score += this.word.length;
                console.log(`Word matched! New score: ${this.wordsMatched}`);
            }

            charMatch = true;
        } else {
            this.guessCount++;
            console.log(`${char} is NOT a match.`);

            // Check to see if any guesses remain
            if (this.roundLost()) {
                // game lost
                this.wordsMatched = 0;
                this.score = 0;
                console.log(`No guesses remain. You lose!`);
            }
        }

        this.playing = !(this.wholeWordGuessed() || this.roundLost());
        return charMatch;
    }
};

function updateScreen(game) {
    // Calculate remaining guesses
    let remainingGuesses = game.maxGuesses - game.guessCount;

    // Update word mask
    let wordMask = game.mask.join(' ');

    // Update guessed characters
    let guessedChars = [...game.guesses.keys()].join(', ');

    // Update alert
    if (game.wholeWordGuessed()) {
        $('#alert')
            .removeClass('invisible alert-primary alert-warning alert-danger')
            .addClass('visible alert-success')
            .html(
                '<strong>Good job!</strong> You matched the word! Press a key to continue.'
            );
        win.play();
    } else if (game.roundLost()) {
        wordMask = game.word.join(' ');
        $('#alert')
            .removeClass('invisible alert-primary alert-warning alert-success')
            .addClass('visible alert-danger')
            .html(
                '<strong>You lose!</strong> No guesses remain. The game will now reset.'
            );
        lose.play();
    }

    // Update screen
    $('#hint').text(game.definition);
    $('#word').text(wordMask);
    $('#guessCt').text(remainingGuesses);
    $('#score').text(game.score);
    $('#wins').text(game.wordsMatched);
    $('#guesses').text(guessedChars);
}

this.document.onkeyup = async function(evt) {
    resetSounds();

    try {
        // check if game started -> start if not
        if (!game.playing) {
            $('#alert')
                .removeClass('visible')
                .addClass('invisible');
            await game.startNewRound();
            return;
        }

        // Validate input
        if (evt.keyCode < 65 || evt.keyCode > 90) {
            console.log(`Invalid key pressed: "${evt.key}"`);
            $('#alert')
                .removeClass(
                    'invisible alert-primary alert-success alert-danger'
                )
                .addClass('visible alert-warning')
                .html(`<strong>"${evt.key}"</strong> is not a valid guess.`);
            return;
        }

        // Check to see if character already guessed
        if (game.charAlreadyGuessed(evt.key)) {
            $('#alert')
                .removeClass(
                    'invisible alert-primary alert-success alert-danger'
                )
                .addClass('visible alert-warning')
                .html(`You already guessed <strong>${evt.key}</strong>`);
            duplicate.play();
            return;
        } else {
            // Hide alert
            $('#alert')
                .removeClass('visible')
                .addClass('invisible');
        }

        // Perform guess
        let match = game.guess(evt.key.toLowerCase());

        if (match) {
            correct.play();
        } else {
            wrong.play();
        }
    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        updateScreen(game);
    }
};

this.document.addEventListener('DOMContentLoaded', () => {
    sounds.forEach(s => s.load());
    intro.play();
});
