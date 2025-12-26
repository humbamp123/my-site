// Instagram Video Downloader
class InstagramDownloader {
    constructor() {
        this.urlInput = document.getElementById('instagram-url');
        this.downloadBtn = document.getElementById('download-btn');
        this.errorMessage = document.getElementById('error-message');
        this.resultSection = document.getElementById('result-section');
        this.videoPlayer = document.getElementById('video-player');
        this.downloadLink = document.getElementById('download-link');
        this.videoInfoText = document.getElementById('video-info-text');
        this.btnText = document.querySelector('.btn-text');
        this.loader = document.querySelector('.loader');

        this.init();
    }

    init() {
        this.downloadBtn.addEventListener('click', () => this.handleDownload());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleDownload();
            }
        });
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.resultSection.style.display = 'none';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    showLoading() {
        this.downloadBtn.disabled = true;
        this.btnText.textContent = 'Processing...';
        this.loader.style.display = 'inline-block';
    }

    hideLoading() {
        this.downloadBtn.disabled = false;
        this.btnText.textContent = 'Download Video';
        this.loader.style.display = 'none';
    }

    extractShortcode(url) {
        // Extract shortcode from various Instagram URL formats
        const patterns = [
            /instagram\.com\/p\/([^/?]+)/,
            /instagram\.com\/reel\/([^/?]+)/,
            /instagram\.com\/reels\/([^/?]+)/,
            /instagram\.com\/tv\/([^/?]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    async fetchInstagramData(url) {
        const shortcode = this.extractShortcode(url);
        if (!shortcode) {
            throw new Error('Invalid Instagram URL. Please use a valid post, reel, or IGTV URL.');
        }

        // Try multiple methods to fetch Instagram data
        const methods = [
            () => this.fetchWithOEmbedAPI(url),
            () => this.fetchWithEmbedAPI(shortcode),
            () => this.fetchWithDirectURL(url),
            () => this.fetchWithCORSProxy(url, 'https://corsproxy.io/?'),
            () => this.fetchWithCORSProxy(url, 'https://api.codetabs.com/v1/proxy?quest=')
        ];

        let lastError;
        for (const method of methods) {
            try {
                const data = await method();
                if (data) return data;
            } catch (error) {
                lastError = error;
                console.warn('Method failed, trying next:', error);
            }
        }

        throw lastError || new Error('Failed to fetch video data');
    }

    async fetchWithOEmbedAPI(url) {
        try {
            // Instagram's official oEmbed API
            const oembedUrl = `https://graph.facebook.com/v12.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=`;

            // Try without access token first (public endpoint)
            const response = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`);

            if (!response.ok) {
                throw new Error('oEmbed API returned error');
            }

            const data = await response.json();

            // oEmbed returns thumbnail, but we need to extract video from the HTML
            if (data.thumbnail_url) {
                // The oEmbed gives us the post info, now fetch the embed page
                const shortcode = this.extractShortcode(url);
                return await this.fetchWithEmbedAPI(shortcode);
            }

            throw new Error('No video data in oEmbed response');
        } catch (error) {
            throw new Error('oEmbed API method failed');
        }
    }

    async fetchWithEmbedAPI(shortcode) {
        try {
            const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
            const response = await fetch(embedUrl);
            const html = await response.text();

            // Try to extract video URL from embed page
            const videoMatch = html.match(/"video_url":"([^"]+)"/);
            if (videoMatch) {
                const videoUrl = videoMatch[1].replace(/\\u0026/g, '&');
                return { video_url: videoUrl, thumbnail_url: null };
            }

            // Try alternative pattern
            const altMatch = html.match(/videoUrl&quot;:&quot;([^&]+)&quot;/);
            if (altMatch) {
                const videoUrl = altMatch[1].replace(/\\u0026/g, '&');
                return { video_url: videoUrl, thumbnail_url: null };
            }

            throw new Error('No video found in embed');
        } catch (error) {
            throw new Error('Embed API method failed');
        }
    }

    async fetchWithDirectURL(url) {
        try {
            // Try to fetch the page directly and parse JSON data
            const response = await fetch(url);
            const html = await response.text();

            // Instagram embeds JSON data in script tags
            const scriptMatch = html.match(/<script type="application\/ld\+json">({.+?})<\/script>/);
            if (scriptMatch) {
                const data = JSON.parse(scriptMatch[1]);
                if (data.video && data.video.contentUrl) {
                    return {
                        video_url: data.video.contentUrl,
                        thumbnail_url: data.video.thumbnailUrl
                    };
                }
            }

            // Try to find video URL in shared data
            const sharedDataMatch = html.match(/window\._sharedData = ({.+?});<\/script>/);
            if (sharedDataMatch) {
                const sharedData = JSON.parse(sharedDataMatch[1]);
                const media = this.extractMediaFromSharedData(sharedData);
                if (media) return media;
            }

            throw new Error('No video found in page');
        } catch (error) {
            throw new Error('Direct URL method failed');
        }
    }

    async fetchWithCORSProxy(url, proxyBaseUrl) {
        try {
            // Use a CORS proxy as fallback
            const proxyUrl = `${proxyBaseUrl}${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl, {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });

            if (!response.ok) {
                throw new Error(`Proxy returned ${response.status}`);
            }

            const html = await response.text();

            // Try to extract video URL from the proxied content
            const videoMatch = html.match(/"video_url":"([^"]+)"/);
            if (videoMatch) {
                const videoUrl = videoMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
                return { video_url: videoUrl, thumbnail_url: null };
            }

            // Alternative patterns
            const patterns = [
                /"playback_url":"([^"]+)"/,
                /"src":"([^"]+\.mp4[^"]*)"/,
                /videoUrl":"([^"]+)"/,
                /"video_versions":\[{"url":"([^"]+)"/,
                /"contentUrl":"([^"]+\.mp4[^"]*)"/
            ];

            for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match) {
                    const videoUrl = match[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
                    if (videoUrl.includes('.mp4') || videoUrl.includes('video')) {
                        return { video_url: videoUrl, thumbnail_url: null };
                    }
                }
            }

            throw new Error('No video found with CORS proxy');
        } catch (error) {
            throw new Error(`CORS proxy method failed: ${error.message}`);
        }
    }

    extractMediaFromSharedData(sharedData) {
        try {
            const posts = sharedData?.entry_data?.PostPage ||
                         sharedData?.entry_data?.ReelPage ||
                         sharedData?.entry_data?.TVPage;

            if (posts && posts[0]?.graphql?.shortcode_media) {
                const media = posts[0].graphql.shortcode_media;
                if (media.video_url) {
                    return {
                        video_url: media.video_url,
                        thumbnail_url: media.display_url
                    };
                }
            }
        } catch (error) {
            console.error('Error extracting from shared data:', error);
        }
        return null;
    }

    displayVideo(videoData) {
        this.videoPlayer.src = videoData.video_url;
        this.downloadLink.href = videoData.video_url;

        // Try to set a better filename
        const shortcode = this.extractShortcode(this.urlInput.value);
        this.downloadLink.download = `instagram-${shortcode || 'video'}.mp4`;

        this.resultSection.style.display = 'block';
        this.videoInfoText.textContent = 'Video ready! Click the download button below to save it.';

        // Scroll to result
        this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async handleDownload() {
        const url = this.urlInput.value.trim();

        if (!url) {
            this.showError('Please enter an Instagram URL');
            return;
        }

        if (!url.includes('instagram.com')) {
            this.showError('Please enter a valid Instagram URL');
            return;
        }

        this.hideError();
        this.showLoading();

        try {
            const videoData = await this.fetchInstagramData(url);

            if (!videoData || !videoData.video_url) {
                throw new Error('No video found. This might be a photo post or the content is not accessible.');
            }

            this.displayVideo(videoData);
        } catch (error) {
            console.error('Download error:', error);
            this.showError(
                error.message ||
                'Failed to download video. Please make sure the post is public and contains a video. ' +
                'Due to Instagram\'s restrictions, some videos may not be downloadable.'
            );
        } finally {
            this.hideLoading();
        }
    }
}

// Initialize the downloader when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InstagramDownloader();
});
