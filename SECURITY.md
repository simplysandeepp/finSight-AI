# Security Policy

## Supported Versions

FinSight AI currently maintains security fixes for actively developed versions only.

| Version | Supported |
| ------- | --------- |
| 2.x     | :white_check_mark: |
| 1.x     | :warning: Best effort only |
| < 1.0   | :x: |

## Reporting a Vulnerability

If you discover a security vulnerability in FinSight AI, please report it privately.

1. Do not create a public GitHub issue.
2. Use GitHub Private Vulnerability Reporting for this repository:
	https://github.com/simplysandeepp/finSight-AI/security/advisories/new
3. Include as much detail as possible:
	- Affected component (for example: FastAPI routes, auth/JWT flow, data source integrations, frontend input handling)
	- Reproduction steps or proof of concept
	- Expected vs actual behavior
	- Potential impact
	- Suggested fix, if available

### What to Expect After Reporting

- Acknowledgement within 72 hours
- Initial triage within 7 days
- Status updates at least every 7 days until resolution

If the report is accepted, a fix will be developed and released according to severity:

- Critical: target fix within 30 days
- High: target fix within 60 days
- Medium/Low: target fix within 90 days or next scheduled release

If the report is declined, maintainers will provide a short rationale.

We appreciate responsible disclosure and will credit reporters (if desired) once a fix is released.
