const input = querySelector<HTMLInputElement>('input.bpm');
const progress = querySelector<HTMLInputElement>('input.progress');
const select = querySelector<HTMLSelectElement>('select');
const startButton = querySelector<HTMLButtonElement>('button#start');
const stopButton = querySelector<HTMLButtonElement>('button#stop');
const resetButton = querySelector<HTMLButtonElement>('button#reset');

function querySelector<T extends Element = Element>(selector: string) {
    const element = document.querySelector<T>(selector);

    if (!element) {
        throw new Error(`element: "${selector}" is not found`)
    }

    return element;
}

const frequencies = {
    C3: 130.81,     C4: 261.63,
    Db3: 138.59,    Db4: 277.18,
    D3: 146.83,     D4: 293.66,
    Eb3: 155.56,    Eb4: 311.13,
    E3: 164.81,     E4: 329.63,
    F3: 174.61,     F4: 349.23,
    Gb3: 185,       Gb4: 369.99,
    G3: 196,        G4: 392,
    Ab3: 207.65,    Ab4: 415.30,
    A3: 220,        A4: 440,
    Bb3: 233.08,    Bb4: 466.16,
    B3: 246.94,     B4: 493.88
};

function createIterator<T>(array: T[]) {
    let index = 0;

    return {
        next: () => index < array.length ? {
            value: array[index++],
            done: false,
        } : {
            value: array[index],
            done: true,
        },
        getIndex: () => index,
        setIndex: (i: number) => index = i
    };
}

function AudioPlayer() {
    const audioContext = new AudioContext();
    let synthesizer: OscillatorNode;
    let paused = true;
    let bpm = 100;
    let noteList: ReturnType<typeof createIterator<[string, number]>>;
    let waveForm: OscillatorType = 'square';
    let customWave: PeriodicWave;

    function createOscillator() {
        const oscillator = audioContext.createOscillator();

        if (waveForm == 'custom') {
            oscillator.setPeriodicWave(customWave);
        } else {
            oscillator.type = waveForm;
        }

        oscillator.connect(audioContext.destination);

        return oscillator;
    }

    function playNote(name: string, lengthValue: number, delay?: number) {
        if (paused) {
            return;
        }
        synthesizer = createOscillator();
        const startTime = delay ? audioContext.currentTime + delay : audioContext.currentTime;
        const noteLength = 60 / bpm * lengthValue;
        const nextNote = noteList.next();

        progress.value = String(noteList.getIndex());

        if (name == '-') {
            playNote(...nextNote.value, noteLength);
            return;
        }

        synthesizer.frequency.value = frequencies[name];

        synthesizer.start(startTime);

        synthesizer.onended = () => {
            if (!nextNote.done) {
                playNote(...nextNote.value);
            }
        };

        synthesizer.stop(startTime + noteLength);
    }

    return {
        init: (notes: [string, number][]) => {
            progress.value = "0";
            progress.max = String(notes.length);

            noteList = createIterator(notes);
        },
        start: () => {
            const note = noteList.next();

            if (!note.done) {
                paused = false;
                playNote(...note.value);
            }
        },
        stop: () => {
            paused = true;
            synthesizer.stop();
        },
        setIndex: (value) => {
            noteList.setIndex(value);
        },
        setBpm: (value: number) => {
            bpm = value;
        },
        setWaveForm: (value: OscillatorType) => {
            waveForm = value;

            if (value == 'custom') {
                const imag = new Float32Array([0, 0, 1, 0, 1]);   // sine
                const real = new Float32Array(imag.length);  // cos
                customWave = audioContext.createPeriodicWave(real, imag);  // cos,sine
            }
        }
    };
}

const audioPlayer = AudioPlayer();

const song: [string, number][] = [
    ['G3', 1], ['G3', 1], ['G3', 1], ['Eb3', 3/4], ['Bb3', 1/4],
    ['G3', 1], ['Eb3', 3/4], ['Bb3', 1/4], ['G3', 2],
    ['D4', 1], ['D4', 1], ['D4', 1], ['Eb4', 3/4], ['Bb3', 1/4],
    ['Gb3', 1], ['Eb3', 3/4], ['Bb3', 1/4], ['G3', 2],
    ['G4', 1], ['G3', 3/4], ['G3', 1/4], ['G4', 1], ['Gb4', 3/4], ['F4', 1/4],
    ['E4', 1/4], ['Eb4', 1/4], ['E4', 1/2], ['-', 1/2], ['Ab3', 1/2], ['Db4', 1], ['C4', 3/4], ['B3', 1/4],
    ['Bb3', 1/4], ['A3', 1/4], ['Bb3', 1/2], ['-', 1/2], ['Eb3', 1/2], ['Gb3', 1], ['Eb3', 3/4], ['Gb3', 1/4],
    ['Bb3', 1], ['G3', 3/4], ['Bb3', 1/4], ['D4', 2],
    ['G4', 1], ['G3', 3/4], ['G3', 1/4], ['G4', 1], ['Gb4', 3/4], ['F4', 1/4],
    ['E4', 1/4], ['Eb4', 1/4], ['E4', 1/2], ['-', 1/2], ['Ab3', 1/2], ['Db4', 1], ['C4', 3/4], ['B3', 1/4],
    ['Bb3', 1/4], ['A3', 1/4], ['Bb3', 1/2], ['-', 1/2], ['Eb3', 1/2], ['Gb3', 1], ['Eb3', 3/4], ['Bb3', 1/4],
    ['G3', 1], ['Eb3', 3/4], ['Bb3', 1/4], ['G3', 2],
];

audioPlayer.init(song);

startButton.addEventListener('click', () => audioPlayer.start());

stopButton.addEventListener('click', () => audioPlayer.stop());

resetButton.addEventListener('click', () => audioPlayer.init(song));

input.addEventListener('change', ({ currentTarget }) => {
    const value = Number((currentTarget as HTMLInputElement).value);

    if (Number(input.min) <= value && value <= Number(input.max)) {
        audioPlayer.setBpm(value);
    }
});

progress.addEventListener('change', ({ currentTarget }) => {
    audioPlayer.setIndex((currentTarget as HTMLInputElement).value);
});

select.addEventListener('change', ({ currentTarget }) => {
    audioPlayer.setWaveForm((currentTarget as HTMLInputElement).value as OscillatorType);
});
