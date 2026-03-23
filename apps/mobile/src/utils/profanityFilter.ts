import leoProfanity from "leo-profanity";

// Load English (default) + French dictionaries
const enDictionary = leoProfanity.getDictionary();
leoProfanity.loadDictionary("fr");
const frDictionary = leoProfanity.getDictionary();
leoProfanity.add(enDictionary);
leoProfanity.add(frDictionary);

// Québécois profanity not covered by the default French dictionary
leoProfanity.add([
    "tabarnak",
    "tabarnac",
    "tabernac",
    "câlice",
    "calice",
    "calisse",
    "crisse",
    "ostie",
    "osti",
    "estie",
    "maudit",
    "maudite",
    "sacrament",
    "ciboire",
    "viarge",
    "batard",
    "bâtard",
    "décâlisse",
    "decalisse",
]);

export function checkProfanity(text: string): {
    hasProfanity: boolean;
    cleanText: string;
} {
    const hasProfanity = leoProfanity.check(text);
    const cleanText = leoProfanity.clean(text);
    return { hasProfanity, cleanText };
}

