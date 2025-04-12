import AWS from 'aws-sdk';
import { Request, Response, NextFunction } from 'express';

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
});

export const comprehend = new AWS.Comprehend();
export const rekognition = new AWS.Rekognition();

export const flaggedWords = [
    // Sexual content
    'sex', 'sexual', 'porn', 'pornography', 'xxx', 'nude', 'naked', 'fuck', 'fucking',
    'shit', 'asshole', 'bitch', 'bastard', 'dick', 'cock', 'pussy', 'cunt', 'whore',
    'slut', 'blowjob', 'handjob', 'dildo', 'orgasm', 'masturbat', 'erotic', 'penis',
    'vagina', 'boobs', 'tits', 'breasts', 'anal', 'rape', 'raping', 'pedophile',

    // Racial slurs and hate speech
    'nigger', 'nigga', 'chink', 'gook', 'spic', 'kike', 'wetback', 'retard', 'fag',
    'faggot', 'dyke', 'tranny', 'homo', 'homosexual', 'lesbo', 'queer', 'shemale',
    'white power', 'black power', 'hitler', 'nazi', 'kkk', 'klux', 'supremacist',

    // Violence and threats
    'kill', 'killing', 'murder', 'shoot', 'shooting', 'gun', 'bomb', 'stab', 'stabbing',
    'attack', 'terrorist', 'terrorism', 'suicide', 'bombing', 'explosive', 'assassin',
    'hate crime', 'massacre', 'genocide', 'lynch', 'execute', 'execution', 'behead',
    'shank', 'threat', 'harm', 'hurt', 'maim', 'torture', 'abuse', 'abusing',

    // Drugs and illegal substances
    'drug', 'drugs', 'cocaine', 'heroin', 'meth', 'methamphetamine', 'crack', 'weed',
    'marijuana', 'pot', 'hash', 'lsd', 'ecstasy', 'mdma', 'ketamine', 'opium',
    'oxycontin', 'percocet', 'vicodin', 'xanax', 'valium', 'adderall', 'psychedelic',
    'overdose', 'inject', 'snort', 'smoke', 'dealer', 'trafficking',

    // General profanity
    'damn', 'hell', 'crap', 'douche', 'jerk', 'idiot', 'moron', 'stupid', 'suck',
    'sucks', 'sucker', 'motherfucker', 'bullshit', 'piss', 'pissed', 'fag', 'freaking',
    'screw', 'screwed', 'twat', 'wanker', 'bollocks', 'arse', 'arsehole', 'bugger',
    'bloody', 'git', 'minge', 'knob', 'prick', 'bellend', 'nonce', 'spastic', 'spaz',

    // Other offensive terms
    'fatso', 'lardass', 'ugly', 'retard', 'midget', 'dwarf', 'cripple', 'gimp', 'psycho',
    'sociopath', 'schizo', 'illegal alien', 'wetback', 'beaner', 'ghetto', 'trailer trash',
    'white trash', 'redneck', 'hillbilly', 'incest', 'bestiality', 'necrophilia',

    'jihad', 'jihadist', 'mujahedeen', 'fatwa', 'takfir', 'shariah law', 'kafir', 'infidel',
    'caliphate', 'shaheed', 'martyrdom', 'beheading', 'apostate', 'ummah uprising',

    // Names of known radical groups (if needed for detection)
    'isis', 'daesh', 'al-qaeda', 'taliban', 'boko haram', 'al-shabaab', 'hezbollah',

    // Phrases sometimes seen in extremist slogans (context matters)
    'death to infidels', 'holy war', 'kuffar must die', 'shariah for all', 'convert or die',
    'allahu akbar'
];

const leetMap: Record<string, string> = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '8': 'b',
    '@': 'a',
    '$': 's',
    '!': 'i'
};

export const analyzeTextContent = async (content: string): Promise<{
    allowed: boolean;
    reason?: string;
}> => {
    try {
        if (!content) {
            return { allowed: false, reason: "Text is required" };
        }

        const normalize = (text: string): string => {
            return text.toLowerCase().split('').map(char => leetMap[char] || char).join('');
        };

        const original = content.toLowerCase();
        const normalized = normalize(original);

        const hasFlaggedWord = flaggedWords.some(word => {
            const pattern = new RegExp(`\\b${word}\\b`, 'i');
            return pattern.test(original) || pattern.test(normalized);
        });

        if (hasFlaggedWord) {
            return { allowed: false, reason: "Explicit or threatening content detected" };
        }

        const params = {
            TextList: [content],
            LanguageCode: "en"
        };

        const result = await comprehend.batchDetectSentiment(params).promise();
        const sentiment = result.ResultList[0].Sentiment;

        if (sentiment === "NEGATIVE") {
            return { allowed: false, reason: "Negative sentiment detected in text" };
        }

        return { allowed: true };
    } catch (error) {
        console.error("Error analyzing text content:", error);
        return { allowed: false, reason: "Error checking text content" };
    }
};
