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
    'white trash', 'redneck', 'hillbilly', 'incest', 'bestiality', 'necrophilia'
];

export const checkExplicitText = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: "Text is required" });

        const lowerContent = content.toLowerCase();
        const hasFlaggedWord = flaggedWords.some(word => lowerContent.includes(word));
        if (hasFlaggedWord) {
            return res.status(400).json({ message: "Explicit or threatening content detected" });
        }

        const params = {
            TextList: [content],
            LanguageCode: "en"
        };

        const result = await comprehend.batchDetectSentiment(params).promise();
        const sentiment = result.ResultList[0].Sentiment;

        if (sentiment === "NEGATIVE") {
            return res.status(400).json({ message: "Negative sentiment detected in text" });
        }

        next();
    } catch (error) {
        console.error("Error in text moderation:", error);
        res.status(500).json({ message: "Error checking text content" });
    }
};

// Middleware to check for explicit images
// export const checkExplicitImage = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//         const params = {
//             Image: { Bytes: req.file.buffer }
//         };

//         const result = await rekognition.detectModerationLabels(params).promise();
//         const hasExplicitContent = result.ModerationLabels.some(label => label.Confidence > 80);

//         if (hasExplicitContent) {
//             return res.status(400).json({ message: "Explicit image detected" });
//         }

//         next();
//     } catch (error) {
//         console.error("Error in image moderation:", error);
//         res.status(500).json({ message: "Error checking image content" });
//     }
// };
