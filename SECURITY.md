# Security policy

## Supported version

Security fixes are applied to the latest released version.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that could expose imported evidence, local review data or unsafe file handling. Use GitHub's private vulnerability reporting for this repository when available.

Include the affected version, reproduction steps, impact and any safe mitigation you tested. Do not include real credentials, private source evidence or personal data.

## Current boundary

Agent Review Studio is a local-first browser application. It does not provide authentication, a shared server or multi-user locking. Imported files are treated as untrusted, retained as evidence and never executed by the application.
