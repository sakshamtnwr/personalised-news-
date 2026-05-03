function subscribeNewsletter() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const frequency = document.querySelector('input[name="frequency"]:checked').value;
    const keywords = document.getElementById('keywords').value.trim();

    if (!name || !email) {
        alert('Please fill in your name and email address.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    const newsTemplate = generateNewsletterTemplate(frequency, keywords);

    const templateParams = {
        to_name: name,
        to_email: email,
        frequency: frequency.charAt(0).toUpperCase() + frequency.slice(1),
        keywords: keywords || 'All Topics',
        news_content: newsTemplate,
        subscription_date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    };

    const submitBtn = event.target;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Subscribing...';
    submitBtn.disabled = true;

    const serviceID = 'service_h9y8tag';
    const templateID = 'template_ro2aqep';

    emailjs.send(serviceID, templateID, templateParams)
        .then((response) => {
            console.log('Newsletter subscription successful:', response);
            document.getElementById('newsletter-success').style.display = 'block';

            document.getElementById('name').value = '';
            document.getElementById('email').value = '';
            document.getElementById('keywords').value = '';
            document.getElementById('daily-digest').checked = true;

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            saveSubscription(name, email, frequency, keywords);

            setTimeout(() => {
                document.getElementById('newsletter-success').style.display = 'none';
            }, 5000);
        })
        .catch((error) => {
            console.error('Newsletter subscription failed:', error);
            alert('Failed to subscribe. Please try again later.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

function generateNewsletterTemplate(frequency, keywords) {
    const articles = enrichedArticles || [];

    if (articles.length === 0) {
        return '<p>No articles available at the moment.</p>';
    }

    let filteredArticles = articles;
    if (keywords) {
        const keywordList = keywords.toLowerCase().split(',').map(k => k.trim());
        filteredArticles = articles.filter(article => {
            const articleText = `${article.title} ${article.description}`.toLowerCase();
            return keywordList.some(keyword => articleText.includes(keyword));
        });
    }

    if (filteredArticles.length === 0) {
        filteredArticles = articles;
    }

    let articleLimit;
    switch(frequency) {
        case 'daily':
            articleLimit = 5;
            break;
        case 'weekly':
            articleLimit = 10;
            break;
        case 'monthly':
            articleLimit = 20;
            break;
        default:
            articleLimit = 5;
    }

    let newsHTML = '<div style="font-family: Arial, sans-serif;">';
    newsHTML += `<h2 style="color: #2294ed;">Your ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} News Digest</h2>`;
    newsHTML += '<hr style="border: 1px solid #ddd; margin: 20px 0;" />';

    filteredArticles.slice(0, articleLimit).forEach((article, index) => {
        const sentiment = article.sentiment ? article.sentiment.label : 'neutral';
        const sentimentColor = sentiment === 'positive' ? '#4CAF50' : 
                               sentiment === 'negative' ? '#f44336' : '#757575';

        newsHTML += `
            <div style="margin-bottom: 30px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #183b56;">${index + 1}. ${article.title}</h3>
                <p style="color: #577592; margin: 10px 0;">
                    <strong>Source:</strong> ${article.source.name} | 
                    <strong>Published:</strong> ${new Date(article.publishedAt).toLocaleDateString()}
                </p>
                <p style="color: #183b56; line-height: 1.6;">${article.description || 'No description available.'}</p>
                <div style="margin-top: 10px;">
                    <span style="background-color: ${sentimentColor}20; color: ${sentimentColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                        ${sentiment.toUpperCase()}
                    </span>
                </div>
                <a href="${article.url}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #2294ed; color: white; text-decoration: none; border-radius: 4px;">
                    Read Full Article →
                </a>
            </div>
        `;
    });

    newsHTML += '</div>';
    return newsHTML;
}

function saveSubscription(name, email, frequency, keywords) {
    const subscription = {
        name: name,
        email: email,
        frequency: frequency,
        keywords: keywords,
        subscribedAt: new Date().toISOString()
    };

    localStorage.setItem('newsletterSubscription', JSON.stringify(subscription));
    console.log('Subscription saved:', subscription);
}

function getSubscription() {
    const saved = localStorage.getItem('newsletterSubscription');
    return saved ? JSON.parse(saved) : null;
}

window.addEventListener('load', () => {
    const subscription = getSubscription();
    if (subscription) {
        console.log('Existing subscription found:', subscription);
    }
});