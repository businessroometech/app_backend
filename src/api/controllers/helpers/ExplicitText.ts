import AWS from 'aws-sdk';

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
});

export const comprehend = new AWS.Comprehend();
export const rekognition = new AWS.Rekognition();

export const flaggedWords = [
    // Sexual content
    ' sex ', ' kill ', ' sexual ', ' porn ', ' pornography ', ' xxx ', ' nude ', ' naked ', ' fuck ', ' fucking ',
    ' shit ', ' asshole ', ' bitch ', ' bastard ', ' dick ', ' cock ', ' pussy ', ' cunt ', ' whore ',
    ' slut ', ' blowjob ', ' handjob ', ' dildo ', ' orgasm ', ' masturbat ', ' erotic ', ' penis ',
    ' vagina ', ' boobs ', ' tits ', ' breasts ', ' anal ', ' rape ', ' raping ', ' pedophile ',

    // Racial slurs and hate speech
    ' nigger ', ' nigga ', ' chink ', ' gook ', ' spic ', ' kike ', ' wetback ', ' retard ', ' fag ',
    ' faggot ', ' dyke ', ' tranny ', ' homo ', ' homosexual ', ' lesbo ', ' queer ', ' shemale ',
    ' white power ', ' black power ', ' hitler ', ' nazi ', ' kkk ', ' klux ', ' supremacist ',

    // Violence and threats
    ' kill ', ' killing ', ' murder ', ' shoot ', ' shooting ', ' gun ', ' bomb ', ' stab ', ' stabbing ',
    ' attack ', ' terrorist ', ' terrorism ', ' suicide ', ' bombing ', ' explosive ', ' assassin ',
    ' hate crime ', ' massacre ', ' genocide ', ' lynch ', ' behead ',
    ' shank ', ' maim ', ' torture ', ' abuse ', ' abusing ',

    // Drugs and illegal substances
    ' drug ', ' drugs ', ' cocaine ', ' heroin ', ' meth ', ' methamphetamine ', ' crack ', ' weed ',
    ' marijuana ', ' pot ', ' hash ', ' lsd ', ' ecstasy ', ' mdma ', ' ketamine ', ' opium ',
    ' oxycontin ', ' percocet ', ' vicodin ', ' xanax ', ' valium ', ' adderall ', ' psychedelic ',
    ' overdose ', ' inject ', ' snort ', ' smoke ', ' dealer ', ' trafficking ',

    // General profanity
    ' damn ', ' hell ', ' crap ', ' douche ', ' jerk ', ' idiot ', ' moron ', ' stupid ', ' suck ',
    ' sucks ', ' sucker ', ' motherfucker ', ' bullshit ', ' piss ', ' pissed ', ' fag ', ' freaking ',
    ' screw ', ' screwed ', ' twat ', ' wanker ', ' bollocks ', ' arse ', ' arsehole ', ' bugger ',
    ' bloody ', ' minge ', ' knob ', ' prick ', ' bellend ', ' nonce ', ' spastic ', ' spaz ',

    // Other offensive terms
    ' fatso ', ' lardass ', ' ugly ', ' retard ', ' midget ', ' dwarf ', ' cripple ', ' gimp ', ' psycho ',
    ' sociopath ', ' schizo ', ' illegal alien ', ' wetback ', ' beaner ', ' ghetto ', ' trailer trash ',
    ' white trash ', ' redneck ', ' hillbilly ', ' incest ', ' bestiality ', ' necrophilia ',

    ' jihad ', ' Jihadi ', ' jihadist ', ' Zihad ', ' Zihadi ', ' Zihadist ', ' jihaad ', ' Jihaadi ', ' jihaadist ', ' Zihaad ', ' Zihaadi ', ' Zihaadist ', ' mujahedeen ', ' fatwa ', ' takfir ', ' shariah law ', ' kafir ', ' infidel ',
    ' caliphate ', ' shaheed ', ' martyrdom ', ' beheading ', ' apostate ', ' ummah uprising ',

    // Names of known radical groups (if needed for detection)
    ' isis ', ' daesh ', ' al-qaeda ', ' taliban ', ' boko haram ', ' al-shabaab ', ' hezbollah ', ' zeehadi ',
    ' Sex ',
    ' Prostitute ',
    ' call girl ',
    ' Milf ',
    ' Sugar Daddy ',
    ' Assalaamu Alaikum ',
    ' As-salamu alaykum ',
    ' salamun alaykum ',
    ' salam alaykum ',
    ' Assalam Vaalekum ',
    ' Kafir ',
    ' Koran ',
    ' Madinah ',
    ' Masjid ',
    ' Mullah ',
    ' Quran ',
    ' Sunny leone ',
    ' Johny sins ',
    ' Hoe ',
    ' Ash-shukrulillah ',
    ' SubhanAllah ',
    ' Allahu Akbar ',
    ' Jazakum Allahu Khayran ',
    ' La hawla wala quwwata illa billah ',
    ' Ameen ',
    ' Amen ',
    ' Yarhamuka Allah ',
    ' Astaghfiru Allah ',
    ' allahu akbar ', ' Molana ', ' Maulana ', ' Palestine ', ' Palestinians ', ' Palestinian ', ' Mulla ', ' Dalla ', ' Khuda ', ' Islam ', ' Allahu Akbar ', ' Agbar ', ' Allah ', ' Maula ', ' Khalistan ', ' Kashmir ', ' zindabad ', ' murdabad ', ' sikhs for justice ', ' Hinduphobia ', ' Islamophobia ', ' sikhs ', ' religion ', ' religious ',
    ' death to infidels ', ' holy war ', ' kuffar must die ', ' shariah for all ', ' convert or die '
];

export const analyzeTextContent = async (content: string): Promise<{
    allowed: boolean;
    reason?: string;
    flaggedWord?: string;
}> => {
    try {
        if (!content.trim()) {
            return { allowed: true };
        }

        // Normalize the content for better matching
        const normalizedContent = ' ' + content.toLowerCase().replace(/[^\w\s]/g, ' ') + ' ';
        
        // Remove spaces from flagged words for matching
        const trimmedFlaggedWords = flaggedWords.map(word => word.trim().toLowerCase());
        
        // Check for whole word matches
        const foundWord = trimmedFlaggedWords.find(word => {
            // Match whole words only using word boundaries
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(content);
        });

        if (foundWord) {
            return { 
                allowed: false, 
                reason: "Inappropriate text detected",
                flaggedWord: foundWord 
            };
        }

        // Rest of your sentiment analysis code...
        const params = {
            TextList: [content],
            LanguageCode: "en"
        };

        const result = await comprehend.batchDetectSentiment(params).promise();
        const sentiment = result.ResultList[0].Sentiment;

        if (sentiment === "NEGATIVE") {
            return { allowed: false, reason: "Negative sentiment detected" };
        }

        return { allowed: true };

    } catch (error) {
        console.error("Error analyzing text content:", error);
        return { allowed: false, reason: "Error checking text content" };
    }
};