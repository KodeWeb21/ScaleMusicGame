export const scales = [
  { name: "DO", notes: ["DO", "RE", "MI", "FA", "SOL", "LA", "SI", "DO"] },
  { name: "RE", notes: ["RE", "MI", "FA#", "SOL", "LA", "SI", "DO#", "RE"] },
  { name: "MI", notes: ["MI", "FA#", "SOL#", "LA", "SI", "DO#", "RE#", "MI"] },
  { name: "FA", notes: ["FA", "SOL", "LA", "LA#", "DO", "RE", "MI", "FA"] },
  { name: "SOL", notes: ["SOL", "LA", "SI", "DO", "RE", "MI", "FA#", "SOL"] },
  { name: "LA", notes: ["LA", "SI", "DO#", "RE", "MI", "FA#", "SOL#", "LA"] },
  { name: "SI", notes: ["SI", "DO#", "RE#", "MI", "FA#", "SOL#", "LA#", "SI"] },
  { name: "DO#", notes: ["DO#", "RE#", "FA", "FA#", "SOL#", "LA#", "DO", "DO#"] },
  { name: "RE#", notes: ["RE#", "FA", "SOL", "SOL#", "LA#", "DO", "RE", "RE#"] },
  { name: "FA#", notes: ["FA#", "SOL#", "LA#", "SI", "DO#", "RE#", "FA", "FA#"] },
  { name: "SOL#", notes: ["SOL#", "LA#", "DO", "DO#", "RE#", "FA", "SOL", "SOL#"] },
  { name: "LA#", notes: ["LA#", "DO", "RE", "RE#", "FA", "SOL", "LA", "LA#"] }
];

// Frecuencias base (A4 = 440Hz)
export const noteFrequencies = {
  "DO": 261.63,
  "DO#": 277.18,
  "RE": 293.66,
  "RE#": 311.13,
  "MI": 329.63,
  "FA": 349.23,
  "FA#": 369.99,
  "SOL": 392.00,
  "SOL#": 415.30,
  "LA": 440.00,
  "LA#": 466.16,
  "SI": 493.88
};

// Círculos Armónicos (I, ii, iii, IV, V, vi, vii°)
const chordSuffixes = [" Mayor", " menor", " menor", " Mayor", " Mayor", " menor", " dism"];

export function getHarmonicCircle(scaleNotes) {
  // Solo los primeros 7 grados
  const degrees = scaleNotes.slice(0, 7);
  return degrees.map((note, index) => {
    return {
      degree: ["I", "ii", "iii", "IV", "V", "vi", "vii°"][index],
      chord: note + chordSuffixes[index]
    };
  });
}
