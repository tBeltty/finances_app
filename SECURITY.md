# Security Policy

## Supported Versions

We support security updates for the current major release and the previous minor release.

| Version | Supported          |
| ------- | ------------------ |
| v1.4.x  | :white_check_mark: |
| < 1.4   | :x:                |

## Reporting a Vulnerability

We take the security of our systems seriously.
If you believe you have found a security vulnerability in tBelt Finances, please **DO NOT** open a public issue.

Instead, please report it via email to:
**security@tbelt.online**

Please include:
- A description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact.

We will acknowledge your report within 48 hours and provide an estimated timeline for the fix.

## Security Measures

We employ a defense-in-depth strategy to protect user data, including:
- **Transport Security**: All data is encrypted in transit via HTTPS/TLS.
- **Data Protection**: Sensitive records (such as passwords and tokens) are hashed using industry-standard algorithms (bcrypt, SHA-256).
- **Access Control**: Strict authentication and authorization controls, including 2FA support.
- **Monitoring**: Automated systems specifically designed to detect and mitigate abusive traffic patterns.
- **Compliance**: We adhere to strict data privacy guidelines.

## Best Practices for Users
- Enable 2FA in your account settings.
- Use a strong, unique password.
- Do not share your login credentials.
