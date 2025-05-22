// typewriter speed
// set delay time between each character typing time
const CharDelay = 50

// pause time between each completed word (delay before next word starts)
const WordPause = 1000

// set initial word in dataText array
const WordOffset = 0

// set sequence restart interval N [ms]
const RestartInterval = 800

export const typeWriter = (text: string, i: number, fnCallback: () => void) => {
    if (document.querySelector("#typewriter") !== null) {
        if (i < (text.length)) {
            document.querySelector("#typewriter").innerHTML = text.substring(0, i + 1) + '<span aria-hidden="true"></span>';
            setTimeout(function () {
                typeWriter(text, i + 1, fnCallback)
            }, CharDelay);
        } else if (typeof fnCallback == 'function') {
            setTimeout(fnCallback, WordPause);
        }
    }
}

export const StartTextAnimation = (dataText: any[], j: number) => {
    if (typeof dataText[j] === 'undefined' || j === dataText.length) {
        setTimeout(function () {
            StartTextAnimation(dataText, WordOffset);
        }, RestartInterval);
    } else if (j < dataText[j].length) {
        typeWriter(dataText[j], 0, function () {
            StartTextAnimation(dataText, (j + 1));
        });
    }
}
