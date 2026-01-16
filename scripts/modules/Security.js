export class SecurityScanner {
    constructor() {
        this.patterns = {
            api_key: /AIzaSy[A-Za-z0-9_-]{33}/g, // Specific Google Cloud API Key pattern
            private_key: /-----BEGIN (RSA|OPENSSH|EC) PRIVATE KEY-----/g,
            slack_token: /xox[baprs]-[0-9]{10,12}-[a-zA-Z0-9]{24,}/g,
            github_token: /gh[pous]_[a-zA-Z0-9]{36,}/g
        };
    }

    scan(content) {
        const matches = [];
        for (const [type, regex] of Object.entries(this.patterns)) {
            if (regex.test(content)) {
                matches.push({ type, line: content });
            }
        }
        return matches;
    }
}

export const Scanner = new SecurityScanner();
