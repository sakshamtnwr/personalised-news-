const SENTIMENT_LEXICON = {
    positive: [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 
        'awesome', 'best', 'perfect', 'love', 'loved', 'happy', 'joy',
        'brilliant', 'positive', 'success', 'successful', 'win', 'winner',
        'beautiful', 'incredible', 'outstanding', 'superb', 'terrific',
        'victory', 'celebrate', 'breakthrough', 'triumph', 'achieve', 'achievement'
    ],
    negative: [
        'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'hate',
        'hated', 'sad', 'angry', 'negative', 'fail', 'failure', 'lose',
        'loser', 'ugly', 'disappointing', 'disappointed', 'unfortunate',
        'disaster', 'catastrophe', 'crisis', 'problem', 'issue', 'death',
        'killed', 'attack', 'war', 'conflict', 'threat', 'concern'
    ]
};

function analyzeSentiment(text) {
    if (!text) {
        return { score: 0, label: 'neutral' };
    }

    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\W+/);

    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
        if (SENTIMENT_LEXICON.positive.includes(word)) {
            positiveCount++;
        }
        if (SENTIMENT_LEXICON.negative.includes(word)) {
            negativeCount++;
        }
    });

    const totalWords = words.length;
    const score = (positiveCount - negativeCount) / Math.max(totalWords, 1);
    const normalizedScore = Math.max(-1, Math.min(1, score * 10));

    let label;
    if (normalizedScore >= 0.05) {
        label = 'positive';
    } else if (normalizedScore <= -0.05) {
        label = 'negative';
    } else {
        label = 'neutral';
    }

    return {
        score: parseFloat(normalizedScore.toFixed(3)),
        label: label
    };
}

function extractKeywords(text) {
    if (!text) return [];

    const stopWords = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
        'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
        'it', 'from', 'be', 'are', 'was', 'were', 'been', 'have', 'has',
        'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
        'may', 'might', 'must', 'can', 'said', 'says', 'about', 'into',
        'through', 'during', 'before', 'after', 'above', 'below', 'between'
    ]);

    const words = text.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

    return [...new Set(words)].slice(0, 10);
}